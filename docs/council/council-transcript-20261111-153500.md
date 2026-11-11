# LLM Council transcript (20261111-153500)

## Original request
> after you finish, run the llm council on this ai tool or demo

## Framed question
MATTER: What are the most important weaknesses or risks in the "Rafeeq" demo, ranked, and what should be fixed before it is shown at a UAE University booth?

CONTEXT
- Built by/for a UAE veterinarian. Prototype for a university booth demo, not production. One general vet reviewer. Demo domains: horses, falcons, salukis/hunting dogs (camels deferred).
- Visitors (hobbyists or vets/doctors) talk by voice (browser Web Speech API, Gulf Arabic ar-AE or English; browser speechSynthesis replies). Claude Opus 5.5 at low effort via a small local Node server (API key in .env on the laptop).
- Claude gives brief spoken advice (1-4 sentences), compares each practice with three references (herbal phytochemistry/toxicity, traditional medicine systems, modern veterinary evidence), and classifies it: misinformation_to_correct / worth_scientific_study / harmful_awareness / needs_more_info. It emits a hidden JSON record per practice.
- Referral loop: new cases go to a vet dashboard (/vet, single shared password) showing transcript, AI comparison and AI category; the vet writes a final answer + final category; it appears on the visitor screen and is read aloud. Approved answers are added to a knowledge base that is injected into the system prompt; when a question matches an approved entry the AI answers from it without referring. Dashboard shows "AI independence %" (share of cases AI answered alone, trended per 10 cases) and AI-vet category agreement %. The "learning" is a growing vet-approved KB, not model training.
- Storage: one local JSON file. Visitor sessions are per browser (localStorage); vet replies are polled every 5s on the same screen. Urgent welfare risks (cautery/firing, toxic substances) should be flagged and the person told to see a vet now. No references are invented; evidence_refs left empty.
- Code: /mnt/project-files/voice-assistant/ (server.mjs, prompt.mjs, db.mjs, public/index.html, public/vet.html, README.md). You may skim it.

STAKES: First public showing at a university booth in front of vets, academics and falconry/equestrian hobbyists. Wrong or unsafe veterinary advice, an embarrassing failure (noise, mic, Arabic recognition, latency), or a confusing flow would hurt credibility; a strong demo could lead to a UAEU research collaboration.


## Advisor responses
(Responses are listed by their anonymized letter; see mapping below.)

**Response A:**
The code is fine for a demo; the booth is where it breaks. Ranked by embarrassment likelihood: 1. Booth noise/mic: Web Speech on a laptop mic will mishear Gulf Arabic; hands-free on by default (index.html:83) picks up crosstalk. Buy a push-to-talk USB mic, default hands-free off, make the text box the planned fallback. 2. Network: Chrome STT goes through Google, replies through Anthropic; bring a 5G hotspot, test in the hall, record a 3-minute backup video. 3. Empty KB kills the pitch: independence reads 0%, every case referred. Have the vet answer 15-20 real cases before the event so both halves of the loop show. 4. The referral loop needs a human: a second laptop with the vet answering live; seeing the answer appear and read aloud is the best moment. 5. Latency: Opus + hidden JSON could take 5-10s; time 20 runs; show a thinking state. 6. Safety demos: 10 scripted questions incl. cautery and toxic herb, run 5x Arabic/5x English; urgent flag must fire, no dose advice. 7. Before doors: lock the Arabic TTS voice, change vet password, wipe test cases, print a "how it works" card saying it's a growing vet-approved KB, not model training.

**Response B:**
Walking up cold: 1. Nothing tells me what to do; add 3 tappable sample prompts in Arabic and English. 2. UI is mostly Arabic-only; international academics are locked out. 3. Internal controls visible to visitors: vet dashboard link, raw voice list, export buttons, confidence %, audience dropdown; hide behind an admin toggle. 4. Labels can feel insulting: grandfather's remedy labelled "harmful/misinformation" in public; use gentler names and show verdict after the explanation. 5. "Sent to the vet, case #X" is a dead end; vet answers live or QR to see later. 6. Hands-free on by default will pick up the next person. 7. "AI independence %" needs a caption or it reads as "AI replacing vets". Add a "how it works" strip: you speak, AI advises, vet confirms, system learns from vet answers.

