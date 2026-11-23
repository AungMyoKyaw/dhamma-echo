# Master design rebuild

Scope: the editable master `dhamma-echo-review.figcraft` and its preview exports. This is a design proposal, not a change to the running Svelte application or root design-token contract.

## Product truth

Dhamma Echo is a private desktop library for long Dhamma listening sessions. Preserve Home, Explore, teachers, collections, downloads, favorites, history, queue, audio/video, settings, keyboard navigation and Myanmar. The minimum window is 860×620. Catalogue data is bundled and read-only; media streams from Dhamma Download. MP3/MP4 are playable; WMA/WMV remain searchable but unplayable. No accounts, telemetry, fake teacher portraits, biographies or invented catalogue durations. Evidence: repository README, existing master and bundled catalogue.

## Direction contract

- **THESIS:** A listening application, not a gallery of green cards. The next useful action is obvious; the teaching title gets the room.
- **OWN-WORLD:** A contemporary desktop audio library. Avenir Next for a compact, legible hierarchy; Noto Sans Myanmar with generous natural line height. Warm neutral work surfaces, forest-green actions and independently balanced dark surfaces. Keep the existing lotus; all functional pictograms are official Lucide vectors.
- **STORY:** Resume → browse → keep. One stable navigation model, one canonical search input per route, grouped lists and an ever-present player only when a recording is active.
- **FIRST VIEWPORT:** Clear route title; a specific primary task; real catalogue metadata; compact row controls. Queue states reflow the work area rather than obscuring it. Player metadata, transport, rate, queue and expand are separate aligned zones.
- **FORM:** Operate mode, code-led editable design artifact. Rebuild all 27 frames, retaining frame names and content coverage. Light for normal desk use; optional dark for low-light listening. Compact rail and two-row player at 860×620. No artificial album art, decorative charts, eyebrow labels, fake media progress or duplicate search boxes. No runtime UI migration is part of this task.

## Coverage extension

The subsequent audit preserves the 27 approved core boards and adds 21 evidence-backed state boards plus six design-system boards inside the same master. The library uses native component variants, exposed properties, real instances and Light/Dark semantic variables. The source-to-board mapping and intentionally excluded product features are recorded in COVERAGE.md. No runtime routes or app code are added by these state studies.

## Acceptance

Every frame is rendered and visually inspected at readable size. All controls use the same 44px hit-area grammar and Lucide stroke system. Full Myanmar shell and player. Unknown durations have no invented percentage or seek thumb. Incompatible media has no play triangle. Loading and error controls communicate actual state. Settings show a selected appearance and recognizable input affordances. Exactly one repository .figcraft master remains. Update the matching PNG, PDF and experimental FIG exports; record limitations instead of asserting interactions were tested in a static design.
