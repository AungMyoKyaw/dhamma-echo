# Dhamma Echo — Evergreen Editorial, Q01–Q48 Approval & Delivery

**Approved:** 2026-10-24 · **Status:** Implemented as a refinement of the established 0.6.1 redesign · **Primary source of truth:** ../../DESIGN.md

This decision set is cumulative with the earlier Q01–Q80 redesign recorded in REDESIGN_PRD.md and CONCEPT_DECISION.md. It does not replace working catalogue, persistence, playback, or security architecture. All Q01–Q48 answers are approved **A**. This document gives the approved visual contract and distinguishes code changes from existing behavior and unverified claims.

## Direction and rules (Q01–Q06)

Quiet editorial listening room; nuanced Buddhist identity; grounded, warm atmosphere; major refinement rather than novelty; Apple Books-inspired reading hierarchy; solid surfaces with hairline borders. Avoid decorative gradients, fabricated artwork, overlaid glass effects, extraneous metrics, and a separate navigation model.

## Evergreen Editorial semantic palette (Q07–Q12)

| Role               | Light   | Dark    | Meaning                         |
| ------------------ | ------- | ------- | ------------------------------- |
| Canvas / substrate | #F5F2E9 | #141C18 | Application backdrop            |
| Page / surface     | #FCFAF5 | #1E2721 | Reading surfaces                |
| Panel / soft       | #EDE8DD | #27312A | Grouped controls                |
| Main text          | #202620 | #EBEEE6 | Content and headings            |
| Muted text         | #5A645A | #B8C2B6 | Supporting information          |
| Border             | #D6D8CE | #3B473F | Structural separation           |
| Primary            | #28563C | #98C5A8 | Current action and selection    |
| Primary strong     | #1F4631 | #BED9C6 | Emphasis / interactive feedback |
| On primary         | #FCFAF5 | #141C18 | Primary-button text             |
| Bronze marker      | #83683F | #BDA47D | Quiet secondary emphasis        |
| Error text         | #A63A2D | #EF9F8F | Recoverable/unrecoverable error |
| Error surface      | #F9E2DE | #351E1A | Error container                 |

The current system theme remains the initial default; explicit Light and Dark choices are stored locally. DESIGN.md and src/index.css define canonical roles and stay checked by bun run design:check. Custom states use semantic color mixing rather than arbitrary new colors. Normal-text contrast target is >=4.5:1; essential non-text contrast >=3:1.

## Typography and localization (Q13–Q18)

- Display English: Source Serif 4, Source Serif Pro, Georgia; headings approximately 30/24/20/18px depending on context.
- Body: Avenir Next and system sans, **16px default reading target**, 14px for compact data rows, 12px minimum for intentional labels/badges; avoid sub-12px lettering.
- Myanmar: Noto Sans Myanmar, Myanmar Text, Pyidaungsu fallback. No Latin tracking, forced caps, unsafe codepoint truncation or compressed Myanmar line heights.
- Language selection: Myanmar and English, using the existing translation dictionaries. Dates/durations/counts remain locale-sensitive; long titles wrap without breaking glyph clusters.

## Layout and navigation (Q19–Q24)

- One desktop shell with **256px standard / 224px compact / 72px collapsed** sidebar, context-sensitive header, content viewport up to 1520px, and player when active.
- Minimum window: 860×620. Main content remains scrollable. No permanent empty right panel.
- Home: continue listening first when available, otherwise helpful first-launch discovery.
- Explore: prominent search, contextual filters, accessible audio/video/WMA states, scannable track rows.
- Teachers and Collections: dedicated listing and detail screens, actual catalogue content only.
- Spacing foundation: 4/8/12/16/24/32/48px. Controls radius 8px; cards 12px; filter pills fully rounded.

## Listening system (Q25–Q30)

- Persistent bottom audio player uses existing 84px desktop / 132px compact layout and MediaEngine, not a parallel implementation.
- Queue opens on demand. Playback controls and seek remain keyboard-operable and visually distinct. Queue count badges must remain readable.
- Video remains integrated and expandable without cloning playback. Retain rate, position, resume, queue, unsupported-format, offline, and failure handling.

## Components and interaction (Q31–Q36)

Reuse the existing Svelte components: App shell, TitleBar, Sidebar, Header, Icon, search, TeacherCard, CollectionCard, TrackRow, Player, QueuePanel, VideoPlayer, ProgressiveControls, AsyncState, and settings controls. Each interaction requires understandable default, hover, pressed, focus-visible, selected, error and disabled states as applicable. Reuse the project Icon component. Motion is subtle (~100–240ms), never ornamental; honor reduced motion. Teacher imagery must be authentic or an identity-neutral fallback.

## Accessibility and macOS requirements (Q37–Q42)

- WCAG 2.2 AA target; visible keyboard focus, semantic controls, readable mixed scripts, no color-only status.
- First keyboard stop is a localized Skip to main content link; activation focuses #main-content.
- Pointer hit targets remain comfortable, especially on playback and queue controls.
- Verify minimum 860×620 window, 150% root text-size scaling without horizontal content overflow, both color themes and Myanmar/English.
- Preserve native window/titlebar interactions, local-only preferences, keyboard shortcuts, VoiceOver expectations, and Tauri/WKWebView semantics.

## Engineering, verification and scope (Q43–Q48)

- Preserve all existing functionality and privacy/security constraints. Rust and read-only SQLite remain unchanged by this visual pass.
- DESIGN.md stays canonical with linked CSS design tokens and drift checks. No new runtime UI framework or dependencies.
- Layout, badge typography, focus selector coverage, and localized skip link are implemented in src/. Regression assertions and Playwright 150%-scale/skip-navigation checks were added.
- Reuse the existing comprehensive checks: bun run verify:web, bun run verify, Impeccable source and live scans, Playwright responsive/theme/locale suites, directory/focus, interactions, and offline behavior.
- Audit screenshots remain in docs/images and docs/redesign. Review both themes in native WKWebView for final macOS signoff.

## Acceptance and known verification boundaries

The acceptance gate includes: no token drift, no source-level Impeccable failures, all existing tests passing, screenshots at 860×620 and desktop sizes, no document/content horizontal overflow at 150% root type scaling, skip link keyboard operable, no media state regressions, and no new runtime dependencies.

A passing browser preview is not proof of native VoiceOver compliance, real third-party media availability, macOS notarization, or Windows/Linux readiness. Those remain evidence-specific checks. See IMPLEMENTATION_REPORT.md and ACCEPTANCE_RESULTS.json for earlier Q01–Q80 evidence and limitations.
