import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import Page from "@/components/Page";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Icon,
  LinkButton,
  Meter,
  Segmented,
  SkeletonRows,
  cx,
} from "@/ui/kit";
import {
  clamp,
  deadlineLabel,
  deadlineTone,
  formatDate,
  percentLabel,
  scoreTone,
  toPercent,
} from "@/lib/format";

type PipelineCard = Record<string, any>;
type Board = Record<string, PipelineCard[]>;

/** Backend stage keys, with names a non-expert reads without translating. */
const STAGES = [
  { key: "identified", label: "Found", dot: "bg-neutral-solid" },
  { key: "qualified", label: "Worth bidding", dot: "bg-brand-500" },
  { key: "capture", label: "Getting ready", dot: "bg-brand-600" },
  { key: "proposal", label: "Writing proposal", dot: "bg-warn-solid" },
  { key: "submitted", label: "Submitted", dot: "bg-warn-solid" },
  { key: "won", label: "Won", dot: "bg-good-solid" },
  { key: "lost", label: "Lost", dot: "bg-neutral-line" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.label])
);

export default function PipelinePage() {
  const [board, setBoard] = useState<Board>({});
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<StageKey | "all">("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [moving, setMoving] = useState<number | null>(null);

  async function load() {
    try {
      const r = await api.get("/discovery/pipeline");
      setBoard(r.data?.pipeline ?? {});
      setErr(null);
    } catch {
      setErr("We couldn't load your pipeline. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of STAGES) out[s.key] = (board[s.key] ?? []).length;
    return out;
  }, [board]);

  const all = useMemo<PipelineCard[]>(
    () =>
      STAGES.flatMap((s) =>
        (board[s.key] ?? []).map((c) => ({ ...c, _stage: s.key as StageKey }))
      ),
    [board]
  );

  const visible = useMemo(
    () => (filter === "all" ? all : all.filter((c) => c._stage === filter)),
    [all, filter]
  );

  const activeCount = all.filter((c) => !["won", "lost"].includes(c._stage)).length;

  async function move(card: PipelineCard, to: StageKey) {
    const from = String(card.pipeline_stage || card._stage || "identified");
    if (from === to) return;

    setMoving(card.id);
    // Move it on screen first — the request is a formality the user shouldn't wait on.
    setBoard((prev) => {
      const next = { ...prev };
      next[from] = (next[from] ?? []).filter((c) => c.id !== card.id);
      next[to] = [...(next[to] ?? []), { ...card, pipeline_stage: to }];
      return next;
    });

    try {
      await api.put(`/discovery/pipeline/${card.id}`, { stage: to });
    } catch {
      setErr("That move didn't save. Reloading.");
      void load();
    } finally {
      setMoving(null);
    }
  }

  return (
    <Page
      title="Pipeline"
      summary="Every contract you're tracking, from the moment you spot it to the day it's won or lost."
      actions={
        <Segmented<"grid" | "list">
          value={view}
          onChange={setView}
          options={[
            { value: "grid", label: "Grid" },
            { value: "list", label: "List" },
          ]}
        />
      }
    >
      {err ? (
        <Alert className="mb-gap" onDismiss={() => setErr(null)}>
          {err}
        </Alert>
      ) : null}

      {loading ? (
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      ) : all.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon="view_kanban"
            title="No opportunities yet"
            body="Search for contracts or upload an RFP, and everything you save lands here."
            actions={
              <>
                <LinkButton to="/find-work" tone="primary">
                  Find contracts
                </LinkButton>
                <LinkButton to="/bids/new">Upload an RFP</LinkButton>
              </>
            }
          />
        </Card>
      ) : (
        <>
          <p className="mb-4 text-meta text-muted">
            {activeCount} active · {counts.won} won · {counts.lost} lost
          </p>

          {/* Stage filter */}
          <div className="mb-gap flex flex-wrap gap-2">
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="All stages"
              count={all.length}
            />
            {STAGES.map((s) => (
              <FilterChip
                key={s.key}
                active={filter === s.key}
                onClick={() => setFilter(s.key)}
                label={s.label}
                count={counts[s.key]}
                dot={s.dot}
                dimmed={counts[s.key] === 0}
              />
            ))}
          </div>

          {visible.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                icon="filter_alt_off"
                title={`Nothing in ${STAGE_LABEL[filter as string] ?? "this stage"}`}
                body="Move something here, or pick a different stage above."
              />
            </Card>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((card) => (
                <GridCard
                  key={card.id}
                  card={card}
                  moving={moving === card.id}
                  onMove={(to) => move(card, to)}
                />
              ))}
            </div>
          ) : (
            <ListView cards={visible} onMove={move} moving={moving} />
          )}
        </>
      )}
    </Page>
  );
}

/* ── Filter chip ──────────────────────────────────────────────────────── */

function FilterChip({
  active,
  onClick,
  label,
  count,
  dot,
  dimmed,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dot?: string;
  dimmed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-base font-medium transition-colors",
        active
          ? "border-brand-600 bg-brand-50 text-brand-700"
          : "border-line bg-surface text-muted shadow-card hover:border-[#D7DAE0] hover:text-body",
        dimmed && !active && "opacity-55"
      )}
    >
      {dot ? <span className={cx("h-1.5 w-1.5 rounded-full", dot)} /> : null}
      {label}
      <span className={cx("tnum text-[12px]", active ? "text-brand-600" : "text-faint")}>
        {count}
      </span>
    </button>
  );
}

