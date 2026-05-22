import { GoogleGenAI } from "@google/genai";
import { ImageGenerator, ImageGenerationOpts, ImageGenerationResult } from "./types";

const MODEL_ID = "imagen-4.0-ultra-generate-001";
const COST_PER_IMAGE_USD = 0.06;

export class GoogleImagen4UltraGenerator implements ImageGenerator {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GoogleImagen4UltraGenerator: missing GEMINI_API_KEY");
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  async generate(prompt: string, opts: ImageGenerationOpts): Promise<ImageGenerationResult> {
    // Only 3:2 is supported by this generator right now (matches our tile aspect).
    if (opts.width !== 1536 || opts.height !== 1024) {
      throw new Error(
        `GoogleImagen4UltraGenerator: unsupported size ${opts.width}x${opts.height}; expected 1536x1024 (3:2)`
      );
    }

    const result = await this.ai.models.generateImages({
      model: MODEL_ID,
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "3:2",
      },
    });

    const imageBytes = result.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) throw new Error("GoogleImagen4UltraGenerator: no image bytes returned");

    // Convert base64 bytes to a data URL so the existing uploadImageToSupabase
    // (which fetches the URL via fetch()) can consume it without code changes.
    const url = `data:image/png;base64,${imageBytes}`;

    return {
      url,
      cost: COST_PER_IMAGE_USD,
      source: "imagen-4-ultra",
    };
  }
}
