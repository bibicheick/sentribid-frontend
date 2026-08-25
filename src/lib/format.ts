// Small formatting helpers. Everything that turns raw API values into
// something a person can read lives here, so the pages stay about layout.

/** The API is inconsistent: some scores come back 0–1, some 0–100.
 *  Normalise once, here, and never format a raw score in a component. */
export function toPercent(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const scaled = n > 0 && n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

export function percentLabel(value: unknown, fallback = "—"): string {
  const p = toPercent(value);
  return p === null ? fallback : `${p}%`;
}

export function money(value: unknown, fallback = "—"): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** $1.2M / $480K / $920 — for tiles where the exact cents don't matter. */
export function compactMoney(value: unknown, fallback = "—"): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

export function formatDate(value: unknown, fallback = "—"): string {
  if (!value) return fallback;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function shortDate(value: unknown, fallback = "—"): string {
  if (!value) return fallback;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Whole days between now and a date. Negative once the date has passed. */
export function daysUntil(value: unknown): number | null {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - start.getTime()) / 86_400_000);
}

/** "Closes in 12 days" / "Due tomorrow" / "Closed 3 days ago" */
export function deadlineLabel(value: unknown, verb = "Closes"): string {
  const days = daysUntil(value);
  if (days === null) return "No deadline set";
  if (days < 0) return `Closed ${Math.abs(days)} ${plural(Math.abs(days), "day")} ago`;
  if (days === 0) return `${verb} today`;
  if (days === 1) return `${verb} tomorrow`;
  return `${verb} in ${days} days`;
}

/** How loud the deadline should look. */
export function deadlineTone(value: unknown): "bad" | "warn" | "muted" {
  const days = daysUntil(value);
  if (days === null) return "muted";
  if (days <= 3) return "bad";
  if (days <= 7) return "warn";
  return "muted";
}

export function plural(n: number, word: string, suffix = "s"): string {
  return n === 1 ? word : word + suffix;
}

export function initials(name?: string | null, fallback = "?"): string {
  const clean = String(name ?? "").trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || fallback;
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Turn API status strings into words a non-expert recognises. */
const STATUS_WORDS: Record<string, string> = {
  draft: "Draft",
  new: "New",
  analyzed: "Reviewed",
  analysing: "Reviewing",
  analyzing: "Reviewing",
  converted: "Became a bid",
  approved: "Approved",
  pending: "Needs approval",
  submitted: "Submitted",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
};

export function statusLabel(value: unknown): string {
  const key = String(value ?? "").toLowerCase().trim();
  if (!key) return "—";
  return STATUS_WORDS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/[_-]/g, " ");
}

export type Tone = "good" | "warn" | "bad" | "neutral" | "brand";

export function statusTone(value: unknown): Tone {
  const key = String(value ?? "").toLowerCase().trim();
  if (["won", "approved", "submitted"].includes(key)) return "good";
  if (["pending", "needs approval", "analyzing", "analysing"].includes(key)) return "warn";
  if (["lost", "expired", "rejected"].includes(key)) return "bad";
  if (["converted", "analyzed"].includes(key)) return "brand";
  return "neutral";
}

/** Colour for a win-chance number. Above 70 is worth chasing. */
export function scoreTone(value: unknown): Tone {
  const p = toPercent(value);
  if (p === null) return "neutral";
  if (p >= 70) return "good";
  if (p >= 40) return "warn";
  return "neutral";
}

/** Turn the AI's bid / no-bid string into a sentence. */
export function recommendationLabel(value: unknown): string | null {
  const key = String(value ?? "").toLowerCase().trim();
  if (!key) return null;
  if (key.includes("no")) return "We'd skip this one";
  if (key.includes("bid")) return "We recommend bidding";
  if (key.includes("watch") || key.includes("monitor")) return "Worth watching";
  return null;
}

export function riskLabel(level: unknown): { label: string; tone: Tone } {
  const n = Number(level);
  if (!Number.isFinite(n)) return { label: "Not assessed", tone: "neutral" };
  if (n >= 4) return { label: "High", tone: "bad" };
  if (n >= 3) return { label: "Medium", tone: "warn" };
  return { label: "Low", tone: "good" };
}

/** Truncate on a word boundary rather than mid-word. */
export function clamp(text: unknown, max: number): string {
  const s = String(text ?? "").trim();
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(" ", max) || max).trimEnd() + "…";
}

/** Names that have a fixed casing, whatever the API sends. */
const KNOWN_CASING: Record<string, string> = {
  "sam.gov": "SAM.gov",
  sam: "SAM.gov",
  naics: "NAICS",
  psc: "PSC",
  uei: "UEI",
  cage: "CAGE",
  rfp: "RFP",
  rfi: "RFI",
  rfq: "RFQ",
  ifb: "IFB",
  idiq: "IDIQ",
  gsa: "GSA",
  usaspending: "USAspending",
  "usaspending.gov": "USAspending.gov",
};

/** API values arrive lowercase ("service", "medium", "sam.gov"). Show them as words. */
export function sentence(value: unknown, fallback = "—"): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  const known = KNOWN_CASING[raw.toLowerCase()];
  if (known) return known;

  const s = raw.replace(/[_-]+/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
