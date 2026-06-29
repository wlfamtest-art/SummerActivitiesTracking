import { LEVELS } from "./constants";
import type { LevelDefinition } from "./types";

export interface LevelProgress {
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  currentXp: number;
  nextLevelXp: number | null;
  xpIntoLevel: number;
  xpForNextLevel: number;
  percent: number;
}

const MAX_LEVEL = LEVELS[LEVELS.length - 1];
const LEVEL_20_MESSAGE =
  "You’ve reached Legendary Adventurer — the highest rank! Keep completing quests to earn more Gold Coins.";

function sanitizeXp(totalXp: number): number {
  return Number.isFinite(totalXp) && totalXp > 0 ? totalXp : 0;
}

function copyLevel(level: LevelDefinition): LevelDefinition {
  return { ...level };
}

export function getLevelForXp(totalXp: number): LevelDefinition {
  const safeTotalXp = sanitizeXp(totalXp);
  let currentLevel: LevelDefinition = LEVELS[0];

  for (const level of LEVELS) {
    if (safeTotalXp < level.xp) {
      break;
    }

    currentLevel = level;
  }

  return copyLevel(currentLevel.level > MAX_LEVEL.level ? MAX_LEVEL : currentLevel);
}

export function getLevelProgress(totalXp: number): LevelProgress {
  const safeTotalXp = sanitizeXp(totalXp);
  const currentLevel = getLevelForXp(totalXp);
  const nextLevel = LEVELS.find((level) => level.level === currentLevel.level + 1) ?? null;
  const xpIntoLevel = Math.max(0, safeTotalXp - currentLevel.xp);

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      currentXp: safeTotalXp,
      nextLevelXp: null,
      xpIntoLevel,
      xpForNextLevel: 0,
      percent: 100,
    };
  }

  const xpForNextLevel = nextLevel.xp - currentLevel.xp;
  const percent = Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpForNextLevel) * 100)));

  return {
    currentLevel,
    nextLevel: copyLevel(nextLevel),
    currentXp: safeTotalXp,
    nextLevelXp: nextLevel.xp,
    xpIntoLevel,
    xpForNextLevel,
    percent,
  };
}

export function getLevelMessage(totalXp: number): string | null {
  return getLevelForXp(totalXp).level === MAX_LEVEL.level ? LEVEL_20_MESSAGE : null;
}
