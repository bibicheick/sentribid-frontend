import React, { createContext, useContext, useId } from "react";
import { Link } from "react-router-dom";
import type { Tone } from "@/lib/format";
import { ICONS } from "./icons";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ── Icon ─────────────────────────────────────────────────────────────── */

/**
 * Icons are inline SVG, not a webfont: nothing to download, nothing to flash,
 * and they can't fall back to rendering their own name as text.
 *
 * Size can be given as `size`, or picked up from a `text-[18px]` class so call
 * sites can keep sizing icons the same way they size text.
 */
const SIZE_IN_CLASS = /text-\[(\d+)px\]/;

export function Icon({
  name,
  className,
  filled,
  size,
}: {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
}) {
  const Glyph = ICONS[name];
  const fromClass = className?.match(SIZE_IN_CLASS)?.[1];
  const px = size ?? (fromClass ? Number(fromClass) : 20);

  if (!Glyph) {
    if ((import.meta as any).env?.DEV) console.warn(`No icon registered for "${name}"`);
    return null;
  }

  return (
    <Glyph
      aria-hidden="true"
      focusable="false"
      width={px}
      height={px}
      strokeWidth={filled ? 2.25 : 1.75}
      className={cx("shrink-0", className?.replace(SIZE_IN_CLASS, "").trim() || undefined)}
    />
  );
}

/* ── Button ───────────────────────────────────────────────────────────── */

type ButtonTone = "primary" | "default" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_TONE: Record<ButtonTone, string> = {
  primary:
    "bg-brand-600 text-white border border-brand-600 hover:bg-brand-700 hover:border-brand-700 active:bg-brand-700 shadow-card",
  default:
    "bg-white text-body border border-line hover:bg-raised hover:border-[#D7DAE0] active:bg-sunken shadow-card",
  ghost:
    "bg-transparent text-muted border border-transparent hover:bg-sunken hover:text-body",
  danger:
    "bg-white text-bad-ink border border-bad-line hover:bg-bad-bg active:bg-bad-bg shadow-card",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-meta gap-1.5",
  md: "h-9 px-3.5 text-base gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

type ButtonProps = {
  tone?: ButtonTone;
  size?: ButtonSize;
  icon?: string;
  trailingIcon?: string;
  loading?: boolean;
  block?: boolean;
  children?: React.ReactNode;
};

function buttonClass({ tone = "default", size = "md", block }: ButtonProps) {
  return cx(
    "inline-flex items-center justify-center rounded-control font-medium whitespace-nowrap",
    "transition-colors duration-150",
    "disabled:opacity-50 disabled:pointer-events-none",
    BUTTON_TONE[tone],
    BUTTON_SIZE[size],
    block && "w-full"
  );
}

export function Button({
  tone,
  size,
  icon,
  trailingIcon,
  loading,
  block,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(buttonClass({ tone, size, block }), className)}
    >
      {loading ? (
        <Spinner className={tone === "primary" ? "text-white" : "text-muted"} />
      ) : icon ? (
        <Icon name={icon} className="text-[18px]" />
      ) : null}
      {children}
      {trailingIcon && !loading ? <Icon name={trailingIcon} className="text-[18px]" /> : null}
    </button>
  );
}

