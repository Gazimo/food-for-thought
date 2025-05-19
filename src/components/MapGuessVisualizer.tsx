// components/MapGuessVisualizer.tsx

"use client";

import worldData from "@/data/world-110m.json";
import { geoMercator, geoPath } from "d3-geo";
import { FeatureCollection, Geometry } from "geojson";
import { useEffect, useRef, useState } from "react";
import { feature } from "topojson-client";
import { getColorForDistance } from "../utils/colors";
import { motion } from "framer-motion";

interface Guess {
  lat: number;
  lng: number;
  isCorrect: boolean;
  country: string;
  distance: number;
}

interface MapGuessVisualizerProps {
  guesses: Guess[];
}

export const MapGuessVisualizer = ({ guesses }: MapGuessVisualizerProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 350 });

  const projection = geoMercator()
    .scale(100)
    .translate([dimensions.width / 2, dimensions.height / 1.5]);

  const pathGenerator = geoPath().projection(projection);

  const geoJsonResult = feature(
    worldData as any,
    (worldData as any).objects.countries
  );

  const geoJson: FeatureCollection<Geometry> =
    geoJsonResult && (geoJsonResult as any).type === "FeatureCollection"
      ? (geoJsonResult as unknown as FeatureCollection<Geometry>)
      : ({
          type: "FeatureCollection",
          features: [geoJsonResult as any],
        } as FeatureCollection<Geometry>);
  console.log("GeoJSON features:", geoJson.features.length, geoJson);

  useEffect(() => {
    const resize = () => {
      if (svgRef.current) {
        const width = svgRef.current.clientWidth;
        setDimensions({ width, height: width / 2 });
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className="w-full overflow-hidden rounded border shadow">
      <svg
        ref={svgRef}
        width="100%"
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        {/* Base Map */}
        {geoJson.features.map((feature: any, i: number) => (
          <path
            key={i}
            d={pathGenerator(feature) || ""}
            fill="#f0f0f0"
            stroke="#ccc"
            strokeWidth={0.5}
          />
        ))}

        {guesses.map((guess, i) => {
          const [x, y] = projection([guess.lng, guess.lat]) || [0, 0];
          return (
            <motion.circle
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              cx={x}
              cy={y}
              r={6}
              fill={getColorForDistance(guess.distance)}
              stroke="#fff"
              strokeWidth={1.5}
            >
              <title>{guess.country}</title>
            </motion.circle>
          );
        })}
      </svg>
    </div>
  );
};
