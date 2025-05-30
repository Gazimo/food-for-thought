import { promises as fs } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const filePath = path.join(process.cwd(), "src/data/sample_dishes.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  const dishes = JSON.parse(fileContents);

  res.status(200).json(dishes);
}
