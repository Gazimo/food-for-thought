import { NextApiRequest } from "next";

interface UnlockTokenPayload {
  grantedOn: string; // YYYY-MM-DD in user's local calendar
  tzOffset: number;
  iat: number; // issued at
  exp: number; // expires at
}

export interface ArchiveValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
}

/**
 * Validates the archive unlock token for accessing archived content
 */
export function validateArchiveAccess(
  req: NextApiRequest,
  requestedDate: string,
  cookieName: string = "f4t_archives_unlock"
): ArchiveValidationResult {
  try {
    // Get the token from HTTP-only cookie
    const cookies = req.headers.cookie;
    if (!cookies) {
      return {
        isValid: false,
        error: "Archive access requires unlock token",
        code: "ARCHIVE_LOCKED",
      };
    }

    // Parse cookies to find our token (game-specific cookie name)
    const cookieMatch = cookies.match(new RegExp(`${cookieName}=([^;]+)`));
    if (!cookieMatch) {
      return {
        isValid: false,
        error: "Archive access requires unlock token",
        code: "ARCHIVE_LOCKED",
      };
    }

    const token = cookieMatch[1];

    // Decode the token (in production, this should be properly signed/verified)
    let tokenPayload: UnlockTokenPayload;
    try {
      const decoded = Buffer.from(token, "base64").toString("utf8");
      tokenPayload = JSON.parse(decoded);
    } catch {
      return {
        isValid: false,
        error: "Invalid archive token",
        code: "ARCHIVE_LOCKED",
      };
    }

    // Check if token has expired
    const now = Date.now();
    if (now >= tokenPayload.exp) {
      return {
        isValid: false,
        error:
          "Archive access has expired. Share today's results to re-unlock.",
        code: "ARCHIVE_EXPIRED",
      };
    }

    // Verify that the token was granted for today (in user's timezone)
    const userNow = new Date(now - tokenPayload.tzOffset * 60 * 1000);
    const userTodayString = userNow.toISOString().split("T")[0];

    if (tokenPayload.grantedOn !== userTodayString) {
      return {
        isValid: false,
        error: "Archive access expired. Share today's results to re-unlock.",
        code: "ARCHIVE_EXPIRED",
      };
    }

    // Optionally restrict to only past dates (no future access)
    if (requestedDate > tokenPayload.grantedOn) {
      return {
        isValid: false,
        error: "Cannot access future dates",
        code: "INVALID_DATE",
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Archive validation error:", error);
    return {
      isValid: false,
      error: "Archive validation failed",
      code: "VALIDATION_ERROR",
    };
  }
}

