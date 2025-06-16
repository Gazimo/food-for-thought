import AIService from "../services/aiService";
import { Dish } from "../types/dishes";

interface GeneratedDishData extends Partial<Dish> {
  dataSource: "ai-generated";
  generatedAt: string;
  reviewStatus: "draft" | "reviewed" | "published";
}

class RecipeDataFetcher {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async fetchDishData(dishName: string): Promise<GeneratedDishData | null> {
    console.log(`🚀 Generating complete dish data for: ${dishName}`);

    try {
      // Generate complete dish data using AI
      const aiDishData = await this.aiService.generateCompleteDish(dishName);
      if (!aiDishData) {
        console.error(`❌ Failed to generate AI data for: ${dishName}`);
        return null;
      }

      // Convert AI data to our dish format
      const dishData: GeneratedDishData = {
        name: aiDishData.name,
        ingredients: aiDishData.ingredients,
        acceptableGuesses: aiDishData.acceptableGuesses,
        country: aiDishData.country,
        blurb: aiDishData.blurb,
        imageUrl: "", // Will be set by the generator
        proteinPerServing: aiDishData.proteinPerServing,
        recipe: aiDishData.recipe,
        tags: aiDishData.tags,

        // Metadata
        dataSource: "ai-generated",
        generatedAt: new Date().toISOString(),
        reviewStatus: "draft",
      };

      console.log(`✅ Generated complete dish data for: ${dishName}`);
      this.logGeneratedData(dishData);

      return dishData;
    } catch (error) {
      console.error(`💥 Error generating dish data for ${dishName}:`, error);
      return null;
    }
  }

  private logGeneratedData(dishData: GeneratedDishData): void {
    console.log("\n🎯 Generated Dish Data Summary:");
    console.log("================================");
    console.log(`📛 Name: ${dishData.name}`);
    console.log(`🌍 Country: ${dishData.country}`);
    console.log(
      `🥘 Ingredients (${
        dishData.ingredients?.length
      }): ${dishData.ingredients?.join(", ")}`
    );
    console.log(
      `🤔 Acceptable Guesses: ${dishData.acceptableGuesses?.join(", ")}`
    );
    console.log(`📝 Blurb: ${dishData.blurb}`);
    console.log(
      `💪 Protein: ${
        dishData.proteinPerServing
          ? dishData.proteinPerServing + "g"
          : "Not available"
      }`
    );
    console.log(`🏷️ Tags: ${dishData.tags?.join(", ")}`);
    console.log(
      `🧾 Recipe Ingredients: ${
        dishData.recipe?.ingredients?.length || 0
      } items`
    );
    console.log(
      `📋 Recipe Instructions: ${
        dishData.recipe?.instructions?.length || 0
      } steps`
    );
    console.log(`📊 Data Source: ${dishData.dataSource}`);
    console.log(`⚠️ Review Status: ${dishData.reviewStatus}`);
    console.log("================================\n");

    // Show sample recipe content
    if (
      dishData.recipe?.ingredients &&
      dishData.recipe.ingredients.length > 0
    ) {
      console.log("📋 Sample Recipe Ingredients:");
      dishData.recipe.ingredients.slice(0, 3).forEach((ingredient, index) => {
        console.log(`   ${index + 1}. ${ingredient}`);
      });
      if (dishData.recipe.ingredients.length > 3) {
        console.log(
          `   ... and ${dishData.recipe.ingredients.length - 3} more`
        );
      }
    }

    if (
      dishData.recipe?.instructions &&
      dishData.recipe.instructions.length > 0
    ) {
      console.log("\n📋 Sample Recipe Instructions:");
      dishData.recipe.instructions.slice(0, 2).forEach((instruction, index) => {
        console.log(`   ${index + 1}. ${instruction}`);
      });
      if (dishData.recipe.instructions.length > 2) {
        console.log(
          `   ... and ${dishData.recipe.instructions.length - 2} more steps`
        );
      }
    }

    console.log("\n✅ Dish is ready for database insertion!");
  }
}

export default RecipeDataFetcher;
