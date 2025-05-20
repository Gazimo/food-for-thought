import { Tile } from "./Tile";

export function TileGrid({
  imageUrl,
  revealedTiles,
}: {
  imageUrl: string;
  revealedTiles: boolean[];
}) {
  const width =
    typeof window !== "undefined" ? Math.min(window.innerWidth - 32, 500) : 500;
  const height = (width / 3) * 2;
  const cols = 3;
  const tileWidth = width / 3;
  const tileHeight = height / 2;

  return (
    <div
      className={`grid grid-cols-3 grid-rows-2 mx-auto  max-w-full`}
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
