export type ChildProfile = {
  recurring_struggles: string[];
  preferred_grounding_strategy: string | null;
  session_count: number;
};

export type ChildProfileRecord = ChildProfile & {
  child_id: string;
  locked: boolean;
  locked_at: string | null;
  is_synthetic: true;
};

export type ParsedInsight = {
  insight: string;
  recurringStruggle: string | null;
  preferredGroundingStrategy: string | null;
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
