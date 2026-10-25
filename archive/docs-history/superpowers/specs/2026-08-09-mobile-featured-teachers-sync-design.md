# Mobile Featured Teachers Sync Design

## Goal

Make the desktop Home featured-teacher section match the Expo mobile app's current curated list and order exactly.

## Curated List

The frontend hardcodes these teacher IDs in this order:

```text
30, 58, 53, 67, 75, 26
```

This mobile list is the source of truth for the change.

## Architecture

Keep the implementation entirely in the desktop frontend. Define one ordered featured-ID constant in `src/view.ts`. When Home renders, build an ID-to-teacher lookup from the already loaded teacher summaries and map the hardcoded IDs through it.

The backend continues returning the broader teacher collection. No Rust command, SQL query, API contract, application state, or database schema changes are needed.

## Behavior

- Home shows only the six curated teachers.
- Cards appear in the exact hardcoded order, independent of talk counts or backend result order.
- A curated teacher missing from loaded data is omitted without failing Home.
- The Teachers page retains its current broader list and ordering.
- Teacher search remains unchanged.
- Teacher cards continue showing live names and talk counts from loaded catalogue data rather than hardcoded copies.

## Testing

Update the Home rendering test with shuffled teacher data containing all six curated IDs plus an unrelated high-count teacher. Assert that rendered cards contain only the curated teachers and appear in order `30, 58, 53, 67, 75, 26`.

Also assert that a missing curated ID is omitted and that the Teachers route still renders the broader loaded collection. Run the focused view tests followed by full project verification.

## Out of Scope

- A dedicated backend operation for curated teachers.
- Synchronizing the list automatically between repositories.
- Changing the full Teachers page or teacher-search ordering.
