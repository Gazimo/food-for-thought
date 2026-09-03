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
  // DALL-E 3 was retired and removed from the OpenAI API; gpt-image-2 is the
  // current replacement. GPT image models only return base64 data (no `url`,
  // no `style`, no DALL-E-3-style `response_format` param).
  const response = await this.openai.images.generate({
    model: "gpt-image-2",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "medium",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAIDallE3Generator: no image data returned");

  const url = `data:image/png;base64,${b64}`;

  return {
    url,
    cost: 0.04,
    source: "gpt-image-2",
  };
}
}
