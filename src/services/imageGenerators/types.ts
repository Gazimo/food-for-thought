export interface ImageGenerationOpts {
  width: number;
  height: number;
}

export interface ImageGenerationResult {
  /** Direct URL to the generated image (typically expires; consumers re-host). */
  url: string;
  /** Cost of this single generation in USD. */
  cost: number;
  /** Provider/model identifier for downstream tracking. */
  source: string;
}

export interface ImageGenerator {
  generate(prompt: string, opts: ImageGenerationOpts): Promise<ImageGenerationResult>;
}
