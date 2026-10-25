# Dhamma Echo — GitHub Pages Product Site Design

Date: 2026-08-05
Status: Approved in conversation

## Goal

Add a polished, lightweight product website to the existing Dhamma Echo repository and deploy it from GitHub Actions to GitHub Pages without changing the desktop application's runtime architecture.

## Product story

Dhamma Echo is a quiet desktop library for discovering and listening to Dhamma talks. The product site should make that value clear within one viewport, then provide enough evidence for a visitor to understand the catalogue, playback experience, privacy model, and open-source architecture.

## Selected approach

Publish a dependency-free static website from `docs/`:

- `docs/index.html` contains the semantic page structure and product copy.
- `docs/assets/site.css` contains the complete responsive visual system.
- `docs/assets/site.js` upgrades repository and release links when the page is running on `*.github.io`.
- `docs/images/dhamma-echo-demo.png` remains the primary product screenshot.
- `.github/workflows/pages.yml` validates and deploys the `docs/` directory using GitHub's supported Pages actions.

This keeps the website separate from the Tauri webview build, avoids another framework and lockfile surface, and makes the deploy artifact small and transparent.

## Visual direction

The site follows the desktop application's calm, warm visual language rather than a generic software landing-page theme.

- Background: warm ivory and paper-white surfaces.
- Primary: deep saffron brown (`#843902`).
- Secondary: muted leaf green (`#425531`).
- Supporting accent: ochre (`#674a0e`).
- Typography: system UI stack with Inter-compatible metrics; no remote font request and no bundled font files.
- Shape: large but restrained radii, thin warm-gray borders, and subtle shadows.
- Motion: small opacity and transform transitions only; disabled under `prefers-reduced-motion`.

The palette is based on the Design.md generated light scheme for the existing Dhamma Echo brand keys.

## Information architecture

1. Sticky navigation with product mark and section links.
2. Hero with a direct value proposition, trust indicators, and calls to view the product or repository.
3. Large framed application screenshot using the supplied `docs/images/dhamma-echo-demo.png` asset.
4. Feature grid covering catalogue discovery, playback, local library state, and privacy.
5. Focus section explaining the quiet, private desktop experience.
6. Technical section summarizing Tauri, Rust, SQLite, TypeScript, and the narrow trust boundary.
7. Open-source call to action and compact footer.

## Responsive behavior

- Desktop: two-column hero, full navigation, large screenshot, three-column feature grid.
- Tablet: stacked hero, two-column feature grid, full-width screenshot.
- Mobile: compact sticky header, horizontal section links, single-column content, full-width buttons, and no horizontal overflow.
- The screenshot keeps its native aspect ratio and is never cropped.

## Link behavior

The repository URL is not encoded in the supplied Git bundle. Static fallback links point to the on-page open-source section. On GitHub Pages, `site.js` derives the owner and repository from the standard `owner.github.io/repository/` URL and upgrades the repository and release links. The script does nothing on custom domains or localhost rather than guessing.

## Accessibility

- One `h1`, logical heading order, semantic landmarks, and a skip link.
- Visible keyboard focus on all interactive elements.
- Minimum 44px touch targets for primary actions.
- Text and controls meet WCAG AA contrast against their surfaces.
- Screenshot has meaningful alternative text and explicit dimensions to reduce layout shift.
- Decorative icons are hidden from assistive technology.
- Reduced-motion users receive no nonessential animation.

## Performance and security

- No framework, analytics, cookies, trackers, external fonts, or third-party runtime scripts.
- All production assets are local and repository-owned.
- The page includes a restrictive Content Security Policy suitable for a static site.
- CSS and JavaScript stay small enough to load immediately on GitHub Pages.
- The deploy workflow uses least-privilege Pages permissions and a single deployment concurrency group.

## Testing strategy

- Node built-in tests validate the page title, metadata, landmarks, heading structure, screenshot reference, local asset references, call-to-action hooks, accessibility attributes, and required feature copy.
- Script tests cover GitHub Pages repository derivation, project-site URLs, user-site URLs, custom domains, invalid URLs, and DOM link upgrades.
- A site smoke command checks that every local HTML asset exists and that no absolute local machine paths or remote runtime dependencies are present.
- Existing web application tests and production build continue to run unchanged where the required toolchain is available.

## Non-goals

- No blog, CMS, pricing page, account flow, analytics, or email capture.
- No rewrite of the Tauri application.
- No duplicate screenshot asset.
- No deployment to a custom domain in this pass.
- No invented repository owner or release URL.
