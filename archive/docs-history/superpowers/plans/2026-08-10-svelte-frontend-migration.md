# Svelte Frontend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the desktop HTML-string frontend with Svelte 5 + Vite without changing product behavior or native boundaries.

**Architecture:** Keep `DhammaApp` and the reducer as the behavior/state core. Publish controller state into a Svelte store and render it through route components. Use Vite for Tauri-compatible static output.

**Tech Stack:** Svelte 5, Vite, TypeScript, Tailwind CSS v4, Tauri 2, Bun.

## Tasks

- [x] Add Svelte/Vite/Tailwind-Vite configuration and preserve the Bun/Tauri command contract.
- [x] Add Svelte bootstrap and pure runtime/UI helpers.
- [x] Port navigation, Home, Explore, Teachers, Collections, detail, Library, Settings, player, and queue surfaces to Svelte components.
- [x] Remove `src/view.ts`, delegated DOM events, and custom web build/dev scripts.
- [x] Replace renderer-specific tests with behavior tests for the new Svelte boundary while keeping core domain tests.
- [x] Update architecture, README, changelog, smoke checks, and Ralph Loop.
- [ ] Regenerate `bun.lock`, run Svelte compiler/lint/format/build/audit gates, and visually verify the built UI in an environment with the required package toolchain.
- [ ] Run Rust gates in an environment with Cargo.
- [x] Create, verify, and clone-test the Git bundle deliverable.
