import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import OpenAI from "openai";

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
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Supabase client with service role key for storage operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Generate an image for a dish using DALL-E 3 and upload to Supabase
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
        size: "1024x1024", // Keep 1024x1024 for good quality
        quality: "standard", // Use standard instead of hd to reduce cost
        style: "natural",
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error("No image URL returned from DALL-E");
      }

      // Upload image to Supabase Storage
      const { filename, publicUrl } = await this.uploadImageToSupabase(
        imageUrl
      );

      console.log(`✅ Image generated and uploaded to Supabase: ${filename}`);

      return {
        imageUrl: publicUrl,
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

  private createOptimizedPrompt(dishData: DishImageData): string {
    const { name, ingredients, country, blurb, tags } = dishData;
    const text = [...tags, blurb].join(" ").toLowerCase();
    const angle = this.getCameraAngle(text);
    const surface = this.getSurface(text);
    const cookingCue = this.getCookingCue(text);
    const visibleIngredients = ingredients.slice(0, 3).join(", ");

    return (
      `${angle} photograph of ${name}, traditional dish from ${country}. ` +
      `${cookingCue}, plated with ${visibleIngredients}. ` +
      `Soft natural daylight from the left, ${surface} background, ` +
      `shallow depth of field with the plate centered in frame. ` +
      `Editorial food photography, 50mm lens, warm color grading, restaurant magazine quality.`
    );
  }

  private getCameraAngle(text: string): string {
    if (/(soup|stew|ramen|broth|curry)/.test(text)) return "45-degree close-up";
    if (/(street food|handheld|sandwich|taco|burger|wrap)/.test(text)) return "Eye-level close-up";
    return "Overhead";
  }

  private getSurface(text: string): string {
    if (/(fine dining|elegant|refined)/.test(text)) return "dark slate";
    if (/(street food|market|casual)/.test(text)) return "weathered concrete";
    return "rustic weathered wood";
  }

  private getCookingCue(text: string): string {
    const cues: string[] = [];
    if (/(grilled|bbq|charred)/.test(text)) cues.push("deep char marks, glossy marinade");
    if (/fried/.test(text)) cues.push("golden brown crispy crust, light oil sheen");
    if (/(baked|roasted)/.test(text)) cues.push("caramelized crust, deep golden tones");
    if (/steamed/.test(text)) cues.push("tender moist surface, subtle steam rising");
    if (/(creamy|rich)/.test(text)) cues.push("velvety sauce with glossy sheen");
    if (/(noodles|pasta)/.test(text)) cues.push("perfectly twirled strands, sauce clinging to each");
    if (/(soup|stew)/.test(text)) cues.push("rich broth catching the light, ingredients half-submerged");
    if (/(spicy|hot)/.test(text)) cues.push("deep red and orange tones");
    if (/(fresh|salad|raw)/.test(text)) cues.push("vibrant raw textures, glistening dressing");
    return cues.length ? cues.join(", ") : "rich textures and natural colors";
  }

  /**
   * Upload image to Supabase Storage
   */
  private async uploadImageToSupabase(
    imageUrl: string
  ): Promise<{ filename: string; publicUrl: string }> {
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

      // Upload to Supabase Storage
      const { error } = await this.supabase.storage
        .from("dish-images-v2")
        .upload(filename, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabase.storage.from("dish-images-v2").getPublicUrl(filename);

      console.log(`💾 Image saved as: ${filename}`);
      return { filename, publicUrl };
    } catch (error) {
      console.error("💥 Failed to upload image to Supabase:", error);
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
          ", overhead top-down view with dish perfectly centered",
          ", 45-degree elevated angle view with centered composition",
          ", slightly angled view maintaining central focus on the dish",
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

        const { filename, publicUrl } = await this.uploadImageToSupabase(
          imageUrl
        );

        results.push({
          imageUrl: publicUrl,
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
