import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { Database } from "../src/types/database";
import RecipeDataFetcher from "../src/utils/recipeDataFetcher";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface BatchDish {
  originalName: string;
  generated: any;
  confidenceScore: number;
  issues: string[];
  status: "high_confidence" | "needs_review" | "failed";
}

class BatchDishGenerator {
  private fetcher: RecipeDataFetcher;
  private supabase: ReturnType<typeof createClient<Database>> | null = null;

  constructor() {
    this.fetcher = new RecipeDataFetcher();
  }

  async processBatch(dishNames: string[]): Promise<BatchDish[]> {
    console.log(`🚀 Processing batch of ${dishNames.length} dishes`);
    console.log("=".repeat(50));

    const results: BatchDish[] = [];
    let processed = 0;

    for (const dishName of dishNames) {
      processed++;
      console.log(
        `\n[${processed}/${dishNames.length}] Processing: ${dishName}`
      );

      try {
        const generated = await this.fetcher.fetchDishData(dishName.trim());

        if (!generated) {
          results.push({
            originalName: dishName,
            generated: null,
            confidenceScore: 0,
            issues: ["Failed to generate data from APIs"],
            status: "failed",
          });
          continue;
        }

        const { score, issues, status } =
          this.calculateConfidenceScore(generated);

        results.push({
          originalName: dishName,
          generated,
          confidenceScore: score,
          issues,
          status,
        });

        console.log(`   ✅ Generated (${score}% confidence) - ${status}`);

        // Small delay to be respectful to APIs
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`   ❌ Failed: ${error}`);
        results.push({
          originalName: dishName,
          generated: null,
          confidenceScore: 0,
          issues: [`Generation error: ${error}`],
          status: "failed",
        });
      }
    }

    return results;
  }

  private calculateConfidenceScore(dish: any): {
    score: number;
    issues: string[];
    status: "high_confidence" | "needs_review" | "failed";
  } {
    let score = 0;
    const issues: string[] = [];

    // Core data quality checks
    if (dish.ingredients && dish.ingredients.length === 6) {
      score += 25;
    } else {
      issues.push(`Ingredients: ${dish.ingredients?.length || 0}/6`);
    }

    if (dish.proteinPerServing && dish.proteinPerServing > 0) {
      score += 20;
    } else {
      issues.push("Missing protein data");
    }

    if (dish.imageUrl && dish.imageUrl.length > 0) {
      score += 15;
    } else {
      issues.push("Missing image");
    }

    if (
      dish.recipe &&
      dish.recipe.instructions &&
      dish.recipe.instructions.length > 0
    ) {
      score += 15;
    } else {
      issues.push("Missing cooking instructions");
    }

    if (dish.acceptableGuesses && dish.acceptableGuesses.length >= 2) {
      score += 10;
    } else {
      issues.push("Insufficient acceptable guesses");
    }

    if (dish.tags && dish.tags.length > 0) {
      score += 10;
    } else {
      issues.push("Missing tags");
    }

    // Bonus points for good data source
    if (dish.dataSource === "spoonacular") {
      score += 5;
    }

    // Determine status
    let status: "high_confidence" | "needs_review" | "failed";
    if (score >= 85) {
      status = "high_confidence";
    } else if (score >= 60) {
      status = "needs_review";
    } else {
      status = "failed";
    }

    return { score, issues, status };
  }

  async saveBatchResults(results: BatchDish[], outputPath: string) {
    // Save to JSON file for review
    const summary = {
      timestamp: new Date().toISOString(),
      total: results.length,
      highConfidence: results.filter((r) => r.status === "high_confidence")
        .length,
      needsReview: results.filter((r) => r.status === "needs_review").length,
      failed: results.filter((r) => r.status === "failed").length,
      dishes: results,
    };

    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    console.log(`\n📁 Batch results saved to: ${outputPath}`);

    // Print summary
    console.log("\n📊 BATCH SUMMARY:");
    console.log("==================");
    console.log(`Total processed: ${summary.total}`);
    console.log(`✅ High confidence (85%+): ${summary.highConfidence}`);
    console.log(`⚠️ Needs review (60-84%): ${summary.needsReview}`);
    console.log(`❌ Failed (<60%): ${summary.failed}`);

    if (summary.highConfidence > 0) {
      console.log(
        `\n🚀 Ready to auto-approve: ${summary.highConfidence} dishes`
      );
    }

    if (summary.needsReview > 0) {
      console.log(`📝 Need manual review: ${summary.needsReview} dishes`);
    }
  }

  async autoApproveDishes(batchFile: string, dryRun: boolean = true) {
    console.log("🤖 Auto-approval process starting...");

    const batchData = JSON.parse(fs.readFileSync(batchFile, "utf8"));
    const highConfidenceDishes = batchData.dishes.filter(
      (d: BatchDish) => d.status === "high_confidence"
    );

    console.log(`Found ${highConfidenceDishes.length} high-confidence dishes`);

    if (dryRun) {
      console.log("🧪 DRY RUN - No dishes will be saved to database");
      highConfidenceDishes.forEach((dish: BatchDish, index: number) => {
        console.log(
          `${index + 1}. ${dish.generated.name} (${dish.confidenceScore}%)`
        );
      });
      return;
    }

    // TODO: Actually save to database with auto-generated countries and scheduled release dates
    console.log("💾 Would save to database...");
  }
}

async function main() {
  const command = process.argv[2];
  const filePath = process.argv[3];

  if (!command || !filePath) {
    console.log("Usage:");
    console.log("  npm run generate-batch process dishes-list.txt");
    console.log(
      "  npm run generate-batch approve batch-results.json [--dry-run]"
    );
    process.exit(1);
  }

  const generator = new BatchDishGenerator();

  if (command === "process") {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    const dishNames = fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    console.log(`📝 Found ${dishNames.length} dishes to process`);

    const results = await generator.processBatch(dishNames);
    const outputPath = `batch-results-${Date.now()}.json`;
    await generator.saveBatchResults(results, outputPath);
  } else if (command === "approve") {
    const dryRun = process.argv[4] !== "--save";
    await generator.autoApproveDishes(filePath, dryRun);
  } else {
    console.error('❌ Unknown command. Use "process" or "approve"');
    process.exit(1);
  }
}

main().catch(console.error);
