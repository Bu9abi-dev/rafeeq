// Rafeeq API: streams Claude replies, stores cases, keeps the vet-approved knowledge base.
// Used by server.mjs locally and by api/*.js on Vercel. The API key stays server-side.
import { timingSafeEqual } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, knowledgeBlock, settingsNote } from "./prompt.mjs";
import * as db from "./db.mjs";

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const VET_PASSWORD = process.env.VET_PASSWORD || "";

export const keyMissing = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes("xxxx");
if (!VET_PASSWORD) console.warn("  Warning: VET_PASSWORD is not set in .env, so the vet dashboard is locked.");
const client = new Anthropic(); // reads ANTHROPIC_API_KEY



async function readBody(req) {
  // Vercel's Node runtime pre-parses JSON bodies into req.body; the local server does not.
  if (req.body !== undefined) return typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 2_000_000) throw new Error("body too large");
  }
  return JSON.parse(data || "{}");
}
const json = (res, code, obj) => res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify(obj));

function isVet(req) {
  const given = Buffer.from(String(req.headers["x-vet-password"] || ""));
  const real = Buffer.from(VET_PASSWORD);
  return VET_PASSWORD && given.length === real.length && timingSafeEqual(given, real);
}

// Deterministic safety net: these words force an urgent flag and a vet referral,
// whatever the model decided. Extend the list with the vet.
const URGENT_PATTERNS = [
  /(^|[\s،.؟?!])(ال|و|ب)?(كي|كوي|نكوي|يكوي|اكوي|وسم|نوسم|يوسم|ميسم|مياسم)([\s،.؟?!]|$)/, /\b(firing|fire[- ]?d|cauter\w*|branding|hot iron)\b/i,
  /حرمل|peganum|harmal/i, /دفلة|دفلى|oleander|nerium/i, /عشار|calotropis/i, /تبغ|دخان للصقر|nicotine|tobacco/i,
  /رصاص|lead shot|lead poisoning/i, /سم الفئران|rat poison|rodenticide/i, /بنزين|كيروسين|kerosene|petrol|diesel|ديزل/i,
  /ضربة شمس|heat ?stroke/i, /ما يتنفس|not breathing|نزيف|bleeding heavily|convuls|تشنج/i,
];
const isUrgentText = (t) => URGENT_PATTERNS.some((re) => re.test(t));

function parseRecords(text) {
  const out = [];
  for (const m of text.matchAll(/<record>([\s\S]*?)<\/record>/g)) {
    try { out.push(JSON.parse(m[1].trim().replace(/^```(json)?|```$/g, ""))); } catch { /* ignore malformed */ }
  }
  return out;
}

async function handleChat(req, res) {
  let body;
  try { body = await readBody(req); } catch { res.writeHead(400).end("bad request"); return; }

  const messages = (body.messages || [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-40);
  if (!messages.length || messages.at(-1).role !== "user") { res.writeHead(400).end("last message must be from user"); return; }
  const sessionId = String(body.sessionId || "").slice(0, 64);

  // Stable prompt first, then the knowledge base (cached until the vet approves something new), then per-request settings.
  const system = [
    { type: "text", text: SYSTEM_PROMPT },
    { type: "text", text: knowledgeBlock(db.listKnowledge()), cache_control: { type: "ephemeral" } },
  ];
  const note = settingsNote(body.settings || {});
  if (note) system.push({ type: "text", text: note });

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" });

  let full = "";
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: process.env.RAFEEQ_EFFORT || "low" }, // low = faster replies for voice
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // if a safety filter declines, the API retries on a fallback model
      system,
      messages,
    });
    stream.on("text", (t) => { full += t; res.write(t); });
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") res.write("\n[Sorry, I can't help with that one.]");
  } catch (err) {
    console.error("Claude API error:", err?.status, err?.message);
    const msg = err?.status === 401 ? "API key is invalid. Check .env."
      : err?.status === 429 ? "Rate limited or out of credit. Check console.anthropic.com billing."
      : "Error contacting Claude: " + (err?.message || "unknown");
    res.end(`\n[ERROR] ${msg}`);
    return;
  }

  // Save each practice discussed as a case (pending for the vet, or auto-answered from approved knowledge).
  const transcript = [...messages, { role: "assistant", content: full }].map((m) => ({ role: m.role, text: m.content.split("<record>")[0].trim() }));
  const lastUser = messages.at(-1).content;
  const recs = parseRecords(full).map((r) => {
    if (isUrgentText(lastUser) || isUrgentText(JSON.stringify(r.substances || "") + " " + (r.description || ""))) {
      r.urgent_welfare_flag = true; r.referral_needed = true; r.safety_net = "keyword";
    }
    return r;
  });
  if (!recs.length && isUrgentText(lastUser)) {
    recs.push({ practice_id: "urgent-unclassified", practice_name: lastUser.slice(0, 60), description: lastUser, category: "needs_more_info", urgent_welfare_flag: true, referral_needed: true, safety_net: "keyword" });
  }
  const saved = []; for (const r of recs) { const c = await db.upsertCase({ sessionId, record: r, transcript }); if (c) saved.push(c); }
  if (saved.length) res.write(`\n<cases>${JSON.stringify(saved.map((c) => ({ id: c.id, code: c.code, status: c.status, practice_id: c.practice_id })))}</cases>`);
  res.end();
}

// Entry point for every /api/* request (local server and Vercel functions).
export default async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  try {
    if (keyMissing) return json(res, 500, { error: "ANTHROPIC_API_KEY is not set on the server." });
    await db.load();
    const seeded = await db.importSeeds();
    if (seeded) console.log(`Imported ${seeded} draft answers from seed/ into the vet inbox.`);
    return await handleApi(req, res, url);
  } catch (e) { console.error(e); if (!res.headersSent) json(res, 500, { error: "server error" }); else res.end(); }
}

async function handleApi(req, res, url) {
  const p = url.pathname;
  if (req.method === "POST" && p === "/api/chat") return handleChat(req, res);
  if (req.method === "GET" && p === "/api/my-cases") return json(res, 200, db.casesForSession(url.searchParams.get("session") || ""));

  // ---- vet only ----
  if (!p.startsWith("/api/vet/")) return json(res, 404, { error: "not found" });
  if (!isVet(req)) return json(res, 401, { error: "wrong password" });
  if (req.method === "GET" && p === "/api/vet/cases") return json(res, 200, db.listCases());
  if (req.method === "GET" && p === "/api/vet/knowledge") return json(res, 200, db.listKnowledge());
  if (req.method === "GET" && p === "/api/vet/stats") return json(res, 200, db.stats());
  if (req.method === "POST" && p === "/api/vet/answer") {
    const b = await readBody(req).catch(() => ({}));
    if (!b.id || !b.final_category || !String(b.vet_answer || "").trim()) return json(res, 400, { error: "id, final_category and vet_answer are required" });
    const c = await db.answerCase(b.id, b);
    return c ? json(res, 200, c) : json(res, 404, { error: "case not found" });
  }
  if (req.method === "POST" && p === "/api/vet/knowledge/delete") {
    const b = await readBody(req).catch(() => ({}));
    return json(res, 200, { deleted: await db.deleteKnowledge(b.id) });
  }
  return json(res, 404, { error: "not found" });
}

