/**
 * The backend stores every AI analysis as a JSON *string* in a Text column
 * (see `_ai_*` in routers/opportunities.py). Nothing in the UI should ever
 * render one of those raw — parse it here, get a typed shape back, and let the
 * page lay it out.
 *
 * Every parser is forgiving on purpose. These strings come from a language
 * model, so a field can be missing, be a string where an array was asked for,
 * or arrive wrapped in a markdown fence. None of that should blank a page.
 */

import type { Tone } from "./format";

/* ── Core parsing ─────────────────────────────────────────────────────── */

/** Parse a value that may be an object, a JSON string, or fenced JSON. */
export function parseJson<T = Record<string, any>>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as T;
  if (typeof raw !== "string") return null;

  let text = raw.trim();
  if (!text) return null;

  // Models like to wrap JSON in ```json … ``` even when told not to.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  if (!text.startsWith("{") && !text.startsWith("[")) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    // Sometimes the object is fine but there's prose either side of it.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** True when a string is JSON we failed to parse — so we can hide it rather than print braces. */
export function looksLikeJson(raw: unknown): boolean {
  const s = String(raw ?? "").trim();
  return s.startsWith("{") || s.startsWith("[") || s.startsWith("```");
}

/** Prose that's safe to render. Returns null for anything JSON-shaped. */
export function proseOnly(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || looksLikeJson(s)) return null;
  return s;
}

/** Coerce whatever the model returned into a list of strings. */
export function toStringList(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map(itemToString).filter(Boolean);
  }
  if (typeof value === "string") {
    const parsed = parseJson<any>(value);
    if (Array.isArray(parsed)) return parsed.map(itemToString).filter(Boolean);
    return value
      .split(/\n+/)
      .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter(Boolean);
  }
  return [];
}

function itemToString(item: unknown): string {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object") {
    const o = item as Record<string, any>;
    return String(
      o.requirement ?? o.text ?? o.title ?? o.name ?? o.description ?? o.theme ?? ""
    ).trim();
  }
  return String(item ?? "").trim();
}

/* ── Severity / confidence ────────────────────────────────────────────── */

export function severityTone(value: unknown): Tone {
  const s = String(value ?? "").toLowerCase();
  if (s.includes("high") || s.includes("critical")) return "bad";
  if (s.includes("med")) return "warn";
  if (s.includes("low")) return "neutral";
  return "neutral";
}

export function severityLabel(value: unknown): string {
  const s = String(value ?? "").toLowerCase();
  if (s.includes("critical")) return "Critical";
  if (s.includes("high")) return "Serious";
  if (s.includes("med")) return "Worth watching";
  if (s.includes("low")) return "Minor";
  return "Unrated";
}

/* ── Executive summary ────────────────────────────────────────────────── */

export type Summary = {
  summary: string | null;
  procurementType: string | null;
  posted: string | null;
  due: string | null;
  valueRange: string | null;
  criticalInsight: string | null;
};

export function parseSummary(raw: unknown): Summary | null {
  const d = parseJson<any>(raw);
  if (!d) {
    const prose = proseOnly(raw);
    return prose
      ? { summary: prose, procurementType: null, posted: null, due: null, valueRange: null, criticalInsight: null }
      : null;
  }
  return {
    summary: str(d.summary),
    procurementType: str(d.procurement_type),
    posted: str(d.key_dates?.posted),
    due: str(d.key_dates?.due),
    valueRange: str(d.value_range),
    criticalInsight: str(d.critical_insight),
  };
}

/* ── Requirements ─────────────────────────────────────────────────────── */

export type Requirement = {
  text: string;
  source: string | null;
  confidence: string | null;
};

export type RequirementGroup = {
  key: string;
  label: string;
  hint: string;
  items: Requirement[];
};

