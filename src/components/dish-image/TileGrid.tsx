import { Tile } from "./Tile";

export function TileGrid({
  imageUrl,
  revealedTiles,
}: {
  imageUrl: string;
  revealedTiles: boolean[];
}) {
  const cols = 3;
  const width = 500;
  const height = 333;
  const tileWidth = 500 / 3;
  const tileHeight = 333 / 2;
  const allRevealed = revealedTiles.every((tile) => tile);

  return (
    <div
      className={`grid grid-cols-3 grid-rows-2 mx-auto mb-4 ${
        allRevealed ? "gap-0" : "gap-x-1 gap-y-[4px]"
      }`}
      style={{ width: `${width}px` }}
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
