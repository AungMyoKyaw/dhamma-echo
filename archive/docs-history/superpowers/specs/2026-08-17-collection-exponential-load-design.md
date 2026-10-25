# Exponential Progressive Loading Design

## Goal

Make every paginated browse surface faster to use by increasing each explicit append batch: 100 records, then 200, then 400, while never requesting more than the number of results remaining.

## Interaction

Explore talks, Collections, and teacher-detail talks use the same explicit button. It displays the next batch, for example `Load 100 more`, `Load 200 more`, or `Load 400 more`. A partial final batch displays its actual remaining count. After a successful append, the next batch doubles up to 400; a new search, filter, or teacher resets the next batch to 100. The row-count chooser is removed because the batch progression is now explicit and predictable.

The existing initial batch preference remains internal for compatibility, but it is no longer exposed as a control beside the append button.

## Data flow

Each progressive list state tracks `nextLoadSize`, initialized and reset to 100. Each append method sends the current displayed count as the offset and `min(nextLoadSize, remaining)` as the request limit. A successful append doubles `nextLoadSize` up to 400; an append failure preserves it so Retry repeats the same request. Reducers continue to deduplicate stable IDs and mark lists exhausted on completion or no progress.

The Rust collection and audio search queries accept limits through 400. Teacher summaries and other bounded lookup commands retain their existing limits. This keeps larger batches explicit and bounded.

## Error and accessibility behavior

Existing loading, inline append-error, retry, empty, and completion states remain unchanged. The button remains a normal keyboard-accessible button, announces its loading state through the existing status text, and retains focus after appending.

## Testing

- TypeScript reducer and application tests verify Explore, Collections, and teacher-detail requests use 100, 200, and 400, cap final requests, reset correctly, and reuse sizes after retry.
- Rust tests verify collection and audio limits of 200 and 400 are accepted while unrelated lookup limits remain bounded.
- Source checks verify all three controls use the shared next-batch state and no row chooser remains.
- Svelte type checking and the production web build verify the shared control and rendered labels.

## Out of scope

- Infinite scrolling or automatic requests.
- Loading the entire catalogue in one request.
