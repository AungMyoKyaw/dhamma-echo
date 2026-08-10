# Teacher Detail Collection Sorting and Talk Loading

## Goal

Make teacher detail pages easier to scan by sorting their collection cards naturally and replacing talk-list page switching with an explicit, context-preserving Load more interaction.

## Collection Sorting

Only the collection cards on a teacher detail page change. Their display names are sorted ascending with these rules:

- ignore leading and trailing whitespace
- compare case-insensitively
- compare embedded numbers numerically, so `Disc 2` precedes `Disc 10`
- use the collection ID as a deterministic tie-breaker

The cards retain their existing grid, content, and navigation behavior. This change does not alter talk ordering, collection track ordering, or the main Collections page.

Sorting belongs at the teacher-detail data boundary. The Rust teacher-detail query/model layer returns its collection summaries in the required display order, while other collection queries retain their current ordering contracts.

## Talk List Interaction

The teacher detail page initially requests and displays up to 50 talks. The existing Previous and Next controls are removed from this page.

When more talks exist, the page shows progress text such as `Showing 50 of 96 talks` and a centered `Load 46 more talks` button below the visible list. Each activation requests the next batch of up to 50 records and appends them without replacing or reordering previously displayed talks. The button label reflects the smaller of the remaining count and the batch size.

Once all talks are visible, the Load more button is hidden and the progress text remains. Loading occurs only after explicit activation; reaching the bottom of the page never triggers an automatic request.

The existing `Explore this teacher` action remains the route for users who want targeted searching and filtering across a teacher's catalogue.

## State and Data Flow

Teacher-detail state distinguishes the initial talk request from a later Load more request. The initial response establishes the talk list and total count. A Load more request uses the current displayed count as its offset and appends the response.

The reducer defensively deduplicates appended talks by media ID. It preserves the existing list and total if a subsequent request fails. Only one Load more request may be active at a time, and the button is disabled while that request is pending.

Opening a collection from the teacher page and returning preserves the teacher detail state, including the talks already loaded.

## Error and Empty States

An initial teacher-detail failure continues to use the existing page-level error and retry behavior. A later Load more failure is shown inline near the button, leaves all already loaded talks playable, and offers Retry for the same next offset.

A teacher with no talks retains the existing empty state. Inconsistent or empty appended responses cannot create an endless enabled button: normal completion is determined from the server total and the number of unique displayed records, while an explicit exhausted state ends further loading if a successful append produces no new records.

## Accessibility

Load more is a standard button reachable by keyboard and assistive technology. Appended talks remain in normal document order. Focus stays on the button when more results remain; after the final batch removes the button, completion is announced without forcing focus into the appended list. Progress and loading text use the page's existing status semantics.

## Testing

Work follows test-driven development. Rust tests cover trimming, case-insensitive comparison, embedded numeric ordering, deterministic ties, and confirmation that the specialized ordering applies only to teacher-detail collections.

TypeScript tests cover the initial 50-record request, offset calculation, append behavior, defensive deduplication, dynamic remaining-count labels, pending-state protection, completion, no-progress handling, inline failure and retry, preservation of loaded records, and navigation-state restoration. View tests confirm removal of Previous/Next from teacher talks and keyboard-accessible Load more rendering.

Final verification uses Bun for frontend commands and includes the full frontend test suite with required coverage, type checking, linting, production build, Rust formatting and tests, Clippy, and the existing application smoke checks.

## Out of Scope

- Infinite or automatic scrolling
- Sorting the teacher's talk list alphabetically
- Changing collection track ordering
- Changing the main Collections page ordering
- Adding search or filtering controls directly to the teacher detail page
- Changing the batch size at runtime
