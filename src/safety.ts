export type SafetyConcern =
  | "self_harm"
  | "physical_danger"
  | "abuse_or_unsafe_touch"
  | "neglect";

const patterns: Array<[SafetyConcern, RegExp[]]> = [
  [
    "self_harm",
    [
      /\b(?:kill|hurt|cut)\s+myself\b/i,
      /\bi\s+(?:want|wish)\s+(?:i\s+)?(?:was\s+)?dead\b/i,
      /\bi\s+do(?:n't| not)\s+want\s+to\s+(?:be\s+alive|live)\b/i,
      /\bend\s+my\s+life\b/i,
    ],
  ],
  [
    "abuse_or_unsafe_touch",
    [
      /\b(?:touch|touched|touching)\s+(?:my\s+)?private\s+(?:part|parts|place|places)\b/i,
      /\bmade\s+me\s+(?:take|pull)\s+(?:my\s+)?clothes\s+off\b/i,
      /\b(?:secret|bad|unsafe)\s+touch(?:ing)?\b/i,
      /\b(?:hurt|hurts|hitting|hits)\s+me\s+at\s+home\b/i,
    ],
  ],
  [
    "neglect",
    [
      /\b(?:there(?:'s| is)|i\s+have)\s+no\s+food\b/i,
      /\b(?:left|leave)\s+me\s+alone\b/i,
      /\bnobody\s+takes\s+care\s+of\s+me\b/i,
      /\bno\s+(?:safe\s+)?place\s+to\s+sleep\b/i,
    ],
  ],
  [
    "physical_danger",
    [
      /\b(?:someone|they|he|she|my\s+\w+)\s+(?:hit|hits|kicked|kicks|punched|punches|choked|chokes|burned|burns|hurt|hurts)\s+me\b/i,
      /\bi(?:'m| am)\s+(?:not\s+safe|unsafe|in\s+danger)\b/i,
      /\b(?:gun|knife|weapon)\s+(?:at|near|on)\s+me\b/i,
      /\b(?:help|save)\s+me\b/i,
    ],
  ],
];

export function detectSafetyConcern(text: string): SafetyConcern | null {
  const normalized = text.normalize("NFKC").replace(/\s+/g, " ").trim();
  for (const [concern, concernPatterns] of patterns) {
    if (concernPatterns.some((pattern) => pattern.test(normalized))) {
      return concern;
    }
  }
  return null;
}
