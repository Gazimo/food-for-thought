import Image from "next/image";
import { Tile } from "./Tile";

export function TileGrid({
  imageUrl,
  revealedTiles,
}: {
  imageUrl: string;
  revealedTiles: boolean[];
}) {
  const fullyRevealed = revealedTiles.every(Boolean);
  const width =
    typeof window !== "undefined" ? Math.min(window.innerWidth - 32, 500) : 500;
  const height = (width / 3) * 2; // Maintain 3:2 aspect ratio
  const cols = 3;
  const rows = 2;
  const tileWidth = width / cols;
  const tileHeight = height / rows;

  // Extract dish ID from the image URL (e.g., from "/images/dishes/abc123.png" get "abc123")
  const getDishIdFromImageUrl = (imageUrl: string): string => {
    const filename = imageUrl.split("/").pop() || "";
    return filename.split(".")[0]; // Remove extension
  };

  const dishId = getDishIdFromImageUrl(imageUrl);
  const cacheBust = Date.now(); // Cache busting to see changes

  return (
    <div
      className="relative mx-auto"
      style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100vw" }}
    >
      {/* Background layer: All tiles PRE-BLURRED server-side */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 z-[1]">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`bg-${index}`} className="relative overflow-hidden">
            <Image
              src={`/api/dish-tiles-blurred?dishId=${encodeURIComponent(
                dishId
              )}&tileIndex=${index}&cb=${cacheBust}`}
              alt={`background tile ${index + 1}`}
              fill
              className="object-cover opacity-60"
              sizes="(max-width: 768px) 33vw, 166px"
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-black/10 z-[2] pointer-events-none" />

      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 border border-white/20 z-[3] pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-white/20" />
        ))}
      </div>

      {/* Foreground layer: Only revealed tiles (clear) */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 z-[4]">
        {Array.from({ length: 6 }).map((_, index) => {
          return (
            <Tile
              key={index}
              rotate={revealedTiles[index]}
              dishId={dishId}
              tileIndex={index}
              width={width}
              height={height}
              showBorder={!fullyRevealed}
            />
          );
        })}
      </div>
    </div>
  );
}
