"use client";

import {
  Bean,
  Beef,
  ChefHat,
  Drumstick,
  Egg,
  Fish,
  Milk,
  Nut,
  Sprout,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

type IngredientDbItem = {
  name: string;
  protein_g_per_100g: number;
  category: string;
};

interface IngredientProteinStripProps {
  imageUrl: string;
  dishName: string;
  keyIngredients: string[];
  maxItems?: number;
}

// Better icon mapping that considers specific ingredients, not just categories
function getIngredientIcon(
  item: IngredientDbItem
): React.ComponentType<{ className?: string }> {
  const name = item.name.toLowerCase();

  // Exclude broths, stocks, and other liquid derivatives that shouldn't be mapped to their protein source
  const isBrothOrStock =
    name.includes("broth") ||
    name.includes("stock") ||
    name.includes("bouillon") ||
    name.includes("consommé") ||
    name.includes("soup base");

  // Specific ingredient icons
  if (name.includes("cheese") && !name.includes("cottage")) return ChefHat; // Hard cheeses
  if (
    name.includes("cottage") ||
    name.includes("ricotta") ||
    name.includes("cream cheese")
  )
    return Milk;
  if (
    name.includes("milk") ||
    name.includes("yogurt") ||
    name.includes("kefir")
  )
    return Milk;
  if (name.includes("egg") && !isBrothOrStock) return Egg;
  if (
    (name.includes("chicken") ||
      name.includes("turkey") ||
      name.includes("duck")) &&
    !isBrothOrStock
  )
    return Drumstick;
  if (
    (name.includes("beef") ||
      name.includes("pork") ||
      name.includes("lamb") ||
      name.includes("bacon") ||
      name.includes("ham")) &&
    !isBrothOrStock
  )
    return Beef;
  if (
    (name.includes("fish") ||
      name.includes("salmon") ||
      name.includes("tuna") ||
      name.includes("cod") ||
      name.includes("shrimp") ||
      name.includes("crab") ||
      name.includes("lobster")) &&
    !isBrothOrStock
  )
    return Fish;
  if (
    name.includes("bean") ||
    name.includes("lentil") ||
    name.includes("chickpea") ||
    name.includes("pea")
  )
    return Bean;
  if (
    name.includes("nut") ||
    name.includes("almond") ||
    name.includes("cashew") ||
    name.includes("peanut") ||
    name.includes("seed")
  )
    return Nut;
  if (
    name.includes("tofu") ||
    name.includes("tempeh") ||
    name.includes("seitan")
  )
    return Sprout;

  // Category fallbacks
  if (item.category === "meat_poultry") return Drumstick;
  if (item.category === "seafood") return Fish;
  if (item.category === "dairy_eggs") return Milk;
  if (item.category === "legumes" || item.category === "legumes_dry")
    return Bean;
  if (item.category === "nuts_seeds") return Nut;
  if (item.category === "plant_processed") return Sprout;
  if (item.category === "processed_meat") return Beef;

  return Egg; // default
}

const INCLUDED_CATEGORIES = new Set([
  "meat_poultry",
  "seafood",
  "dairy_eggs",
  "legumes",
  "legumes_dry",
  "nuts_seeds",
  "plant_processed",
  "processed_meat",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findBestProteinMatch(
  ingredient: string,
  db: IngredientDbItem[]
): IngredientDbItem | null {
  const normalizedIngredient = normalize(ingredient);
  if (!normalizedIngredient) return null;

  let exactMatch: IngredientDbItem | null = null;
  let bestPartialMatch: IngredientDbItem | null = null;
  let bestCategoryMatch: IngredientDbItem | null = null;
  let highestPartialProtein = -1;
  let highestCategoryProtein = -1;

  for (const item of db) {
    if (!INCLUDED_CATEGORIES.has(item.category)) continue;

    const normalizedDbName = normalize(item.name);
    const dbNameWords = normalizedDbName.split(" ");

    if (normalizedDbName === normalizedIngredient) {
      if (
        !exactMatch ||
        item.protein_g_per_100g > exactMatch.protein_g_per_100g
      ) {
        exactMatch = item;
      }
      continue;
    }

    const simplifiedIngredient = normalizedIngredient
      .replace(/\b(cheese|meat|fish|sauce|oil)\b/g, "")
      .trim();
    if (simplifiedIngredient && normalizedDbName === simplifiedIngredient) {
      if (
        !exactMatch ||
        item.protein_g_per_100g > exactMatch.protein_g_per_100g
      ) {
        exactMatch = item;
      }
      continue;
    }

    if (normalizedIngredient === "cheese" && item.category === "dairy_eggs") {
      const cheeseTypes = [
        "cheddar",
        "mozzarella",
        "parmesan",
        "feta",
        "gouda",
        "brie",
        "swiss",
        "blue",
        "cottage",
        "cream",
        "ricotta",
        "halloumi",
        "provolone",
        "manchego",
        "gruyere",
        "emmental",
      ];
      const isCheeseType = cheeseTypes.some(
        (cheeseType) =>
          normalizedDbName.includes(cheeseType) ||
          normalizedDbName.includes("cheese")
      );

      if (isCheeseType && item.protein_g_per_100g > highestCategoryProtein) {
        highestCategoryProtein = item.protein_g_per_100g;
        bestCategoryMatch = item;
      }
      continue;
    }

    const ingredientWords = normalizedIngredient.split(" ");
    let isValidMatch = false;

    // Avoid matching very common/generic words that appear in many entries
    const commonWords = new Set([
      "oil",
      "sauce",
      "water",
      "salt",
      "pepper",
      "sugar",
    ]);

    for (const ingredientWord of ingredientWords) {
      if (commonWords.has(ingredientWord)) continue;

      for (const dbWord of dbNameWords) {
        if (dbWord === ingredientWord || dbWord.startsWith(ingredientWord)) {
          const dbWordIndex = dbNameWords.indexOf(dbWord);
          if (
            dbWord === ingredientWord ||
            dbWordIndex === 0 ||
            dbNameWords.length === 1
          ) {
            isValidMatch = true;
            break;
          }
        }
      }
      if (isValidMatch) break;
    }

    if (isValidMatch && item.protein_g_per_100g > highestPartialProtein) {
      highestPartialProtein = item.protein_g_per_100g;
      bestPartialMatch = item;
    }
  }

  return exactMatch || bestPartialMatch || bestCategoryMatch;
}

export const IngredientProteinStrip: React.FC<IngredientProteinStripProps> = ({
  imageUrl,
  dishName,
  keyIngredients,
  maxItems = 4,
}) => {
  const [db, setDb] = useState<IngredientDbItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/data/ingredient_protein_database.json")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setDb(data as IngredientDbItem[]);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(String(e));
      });
    return () => {
      mounted = false;
    };
  }, []);

  const topMatches = useMemo(() => {
    if (!db) return [];

    const matches: IngredientDbItem[] = [];
    const seenNames = new Set<string>();

    for (const ingredient of keyIngredients) {
      const match = findBestProteinMatch(ingredient, db);
      if (match && !seenNames.has(match.name)) {
        matches.push(match);
        seenNames.add(match.name);
      }
    }

    const filtered = matches
      .filter((m) => m.protein_g_per_100g >= 5)
      .sort((a, b) => b.protein_g_per_100g - a.protein_g_per_100g)
      .slice(0, maxItems);

    return filtered;
  }, [db, keyIngredients, maxItems]);

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={dishName}
            fill
            sizes="(max-width: 640px) 100vw, 80vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      <div className="w-full">
        {error ? (
          <div className="text-xs text-red-500">
            Failed to load protein data
          </div>
        ) : topMatches.length === 0 ? (
          <div className="text-xs text-gray-500">
            No protein sources detected
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-xs text-gray-600 font-medium">
              Key protein sources (per 100g):
            </div>
            {topMatches.map((item) => {
              const IconComp = getIngredientIcon(item);
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <IconComp className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-gray-700 capitalize">
                      {item.name}
                    </span>
                    <span className="text-gray-500 font-medium">
                      {item.protein_g_per_100g}g
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
