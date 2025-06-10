import RecipeApiService from "../services/recipeApiService";
import { Dish } from "../types/dishes";

interface GeneratedDishData extends Partial<Dish> {
  dataSource: "spoonacular" | "themealdb";
  generatedAt: string;
  reviewStatus: "draft" | "reviewed" | "published";
}

class RecipeDataFetcher {
  private apiService: RecipeApiService;

  constructor() {
    this.apiService = new RecipeApiService();
  }

  async fetchDishData(dishName: string): Promise<GeneratedDishData | null> {
    console.log(`🚀 Starting dish data generation for: ${dishName}`);

    try {
      // Step 1: Get recipe data from APIs
      const recipeData = await this.apiService.searchRecipe(dishName);
      if (!recipeData) {
        console.error(`❌ No recipe data found for: ${dishName}`);
        return null;
      }

      // Step 2: Generate dish data
      const dishData: GeneratedDishData = {
        name: recipeData.name,
        ingredients: recipeData.ingredients, // Already filtered to 6 generic ingredients
        acceptableGuesses: this.generateAcceptableGuesses(recipeData.name),
        country: "", // Will need manual input - APIs don't reliably provide origin country
        blurb: this.generatePlaceholderBlurb(
          recipeData.name,
          recipeData.ingredients
        ),
        imageUrl: recipeData.image || "",
        proteinPerServing: recipeData.nutrition?.protein,
        recipe: {
          ingredients: this.formatRecipeIngredients(recipeData.instructions),
          instructions: recipeData.instructions,
        },
        tags: this.generateTags(recipeData.name, recipeData.ingredients),

        // Metadata
        dataSource: recipeData.image?.includes("spoonacular")
          ? "spoonacular"
          : "themealdb",
        generatedAt: new Date().toISOString(),
        reviewStatus: "draft",
      };

      console.log(`✅ Generated dish data for: ${dishName}`);
      this.logGeneratedData(dishData);

      return dishData;
    } catch (error) {
      console.error(`💥 Error generating dish data for ${dishName}:`, error);
      return null;
    }
  }

  /**
   * Generate basic acceptable guesses based on dish name
   */
  private generateAcceptableGuesses(dishName: string): string[] {
    const name = dishName.toLowerCase();
    const guesses = [name];

    // Add variations without common words
    if (name.includes(" ")) {
      // Add version without articles/prepositions
      const withoutCommon = name
        .replace(/\b(the|a|an|with|and|or|in|on|at)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (withoutCommon !== name) {
        guesses.push(withoutCommon);
      }

      // Add just the main word (first significant word)
      const words = name
        .split(" ")
        .filter(
          (word) => !["the", "a", "an", "with", "and", "or"].includes(word)
        );
      if (words.length > 1 && words[0].length > 3) {
        guesses.push(words[0]);
      }
    }

    // Add plurals/singulars
    if (name.endsWith("s") && name.length > 4) {
      guesses.push(name.slice(0, -1)); // Remove 's'
    } else if (!name.endsWith("s")) {
      guesses.push(name + "s"); // Add 's'
    }

    // Remove duplicates and return max 4 guesses
    return [...new Set(guesses)].slice(0, 4);
  }

  /**
   * Generate a placeholder blurb that can be manually refined
   */
  private generatePlaceholderBlurb(
    dishName: string,
    ingredients: string[]
  ): string {
    const mainIngredients = ingredients.slice(0, 3).join(", ");
    return `A delicious dish featuring ${mainIngredients} and other flavorful ingredients. [REVIEW: Add cultural context and appetizing description]`;
  }

  /**
   * Format instructions into recipe ingredients list (different from hint ingredients)
   */
  private formatRecipeIngredients(/* _instructions: string[] */): string[] {
    // For now, return a placeholder - this would need more sophisticated parsing
    // The API service already provides the core ingredients for hints
    return [
      "[REVIEW: Add detailed recipe ingredients with measurements]",
      "// This will need manual refinement based on the instructions below",
    ];
  }

  /**
   * Generate basic tags based on ingredients and dish name
   */
  private generateTags(dishName: string, ingredients: string[]): string[] {
    const tags: string[] = [];
    const name = dishName.toLowerCase();

    // Protein tags
    if (
      ingredients.some((ing) =>
        ["chicken", "beef", "pork", "fish", "shrimp", "salmon"].includes(
          ing.toLowerCase()
        )
      )
    ) {
      tags.push("protein-rich");
    }

    if (
      ingredients.some((ing) =>
        ["tofu", "beans", "lentils"].includes(ing.toLowerCase())
      )
    ) {
      tags.push("vegetarian");
    }

    // Cooking method tags (basic detection)
    if (name.includes("stir") || name.includes("wok")) {
      tags.push("stir-fried");
    } else if (name.includes("soup") || name.includes("broth")) {
      tags.push("soup");
    } else if (
      name.includes("pasta") ||
      ingredients.some((ing) => ing.includes("pasta"))
    ) {
      tags.push("pasta");
    } else if (
      name.includes("rice") ||
      ingredients.some((ing) => ing.includes("rice"))
    ) {
      tags.push("rice-based");
    }

    // Spice level (very basic)
    if (
      ingredients.some((ing) =>
        ["pepper", "chili", "spicy"].some((spice) =>
          ing.toLowerCase().includes(spice)
        )
      )
    ) {
      tags.push("spicy");
    }

    return tags.length > 0 ? tags : ["main-course"];
  }

  private logGeneratedData(dishData: GeneratedDishData): void {
    console.log("\n🎯 Generated Dish Data Summary:");
    console.log("================================");
    console.log(`📛 Name: ${dishData.name}`);
    console.log(
      `🥘 Ingredients (${
        dishData.ingredients?.length
      }): ${dishData.ingredients?.join(", ")}`
    );
    console.log(
      `🤔 Acceptable Guesses: ${dishData.acceptableGuesses?.join(", ")}`
    );
    console.log(`🏷️ Tags: ${dishData.tags?.join(", ")}`);
    console.log(
      `💪 Protein: ${
        dishData.proteinPerServing
          ? dishData.proteinPerServing + "g"
          : "Not available"
      }`
    );
    console.log(
      `📸 Image: ${dishData.imageUrl ? "Available" : "Not available"}`
    );
    console.log(`📊 Data Source: ${dishData.dataSource}`);
    console.log(`⚠️ Review Status: ${dishData.reviewStatus}`);
    console.log("================================\n");

    if (!dishData.country) {
      console.log("🚨 MANUAL REVIEW NEEDED:");
      console.log("- Add country of origin");
      console.log("- Review and improve blurb");
      console.log("- Add detailed recipe ingredients with measurements");
      console.log(
        "- Verify ingredient list is appropriate (no location hints)"
      );
      console.log("- Check acceptable guesses list\n");
    }
  }
}

export default RecipeDataFetcher;
