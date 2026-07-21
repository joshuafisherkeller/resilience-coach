import { z } from "zod";
import type {
  ChildProfile,
  ChildProfileRecord,
  ParsedInsight,
  PracticeSummary,
  ProfileRepository,
  SafetyHandoffRecord,
} from "./types.js";

export const childIdSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_-]{0,63}$/);

export const insightSchema = z
  .string()
  .transform((value) => value.normalize("NFKC").replace(/\s+/g, " ").trim())
  .pipe(z.string().min(1).max(300))
  .refine(
    (value) =>
      !/\b(?:diagnos(?:is|ed)|disorder|medicat(?:ion|ed)|clinical|therapy|therapist|adhd|autis(?:m|tic))\b/i.test(
        value,
      ),
    "Insight must stay brief and non-clinical",
  );

export const timestampSchema = z.iso.datetime({ offset: true });

function cleanExtract(
  value: string | undefined,
  maxLength = 120,
): string | null {
  if (!value) return null;
  const clean = value.replace(/[.!?]+$/, "").trim().slice(0, maxLength);
  return clean.length > 0 ? clean : null;
}

function cleanStrategyList(value: string | undefined): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(/\s*(?:,|\band\b)\s*/i)
        .map((item) => cleanExtract(item, 80))
        .filter((item): item is string => Boolean(item)),
    ),
  ).slice(0, 5);
}

function extractSummaryField(
  insight: string,
  label: string,
  maxLength: number,
): string | null {
  const fieldBoundary =
    "(?=\\s*(?:;|practiced\\s*:|next[- ]time\\s+plan\\s*:|support\\s+preference\\s*:|$))";
  const match = insight.match(
    new RegExp(`\\b${label}\\s*:\\s*(.{1,240}?)${fieldBoundary}`, "i"),
  );
  return cleanExtract(match?.[1], maxLength);
}

export function parseInsight(rawInsight: string): ParsedInsight {
  const insight = insightSchema.parse(rawInsight);
  const struggle = insight.match(
    /\bstruggles?\s+with\s+([^;,.!?]{1,120})/i,
  );
  const strategy = insight.match(
    /\b(?:responded\s+well\s+to|did\s+well\s+with|liked|used)\s+([^;,.!?]{1,120})/i,
  );
  const practiced = extractSummaryField(insight, "practiced", 200);
  const support = extractSummaryField(
    insight,
    "support\\s+preference",
    80,
  );
  const plan = extractSummaryField(
    insight,
    "next[- ]time\\s+plan",
    180,
  );
  const preferredGroundingStrategy = cleanExtract(strategy?.[1]);
  const practicedStrategies = cleanStrategyList(practiced ?? undefined);
  if (
    practicedStrategies.length === 0 &&
    preferredGroundingStrategy
  ) {
    practicedStrategies.push(preferredGroundingStrategy);
  }

  return {
    insight,
    recurringStruggle: cleanExtract(struggle?.[1]),
    preferredGroundingStrategy,
    practicedStrategies,
    supportPreference: support,
    nextTimePlan: plan,
  };
}

export function publicProfile(profile: ChildProfileRecord): ChildProfile {
  return {
    recurring_struggles: profile.recurring_struggles,
    preferred_grounding_strategy: profile.preferred_grounding_strategy,
    session_count: profile.session_count,
  };
}

export function practiceSummary(
  profile: ChildProfileRecord,
): PracticeSummary {
  return {
    practiced_strategies: profile.practiced_strategies,
    support_preference: profile.support_preference,
    next_time_plan: profile.last_next_time_plan,
    session_count: profile.session_count,
  };
}

export class CoachToolHandlers {
  constructor(private readonly repository: ProfileRepository) {}

  async getChildProfile(childIdInput: string): Promise<ChildProfileRecord> {
    const childId = childIdSchema.parse(childIdInput);
    const profile = await this.repository.getProfile(childId);
    if (!profile) throw new Error("Unknown synthetic child_id");
    return profile;
  }

  async updateChildProfile(
    childIdInput: string,
    insightInput: string,
  ): Promise<ChildProfileRecord> {
    const childId = childIdSchema.parse(childIdInput);
    const parsed = parseInsight(insightInput);
    return this.repository.updateProfile(childId, parsed);
  }

  async triggerSafetyHandoff(
    childIdInput: string,
    timestampInput: string,
  ): Promise<SafetyHandoffRecord> {
    const childId = childIdSchema.parse(childIdInput);
    const timestamp = timestampSchema.parse(timestampInput);
    const handoff = await this.repository.triggerSafetyHandoff(
      childId,
      timestamp,
    );
    console.warn(
      `[SIMULATED SAFETY NOTIFICATION] child_id=${childId} recorded_at=${handoff.recorded_at} status=logged`,
    );
    return handoff;
  }
}
