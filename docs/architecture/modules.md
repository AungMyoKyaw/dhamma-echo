# Modules and trust boundaries

```mermaid
flowchart TB
    subgraph webview[Webview — untrusted UI boundary]
      main[src/main.ts\nDOM and event bootstrap]
      app[src/app.ts\napplication controller]
      store[src/store.ts\ndeterministic state]
      view[src/view.ts\nescaped HTML renderer]
      player[src/player.ts\nHTML audio adapter]
      persistence[src/persistence.ts\nvalidated local state]
      api[src/api.ts\ntyped IPC client]
      main --> app
      app --> store
      app --> view
      app --> player
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
    player -->|HTTPS allowlist| remote[Remote audio]
```

## Boundaries

- The webview never receives a generic SQL command, filesystem path, or shell interface.
- Rust validates identifiers, page limits, language, format, and teacher filters.
- The renderer escapes catalogue strings before inserting them into HTML.
- The audio adapter independently verifies the HTTPS host before playback.
- Local storage data is treated as untrusted and schema-checked on every load.
