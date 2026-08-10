# Light-Only Interface Design

Date: 2026-08-10
Status: Approved

## Goal

Dhamma Echo will support one appearance: the existing warm light palette. Users will no longer see or store an appearance choice, and the application will never react to the operating system's dark-mode preference.

## Runtime changes

- Remove the header theme-cycle button.
- Remove the Appearance card and Theme selector from Settings.
- Remove the `Theme` type, `set-theme` action, theme state, theme event handling, `applyTheme` dependency, and system color-scheme listener.
- Remove dark-mode CSS tokens, the custom dark variant, and dark-only utility usage.
- Keep playback speed and volume settings unchanged.

## Stored-settings migration

The settings storage key and schema version remain unchanged. Loading an older record ignores its `theme` field and preserves valid `playbackRate` and `volume` values. Saving settings writes only `version`, `playbackRate`, and `volume`. Invalid playback or volume data still falls back to the existing defaults.

## Documentation

Current README and product-site copy will describe the single calm light interface. Historical implementation plans, specifications, and verification records remain unchanged because they document prior releases.

## Testing

Tests will prove that:

- old settings containing `system`, `light`, `dark`, or an unknown theme migrate without losing valid playback and volume values;
- saved settings omit `theme`;
- application startup and settings changes no longer call theme hooks;
- rendered Home and Settings views contain no theme controls;
- compiled CSS contains no runtime dark-mode selector or dark error utility.

The complete project verification suite must pass before the change is published.
