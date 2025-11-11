/**
 * Auto-Rebuild stub utility to prepare for next feature
 *
 * This module DOES NOT change any survey data.
 * It provides safe, lightweight utilities to:
 *  - Normalize AI insights
 *  - Decide if an Auto-Rebuild plan should be proposed
 *  - Produce a structured, human-readable plan describing potential changes
 *  - Persist and retrieve the latest plan locally (for caching/UX continuity)
 *
 * The actual mutation of surveys ("apply plan") will be implemented later.
 * Keep this file dependency-free and browser-safe.
 */

/**
 * Baseline insight shape the AI layer will output.
 * Keep in sync with the AI Insight Engine output contract.
 */
export type AIInsights = {
  summary?: string;
  keyInsights?: string[];
  recommendations?: string[];
  details?: Record<string, unknown>;
};

/**
 * Priority categories for proposed actions.
 */
export type PlanPriority = "low" | "medium" | "high";

/**
 * Supported planned action types (purely descriptive for now).
 * These do NOT execute any changes.
 */
export type PlannedActionType =
  | "tweak_question_copy"
  | "reorder_question"
  | "insert_section_break"
  | "optimize_mobile"
  | "improve_desktop_ux"
  | "shorten_survey"
  | "clarify_instruction"
  | "adjust_requiredness"
  | "add_progress_indicator";

/**
 * A single proposed action for later Auto-Rebuild execution.
 */
export interface PlannedAction {
  type: PlannedActionType;
  priority: PlanPriority;
  reason: string;
  questionId?: string;
  questionLabel?: string; // e.g., "Question 4"
  preview?: string; // short human-friendly suggestion
}

/**
 * The full Auto-Rebuild plan artifact.
 * This is safe to render and store; it does not perform any changes.
 */
export interface AutoRebuildPlan {
  formId: string;
  createdAt: string; // ISO timestamp
  eligible: boolean;
  reason: string; // why eligible or why not
  actions: PlannedAction[];
  insightsHash: string;
  scheduleNextCheckAt?: string; // ISO timestamp (24h cadence or custom)
}

/**
 * Options and context for eligibility and planning.
 */
export interface AutoRebuildOptions {
  formId: string;
  responseCount: number;
  lastRunAt?: number | Date;
  minIntervalMs?: number; // default 24h
  dryRun?: boolean; // no-op knob for future extension (kept for API stability)
  userPlan?: "free" | "pro" | null; // informative only; we do not enforce plan here
  lastPlanHash?: string; // hash of last applied/planned insights to avoid duplicates
  questionIdMap?: Record<string, string>; // Optional: map "Q4" -> "actual-question-id"
  onPlanned?: (plan: AutoRebuildPlan) => void; // Hook for UI
}

/**
 * Storage keys and defaults.
 */
export const DEFAULT_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
export const STORAGE_KEYS = {
  plan: (formId: string) => `sfai:auto-rebuild:plan:${formId}`,
  lastRun: (formId: string) => `sfai:auto-rebuild:last-run:${formId}`,
};

/**
 * Normalize AI insight object defensively.
 */
export function normalizeInsights(input: unknown): AIInsights {
  const safe: AIInsights = {
    summary: "",
    keyInsights: [],
    recommendations: [],
    details: {},
  };

  if (!input || typeof input !== "object") return safe;
  const src = input as Record<string, unknown>;

  if (typeof src.summary === "string") safe.summary = src.summary;
  if (Array.isArray(src.keyInsights)) {
    safe.keyInsights = src.keyInsights.filter(
      (x) => typeof x === "string",
    ) as string[];
  }
  if (Array.isArray(src.recommendations)) {
    safe.recommendations = src.recommendations.filter(
      (x) => typeof x === "string",
    ) as string[];
  }
  if (src.details && typeof src.details === "object") {
    safe.details = src.details as Record<string, unknown>;
  }

  return safe;
}

/**
 * Stable stringify for hashing (order-insensitive for plain objects).
 * This keeps only strings/numbers/booleans/arrays/objects.
 */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet();

  const stringify = (v: unknown): string => {
    if (v === null || v === undefined) return "null";
    const t = typeof v;

    if (t === "number" || t === "boolean") return String(v);
    if (t === "string") return JSON.stringify(v);

    if (Array.isArray(v)) {
      return `[${v.map((it) => stringify(it)).join(",")}]`;
    }

    if (t === "object") {
      const obj = v as Record<string, unknown>;
      if (seen.has(obj as object)) return '"[Circular]"';
      seen.add(obj as object);
      const keys = Object.keys(obj).sort();
      return `{${keys.map((k) => `${JSON.stringify(k)}:${stringify(obj[k])}`).join(",")}}`;
    }

    return JSON.stringify(String(v));
  };

  return stringify(value);
}

/**
 * djb2 string hash for small, stable hashes.
 */
export function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  // eslint-disable-next-line no-bitwise
  return (hash >>> 0).toString(16);
}

/**
 * Compute a stable hash for the insight payload.
 */
export function computeInsightsHash(insights: AIInsights): string {
  return hashString(stableStringify(insights));
}

