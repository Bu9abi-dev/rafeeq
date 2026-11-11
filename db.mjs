// Tiny JSON-file store for the demo: cases (each conversation topic) and the
// vet-approved knowledge base the assistant learns from.
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const DIR = join(fileURLToPath(new URL(".", import.meta.url)), "data");
const FILE = join(DIR, "db.json");
// On Vercel the disk is read-only, so use Upstash Redis (REST) when its env vars exist; locally use a JSON file.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "rafeeq:db";

let db = { cases: [], knowledge: [] };

// shortcut: whole DB is one JSON value, last write wins; fine for a booth demo, move to per-case keys if many vets write at once.
export async function load() {
  try {
    if (REDIS_URL) {
      const r = await fetch(`${REDIS_URL}/get/${KEY}`, { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } });
      const { result } = await r.json();
      db = { cases: [], knowledge: [], ...(result ? JSON.parse(result) : {}) };
    } else if (existsSync(FILE)) {
      db = { cases: [], knowledge: [], ...JSON.parse(readFileSync(FILE, "utf8")) };
    }
  } catch (e) { console.error("Could not load data:", e.message); }
}

async function save() {
  if (REDIS_URL) {
    const r = await fetch(`${REDIS_URL}/set/${KEY}`, { method: "POST", headers: { Authorization: `Bearer ${REDIS_TOKEN}` }, body: JSON.stringify(db) });
    if (!r.ok) throw new Error("Redis save failed: " + r.status);
    return;
  }
  mkdirSync(DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  writeFileSync(tmp, JSON.stringify(db, null, 2));
  renameSync(tmp, FILE);
}

const now = () => new Date().toISOString();
const shortCode = () => String(Math.floor(1000 + Math.random() * 9000));

// status: "auto" = AI answered from approved knowledge, "pending" = waiting for vet, "answered" = vet replied
export async function upsertCase({ sessionId, record, transcript }) {
  if (!sessionId || !record?.practice_id) return null;
  let c = db.cases.find((x) => x.session_id === sessionId && x.practice_id === record.practice_id);
  const wantsVet = record.referral_needed !== false || !record.answered_from_kb || record.urgent_welfare_flag === true;
  if (!c) {
    c = { id: randomUUID(), code: shortCode(), session_id: sessionId, practice_id: record.practice_id, created_at: now(), status: wantsVet ? "pending" : "auto" };
    db.cases.push(c);
  } else if (c.status !== "answered") {
    // a KB-answered case becomes a referral if the AI later decides it needs the vet (never the other way round)
    if (wantsVet) c.status = "pending";
  }
  c.record = { ...c.record, ...record };
  c.transcript = transcript.slice(-12);
  c.updated_at = now();
  await save();
  return c;
}

// Draft knowledge entries (seed/*.json, status "pending_review") appear in the vet inbox
// as cases with the draft answer prefilled. Nothing reaches the knowledge base until the vet approves.
export async function importSeeds() {
  const dir = join(DIR, "..", "seed");
  if (!existsSync(dir)) return 0;
  let added = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    let list;
    try { list = JSON.parse(readFileSync(join(dir, f), "utf8")); } catch (e) { console.error("Bad seed file", f, e.message); continue; }
    for (const e of Array.isArray(list) ? list : list.entries || []) {
      if (!e?.id || e.status === "approved" || db.cases.some((c) => c.seed_id === e.id)) continue;
      db.cases.push({
        id: randomUUID(), code: "S" + shortCode(), session_id: "seed", seed_id: e.id, practice_id: e.id, source: "seed:" + f,
        status: "pending", created_at: now(), updated_at: now(), transcript: [],
        record: {
          ...e, category: e.final_category, confidence: null, ai_advice: e.vet_answer, suggested_answer: e.vet_answer,
          rationale: [e.signs && "Signs: " + JSON.stringify(e.signs), e.stabilize && "Stabilize: " + JSON.stringify(e.stabilize), e.definitive_treatment && "Treatment: " + JSON.stringify(e.definitive_treatment), e.empiric_medicines && "Medicines (vet only): " + JSON.stringify(e.empiric_medicines), e.red_flags && "Red flags: " + JSON.stringify(e.red_flags), e.sources && "Sources: " + JSON.stringify(e.sources)].filter(Boolean).join("\n"),
        },
      });
      added++;
    }
  }
  if (added) await save();
  return added;
}

export function listCases() {
  return [...db.cases].sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1) || b.updated_at.localeCompare(a.updated_at));
}

export function casesForSession(sessionId) {
  return db.cases.filter((c) => c.session_id === sessionId).map(({ transcript, session_id, ...rest }) => rest);
}

export async function answerCase(id, { final_category, vet_answer, vet_name, add_to_knowledge = false }) {
  const c = db.cases.find((x) => x.id === id);
  if (!c) return null;
  c.status = "answered";
  c.vet = { final_category, vet_answer, vet_name: vet_name || "Vet", ai_category: c.record?.category, agreed_with_ai: final_category === c.record?.category, answered_at: now() };
  if (add_to_knowledge) {
    const r = c.record || {};
    const entry = {
      id: "kb-" + (db.knowledge.length + 1) + "-" + r.practice_id,
      domain: r.domain, species: r.species, practice_name: r.practice_name, practice_name_en: r.practice_name_en,
      practice_type: r.practice_type, description: r.description, substances: r.substances,
      final_category, vet_answer, source_case: c.id, approved_by: c.vet.vet_name, approved_at: c.vet.answered_at,
    };
    db.knowledge = db.knowledge.filter((k) => k.source_case !== c.id);
    db.knowledge.push(entry);
    c.knowledge_id = entry.id;
  }
  await save();
  return c;
}

export function listKnowledge() { return db.knowledge; }
export async function deleteKnowledge(id) { const n = db.knowledge.length; db.knowledge = db.knowledge.filter((k) => k.id !== id); await save(); return n !== db.knowledge.length; }

export function stats() {
  const real = db.cases.filter((c) => c.session_id !== "seed");
  const total = real.length;
  const auto = real.filter((c) => c.status === "auto").length;
  const answered = real.filter((c) => c.status === "answered");
  const agreed = answered.filter((c) => c.vet?.agreed_with_ai).length;
  // independence over time: share of AI-only answers in each block of 10 cases
  const sorted = [...real].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const trend = [];
  for (let i = 0; i < sorted.length; i += 10) {
    const block = sorted.slice(i, i + 10);
    trend.push(Math.round((100 * block.filter((c) => c.status === "auto").length) / block.length));
  }
  return {
    total, auto, pending: db.cases.filter((c) => c.status === "pending").length, seeds_pending: db.cases.filter((c) => c.session_id === "seed" && c.status === "pending").length, answered: answered.length,
    knowledge: db.knowledge.length,
    independence_pct: total ? Math.round((100 * auto) / total) : 0,
    ai_vet_agreement_pct: answered.length ? Math.round((100 * agreed) / answered.length) : null,
    trend,
  };
}