export function LinkButton({
  to,
  tone,
  size,
  icon,
  trailingIcon,
  block,
  children,
  className,
}: ButtonProps & { to: string; className?: string }) {
  return (
    <Link to={to} className={cx(buttonClass({ tone, size, block }), className)}>
      {icon ? <Icon name={icon} className="text-[18px]" /> : null}
      {children}
      {trailingIcon ? <Icon name={trailingIcon} className="text-[18px]" /> : null}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cx("h-4 w-4 animate-spin", className)}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path
        d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────── */

export function Card({
  children,
  className,
  padded = true,
  ...rest
}: { padded?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cx(
        "bg-surface border border-line rounded-card shadow-card",
        padded && "p-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeading({
  title,
  hint,
  action,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-h2">{title}</h2>
        {hint ? <p className="text-meta text-muted mt-1">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ── Badge ────────────────────────────────────────────────────────────── */

const BADGE_TONE: Record<Tone, string> = {
  good: "bg-good-bg text-good-ink border-good-line",
  warn: "bg-warn-bg text-warn-ink border-warn-line",
  bad: "bg-bad-bg text-bad-ink border-bad-line",
  neutral: "bg-neutral-bg text-neutral-ink border-neutral-line",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
};

export function Badge({
  tone = "neutral",
  children,
  dot,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12px] font-medium leading-5 whitespace-nowrap",
        BADGE_TONE[tone],
        className
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  );
}

/* ── Stat tile ────────────────────────────────────────────────────────── */

export function StatTile({
  label,
  value,
  hint,
  hintTo,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  hintTo?: string;
  tone?: Tone;
}) {
  return (
    <Card className="flex flex-col">
      <div className="text-meta text-muted">{label}</div>
      <div
        className={cx(
          "text-stat tnum mt-2",
          tone === "good" ? "text-good-solid" : tone === "bad" ? "text-bad-solid" : "text-ink"
        )}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-2 text-meta text-muted">
          {hintTo ? (
            <Link to={hintTo} className="text-brand-600 font-medium hover:text-brand-700">
              {hint}
            </Link>
          ) : (
            hint
          )}
        </div>
      ) : (
        <div className="mt-2 h-[18px]" aria-hidden="true" />
      )}
    </Card>
  );
}

/* ── Form fields ──────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      {label ? <span className="block text-meta font-medium text-body mb-1.5">{label}</span> : null}
      {children}
      {error ? (
        <span className="block text-meta text-bad-ink mt-1.5">{error}</span>
      ) : hint ? (
        <span className="block text-meta text-muted mt-1.5">{hint}</span>
      ) : null}
    </label>
  );
}

const CONTROL =
  "form-input w-full rounded-control border border-line bg-white px-3 py-2 text-base text-ink " +
  "placeholder:text-faint shadow-card transition-colors " +
  "hover:border-[#D7DAE0] focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 " +
  "disabled:bg-sunken disabled:text-muted";

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx(CONTROL, className)} />;
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cx(CONTROL, "form-textarea resize-y", className)} />;
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx(CONTROL, "form-select pr-9", className)}>
      {children}
    </select>
  );
}

export function SearchInput({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cx("relative", className)}>
      <Icon
        name="search"
        className="icon text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
      />
      <input {...rest} className={cx(CONTROL, "pl-9")} />
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...rest
}: { label: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cx("flex items-center gap-2.5 cursor-pointer select-none", className)}>
      <input
        type="checkbox"
        {...rest}
        className="form-checkbox h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-600/20 focus:ring-4"
      />
      <span className="text-base text-body">{label}</span>
    </label>
  );
}

/* ── Segmented control ────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-control border border-line bg-sunken p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cx(
            "rounded-[6px] font-medium transition-colors",
            size === "sm" ? "px-2.5 h-7 text-meta" : "px-3 h-8 text-base",
            value === o.value
              ? "bg-white text-ink shadow-card"
              : "text-muted hover:text-body"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Tabs (underline) ─────────────────────────────────────────────────── */

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
  className?: string;
}) {
  return (
    <div className={cx("border-b border-line", className)}>
      <div className="flex gap-6 overflow-x-auto">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cx(
                "relative -mb-px whitespace-nowrap border-b-2 pb-3 pt-1 text-base font-medium transition-colors",
                active
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-muted hover:text-body hover:border-line"
              )}
            >
              {o.label}
              {typeof o.count === "number" ? (
                <span
                  className={cx(
                    "ml-2 rounded-full px-1.5 py-0.5 text-[11px] tnum",
                    active ? "bg-brand-50 text-brand-700" : "bg-sunken text-muted"
                  )}
                >
                  {o.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────── */

export function EmptyState({
  icon = "inbox",
  title,
  body,
  actions,
  className,
}: {
  icon?: string;
  title: string;
  body?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center text-center px-6 py-16", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-faint">
        <Icon name={icon} className="text-[24px]" />
      </div>
      <h3 className="text-h2">{title}</h3>
      {body ? <p className="mt-1.5 max-w-sm text-base text-muted">{body}</p> : null}
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}

/* ── Alert ────────────────────────────────────────────────────────────── */

export function Alert({
  tone = "bad",
  title,
  children,
  onDismiss,
  className,
}: {
  tone?: Tone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const icons: Record<Tone, string> = {
    good: "check_circle",
    warn: "warning",
    bad: "error",
    neutral: "info",
    brand: "info",
  };
  return (
    <div
      role="status"
      className={cx(
        "flex items-start gap-3 rounded-card border px-4 py-3",
        BADGE_TONE[tone],
        className
      )}
    >
      <Icon name={icons[tone]} className="text-[20px] shrink-0 mt-px" />
      <div className="min-w-0 flex-1 text-base">
        {title ? <div className="font-medium">{title}</div> : null}
        {children ? <div className={cx(title && "mt-0.5", "opacity-90")}>{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 opacity-60 hover:opacity-100"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      ) : null}
    </div>
  );
}

/* ── Meter ────────────────────────────────────────────────────────────── */

export function Meter({ value, tone = "neutral" }: { value: number | null; tone?: Tone }) {
  const pct = value ?? 0;
  const fill =
    tone === "good"
      ? "bg-good-solid"
      : tone === "warn"
      ? "bg-warn-solid"
      : tone === "bad"
      ? "bg-bad-solid"
      : "bg-neutral-solid";
  return (
    <div className="h-1 w-14 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
      <div className={cx("h-full rounded-full transition-all", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Avatar ───────────────────────────────────────────────────────────── */

export function Avatar({
  name,
  size = 32,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const text = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-medium text-brand-700",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {text || "?"}
    </span>
  );
}

/* ── Definition list ──────────────────────────────────────────────────── */

export function DescList({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-line-soft">{children}</dl>;
}

export function DescRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-meta text-muted shrink-0">{label}</dt>
      <dd className="text-base text-ink text-right min-w-0">{children}</dd>
    </div>
  );
}

/* ── Skeletons ────────────────────────────────────────────────────────── */

export function SkeletonLine({ w = "100%", className }: { w?: string; className?: string }) {
  return <div className={cx("skeleton h-3.5", className)} style={{ width: w }} />;
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <SkeletonLine w="55%" />
            <SkeletonLine w="32%" className="h-3" />
          </div>
          <SkeletonLine w="72px" className="h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTiles({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-gap lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <SkeletonLine w="45%" className="h-3" />
          <SkeletonLine w="30%" className="mt-3 h-7" />
          <SkeletonLine w="55%" className="mt-3 h-3" />
        </Card>
      ))}
    </div>
  );
}

/* ── Tiny disclosure used for "Advanced" rows ─────────────────────────── */

const DisclosureCtx = createContext<{ id: string } | null>(null);

export function useDisclosureId() {
  const ctx = useContext(DisclosureCtx);
  const fallback = useId();
  return ctx?.id ?? fallback;
}
