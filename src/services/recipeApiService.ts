interface RecipeApiResponse {
  name: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
  nutrition?: {
    protein?: number;
  };
  servings?: number;
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  extendedIngredients: Array<{
    name: string;
    original: string;
  }>;
  analyzedInstructions: Array<{
    steps: Array<{
      step: string;
    }>;
  }>;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  servings: number;
}

interface TheMealDBRecipe {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strInstructions: string;
  [key: `strIngredient${number}`]: string;
  [key: `strMeasure${number}`]: string;
}

class RecipeApiService {
  private spoonacularApiKey: string;
  private spoonacularBaseUrl = "https://api.spoonacular.com/recipes";
  private mealDbBaseUrl = "https://www.themealdb.com/api/json/v1/1";

  // Location-specific terms to filter out
  private locationFilters = [
    "spanish",
    "thai",
    "mexican",
    "italian",
    "chinese",
    "japanese",
    "indian",
    "french",
    "greek",
    "korean",
    "vietnamese",
    "mediterranean",
    "asian",
    "european",
    "american",
    "cajun",
    "creole",
    "caribbean",
    "moroccan",
    "turkish",
    "lebanese",
    "persian",
    "brazilian",
    "argentinian",
    "peruvian",
    "ethiopian",
    "filipino",
    "polish",
  ];

  // Brand names and specific product names to filter out
  private brandFilters = [
    "hellmann's",
    "kikkoman",
    "sriracha",
    "worcestershire",
    "tabasco",
    "heinz",
    "kraft",
    "maggi",
    "knorr",
    "mccormick",
  ];

  // Generalization mappings
  private genericizeMap: Record<string, string> = {
    "basmati rice": "rice",
    "jasmine rice": "rice",
    "brown rice": "rice",
    "arborio rice": "rice",
    "wild rice": "rice",
    "chorizo sausage": "sausage",
    "italian sausage": "sausage",
    "parmigiano-reggiano": "parmesan cheese",
    "pecorino romano": "parmesan cheese",
    "extra virgin olive oil": "olive oil",
    "canola oil": "oil",
    "vegetable oil": "oil",
    "coconut oil": "oil",
    "sea salt": "salt",
    "kosher salt": "salt",
    "black pepper": "pepper",
    "white pepper": "pepper",
    "ground black pepper": "pepper",
    "fresh garlic": "garlic",
    "garlic cloves": "garlic",
    "yellow onion": "onion",
    "white onion": "onion",
    "red onion": "onion",
    "sweet onion": "onion",
    "roma tomatoes": "tomatoes",
    "cherry tomatoes": "tomatoes",
    "diced tomatoes": "tomatoes",
    "chicken breast": "chicken",
    "chicken thighs": "chicken",
    "ground beef": "beef",
    "beef chuck": "beef",
    "pork shoulder": "pork",
    "pork chops": "pork",
  };

  constructor() {
    this.spoonacularApiKey = process.env.SPOONACULAR_API_KEY || "";
    if (!this.spoonacularApiKey) {
      console.warn(
        "⚠️ SPOONACULAR_API_KEY not found, will rely on TheMealDB only"
      );
    }
  }

  async searchRecipe(dishName: string): Promise<RecipeApiResponse | null> {
    console.log(`🔍 Searching for recipe: ${dishName}`);

    // Try Spoonacular first
    if (this.spoonacularApiKey) {
      try {
        const spoonacularResult = await this.searchSpoonacular(dishName);
        if (spoonacularResult) {
          console.log("✅ Found recipe via Spoonacular");
          return spoonacularResult;
        }
      } catch (error) {
        console.warn("⚠️ Spoonacular failed, trying TheMealDB:", error);
      }
    }

    // Fallback to TheMealDB
    try {
      const mealDbResult = await this.searchTheMealDB(dishName);
      if (mealDbResult) {
        console.log("✅ Found recipe via TheMealDB");
        return mealDbResult;
      }
    } catch (error) {
      console.error("❌ Both APIs failed:", error);
    }

    return null;
  }

