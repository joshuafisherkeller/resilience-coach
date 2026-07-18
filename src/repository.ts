import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppConfig } from "./config.js";
import type {
  ChildProfileRecord,
  ParsedInsight,
  ProfileRepository,
  SafetyHandoffRecord,
} from "./types.js";

const syntheticSeeds: ChildProfileRecord[] = [
  {
    child_id: "demo-sharing",
    recurring_struggles: ["sharing and taking turns"],
    preferred_grounding_strategy: "one slow belly breath",
    session_count: 0,
    locked: false,
    locked_at: null,
    is_synthetic: true,
  },
  {
    child_id: "demo-mistakes",
    recurring_struggles: ["making mistakes", "wanting to give up"],
    preferred_grounding_strategy: "shake hands out",
    session_count: 0,
    locked: false,
    locked_at: null,
    is_synthetic: true,
  },
  {
    child_id: "demo-change",
    recurring_struggles: ["unexpected changes"],
    preferred_grounding_strategy: "name five things you can see",
    session_count: 0,
    locked: false,
    locked_at: null,
    is_synthetic: true,
  },
];

function copyProfile(profile: ChildProfileRecord): ChildProfileRecord {
  return { ...profile, recurring_struggles: [...profile.recurring_struggles] };
}

function rowObject(value: unknown): Record<string, unknown> {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || typeof candidate !== "object") {
    throw new Error("Supabase returned an invalid row");
  }
  return candidate as Record<string, unknown>;
}

function normalizeProfile(value: unknown): ChildProfileRecord {
  const row = rowObject(value);
  if (row.is_synthetic !== true) {
    throw new Error("Only synthetic profiles are allowed");
  }
  return {
    child_id: String(row.child_id),
    recurring_struggles: Array.isArray(row.recurring_struggles)
      ? row.recurring_struggles.map(String)
      : [],
    preferred_grounding_strategy:
      row.preferred_grounding_strategy === null
        ? null
        : String(row.preferred_grounding_strategy),
    session_count: Number(row.session_count),
    locked: Boolean(row.locked),
    locked_at: row.locked_at === null ? null : String(row.locked_at),
    is_synthetic: true,
  };
}

function normalizeHandoff(value: unknown): SafetyHandoffRecord {
  const row = rowObject(value);
  return {
    id: Number(row.id),
    child_id: String(row.child_id),
    requested_at: String(row.requested_at),
    recorded_at: String(row.recorded_at),
    notification_mode: "simulated_log",
    notification_status: "logged",
  };
}

export class SupabaseProfileRepository implements ProfileRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: { headers: { "X-Client-Info": "resilience-coach/0.1.0" } },
    });
  }

  async getProfile(childId: string): Promise<ChildProfileRecord | null> {
    const { data, error } = await this.client
      .from("child_profiles")
      .select(
        "child_id, recurring_struggles, preferred_grounding_strategy, session_count, locked, locked_at, is_synthetic",
      )
      .eq("child_id", childId)
      .maybeSingle();
    if (error) throw new Error(`Could not load child profile: ${error.message}`);
    return data ? normalizeProfile(data) : null;
  }

  async updateProfile(
    childId: string,
    parsed: ParsedInsight,
  ): Promise<ChildProfileRecord> {
    const { data, error } = await this.client.rpc(
      "update_child_profile_atomic",
      {
        p_child_id: childId,
        p_insight: parsed.insight,
        p_recurring_struggle: parsed.recurringStruggle,
        p_preferred_grounding_strategy:
          parsed.preferredGroundingStrategy,
      },
    );
    if (error) throw new Error(`Could not update child profile: ${error.message}`);
    return normalizeProfile(data);
  }

  async triggerSafetyHandoff(
    childId: string,
    requestedAt: string,
  ): Promise<SafetyHandoffRecord> {
    const { data, error } = await this.client.rpc(
      "trigger_safety_handoff_atomic",
      { p_child_id: childId, p_requested_at: requestedAt },
    );
    if (error) throw new Error(`Could not record safety handoff: ${error.message}`);
    return normalizeHandoff(data);
  }

  async resetSyntheticDemo(): Promise<void> {
    const childIds = syntheticSeeds.map((profile) => profile.child_id);
    const { error: insightError } = await this.client
      .from("child_profile_insights")
      .delete()
      .in("child_id", childIds);
    if (insightError) throw new Error(`Could not reset insights: ${insightError.message}`);

    const { error: handoffError } = await this.client
      .from("safety_handoffs")
      .delete()
      .in("child_id", childIds);
    if (handoffError) throw new Error(`Could not reset handoffs: ${handoffError.message}`);

    const rows = syntheticSeeds.map((profile) => ({
      ...profile,
      updated_at: new Date().toISOString(),
    }));
    const { error: profileError } = await this.client
      .from("child_profiles")
      .upsert(rows, { onConflict: "child_id" });
    if (profileError) throw new Error(`Could not reset profiles: ${profileError.message}`);
  }
}

