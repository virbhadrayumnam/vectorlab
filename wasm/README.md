# VectorLab WebAssembly tracing engine

This crate wraps the official VTracer 1.0 Rust library for browser use. It accepts decoded RGBA pixels from the browser and returns SVG. It does not perform file I/O or upload images.

Build from the repository root:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
npm run build:wasm
```

The generated browser package is written to `apps/web/src/wasm/pkg`. The generated package is a build output and is not committed.

VTracer is licensed under MIT OR Apache-2.0. See the upstream VTracer repository and the crate metadata for the full terms.