  private async searchSpoonacular(
    dishName: string
  ): Promise<RecipeApiResponse | null> {
    // Step 1: Search for recipes
    const searchUrl = `${
      this.spoonacularBaseUrl
    }/complexSearch?query=${encodeURIComponent(dishName)}&number=1&apiKey=${
      this.spoonacularApiKey
    }`;

    console.log(`🔍 Calling Spoonacular search API for: ${dishName}`);

    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(
        `Spoonacular search failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log("❌ No results found in Spoonacular search");
      return null;
    }

    const searchResult = data.results[0];
    console.log(
      `📋 Found recipe: ${searchResult.title} (ID: ${searchResult.id})`
    );

    // Step 2: Get detailed recipe information
    const detailUrl = `${this.spoonacularBaseUrl}/${searchResult.id}/information?includeNutrition=true&apiKey=${this.spoonacularApiKey}`;

    console.log(`🔍 Getting detailed recipe info for ID: ${searchResult.id}`);

    const detailResponse = await fetch(detailUrl);
    if (!detailResponse.ok) {
      throw new Error(
        `Spoonacular detail failed: ${detailResponse.status} ${detailResponse.statusText}`
      );
    }

    const recipe: SpoonacularRecipe = await detailResponse.json();
    console.log(`📋 Got detailed recipe: ${recipe.title}`);

    // Extract ingredients - add safety checks
    const rawIngredients =
      recipe.extendedIngredients?.map((ing) => ing.name) || [];
    console.log(
      `🥘 Raw ingredients from Spoonacular (${rawIngredients.length}):`,
      rawIngredients.slice(0, 10)
    ); // Only log first 10

    if (rawIngredients.length === 0) {
      console.warn("⚠️ No ingredients found in Spoonacular detailed response");
      console.log(
        "🔍 DEBUG: extendedIngredients field:",
        recipe.extendedIngredients
      );
    }

    const filteredIngredients = this.filterAndSelectIngredients(rawIngredients);

    // Extract instructions - add safety checks
    const instructions =
      recipe.analyzedInstructions?.[0]?.steps?.map((step) => step.step) || [];
    console.log(`📝 Instructions found: ${instructions.length} steps`);

    // Extract protein info
    const proteinNutrient = recipe.nutrition?.nutrients?.find(
      (n) => n.name.toLowerCase() === "protein"
    );
    const protein = proteinNutrient
      ? Math.round(proteinNutrient.amount)
      : undefined;
    console.log(`💪 Protein found: ${protein}g`);

    return {
      name: recipe.title,
      ingredients: filteredIngredients,
      instructions,
      image: recipe.image,
      nutrition: {
        protein,
      },
      servings: recipe.servings,
    };
  }

  private async searchTheMealDB(
    dishName: string
  ): Promise<RecipeApiResponse | null> {
    const searchUrl = `${this.mealDbBaseUrl}/search.php?s=${encodeURIComponent(
      dishName
    )}`;

    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`TheMealDB search failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.meals || data.meals.length === 0) {
      return null;
    }

    const meal: TheMealDBRecipe = data.meals[0];

    // Extract ingredients (TheMealDB has up to 20 ingredient fields)
    const rawIngredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[
        `strIngredient${i}` as keyof TheMealDBRecipe
      ] as string;
      if (ingredient && ingredient.trim()) {
        rawIngredients.push(ingredient.trim());
      }
    }

    const filteredIngredients = this.filterAndSelectIngredients(rawIngredients);