export class MemoryProfileRepository implements ProfileRepository {
  private profiles = new Map<string, ChildProfileRecord>();
  private insights = new Map<string, string[]>();
  private handoffs: SafetyHandoffRecord[] = [];

  constructor() {
    this.resetSync();
  }

  private resetSync(): void {
    this.profiles = new Map(
      syntheticSeeds.map((profile) => [profile.child_id, copyProfile(profile)]),
    );
    this.insights = new Map();
    this.handoffs = [];
  }

  async getProfile(childId: string): Promise<ChildProfileRecord | null> {
    const profile = this.profiles.get(childId);
    return profile ? copyProfile(profile) : null;
  }

  async updateProfile(
    childId: string,
    parsed: ParsedInsight,
  ): Promise<ChildProfileRecord> {
    const profile = this.profiles.get(childId);
    if (!profile) throw new Error("unknown_child_id");
    if (profile.locked) throw new Error("child_profile_locked");

    const insightList = [...(this.insights.get(childId) ?? []), parsed.insight];
    this.insights.set(childId, insightList.slice(-5));

    const struggles = [...profile.recurring_struggles];
    if (
      parsed.recurringStruggle &&
      !struggles.includes(parsed.recurringStruggle)
    ) {
      struggles.push(parsed.recurringStruggle);
    }

    const updated: ChildProfileRecord = {
      ...profile,
      recurring_struggles: struggles.slice(-5),
      preferred_grounding_strategy:
        parsed.preferredGroundingStrategy ??
        profile.preferred_grounding_strategy,
      session_count: profile.session_count + 1,
    };
    this.profiles.set(childId, updated);
    return copyProfile(updated);
  }

  async triggerSafetyHandoff(
    childId: string,
    requestedAt: string,
  ): Promise<SafetyHandoffRecord> {
    const profile = this.profiles.get(childId);
    if (!profile) throw new Error("unknown_child_id");
    const recordedAt = new Date().toISOString();
    this.profiles.set(childId, {
      ...profile,
      locked: true,
      locked_at: profile.locked_at ?? recordedAt,
    });
    const handoff: SafetyHandoffRecord = {
      id: this.handoffs.length + 1,
      child_id: childId,
      requested_at: requestedAt,
      recorded_at: recordedAt,
      notification_mode: "simulated_log",
      notification_status: "logged",
    };
    this.handoffs.push(handoff);
    return { ...handoff };
  }

  async resetSyntheticDemo(): Promise<void> {
    this.resetSync();
  }

  getInsightCount(childId: string): number {
    return this.insights.get(childId)?.length ?? 0;
  }
}

export function createRepository(config: AppConfig): ProfileRepository {
  if (config.demoInMemory) return new MemoryProfileRepository();
  if (!config.supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required unless DEMO_IN_MEMORY=1",
    );
  }
  return new SupabaseProfileRepository(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
  );
}
