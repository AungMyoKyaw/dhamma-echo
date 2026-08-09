# Dhamma Echo — Privacy Policy Design

Date: 2026-08-09
Status: Approved in conversation

## Goal

Publish an accurate, publicly accessible privacy policy for Dhamma Echo on the repository's existing GitHub Pages site so it can be supplied as the app-store privacy policy URL.

## Selected approach

Add a dedicated dependency-free page at `docs/privacy/index.html`, reuse the product site's local stylesheet, and link the policy from the product-site footer. The resulting production URL will be `https://aungmyokyaw.github.io/dhamma-echo/privacy/`.

This is preferable to a repository Markdown file because it provides a stable, professional store-facing URL, and preferable to embedding the policy in the landing page because it remains directly linkable and easy to review.

## Policy content

The page will state, in plain language:

- Dhamma Echo has no user accounts and does not collect names, email addresses, precise location, contacts, photos, advertising identifiers, analytics, diagnostics, or telemetry.
- Favorites, listening history, resume positions, queue state, theme, playback speed, and volume remain in local device storage and are not sent to the developer.
- The bundled catalogue is read-only.
- Selecting a talk streams audio from `dhammadownload.com` or `www.dhammadownload.com`. Those servers necessarily receive ordinary connection information such as the user's IP address, request time, requested resource, and browser or device networking information, subject to the third party's own practices.
- Dhamma Echo does not sell or share personal data for advertising, profiling, or marketing.
- Users can remove locally stored information by clearing application data or uninstalling the app.
- The service is not directed to children and the app does not knowingly collect children's personal data.
- Material policy changes will be reflected on the page with a revised effective date.
- Privacy questions can be sent to `builtbyamk@duck.com`.

The effective date will be August 9, 2026.

## Presentation and accessibility

The policy will use the existing site's warm visual system, responsive shell, logo, and local-only assets. It will have a single `h1`, semantic sections, a skip link, visible focus styles, readable line lengths, and navigation back to the product page. No cookies, trackers, remote scripts, remote fonts, or analytics will be introduced.

## Testing and deployment

- Add a site test that verifies the policy's title, effective date, contact address, local-storage disclosure, external audio-host disclosure, deletion instructions, and footer link.
- Extend smoke validation implicitly through the existing recursive `docs/` artifact checks.
- Run the complete `site:verify` command before publishing.
- Commit and push to `master`; the existing GitHub Pages workflow will validate and deploy `docs/`.
- Wait for the Pages workflow and verify the live policy URL returns successfully with the expected content.

## Non-goals

- No changes to application data handling or permissions.
- No legal claims about the independent audio host beyond the network data necessarily exposed when streaming.
- No consent banner, cookie controls, analytics, or account-management flow.
