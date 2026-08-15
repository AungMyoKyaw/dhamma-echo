# Modules and trust boundaries

```mermaid
flowchart TB
    subgraph webview[Webview — untrusted UI boundary]
      entry[src/entry.ts\nVite browser entry]
      main[src/main.ts\nSvelte bootstrap]
      svelte[src/App.svelte + components/views\nSvelte 5 presentation]
      app[src/app.ts\napplication controller]
      store[src/store.ts\ndeterministic state]
      ui[src/ui.ts\npure presentation helpers]
      player[src/player.ts\nHTML media adapter\n(audio + video)]
      urls[src/utils.ts\nmedia URL allowlist and normalization]
      persistence[src/persistence.ts\nvalidated local state]
      api[src/api.ts\ntyped IPC client]
      entry --> main
      main --> svelte
      main --> app
      app --> store
      svelte --> app
      svelte --> ui
      app --> player
      player --> urls
      app --> persistence
      app --> api
    end

    subgraph rust[Tauri/Rust — trusted native boundary]
      commands[src-tauri/src/commands.rs\nnarrow command surface]
      db[src-tauri/src/db.rs\nvalidated parameterized queries]
      models[src-tauri/src/models.rs\nserialized DTOs]
      commands --> db
      db --> models
    end

    api -->|Tauri IPC| commands
    db -->|read-only| sqlite[(Bundled SQLite)]
    player -->|HTTPS allowlist: bare and www hosts| remote[Remote MP3 audio and MP4 video]
```

## Boundaries

- Svelte renders catalogue strings as text nodes; the application does not use `{@html}` for catalogue content.
- The webview never receives a generic SQL command, filesystem path, or shell interface.
- Rust validates identifiers, page limits, language, format, and teacher filters.
- Rust marks only MP3 and MP4 records on the approved Dhamma Download hostnames as playable. Audio and video rows are both returned by `search_audio` and `get_audio_track`; collections, teacher summaries, and audio categories continue to count audio rows only.
- The media adapter reparses every URL, rejects credentials and custom ports, upgrades approved HTTP records to HTTPS, removes fragments, encodes paths, and exposes only two approved HTTPS candidates for MP3 and MP4 sources.
- The Tauri CSP permits media from those two HTTPS origins only.
- Local storage data is treated as untrusted and schema-checked on every load.
