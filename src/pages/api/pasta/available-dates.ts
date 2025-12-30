import { NextApiRequest, NextApiResponse } from "next";
import { handleAvailableDates } from "@/utils/api/archiveHandlers";
import { getArchiveConfigById } from "@/utils/archiveConfig";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const archiveConfig = getArchiveConfigById("italian-pasta");
  return handleAvailableDates(req, res, archiveConfig.tableName);
}
