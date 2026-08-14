.PHONY: install dev dev-web build test test-coverage verify ci format lint typecheck clean package

## install: Install JS dependencies (frozen, no scripts)
install:
	bun install --frozen-lockfile --ignore-scripts

## dev: Run the Tauri app in development
dev:
	bun run dev

## dev-web: Run the webview in a plain browser (no Tauri shell)
dev-web:
	bun run dev:web

## build: Build the webview bundle
build:
	bun run build

## test: Run unit tests
test:
	bun run test

## test-coverage: Run unit tests with coverage enforcement
test-coverage:
	bun run test:coverage

## verify: Full verification gate (web, site, Rust)
verify:
	bun run verify

## ci: CI pipeline checks (web only, matches GitHub Actions)
ci:
	bun run ci

## format: Format web sources and Rust
format:
	bun run format

## lint: Lint web sources
lint:
	bun run lint

## typecheck: Type-check Svelte and TypeScript
typecheck:
	bun run typecheck

## package: Build native installers
package:
	bun run package

## clean: Remove build artifacts
clean:
	bun run clean