    // Parse instructions
    const instructions = meal.strInstructions
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => line.trim());

    return {
      name: meal.strMeal,
      ingredients: filteredIngredients,
      instructions,
      image: meal.strMealThumb,
      servings: 4, // TheMealDB doesn't provide servings, default to 4
    };
  }

  /**
   * Filter and select exactly 6 generic, non-location-specific ingredients
   */
  private filterAndSelectIngredients(rawIngredients: string[]): string[] {
    console.log(
      `📝 Raw ingredients (${rawIngredients.length}):`,
      rawIngredients
    );

    // Step 1: Clean and normalize ingredients
    const cleanedIngredients = rawIngredients
      .map((ingredient) => this.cleanIngredient(ingredient))
      .filter((ingredient) => ingredient.length > 0)
      .filter((ingredient) => this.isValidIngredient(ingredient));

    console.log(
      `🧹 Cleaned ingredients (${cleanedIngredients.length}):`,
      cleanedIngredients
    );

    // Step 2: Generalize specific ingredients
    const generalizedIngredients = cleanedIngredients.map(
      (ingredient) => this.genericizeMap[ingredient.toLowerCase()] || ingredient
    );

    console.log(
      `🔄 Generalized ingredients (${generalizedIngredients.length}):`,
      generalizedIngredients
    );

    // Step 3: Remove duplicates and prioritize
    const uniqueIngredients = [...new Set(generalizedIngredients)];

    // Step 4: Prioritize ingredients (proteins, starches, vegetables, seasonings)
    const prioritized = this.prioritizeIngredients(uniqueIngredients);

    console.log(
      `⭐ Prioritized ingredients (${prioritized.length}):`,
      prioritized
    );

    // Step 5: Select exactly 6
    const selected = prioritized.slice(0, 6);

    console.log(`✅ Final 6 ingredients:`, selected);

    return selected;
  }

  private cleanIngredient(ingredient: string): string {
    return ingredient
      .toLowerCase()
      .replace(/\d+/g, "") // Remove numbers
      .replace(/[()]/g, "") // Remove parentheses
      .replace(/,.*$/, "") // Remove everything after comma
      .replace(
        /\b(fresh|dried|ground|chopped|diced|sliced|minced|crushed|grated)\b/g,
        ""
      ) // Remove preparation words
      .replace(/\b(large|small|medium|big|little)\b/g, "") // Remove size descriptors
      .replace(/\s+/g, " ") // Normalize spaces
      .trim();
  }

  private isValidIngredient(ingredient: string): boolean {
    const lower = ingredient.toLowerCase();

    // Filter out location-specific terms
    if (this.locationFilters.some((filter) => lower.includes(filter))) {
      console.log(`🚫 Filtered location-specific: ${ingredient}`);
      return false;
    }

    // Filter out brand names
    if (this.brandFilters.some((filter) => lower.includes(filter))) {
      console.log(`🚫 Filtered brand name: ${ingredient}`);
      return false;
    }

    // Filter out very short or generic terms
    if (
      ingredient.length < 3 ||
      ["to", "for", "and", "or", "the"].includes(lower)
    ) {
      console.log(`🚫 Filtered too generic: ${ingredient}`);
      return false;
    }

    return true;
  }

  private prioritizeIngredients(ingredients: string[]): string[] {
    const proteinPriority = [
      "chicken",
      "beef",
      "pork",
      "fish",
      "shrimp",
      "salmon",
      "tuna",
      "turkey",
      "lamb",
      "duck",
      "eggs",
      "tofu",
    ];
    const starchPriority = [
      "rice",
      "noodles",
      "pasta",
      "bread",
      "potatoes",
      "quinoa",
      "flour",
      "beans",
      "lentils",
    ];
    const vegetablePriority = [
      "onion",
      "garlic",
      "tomatoes",
      "carrots",
      "celery",
      "bell peppers",
      "mushrooms",
      "broccoli",
    ];
    const seasoningPriority = [
      "salt",
      "pepper",
      "oil",
      "butter",
      "soy sauce",
      "vinegar",
      "lemon",
      "lime",
    ];

    const categorized = {
      proteins: ingredients.filter((ing) =>
        proteinPriority.some((p) => ing.toLowerCase().includes(p))
      ),
      starches: ingredients.filter((ing) =>
        starchPriority.some((s) => ing.toLowerCase().includes(s))
      ),
      vegetables: ingredients.filter((ing) =>
        vegetablePriority.some((v) => ing.toLowerCase().includes(v))
      ),
      seasonings: ingredients.filter((ing) =>
        seasoningPriority.some((s) => ing.toLowerCase().includes(s))
      ),
      others: ingredients.filter(
        (ing) =>
          !proteinPriority.some((p) => ing.toLowerCase().includes(p)) &&
          !starchPriority.some((s) => ing.toLowerCase().includes(s)) &&
          !vegetablePriority.some((v) => ing.toLowerCase().includes(v)) &&
          !seasoningPriority.some((s) => ing.toLowerCase().includes(s))
      ),
    };

    // Prioritize: 1-2 proteins, 1-2 starches, 2-3 vegetables, 0-1 seasonings
    return [
      ...categorized.proteins.slice(0, 2),
      ...categorized.starches.slice(0, 2),
      ...categorized.vegetables.slice(0, 3),
      ...categorized.seasonings.slice(0, 1),
      ...categorized.others,
    ];
  }
}

export default RecipeApiService;
