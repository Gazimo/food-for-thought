import { Tile } from "./Tile";

export function TileGrid({
  imageUrl,
  revealedTiles,
}: {
  imageUrl: string;
  revealedTiles: boolean[];
}) {
  // Responsive: use 100vw - 32px for mobile, 500px for desktop
  // 3:2 aspect ratio
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 600;
  const width =
    typeof window !== "undefined" ? Math.min(window.innerWidth - 32, 500) : 500;
  const height = (width / 3) * 2;
  const cols = 3;
  const tileWidth = width / 3;
  const tileHeight = height / 2;
  const allRevealed = revealedTiles.every((tile) => tile);

  return (
    <div
      className={`grid grid-cols-3 grid-rows-2 mx-auto mb-4 max-w-full`}
      style={{ width: `${width}px`, maxWidth: "100vw" }}
    >
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
          />
        );
      })}
    </div>
  );
}
