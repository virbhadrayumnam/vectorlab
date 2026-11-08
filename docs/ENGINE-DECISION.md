# Tracing engine decision

## Phase 1: ImageTracerJS

The first browser prototype uses ImageTracerJS because it exposes a browser-facing image-to-SVG API and can run without a server. This lets the project establish its import, settings, preview, and export workflow before committing to a more involved engine port.

## Target: VTracer on WebAssembly

VTracer is the intended long-term tracing engine because it offers a stronger foundation for high-quality raster vectorization. The target integration must compile the Rust engine for `wasm32-unknown-unknown` (or another explicitly browser-compatible target), expose a small JavaScript API, and run heavy work in a Web Worker.

Do not bundle a Node.js-only WASM package into the browser build and assume it is compatible. Validate the generated WASM module, browser APIs, memory behavior, and licence before integration.

## Adapter boundary

The UI calls the `traceImage(file, settings)` adapter in `apps/web/src/lib/trace.ts`. Keep engine-specific calls behind this boundary so VTracer can replace the prototype engine without redesigning the workspace.

## Acceptance criteria for VTracer

- Runs in current desktop browsers without a server-side image upload
- Works inside a Web Worker
- Supports cancellation or safe termination for large images
- Reports useful errors rather than freezing the interface
- Produces valid, self-contained SVG
- Has documented build steps and third-party licence notices
- Is benchmarked against a representative set of logos, illustrations, and photographs
