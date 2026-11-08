declare module "*vectorlab_wasm.js" {
  export default function init(input?: unknown): Promise<unknown>;
  export function trace_rgba(
    pixels: Uint8Array,
    width: number,
    height: number,
    optionsJson: string,
  ): string;
}
