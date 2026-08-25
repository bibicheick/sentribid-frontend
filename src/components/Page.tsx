import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon, cx } from "@/ui/kit";

/**
 * Every screen in SentriBiD is wrapped in this.
 *
 * `summary` is deliberately required, not optional: each page has to say in one
 * plain sentence what it is for. If a new page can't be described in a sentence,
 * that's a signal the page is doing too much.
 */
export default function Page({
  title,
  summary,
  actions,
  back,
  eyebrow,
  children,
  wide,
}: {
  title: string;
  summary: string;
  actions?: React.ReactNode;
  back?: { to: string; label: string };
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    document.title = `${title} · SentriBiD`;
  }, [title]);

  return (
    <div className={cx("animate-fade-up", wide ? "" : "max-w-content")}>
      <header className="mb-8">
        {back ? (
          <Link
            to={back.to}
            className="mb-3 inline-flex items-center gap-1 text-meta font-medium text-muted transition-colors hover:text-body"
          >
            <Icon name="arrow_back" className="text-[16px]" />
            {back.label}
          </Link>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {eyebrow ? <div className="mb-1.5">{eyebrow}</div> : null}
            <h1 className="text-h1">{title}</h1>
            <p className="mt-1.5 max-w-prose text-base text-muted">{summary}</p>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
          ) : null}
        </div>
      </header>

      {children}
    </div>
  );
}

/** A section break inside a page — used where a page has more than one idea. */
export function Section({
  title,
  hint,
  actions,
  children,
  className,
}: {
  title?: string;
  hint?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("mt-gap first:mt-0", className)}>
      {title ? (
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-h2">{title}</h2>
            {hint ? <p className="mt-0.5 text-meta text-muted">{hint}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
