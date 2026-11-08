export type TracePreset = "logo" | "illustration" | "photo";

export interface TraceSettings {
  preset: TracePreset;
  colors: number;
  detail: number;
  smoothness: number;
  pathOmit: number;
}

export const defaultTraceSettings: TraceSettings = {
  preset: "logo",
  colors: 4,
  detail: 2,
  smoothness: 0.45,
  pathOmit: 3,
};

interface ColorBin {
  r: number;
  g: number;
  b: number;
  count: number;
}

interface ColorBox {
  bins: ColorBin[];
  range: number;
  population: number;
}

function makePalette(pixels: ImageData, limit: number): number[][] {
  const histogram = new Map<number, ColorBin>();
  const data = pixels.data;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i] >> 3;
    const g = data[i + 1] >> 3;
    const b = data[i + 2] >> 3;
    const key = (r << 10) | (g << 5) | b;
    const bin = histogram.get(key);
    if (bin) {
      bin.count++;
      bin.r += data[i];
      bin.g += data[i + 1];
      bin.b += data[i + 2];
    } else {
      histogram.set(key, { r: data[i], g: data[i + 1], b: data[i + 2], count: 1 });
    }
  }

  const bins = Array.from(histogram.values()).map((bin) => ({
    r: bin.r / bin.count,
    g: bin.g / bin.count,
    b: bin.b / bin.count,
    count: bin.count,
  }));
  if (!bins.length) return [[0, 0, 0]];

  const makeBox = (items: ColorBin[]): ColorBox => {
    const channels = ["r", "g", "b"] as const;
    const ranges = channels.map((channel) => {
      const values = items.map((item) => item[channel]);
      return Math.max(...values) - Math.min(...values);
    });
    return {
      bins: items,
      range: Math.max(...ranges),
      population: items.reduce((sum, item) => sum + item.count, 0),
    };
  };

  const boxes: ColorBox[] = [makeBox(bins)];
  while (boxes.length < Math.max(2, limit)) {
    let targetIndex = -1;
    let score = -1;
    boxes.forEach((box, index) => {
      if (box.bins.length < 2) return;
      const nextScore = box.range * Math.log2(box.population + 1);
      if (nextScore > score) { score = nextScore; targetIndex = index; }
    });
    if (targetIndex < 0) break;

    const box = boxes.splice(targetIndex, 1)[0];
    const channels = ["r", "g", "b"] as const;
    const ranges = channels.map((channel) => {
      const values = box.bins.map((item) => item[channel]);
      return Math.max(...values) - Math.min(...values);
    });
    const channel = channels[ranges.indexOf(Math.max(...ranges))];
    const sorted = [...box.bins].sort((a, b) => a[channel] - b[channel]);
    const midpoint = box.population / 2;
    let accumulated = 0;
    let splitAt = 1;
    for (; splitAt < sorted.length; splitAt++) {
      accumulated += sorted[splitAt - 1].count;
      if (accumulated >= midpoint) break;
    }
    boxes.push(makeBox(sorted.slice(0, splitAt)), makeBox(sorted.slice(splitAt)));
  }

  return boxes.map((box) => {
    const total = box.population || 1;
    return [
      Math.round(box.bins.reduce((sum, item) => sum + item.r * item.count, 0) / total),
      Math.round(box.bins.reduce((sum, item) => sum + item.g * item.count, 0) / total),
      Math.round(box.bins.reduce((sum, item) => sum + item.b * item.count, 0) / total),
    ];
  });
}

function nearestColor(r: number, g: number, b: number, palette: number[][]): number[] {
  let best = palette[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const color of palette) {
    const dr = r - color[0];
    const dg = g - color[1];
    const db = b - color[2];
    const distance = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
    if (distance < bestDistance) { bestDistance = distance; best = color; }
  }
  return best;
}

async function preprocessImage(file: File, settings: TraceSettings): Promise<ImageData> {
  const image = new Image();
  const sourceUrl = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not read this image."));
      image.src = sourceUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    if (settings.preset === "logo") {
      // Quantize anti-aliased logo pixels to a small, stable palette. Fully
      // transparent pixels are normalised so hidden RGB values cannot create
      // stray regions in the trace.
      const palette = makePalette(imageData, settings.colors);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) {
          data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0;
        } else {
          const color = nearestColor(data[i], data[i + 1], data[i + 2], palette);
          data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2]; data[i + 3] = 255;
        }
      }
    } else {
      const alphaThreshold = settings.preset === "illustration" ? 24 : 8;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < alphaThreshold) {
          data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0;
        }
      }
    }

    return imageData;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function traceImage(file: File, settings: TraceSettings): Promise<string> {
  const imageData = await preprocessImage(file, settings);
  const pixels = new Uint8Array(imageData.data);
  const worker = new Worker(new URL("./trace.worker.ts", import.meta.url), { type: "module" });

  return new Promise((resolve, reject) => {
    const cleanup = () => worker.terminate();
    worker.onmessage = (event: MessageEvent<{ id: number; svg?: string; error?: string }>) => {
      cleanup();
      if (event.data.error) reject(new Error(event.data.error));
      else if (event.data.svg) resolve(event.data.svg);
      else reject(new Error("VTracer returned an empty SVG."));
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || "The tracing worker stopped unexpectedly."));
    };
    worker.postMessage({
      id: 1,
      pixels: pixels.buffer,
      width: imageData.width,
      height: imageData.height,
      options: settings,
    }, [pixels.buffer]);
  });
}
