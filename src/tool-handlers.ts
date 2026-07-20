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

export function parseInsight(rawInsight: string): ParsedInsight {
  const insight = insightSchema.parse(rawInsight);
  const struggle = insight.match(
    /\bstruggles?\s+with\s+([^;,.!?]{1,120})/i,
  );
  const strategy = insight.match(
    /\b(?:responded\s+well\s+to|did\s+well\s+with|liked|used)\s+([^;,.!?]{1,120})/i,
  );
  const practiced = insight.match(/\bpracticed\s*:\s*([^;]{1,200})/i);
  const support = insight.match(
    /\bsupport\s+preference\s*:\s*([^;]{1,80})/i,
  );
  const plan = insight.match(
    /\bnext[- ]time\s+plan\s*:\s*([^;]{1,180})/i,
  );
  const preferredGroundingStrategy = cleanExtract(strategy?.[1]);
  const practicedStrategies = cleanStrategyList(practiced?.[1]);
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
    supportPreference: cleanExtract(support?.[1], 80),
    nextTimePlan: cleanExtract(plan?.[1], 180),
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
