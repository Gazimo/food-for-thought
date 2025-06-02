import { promises as fs } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const filePath = path.join(process.cwd(), "src/data/sample_dishes.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  const dishes = JSON.parse(fileContents);

  res.status(200).json(dishes);
}
