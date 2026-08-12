# Production UI and Quality Hardening Design

## Goal

Make Dhamma Echo production-ready without changing its core product scope: preserve the Svelte 5 + Tauri 2 architecture, catalogue behavior, local-first privacy model, audio workflow, and existing package-manager strategy while materially improving desktop UI/UX, accessibility, compact-window behavior, reproducibility, and release evidence.

## Product constraints

- Desktop application remains Svelte 5 + TypeScript + Vite + Tailwind CSS v4 inside Tauri 2.
- Bun remains the JavaScript package manager and `bun.lock` remains authoritative.
- No new production dependency is justified for this release.
- Rust/Tauri data access, catalogue APIs, playback behavior, download behavior, persistence, and routes remain behaviorally compatible.
- Minimum supported window remains 860×620 unless runtime verification proves that changing it is necessary.
- Existing MIT/open-source packaging remains intact.
- No remote fonts, trackers, analytics, or decorative heavyweight assets are introduced.

## Research decisions

### Svelte 5

Use semantic interactive elements and native event properties. Existing buttons and form controls already follow the Svelte 5 event model; new UI must preserve that pattern. Keyboard focus stays visible and non-interactive elements are not made clickable.

### Tailwind CSS v4

Keep design tokens in CSS variables and use utilities in components. Use responsive/container-aware layout techniques instead of adding a component library. Preserve `prefers-reduced-motion` behavior and explicit `focus-visible` treatment.

### Tauri 2

Preserve the existing restrictive CSP and narrow asset-protocol scope. This UI release does not require broader Tauri capabilities or filesystem permissions.

### macOS UX research

The interface should use window space efficiently, remain comfortable at compact sizes, keep controls near the content they affect, support keyboard access, and avoid layout instability. The result should feel desktop-native without imitating system chrome or adding a custom title bar.

## Visual direction

**Quiet editorial listening room.** The application should feel calm, warm, and intentional rather than like a generic dashboard.

- Primary: existing rust seed `#8c3f08`.
- Secondary: existing olive seed `#485b37`.
- Tertiary: existing ochre seed `#6e5014`.
- Light background: existing warm ivory `#fcf9f2`.
- Dark theme: keep the existing warm charcoal family, with clearer surface separation.
- Use the Design.md-generated roles as a contrast reference while preserving brand continuity.
- Typography stays local/system-first: Inter/Noto Myanmar fallbacks when already installed, then platform UI fonts. Do not add a network font dependency.
- Use a 4/8px rhythm, card radius around the existing 18px token, restrained 1px borders, and subtle hover depth only on actionable surfaces.

## Information architecture

Keep the current six primary destinations:

1. Home
2. Explore
3. Collections
4. Teachers
5. My library
6. Settings

The sidebar stays persistent. Detail pages continue to map back to their parent navigation item. No new destination is added.

## Application shell

### Sidebar

- Preserve brand, navigation, and privacy note.
- Make width responsive to the desktop window: full width at normal sizes and a slightly narrower compact width near the 860px minimum.
- Keep every navigation target at least 44px tall.
- Active state remains unmistakable without excessive shadow.
- Ensure focus-visible state remains clear in light and dark themes.

### Header

- Strengthen hierarchy with route-specific supporting copy rather than a bare eyebrow/title pair.
- Keep header content aligned to the main content measure.
- Prevent oversized headings from crowding compact windows.

### Main content

- Make the usable content pane a CSS container.
- Replace fixed three/four-column assumptions with auto-fit/minmax or container-aware grids where appropriate.
- Use a bounded reading/listening measure on very wide windows so content does not stretch excessively.
- Keep compact spacing at the 860×620 minimum without hiding required controls.

## Home

- Continue-listening is the primary action when history exists.
- Make the resume card more obviously playable and show concise progress/resume context.
- Stats remain secondary and only appear in the existing no-recent state.
- Featured-teacher cards should adapt to content width and remain readable in both grid and horizontal-scroller modes.
- “View all” remains a textual secondary action with a strong focus target.

## Explore

- Search remains the primary discovery workflow.
- Search/query, language, format, and submit controls reflow based on the usable content width, not the whole viewport.
- Category chips keep clear selected/unselected states and keyboard focus.
- Results remain dense enough for a catalogue but each row must retain clear playback/favorite/download affordances.

## Collections and teachers

- Replace fixed three-column teacher layout with an adaptive grid.
- Collection groups use adaptive cards with consistent minimum widths.
- Search controls stack cleanly at compact width.
- Cards use a clearer content hierarchy, stronger focus/hover treatment, and stable height where useful without truncating Myanmar names.

## Track rows

