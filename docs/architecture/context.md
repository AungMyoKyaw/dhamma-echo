# System context

```mermaid
flowchart LR
    listener[Listener] -->|browse, search, play| app[Dhamma Echo desktop app]
    app -->|read-only catalogue queries| db[(Bundled dhamma.db)]
    app -->|HTTPS audio stream after user action| media[dhammadownload.com]
    app -->|favorites, history, resume, settings| storage[(Local storage)]

    subgraph device[User device trust boundary]
      app
      db
      storage
    end
```

The application has no account service, cloud database, analytics endpoint, updater service, or background daemon. The only external runtime dependency is the selected remote audio stream.
