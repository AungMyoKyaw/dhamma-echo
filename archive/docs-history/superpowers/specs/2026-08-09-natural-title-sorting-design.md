# Natural Title Sorting Design

## Goal

Sort audio titles that begin with a number in numeric order, so `1` through `10` appear as `1, 2, 3, …, 9, 10` instead of lexicographic order such as `1, 10, 2`. Apply the behavior to titles in every language and recognize both ASCII digits (`0`–`9`) and Burmese digits (`၀`–`၉`).

## Scope

The change applies to audio catalogue search results. Existing teacher grouping remains unchanged: results continue to sort by teacher name first, then by title within each teacher.

Titles with no leading number retain case-insensitive lexical ordering. A leading run of whitespace is ignored when detecting the number, matching the normalized title shown by the application.

## Ordering Rules

Within one teacher's results:

1. If two titles begin with numbers, compare their leading numeric values. For example, `2: Talk` sorts before `10: Talk`, and `၂ တရား` sorts before `၁၀ တရား`.
2. ASCII and Burmese digits represent the same numeric values, so `2` and `၂` have equal numeric priority.
3. If the numeric values are equal, compare the complete titles case-insensitively to make the result deterministic and intuitive.
4. If only one title begins with a number, place the numbered title first. This makes the comparator transitive across ASCII digits, Burmese digits, and text while leaving unnumbered titles in their existing relative order.
5. If titles still compare equally, use the media ID as the final stable tie-breaker.

Leading integers are compared without converting them to a fixed-width machine integer, preventing overflow for unusually long digit sequences. Leading zeroes do not change numeric value; the complete-title fallback determines the order of values such as `2` and `02`.

## Architecture

Register a custom SQLite collation when the catalogue connection is opened. The collation compares two title strings using the ordering rules above. The audio search query will use this collation for the title portion of its existing `ORDER BY` clause:

1. case-insensitive teacher name;
2. naturally collated title;
3. media ID.

Keeping ordering inside SQLite preserves correct `LIMIT` and `OFFSET` pagination without loading all matching rows into Rust.

## Error Handling

Collation registration is part of database initialization. If registration fails, opening the catalogue returns the existing database-open error type with the underlying message. Title comparison itself is total and does not fail on empty strings, non-numeric titles, mixed scripts, or very long numbers.

## Testing

Rust unit tests will establish the behavior before implementation and cover:

- ASCII numeric order (`1`, `2`, `9`, `10`);
- Burmese numeric order (`၁`, `၂`, `၉`, `၁၀`);
- Burmese or English text following a numeric prefix;
- equivalent ASCII and Burmese numeric prefixes;
- leading whitespace and leading zeroes;
- non-numbered titles retaining lexical order;
- stable ID tie-breaking through the database search path;
- page boundaries following the same natural ordering.

The existing Rust test suite and full project verification will be run after implementation.
