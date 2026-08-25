import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import Page from "@/components/Page";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeading,
  DescList,
  DescRow,
  EmptyState,
  Field,
  Icon,
  Input,
  Segmented,
  SkeletonRows,
  Spinner,
  Tabs,
  Textarea,
  cx,
} from "@/ui/kit";
import {
  formatDate,
  deadlineLabel,
  deadlineTone,
  money,
  percentLabel,
  riskLabel,
  scoreTone,
  statusLabel,
  sentence,
  statusTone,
  toPercent,
} from "@/lib/format";

type AnyObj = Record<string, any>;
type Mode = "conservative" | "balanced" | "aggressive";
type TabKey = "overview" | "pricing" | "strategy" | "proposal";
type ChatMsg = { role: "user" | "assistant"; content: string };

const MODE_COPY: Record<Mode, { label: string; blurb: string }> = {
  conservative: { label: "Lower risk", blurb: "Thinner margin, better odds of winning." },
  balanced: { label: "Balanced", blurb: "Our default — fair margin, competitive price." },
  aggressive: { label: "Higher margin", blurb: "More profit if you win, but a tougher sell." },
};

export default function BidDetailsPage() {
  const { bidId } = useParams();
  const navigate = useNavigate();

  const [bid, setBid] = useState<AnyObj | null>(null);
  const [calc, setCalc] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  const [strategy, setStrategy] = useState<AnyObj | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);

  const [mode, setMode] = useState<Mode>("balanced");
  const [approvedBy, setApprovedBy] = useState("internal");
  const [notes, setNotes] = useState("");
  const [approving, setApproving] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [approvedVersionId, setApprovedVersionId] = useState<number | null>(null);

  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await api.get(`/bids/${bidId}`);
        if (!alive) return;
        setBid(r.data);
        if (r.data?.desired_profit_mode) setMode(r.data.desired_profit_mode as Mode);
        if (r.data?.approved_version_id) setApprovedVersionId(Number(r.data.approved_version_id));
        try {
          const c = await api.get(`/bids/${bidId}/details`);
          if (alive) setCalc(c.data);
        } catch {
          /* pricing simply hasn't been calculated yet */
        }
      } catch (e: any) {
        if (alive) setErr(e?.response?.data?.detail || "We couldn't load this bid.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bidId]);

  const totals = calc?.totals ?? null;
  const recs: AnyObj[] = useMemo(
    () => (Array.isArray(calc?.recommendations) ? calc!.recommendations : []).filter((r) => r?.mode),
    [calc]
  );
  const chosen = useMemo(() => recs.find((r) => r.mode === mode) ?? null, [recs, mode]);
  const isApproved = String(bid?.status ?? "").toLowerCase() === "approved";

  const winChance = toPercent(strategy?.win_probability ?? chosen?.win_score);
  const risk = riskLabel(bid?.risk_level);

  async function recompute() {
    setRecomputing(true);
    try {
      const r = await api.get(`/bids/${bidId}/details`);
      setCalc(r.data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "The pricing didn't recalculate.");
    } finally {
      setRecomputing(false);
    }
  }

  async function loadStrategy() {
    setLoadingStrategy(true);
    try {
      const r = await api.post(`/copilot/strategy/${bidId}`);
      setStrategy(r.data);
    } catch (e: any) {
      setStrategy({ error: e?.response?.data?.detail || "The strategist didn't respond." });
    } finally {
      setLoadingStrategy(false);
    }
  }

  async function approve() {
    setApproving(true);
    setErr(null);
    try {
      const r = await api.post(`/bids/${bidId}/approve`, {
        selected_mode: mode,
        approved_by: approvedBy.trim() || "internal",
        assumptions_notes: notes,
      });
      if (r.data?.version_id) setApprovedVersionId(Number(r.data.version_id));
      const b = await api.get(`/bids/${bidId}`);
      setBid(b.data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "That didn't go through.");
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <Page title="Loading bid" summary="Fetching the details for this bid." back={{ to: "/bids", label: "Back to My Bids" }}>
        <Card>
          <SkeletonRows rows={6} />
        </Card>
      </Page>
    );
  }

  if (!bid) {
    return (
      <Page title="Bid not found" summary="This bid may have been removed, or the link is wrong." back={{ to: "/bids", label: "Back to My Bids" }}>
        <Card padded={false}>
          <EmptyState
            icon="search_off"
            title="We couldn't find that bid"
            body={err ?? undefined}
            actions={<Button onClick={() => navigate("/bids")}>Back to My Bids</Button>}
          />
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title={bid.contract_title || "Untitled bid"}
      summary="Everything about this bid in one place — what the agency asked for, what it should cost, and whether it's worth submitting."
      back={{ to: "/bids", label: "Back to My Bids" }}
      eyebrow={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(bid.status)}>{statusLabel(bid.status)}</Badge>
          {bid.bid_code ? (
            <span className="font-mono text-[11px] text-faint">{bid.bid_code}</span>
          ) : null}
        </div>
      }
      actions={
        <>
          <Button icon="forum" onClick={() => setChatOpen(true)}>
            Ask about this bid
          </Button>
          {!isApproved ? (
            <Button tone="primary" icon="check" loading={approving} onClick={approve}>
              Approve
            </Button>
          ) : (
            <Badge tone="good" dot>
              Approved {bid.approved_at ? formatDate(bid.approved_at) : ""}
            </Badge>
          )}
        </>
      }
    >
      {err ? (
        <Alert className="mb-gap" onDismiss={() => setErr(null)}>
          {err}
        </Alert>
      ) : null}

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: "Overview" },
          { value: "pricing", label: "Pricing" },
          { value: "strategy", label: "Strategy" },
          { value: "proposal", label: "Proposal" },
        ]}
        className="mb-gap"
      />

      {tab === "overview" ? (
        <div className="grid grid-cols-1 gap-gap lg:grid-cols-3">
          <div className="space-y-gap lg:col-span-2">
            <Card>
              <CardHeading title="Should you bid?" />
              <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="shrink-0 sm:w-32">
                  <div
                    className={cx(
                      "text-display tnum",
                      winChance === null
                        ? "text-faint"
                        : scoreTone(winChance) === "good"
                        ? "text-good-solid"
                        : scoreTone(winChance) === "warn"
                        ? "text-warn-ink"
                        : "text-ink"
                    )}
                  >
                    {winChance === null ? "—" : percentLabel(winChance)}
                  </div>
                  <div className="text-meta text-muted">win chance</div>
                </div>

                <div className="border-line-soft sm:border-l sm:pl-5">
                  {winChance === null ? (
                    <>
                      <p className="text-h3">Not assessed yet</p>
                      <p className="mt-1 text-base text-muted">
                        Run the strategist and we'll estimate your odds against likely competition.
                      </p>
                      <Button
                        className="mt-3"
                        loading={loadingStrategy}
                        onClick={() => {
                          setTab("strategy");
                          void loadStrategy();
                        }}
                      >
                        Assess this bid
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-h3">
                        {winChance >= 60
                          ? "We'd go for it"
                          : winChance >= 35
                          ? "Worth a look, but it's tight"
                          : "The odds are against you"}
                      </p>
                      <p className="mt-1 text-base text-muted">
                        {strategy?.competitive_position ??
                          "Based on your profile, the pricing below and how this kind of contract usually goes."}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {bid.notes ? (
              <Card>
                <CardHeading title="What this contract is about" />
                <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-body">
                  {bid.notes}
                </p>
              </Card>
            ) : null}

            <Card>
              <CardHeading
                title="Cost breakdown"
                hint="What it costs you to deliver, before any profit."
                action={
                  <Button size="sm" loading={recomputing} onClick={recompute}>
                    Recalculate
                  </Button>
                }
              />
              <div className="mt-5">
                {!totals ? (
                  <p className="text-base text-muted">
                    Nothing calculated yet. Add your costs, then hit Recalculate.
                  </p>
                ) : (
                  <DescList>
                    <DescRow label="Materials">{money(totals.item_subtotal)}</DescRow>
                    <DescRow label="Labour">{money(totals.labor_total)}</DescRow>
                    <DescRow label="Transport">{money(totals.transport_total)}</DescRow>
                    <DescRow label="Equipment">{money(totals.equipment_total)}</DescRow>
                    <DescRow label="Overhead">{money(totals.overhead_total)}</DescRow>
                    <DescRow label={<span className="font-medium text-body">True cost</span>}>
                      <span className="font-semibold">{money(totals.true_cost)}</span>
                    </DescRow>
                    <DescRow label="Risk buffer">{money(totals.risk_buffer)}</DescRow>
                    <DescRow label={<span className="font-medium text-body">Adjusted cost</span>}>
                      <span className="font-semibold">{money(totals.adjusted_cost)}</span>
                    </DescRow>
                  </DescList>
                )}
              </div>
              <div className="mt-5 border-t border-line-soft pt-4">
                <Button size="sm" icon="edit" onClick={() => navigate(`/bids/${bidId}/edit`)}>
                  Edit costs
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-gap">
            <Card>
              <CardHeading title="At a glance" />
              <div className="mt-4">
                <DescList>
                  <DescRow label="Agency">{bid.agency_name || "—"}</DescRow>
                  <DescRow label="Type">{sentence(bid.contract_type)}</DescRow>
                  <DescRow label="Deadline">
                    {bid.deadline_date ? (
                      <>
                        <div>{formatDate(bid.deadline_date)}</div>
                        <div
                          className={cx(
                            "text-meta",
                            deadlineTone(bid.deadline_date) === "bad"
                              ? "text-bad-ink"
                              : "text-muted"
                          )}
                        >
                          {deadlineLabel(bid.deadline_date, "Due")}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </DescRow>
                  <DescRow label="Risk">
                    <Badge tone={risk.tone}>{risk.label}</Badge>
                  </DescRow>
                  <DescRow label="Competition">{sentence(bid.competition_level)}</DescRow>
                </DescList>
              </div>
            </Card>

            <Card>
              <CardHeading title="Your price" />
              {chosen ? (
                <>
                  <div className="mt-4 text-stat tnum text-ink">{money(chosen.bid_price)}</div>
                  <p className="mt-1 text-meta text-muted">
                    {MODE_COPY[mode].label} · {percentLabel(chosen.margin_pct)} margin ·{" "}
                    {money(chosen.profit_amount)} profit
                  </p>
                </>
              ) : (
                <p className="mt-4 text-base text-muted">
                  Recalculate to see a price for this bid.
                </p>
              )}
              <Button className="mt-4" size="sm" block onClick={() => setTab("pricing")}>
                Adjust pricing
              </Button>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "pricing" ? (
        <PricingTab
          recs={recs}
          mode={mode}
          setMode={setMode}
          totals={totals}
          isApproved={isApproved}
          approvedBy={approvedBy}
          setApprovedBy={setApprovedBy}
          notes={notes}
          setNotes={setNotes}
          approving={approving}
          onApprove={approve}
          recomputing={recomputing}
          onRecompute={recompute}
        />
      ) : null}

      {tab === "strategy" ? (
        <StrategyTab
          strategy={strategy}
          loading={loadingStrategy}
          onRun={loadStrategy}
        />
      ) : null}

      {tab === "proposal" ? (
        <ProposalTab bidId={String(bidId)} bid={bid} approvedVersionId={approvedVersionId} />
      ) : null}

      {chatOpen ? <CopilotDrawer bidId={String(bidId)} onClose={() => setChatOpen(false)} /> : null}
    </Page>
  );
}

/* ── Pricing ──────────────────────────────────────────────────────────── */

function PricingTab({
  recs,
  mode,
  setMode,
  totals,
  isApproved,
  approvedBy,
  setApprovedBy,
  notes,
  setNotes,
  approving,
  onApprove,
  recomputing,
  onRecompute,
}: {
  recs: AnyObj[];
  mode: Mode;
  setMode: (m: Mode) => void;
  totals: AnyObj | null;
  isApproved: boolean;
  approvedBy: string;
  setApprovedBy: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  approving: boolean;
  onApprove: () => void;
  recomputing: boolean;
  onRecompute: () => void;
}) {
  if (recs.length === 0) {
    return (
      <Card padded={false}>
        <EmptyState
          icon="calculate"
          title="No pricing yet"
          body="Once your costs are in, we'll work out three prices and tell you what each one does to your odds."
          actions={
            <Button tone="primary" loading={recomputing} onClick={onRecompute}>
              Calculate pricing
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-gap lg:grid-cols-3">
      <div className="space-y-gap lg:col-span-2">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-h2">Pick your price</h2>
              <p className="mt-0.5 text-meta text-muted">
                The same job, priced three ways. Pick one and approve it.
              </p>
            </div>
            <Button size="sm" loading={recomputing} onClick={onRecompute}>
              Recalculate
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["conservative", "balanced", "aggressive"] as Mode[]).map((m) => {
              const r = recs.find((x) => x.mode === m);
              if (!r) return null;
              const selected = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={selected}
                  className={cx(
                    "rounded-card border p-card text-left transition-all",
                    selected
                      ? "border-brand-600 bg-brand-50/40 shadow-ring"
                      : "border-line bg-surface shadow-card hover:border-brand-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-h3 text-ink">{MODE_COPY[m].label}</span>
                    {selected ? (
                      <Icon name="check_circle" filled className="text-[18px] text-brand-600" />
                    ) : null}
                  </div>
                  <div className="mt-3 text-h1 tnum text-ink">{money(r.bid_price)}</div>
                  <p className="mt-2 text-meta text-muted">{MODE_COPY[m].blurb}</p>
                  <dl className="mt-4 space-y-1.5 border-t border-line-soft pt-3">
                    <div className="flex justify-between text-meta">
                      <dt className="text-muted">Profit</dt>
                      <dd className="tnum text-body">{money(r.profit_amount)}</dd>
                    </div>
                    <div className="flex justify-between text-meta">
                      <dt className="text-muted">Margin</dt>
                      <dd className="tnum text-body">{percentLabel(r.margin_pct)}</dd>
                    </div>
                    {r.win_score != null ? (
                      <div className="flex justify-between text-meta">
                        <dt className="text-muted">Win chance</dt>
                        <dd className="tnum text-body">{percentLabel(r.win_score)}</dd>
                      </div>
                    ) : null}
                  </dl>
                </button>
              );
            })}
          </div>
        </div>

        {totals ? (
          <Card>
            <CardHeading title="Where the money goes" />
            <div className="mt-4">
              <DescList>
                <DescRow label="Materials">{money(totals.item_subtotal)}</DescRow>
                <DescRow label="Labour">{money(totals.labor_total)}</DescRow>
                <DescRow label="Transport">{money(totals.transport_total)}</DescRow>
                <DescRow label="Equipment">{money(totals.equipment_total)}</DescRow>
                <DescRow label="Overhead">{money(totals.overhead_total)}</DescRow>
                <DescRow label="Risk buffer">{money(totals.risk_buffer)}</DescRow>
                <DescRow label={<span className="font-medium text-body">Adjusted cost</span>}>
                  <span className="font-semibold">{money(totals.adjusted_cost)}</span>
                </DescRow>
              </DescList>
            </div>
          </Card>
        ) : null}
      </div>

      <Card className="h-fit">
        <CardHeading
          title="Approve this price"
          hint="Locks the numbers in and creates a version you can export."
        />
        {isApproved ? (
          <Alert tone="good" className="mt-5">
            This bid is already approved. Recalculating won't change the approved version.
          </Alert>
        ) : null}
        <div className="mt-5 space-y-4">
          <Field label="Approved by">
            <Input value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} />
          </Field>
          <Field label="Notes" hint="Assumptions you want on the record.">
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Button tone="primary" block loading={approving} onClick={onApprove}>
            {isApproved ? "Re-approve" : "Approve"} at {MODE_COPY[mode].label.toLowerCase()}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ── Strategy ─────────────────────────────────────────────────────────── */

function StrategyTab({
  strategy,
  loading,
  onRun,
}: {
  strategy: AnyObj | null;
  loading: boolean;
  onRun: () => void;
}) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <Spinner className="text-brand-600" />
          <p className="text-base text-body">Working through the solicitation and your history…</p>
        </div>
      </Card>
    );
  }

  if (!strategy) {
    return (
      <Card padded={false}>
        <EmptyState
          icon="neurology"
          title="Get a read on this bid"
          body="We'll weigh up the solicitation, your company profile, past bids and market rates, then suggest a price and tell you why."
          actions={
            <Button tone="primary" onClick={onRun}>
              Run the analysis
            </Button>
          }
        />
      </Card>
    );
  }

  if (strategy.error) {
    return (
      <Alert tone="warn" title="The analysis didn't finish">
        {String(strategy.error)}
      </Alert>
    );
  }

  const breakdown = strategy.price_breakdown ?? null;

  return (
    <div className="grid grid-cols-1 gap-gap lg:grid-cols-3">
      <div className="space-y-gap lg:col-span-2">
        <Card>
          <CardHeading title="What we'd do" />
          {strategy.strategy ? (
            <p className="mt-4 text-base leading-relaxed text-body">{strategy.strategy}</p>
          ) : null}
          {strategy.pricing_rationale ? (
            <>
              <h3 className="mt-6 text-h3">Why this price</h3>
              <p className="mt-2 text-base leading-relaxed text-body">
                {strategy.pricing_rationale}
              </p>
            </>
          ) : null}
        </Card>

        {strategy.competitive_position ? (
          <Card>
            <CardHeading title="Where you stand" />
            <p className="mt-4 text-base leading-relaxed text-body">
              {strategy.competitive_position}
            </p>

            {Array.isArray(strategy.strengths_to_highlight) &&
            strategy.strengths_to_highlight.length > 0 ? (
              <>
                <h3 className="mt-6 text-h3">Lead with these</h3>
                <ul className="mt-2 space-y-2">
                  {strategy.strengths_to_highlight.map((s: string, i: number) => (
                    <li key={i} className="flex gap-2.5 text-base text-body">
                      <Icon name="check_circle" className="mt-0.5 text-[16px] text-good-solid" />
                      {s}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {Array.isArray(strategy.risk_factors) && strategy.risk_factors.length > 0 ? (
              <>
                <h3 className="mt-6 text-h3">Watch out for</h3>
                <ul className="mt-2 space-y-2">
                  {strategy.risk_factors.map((r: string, i: number) => (
                    <li key={i} className="flex gap-2.5 text-base text-body">
                      <Icon name="warning" className="mt-0.5 text-[16px] text-warn-solid" />
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </Card>
        ) : null}
      </div>

      <div className="space-y-gap">
        <Card>
          <CardHeading title="Suggested price" />
          <div className="mt-4 text-stat tnum text-ink">{money(strategy.recommended_price)}</div>
          {strategy.price_range ? (
            <p className="mt-1 text-meta text-muted">
              Sensible range {money(strategy.price_range.low)} – {money(strategy.price_range.high)}
            </p>
          ) : null}
          {breakdown ? (
            <div className="mt-5 border-t border-line-soft pt-4">
              <DescList>
                <DescRow label="Labour">{money(breakdown.labor)}</DescRow>
                <DescRow label="Materials">{money(breakdown.materials)}</DescRow>
                <DescRow label="Overhead">{money(breakdown.overhead)}</DescRow>
                <DescRow label="Margin">{percentLabel(breakdown.profit_margin_pct)}</DescRow>
              </DescList>
            </div>
          ) : null}
        </Card>

        <Button block onClick={onRun}>
          Run it again
        </Button>
      </div>
    </div>
  );
}

/* ── Proposal ─────────────────────────────────────────────────────────── */

function ProposalTab({
  bidId,
  bid,
  approvedVersionId,
}: {
  bidId: string;
  bid: AnyObj;
  approvedVersionId: number | null;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "good" | "bad"; text: string } | null>(null);

  async function download(format: "pdf" | "docx") {
    setBusy(format);
    setMsg(null);
    try {
      let blob: Blob;
      let filename = `${bid.bid_code || "bid"}.${format}`;

      if (approvedVersionId) {
        const r = await api.get(`/bids/versions/${approvedVersionId}/export/${format}`, {
          responseType: "blob",
        });
        blob = r.data;
      } else {
        const opps = (await api.get("/opportunities")).data ?? [];
        const match = (Array.isArray(opps) ? opps : []).find(
          (o: AnyObj) =>
            o.converted_bid_id === Number(bidId) || o.title === bid.contract_title
        );
        if (!match) {
          setMsg({
            tone: "bad",
            text: "Approve the pricing first — that's what the proposal is built from.",
          });
          return;
        }
        const r = await api.post(
          `/opportunities/${match.id}/generate-proposal`,
          { format },
          { responseType: "blob" }
        );
        blob = r.data;
        filename = `${match.opp_code || "proposal"}.${format}`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ tone: "good", text: "Downloaded." });
    } catch (e: any) {
      setMsg({
        tone: "bad",
        text: e?.response?.data?.detail || "The document didn't generate. Try again shortly.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-prose">
      {msg ? (
        <Alert tone={msg.tone} className="mb-gap" onDismiss={() => setMsg(null)}>
          {msg.text}
        </Alert>
      ) : null}

      <Card>
        <CardHeading
          title="Proposal document"
          hint="Built from the solicitation, your company profile and the price you approved."
        />

        {!approvedVersionId ? (
          <Alert tone="warn" className="mt-5">
            Nothing is approved yet. You can still generate a draft, but the numbers won't be locked.
          </Alert>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            tone="primary"
            icon="picture_as_pdf"
            loading={busy === "pdf"}
            onClick={() => download("pdf")}
          >
            Download as PDF
          </Button>
          <Button icon="description" loading={busy === "docx"} onClick={() => download("docx")}>
            Download as Word
          </Button>
        </div>

        <p className="mt-6 border-t border-line-soft pt-5 text-base text-muted">
          Read it before you send it. It's a strong first draft, not a finished submission — check
          the numbers, the names and anything the agency asked for in a specific format.
        </p>
      </Card>
    </div>
  );
}

/* ── Copilot drawer ───────────────────────────────────────────────────── */

const PROMPTS = [
  "What price should I bid?",
  "What are the biggest risks here?",
  "How should I position our past work?",
  "What happens if I drop the price 15%?",
];

function CopilotDrawer({ bidId, onClose }: { bidId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    const next = [...messages, { role: "user" as const, content: msg }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await api.post(`/copilot/chat/${bidId}`, {
        message: msg,
        history: next.slice(-8),
      });
      setMessages([
        ...next,
        { role: "assistant", content: r.data?.response ?? r.data?.message ?? "No answer came back." },
      ]);
    } catch (e: any) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: e?.response?.data?.detail || "I couldn't reach the model just then.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-pop">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-h2">Ask about this bid</h2>
            <p className="text-meta text-muted">Answers use this bid's numbers and your profile.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-faint hover:text-body"
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <div>
              <p className="text-base text-muted">Not sure where to start?</p>
              <div className="mt-3 flex flex-col gap-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-control border border-line bg-raised px-3.5 py-2.5 text-left text-base text-body transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div key={i} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cx(
                  "max-w-[85%] rounded-card px-4 py-3 text-base leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-brand-600 text-white"
                    : "border border-line bg-raised text-body"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex items-center gap-2 text-base text-muted">
              <Spinner /> Thinking…
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="border-t border-line p-4"
        >
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about this bid"
              autoFocus
            />
            <Button type="submit" tone="primary" disabled={!input.trim() || loading} icon="send" />
          </div>
        </form>
      </aside>
    </div>
  );
}
