# Catalogue Load More Design

## Goal

Replace every remaining Previous/Next pagination control with the same explicit, append-only Load more interaction already used for teacher talks.

## Scope

The Explore audio results and the Collections browse page change. Explore initially loads up to 50 talks and Collections initially loads up to 24 collection cards. Each Load more activation requests the next batch using the number of unique displayed records as its offset.

Collection detail remains unchanged because its tracks are not paginated. Teacher detail retains its newly implemented Load more behavior.

## Interaction

Each list displays `Showing N of M talks` or `Showing N of M collections` below its results. When more records exist, a centered button states the next batch size, such as `Load 50 more talks` or `Load 24 more collections`. The final partial batch uses its actual remaining count.

Loading is always explicit. Scrolling never triggers a request. A new query or filter selection resets the affected list to its first batch. Activating Load more appends results without replacing, reordering, or scrolling away from existing content.

## State and Data Flow

Explore and Collections state separately track initial loading, append loading, append errors, and exhaustion. Initial success replaces the affected page. Append success adds records not already present by stable ID, keeps accumulated offset at zero, updates the server total, and ends loading when all records are shown or a successful response makes no progress.

Only one append request per list may run at a time. Search and filter actions clear progressive-loading metadata before issuing a fresh offset-zero request. Existing query and filter contracts sent to Rust remain unchanged.

## Error and Empty States

Initial request failures retain each page's existing error and retry behavior. Append failures preserve every displayed result and expose an inline error with Retry. Retry uses the unchanged displayed count, so it requests the same failed offset.

Empty initial results retain the existing empty-state copy. A duplicate-only or empty successful append marks that view exhausted to prevent an endless Load more loop.

## Accessibility

Load more controls are standard keyboard-accessible buttons. Loading and retry text use status semantics. Existing items remain in document order, and successful appends do not force focus into the new results.

## Testing

Work follows test-driven development. Reducer tests cover initial reset, append, deduplication, exhaustion, no-progress responses, and append failure preservation for Explore and Collections. Application tests cover offsets, current filters, retry, and concurrent/completed request guards. View tests cover progress text, dynamic counts, pending and retry states, completion, and removal of every remaining Previous/Next control.

Final verification uses Bun and runs formatting, linting, type checking, 100% frontend line/branch/function coverage, production build, smoke checks, Clippy, and all Rust tests.

## Out of Scope

- Infinite scrolling
- Runtime batch-size selection
- Changing result ordering
- Changing collection-detail track loading
- Changing Rust search request or response contracts
