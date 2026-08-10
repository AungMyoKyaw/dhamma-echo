# Full Audio Catalogue Redesign

## Goal

Replace the bundled catalogue with the supplied full SQLite database and redesign Dhamma Echo's audio discovery experience around its categories, collections, teachers, and playable audio records. Ebook and video browsing remain a separate future project.

## Source Database

The source of truth is `/Users/aungmyokyaw/projects/life/dhammadownload-db/dhamma.db`. Implementation copies that file byte-for-byte to `src-tauri/resources/dhamma.db` and verifies that the two SHA-256 hashes match.

The source currently contains 47,960 media rows: 30,563 audio, 2,532 ebook, and 14,865 video records. It contains 257 teachers, eight categories, 1,315 collections, and 429 collections containing audio. Of the audio records, 11,476 belong to at least one collection and 19,087 do not.

The application opens the bundled database read-only. Runtime commands may query `teachers`, `media`, `categories`, `collections`, and `media_collections`. Crawler and provenance tables remain bundled source data and are not exposed through application commands or UI.

## Product Scope

Dhamma Echo remains an audio application. The redesign adds full audio-oriented discovery without exposing ebook or video records.

The primary navigation remains Home, Explore, Teachers, My Library, and Settings, with a new Collections destination. Existing queue, playback, favorites, history, resume, and settings behavior remains intact.

Explore supports global audio search and optional filters for category, collection, language, format, and teacher. Selected category, collection, and teacher filters appear as removable chips.

The audio category navigation exposes the four meaningful audio categories in the database:

- Audio in Myanmar
- Audio in English
- Abhidhamma in Myanmar
- Abhidhamma in English

Some audio rows are linked to categories labelled as ebook or video. Those rows remain available under All audio and through search, but the misleading category labels are not offered as audio navigation choices.

## Playable Records With Incomplete Metadata

A playable media URL takes priority over metadata completeness. Every audio row with a usable, approved MP3 URL remains displayed and playable even when optional metadata or relationships are absent.

Missing data uses neutral presentation fallbacks:

- missing or blank title: `Untitled talk`
- missing teacher relationship or name: `Unknown teacher`
- missing collection: no collection label
- missing category: available under All audio
- missing track number: ordered after numbered collection tracks

No audio record is hidden merely because teacher, collection, category, description, date, location, or track number data is absent. WMA and invalid/unapproved URLs remain visible and searchable but retain the existing unavailable state because the desktop webview cannot safely play them.

## Collections

The Collections destination provides paginated text search and optional teacher filtering. Collection summaries include ID, name, teacher identity when available, audio track count, and type/source metadata only when useful to distinguish records.

Duplicate collection names remain separate database records. The UI displays teacher context so similarly named collections can be distinguished without merging potentially different source sets.

Selecting a collection opens a detail view containing its available description, teacher, audio count, and ordered tracks. Tracks sort by `media_collections.track_number`; missing track numbers follow numbered tracks, and media ID supplies deterministic tie-breaking. Each row offers the same play, favorite, and queue actions used in Explore.

## Teachers

Selecting a teacher opens a detail view rather than applying an invisible filter immediately. The detail view shows the teacher's name, audio count, collections, and a complete paginated audio list. The database has no populated translated names, titles, descriptions, or images, so the view does not manufacture biography content or placeholder portrait imagery.

Users can deliberately choose to filter Explore by the selected teacher. Navigation back to the previous list preserves its query, filters, and page.

## Architecture

Rust remains the database and trust boundary. New serializable models represent audio categories, collection summaries, collection detail, and expanded teacher detail. Purpose-built Tauri commands provide category listing, paginated collection search, collection detail, and teacher discovery data.

`AudioSearchRequest` gains optional `categoryId` and `collectionId` fields. Rust validates positive IDs, bounded limits, non-negative offsets, and allowed language and format values. Queries remain parameterized. Ebook and video rows are excluded with `m.type = 'audio'` at every audio command boundary.

TypeScript mirrors the Rust response contracts. Application state gains collection list/detail state, teacher detail state, category data, filter IDs, and navigation context. Reducer actions remain deterministic and rendering remains a pure function of state.

Existing media URL validation is unchanged. Only approved MP3 URLs on the configured Dhamma Download hosts are playable, with HTTPS normalization and host fallback. The broader database schema does not broaden network access.

## Error and Empty States

Database failures surface through the existing typed command-error boundary. List and detail surfaces provide separate loading, empty, error, retry, and not-found states. A missing teacher or collection does not break global navigation or playback.

If category or collection metadata cannot load, ordinary All audio search remains usable. Invalid or stale filter IDs return an empty or not-found result according to the command contract rather than exposing SQL errors.

## Testing

Work follows test-driven development. Rust tests cover category eligibility, collection search, pagination, teacher filtering, detail lookup, deterministic track ordering, audio-only enforcement, incomplete metadata fallbacks, validation errors, and not-found behavior.

TypeScript tests cover API command contracts, state transitions, preserved navigation context, filter chips, detail views, missing-field fallbacks, accessibility labels, and play/queue/favorite actions on collection tracks.

A real-database regression test verifies the copied catalogue's current counts and exercises category, collection, teacher, and audio search paths. Final verification runs frontend tests and coverage, type checking, lint and formatting checks, the production web build, Rust tests, SQLite integrity and foreign-key checks, and SHA-256 comparison between source and bundled databases.

## Out of Scope

- Ebook and video browsing or playback
- UI for crawler runs, discovered links, or media provenance
- Editing or migrating source database records
- Downloading media for offline storage
- Fabricated teacher biographies, translations, artwork, or missing metadata
