import { GameConfig, GameTypeId } from "@/config/games/types";
import { foodForThoughtConfig } from "@/config/games/food-for-thought";
import { italianPastaConfig } from "@/config/games/italian-pasta";

export interface ArchiveConfig {
  cookieName: string;
  storageKey: string;
  availableDatesEndpoint: string;
  unlockEndpoint: string;
  dailyEndpoint: string;
  tableName: string;
  gameRoute: string;
}

export function getArchiveConfig(gameConfig: GameConfig): ArchiveConfig {
  const cookieName = `${gameConfig.id.replace(/-/g, '_')}_archives_unlock`;
  const storageKey = `${gameConfig.id}-archives-unlock`;

  return {
    cookieName,
    storageKey,
    availableDatesEndpoint: `${gameConfig.apiPrefix}/available-dates`,
    unlockEndpoint: `${gameConfig.apiPrefix}/archive-unlock`,
    dailyEndpoint: `${gameConfig.apiPrefix}/daily`,
    tableName: gameConfig.tableName,
    gameRoute: gameConfig.urlPath,
  };
}

export function getArchiveConfigById(gameTypeId: GameTypeId): ArchiveConfig {
  const configs: Record<GameTypeId, GameConfig> = {
    "food-for-thought": foodForThoughtConfig,
    "italian-pasta": italianPastaConfig,
  };

  const gameConfig = configs[gameTypeId];
  if (!gameConfig) {
    throw new Error(`Unknown game type: ${gameTypeId}`);
  }

  return getArchiveConfig(gameConfig);
}
