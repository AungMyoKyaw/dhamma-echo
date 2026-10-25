# Source-Order Sorting Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore original per-teacher catalogue order so repeated numbered series remain intact and no tracks appear missing across pages.

**Architecture:** Replace title-content collation with the existing stable media ID as the secondary ordering key after teacher name. Remove the now-unused comparator and SQLite collation dependency feature.

**Tech Stack:** Rust 2024, rusqlite 0.40, SQLite, Cargo tests

---

### Task 1: Reproduce repeated-series pagination

**Files:**

- Modify: `src-tauri/src/db.rs`

- [ ] **Step 1: Replace the insufficient natural-order fixture with source-order data**

Seed one teacher with IDs and titles in desired source order:

```sql
INSERT INTO media VALUES (1, '1: Series A', 'audio', 'mp3', 'english', 'https://dhammadownload.com/1.mp3', NULL, NULL, 1);
INSERT INTO media VALUES (2, '2: Series A', 'audio', 'mp3', 'english', 'https://dhammadownload.com/2.mp3', NULL, NULL, 1);
INSERT INTO media VALUES (3, '10: Series A', 'audio', 'mp3', 'english', 'https://dhammadownload.com/3.mp3', NULL, NULL, 1);
INSERT INTO media VALUES (4, '1: Series B', 'audio', 'mp3', 'english', 'https://dhammadownload.com/4.mp3', NULL, NULL, 1);
INSERT INTO media VALUES (5, '2: Series B', 'audio', 'mp3', 'english', 'https://dhammadownload.com/5.mp3', NULL, NULL, 1);
INSERT INTO media VALUES (6, '10: Series B', 'audio', 'mp3', 'english', 'https://dhammadownload.com/6.mp3', NULL, NULL, 1);
INSERT INTO media VALUES (7, '၁၀-၀၄-၂၀၂၄ တရား', 'audio', 'mp3', 'myanmar', 'https://dhammadownload.com/7.mp3', NULL, NULL, 1);
INSERT INTO media VALUES (8, '၀၉-၀၄-၂၀၂၄ တရား', 'audio', 'mp3', 'myanmar', 'https://dhammadownload.com/8.mp3', NULL, NULL, 1);
```

Rename the test to `search_audio_preserves_repeated_series_across_pages`, request two pages of four rows, combine their IDs, and assert:

```rust
assert_eq!(ordered_ids, vec![1, 2, 3, 4, 5, 6, 7, 8]);
```

- [ ] **Step 2: Run the regression test and verify RED**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml search_audio_preserves_repeated_series_across_pages
```

Expected: assertion failure because the current collation groups Series A and Series B by leading number and moves the Burmese date rows.

- [ ] **Step 3: Commit the failing regression test**

```bash
git add src-tauri/src/db.rs
git commit -m "test: preserve repeated catalogue series"
```

### Task 2: Restore source ordering

**Files:**

- Modify: `src-tauri/src/db.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Change the production query ordering**

Use the existing stable media ID after teacher grouping:

```sql
ORDER BY LOWER(COALESCE(t.name, '')), m.id
```

- [ ] **Step 2: Remove obsolete collation code**

Delete `NATURAL_TITLE_COLLATION`, `decimal_digit`, `leading_number`, `compare_digit_runs`, `natural_title_order`, `register_collations`, their unit test, the `Ordering` import, and registration calls. Restore the test-only `from_connection` helper to return `Self` directly and adjust fixture calls accordingly.

- [ ] **Step 3: Remove the dependency feature**

Restore:

```toml
rusqlite = { version = "0.40.1", features = ["bundled"] }
```

- [ ] **Step 4: Run focused and database tests and verify GREEN**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml search_audio_preserves_repeated_series_across_pages
cargo test --manifest-path src-tauri/Cargo.toml db::tests
```

Expected: all selected tests pass with no warnings.

- [ ] **Step 5: Run full verification**

Run:

```bash
bun run verify
```

Expected: formatting, linting, type checking, coverage, build, smoke checks, icons, Rust clippy, and Rust tests all pass.

- [ ] **Step 6: Commit the fix**

```bash
git add src-tauri/Cargo.toml src-tauri/src/db.rs
git commit -m "fix: preserve catalogue source order"
```
