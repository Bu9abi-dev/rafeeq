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
