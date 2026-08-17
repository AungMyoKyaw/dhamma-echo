# Exponential Collection Loading Design

## Goal

Make the Collections browse page faster to use by increasing each explicit append batch: 100 collections, then 200, then 400, while never requesting more than the number of results remaining.

## Interaction

The existing initial collection request and `Rows` preference remain unchanged. The append button displays the next collection batch, for example `Load 100 more`, `Load 200 more`, or `Load 400 more`. A partial final batch displays its actual remaining count. After a successful append, the next batch doubles up to 400. A new search or teacher filter resets the next batch to 100.

Explore talks and teacher-detail talks retain their existing batch behavior. The change is specific to the Collections browse page.

## Data flow

Collection browse state tracks `nextLoadSize`, initialized and reset to 100. `DhammaApp.loadMoreCollections()` sends the current displayed count as the offset and `min(nextLoadSize, remaining)` as the request limit. A successful append doubles `nextLoadSize` up to 400; an append failure preserves it so Retry repeats the same request. The reducer continues to deduplicate collection IDs and mark the list exhausted on completion or no progress.

The Rust collection query accepts limits through 400, while the shared audio and teacher query limit remains capped at 100. This keeps the larger batch an explicit, bounded collection-only capability.

## Error and accessibility behavior

Existing loading, inline append-error, retry, empty, and completion states remain unchanged. The button remains a normal keyboard-accessible button, announces its loading state through the existing status text, and retains focus after appending.

## Testing

- TypeScript reducer tests verify initialization/reset to 100, doubling after successful appends, and preserving the batch size after append failure.
- Application tests verify collection requests use limits 100, 200, and 400, cap the final request to the remaining count, and reset after a fresh search.
- Rust tests verify collection limits of 200 and 400 are accepted while the shared audio limit validation remains bounded.
- Svelte type checking and the production web build verify the dynamic control prop and rendered labels.

## Out of scope

- Changing the initial collection batch or persisted Rows preference.
- Changing Explore or teacher-detail talk loading.
- Infinite scrolling or automatic requests.
- Loading the entire catalogue in one request.