- Preserve the information density and behavior.
- Enlarge icon-button targets to desktop-friendly touch-size equivalents where current targets are too small.
- Improve current-track emphasis without relying on color alone.
- Keep metadata readable and avoid overflow at compact width.
- Download/favorite states remain explicit via accessible labels and visible icon state.

## Player

The player is a persistent product-critical surface.

- At normal widths, preserve the three-zone structure: track identity, transport/progress, secondary controls.
- At compact widths, switch to a deliberately composed two-row layout rather than shrinking all controls until they compete.
- Primary play/pause remains the strongest control.
- Seek buttons receive at least 40–44px effective targets.
- Progress, current time, duration, speed, volume, and queue remain accessible.
- Loading and retry states remain live-region aware.
- Queue badge stays readable without creating layout shift.
- Player never overlaps scrollable content; the main shell reserves enough bottom space in both modes.

## Async, empty, and error states

- Keep the existing semantic state component.
- Loading skeletons use reduced-motion-safe animation.
- Empty state remains calm and explanatory.
- Error state uses theme tokens rather than light-only red backgrounds so dark mode remains coherent.
- Retry controls meet the same target/focus rules as primary controls.

## Accessibility

- Semantic `<button>`, `<a>`, `<label>`, `<select>`, and `<input>` elements only for interaction.
- Keyboard-visible focus on every actionable control.
- 44px-class targets for navigation and critical playback actions; smaller dense controls only when spacing still provides a safe effective target.
- No information conveyed only by color.
- Preserve `lang="my"` on detected Myanmar text.
- Preserve reduced-motion support.
- Keep status/error announcements using `aria-live`, `role="status"`, or `role="alert"` where already meaningful.
- Prevent focus clipping inside overflow containers.

## Production engineering hardening

### Toolchain reproducibility

- Pin Bun to stable 1.3.14 in repository metadata and GitHub Actions instead of `canary`/`latest`.
- Preserve exact dependency versions/lockfile behavior; do not mass-upgrade packages in this release.

### Tests

- Add a repository check for `.only`, `.skip`, `xdescribe`, `xit`, and equivalent focused/disabled test markers in required tests.
- Preserve all existing behavior tests.
- Add targeted tests for any changed pure UI helper behavior before implementation.
- Do not claim component runtime coverage when it is not measured.

### Coverage

The existing 99% branch threshold is not acceptable for this release. The release loop must require 100% line, branch, and function coverage from the current Node coverage runner for its measured TypeScript scope. Because Node's built-in coverage does not expose a distinct statement metric and current component source is outside that measured scope, the final report must not call the user's four-metric whole-project coverage requirement `PASS` unless a real statement/component-aware report is actually produced. If tooling cannot be installed in the execution environment, this gate remains `BLOCKED` or `FAIL` with exact evidence rather than being weakened.

### CI/CD

- Pin stable Bun consistently across CI, release, and Pages workflows.
- Add the zero-skipped/focused-test check to CI verification.
- Keep least-privilege permissions and current CodeQL/security workflow structure.

## Lightweight requirement

No new production dependency. Preserve zero runtime npm dependencies. Measure production web artifact size before/after when the toolchain can run. Existing vector assets remain preferred. No new background work is introduced.

## Security

No new trust boundary is added. Do not broaden CSP, asset scope, Tauri capabilities, network hosts, or filesystem permissions for UI work. Security audits remain part of the release loop.

## Verification matrix

Visual verification, when runnable, must cover:

- 1280×820 light theme: Home, Explore, Teachers, Collections, Settings, persistent player.
- 860×620 light theme: same shell plus search controls and persistent player.
- 1280×820 dark theme: Home, error/empty styling where reachable, Settings, player.
- Keyboard focus on sidebar, search, cards, track actions, and player controls.
- Long/Myanmar text wrapping/truncation.
- Player loading/playing/queue-open states where mock/runtime controls allow them.

## Architecture diagrams

Existing context, module, data-flow, and release diagrams remain valid. Add a UI shell/responsive-layout diagram showing the persistent sidebar, route header/content container, and player/queue layers; reference it from README.

## Acceptance criteria

- Existing core behavior preserved.
- UI is materially improved at normal and minimum window sizes.
- Light and dark themes are coherent.
- Critical interactions are keyboard accessible.
- No new production dependency.
- Bun canary/latest removed from repository workflows in favor of stable 1.3.14.
- Zero skipped/focused required tests are machine-checked.
- Branch threshold is no longer weakened to 99%.
- Formatter, lint, typecheck, tests, build, smoke, audits, Rust checks, package build, visual verification, and Git-bundle verification are run when the environment supports them; otherwise the exact external blocker is reported.
