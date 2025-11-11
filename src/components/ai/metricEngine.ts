/**
 * SmartFormAI — Modular Metric Insight Engine (Cost-free, local reasoning)
 *
 * This module provides small, focused analyzers for each analytics section.
 * Each analyzer:
 *  - accepts only the data it needs (modular)
 *  - returns a short "insight" and a one-line "suggestion"
 *  - performs simple, deterministic reasoning locally (no API calls)
 *
 * An aggregate function `analyzeAllMetrics` runs each analyzer independently,
 * caches the combined result for 24 hours, and only recomputes when inputs change.
 *
 * Design goals:
 *  - Keep tokens/API cost at zero (pure client-side logic)
 *  - Be predictable, fast, and resilient
 *  - Prepare clean, human‑readable text for each metric panel
 */

export type MetricInsight = {
  insight: string;
  suggestion: string;
  confidence?: "low" | "medium" | "high";
};

export type CompletionInput = {
  totalResponses: number;
  complete: number;
  partial?: number;
  abandoned?: number;
  lastWeekComplete?: number;
  prevWeekComplete?: number;
};

export type TimeInput = {
  // Provide a list of durations in ms or a precomputed average in ms
  durationsMs?: number[];
  avgMs?: number;
};

export type DevicesInput = {
  desktop: number;
  mobile: number;
  tablet: number;
  // optional average time by device (ms)
  avgTimeByDeviceMs?: Partial<Record<"desktop" | "mobile" | "tablet", number>>;
};

export type TrafficInput = {
  bySource: Record<string, number>;
};

export type GeoInput = {
  byCountry: Record<string, number>;
};

export type QuestionPerfItem = {
  id: string;
  label?: string;
  completionRate?: number; // 0-1
  skipRate?: number; // 0-1
  avgDwellMs?: number;
};
export type QuestionsInput = {
  items: QuestionPerfItem[];
};

export type TimeActivityInput = {
  byHour?: number[]; // length 24
  byDay?: number[]; // length 7 (0..6)
  timestamps?: Array<number | string | Date>;
};

export type SentimentInput = {
  samples: string[];
};

export type ModularInputs = {
  completion?: CompletionInput;
  time?: TimeInput;
  devices?: DevicesInput;
  traffic?: TrafficInput;
  geography?: GeoInput;
  questions?: QuestionsInput;
  activity?: TimeActivityInput;
  sentiment?: SentimentInput; // optional
};

export type MetricEngineResult = {
  completionRate?: MetricInsight;
  avgCompletionTime?: MetricInsight;
  devices?: MetricInsight;
  traffic?: MetricInsight;
  geography?: MetricInsight;
  questions?: MetricInsight;
  activity?: MetricInsight;
  sentiment?: MetricInsight;
  overallSummary?: string;
  cacheKey: string;
  updatedAt: number;
  expiresAt: number;
};

// 24 hours caching
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_PREFIX = "sfai:metric-engine:v1:";

