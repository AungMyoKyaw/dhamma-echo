# Featured Teachers First

## Goal

Make curated teachers immediately recognizable and place them first on the default Teachers page without changing the established ordering of other teachers or search results.

## Curated Teachers

Use the same ordered teacher IDs as the Expo mobile app:

```text
30, 58, 53, 67, 75, 26
```

This list remains the source of truth for both the Home featured-teacher section and featured treatment on the Teachers page.

## Default Teachers Page

- Place loaded curated teachers first in the exact curated order.
- Omit a curated ID cleanly when that teacher is absent from the loaded catalogue.
- Keep every non-featured teacher after the curated group in its existing backend-provided order.
- Keep teacher talk counts visible and do not use them to reorder the list in the frontend.

## Featured Badge

- Render a subtle `Featured` badge on every curated teacher card.
- Use the existing application colors and compact rounded styling so the badge is visible without competing with the teacher name.
- Do not render the badge for other teachers.
- Keep the existing teacher-selection action and card semantics unchanged.

## Search Behavior

- Preserve the current backend-provided search-result order.
- Do not pin featured matches to the beginning of search results.
- Continue rendering the `Featured` badge when a curated teacher appears in search results.
- Preserve existing loading, error, empty, and navigation behavior.

## Architecture

Define the curated teacher IDs once in the frontend view layer and reuse two small helpers:

1. A featured-membership check used by teacher-card rendering.
2. A default-list ordering operation that maps the curated IDs through the loaded collection and then appends non-featured teachers in their original order.

Home continues using the same curated list and order. No Rust command, database query, API contract, state shape, or schema change is required.

## Testing

- Verify the default Teachers page renders present featured teachers first in curated order.
- Verify non-featured teachers retain their input order after the featured group.
- Verify missing curated teachers are skipped without an error.
- Verify featured cards render the badge and non-featured cards do not.
- Verify search results retain their input order while featured matches still render the badge.
- Run focused view tests and the full project verification suite.

## Out of Scope

- Alphabetically sorting Burmese or English teacher names.
- Pinning featured teachers in search results.
- User-managed favorites or configurable featured ordering.
- Backend or database changes.
