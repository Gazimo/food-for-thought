import Image from "next/image";

export function Tile({
  imageUrl,
  rotate,
  left,
  top,
  width,
  height,
}: {
  imageUrl: string;
  rotate: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return (
    <div
      className="relative perspective-[1000px]"
      style={{
        width: width / 3,
        height: height / 2,
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
            }}
          >
            <Image
              src={imageUrl}
              alt="tile"
              width={width}
              height={height}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