/* -----------------------------
   Utilities
----------------------------- */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function percent(numerator: number, denominator: number, digits = 0) {
  if (!denominator || denominator <= 0) return "0%";
  const v = (numerator / denominator) * 100;
  return `${v.toFixed(digits)}%`;
}

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return "0s";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${rem}s`;
}

function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  const stringify = (v: unknown): string => {
    if (v === null || v === undefined) return "null";
    const t = typeof v;
    if (t === "number" || t === "boolean") return String(v);
    if (t === "string") return JSON.stringify(v);
    if (Array.isArray(v)) return `[${v.map((x) => stringify(x)).join(",")}]`;
    if (t === "object") {
      const obj = v as Record<string, unknown>;
      if (seen.has(obj)) return '"[Circular]"';
      seen.add(obj);
      const keys = Object.keys(obj).sort();
      return `{${keys.map((k) => `${JSON.stringify(k)}:${stringify(obj[k])}`).join(",")}}`;
    }
    return JSON.stringify(String(v));
  };
  return stringify(value);
}

function hashString(s: string): string {
  // djb2
  let hash = 5381;
  for (let i = 0; i < s.length; i++) hash = (hash * 33) ^ s.charCodeAt(i);
  return (hash >>> 0).toString(16);
}

function computeSignature(inputs: ModularInputs): string {
  return hashString(stableStringify(inputs));
}

function now() {
  return Date.now();
}

function getCacheKey(formId: string, signature: string) {
  return `${CACHE_PREFIX}${formId}:${signature}`;
}

function getCachedResult(key: string): MetricEngineResult | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MetricEngineResult;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.expiresAt && parsed.expiresAt > now()) return parsed;
    return null;
  } catch {
    return null;
  }
}

function setCachedResult(key: string, value: MetricEngineResult) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

/* -----------------------------
   Analyzers
----------------------------- */

export function analyzeCompletionRate(input: CompletionInput): MetricInsight {
  const total = Math.max(0, input.totalResponses || 0);
  const complete = clamp(input.complete || 0, 0, total);
  const partial = clamp(input.partial || 0, 0, total);
  const abandoned = clamp(input.abandoned || Math.max(0, total - complete - partial), 0, total);

  const cr = total > 0 ? complete / total : 0;
  let deltaText = "";
  if (
    typeof input.lastWeekComplete === "number" &&
    typeof input.prevWeekComplete === "number" &&
    input.prevWeekComplete > 0
  ) {
    const lastRate = input.lastWeekComplete / Math.max(1, input.lastWeekComplete + (input.prevWeekComplete - input.prevWeekComplete)); // avoid divide by zero trick
    // the above formulation is odd; instead just give a neutral "trend" if provided
    const change = ((input.lastWeekComplete - input.prevWeekComplete) / Math.max(1, input.prevWeekComplete)) * 100;
    const sign = change > 0 ? "up" : change < 0 ? "down" : "steady";
    deltaText = `, ${sign} ${Math.abs(change).toFixed(0)}% vs last period`;
  }

  const insight = `Completion rate ${total > 0 ? `is ${percent(complete, total)}` : "has limited data"}${deltaText}.`;
  let suggestion = "Consider simplifying longer sections or clarifying instructions where drop-offs occur.";
  if (cr >= 0.85) suggestion = "Great retention — keep sections concise and maintain the current flow.";
  if (cr <= 0.5) suggestion = "Significant drop-offs — shorten early questions and remove low-value fields.";

  return { insight, suggestion, confidence: cr >= 0.8 ? "high" : cr >= 0.6 ? "medium" : "low" };
}

export function analyzeAvgCompletionTime(input: TimeInput): MetricInsight {
  let avg = input.avgMs || 0;
  if (!avg && input.durationsMs && input.durationsMs.length > 0) {
    const total = input.durationsMs.reduce((a, b) => a + b, 0);
    avg = total / input.durationsMs.length;
  }
  const insight = `Average completion time is ${formatMs(avg)}; most users finish within a few minutes.`;
  const suggestion =
    avg <= 180000
      ? "Good pace — keep the survey concise and focused."
      : "Consider trimming or reordering longer sections to reduce time-to-complete.";
  return {
    insight,
    suggestion,
    confidence: avg > 0 ? "high" : "low",
  };
}

export function analyzeDevices(input: DevicesInput): MetricInsight {
  const d = input.desktop || 0;
  const m = input.mobile || 0;
  const t = input.tablet || 0;
  const sum = d + m + t;
  const mobileShare = sum > 0 ? (m / sum) * 100 : 0;
  const desktopShare = sum > 0 ? (d / sum) * 100 : 0;

  let speedNote = "";
  if (input.avgTimeByDeviceMs) {
    const { desktop: dt, mobile: mt } = input.avgTimeByDeviceMs;
    if (typeof dt === "number" && typeof mt === "number" && dt > 0 && mt > 0) {
      const delta = ((dt - mt) / dt) * 100;
      if (delta > 8) speedNote = " Mobile users complete noticeably faster.";
      else if (delta < -8) speedNote = " Desktop users complete noticeably faster.";
    }
  }

  const insight = sum > 0
    ? `Device mix — Mobile ${mobileShare.toFixed(0)}%, Desktop ${desktopShare.toFixed(0)}%.${speedNote}`
    : "Device distribution is not available yet.";
  const suggestion =
    mobileShare >= 60
      ? "Prioritize mobile layout and thumb-friendly controls."
      : desktopShare >= 60
        ? "Optimize large-screen spacing, keyboard flow, and scroll ergonomics."
        : "Ensure a consistent experience across devices.";

  return { insight, suggestion, confidence: sum > 20 ? "high" : sum > 5 ? "medium" : "low" };
}

export function analyzeTraffic(input: TrafficInput): MetricInsight {
  const entries = Object.entries(input.bySource || {}).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return {
      insight: "Traffic sources not available yet.",
      suggestion: "Share your survey link across your top channels to collect balanced data.",
      confidence: "low",
    };
  }
  const [top, topCount] = entries[0];
  const total = entries.reduce((a, [, v]) => a + v, 0);
  const share = total > 0 ? (topCount / total) * 100 : 0;
  const insight = `Most responses come from ${prettySource(top)} (${share.toFixed(0)}%).`;
  const suggestion = `Consider investing a bit more into ${prettySource(top)} or A/B test messaging on that channel.`;
  return { insight, suggestion, confidence: total > 20 ? "high" : "medium" };
}

export function analyzeGeography(input: GeoInput): MetricInsight {
  const entries = Object.entries(input.byCountry || {}).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return {
      insight: "Not enough geographic data yet.",
      suggestion: "As data grows, consider localizing copy for your top regions.",
      confidence: "low",
    };
  }
  const top = entries.slice(0, 2).map(([c]) => c);
  const insight =
    top.length >= 2
      ? `Highest engagement from ${top[0]} & ${top[1]}.`
      : `Highest engagement from ${top[0]}.`;
  const suggestion = "Localize labels or hints for top regions; consider time‑zone optimized reminders.";
  return { insight, suggestion, confidence: entries.length > 3 ? "high" : "medium" };
}

export function analyzeQuestions(input: QuestionsInput): MetricInsight {
  if (!input.items || input.items.length === 0) {
    return {
      insight: "No question performance data yet.",
      suggestion: "Collect more responses to detect weak spots and drop‑offs.",
      confidence: "low",
    };
  }
  // Find highest skip
  const withSkip = input.items
    .filter((q) => typeof q.skipRate === "number")
    .sort((a, b) => (b.skipRate || 0) - (a.skipRate || 0));
  if (withSkip.length === 0) {
    return {
      insight: "Question performance looks balanced so far.",
      suggestion: "Keep monitoring skip and dwell times to spot friction.",
      confidence: "medium",
    };
  }
  const worst = withSkip[0];
  const label = worst.label || `Question ${worst.id}`;
  const sr = clamp(worst.skipRate || 0, 0, 1);
  const insight = `${label} shows a ${percent(sr, 1)} skip rate.`;
  const suggestion = "Reword for clarity, reduce cognitive load, or split into simpler steps.";
  return { insight, suggestion, confidence: sr >= 0.5 ? "high" : sr >= 0.3 ? "medium" : "low" };
}

export function analyzeTimeActivity(input: TimeActivityInput): MetricInsight {
  // Prefer byHour; fallback to timestamps
  let peakLabel = "No clear peak";
  let confidence: MetricInsight["confidence"] = "low";

  if (input.byHour && input.byHour.length === 24) {
    const max = Math.max(...input.byHour);
    const idx = input.byHour.findIndex((v) => v === max);
    if (max > 0 && idx >= 0) {
      peakLabel = `${pad2(idx)}:00`;
      confidence = max >= 5 ? "high" : "medium";
    }
  } else if (input.timestamps && input.timestamps.length > 0) {
    const counts = new Array(24).fill(0);
    for (const t of input.timestamps) {
      const d = new Date(t);
      if (isNaN(d.getTime())) continue;
      counts[d.getHours()]++;
    }
    const max = Math.max(...counts);
    const idx = counts.findIndex((v) => v === max);
    if (max > 0 && idx >= 0) {
      peakLabel = `${pad2(idx)}:00`;
      confidence = max >= 5 ? "medium" : "low";
    }
  }

  const insight = `Peak engagement ≈ ${peakLabel}.`;
  const suggestion = "Schedule reminders and promotions around the peak window to maximize completions.";
  return { insight, suggestion, confidence };
}

export function analyzeSentiment(input: SentimentInput): MetricInsight {
  if (!input.samples || input.samples.length === 0) {
    return {
      insight: "No text responses to analyze yet.",
      suggestion: "As free‑text feedback arrives, sentiment patterns will appear.",
      confidence: "low",
    };
  }
  const dist = { positive: 0, neutral: 0, negative: 0 };
  for (const s of input.samples) {
    const label = quickSentiment(s);
    dist[label]++;
  }
  const total = dist.positive + dist.neutral + dist.negative;
  const posPct = total > 0 ? Math.round((dist.positive / total) * 100) : 0;
  const insight = `Responses are mostly positive (${posPct}%).`;
  const suggestion = posPct >= 70
    ? "Keep the current tone and content."
    : "Address common pain points surfaced in negative responses.";
  return { insight, suggestion, confidence: total > 20 ? "high" : "medium" };
}

/* -----------------------------
   Overall summary composer
----------------------------- */

export function composeOverallSummary(parts: Partial<MetricEngineResult>): string {
  const lines: string[] = [];

  if (parts.completionRate?.insight) {
    lines.push(parts.completionRate.insight.replace(/\.$/, ""));
  }
  if (parts.devices?.insight) {
    // Extract a concise device note
    const m = parts.devices.insight.match(/Mobile\s(\d+)%/i);
    if (m) lines.push(`Mobile share around ${m[1]}%.`);
  }
  if (parts.questions?.insight) {
    lines.push(parts.questions.insight);
  }
  if (parts.avgCompletionTime?.insight) {
    lines.push(parts.avgCompletionTime.insight);
  }
  if (parts.traffic?.insight) {
    const t = parts.traffic.insight.replace("Most responses come from ", "").replace(/\.$/, "");
    lines.push(`Top channel: ${t}.`);
  }

  if (lines.length === 0) return "Survey performance is building — more responses will unlock richer insights.";
  const head = "Survey performance looks steady.";
  return `${head} ${lines.join(" ")}`;
}

/* -----------------------------
   Analyze All (with Caching)
----------------------------- */

export type AnalyzeOptions = {
  formId: string;
  forceRefresh?: boolean;
};

export async function analyzeAllMetrics(
  data: ModularInputs,
  opts: AnalyzeOptions,
): Promise<MetricEngineResult> {
  const signature = computeSignature(data);
  const cacheKey = getCacheKey(opts.formId, signature);

  if (!opts.forceRefresh) {
    const cached = getCachedResult(cacheKey);
    if (cached) return cached;
  }

  // Run each analyzer only with its subset (fully modular)
  const result: MetricEngineResult = {
    cacheKey,
    updatedAt: now(),
    expiresAt: now() + CACHE_TTL_MS,
  };

  if (data.completion) result.completionRate = analyzeCompletionRate(data.completion);
  if (data.time) result.avgCompletionTime = analyzeAvgCompletionTime(data.time);
  if (data.devices) result.devices = analyzeDevices(data.devices);
  if (data.traffic) result.traffic = analyzeTraffic(data.traffic);
  if (data.geography) result.geography = analyzeGeography(data.geography);
  if (data.questions) result.questions = analyzeQuestions(data.questions);
  if (data.activity) result.activity = analyzeTimeActivity(data.activity);
  if (data.sentiment) result.sentiment = analyzeSentiment(data.sentiment);

  // Minimal, optional single paragraph based on the modular insights
  result.overallSummary = composeOverallSummary(result);

  setCachedResult(cacheKey, result);
  return result;
}

/* -----------------------------
   Helpers (private)
----------------------------- */

function prettySource(src: string): string {
  const lower = src.toLowerCase();
  if (lower.includes("twitter") || lower === "x") return "Twitter/X";
  if (lower.includes("google")) return "Google";
  if (lower.includes("facebook")) return "Facebook";
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("direct")) return "Direct";
  try {
    const u = new URL(src);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return src.length > 40 ? `${src.slice(0, 37)}...` : src;
  }
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function quickSentiment(text: string): "positive" | "neutral" | "negative" {
  const s = text.toLowerCase();
  const pos = /(good|great|excellent|love|amazing|perfect|happy|satisfied|best|fantastic|wonderful|awesome)/i.test(s);
  const neg = /(bad|terrible|awful|hate|worst|disappointed|poor|unhappy|frustrated|problem|issue|fail)/i.test(s);
  if (pos && !neg) return "positive";
  if (neg && !pos) return "negative";
  return "neutral";
}

/* -----------------------------
   Example usage (documentation)
----------------------------- */
/*
import { analyzeAllMetrics } from "./metricEngine";

const result = await analyzeAllMetrics(
  {
    completion: { totalResponses: 120, complete: 96, partial: 12, abandoned: 12 },
    time: { avgMs: 210000 },
    devices: { desktop: 120, mobile: 260, tablet: 20, avgTimeByDeviceMs: { desktop: 240000, mobile: 190000 } },
    traffic: { bySource: { twitter: 78, google: 46, direct: 22 } },
    geography: { byCountry: { "United States": 140, Canada: 38, UK: 22 } },
    questions: { items: [{ id: "Q4", label: "Question 4", skipRate: 0.62 }, { id: "Q2", label: "Question 2", skipRate: 0.12 }] },
    activity: { byHour: [0,0,0,0,1,2,3,5,7,8,10,6,5,4,3,2,2,1,0,0,0,0,0,0] },
    sentiment: { samples: ["Great form!", "Love the flow", "Too long", "Confusing question 4"] }
  },
  { formId: "form_123" }
);

console.log(result.completionRate?.insight);
console.log(result.overallSummary);
*/