/* ── Grid card ────────────────────────────────────────────────────────── */

function GridCard({
  card,
  moving,
  onMove,
}: {
  card: PipelineCard;
  moving: boolean;
  onMove: (to: StageKey) => void;
}) {
  const score = toPercent(card.fit_score);
  const tone = deadlineTone(card.due_date);
  const stage = String(card.pipeline_stage || card._stage || "identified");

  return (
    <Card padded={false} className={cx("flex flex-col transition-shadow hover:shadow-lift", moving && "opacity-60")}>
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/opportunities/${card.id}`}
            className="text-h3 leading-snug text-ink transition-colors hover:text-brand-700"
          >
            {clamp(card.title || "Untitled", 72)}
          </Link>
          {score !== null ? (
            <Badge tone={scoreTone(score)} className="shrink-0">
              {percentLabel(score)}
            </Badge>
          ) : null}
        </div>

        <p className="mt-1.5 text-meta text-muted">{clamp(card.agency_name || "No agency listed", 44)}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {card.naics_code ? <Badge>NAICS {card.naics_code}</Badge> : null}
          {card.has_war_room ? <Badge tone="brand">Competition sized up</Badge> : null}
          {card.has_analysis ? <Badge tone="brand">Reviewed</Badge> : null}
        </div>

        {score !== null ? (
          <div className="mt-4 flex items-center gap-2">
            <Meter value={score} tone={scoreTone(score)} />
            <span className="text-meta text-muted">win chance</span>
          </div>
        ) : null}

        <p
          className={cx(
            "mt-4 flex items-center gap-1.5 text-meta",
            tone === "bad" ? "text-bad-ink" : tone === "warn" ? "text-warn-ink" : "text-muted"
          )}
        >
          <Icon name="schedule" className="text-[14px]" />
          {card.due_date ? `${deadlineLabel(card.due_date)} · ${formatDate(card.due_date)}` : "No deadline set"}
        </p>
      </div>

      <div className="flex items-center gap-2 border-t border-line-soft px-5 py-3">
        <StageSelect value={stage} onChange={onMove} disabled={moving} />
        <LinkButton
          size="sm"
          tone="ghost"
          to={`/opportunities/${card.id}`}
          trailingIcon="arrow_forward"
          className="ml-auto"
        >
          Open
        </LinkButton>
      </div>
    </Card>
  );
}

/** Moving a card is a select, not a drag — it works on a phone and with a keyboard. */
function StageSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (to: StageKey) => void;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="sr-only">Stage</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as StageKey)}
        className="h-8 rounded-control border border-line bg-white pl-2.5 pr-7 text-meta font-medium text-body transition-colors hover:border-[#D7DAE0] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/10 disabled:opacity-50"
      >
        {STAGES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ── List view ────────────────────────────────────────────────────────── */

function ListView({
  cards,
  onMove,
  moving,
}: {
  cards: PipelineCard[];
  onMove: (card: PipelineCard, to: StageKey) => void;
  moving: number | null;
}) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-line bg-raised">
              <th className="px-card py-3 text-caps uppercase text-muted">Contract</th>
              <th className="whitespace-nowrap px-4 py-3 text-caps uppercase text-muted">Stage</th>
              <th className="whitespace-nowrap px-4 py-3 text-caps uppercase text-muted">Closes</th>
              <th className="whitespace-nowrap px-4 py-3 text-caps uppercase text-muted">
                Win chance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {cards.map((c) => {
              const score = toPercent(c.fit_score);
              const tone = deadlineTone(c.due_date);
              return (
                <tr key={c.id} className={cx("transition-colors hover:bg-raised", moving === c.id && "opacity-60")}>
                  <td className="px-card py-4">
                    <Link
                      to={`/opportunities/${c.id}`}
                      className="text-base font-medium text-ink hover:text-brand-700"
                    >
                      {clamp(c.title || "Untitled", 62)}
                    </Link>
                    <div className="mt-0.5 text-meta text-muted">
                      {c.agency_name || "No agency listed"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StageSelect
                      value={String(c.pipeline_stage || c._stage || "identified")}
                      onChange={(to) => onMove(c, to)}
                      disabled={moving === c.id}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {c.due_date ? (
                      <>
                        <div className="text-base tnum text-ink">{formatDate(c.due_date)}</div>
                        <div
                          className={cx(
                            "mt-0.5 text-meta",
                            tone === "bad"
                              ? "text-bad-ink"
                              : tone === "warn"
                              ? "text-warn-ink"
                              : "text-muted"
                          )}
                        >
                          {deadlineLabel(c.due_date)}
                        </div>
                      </>
                    ) : (
                      <span className="text-base text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {score !== null ? (
                      <>
                        <div className="text-base font-medium tnum text-ink">
                          {percentLabel(score)}
                        </div>
                        <Meter value={score} tone={scoreTone(score)} />
                      </>
                    ) : (
                      <span className="text-base text-faint">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
