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
  Segmented,
  SkeletonRows,
  cx,
} from "@/ui/kit";
import {
  clamp,
  deadlineLabel,
  deadlineTone,
  percentLabel,
  scoreTone,
  shortDate,
  toPercent,
} from "@/lib/format";

type Card = Record<string, any>;
type Board = Record<string, Card[]>;

/** Backend stage keys, with names a non-expert reads without translating. */
const STAGES = [
  { key: "identified", label: "Found", accent: "bg-neutral-solid" },
  { key: "qualified", label: "Worth bidding", accent: "bg-brand-500" },
  { key: "capture", label: "Getting ready", accent: "bg-brand-600" },
  { key: "proposal", label: "Writing proposal", accent: "bg-warn-solid" },
  { key: "submitted", label: "Submitted", accent: "bg-warn-solid" },
  { key: "won", label: "Won", accent: "bg-good-solid" },
  { key: "lost", label: "Lost", accent: "bg-neutral-line" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

export default function PipelinePage() {
  const [board, setBoard] = useState<Board>({});
  const [view, setView] = useState<"board" | "list">("board");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState<Card | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

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

  const all = useMemo(() => Object.values(board).flat(), [board]);
  const active = useMemo(
    () => all.filter((c) => !["won", "lost"].includes(String(c.pipeline_stage))),
    [all]
  );

  async function move(card: Card, to: StageKey) {
    const from = String(card.pipeline_stage || "identified");
    if (from === to) return;

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
      setErr("That move didn't save. Reloading the board.");
      void load();
    }
  }

  const summary =
    "Every contract you're tracking, from the moment you spot it to the day it's won or lost. Drag a card to move it along.";

  return (
    <Page
      title="Pipeline"
      summary={summary}
      wide
      actions={
        <Segmented<"board" | "list">
          value={view}
          onChange={setView}
          options={[
            { value: "board", label: "Board" },
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

      {!loading && all.length > 0 ? (
        <p className="mb-5 text-meta text-muted">
          {active.length} active · {board.won?.length ?? 0} won · {board.lost?.length ?? 0} lost
        </p>
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
      ) : view === "list" ? (
        <ListView board={board} />
      ) : (
        <div className="-mx-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:-mx-page lg:px-page">
          <div className="flex min-w-max gap-4">
            {STAGES.map((stage) => {
              const cards = board[stage.key] ?? [];
              const isOver = overStage === stage.key;
              return (
                <section
                  key={stage.key}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverStage(stage.key);
                  }}
                  onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
                  onDrop={() => {
                    if (dragging) void move(dragging, stage.key);
                    setDragging(null);
                    setOverStage(null);
                  }}
                  className={cx(
                    "flex w-[268px] shrink-0 flex-col rounded-card transition-colors",
                    isOver ? "bg-brand-50 ring-2 ring-brand-200" : "bg-sunken"
                  )}
                >
                  <header className="px-3 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-h3 text-ink">{stage.label}</h2>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[12px] font-medium tnum text-muted">
                        {cards.length}
                      </span>
                    </div>
                    <div className={cx("mt-2.5 h-0.5 rounded-full", stage.accent)} />
                  </header>

                  <div className="flex flex-1 flex-col gap-2.5 p-3">
                    {cards.length === 0 ? (
                      <p className="py-8 text-center text-meta text-faint">Nothing here</p>
                    ) : (
                      cards.map((c) => (
                        <BoardCard
                          key={c.id}
                          card={c}
                          stageKey={stage.key}
                          onDragStart={() => setDragging(c)}
                          onDragEnd={() => {
                            setDragging(null);
                            setOverStage(null);
                          }}
                          onMove={(to) => move(c, to)}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </Page>
  );
}

/* ── Board card ───────────────────────────────────────────────────────── */

function BoardCard({
  card,
  stageKey,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  card: Card;
  stageKey: StageKey;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (to: StageKey) => void;
}) {
  const score = toPercent(card.fit_score);
  const tone = deadlineTone(card.due_date);
  const idx = STAGES.findIndex((s) => s.key === stageKey);
  const prev = idx > 0 ? STAGES[idx - 1] : null;
  const next = idx < STAGES.length - 1 ? STAGES[idx + 1] : null;

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group cursor-grab rounded-control border border-line bg-surface p-3.5 shadow-card transition-shadow hover:shadow-lift active:cursor-grabbing"
    >
      <Link
        to={`/opportunities/${card.id}`}
        className="block text-base font-medium leading-5 text-ink transition-colors hover:text-brand-700"
      >
        {clamp(card.title || "Untitled", 60)}
      </Link>

      <p className="mt-1 text-meta text-muted">{clamp(card.agency_name || "No agency", 34)}</p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
        {score !== null ? (
          <Badge tone={scoreTone(score)}>{percentLabel(score)}</Badge>
        ) : (
          <span className="text-meta text-faint">Not scored</span>
        )}
        {card.due_date ? (
          <span
            className={cx(
              "inline-flex items-center gap-1 text-meta tnum",
              tone === "bad" ? "text-bad-ink" : tone === "warn" ? "text-warn-ink" : "text-muted"
            )}
          >
            <Icon name="schedule" className="text-[14px]" />
            {shortDate(card.due_date)}
          </span>
        ) : null}
      </div>

      {/* Keyboard / touch alternative to dragging */}
      <div className="mt-0 flex max-h-0 gap-1 overflow-hidden opacity-0 transition-all duration-150 focus-within:mt-2 focus-within:max-h-8 focus-within:opacity-100 group-hover:mt-2 group-hover:max-h-8 group-hover:opacity-100">
        {prev ? (
          <button
            type="button"
            onClick={() => onMove(prev.key)}
            title={`Move to ${prev.label}`}
            className="flex h-6 flex-1 items-center justify-center rounded border border-line text-faint hover:bg-sunken hover:text-body"
          >
            <Icon name="chevron_left" className="text-[16px]" />
          </button>
        ) : null}
        {next ? (
          <button
            type="button"
            onClick={() => onMove(next.key)}
            title={`Move to ${next.label}`}
            className="flex h-6 flex-1 items-center justify-center rounded border border-line text-faint hover:bg-sunken hover:text-body"
          >
            <Icon name="chevron_right" className="text-[16px]" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

/* ── List view ────────────────────────────────────────────────────────── */

function ListView({ board }: { board: Board }) {
  const rows: Record<string, any>[] = STAGES.flatMap((s) =>
    (board[s.key] ?? []).map((c) => ({ ...c, _stage: s.label as string }))
  );

  return (
    <Card padded={false} className="overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line bg-raised">
            <th className="px-card py-3 text-caps uppercase text-muted">Contract</th>
            <th className="hidden px-card py-3 text-caps uppercase text-muted sm:table-cell">
              Stage
            </th>
            <th className="hidden px-card py-3 text-caps uppercase text-muted md:table-cell">
              Due
            </th>
            <th className="px-card py-3 text-right text-caps uppercase text-muted">Win chance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {rows.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-raised">
              <td className="px-card py-3.5">
                <Link
                  to={`/opportunities/${r.id}`}
                  className="text-base font-medium text-ink hover:text-brand-700"
                >
                  {clamp(r.title || "Untitled", 62)}
                </Link>
                <div className="mt-0.5 text-meta text-muted">{r.agency_name || "No agency"}</div>
              </td>
              <td className="hidden px-card py-3.5 sm:table-cell">
                <Badge>{r._stage}</Badge>
              </td>
              <td className="hidden px-card py-3.5 text-meta text-muted md:table-cell">
                {r.due_date ? deadlineLabel(r.due_date) : "—"}
              </td>
              <td className="px-card py-3.5 text-right text-base tnum text-ink">
                {percentLabel(r.fit_score)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
