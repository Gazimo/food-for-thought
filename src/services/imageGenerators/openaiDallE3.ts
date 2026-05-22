import OpenAI from "openai";
import { ImageGenerator, ImageGenerationOpts, ImageGenerationResult } from "./types";

export class OpenAIDallE3Generator implements ImageGenerator {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OpenAIDallE3Generator: missing OPENAI_API_KEY");
    this.openai = new OpenAI({ apiKey: key });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generate(prompt: string, _opts: ImageGenerationOpts): Promise<ImageGenerationResult> {
    // DALL-E 3 only supports a fixed set of resolutions; we keep it on the
    // historical 1024x1024 for backwards-compatibility with existing tiles.
    const response = await this.openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural",
    });

    const url = response.data?.[0]?.url;
    if (!url) throw new Error("OpenAIDallE3Generator: no image URL returned");

    return {
      url,
      cost: 0.04,
      source: "dall-e-3",
    };
  }
}
