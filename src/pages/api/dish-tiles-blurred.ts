// pages/api/dish-tiles-blurred.ts
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

    const image = sharp(imagePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return res.status(500).json({ error: "Invalid image metadata" });
    }

    // Aspect-ratio-corrected crop
    const cols = 3;
    const rows = 2;
    const tileNum = parseInt(tileIndex as string);

    if (isNaN(tileNum) || tileNum < 0 || tileNum >= cols * rows) {
      return res
        .status(400)
        .json({ error: `Invalid tile index: ${tileIndex}` });
    }

    const targetRatio = 3 / 2;
    const actualRatio = metadata.width / metadata.height;

    let resizeWidth: number;
    let resizeHeight: number;

    if (actualRatio > targetRatio) {
      resizeHeight = metadata.height;
      resizeWidth = Math.round(resizeHeight * targetRatio);
    } else {
      resizeWidth = metadata.width;
      resizeHeight = Math.round(resizeWidth / targetRatio);
    }

    const resized = image.removeAlpha().resize(resizeWidth, resizeHeight, {
      fit: "cover",
      position: "center",
    });

    const row = Math.floor(tileNum / cols);
    const col = tileNum % cols;

    const tileWidth = Math.floor(resizeWidth / cols);
    const tileHeight = Math.floor(resizeHeight / rows);

    const left = col * tileWidth;
    const top = row * tileHeight;
    const actualWidth = col === cols - 1 ? resizeWidth - left : tileWidth;
    const actualHeight = row === rows - 1 ? resizeHeight - top : tileHeight;

    const tileBuffer = await resized
      .extract({ left, top, width: actualWidth, height: actualHeight })
      .blur(30)
      .modulate({
        brightness: 0.8,
        saturation: 0.6,
      })
      .jpeg({ quality: 40 })
      .toBuffer();

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");

    return res.send(tileBuffer);
  } catch (err) {
    console.error("Error in blurred tile handler:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
