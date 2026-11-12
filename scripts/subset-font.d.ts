declare module "subset-font" {
  interface Options {
    targetFormat?: "sfnt" | "woff" | "woff2" | "truetype";
    preserveNameIds?: number[];
    variationAxes?: Record<string, number | { min: number; max: number; default?: number }>;
    noLayoutClosure?: boolean;
    noHinting?: boolean;
    keepFeatures?: string[];
    dropTables?: string[];
  }
  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: Options,
  ): Promise<Buffer>;
}
