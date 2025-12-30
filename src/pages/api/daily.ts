import { NextApiRequest, NextApiResponse } from "next";
import dishesHandler from "./dishes";

/**
 * F4T Daily Endpoint
 *
 * Wraps the existing /api/dishes endpoint to return a single dish object
 * instead of an array, matching the unified architecture pattern.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Create a custom response object that intercepts the json() method
  const originalJson = res.json.bind(res);
  res.json = function(data: any) {
    // If dishes handler returns an array, extract the first item
    if (Array.isArray(data) && data.length > 0) {
      return originalJson(data[0]);
    }
    // Otherwise pass through as-is (error responses, etc.)
    return originalJson(data);
  };

  // Delegate to the existing dishes handler
  return dishesHandler(req, res);
}