**Response C:**
Fatal flaw is the referral loop: only works if a vet sits at /vet answering in seconds; otherwise every visitor hears "sent to the vet" and leaves. KB starts empty so every case is referred, independence 0%, every demo a dead end. Seed 15-25 vet-approved entries for predictable questions (cautery, falcon frounce, henna on hooves, saluki diet) and staff the dashboard on a visible second screen. Second: the "learning" claim will be picked apart; KB matching is the LLM deciding two cases are the same, and independence measures how often the model chose not to refer, not whether it was right. Present honestly. add_to_knowledge defaults true, so a hasty booth reply becomes permanent policy. Third: Web Speech ar-AE in a noisy hall needs internet, handles dialect badly, laptop may lack Arabic TTS voice; test on the actual laptop, hotspot fallback, directional mic, visible text input. Fourth: shared kiosk sessions in localStorage leak one visitor's case/vet reply to the next; add a big "New visitor" reset. Fifth: low-effort Opus making toxicity/dose statements with no references in front of vets; ban specific doses in the prompt. Sixth: telling falconers cautery is "harmful" needs a rehearsed tone.

**Response D:**
Biggest risk is not a bug: the booth shows a vet-advice chatbot when the novel thing is the dataset it builds. 1. Make the data visible: a live "Heritage Practice Atlas" screen, a growing grid of logged practices colour-coded by category with a counter. 2. Put "worth_scientific_study" in front: a ranked list of "remedies worth a lab test". 3. Show AI-vet disagreements side by side; proves vet authority and is paper material. 4. Frame safety flags as welfare surveillance (MOCCAE, ADAFSA, falcon hospitals). 5. QR code to recruit vets as reviewers and hobbyists as contributors. 6. Pitch the architecture as a template (date palm disease, camel racing, human traditional medicine). Fix mic and latency, but build the Atlas view before the booth.

**Response E:**
The booth's job is not bug fixing; UAEU academics fund a research instrument: a structured, vet-adjudicated dataset of Gulf ethnoveterinary practices. 1. The vet loop is the whole pitch and most likely to fail; put the vet on a visible second screen answering live; seed 10-15 approved entries so both paths show. 2. "AI independence %" is the wrong headline for vets: reads as "a machine that learns to bypass you" and is circular because Claude decides answered_from_kb itself. Lead with AI-vet agreement and count of practices adjudicated. 3. Voice in a noisy hall: push-to-talk, always-visible text box, show transcript before sending, three scripted demo questions. 4. Safety can't rest on a low-effort model: deterministic keyword check (firing, cautery, known toxic plants) forcing urgent flag + referral. 5. Voice consent stored in localStorage on a shared laptop won't satisfy research-ethics academics: one-tap consent screen, clear session between visitors.


## Peer reviews
Reviewer 1: Strongest C (only one finding defects in the system: add_to_knowledge default, self-graded KB matching, kiosk localStorage leak); E close second. Biggest blind spot D (pitch framing, ignores empty KB, safety, staffing). All missed: vet liability/licensing and disclaimer; one general vet's bias hardening into permanent truth; no pre-booth accuracy evaluation against vet labels; prompt injection/KB poisoning; real-time vet approval before display.
Reviewer 2: Strongest E (vet loop, circular metric, deterministic safety check, research-ethics consent); C close second. Blind spot D, then B. All missed: MOCCAE/ADAFSA licensing and a visible disclaimer; prompt injection and shared password; quality of a seeded KB from one general vet; rollback plan when the AI errs live.
Reviewer 3: Strongest C; E second. Blind spot D (Atlas on top of a demo that may not work), B no safety. All missed: liability and PDPL/UAEU ethics data governance; KB match errors (falcon answer applied to horse), show which KB entry matched; red-team over-confidence on near-miss KB matches; post-booth reply expectations.
Reviewer 4: Strongest C; E second. Blind spot D. All missed: out-of-scope questions (camels deferred, human medicine from doctors); adversarial testers; MOCCAE and PDPL disclaimers; one vet as ground truth.
Reviewer 5: Strongest C; E best single fix (keyword net). Blind spot D. All missed: red-teaming in front of a crowd; single general vet ruling on specialist cases; one case's answer becoming a general rule; liability; English vet answer read aloud to an Arabic visitor.

