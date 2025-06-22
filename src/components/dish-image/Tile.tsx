import Image from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_IMAGE = "/images/404.png";

export function Tile({
  dishId,
  tileIndex,
  rotate,
  width,
  height,
  showBorder,
}: {
  dishId: string;
  tileIndex: number;
  rotate: boolean;
  width: number;
  height: number;
  showBorder: boolean;
}) {
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    if (rotate && !imgSrc) {
      const tileUrl = `/api/dish-tiles?dishId=${encodeURIComponent(
        dishId
      )}&tileIndex=${tileIndex}`;
      setImgSrc(tileUrl);
    }
  }, [dishId, tileIndex, rotate, imgSrc]);

  const handleImageError = () => {
    console.error(`Failed to load tile ${tileIndex} for dish ${dishId}`);
    setImgSrc(FALLBACK_IMAGE);
  };

  return (
    <div
      className={`relative perspective-[1000px] max-w-full transition-all duration-500 ${
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
        className={`relative w-full h-full transition-transform duration-700 transform-style preserve-3d ${
          rotate ? "rotate-y-180" : ""
        }`}
      >
        <div className="absolute w-full h-full bg-transparent backface-hidden" />

        <div className="absolute w-full h-full overflow-hidden backface-hidden transform rotate-y-180">
          {rotate && imgSrc && (
            <Image
              src={imgSrc}
              alt={`dish tile ${tileIndex + 1}`}
              fill
              className="w-full h-full object-cover"
              onError={handleImageError}
              priority={true}
              sizes="(max-width: 768px) 33vw, 166px"
            />
          )}
        </div>
      </div>
    </div>
  );
}
