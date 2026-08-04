# Dhamma Echo — Product and Technical Design

Date: 2026-08-04
Status: Approved by explicit build instruction

## Product goal

Dhamma Echo is a lightweight cross-platform desktop audio player for browsing and listening to the Dhamma talks stored in the supplied SQLite database. The application must be calm, fast, useful with a large catalogue, and safe to distribute as an open-source Tauri application.

## Source data findings

The supplied `dhamma.db` contains:

- 28,835 media rows
- 21,402 audio rows
- 6,328 video rows
- 1,105 ebook rows
- 212 teachers
- 8 categories
- 28,471 Myanmar-language media rows and 364 English-language rows
- Remote media URLs hosted on `dhammadownload.com`
- No stored duration, file size, description, or Myanmar title values
- 81 `http://` media URLs, including 15 audio URLs

The database is treated as read-only source data. Duration is discovered by the browser audio element when metadata loads.

## Name and positioning

**Dhamma Echo**

Tagline: **A quiet desktop library for Dhamma talks.**

The name is descriptive, easy to pronounce in English, and does not claim ownership of or authority over the teachings.

## Considered approaches

### A. Frontend queries via `tauri-plugin-sql`

Advantages:
- Less Rust query code.
- Fast initial implementation.

Disadvantages:
- Broader database access exposed to the webview.
- SQL and result shaping leak into the UI layer.
- Harder to keep a narrow security boundary.

### B. Narrow Rust commands with `rusqlite` — selected

Advantages:
- Read-only connection and query restrictions are enforced in Rust.
- UI receives typed, purpose-built results.
- Easy to test repository and sanitization logic independently.
- No database write permission is needed.

Disadvantages:
- More Rust code and serialization types.

### C. Export SQLite data to static JSON/search indexes

Advantages:
- No runtime SQLite dependency.

Disadvantages:
- Larger generated assets.
- Slower or more complex full-text search.
- Data regeneration workflow becomes mandatory.
- Loses the supplied database as the single source of truth.

## Scope

### Included in version 1

- Home view with catalogue summary and featured teachers.
- Search across audio title and teacher name.
- Filters for language, format, and teacher.
- Paginated/virtualized catalogue browsing.
- Teacher directory and teacher detail view.
- Persistent bottom player with play, pause, seek, volume, previous, and next.
- Queue management.
- Playback speed control.
- Favorites stored locally.
- Recently played history and resume position stored locally.
- Light/dark/system theme.
- Myanmar and English text rendering.
- Graceful handling of unavailable or insecure remote media.
- Keyboard shortcuts and accessible focus states.

### Explicitly excluded from version 1

- Video and ebook playback.
- User accounts or cloud sync.
- Editing the supplied database.
- Downloading media for offline use.
- Audio transcoding.
- Scraping or refreshing the catalogue.
- Analytics, advertisements, or tracking.

## User journeys

1. Open the app and immediately see catalogue size, featured teachers, and recent listening.
2. Search for a title or teacher, filter the result, and start playback.
3. Browse a teacher, inspect all talks, and enqueue one or more tracks.
4. Close and reopen the app, then resume the last track and position.
5. Mark talks as favorites and find them in the Library view.

## Information architecture

- **Home**: summary, continue listening, featured teachers, recently played.
- **Explore**: searchable/filterable audio catalogue.
- **Teachers**: searchable teacher directory and teacher detail.
- **Library**: favorites and history.
- **Settings**: theme, playback defaults, data information, shortcuts.
- **Now Playing**: persistent compact player plus expanded queue panel.

## Architecture

### Desktop shell

Tauri 2 hosts a React/Vite frontend. Capabilities allow only the application commands required by the main window. The app does not expose arbitrary filesystem, shell, SQL, or HTTP commands.

### Data layer

Rust owns a read-only `rusqlite::Connection` pool guarded by a mutex. The bundled database path is resolved from Tauri resources. Queries use bound parameters, capped page sizes, deterministic ordering, and normalized output text.

Commands:

- `get_catalogue_summary`
- `list_featured_teachers`
- `search_teachers`
- `get_teacher`
- `search_audio`
- `get_audio_track`

### Frontend

React components are organized by feature. A small application store uses React context and reducers; no third-party state library is required. Browser APIs manage audio playback and local persistence.

Modules:

- `api`: typed Tauri command client.
- `catalogue`: search, filters, pagination, teacher browsing.
- `player`: HTML audio element, queue, progress, shortcuts.
- `library`: favorites, history, resume position.
- `settings`: theme and playback defaults.
- `ui`: accessible reusable primitives.

