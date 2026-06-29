export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ActivityCategory =
  | "Learning"
  | "Physical"
  | "Creative"
  | "Music"
  | "Life Skills"
  | "Screen"
  | "Custom";

export type ApprovalMode = "auto" | "parent";

export type UnlockMode = "always" | "after_one" | "after_multiple";

export type QuestInstanceStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "completed"
  | "denied";

export type RewardRedemptionStatus =
  | "requested"
  | "approved"
  | "denied"
  | "approved_for_later"
  | "cancelled";

export type RestDayType =
  | "rest_day"
  | "sick_day"
  | "travel_day"
  | "camp_day"
  | "family_day"
  | "parent_excused_day";

export interface LevelDefinition {
  level: number;
  xp: number;
  title: string;
}

export interface ActivityTemplate {
  id: string;
  name: string;
  icon: string;
  category: ActivityCategory;
  duration_minutes: number;
  approval_mode: ApprovalMode;
}

export interface StarterQuest {
  id: string;
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
}

export interface StarterReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  active: boolean;
}

export interface Family {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  family_id: string;
  email: string | null;
  display_name: string;
  role: "parent";
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  avatar: string;
  age_band: string;
  timezone: string;
  total_xp: number;
  coin_balance: number;
  kid_pin_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityTemplateRecord extends ActivityTemplate {
  family_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignedQuest extends StarterQuest {
  child_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestInstance {
  id: string;
  assigned_quest_id: string;
  child_id: string;
  local_date: string;
  name: string;
  category: ActivityCategory;
  icon: string;
  duration_minutes: number;
  approval_mode: ApprovalMode;
  xp_value: number;
  coin_value: number;
  status: QuestInstanceStatus;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  denied_at: string | null;
  elapsed_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface Reward extends StarterReward {
  child_id: string;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
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

export interface XpTransaction {
  id: string;
  child_id: string;
  quest_instance_id: string | null;
  amount: number;
  reason: string;
  created_at: string;
}

export interface CoinTransaction {
  id: string;
  child_id: string;
  quest_instance_id: string | null;
  reward_redemption_id: string | null;
  amount: number;
  reason: string;
  created_at: string;
}

export interface RestDay {
  id: string;
  child_id: string;
  local_date: string;
  type: RestDayType;
  note: string | null;
  created_at: string;
  updated_at: string;
}