/**
 * Decide if Auto-Rebuild should be proposed (not executed).
 * - Enforces min interval (default 24h)
 * - Requires at least a modest sample size (>= 10 responses)
 * - Avoids duplicates if the insights hash hasn't changed
 */
export function evaluateAutoRebuildEligibility(
  insights: AIInsights,
  opts: AutoRebuildOptions,
): { eligible: boolean; reason: string; nextCheckAt: number } {
  const now = Date.now();
  const minInterval = opts.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  const lastRunTs =
    typeof opts.lastRunAt === "number"
      ? opts.lastRunAt
      : (opts.lastRunAt?.getTime() ?? 0);

  if (!opts.formId) {
    return {
      eligible: false,
      reason: "Missing formId",
      nextCheckAt: now + minInterval,
    };
  }

  if ((opts.responseCount ?? 0) < 10) {
    return {
      eligible: false,
      reason: "Need at least 10 responses for meaningful rebuild planning",
      nextCheckAt: now + minInterval,
    };
  }

  if (now - lastRunTs < minInterval) {
    const remaining = minInterval - (now - lastRunTs);
    return {
      eligible: false,
      reason: `Minimum interval not reached. Try again in ~${Math.ceil(remaining / (60 * 1000))} minutes`,
      nextCheckAt: lastRunTs + minInterval,
    };
  }

  const currentHash = computeInsightsHash(insights);
  if (opts.lastPlanHash && opts.lastPlanHash === currentHash) {
    return {
      eligible: false,
      reason: "No significant changes since last analysis",
      nextCheckAt: now + minInterval,
    };
  }

  // For the first version, always allow if above conditions pass.
  return {
    eligible: true,
    reason: "Eligible for planning",
    nextCheckAt: now + minInterval,
  };
}

/**
 * Extract candidate question references from natural language text, e.g.:
 * - "90% skipped Question 4"
 * - "Q3 has high drop-off"
 */
export function extractQuestionRefs(
  texts: string[],
): Array<{ label: string; index: number }> {
  const refs: Array<{ label: string; index: number }> = [];
  const patterns = [/question\s*(\d+)/gi, /\bq\s*(\d+)\b/gi];

  texts.forEach((line) => {
    patterns.forEach((re) => {
      let m: RegExpExecArray | null;
      // eslint-disable-next-line no-cond-assign
      while ((m = re.exec(line)) !== null) {
        const num = parseInt(m[1], 10);
        if (!Number.isNaN(num)) {
          refs.push({ label: `Question ${num}`, index: num });
        }
      }
    });
  });

  // Deduplicate by index
  const seen = new Set<number>();
  return refs.filter((r) => {
    if (seen.has(r.index)) return false;
    seen.add(r.index);
    return true;
  });
}

/**
 * Attempt to map extracted "Question 4" labels to real question IDs if provided.
 */
export function mapQuestionRefsToIds(
  refs: Array<{ label: string; index: number }>,
  questionIdMap?: Record<string, string>,
): Array<{ label: string; index: number; questionId?: string }> {
  if (!questionIdMap) return refs;
  return refs.map((r) => {
    const qKeyVariants = [`Q${r.index}`, `Question ${r.index}`, `${r.index}`];
    for (const key of qKeyVariants) {
      if (questionIdMap[key]) {
        return { ...r, questionId: questionIdMap[key] };
      }
    }
    return r;
  });
}

/**
 * Build a descriptive, safe plan from insights.
 * This is purely narrative; it does not mutate any data.
 */
