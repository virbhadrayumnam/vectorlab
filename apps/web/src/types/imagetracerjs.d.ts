declare module "imagetracerjs" {
  interface TraceOptions {
    numberofcolors?: number;
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    scale?: number;
    viewbox?: boolean;
    desc?: boolean;
    rightangleenhance?: boolean;
    linefilter?: boolean;
    strokewidth?: number;
    roundcoords?: number;
  }

  interface ImageTracer {
    imageToSVG(
      image: HTMLImageElement,
      callback: (svg: string) => void,
      options?: TraceOptions,
    ): void;
  }

  const ImageTracer: ImageTracer;
  export default ImageTracer;
}
