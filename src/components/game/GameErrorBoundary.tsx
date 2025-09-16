"use client";

import { useTodaysDish } from "@/hooks/useDishes";
import { useGameStore } from "@/store";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface GameErrorBoundaryProps {
  children: ReactNode;
}

export function GameErrorBoundary({ children }: GameErrorBoundaryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const archiveDate = searchParams?.get("date") || null;

  const { isPlayingArchive, archiveDate: storeArchiveDate } = useGameStore();
  const effectiveArchiveDate = isPlayingArchive ? storeArchiveDate : null;
  const { isError, error } = useTodaysDish(effectiveArchiveDate || undefined);

  const [archiveAccessError, setArchiveAccessError] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (archiveDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(archiveDate)) {
        setArchiveAccessError("Invalid date format");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      if (archiveDate > today) {
        setArchiveAccessError("Cannot access future dates");
        return;
      }
    }
  }, [archiveDate]);

  useEffect(() => {
    if (isError && error && effectiveArchiveDate) {
      const errorWithStatus = error as { status?: number; message?: string };
      if (errorWithStatus.status === 403) {
        setArchiveAccessError(
          errorWithStatus.message ||
            "Archives are locked. Share today's results to unlock!"
        );
      } else if (errorWithStatus.status === 404) {
        setArchiveAccessError(
          errorWithStatus.message ||
            `No archived game available for ${effectiveArchiveDate}. This date may be before our game archive began.`
        );
      }
    }
  }, [isError, error, effectiveArchiveDate]);

  if (archiveAccessError) {
    return (
      <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-amber-600">
              Archive Access Restricted
            </h2>
            <p className="text-gray-600 mb-4">{archiveAccessError}</p>
            <button
              onClick={() => router.push("/play")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Today&apos;s Game
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-600">
              Failed to load game
            </h2>
            <p className="text-gray-600 mb-4">
              {effectiveArchiveDate
                ? `Could not load game for ${effectiveArchiveDate}. The game may not exist for this date.`
                : "Please check your connection and try again."}
            </p>
            <button
              onClick={() =>
                effectiveArchiveDate
                  ? router.push("/play")
                  : window.location.reload()
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {effectiveArchiveDate ? "Back to Today&apos;s Game" : "Retry"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