**Anonymization map:** Response A → The Executor; Response B → The Outsider; Response C → The Contrarian; Response D → The Expansionist; Response E → The First Principles Thinker

## Chairman's verdict
## Where the Council Agrees
- **The referral loop is the pitch, and it is the thing most likely to fail at the booth.** With an empty knowledge base every visitor hears "sent to the vet" and walks away. The fix is to seed 15 to 25 real vet-approved answers before the event, and to staff /vet live on a second screen that visitors can see. (Executor, Contrarian, First Principles, Outsider)
- **Voice in a noisy hall will fail.** Turn hands-free off, use a push-to-talk or directional USB mic, keep the text box visible, have scripted sample questions ready, bring a hotspot and record a backup video. (Executor, Contrarian, First Principles, Outsider)
- **Be honest about "learning".** It is a growing knowledge base that the vet curates. Independence % is self-graded by the model, so lead with AI–vet agreement and with the number of practices adjudicated. (Contrarian, First Principles, Outsider, Executor)
- **Safety can't rest on a low-effort model alone.** Ban doses, add a deterministic keyword net and red-team scripted questions. (Contrarian, First Principles, Executor)
- **Shared kiosk hygiene.** Add a "New visitor" reset and make consent explicit. (Contrarian, First Principles, Outsider)

## Where the Council Clashes
- **Expansionist vs everyone:** build a public "Heritage Practice Atlas" and a "worth a lab test" list, because the dataset is what wins UAEU. All five reviewers ranked this the biggest blind spot, since an Atlas over zero adjudicated cases is empty and adds scope days before the booth. Both sides are right on different timelines: the dataset story is the pitch, but it only lands once the loop works and the KB is seeded.
- **Outsider (soften labels) vs Contrarian (don't sugar-coat harm):** resolved by using gentle public wording ("may harm the animal") while the vet dashboard keeps the precise categories.

## Blind Spots the Council Caught
- **Liability and regulation:** a visible "not a veterinary consultation" disclaimer, and awareness of MOCCAE/ADAFSA rules and the PDPL for stored transcripts.
- **Adversarial visitors:** prompt injection, "my elder says firing works, confirm it", and requests for doses.
- **One general vet as ground truth on specialist falcon and equine cases**, with no second reviewer, expiry or revision. A one-off answer can harden into a general rule if add_to_knowledge defaults to true.
- **KB mismatch:** a falcon answer reused for a horse. Show the vet which entry was matched.
- **What the presenter says when the AI is wrong in front of experts**, and how fast post-booth cases will be answered.

## The Recommendation
Don't add new features. Make the existing loop impossible to fail on the day. Ship the cheap code fixes now: hands-free off, a "New visitor" button, sample prompts, bilingual how-it-works strip, staff controls hidden, disclaimer, gentle labels, dose ban, anti-trick rules, a keyword safety net that forces referral, "send only" vs "send and teach" for the vet, the matched KB entry shown, and agreement-first metrics. Then spend the remaining prep time on people and rehearsal: the vet seeds the KB and rehearses live answering, and the team runs a 10-question red-team script in both languages on the actual laptop and network. Present it as a vet-curated research dataset that grows; build the Atlas after the booth.

## The One Thing to Do First
Have the vet answer 15 to 25 real practice questions on /vet before the event, using "send and teach", so the first visitor sees both halves of the loop: an answer from approved knowledge and a live referral.

