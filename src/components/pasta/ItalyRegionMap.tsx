"use client";

import italyData from "@/data/italy-regions.json";
import { RegionGuessResult, ITALIAN_REGIONS } from "@/types/pasta";
import {
  getColorForItalyDistance,
  normalizeTopoJsonRegionName,
  normalizeRegionForComparison,
} from "@/utils/italyColors";
import { geoMercator, geoPath } from "d3-geo";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { feature } from "topojson-client";

import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

interface ItalyRegionMapProps {
  guessResults: RegionGuessResult[];
  onRegionClick: (regionName: string) => void;
  correctRegion: string;
  isComplete: boolean;
  selectedRegion?: string;
}

export const ItalyRegionMap = ({
  guessResults,
  onRegionClick,
  correctRegion,
  isComplete,
  selectedRegion,
}: ItalyRegionMapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 500 });
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
          userAgent
        );
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;

      setIsMobile(isMobileDevice || isTouchDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // D3 projection for Italy
  // Center on Italy's approximate geographic center
  const projection = geoMercator()
    .center([12.5, 42.5])  // Italy's center (lon, lat)
    .scale(isMobile ? 2000 : 2300)
    .translate([dimensions.width / 2, dimensions.height / 2]);

  const pathGenerator = geoPath().projection(projection);

  // Load TopoJSON data
  const italy = italyData as unknown as Topology<{
    regions: GeometryCollection;
  }>;

  const geoJson = feature(
    italy,
    italy.objects.regions
  ) as unknown as FeatureCollection<Geometry>;

  // Responsive sizing
  useEffect(() => {
    const resize = () => {
      if (svgRef.current) {
        const width = svgRef.current.clientWidth;
        const height = isMobile ? width * 1.5 : width * 0.9;
        setDimensions({ width, height });
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [isMobile]);

  // Get region fill color based on state
  const getRegionFill = (regionName: string): string => {
    // Normalize the TopoJSON region name
    const normalizedName = normalizeTopoJsonRegionName(regionName);

    // If game is complete, highlight the correct region
    if (isComplete && normalizeRegionForComparison(normalizedName) === normalizeRegionForComparison(correctRegion)) {
      return "#10b981"; // green - correct answer revealed
    }

    // Check if this region was guessed correctly
    const guessResult = guessResults.find(
      (g) =>
        normalizeRegionForComparison(g.region) ===
        normalizeRegionForComparison(normalizedName)
    );

    if (guessResult?.isCorrect) {
      return "#10b981"; // green - user guessed correctly
    }

    // If currently selected in dropdown
    if (selectedRegion && normalizeRegionForComparison(selectedRegion) === normalizeRegionForComparison(normalizedName)) {
      return "#3b82f6"; // blue - selected
    }

    return "#f0f0f0"; // gray - default
  };

  // Get region stroke based on state
  const getRegionStroke = (regionName: string): string => {
    const normalizedName = normalizeTopoJsonRegionName(regionName);

    if (selectedRegion && normalizeRegionForComparison(selectedRegion) === normalizeRegionForComparison(normalizedName)) {
      return "#1d4ed8"; // darker blue - selected
    }

    return "#ccc"; // gray - default
  };

  // Handle region click
  const handleRegionClick = (regionName: string) => {
    if (isComplete) return;

    const normalizedName = normalizeTopoJsonRegionName(regionName);

    // Check if already guessed
    const alreadyGuessed = guessResults.some(
      (g) =>
        normalizeRegionForComparison(g.region) ===
        normalizeRegionForComparison(normalizedName)
    );

    if (!alreadyGuessed) {
      onRegionClick(normalizedName);
    }
  };

  // Prepare guess data with coordinates for dots
  const enrichedGuesses = guessResults.map((result) => {
    // Find coordinates for this region
    const regionEntry = Object.entries(ITALIAN_REGIONS).find(([regionName]) =>
      normalizeRegionForComparison(regionName) ===
      normalizeRegionForComparison(result.region)
    );

    const coords = regionEntry ? regionEntry[1] : { lat: 0, lng: 0 };

    return {
      region: result.region,
      isCorrect: result.isCorrect,
      lat: coords.lat,
      lng: coords.lng,
      distance: result.distance,
    };
  });

  return (
    <div className="w-full overflow-hidden rounded border shadow">
      <svg
        ref={svgRef}
        width="100%"
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        {/* Render Italian regions */}
        {geoJson.features.map((regionFeature: Feature<Geometry>, i: number) => {
          const regionName =
            (regionFeature.properties as { reg_name?: string })?.reg_name || "";

          return (
            <path
              key={i}
              d={pathGenerator(regionFeature) || ""}
              fill={getRegionFill(regionName)}
              stroke={getRegionStroke(regionName)}
              strokeWidth={isMobile ? 0.7 : 1}
              className={`italy-region-path ${isComplete ? "disabled" : ""}`}
              onClick={() => handleRegionClick(regionName)}
              style={{
                cursor: isComplete ? "not-allowed" : "pointer",
                transition: "fill 0.2s ease, stroke 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isComplete) {
                  e.currentTarget.style.fill = "#dbeafe"; // blue-100 on hover
                }
              }}
              onMouseLeave={(e) => {
                if (!isComplete) {
                  e.currentTarget.style.fill = getRegionFill(regionName);
                }
              }}
            >
              <title>{normalizeTopoJsonRegionName(regionName)}</title>
            </path>
          );
        })}

        {/* Render guess dots */}
        {enrichedGuesses.map((guess, i) => {
          const [x, y] = projection([guess.lng, guess.lat]) || [0, 0];
          return (
            <motion.circle
              key={`${guess.region}-${i}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              cx={x}
              cy={y}
              r={isMobile ? 5 : 7}
              fill={getColorForItalyDistance(guess.distance)}
              stroke="#fff"
              strokeWidth={isMobile ? 1.5 : 2}
              className={guess.isCorrect ? "animate-pulseCorrect" : ""}
            >
              <title>{guess.region}</title>
            </motion.circle>
          );
        })}
      </svg>

      <style jsx>{`
        @keyframes pulseCorrect {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-pulseCorrect {
          animation: pulseCorrect 1.5s ease-in-out infinite;
        }

        .italy-region-path.disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};
