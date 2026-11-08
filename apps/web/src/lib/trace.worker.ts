import init, { trace_rgba } from "../wasm/pkg/vectorlab_wasm.js";

type TraceMessage = {
  id: number;
  pixels: ArrayBuffer;
  width: number;
  height: number;
  options: {
    preset: "logo" | "illustration" | "photo";
    colors: number;
    detail: number;
    smoothness: number;
    pathOmit: number;
  };
};

let wasmReady: Promise<unknown> | undefined;

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<TraceMessage>) => void) | null;
  postMessage: (message: unknown) => void;
};

workerScope.onmessage = async (event: MessageEvent<TraceMessage>) => {
  const { id, pixels, width, height, options } = event.data;
  try {
    wasmReady ??= init();
    await wasmReady;
    const svg = trace_rgba(new Uint8Array(pixels), width, height, JSON.stringify(options));
    workerScope.postMessage({ id, svg });
  } catch (error) {
    workerScope.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
