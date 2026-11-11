---
inclusion: always
---

# AI and Identification Reliability

- AI output is untrusted evidence, never authoritative record metadata.
- Request only visible clues: artist, title, label, catalogue number, barcode, year text, format text, and matrix text.
- Validate structured model output. Reject unexpected fields and bound every text value.
- Search a structured metadata provider with extracted clues before showing a release candidate.
- Never infer a pressing from cover artwork alone when editions share art.
- Preserve the uploaded image separately from extracted clues and preserve original clue text before normalization.
- Matching is deterministic and explainable. Strong exact identifiers outrank contextual similarity.
- Strong identifier conflicts prevent a high-confidence label.
- Missing metadata stays missing. Never complete tracks, dates, countries, identifiers, or prices from general model knowledge.
- Always let the user correct evidence, reject candidates, choose a different edition, or create a manual record.
- If a vision provider is absent or fails, say so and keep barcode, runout, and text workflows available.
- Do not log full model prompts, images, secrets, personal notes, or raw provider error bodies.
