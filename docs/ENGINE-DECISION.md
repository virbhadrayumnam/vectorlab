# Tracing engine decision

## Selected engine: VTracer 1.0 on browser WebAssembly

VectorLab now wraps the official VTracer 1.0 Rust library in the small `wasm/` crate. The wrapper accepts decoded RGBA pixels and returns SVG. It is compiled specifically for `wasm32-unknown-unknown` using `wasm-pack --target web`; it does not use the Node.js-targeted npm distribution.

Upstream: https://github.com/visioncortex/vtracer

## Why VTracer

VTracer provides spline curve fitting, polygon and pixel fitting modes, curve simplification, speckle filtering, palette quantization, and SVG output optimization. These capabilities directly address the excessive anchor points and uneven contours seen in the first VectorLab exports.

## Browser architecture

1. The browser decodes the selected image and applies preset-specific alpha and palette preprocessing.
2. The image's RGBA pixel buffer is transferred to a dedicated Web Worker.
3. The worker loads the VTracer WebAssembly module and performs vectorization.
4. The worker returns SVG text to the React interface for preview and download.

The original image is not uploaded. The worker is terminated after each trace.

## Presets

- Logo: spline fitting, limited palette, tighter curve simplification, and small-speckle filtering.
- Illustration: spline fitting with more colour and detail retention.
- Photo: spline fitting with a larger palette and stronger small-region filtering.

The current UI sliders map to VTracer's colour count, segment length, curve simplification tolerance, and speckle filter. The mapping will be refined after visual benchmarking.

## Build requirements

- Node.js 22.12+ and npm
- Stable Rust toolchain
- `wasm32-unknown-unknown` Rust target
- `wasm-pack`

From the repository root:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
npm install
npm run build:wasm
npm run dev
```

The generated package is written to `apps/web/src/wasm/pkg` and is not committed.

## Acceptance and quality validation

The Mitrang logo is the first benchmark image. Compare the SVG in Illustrator at high zoom and check:

- Smooth circular contours and letter curves
- Crisp corners and straight edges
- No stray transparent or near-invisible paths
- Correct colour separation and transparent background
- Lower anchor-point count without visible shape distortion
- Valid SVG import in Illustrator and Inkscape

VTracer improves the curve-fitting foundation, but no automatic tracer can guarantee a perfect reconstruction of every raster logo. For exact brand artwork, the original vector master remains the reference.
