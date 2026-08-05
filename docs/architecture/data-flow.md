# Catalogue and playback data flow

## Search sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as TypeScript UI
    participant IPC as Tauri command
    participant DB as Read-only SQLite

    User->>UI: Submit query and filters
    UI->>UI: Reset offset and enter loading state
    UI->>IPC: search_audio(request)
    IPC->>IPC: Validate limit, ID, language, format
    IPC->>DB: Parameterized COUNT query
    DB-->>IPC: Total rows
    IPC->>DB: Parameterized page query
    DB-->>IPC: Normalized tracks
    IPC->>IPC: Mark only approved MP3 host records playable
    IPC-->>UI: AudioSearchPage
    UI-->>User: Escaped rows, paging controls, playable state
```

## Playback sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as App controller
    participant Guard as Media URL guard
    participant Audio as HTMLAudioElement
    participant Primary as www.dhammadownload.com
    participant Fallback as dhammadownload.com
    participant Local as Local storage

    User->>UI: Press Play
    UI->>Local: Record history and load resume position
    UI->>Guard: Validate format, scheme, host, port, credentials
    Guard->>Guard: Upgrade HTTP to HTTPS and encode path
    Guard-->>UI: Primary and fallback HTTPS candidates
    UI->>Audio: Set primary source, volume, rate, then play
    Audio->>Primary: Request media stream
    alt Primary succeeds
        Primary-->>Audio: Audio bytes and metadata
    else Primary fails
        Audio-->>UI: Media error
        UI->>Audio: Set fallback source and play
        Audio->>Fallback: Request media stream
        Fallback-->>Audio: Audio bytes or final error
    end
    Audio-->>UI: loadedmetadata/play/pause/timeupdate/ended/error
    UI->>Audio: Apply bounded resume after metadata
    UI->>Local: Persist throttled resume position
    UI-->>User: Update compact player, queue, loading, and retry states
```

The database does not contain duration metadata. Resume is applied only after the audio element exposes media metadata. Completion resets the saved position to zero so replaying a finished talk starts from the beginning.
