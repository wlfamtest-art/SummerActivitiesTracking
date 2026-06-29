import type {
  ActivityCategory,
  ApprovalMode,
  QuestInstanceStatus,
  UnlockMode,
  Weekday,
} from "../game/types";

export interface DailyAssignedQuest {
  id: string;
  child_id: string;
  name: string;
  icon: string;
  category: ActivityCategory;
  duration_minutes: number;
  active_days: readonly Weekday[];
  suggested_time_window: string;
  completion_deadline: string;
  approval_mode: ApprovalMode;
  xp_value: number;
  coin_value: number;
  unlock_mode: UnlockMode;
  prerequisite_quest_ids: readonly string[];
  parent_note: string | null;
  active: boolean;
}

export interface DailyQuestInstance {
  id: string;
  assigned_quest_id: string;
  child_id: string;
  quest_date: string;
  name: string;
  icon: string;
  category: ActivityCategory;
  duration_minutes: number;
  xp_value: number;
  coin_value: number;
  approval_mode: ApprovalMode;
  suggested_time_window: string;
  completion_deadline: string;
  parent_note: string | null;
  status: QuestInstanceStatus;
  elapsed_seconds: number;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  denied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyRestDayInput {
  type: string;
  message?: string;
}

export interface GenerateDailyQuestInstancesInput {
  assignedQuests: readonly DailyAssignedQuest[];
  existingInstances: readonly DailyQuestInstance[];
  restDay?: DailyRestDayInput | null;
  dateKey: string;
  weekday: Weekday;
  now?: string;
}

export interface GenerateDailyQuestInstancesResult {
  instances: readonly DailyQuestInstance[];
  createdInstances: DailyQuestInstance[];
  restDay: {
    active: boolean;
    message: string | null;
  };
}

function getTimestamp(now?: string): string {
  return now ?? new Date().toISOString();
}

function createInstance(
  quest: DailyAssignedQuest,
  dateKey: string,
  timestamp: string,
): DailyQuestInstance {
  return {
    id: `${quest.id}-${dateKey}`,
    assigned_quest_id: quest.id,
    child_id: quest.child_id,
    quest_date: dateKey,
    name: quest.name,
    icon: quest.icon,
    category: quest.category,
    duration_minutes: quest.duration_minutes,
    xp_value: quest.xp_value,
    coin_value: quest.coin_value,
    approval_mode: quest.approval_mode,
    suggested_time_window: quest.suggested_time_window,
    completion_deadline: quest.completion_deadline,
    parent_note: quest.parent_note,
    status: "not_started",
    elapsed_seconds: 0,
    started_at: null,
    submitted_at: null,
    completed_at: null,
    denied_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function generateDailyQuestInstances(
  input: GenerateDailyQuestInstancesInput,
): GenerateDailyQuestInstancesResult {
  if (input.restDay) {
    return {
      instances: input.existingInstances,
      createdInstances: [],
      restDay: {
        active: true,
        message: input.restDay.message ?? input.restDay.type,
      },
    };
  }

  const timestamp = getTimestamp(input.now);
  const seenKeys = new Set(input.existingInstances.map((instance) => {
    return `${instance.assigned_quest_id}:${instance.quest_date}`;
  }));
  const createdInstances: DailyQuestInstance[] = [];

  for (const quest of input.assignedQuests) {
    const uniqueKey = `${quest.id}:${input.dateKey}`;

    if (!quest.active || !quest.active_days.includes(input.weekday) || seenKeys.has(uniqueKey)) {
      continue;
    }

    seenKeys.add(uniqueKey);
    createdInstances.push(createInstance(quest, input.dateKey, timestamp));
  }

  return {
    instances: [...input.existingInstances, ...createdInstances],
    createdInstances,
    restDay: {
      active: false,
      message: null,
    },
  };
}
