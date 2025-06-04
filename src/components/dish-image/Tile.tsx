import Image from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_IMAGE = "/images/404.png";

export function Tile({
  imageUrl,
  rotate,
  left,
  top,
  width,
  height,
  showBorder,
}: {
  imageUrl: string;
  rotate: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
  showBorder: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(imageUrl);

  useEffect(() => {
    setImgSrc(imageUrl);
  }, [imageUrl]);

  const handleImageError = () => {
    console.warn(`Failed to load image: ${imgSrc}`);
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
        <div className="absolute w-full h-full bg-gray-300 backface-hidden" />

        <div className="absolute w-full h-full overflow-hidden backface-hidden transform rotate-y-180">
          <div
            className="absolute"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              top: `-${top}px`,
              left: `-${left}px`,
              maxWidth: "100vw",
            }}
          >
            <Image
              src={imgSrc}
              alt="tile"
              width={width}
              height={height}
              className="w-full h-full object-cover"
              onError={handleImageError}
              priority={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
