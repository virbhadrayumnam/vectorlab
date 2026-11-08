# VectorLab

**Free and open-source raster-to-vector studio by Mitrang Technologies.**

VectorLab is a browser-based tool for converting raster images into editable SVG artwork. The project is designed to run locally in the browser. Your source images are not uploaded to a server.

## Project status

Phase 1 foundation is under development. The current prototype includes image import, adjustable tracing settings, an SVG preview, and SVG export.

## Features in this release

- Import PNG, JPEG, and WebP images
- Drag and drop an image onto the workspace
- Adjust colour count, detail thresholds, and path filtering
- Preview the generated SVG
- Download the result as an SVG file
- Process images locally in the browser

## Development

Requirements: Node.js 20.19+ or 22.12+, and npm.

```bash
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
- ImageTracerJS for the initial browser-based tracing engine
- SVG for vector output

### Tracing engine direction

ImageTracerJS is used as the initial browser-compatible engine so the first release can work without a server. The long-term engine target is **VTracer compiled to WebAssembly for the browser**. The VTracer integration will be implemented and benchmarked separately; a Node-targeted WASM package must not be assumed to work in a browser.

## Privacy

Image decoding and tracing happen in the browser. VectorLab does not currently include an upload API, analytics service, or remote image-processing backend.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ENGINE-DECISION.md](docs/ENGINE-DECISION.md).

## Contributing

Issues and pull requests are welcome. Please include browser details and a sample image when reporting a tracing problem. Do not include private or sensitive images.

## License

VectorLab is released under the MIT License. See [LICENSE](LICENSE).
