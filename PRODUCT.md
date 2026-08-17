# Dhamma Echo

## Product

Dhamma Echo is a private desktop listening library for Dhamma talks. It helps people find, play, resume, save, and download teachings in Myanmar and English without an account, tracking, or a cloud library.

The product promise is simple: open a calm catalogue, find a trusted voice, and return to listening with as little friction as possible.

## Users and setting

A person uses Dhamma Echo at a quiet desk or at home, usually with a long listening session in mind. They may browse by teacher or collection, search a large catalogue, or immediately resume something familiar. The interface should feel settled and readable in both bright and low ambient light.

## Core journeys

1. Resume a recent talk from Home.
2. Search and filter the complete audio/video catalogue from Explore.
3. Browse teachers and collections, then play a talk.
4. Favorite, queue, or download a talk for a future session.
5. Adjust theme and playback defaults in Settings.

## Platform

- Primary: Tauri 2 desktop application.
- Preview: deterministic Svelte/Vite web runtime.
- Minimum supported window: 860×620.
- Content: bundled read-only SQLite catalogue with approved remote media playback.

## Constraints

- Personal library state stays on the device.
- No accounts, analytics, advertisements, telemetry, remote fonts, or new runtime dependencies.
- Preserve the existing Svelte 5, TypeScript, Rust, Tauri, CSP, and playback architecture.
- Support Myanmar text using installed system fonts and preserve keyboard/focus/reduced-motion behavior.

## Non-goals

- Becoming a social or recommendation platform.
- Adding a second navigation model or a feature-heavy dashboard.
- Replacing the catalogue, media engine, or desktop shell for visual novelty.

## Design register

Product UI with a quiet editorial listening-room register: familiar desktop controls, restrained color, clear hierarchy, and occasional warmth carried by the rust/olive brand accents rather than decoration.
