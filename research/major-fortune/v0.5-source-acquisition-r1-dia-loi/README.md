# Major Fortune V0.5 — Source Acquisition Round 1A: Địa Lợi

This directory contains the first source acquisition round for Major Fortune V0.5. It specifically isolates and addresses the provenance and doctrine gaps related to the **Địa Lợi** pillar, covering:

1. **`principal-star-dignity`**: Nam Phái and Trung Châu treatment of miếu/vượng/đắc/bình/hãm, especially as applied to transit contexts (Đại Vận).
2. **`vcd-opposite-palace-borrowing`**: The mechanism by which Vô Chính Diệu (empty palaces) borrow stars from the opposite palace.

## Architecture & Integration

This is a **research-only** acquisition pack. It strictly acquires and structures evidence without mutating the production runtime, scoring behaviour, or Calculation Core logic. It adheres to the V0.5 strict separation of constraints:

- **Sources**: Explicit Nam Phái (`EXT-NP-*`) and Trung Châu (`EXT-TC-*`) classical texts and school manuals are registered.
- **Claims**: Atomic propositions are declared, distinguishing generic dignity, transit dignity, and borrowing logic.
- **Handoff**: The generated `queue/claim-adjudication-handoff.json` is consumed by the V0.5 Evidence Gap Foundation to decrease the open source and claim acquisition queues, transitioning the gaps to the `MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN` state. (Because adjudication and calculation core implementations remain incomplete, the final candidate design is still blocked).

## Commands

- `npm run research:major-fortune-v05-acq-dia-loi:generate` — Generates matrices, handoff queues, and reports.
- `npm run research:major-fortune-v05-acq-dia-loi:validate` — Strictly validates the integrity, sorting, and reference validity of the acquisition registries.
- `npm run research:major-fortune-v05-acq-dia-loi:determinism` — Ensures deterministic generation of the acquisition pack files.
- `npm run research:major-fortune-v05-acq-dia-loi:all` — Runs the full suite of generation, validation, testing, and determinism.
