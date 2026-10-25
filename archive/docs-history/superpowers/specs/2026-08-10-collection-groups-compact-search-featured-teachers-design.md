# Collection Groups, Compact Search, and Featured Teachers

## Goal

Improve catalogue scanning by grouping collections under teachers, compacting the Explore search controls on desktop, and updating the curated featured-teacher IDs for the new database.

## Grouped Collections

The Collections page groups cards under visible teacher headings whenever no specific teacher filter is selected. Teacher groups sort alphabetically by normalized teacher name, with `Unknown teacher` last. Collections within each group sort naturally by normalized name, ignoring case and whitespace differences and comparing embedded ASCII numbers numerically.

When a teacher filter is active, the page omits the redundant group heading and renders that teacher's naturally sorted collection grid directly. Search results retain grouping because generic titles such as `Disc 24` require teacher context.

The Rust collection search boundary sorts the complete filtered result set before applying offset and limit. This guarantees that Load more batches follow one stable teacher/name sequence and cannot introduce an earlier teacher group after a later group. The current maximum catalogue size is small enough for this in-memory summary sort, and SQL filtering and counting remain parameterized.

The frontend groups the accumulated, already ordered summaries without independently re-sorting them. When Load more extends the final visible teacher group, new cards join that section; later groups appear only after the previous group is complete in the global ordering.

## Compact Explore Search

At desktop widths, the search query, language selector, format selector, and Search button occupy one horizontal row. Category chips remain on a compact second row. Controls retain a minimum 44-pixel interactive height and existing labels.

At medium widths the form may wrap into two rows. At mobile widths it remains vertically stacked. Padding and gaps are reduced only enough to remove the oversized desktop search panel; search/filter behavior and request contracts do not change.

## Featured Teachers

The curated teacher IDs are hard-coded in this exact order:

1. `16` — မိုးကုတ်ဆရာတော်ဘုရားကြီး
2. `42` — သဲအင်းဂူဆရာတော်ဘုရားကြီး ဦးဥက္ကဋ္ဌ
3. `40` — ဖားအောက်တောရဆရာတော်ကြီး ဘဒ္ဒန္တအာစိဏ္ဏ
4. `53` — မဟာဗောဓိမြိုင် ဆရာတော် ဝနဝါသီ အရှင်ဉေယျဓမ္မသာမိမထေရ်
5. `61` — ဆရာတော်ဦးဇောတိက (မဟာမြိုင်တောရ)
6. `8` — ပါမောက္ခချုပ်ဆရာတော်ကြီး ဘဒ္ဒန္တ ဒေါက်တာ နန္ဒမာလာဘိဝံသ

Home uses these teachers in the exact curated order. The Teachers page pins them first in that order and adds the existing Featured badge, followed by all remaining teachers in their database response order. Missing curated IDs are skipped safely. Teacher search preserves search-result order while still marking matching curated teachers with the badge.

The IDs, rather than names or counts, define featured membership. Display names and audio counts always come from the database.

## Error and Empty States

Existing loading, initial error, append error, retry, empty, and completion states remain unchanged. `Unknown teacher` collections form a final group rather than being hidden. A filtered teacher with no collections retains the existing empty state.

## Testing

Rust tests cover teacher-first ordering, natural collection ordering within a teacher, unknown-teacher placement, filtering before pagination, and stable boundaries across consecutive pages.

TypeScript tests cover group headings, extension of an existing group after append, heading suppression under a teacher filter, compact responsive form classes, exact featured IDs and order, missing featured IDs, badges on the Teachers page, and preserved ordering for teacher search results.

Final verification uses Bun and includes formatting, linting, type checking, 100% frontend line/branch/function coverage, production build, smoke checks, Clippy, and all Rust tests.

## Out of Scope

- User-configurable grouping or sort modes
- Collapsible teacher groups
- Changing collection detail or track ordering
- Changing teacher names or audio counts stored in the database
- Modifying mobile application source outside this repository
