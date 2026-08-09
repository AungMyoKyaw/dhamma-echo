# Source-Order Sorting Fix Design

## Problem

The natural-title collation treats every leading number as a sequence number. In the bundled catalogue, many titles instead begin with dates such as `၁၀-၀၄-၂၀၂၄`. It also combines separate numbered teaching series by placing every `1` together, followed by every `2`, and so on. Rows are not deleted, but the global reordering pushes expected tracks across pagination boundaries and makes them appear missing.

## Decision

Preserve the catalogue's original row order within each teacher. The media IDs encode the source order and already keep independent series together:

```text
1, 2, 3, …, 10
1, 2, 3, …, 10
```

Audio search results will continue to group by case-insensitive teacher name, then sort by media ID. This applies uniformly to English, Burmese, and other title text without interpreting title contents.

## Considered Approaches

1. **Source order by media ID — selected.** Correctly preserves repeated teaching series and date-based titles with a simple, stable pagination key.
2. **Global natural-number title sorting — rejected.** Groups unrelated series and mistakes date prefixes for sequence numbers.
3. **Infer series boundaries from punctuation or number resets — rejected.** Catalogue titles use inconsistent punctuation, dates, ASCII digits, and Burmese digits, so inference would be fragile.

## Implementation

Change the audio search query ordering from teacher plus custom title collation plus ID to teacher plus ID. Remove the custom collation registration, comparator helpers, and rusqlite `collation` feature because they are no longer needed.

No API, model, database schema, or UI changes are required.

## Error Handling

The fix removes collation registration from database initialization, eliminating that additional failure path. Existing database-open and query errors remain unchanged.

## Testing

A database regression fixture will contain two numbered series inserted in source order, plus date-prefixed Burmese titles. The production `search_audio` path must:

- return the two series as `1, 2, 3, 10, 1, 2, 3, 10` rather than grouping equal numbers;
- retain date-prefixed tracks in their source positions;
- return every media ID exactly once across adjacent pages;
- keep teacher grouping as the primary order.

The regression test must fail with the current natural-title collation, then pass after switching to media-ID ordering. Full Rust and web verification will run afterward.
