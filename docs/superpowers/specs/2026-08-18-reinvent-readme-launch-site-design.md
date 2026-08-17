# Dhamma Echo — README and Launch Site Reinvention Design

Date: 2026-08-18
Status: Approved by direct implementation request

## Goal

Reinvent the repository README and GitHub Pages product site as one coherent launch surface that makes Dhamma Echo immediately understandable, visually distinctive, credible as open-source software, and easy to install.

## Product truth to preserve

Dhamma Echo is a private desktop library for Dhamma teachings. It catalogs audio and video records sourced from Dhamma Download, plays compatible MP3 and MP4 media over HTTPS, keeps personal listening state locally, and ships as a Tauri 2 application backed by a bundled read-only SQLite catalogue.

The redesign must not imply that Dhamma Echo hosts the media itself, owns the source catalogue, uploads user data, or supports formats that the current webview cannot play.

## Selected direction: high-fidelity listening room

The launch surface should feel like a purpose-built listening object rather than a generic SaaS landing page or a beige "Zen" template.

Three brand-voice words: **quiet, tactile, exact**.

Physical reference: a well-made hi-fi receiver and a carefully indexed private library — dark lacquered graphite, illuminated controls, crisp labels, and the product itself treated as the hero artifact.

### Color strategy

Use a committed dark graphite field for the marketing site, preserving the existing rust and olive identity as controlled accents. Use true neutral light text rather than beige body surfaces. The light desktop-app screenshots become the brightest objects on the page and provide deliberate contrast with the launch site.

- Graphite background: near-black neutral with a slight brand-hue tint.
- Primary accent: existing rust/orange family.
- Secondary accent: existing olive family.
- Main text: high-contrast neutral white.
- Muted text: tinted light neutral that still meets WCAG AA.

The README remains GitHub-native and therefore should not depend on color for hierarchy.

### Typography

Use a deliberate system-font stack only; do not add remote or bundled fonts. Establish distinct hierarchy through weight, scale, width, and spacing rather than an imported display face.

- Hero title: compact, strong, balanced, maximum below 6rem.
- Body copy: 65–75ch maximum measure.
- Labels: sentence case; no repeated tiny uppercase eyebrow scaffold.
- No gradient text.

### Visual motif

Use concentric "echo" rings and the real application screenshots as the core imagery. The rings must be structural and sparse, not a decorative grid or sketch illustration. Product screenshots stay uncropped, readable, and responsive.

## Launch-site information architecture

1. **Header** — compact wordmark, Product / Privacy / Source navigation, primary Download action.
2. **Hero** — "Dhamma, without the noise." value proposition, concise explanation, download/source actions, and a large Home screenshot layered with a restrained echo motif.
3. **Catalogue proof** — a horizontal facts strip: 30,563 audio talks, 14,474 video records, 257 teachers, 429 audio collections.
4. **Product narrative** — three alternating screenshot-led sections showing discovery, teacher/collection browsing, and persistent listening/library state. Avoid identical feature cards.
5. **Privacy / architecture proof** — explain local personal state, read-only SQLite catalogue, ten Tauri commands, and no accounts/analytics/ads/telemetry.
6. **Open-source / install** — Homebrew command as the fastest macOS path, release/source links, MIT license.
7. **Footer** — repository, privacy, and source attribution.

## README information architecture

The README should be optimized for a GitHub visitor scanning in this order:

1. Product name + one-sentence promise.
2. Hero screenshot.
3. Immediate macOS Homebrew install command and Releases alternative.
4. Compact product proof (audio, video, teachers, collections, local privacy).
5. "Why Dhamma Echo" with user-facing value, not implementation-first copy.
6. Screenshot gallery across all six shipped product views.
7. Playback/media compatibility and source-catalogue disclosure.
8. Architecture and privacy boundary.
9. Developer setup and commands.
10. Verification/quality claims that only state measurable current guarantees.
11. Contributing, data license, security, and project license.

Remove redundant badge walls and repeated quality badges. Keep only high-value status badges near the top.

## Copy rules

- Say that Dhamma Echo **catalogs/indexes** records from Dhamma Download and streams compatible source media; never say it hosts media.
- Audio and video are both first-class in the launch copy.
- Prefer user outcomes (find, listen, resume, keep local) before implementation details.
- Avoid spiritualized marketing clichés and claims about mindfulness, peace, or transformation.
- Keep technical claims concrete and verifiable from the repository.

## Responsive behavior

- Desktop: wide hero, screenshot as dominant artifact, alternating two-column narrative sections.
- Tablet: hero and narrative sections stack while keeping screenshot width dominant.
- Mobile: compact header, hidden secondary nav links when space is insufficient, full-width primary actions, facts wrap into two columns, no horizontal overflow.
- No content may depend on hover.

## Accessibility

- Exactly one `h1`, semantic landmarks, logical heading order, and skip link.
- Visible `:focus-visible` states.
- Primary interactive targets at least 44px tall.
- Body text contrast at least 4.5:1; large text at least 3:1.
- Meaningful alt text for every non-decorative screenshot.
- Decorative echo rings hidden from assistive technology.
- `prefers-reduced-motion` removes nonessential motion.

## Performance and security

- Keep the product site dependency-free under `docs/`.
- No external fonts, third-party scripts, analytics, trackers, cookies, iframes, or remote runtime assets.
- Preserve restrictive CSP.
- Keep `index.html`, `site.css`, `site.js`, and `logo.svg` individually below the existing 100 KiB smoke-test budget.
- Reuse existing screenshots; do not duplicate raster assets.

## Testing strategy

Update the product-site tests first so they require the new title/copy, both audio and video catalogue proof, the Home hero screenshot, all narrative screenshots, Homebrew install command, source attribution, privacy language, GitHub link hooks, reduced-motion rules, focus visibility, minimum target size, and horizontal-overflow protection.

Run the dependency-free Node tests, site.js coverage gate, and site smoke command. Run Impeccable's static detector if its executable script is available to the runtime. If Bun/Prettier is unavailable, report that limitation explicitly and use available checks without claiming the unavailable commands passed.

## Non-goals

- No desktop-app UI changes.
- No framework or site build-system migration.
- No new database or media behavior.
- No new analytics, newsletter, CMS, blog, account system, or custom domain.
- No invented download counts, testimonials, endorsements, or release metrics.