export function buildAutoRebuildPlan(
  insightsInput: AIInsights,
  opts: AutoRebuildOptions,
): AutoRebuildPlan {
  const insights = normalizeInsights(insightsInput);
  const insightsHash = computeInsightsHash(insights);
  const nowIso = new Date().toISOString();

  const lines = [
    ...(insights.keyInsights ?? []),
    ...(insights.recommendations ?? []),
    insights.summary ?? "",
  ].filter(Boolean);

  const questionRefs = extractQuestionRefs(lines);
  const mappedRefs = mapQuestionRefsToIds(questionRefs, opts.questionIdMap);

  const actions: PlannedAction[] = [];

  // Heuristics: translate common signals into potential actions
  const text = lines.join(" ").toLowerCase();

  // Drop-off or skip signals => tweak copy, insert breaks, add progress
  if (/(drop[-\s]?off|skip|abandon)/.test(text)) {
    mappedRefs.forEach((ref) => {
      actions.push({
        type: "tweak_question_copy",
        priority: "high",
        reason: "High drop-off/skip detected",
        questionId: ref.questionId,
        questionLabel: ref.label,
        preview: "Reword or simplify the question to reduce friction",
      });
    });

    actions.push({
      type: "insert_section_break",
      priority: "medium",
      reason: "Reduce cognitive load by chunking",
      preview: "Add section break before/after high-friction questions",
    });

    actions.push({
      type: "add_progress_indicator",
      priority: "medium",
      reason: "Maintain perceived progress to reduce abandonment",
      preview: "Enable or keep a progress bar throughout the survey",
    });
  }

  // Device performance differences
  if (/mobile.*(faster|better|higher)/.test(text)) {
    actions.push({
      type: "improve_desktop_ux",
      priority: "medium",
      reason: "Desktop users lag behind mobile users",
      preview: "Optimize spacing and interaction targets for desktop",
    });
  }
  if (/desktop.*(faster|better|higher)/.test(text)) {
    actions.push({
      type: "optimize_mobile",
      priority: "high",
      reason: "Mobile users underperform compared to desktop",
      preview: "Reduce vertical clutter; ensure controls are thumb-friendly",
    });
  }

  // Length or complexity signals
  if (/(too long|longer than|length|complex|confusing)/.test(text)) {
    actions.push({
      type: "shorten_survey",
      priority: "medium",
      reason: "Survey length/complexity likely impacting completion",
      preview: "Remove or defer low-value questions; tighten copy",
    });
  }

  // Generic clarifications for weak questions
  if (
    mappedRefs.length === 0 &&
    insights.keyInsights?.some((k) => /clarif|confus/i.test(k))
  ) {
    actions.push({
      type: "clarify_instruction",
      priority: "medium",
      reason: "Ambiguity detected in user responses",
      preview: "Add brief helper text below the ambiguous question",
    });
  }

  // Last resort: if we have no targeted actions but recommendations exist, propose mild clarifications
  if (actions.length === 0 && (insights.recommendations?.length ?? 0) > 0) {
    actions.push({
      type: "clarify_instruction",
      priority: "low",
      reason: "General improvements suggested by AI",
      preview: "Add quick helper text to the most critical questions",
    });
  }

  const plan: AutoRebuildPlan = {
    formId: opts.formId,
    createdAt: nowIso,
    eligible: true,
    reason: "Plan derived from latest AI insights",
    actions,
    insightsHash,
  };

  // Schedule next check
  const next = Date.now() + (opts.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS);
  plan.scheduleNextCheckAt = new Date(next).toISOString();

  return plan;
}

/**
 * Persist a plan locally (browser-only safe).
 */
export function persistPlan(formId: string, plan: AutoRebuildPlan): void {
  if (typeof window === "undefined") return;
  try {
    const key = STORAGE_KEYS.plan(formId);
    window.localStorage.setItem(key, JSON.stringify(plan));
    window.localStorage.setItem(
      STORAGE_KEYS.lastRun(formId),
      String(Date.now()),
    );
  } catch {
    // Ignore storage errors silently to stay resilient
  }
}

/**
 * Load the last persisted plan (if any).
 */
export function loadLastPlan(formId: string): AutoRebuildPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const key = STORAGE_KEYS.plan(formId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !(parsed as Record<string, unknown>).formId
    )
      return null;
    return parsed as AutoRebuildPlan;
  } catch {
    return null;
  }
}

/**
 * Load the last run timestamp (ms) if available.
 */
export function loadLastRunAt(formId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.lastRun(formId));
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

/**
 * Main stub entrypoint:
 * - Checks if eligible
 * - Builds a plan (descriptive only)
 * - Persists it for later review/application
 * - Triggers an optional callback
 *
 * Returns the plan if created, or a non-eligible "ghost" plan if not.
 */
export function triggerSurveyRebuildIfNeeded(
  insightsInput: unknown,
  opts: AutoRebuildOptions,
): AutoRebuildPlan | null {
  const insights = normalizeInsights(insightsInput);
  const lastRunAt = opts.lastRunAt ?? loadLastRunAt(opts.formId) ?? 0;
  const lastPlan = loadLastPlan(opts.formId);
  const lastPlanHash = opts.lastPlanHash ?? lastPlan?.insightsHash ?? undefined;

  const { eligible, reason, nextCheckAt } = evaluateAutoRebuildEligibility(
    insights,
    {
      ...opts,
      lastRunAt,
      lastPlanHash,
    },
  );

  if (!eligible) {
    // Provide a non-destructive ghost plan for UI messaging (optional)
    const ghost: AutoRebuildPlan = {
      formId: opts.formId,
      createdAt: new Date().toISOString(),
      eligible: false,
      reason,
      actions: [],
      insightsHash: computeInsightsHash(insights),
      scheduleNextCheckAt: new Date(nextCheckAt).toISOString(),
    };
    return ghost;
  }

  const plan = buildAutoRebuildPlan(insights, opts);
  persistPlan(opts.formId, plan);

  // Optional UX hook (no side-effects required)
  try {
    opts.onPlanned?.(plan);
    if (
      typeof window !== "undefined" &&
      typeof window.dispatchEvent === "function"
    ) {
      window.dispatchEvent(
        new CustomEvent("sfai:auto-rebuild:planned", { detail: plan }),
      );
    }
  } catch {
    // Hooks should never crash the app
  }

  return plan;
}

/**
 * Utility: Clear local plan cache (used by settings/debug screens).
 */
export function clearPlanCache(formId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.plan(formId));
    window.localStorage.removeItem(STORAGE_KEYS.lastRun(formId));
  } catch {
    // ignore
  }
}
