import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { Database } from "../src/types/database";

// Load environment variables from .env.local and .env files
dotenv.config({ path: ".env.local" });
dotenv.config();

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- IMPORTANT ---
// Set this to the absolute directory path where your local dish images are stored.
const LOCAL_IMAGES_SOURCE_DIR =
  "/Users/OmriHarel/private-repos/food-for-thought/public/images/dishes";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const DISH_IMAGES_DIR = path.join(PUBLIC_DIR, "images", "dishes");
const TILE_IMAGES_DIR = path.join(PUBLIC_DIR, "images", "tiles");

class ImageMigrator {
  constructor() {
    console.log("Image Migrator initialized.");
  }

  public async migrate() {
    console.log("🚀 Starting image migration to Vercel CDN...");

    // 1. Ensure directories exist
    await this.ensureDirectories();

    // 2. Fetch all dishes
    const dishes = await this.getAllDishes();
    console.log(`Found ${dishes.length} dishes to process.`);

    // 3. Process each dish
    for (const dish of dishes) {
      await this.processDish(dish);
    }

    console.log("✅ Migration completed successfully!");
  }

  private async ensureDirectories() {
    console.log("  Ensuring output directories exist...");
    await fs.mkdir(DISH_IMAGES_DIR, { recursive: true });
    await fs.mkdir(TILE_IMAGES_DIR, { recursive: true });
  }

  private async getAllDishes() {
    console.log("  Fetching all dishes from the database...");
    const { data: dishes, error } = await supabase.from("dishes").select("*");
    if (error) {
      console.error("Error fetching dishes:", error);
      throw error;
    }
    return dishes || [];
  }

  private async processDish(dish: any) {
    console.log(`\nProcessing dish #${dish.id}: ${dish.name}`);

    if (!dish.image_url) {
      console.log("  ⏩ Skipping: No image URL found.");
      return;
    }

    let imageBuffer: Buffer | undefined;

    // --- Step 1: Get the image buffer (from local file or download) ---
    try {
      const imageUrl = new URL(dish.image_url);
      const filename = path.basename(imageUrl.pathname);
      const localImagePath = path.join(LOCAL_IMAGES_SOURCE_DIR, filename);

      await fs.access(localImagePath); // Check for existence
      console.log(`  ✅ Found local image: ${filename}`);
      imageBuffer = await fs.readFile(localImagePath);
    } catch (localError) {
      console.log(
        `  ⚠️  Local image not found for dish ${dish.id}. Attempting download...`
      );
      if (!dish.image_url.includes("supabase.co")) {
        console.log(
          "  ⏩ Skipping: Image is not on Supabase and not found locally."
        );
        return;
      }

      try {
        const imageResponse = await fetch(dish.image_url);
        if (!imageResponse.ok)
          throw new Error(`Fetch failed with status ${imageResponse.status}`);
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        console.log(`  ⬇️  Successfully downloaded image from Supabase.`);
      } catch (downloadError) {
        console.error(
          `  ❌ Failed to download image for dish #${dish.id}:`,
          downloadError
        );
        return; // Give up on this dish
      }
    }

    // --- Step 2: Process the image buffer ---
    try {
      if (!imageBuffer) {
        console.error(
          `  ❌ Could not retrieve image buffer for dish #${dish.id}. Skipping.`
        );
        return;
      }

      const imageUrl = new URL(dish.image_url);
      const filename = path.basename(imageUrl.pathname);
      const imageExtension = path.extname(filename) || ".png";

      // Save original image to the project's public directory
      const newImageFilename = `${dish.id}${imageExtension}`;
      const newImagePath = path.join(DISH_IMAGES_DIR, newImageFilename);
      await fs.writeFile(newImagePath, imageBuffer);
      console.log(`  💾 Saved new image to: ${newImagePath}`);

      // Update database
      const newPublicUrl = `/images/dishes/${newImageFilename}`;
      console.log(`  🔄 Updating database with new URL: ${newPublicUrl}`);
      const { error: updateError } = await supabase
        .from("dishes")
        .update({ image_url: newPublicUrl })
        .eq("id", dish.id);

      if (updateError) {
        throw new Error(`Failed to update dish URL: ${updateError.message}`);
      }

      // Generate and save tiles
      console.log("  🎨 Generating and saving tiles...");
      await this.generateAndSaveTiles(dish, imageBuffer);

      console.log(`  ✅ Successfully processed dish #${dish.id}`);
    } catch (processingError) {
      console.error(`  ❌ Error processing dish #${dish.id}:`, processingError);
    }
  }

  private async generateAndSaveTiles(dish: any, imageBuffer: Buffer) {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Invalid image metadata");
    }

    const targetAspectRatio = 3 / 2;
    const currentAspectRatio = metadata.width / metadata.height;

    let resizeWidth: number;
    let resizeHeight: number;

    if (currentAspectRatio > targetAspectRatio) {
      resizeHeight = metadata.height;
      resizeWidth = Math.round(resizeHeight * targetAspectRatio);
    } else {
      resizeWidth = metadata.width;
      resizeHeight = Math.round(resizeWidth / targetAspectRatio);
    }

    const cols = 3;
    const rows = 2;

    for (let tileIndex = 0; tileIndex < 6; tileIndex++) {
      const row = Math.floor(tileIndex / cols);
      const col = tileIndex % cols;

      const tileWidth = Math.floor(resizeWidth / cols);
      const tileHeight = Math.floor(resizeHeight / rows);

      const left = col * tileWidth;
      const top = row * tileHeight;
      const actualWidth = col === cols - 1 ? resizeWidth - left : tileWidth;
      const actualHeight = row === rows - 1 ? resizeHeight - top : tileHeight;

      const baseImage = image.resize(resizeWidth, resizeHeight, {
        fit: "cover",
        position: "center",
      });

      // Generate regular tile
      const regularTileBuffer = await baseImage
        .clone()
        .extract({ left, top, width: actualWidth, height: actualHeight })
        .jpeg({ quality: 95, progressive: false })
        .toBuffer();

      // Generate blurred tile
      const blurredTileBuffer = await baseImage
        .clone()
        .extract({ left, top, width: actualWidth, height: actualHeight })
        .blur(40)
        .modulate({ brightness: 0.8, saturation: 0.6 })
        .jpeg({ quality: 40 })
        .toBuffer();

      // Save tiles to public directory
      const dishTileDir = path.join(TILE_IMAGES_DIR, String(dish.id));
      await fs.mkdir(dishTileDir, { recursive: true });

      const regularTilePath = path.join(
        dishTileDir,
        `regular-${tileIndex}.jpg`
      );
      await fs.writeFile(regularTilePath, regularTileBuffer);

      const blurredTilePath = path.join(
        dishTileDir,
        `blurred-${tileIndex}.jpg`
      );
      await fs.writeFile(blurredTilePath, blurredTileBuffer);
    }
    console.log(`    ✅ Generated and saved 6 regular and 6 blurred tiles.`);
  }
}

const migrator = new ImageMigrator();
migrator.migrate().catch(console.error);
