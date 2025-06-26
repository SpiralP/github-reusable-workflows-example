#!/bin/sh
set -eux

export CARGO_BUILD_TARGET="$1"

group() {
  echo "::group::$*"
  set -x
  "$@"
  set +x
  echo "::endgroup::"
}

setup_rust() {
  rustup default stable
  rustup component add clippy rustfmt
  rustup target add "$CARGO_BUILD_TARGET"
}

group setup_rust

group cargo clippy --target "$CARGO_BUILD_TARGET"
# group cargo build --target "$CARGO_BUILD_TARGET"
group cargo test --target "$CARGO_BUILD_TARGET" -- --nocapture --test-threads 1
