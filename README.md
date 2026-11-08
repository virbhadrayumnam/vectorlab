# VectorLab

**Free and open-source raster-to-vector studio by Mitrang Technologies.**

VectorLab is a browser-based tool for converting raster images into editable SVG artwork. The project is designed to run locally in the browser. Your source images are not uploaded to a server.

## Project status

Phase 1 foundation is under development. The current prototype includes image import, adjustable tracing settings, an SVG preview, and SVG export.

## Features in this release

- Import PNG, JPEG, and WebP images
- Drag and drop an image onto the workspace
- Choose Logo, Illustration, or Photo tracing presets
- Adjust colour count, curve simplification, detail, and speckle filtering
- Preview the generated SVG
- Download the result as an SVG file
- Process images locally in the browser

## Development

Requirements: Node.js 22.12+, npm, Rust stable, the `wasm32-unknown-unknown` target, and `wasm-pack`.

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
npm install
npm run dev
```

Open the local URL printed by Vite.

To create a production build:

```bash
npm run build
npm run preview
```

## Technology

- React and TypeScript
- Vite
- VTracer 1.0 Rust engine compiled to browser WebAssembly
- Web Worker for background tracing
- SVG for vector output

### Tracing engine direction

VectorLab wraps the official VTracer 1.0 Rust library in a small `wasm-bindgen` crate. It is compiled specifically for `wasm32-unknown-unknown` with the `web` target and runs in a browser Web Worker. The Node.js npm package is not used in the browser build.

## Privacy

Image decoding and tracing happen in the browser. VectorLab does not currently include an upload API, analytics service, or remote image-processing backend.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ENGINE-DECISION.md](docs/ENGINE-DECISION.md).

## Contributing

Issues and pull requests are welcome. Please include browser details and a sample image when reporting a tracing problem. Do not include private or sensitive images.

## License

VectorLab is released under the MIT License. See [LICENSE](LICENSE).
