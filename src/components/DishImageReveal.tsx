import React, { useEffect, useState } from "react";
import "./DishImageReveal.css";

type DishImageRevealProps = {
  imageUrl: string;
  incorrectGuesses: number; // 0 to 5 (or more)
};

export const DishImageReveal: React.FC<DishImageRevealProps> = ({
  imageUrl,
  incorrectGuesses,
}) => {
  const totalTiles = 6;
  const [visibleTiles, setVisibleTiles] = useState<number[]>([]);

  useEffect(() => {
    const newVisibleTiles = Array.from({ length: incorrectGuesses + 1 }, (_, i) => i);
    setVisibleTiles(newVisibleTiles);
  }, [incorrectGuesses]);

  return (
    <div className="image-grid">
      {Array.from({ length: totalTiles }).map((_, index) => (
        <div
          key={index}
          className={`tile ${visibleTiles.includes(index) ? "visible" : ""}`}
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: getTileBackgroundPosition(index),
          }}
        />
      ))}
    </div>
  );
};

// Helpers: adjust based on 3 cols x 2 rows
function getTileBackgroundPosition(index: number) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return `${-col * 100}% ${-row * 100}%`;
}
