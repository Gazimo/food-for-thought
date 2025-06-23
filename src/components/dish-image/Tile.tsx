import Image from "next/image";
import { useState } from "react";

const FALLBACK_IMAGE = "/images/404.png";

export function Tile({
  tileUrl,
  rotate,
  width,
  height,
  showBorder,
}: {
  tileUrl: string;
  rotate: boolean;
  width: number;
  height: number;
  showBorder: boolean;
}) {
  const [src, setSrc] = useState(tileUrl);

  const handleImageError = () => {
    console.error(`Failed to load tile: ${tileUrl}`);
    setSrc(FALLBACK_IMAGE);
  };

  return (
    <div
      className={`relative perspective-1000 max-w-full transition-all duration-500 ${
        !showBorder ? "border-transparent" : "border border-gray-200"
      }`}
      style={{
        width: width / 3,
        height: height / 2,
        maxWidth: "100vw",
        transform: "translateZ(0)",
      }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
          rotate ? "rotate-y-180" : ""
        }`}
      >
        <div className="absolute w-full h-full bg-transparent backface-hidden" />

        <div className="absolute w-full h-full overflow-hidden backface-hidden transform rotate-y-180">
          {rotate && (
            <Image
              src={src}
              alt="dish tile"
              fill
              className="w-full h-full object-cover"
              onError={handleImageError}
              priority
              sizes="(max-width: 768px) 33vw, 166px"
            />
          )}
        </div>
      </div>
    </div>
  );
}
