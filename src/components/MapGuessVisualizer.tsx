"use client";

import worldData from "@/data/world-110m.json";
import { getColorForDistance } from "@/utils/colors";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { feature } from "topojson-client";

import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

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

  const projection = geoNaturalEarth1()
    .scale(100)
    .translate([dimensions.width / 2.2, dimensions.height / 1.9])
    .rotate([-30, 0]);

  const pathGenerator = geoPath().projection(projection);

  const world = worldData as unknown as Topology<{
    countries: GeometryCollection;
  }>;

  const geoJson = feature(
    world,
    world.objects.countries
  ) as unknown as FeatureCollection<Geometry>;

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
        {/* 🌍 Render Countries */}
        {geoJson.features.map((feature: Feature<Geometry>, i: number) => (
          <path
            key={i}
            d={pathGenerator(feature) || ""}
            fill="#f0f0f0"
            stroke="#ccc"
            strokeWidth={0.5}
          />
        ))}

        {/* 📍 Render Guesses */}
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
              className={guess.isCorrect ? "animate-pulseCorrect" : ""}
            >
              <title>{guess.country}</title>
            </motion.circle>
          );
        })}
      </svg>
    </div>
  );
};
