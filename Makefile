.PHONY: dev build test verify format lint package package-macos package-linux clean

## dev: Run Dhamma Echo in development
dev:
	cargo run --locked

## build: Build the optimized release executable
build:
	cargo build --release --locked

## test: Run Rust unit tests
test:
	cargo test --locked

## format: Format Rust sources
format:
	cargo fmt

## lint: Run rustfmt check and clippy
lint:
	cargo fmt -- --check
	cargo clippy --locked --all-targets -- -D warnings

## verify: Full verification gate (format, clippy, tests)
verify: lint test

## package: Package for the current Unix platform (macOS or Linux)
package:
	@if [ "$$(uname -s)" = "Darwin" ]; then \
		bash scripts/package-macos.sh; \
	else \
		bash scripts/package-linux.sh; \
	fi

## package-macos: Build ad-hoc signed macOS .app bundle and .dmg installer
package-macos:
	bash scripts/package-macos.sh

## package-linux: Build Linux .tar.gz tarball and .deb package
package-linux:
	bash scripts/package-linux.sh

## clean: Remove build and packaging artifacts
clean:
	rm -rf target dist
