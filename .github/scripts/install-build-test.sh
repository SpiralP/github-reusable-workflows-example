#!/bin/sh
set -eux

export CARGO_BUILD_TARGET="$1"

rustup default stable
rustup component add rustfmt
rustup target add "$CARGO_BUILD_TARGET"

cargo check --target "$CARGO_BUILD_TARGET"

cargo build --target "$CARGO_BUILD_TARGET"

cargo test --target "$CARGO_BUILD_TARGET" -- --nocapture --test-threads 1
