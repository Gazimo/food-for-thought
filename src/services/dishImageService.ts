import crypto from "crypto";
import fs from "fs/promises";
import OpenAI from "openai";
import path from "path";

interface DishImageData {
  name: string;
  ingredients: string[];
  country: string;
  blurb: string;
  tags: string[];
}

interface ImageGenerationResult {
  imageUrl: string;
  source: "dall-e-3";
  cost: number;
  prompt: string;
  filename: string;
}

class DishImageService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate an image for a dish using DALL-E 3
   */
  async generateDishImage(
    dishData: DishImageData
  ): Promise<ImageGenerationResult> {
    try {
      console.log(`🎨 Generating image for: ${dishData.name}`);

      const prompt = this.createOptimizedPrompt(dishData);
      console.log(`📝 Using prompt: ${prompt.substring(0, 100)}...`);

      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
      });

      const imageUrl = response.data?.[0]?.url || "/images/404.png";

      // Download and save the image with MD5 hash filename
      const filename = await this.downloadAndHashImage(imageUrl);

      console.log(`✅ Image generated and saved: ${filename}`);

      return {
        imageUrl: `/images/dishes/${filename}`,
        source: "dall-e-3",
        cost: 0.04, // Current DALL-E 3 pricing for 1024x1024
        prompt: prompt,
        filename: filename,
      };
    } catch (error) {
      console.error(`💥 Image generation failed for ${dishData.name}:`, error);
      throw error;
    }
  }

  /**
   * Create an optimized prompt that matches your existing image style
   */
  private createOptimizedPrompt(dishData: DishImageData): string {
    const { name, ingredients, country, blurb, tags } = dishData;

    // Base style that matches your existing images
    const baseStyle =
      "professional food photography, overhead or 45-degree elevated angle view, natural lighting, rustic wooden table or neutral background, high resolution, detailed textures, appetizing presentation, vibrant colors";

    // Get dish-specific styling cues
    const dishStyle = this.getDishStyle(tags, blurb);

    // Focus on primary ingredients (first 3-4 for specificity)
    const primaryIngredients = ingredients.slice(0, 4).join(", ");
    const ingredientNote =
      ingredients.length > 4
        ? ` featuring ${primaryIngredients} among other ingredients`
        : ` made with ${primaryIngredients}`;

    return `A beautiful, appetizing photograph of ${name}, a traditional dish from ${country}${ingredientNote}. ${dishStyle}${baseStyle}. Restaurant-quality plating, mouth-watering presentation. No text, watermarks, people, or artificial elements in the image.`;
  }

  /**
   * Extract visual styling cues from tags and blurb
   */
  private getDishStyle(tags: string[], blurb: string): string {
    const styles: string[] = [];
    const allText = [...tags, blurb.toLowerCase()].join(" ").toLowerCase();

    // Cooking method styling
    if (allText.includes("fried")) {
      styles.push("golden brown crispy exterior with slight oil shine");
    }
    if (allText.includes("grilled")) {
      styles.push("beautiful charred grill marks and smoky appearance");
    }
    if (allText.includes("steamed")) {
      styles.push("moist tender texture with visible steam");
    }
    if (allText.includes("baked")) {
      styles.push("golden brown crust from oven baking");
    }
    if (allText.includes("roasted")) {
      styles.push("caramelized roasted exterior");
    }

    // Texture and appearance
    if (allText.includes("creamy") || allText.includes("rich")) {
      styles.push("rich creamy sauce with smooth texture");
    }
    if (allText.includes("crispy") || allText.includes("crunchy")) {
      styles.push("visible crispy crunchy textures");
    }
    if (allText.includes("fresh")) {
      styles.push("bright fresh vibrant colors");
    }
    if (allText.includes("spicy") || allText.includes("hot")) {
      styles.push("vibrant colors suggesting heat and spice");
    }

    // Presentation style
    if (allText.includes("soup") || allText.includes("stew")) {
      styles.push("served in a beautiful deep bowl with steam rising");
    }
    if (allText.includes("salad")) {
      styles.push("fresh colorful vegetables with light glistening dressing");
    }
    if (allText.includes("noodles") || allText.includes("pasta")) {
      styles.push("perfectly cooked noodles with visible texture");
    }
    if (allText.includes("rice")) {
      styles.push("fluffy individual rice grains visible");
    }
    if (allText.includes("street food") || allText.includes("handheld")) {
      styles.push("casual authentic street food presentation");
    }

    return styles.length > 0 ? styles.join(", ") + ". " : "";
  }

  /**
   * Download image and save with MD5 hash filename (matching your existing pattern)
   */
  private async downloadAndHashImage(imageUrl: string): Promise<string> {
    try {
      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate MD5 hash for filename (matching your existing naming pattern)
      const hash = crypto.createHash("md5").update(buffer).digest("hex");
      const filename = `${hash}.png`;

      // Ensure the dishes directory exists
      const dishesDir = path.join(process.cwd(), "public", "images", "dishes");
      await fs.mkdir(dishesDir, { recursive: true });

      // Save the image
      const filepath = path.join(dishesDir, filename);
      await fs.writeFile(filepath, buffer);

      console.log(`💾 Image saved as: ${filename}`);
      return filename;
    } catch (error) {
      console.error("💥 Failed to download and save image:", error);
      throw error;
    }
  }

  /**
   * Generate multiple image variations and let user choose
   */
  async generateImageVariations(
    dishData: DishImageData,
    count: number = 2
  ): Promise<ImageGenerationResult[]> {
    const results: ImageGenerationResult[] = [];

    for (let i = 0; i < count; i++) {
      try {
        console.log(
          `🎨 Generating variation ${i + 1}/${count} for ${dishData.name}`
        );

        // Add slight variation to prompt for different compositions
        const basePrompt = this.createOptimizedPrompt(dishData);
        const variations = [
          ", overhead top-down view",
          ", 45-degree elevated angle view",
          ", slightly angled side view",
        ];
        const prompt = basePrompt + variations[i % variations.length];

        const response = await this.openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural",
        });

        const imageUrl = response.data?.[0]?.url || "/images/404.png";

        const filename = await this.downloadAndHashImage(imageUrl);

        results.push({
          imageUrl: `/images/dishes/${filename}`,
          source: "dall-e-3",
          cost: 0.04,
          prompt: prompt,
          filename: filename,
        });

        // Small delay between requests to be respectful
        if (i < count - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to generate variation ${i + 1}:`, error);
      }
    }

    return results;
  }
}

export default DishImageService;