const REQUIREMENT_GROUPS: Array<{ key: string; label: string; hint: string }> = [
  { key: "mandatory", label: "Must have", hint: "Miss one of these and you're disqualified." },
  { key: "technical", label: "Technical", hint: "What the solution itself has to do." },
  { key: "personnel", label: "People", hint: "Roles, clearances and qualifications they expect." },
  { key: "past_performance", label: "Past performance", hint: "Proof you've done this before." },
  { key: "compliance", label: "Compliance", hint: "Certifications, registrations and paperwork." },
  { key: "desirable", label: "Nice to have", hint: "Not required, but they'll score you on it." },
];

export function parseRequirements(raw: unknown): RequirementGroup[] {
  const d = parseJson<any>(raw);

  if (!d) {
    const flat = toStringList(raw);
    if (flat.length === 0) return [];
    return [
      {
        key: "all",
        label: "Requirements",
        hint: "Everything the solicitation asks for.",
        items: flat.map((t) => ({ text: t, source: null, confidence: null })),
      },
    ];
  }

  // A bare array of requirements rather than the grouped shape.
  if (Array.isArray(d)) {
    return [
      {
        key: "all",
        label: "Requirements",
        hint: "Everything the solicitation asks for.",
        items: toRequirements(d),
      },
    ];
  }

  const groups = REQUIREMENT_GROUPS.map((g) => ({
    ...g,
    items: toRequirements((d as any)[g.key]),
  })).filter((g) => g.items.length > 0);

  // Something came back in a shape we didn't expect — show it rather than nothing.
  if (groups.length === 0) {
    const leftovers = Object.entries(d)
      .filter(([, v]) => Array.isArray(v) && v.length > 0)
      .map(([k, v]) => ({
        key: k,
        label: humanise(k),
        hint: "",
        items: toRequirements(v),
      }));
    return leftovers;
  }

  return groups;
}

function toRequirements(value: unknown): Requirement[] {
  if (!Array.isArray(value)) return toStringList(value).map((t) => ({ text: t, source: null, confidence: null }));
  return value
    .map((item) => {
      if (typeof item === "string") return { text: item.trim(), source: null, confidence: null };
      const o = (item ?? {}) as Record<string, any>;
      return {
        text: String(o.requirement ?? o.text ?? o.title ?? "").trim(),
        source: str(o.source),
        confidence: str(o.confidence),
      };
    })
    .filter((r) => r.text.length > 0);
}

export function countRequirements(groups: RequirementGroup[]): number {
  return groups.reduce((n, g) => n + g.items.length, 0);
}

/* ── Risks ────────────────────────────────────────────────────────────── */

export type Risk = {
  category: string | null;
  severity: string | null;
  title: string;
  description: string | null;
  mitigation: string | null;
};

export type RiskReport = { risks: Risk[]; overall: string | null };

export function parseRisks(raw: unknown): RiskReport {
  const d = parseJson<any>(raw);

  if (!d) {
    const flat = toStringList(raw);
    return {
      risks: flat.map((t) => ({
        category: null,
        severity: null,
        title: t,
        description: null,
        mitigation: null,
      })),
      overall: null,
    };
  }

  const list: any[] = Array.isArray(d) ? d : Array.isArray(d.risks) ? d.risks : [];

  return {
    risks: list
      .map((item) => {
        if (typeof item === "string") {
          return { category: null, severity: null, title: item.trim(), description: null, mitigation: null };
        }
        const o = (item ?? {}) as Record<string, any>;
        const title = String(o.title ?? o.risk ?? o.description ?? "").trim();
        return {
          category: str(o.category),
          severity: str(o.severity),
          title,
          // Don't repeat the description when it was used as the title.
          description: title === str(o.description) ? null : str(o.description),
          mitigation: str(o.mitigation),
        };
      })
      .filter((r) => r.title.length > 0),
    overall: Array.isArray(d) ? null : str(d.overall_risk_level),
  };
}

/* ── Bid strategy ─────────────────────────────────────────────────────── */

