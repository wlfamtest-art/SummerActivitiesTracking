import type { QuestInstanceStatus, UnlockMode, Weekday } from "./types";

export interface UnlockableQuest {
  id: string;
  name: string;
  active: boolean;
  active_days: readonly Weekday[];
  unlock_mode: UnlockMode;
  prerequisite_quest_ids: readonly string[];
}

export interface UnlockQuestInstance {
  assigned_quest_id: string;
  status: QuestInstanceStatus;
}

export interface UnlockValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UnlockState {
  unlocked: boolean;
  lockedMessage: string | null;
}

function createQuestMap(quests: readonly UnlockableQuest[]): Map<string, UnlockableQuest> {
  return new Map(quests.map((quest) => [quest.id, quest]));
}

function hasSharedActiveDay(quests: readonly UnlockableQuest[]): boolean {
  if (quests.length === 0) {
    return true;
  }

  let sharedDays = new Set(quests[0].active_days);

  for (const quest of quests.slice(1)) {
    const activeDays = new Set(quest.active_days);
    sharedDays = new Set([...sharedDays].filter((day) => activeDays.has(day)));
  }

  return sharedDays.size > 0;
}

function titleizeQuestId(id: string): string {
  const knownNames: Record<string, string> = {
    outdoor: "Outdoor Play",
    "outdoor-play": "Outdoor Play",
    "starter-outdoor-play": "Outdoor Play",
    reading: "Reading",
    "starter-reading": "Reading",
    chores: "Chores",
    "starter-chores": "Chores",
    screen: "Screen Time",
    "screen-time": "Screen Time",
    "starter-screen-time": "Screen Time",
  };

  if (knownNames[id]) {
    return knownNames[id];
  }

  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatQuestList(names: readonly string[]): string {
  if (names.length === 0) {
    return "";
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function getQuestDisplayName(id: string, questMap?: ReadonlyMap<string, UnlockableQuest>): string {
  return questMap?.get(id)?.name ?? titleizeQuestId(id);
}

function hasCircularDependency(
  currentId: string,
  targetId: string,
  questMap: ReadonlyMap<string, UnlockableQuest>,
  seen: Set<string>,
): boolean {
  if (seen.has(currentId)) {
    return false;
  }

  seen.add(currentId);
  const current = questMap.get(currentId);

  if (!current) {
    return false;
  }

  for (const prerequisiteId of current.prerequisite_quest_ids) {
    if (prerequisiteId === targetId) {
      return true;
    }

    if (hasCircularDependency(prerequisiteId, targetId, questMap, seen)) {
      return true;
    }
  }

  return false;
}

function collectDependencyPaths(
  quest: UnlockableQuest,
  questMap: ReadonlyMap<string, UnlockableQuest>,
  currentPath: UnlockableQuest[] = [quest],
  paths: UnlockableQuest[][] = [],
  seen: Set<string> = new Set(),
): UnlockableQuest[][] {
  if (seen.has(quest.id)) {
    return paths;
  }

  seen.add(quest.id);

  if (quest.prerequisite_quest_ids.length === 0) {
    paths.push(currentPath);
    return paths;
  }

  for (const prerequisiteId of quest.prerequisite_quest_ids) {
    const prerequisite = questMap.get(prerequisiteId);

    if (!prerequisite) {
      continue;
    }

    collectDependencyPaths(prerequisite, questMap, [...currentPath, prerequisite], paths, new Set(seen));
  }

  return paths;
}

function collectPrerequisiteChainQuests(
  quest: UnlockableQuest,
  questMap: ReadonlyMap<string, UnlockableQuest>,
  collected: UnlockableQuest[] = [],
  seen: Set<string> = new Set(),
): UnlockableQuest[] {
  for (const prerequisiteId of quest.prerequisite_quest_ids) {
    if (seen.has(prerequisiteId)) {
      continue;
    }

    const prerequisite = questMap.get(prerequisiteId);

    if (!prerequisite) {
      continue;
    }

    seen.add(prerequisiteId);
    collected.push(prerequisite);
    collectPrerequisiteChainQuests(prerequisite, questMap, collected, seen);
  }

  return collected;
}

export function validateUnlockRule(
  quest: UnlockableQuest,
  allQuests: readonly UnlockableQuest[],
): UnlockValidationResult {
  const questMap = createQuestMap(allQuests);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const prerequisiteId of quest.prerequisite_quest_ids) {
    const prerequisite = questMap.get(prerequisiteId);

    if (prerequisiteId === quest.id) {
      errors.push(`${quest.name} cannot depend on itself.`);
      continue;
    }

    if (!prerequisite) {
      errors.push(`${quest.name} depends on unknown quest ${prerequisiteId}.`);
      continue;
    }

    if (!prerequisite.active) {
      errors.push(`${quest.name} depends on inactive quest ${prerequisite.name}.`);
    }

    if (!hasSharedActiveDay([quest, prerequisite])) {
      warnings.push(`${quest.name} and ${prerequisite.name} do not share active days.`);
      errors.push(
        `${quest.name} cannot unlock from ${prerequisite.name} because they share no active days.`,
      );
    }

    if (hasCircularDependency(prerequisiteId, quest.id, questMap, new Set())) {
      errors.push(`${quest.name} has a circular unlock dependency.`);
    }
  }

  for (const path of collectDependencyPaths(quest, questMap)) {
    if (!hasSharedActiveDay(path)) {
      const lastPrerequisite = path[path.length - 1];
      errors.push(
        `${quest.name} has an impossible unlock chain through ${lastPrerequisite.name}.`,
      );
    }
  }

  if (quest.unlock_mode === "after_multiple" && quest.prerequisite_quest_ids.length > 1) {
    const prerequisiteChainQuests = collectPrerequisiteChainQuests(
      quest,
      questMap,
      [],
      new Set([quest.id]),
    );
    const requiredSameDayQuests = [...prerequisiteChainQuests, quest];

    if (!hasSharedActiveDay(requiredSameDayQuests)) {
      errors.push(
        `${quest.name} has impossible after-multiple unlock requirements because ${formatQuestList(
          requiredSameDayQuests.map((requiredQuest) => requiredQuest.name),
        )} share no active day.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
  };
}

export function getUnlockState(
  quest: Pick<UnlockableQuest, "unlock_mode" | "prerequisite_quest_ids">,
  sameDateInstances: readonly UnlockQuestInstance[],
  allQuests: readonly UnlockableQuest[] = [],
): UnlockState {
  if (quest.unlock_mode === "always" || quest.prerequisite_quest_ids.length === 0) {
    return {
      unlocked: true,
      lockedMessage: null,
    };
  }

  const completedPrerequisiteIds = new Set(
    sameDateInstances
      .filter((instance) => instance.status === "completed")
      .map((instance) => instance.assigned_quest_id),
  );

  const requiredIds = quest.prerequisite_quest_ids;
  const unlocked =
    quest.unlock_mode === "after_one"
      ? requiredIds.some((id) => completedPrerequisiteIds.has(id))
      : requiredIds.every((id) => completedPrerequisiteIds.has(id));

  if (unlocked) {
    return {
      unlocked: true,
      lockedMessage: null,
    };
  }

  const questMap = allQuests.length > 0 ? createQuestMap(allQuests) : undefined;
  const prerequisiteNames = requiredIds.map((id) => getQuestDisplayName(id, questMap));
  const verb = prerequisiteNames.length === 1 ? "is" : "are";
  const noun = prerequisiteNames.length === 1 ? "complete" : "complete";

  return {
    unlocked: false,
    lockedMessage: `Locked until ${formatQuestList(prerequisiteNames)} ${verb} ${noun}.`,
  };
}
