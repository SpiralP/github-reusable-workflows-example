#!/bin/sh
set -eux

export CARGO_BUILD_TARGET="$1"

echo '::group::setup rust'
rustup default stable
rustup component add clippy rustfmt
rustup target add "$CARGO_BUILD_TARGET"
echo '::endgroup::'

echo "::add-matcher::.github/matchers/rust.json"
echo '::group::cargo clippy'
cargo clippy --target "$CARGO_BUILD_TARGET"
echo '::endgroup::'

# echo '::group::cargo build'
# cargo build --target "$CARGO_BUILD_TARGET"
# echo '::endgroup::'

echo '::group::cargo test'
cargo test --target "$CARGO_BUILD_TARGET" -- --nocapture --test-threads 1
echo '::endgroup::'
