import { promises as fs } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import PostHogClient from "../../lib/posthog";

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

  // Capture event with PostHog
  const posthog = PostHogClient();
  try {
    await posthog.capture({
      distinctId: req.headers.cookie || "anonymous",
      event: "api_dishes_retrieved",
      properties: {
        method: req.method,
        endpoint: req.url,
        count: Array.isArray(dishes) ? dishes.length : undefined,
      },
    });
  } catch (error) {
    // Optional: Log PostHog errors
    console.error("PostHog capture error:", error);
  }

  res.status(200).json(dishes);
}
