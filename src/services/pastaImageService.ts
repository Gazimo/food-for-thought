import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

interface PlainPastaImageData {
  pastaName: string;
  region: string;
  pastaDescription: string;
}

interface PastaWithSauceImageData {
  pastaName: string;
  sauceName: string;
  region: string;
  sauceDescription: string;
}

interface ImageGenerationResult {
  imageUrl: string;
  source: "gemini-3-pro-image-preview";
  cost: number;
  prompt: string;
  filename: string;
}

interface UnifiedPastaImagesResult {
  plainImage: ImageGenerationResult;
  sauceImage: ImageGenerationResult;
}

class PastaImageService {
  private ai: GoogleGenAI;
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    // Initialize Supabase client with service role key for storage operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Generate both plain pasta and pasta with sauce images in a single conversation
   * Uses Gemini's conversation context to maintain visual consistency between images
   */
  async generatePastaImages(
    pastaData: PlainPastaImageData,
    sauceData: PastaWithSauceImageData
  ): Promise<UnifiedPastaImagesResult> {
    try {
      console.log("🎨 Starting unified pasta image generation");
      console.log(`   Pasta: ${pastaData.pastaName} from ${pastaData.region}`);
      console.log(`   Sauce: ${sauceData.sauceName}`);
      console.log("");

      // Create prompts
      const plainPrompt = this.createPlainPastaPrompt(pastaData);
      const saucePrompt = this.createPastaWithSaucePromptContinuation(sauceData);

      // Initialize Gemini conversation with image generation config
      console.log("📸 Step 1/2: Plain pasta generation");
      console.log(`   Model: gemini-3-pro-image-preview`);
      console.log(`   Grounding: Enabled (Google Search)`);
      console.log(`   Prompt length: ${plainPrompt.length} chars`);

      const chat = this.ai.chats.create({
        model: "gemini-3-pro-image-preview",
        config: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1k",
          },
          tools: [{googleSearch: {}}],
        },
      });
      
      // Step 1: Generate plain pasta image
      const response1 = await chat.sendMessage({message: plainPrompt});
      const plainImageData = response1.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!plainImageData) {
        throw new Error("No plain pasta image data returned from Gemini");
      }

      const plainImageBuffer = Buffer.from(plainImageData, "base64");
      console.log(`   ✅ Plain image received (${plainImageBuffer.length} bytes)`);
      console.log("");

      // Step 2: Generate sauce image (using conversation context)
      console.log("📸 Step 2/2: Sauce image generation");

      const response2 = await chat.sendMessage({message: saucePrompt});

      const sauceImageData = response2.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!sauceImageData) {
        throw new Error("No sauce image data returned from Gemini");
      }

      const sauceImageBuffer = Buffer.from(sauceImageData, "base64");
      console.log(`   ✅ Sauce image received (${sauceImageBuffer.length} bytes)`);
      console.log("");

      // Upload both images to Supabase
      console.log("💾 Uploading images to Supabase...");

      const { filename: plainFilename, publicUrl: plainPublicUrl } =
        await this.uploadImageBufferToSupabase(
          plainImageBuffer,
          "plain",
          pastaData.pastaName
        );

      const { filename: sauceFilename, publicUrl: saucePublicUrl } =
        await this.uploadImageBufferToSupabase(
          sauceImageBuffer,
          "sauce",
          sauceData.pastaName
        );

      console.log("✅ Both images saved successfully");
      console.log(`   Plain: ${plainFilename}`);
      console.log(`   Sauce: ${sauceFilename}`);

      return {
        plainImage: {
          imageUrl: plainPublicUrl,
          source: "gemini-3-pro-image-preview",
          cost: 0.05, // Placeholder cost
          prompt: plainPrompt,
          filename: plainFilename,
        },
        sauceImage: {
          imageUrl: saucePublicUrl,
          source: "gemini-3-pro-image-preview",
          cost: 0.05, // Placeholder cost
          prompt: saucePrompt,
          filename: sauceFilename,
        },
      };
    } catch (error) {
      console.error(`💥 Unified pasta image generation failed:`, error);
      throw error;
    }
  }

  /**
   * Create prompt for plain pasta (raw, uncooked)
   */
  private createPlainPastaPrompt(data: PlainPastaImageData): string {
    const { pastaName, region, pastaDescription } = data;

    return `Using verified culinary data for authentic ${region} cuisine, generate a studio-quality food photograph. 90-degree top-down view. The background is an elegant, polished walnut wooden table, slightly lighter than mahogany, with a refined glossy finish. The surface is heavily and naturally dusted with white semolina flour, mirroring the density of a professional pasta-making station. In the center, exactly five individual pieces of handmade ${pastaName} pasta are laid clearly with soft overhead lighting. The ${pastaName} must be visually accurate to the ${region} region: ${pastaDescription}`;
  }

  /**
   * Create prompt for pasta with sauce (cooked, plated)
   * This version continues the conversation, referencing the pasta from the previous image
   */
  private createPastaWithSaucePromptContinuation(data: PastaWithSauceImageData): string {
    const { pastaName, sauceName, region, sauceDescription } = data;

    return `Now take the ${pastaName} pasta you just created and present it on a traditional ${region} plate with authentic ${sauceName} sauce. Place the plated dish on the same clean walnut wood table from before. ${sauceDescription} . Maintain the 90-degree overhead view. The pasta should be coated with sauce, traditional portion size. Plate centered on table. Same professional food photography quality, same natural window light from above, same photorealistic style. Clean minimalist composition, no utensils, no napkin, no props. Appetizing presentation.`;
  }

  /**
   * Upload image buffer directly to Supabase Storage (dish-images bucket)
   */
  private async uploadImageBufferToSupabase(
    imageBuffer: Buffer,
    type: "plain" | "sauce",
    pastaName: string
  ): Promise<{ filename: string; publicUrl: string }> {
    try {
      // Generate filename with pasta name and type
      const sanitizedName = pastaName.toLowerCase().replace(/\s+/g, "-");
      const timestamp = Date.now();
      const filename = `pasta-images/${sanitizedName}-${type}-${timestamp}.jpg`;

      // Upload to Supabase Storage (dish-images bucket - same as country game)
      const { error } = await this.supabase.storage
        .from("dish-images")
        .upload(filename, imageBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabase.storage.from("dish-images").getPublicUrl(filename);

      console.log(`💾 Image saved as: ${filename}`);
      return { filename, publicUrl };
    } catch (error) {
      console.error("💥 Failed to upload image to Supabase:", error);
      throw error;
    }
  }
}

export default PastaImageService;
