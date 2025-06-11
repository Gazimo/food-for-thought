import { cn } from "@/lib/utils";
import React from "react";

const TileGridSkeleton = () => {
  const width =
    typeof window !== "undefined" ? Math.min(window.innerWidth - 32, 500) : 500;
  const height = (width / 3) * 2;

  return (
    <div
      className="relative mx-auto bg-gray-200 rounded-lg overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100vw" }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite]" />

      {/* Grid overlay */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 border border-gray-300/50 z-[2] pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-gray-300/50" />
        ))}
      </div>
    </div>
  );
};

const InputSkeleton = () => (
  <div className="w-full flex gap-2 items-center">
    {/* Give up button skeleton */}
    <div className="relative w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>

    {/* Input field skeleton */}
    <div className="flex-1 relative h-12 bg-gray-200 rounded-lg overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>

    {/* Submit button skeleton */}
    <div className="relative w-24 h-12 bg-gray-200 rounded-lg overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  </div>
);

const TextSkeleton = ({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "relative h-4 bg-gray-200 rounded overflow-hidden",
          i === lines - 1 ? "w-3/4" : "w-full"
        )}
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
    ))}
  </div>
);

export const GameSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="text-center space-y-2">
        <div className="relative h-8 w-48 mx-auto bg-gray-200 rounded overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      </div>

      {/* Tile grid skeleton */}
      <TileGridSkeleton />

      {/* Help text skeleton */}
      <div className="text-center">
        <TextSkeleton className="max-w-xs mx-auto" />
      </div>

      {/* Input skeleton */}
      <InputSkeleton />

      {/* Navigation skeleton */}
      <div className="flex justify-center space-x-4 mt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="relative w-16 h-8 bg-gray-200 rounded overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
};
