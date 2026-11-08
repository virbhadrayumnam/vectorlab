import ImageTracer from "imagetracerjs";

export interface TraceSettings {
  colors: number;
  detail: number;
  smoothness: number;
  pathOmit: number;
}

export const defaultTraceSettings: TraceSettings = {
  colors: 16,
  detail: 1,
  smoothness: 1,
  pathOmit: 8,
};

export function traceImage(file: File, settings: TraceSettings): Promise<string> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        ImageTracer.imageToSVG(
          image,
          (svg) => {
            URL.revokeObjectURL(sourceUrl);
            if (!svg || !svg.includes("<svg")) {
              reject(new Error("The tracing engine did not return a valid SVG."));
              return;
            }
            resolve(svg);
          },
          {
            numberofcolors: settings.colors,
            ltres: settings.detail,
            qtres: settings.smoothness,
            pathomit: settings.pathOmit,
            scale: 1,
            viewbox: true,
            desc: false,
            rightangleenhance: true,
            linefilter: true,
            roundcoords: 1,
          },
        );
      } catch (error) {
        URL.revokeObjectURL(sourceUrl);
        reject(error instanceof Error ? error : new Error("Unable to trace this image."));
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("The selected image could not be opened."));
    };

    image.src = sourceUrl;
  });
}