export type Strategy = {
  pricingApproach: string | null;
  pricingReasoning: string | null;
  differentiators: string[];
  winThemes: string[];
  teaming: string | null;
  positioning: string | null;
};

export function parseStrategy(raw: unknown): Strategy | null {
  const d = parseJson<any>(raw);
  if (!d) {
    const prose = proseOnly(raw);
    return prose
      ? {
          pricingApproach: null,
          pricingReasoning: prose,
          differentiators: [],
          winThemes: [],
          teaming: null,
          positioning: null,
        }
      : null;
  }
  const strategy: Strategy = {
    pricingApproach: str(d.pricing_approach),
    pricingReasoning: str(d.pricing_reasoning),
    differentiators: toStringList(d.differentiators),
    winThemes: toStringList(d.win_themes),
    teaming: str(d.teaming_recommendation),
    positioning: str(d.competitive_positioning),
  };
  const empty =
    !strategy.pricingApproach &&
    !strategy.pricingReasoning &&
    !strategy.teaming &&
    !strategy.positioning &&
    strategy.differentiators.length === 0 &&
    strategy.winThemes.length === 0;
  return empty ? null : strategy;
}

export const PRICING_APPROACH: Record<string, { label: string; blurb: string }> = {
  aggressive: {
    label: "Price aggressively",
    blurb: "Go in low to win it. Thinner margin, better odds.",
  },
  balanced: {
    label: "Price it balanced",
    blurb: "Competitive but still profitable — the usual choice.",
  },
  conservative: {
    label: "Hold your price",
    blurb: "Protect the margin. You'll need the rest of the bid to carry it.",
  },
};

/* ── Evaluation factors ───────────────────────────────────────────────── */

export type EvaluationFactor = {
  name: string;
  weightPct: number | null;
  description: string | null;
  guidance: string | null;
};

export function parseEvaluationFactors(raw: unknown): {
  factors: EvaluationFactor[];
  scoringMethod: string | null;
} {
  const d = parseJson<any>(raw);
  if (!d) return { factors: [], scoringMethod: null };

  const list: any[] = Array.isArray(d) ? d : Array.isArray(d.factors) ? d.factors : [];

  return {
    factors: list
      .map((item) => {
        if (typeof item === "string") {
          return { name: item.trim(), weightPct: null, description: null, guidance: null };
        }
        const o = (item ?? {}) as Record<string, any>;
        const weight = Number(o.weight_pct);
        return {
          name: String(o.name ?? o.factor ?? "").trim(),
          weightPct: Number.isFinite(weight) && weight > 0 ? weight : null,
          description: str(o.description),
          guidance: str(o.strong_response_guidance ?? o.guidance),
        };
      })
      .filter((f) => f.name.length > 0),
    scoringMethod: Array.isArray(d) ? null : str(d.scoring_method),
  };
}

/* ── Compliance checklist ─────────────────────────────────────────────── */

export type ChecklistItem = {
  requirement: string;
  category: string | null;
  urgency: string | null;
  action: string | null;
};

export function parseChecklist(raw: unknown): ChecklistItem[] {
  const d = parseJson<any>(raw);
  if (!d) return [];
  const list: any[] = Array.isArray(d) ? d : Array.isArray(d.items) ? d.items : [];
  return list
    .map((item) => {
      if (typeof item === "string") {
        return { requirement: item.trim(), category: null, urgency: null, action: null };
      }
      const o = (item ?? {}) as Record<string, any>;
      return {
        requirement: String(o.requirement ?? o.item ?? o.text ?? "").trim(),
        category: str(o.category),
        urgency: str(o.urgency),
        action: str(o.action_needed ?? o.action),
      };
    })
    .filter((i) => i.requirement.length > 0);
}

/* ── helpers ──────────────────────────────────────────────────────────── */

function str(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "n/a") return null;
  return s;
}

export function humanise(key: string): string {
  const s = key.replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
