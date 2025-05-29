import { NextApiRequest, NextApiResponse } from "next";
import dishes from "@/data/sample_dishes.json";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(dishes);
}