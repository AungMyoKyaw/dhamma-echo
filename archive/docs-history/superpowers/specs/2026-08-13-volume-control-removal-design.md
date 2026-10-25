# Volume Control Removal Design

## Goal

Remove application-level volume controls and let the operating system control playback loudness. Dhamma Echo will use the audio element's native full-volume default instead of maintaining a second, persisted volume level.

## Scope

- Remove the **Default volume** control from Settings.
- Remove the volume icon and slider from the persistent player.
- Remove volume from application settings, actions, controller methods, and persistence.
- Remove the audio engine's volume setter and all calls to it.
- Update tests, user-facing documentation, architecture notes, and privacy text that describe application-managed volume.
- Keep playback speed behavior unchanged.

## Behavior

New and existing users will hear audio at the audio element's standard internal volume of `1` (100%). Actual output loudness remains controlled by the computer's system volume and output-device settings.

Previously saved settings may still contain a `volume` field. Settings loading will ignore that extra legacy field while preserving valid current settings such as playback speed, browse limit, and theme. Settings saving will no longer write `volume`. The settings schema version will remain unchanged because the loader already treats settings as an explicitly selected record and can safely ignore additional properties.

## Architecture and Components

### User interface

`SettingsView` will retain appearance and playback-speed settings but no longer render a default-volume slider. `Player` will retain playback speed, queue, seeking, and transport controls while removing the volume group. Its layout will be adjusted only as needed to avoid spacing left by the removed control.

### Application state and controller

`SettingsState` will no longer contain `volume`. The `set-volume` action, reducer branch, `DhammaApp.setVolume`, and volume-related dispatch/persistence triggers will be deleted. This keeps application state limited to settings users can actually change.

### Audio engine

`AudioEngine.setVolume` will be deleted. Playback setup and source retry paths will no longer assign volume. The underlying audio element will therefore retain its native default volume of `1`.

### Persistence and compatibility

Default settings will omit `volume`. Loading will validate only current settings fields and ignore a legacy `volume` property if present. Saving will omit it. No migration write is required: the next normal settings save naturally replaces the old record without the legacy property.

## Error Handling

Removing volume introduces no new runtime failure modes. Malformed current settings will continue to use existing fallback behavior. A malformed or out-of-range legacy `volume` value will no longer invalidate otherwise valid settings because volume is no longer part of the model.

## Testing

- Update persistence tests to verify defaults and saved records omit `volume`.
- Verify legacy records containing any `volume` value do not affect loading of valid current settings.
- Remove reducer, controller, and audio-engine tests dedicated to setting or clamping volume.
- Update UI assertions so Settings and Player contain no volume controls while their remaining controls stay accessible.
- Run the complete frontend test, lint, type-check, and build suite.

## Documentation

Remove claims that Dhamma Echo provides or stores volume controls from the README, product site, privacy page, changelog where wording describes current capabilities, and architecture documentation. Historical design and verification artifacts remain unchanged because they record earlier behavior.

## Acceptance Criteria

- No visible application volume setting, slider, or icon remains.
- No current TypeScript model, action, controller API, persistence output, or audio-engine API manages volume.
- Existing settings records with a legacy `volume` field load without losing other valid settings.
- Playback uses the audio element's default full internal volume and responds to system volume normally.
- All required checks pass.
