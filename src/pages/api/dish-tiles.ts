import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import sharp from "sharp";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { dishId, tileIndex } = req.query;

  if (!dishId || !tileIndex) {
    return res.status(400).json({ error: "Missing dishId or tileIndex" });
  }

  try {
    const dishesDir = path.join(process.cwd(), "public", "images", "dishes");

    // Find the image file with the correct extension
    const possibleExtensions = [".png", ".jpg", ".jpeg"];
    let imagePath = "";

    for (const ext of possibleExtensions) {
      const testPath = path.join(dishesDir, `${dishId}${ext}`);
      if (fs.existsSync(testPath)) {
        imagePath = testPath;
        break;
      }
    }

    if (!imagePath) {
      console.error(`Image not found for dishId: ${dishId}`);
      return res.status(404).json({ error: "Image not found" });
    }

    // Get original image
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return res.status(500).json({ error: "Invalid image metadata" });
    }

    // Grid configuration - MUST match client exactly
    const cols = 3;
    const rows = 2;
    const tileNum = parseInt(tileIndex as string);

    if (tileNum < 0 || tileNum >= cols * rows) {
      return res.status(400).json({ error: "Invalid tile index" });
    }

    // First, resize the image to match the 3:2 aspect ratio that the client uses
    // Client calculates: height = (width / 3) * 2, so width:height = 3:2
    const targetAspectRatio = 3 / 2;

    let resizeWidth: number;
    let resizeHeight: number;

    const currentAspectRatio = metadata.width / metadata.height;

    if (currentAspectRatio > targetAspectRatio) {
      // Image is wider than 3:2, fit by height
      resizeHeight = metadata.height;
      resizeWidth = Math.round(resizeHeight * targetAspectRatio);
    } else {
      // Image is taller than 3:2, fit by width
      resizeWidth = metadata.width;
      resizeHeight = Math.round(resizeWidth / targetAspectRatio);
    }

    // Resize image to exact 3:2 aspect ratio
    const resizedImage = image.resize(resizeWidth, resizeHeight, {
      fit: "cover",
      position: "center",
    });

    // Now extract tiles from the resized image
    const row = Math.floor(tileNum / cols);
    const col = tileNum % cols;

    // Calculate tile dimensions
    const tileWidth = Math.floor(resizeWidth / cols);
    const tileHeight = Math.floor(resizeHeight / rows);

    // Calculate position
    const left = col * tileWidth;
    const top = row * tileHeight;

    // For edge tiles, extend to boundary
    const actualWidth = col === cols - 1 ? resizeWidth - left : tileWidth;
    const actualHeight = row === rows - 1 ? resizeHeight - top : tileHeight;

    // Extract the tile
    const tileBuffer = await resizedImage
      .extract({
        left: left,
        top: top,
        width: actualWidth,
        height: actualHeight,
      })
      .jpeg({
        quality: 95,
        progressive: false,
      })
      .toBuffer();

    // Set headers
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");

    return res.send(tileBuffer);
  } catch (error) {
    console.error("Error processing tile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
