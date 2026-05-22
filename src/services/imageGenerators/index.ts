import { GoogleImagen4UltraGenerator } from "./googleImagen4Ultra";
import { OpenAIDallE3Generator } from "./openaiDallE3";
import { ImageGenerator } from "./types";

export type { ImageGenerator, ImageGenerationOpts, ImageGenerationResult } from "./types";
export { GoogleImagen4UltraGenerator, OpenAIDallE3Generator };

/**
 * Returns the configured default ImageGenerator.
 * Set IMAGE_GENERATOR=dall-e-3 in env to fall back to the old path
 * (e.g. for emergency rollback). Defaults to Imagen 4 Ultra.
 */
export function createDefaultImageGenerator(): ImageGenerator {
  const which = (process.env.IMAGE_GENERATOR ?? "imagen-4-ultra").toLowerCase();
  switch (which) {
    case "dall-e-3":
      return new OpenAIDallE3Generator();
    case "imagen-4-ultra":
    default:
      return new GoogleImagen4UltraGenerator();
  }
}