### Persistence

User preferences, favorites, queue, history, and resume positions are stored in namespaced local storage. The SQLite resource remains immutable.

## Data flow

1. React requests a typed catalogue operation.
2. Tauri invokes the matching Rust command.
3. Rust validates inputs and executes a parameterized read-only query.
4. Results are normalized and serialized to the webview.
5. React renders the result and the player streams the selected remote URL.
6. Playback state is periodically persisted locally.

## Security and reliability

- SQLite is opened read-only with URI/mutex-safe flags.
- Query text is parameterized; limit and offset are clamped.
- Commands reject unsupported formats and invalid identifiers.
- No shell, unrestricted filesystem, or database mutation capability.
- CSP allows only application assets and media from `dhammadownload.com`.
- Legacy `http://` tracks are displayed but blocked with a clear explanation instead of silently weakening CSP.
- External media errors are recoverable and never crash the application.
- Local storage parsing validates schema and falls back safely on corruption.

## Design direction

The interface uses a quiet editorial layout rather than a generic dashboard. Warm saffron is the action color, muted leaf green supports secondary states, and parchment-like surfaces keep long browsing sessions comfortable.

Typography uses a system-first stack with `Noto Sans Myanmar` and platform Myanmar fallbacks for correct shaping. The application does not bundle font files.

### Design tokens

Light theme:
- Background: `#fcf9f2`
- Surface: `#ffffff`
- Primary: `#8c3f08`
- Primary container: `#a4511c`
- Secondary: `#485b37`
- Tertiary: `#6e5014`
- Text: `#2e2e2a`
- Muted text: `#565550`
- Outline: `#72716b`

Dark theme:
- Background: `#100e0a`
- Surface: `#1b1915`
- Primary: `#e08549`
- Secondary: `#8da374`
- Tertiary: `#c2a25a`
- Text: `#fef7f0`
- Muted text: `#b2ada6`
- Outline: `#807b76`

### Layout

- Desktop-first responsive shell with a 240px navigation rail.
- Main content max width of 1440px.
- Sticky player at the bottom with a 92px desktop height.
- Dense catalogue rows with generous title line height.
- Expanded player/queue shown in an overlay panel, not a new window.
- Window remains usable from 900×620 upward; narrower layouts collapse the rail.

### Interaction and accessibility

- Minimum 40×40px interactive targets.
- Visible keyboard focus ring.
- Semantic buttons and labels.
- Full keyboard control for playback.
- Reduced-motion preference respected.
- Loading skeletons for data queries.
- Empty states describe the active filter and offer a reset action.
- Errors provide a direct retry or explanation.

## Error handling

- Rust commands return stable error codes and human-readable messages.
- Frontend query boundaries expose loading, empty, and error states.
- Player errors distinguish blocked insecure URL, network failure, unsupported format, and unknown media error.
- Corrupt local state is discarded only for the invalid key, not all user data.

## Testing strategy

### Rust

- Repository query filters and pagination.
- Text normalization.
- Read-only opening behavior.
- Validation and error mapping.
- In-memory fixture database integration tests.

### TypeScript/React

- Storage schema parsing and migration.
- Queue reducer transitions.
- Playback utility calculations.
- Search/filter state.
- Component behavior and accessibility.
- Tauri API client mapping.

### End-to-end smoke

- Launch web build with mocked Tauri commands.
- Search, select, enqueue, favorite, and navigate.
- Validate keyboard shortcuts and theme persistence.

## Build and release

- npm lockfile for deterministic frontend installs.
- Rust lockfile for deterministic backend builds.
- GitHub Actions run format, lint, type check, tests, coverage, Rust tests, production build, and security audit.
- Release workflow creates platform artifacts on tagged releases.
- A complete Git bundle is created and clone-tested.

## Acceptance criteria

- Supplied database is bundled and queried read-only.
- Audio search and teacher browsing work over all 21,402 audio rows.
- Audio playback controls, queue, favorites, history, and resume state work.
- Tailwind CSS v4 is used through the official Vite plugin and CSS-first tokens.
- Tauri 2 capabilities expose no unnecessary privileges.
- Formatting, strict linting, type checking, tests, coverage, and production build pass.
- Project-owned executable code reaches genuine 100% coverage or any external blocker is reported precisely.
- README, architecture diagrams, contribution/security documents, GitHub workflows, and validated Git bundle are included.
