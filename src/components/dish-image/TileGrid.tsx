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
  const height = (width / 3) * 2;
  const cols = 3;
  const tileWidth = width / 3;
  const tileHeight = height / 2;

  return (
    <div
      className="relative mx-auto"
      style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100vw" }}
    >
      <Image
        src={imageUrl}
        alt="blurred dish preview"
        fill
        className={`object-cover transition-opacity duration-700 blur-[12px] opacity-25 contrast-75 ${
          fullyRevealed ? "opacity-0" : ""
        }`}
        draggable={false}
        priority
      />

      <div className="absolute inset-0 bg-black/10 z-[1] pointer-events-none" />

      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 border border-white/20 z-[2] pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-white/20" />
        ))}
      </div>

      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 z-[3]">
        {Array.from({ length: 6 }).map((_, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;

          return (
            <Tile
              key={index}
              rotate={revealedTiles[index]}
              top={row * tileHeight}
              left={col * tileWidth}
              imageUrl={imageUrl}
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
