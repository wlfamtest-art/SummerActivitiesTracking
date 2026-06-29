import type {
  ActivityCategory,
  ApprovalMode,
  RestDayType,
  RewardRedemptionStatus,
  UnlockMode,
  Weekday,
} from "../game/types";

export interface DemoFamily {
  id: string;
  name: string;
  time_zone: string;
  created_at: string;
  updated_at: string;
}

export interface DemoUser {
  id: string;
  family_id: string;
  email: string;
  role: "parent";
  kid_mode_pin_hash: string;
  created_at: string;
  updated_at: string;
}

export interface DemoChild {
  id: string;
  family_id: string;
  name: string;
  avatar: string;
  age_band: "younger" | "older";
  total_xp: number;
  coin_balance: number;
  current_level: number;
  created_at: string;
  updated_at: string;
}

export interface DemoAssignedQuest {
  id: string;
  child_id: string;
  name: string;
  icon: string;
  category: ActivityCategory;
  duration_minutes: number;
  xp_value: number;
  coin_value: number;
  active_days: readonly Weekday[];
  suggested_time_window: string;
  completion_deadline: string;
  approval_mode: ApprovalMode;
  unlock_mode: UnlockMode;
  prerequisite_quest_ids: readonly string[];
  parent_note: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DemoQuestInstance {
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
  status: "not_started" | "in_progress" | "submitted" | "completed" | "denied";
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  denied_at: string | null;
  denial_note: string | null;
  elapsed_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface DemoReward {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  coin_cost: number;
  description: string;
  approval_required: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DemoRewardRedemption {
  id: string;
  reward_id: string;
  child_id: string;
  status: RewardRedemptionStatus;
  cost: number;
  requested_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemoXpTransaction {
  id: string;
  child_id: string;
  quest_instance_id: string | null;
  amount: number;
  reason: string;
  created_at: string;
}

export interface DemoCoinTransaction {
  id: string;
  child_id: string;
  quest_instance_id: string | null;
  reward_redemption_id: string | null;
  amount: number;
  reason: string;
  created_at: string;
}

export interface DemoRestDay {
  id: string;
  child_id: string;
  date: string;
  type: RestDayType;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SummerQuestState {
  families: DemoFamily[];
  users: DemoUser[];
  children: DemoChild[];
  assigned_quests: DemoAssignedQuest[];
  quest_instances: DemoQuestInstance[];
  rewards: DemoReward[];
  reward_redemptions: DemoRewardRedemption[];
  xp_transactions: DemoXpTransaction[];
  coin_transactions: DemoCoinTransaction[];
  rest_days: DemoRestDay[];
}

const STORAGE_KEY = "summer-quest-demo-state";
let memoryState: SummerQuestState | null = null;

export function createInitialState(): SummerQuestState {
  return {
    families: [],
    users: [],
    children: [],
    assigned_quests: [],
    quest_instances: [],
    rewards: [],
    reward_redemptions: [],
    xp_transactions: [],
    coin_transactions: [],
    rest_days: [],
  };
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadState(): SummerQuestState {
  if (hasLocalStorage()) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as SummerQuestState : createInitialState();
  }

  return memoryState ? structuredClone(memoryState) : createInitialState();
}

export function saveState(state: SummerQuestState): void {
  if (hasLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return;
  }

  memoryState = structuredClone(state);
}

export function resetState(): void {
  if (hasLocalStorage()) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  memoryState = null;
}
