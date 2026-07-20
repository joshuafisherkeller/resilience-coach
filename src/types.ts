export type ChildProfile = {
  recurring_struggles: string[];
  preferred_grounding_strategy: string | null;
  session_count: number;
};

export type PracticeSummary = {
  practiced_strategies: string[];
  support_preference: string | null;
  next_time_plan: string | null;
  session_count: number;
};

export type ChildProfileRecord = ChildProfile & {
  child_id: string;
  practiced_strategies: string[];
  support_preference: string | null;
  last_next_time_plan: string | null;
  locked: boolean;
  locked_at: string | null;
  is_synthetic: true;
};

export type ParsedInsight = {
  insight: string;
  recurringStruggle: string | null;
  preferredGroundingStrategy: string | null;
  practicedStrategies: string[];
  supportPreference: string | null;
  nextTimePlan: string | null;
};

export type SafetyHandoffRecord = {
  id: number;
  child_id: string;
  requested_at: string;
  recorded_at: string;
  notification_mode: "simulated_log";
  notification_status: "logged";
};

export interface ProfileRepository {
  getProfile(childId: string): Promise<ChildProfileRecord | null>;
  updateProfile(
    childId: string,
    parsed: ParsedInsight,
  ): Promise<ChildProfileRecord>;
  triggerSafetyHandoff(
    childId: string,
    requestedAt: string,
  ): Promise<SafetyHandoffRecord>;
  resetSyntheticDemo(): Promise<void>;
}
