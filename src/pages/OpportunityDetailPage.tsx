import { useEffect, useMemo, useState } from "react";
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
  Icon,
  SkeletonRows,
  Spinner,
  Tabs,
  cx,
} from "@/ui/kit";
import {
  clamp,
  compactMoney,
  deadlineLabel,
  deadlineTone,
  formatDate,
  percentLabel,
  recommendationLabel,
  scoreTone,
  sentence,
  statusLabel,
  statusTone,
  toPercent,
} from "@/lib/format";
import {
  PRICING_APPROACH,
  countRequirements,
  parseChecklist,
  parseEvaluationFactors,
  parseJson,
  parseRequirements,
  parseRisks,
  parseStrategy,
  parseSummary,
  severityLabel,
  severityTone,
  toStringList,
  type Risk,
} from "@/lib/ai";

type AnyObj = Record<string, any>;
type TabKey = "overview" | "requirements" | "compliance";

export default function OpportunityDetailPage() {
  const { oppId } = useParams();
  const navigate = useNavigate();

  const [opp, setOpp] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  const [analyzing, setAnalyzing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [shred, setShred] = useState<AnyObj | null>(null);
  const [shredding, setShredding] = useState(false);
  const [matrix, setMatrix] = useState<AnyObj | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const r = await api.get(`/opportunities/${oppId}`);
      setOpp(r.data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "We couldn't load this opportunity.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oppId]);

  // Everything the model produced arrives as a JSON string — parse once, here.
  const summary = useMemo(() => parseSummary(opp?.ai_summary), [opp]);
  const strategy = useMemo(() => parseStrategy(opp?.ai_bid_strategy), [opp]);
  const riskReport = useMemo(() => parseRisks(opp?.ai_risk_flags), [opp]);
  const requirements = useMemo(() => parseRequirements(opp?.ai_requirements), [opp]);
  const evaluation = useMemo(() => parseEvaluationFactors(opp?.ai_evaluation_factors), [opp]);
  const checklist = useMemo(() => parseChecklist(opp?.ai_compliance_checklist), [opp]);

  const shredRequirements = useMemo(
    () => (shred ? parseRequirements(shred.requirements ?? shred) : []),
    [shred]
  );
  const shredFactors = useMemo(
    () => (shred ? parseEvaluationFactors(shred.evaluation_factors) : { factors: [], scoringMethod: null }),
    [shred]
  );

  async function analyze() {
    setAnalyzing(true);
    try {
      await api.post(`/opportunities/${oppId}/analyze`);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "The review didn't finish.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function convert() {
    setConverting(true);
    try {
      const r = await api.post(`/opportunities/${oppId}/convert`);
      navigate(`/bids/${r.data.bid_id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "We couldn't turn this into a bid.");
    } finally {
      setConverting(false);
    }
  }

  async function runShred() {
    setShredding(true);
    try {
      const r = await api.post(`/discovery/shred/${oppId}`);
      setShred(r.data?.error ? { error: r.data.error } : parseJson(r.data) ?? r.data);
    } catch (e: any) {
      setShred({ error: e?.response?.data?.detail || "Couldn't pull out the requirements." });
    } finally {
      setShredding(false);
    }
  }

  async function runMatrix() {
    setMatrixLoading(true);
    try {
      const r = await api.post(`/discovery/compliance-matrix/${oppId}`);
      setMatrix(r.data);
    } catch (e: any) {
      setMatrix({ error: e?.response?.data?.detail || "Couldn't build the checklist." });
    } finally {
      setMatrixLoading(false);
    }
  }

  async function proposal(format: "pdf" | "docx") {
    setDownloading(format);
    try {
      const r = await api.post(
        `/opportunities/${oppId}/generate-proposal`,
        { format },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${opp?.opp_code || "proposal"}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "The proposal didn't generate.");
    } finally {
      setDownloading(null);
    }
  }

  if (loading) {
    return (
      <Page title="Loading" summary="Fetching this opportunity." back={{ to: "/find-work", label: "Back to Find Work" }}>
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      </Page>
    );
  }

  if (!opp) {
    return (
      <Page
        title="Opportunity not found"
        summary="It may have been removed, or the link is wrong."
        back={{ to: "/find-work", label: "Back to Find Work" }}
      >
        <Card padded={false}>
          <EmptyState icon="search_off" title="Nothing here" body={err ?? undefined} />
        </Card>
      </Page>
    );
  }

  const score = toPercent(opp.fit_score ?? opp.ai_confidence_score);
  const rec = recommendationLabel(opp.ai_bid_recommendation);
  const attachments: AnyObj[] = Array.isArray(opp.attachments) ? opp.attachments : [];
  const reviewed = Boolean(summary || strategy || riskReport.risks.length || requirements.length);
  const value =
    opp.estimated_value_low || opp.estimated_value_high
      ? `${compactMoney(opp.estimated_value_low)} – ${compactMoney(opp.estimated_value_high)}`
      : summary?.valueRange ?? null;

  return (
    <Page
      title={opp.title || "Untitled opportunity"}
      summary="What the agency is asking for, how well it fits you, and what it would take to bid."
      back={{ to: "/find-work", label: "Back to Find Work" }}
      eyebrow={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(opp.status)}>{statusLabel(opp.status)}</Badge>
          {opp.opp_code ? (
            <span className="font-mono text-[11px] text-faint">{opp.opp_code}</span>
          ) : null}
        </div>
      }
      actions={
        <>
          <Button loading={analyzing} onClick={analyze} icon="auto_awesome">
            {reviewed ? "Review again" : "Review this"}
          </Button>
          {opp.converted_bid_id ? (
            <Button tone="primary" onClick={() => navigate(`/bids/${opp.converted_bid_id}`)}>
              Open the bid
            </Button>
          ) : (
            <Button tone="primary" loading={converting} onClick={convert}>
              Turn into a bid
            </Button>
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
          {
            value: "requirements",
            label: "Requirements",
            count: countRequirements(requirements) || undefined,
          },
          { value: "compliance", label: "Can we meet it?" },
        ]}
        className="mb-gap"
      />

      {tab === "overview" ? (
        <div className="grid grid-cols-1 gap-gap lg:grid-cols-3">
          <div className="space-y-gap lg:col-span-2">
            {/* Fit */}
            <Card>
              <CardHeading title="Is this a fit?" />
              <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="shrink-0 sm:w-32">
                  <div
                    className={cx(
                      "text-display tnum",
                      score === null
                        ? "text-faint"
                        : scoreTone(score) === "good"
                        ? "text-good-solid"
                        : scoreTone(score) === "warn"
                        ? "text-warn-ink"
                        : "text-ink"
                    )}
                  >
                    {score === null ? "—" : percentLabel(score)}
                  </div>
                  <div className="text-meta text-muted">win chance</div>
                </div>
                <div className="border-line-soft sm:border-l sm:pl-5">
                  <p className="text-h3">
                    {rec ?? (reviewed ? "No recommendation yet" : "Not reviewed yet")}
                  </p>
                  <p className="mt-1 text-base text-muted">
                    {summary?.criticalInsight ??
                      (reviewed
                        ? "Based on the solicitation and your company profile."
                        : "Run a review and we'll read the solicitation and score it against your profile.")}
                  </p>
                </div>
              </div>
            </Card>

            {/* What it is */}
            {summary?.summary ? (
              <Card>
                <CardHeading title="What this contract is about" />
                <p className="mt-4 text-base leading-relaxed text-body">{summary.summary}</p>
                {summary.procurementType || summary.posted || summary.due || summary.valueRange ? (
                  <div className="mt-5 grid grid-cols-1 gap-4 border-t border-line-soft pt-5 sm:grid-cols-3">
                    {summary.procurementType ? (
                      <Fact label="Procurement type" value={sentence(summary.procurementType)} />
                    ) : null}
                    {summary.valueRange ? <Fact label="Value" value={summary.valueRange} /> : null}
                    {summary.due ? <Fact label="Proposals due" value={summary.due} /> : null}
                  </div>
                ) : null}
              </Card>
            ) : null}

            {/* Strategy */}
            {strategy ? (
              <Card>
                <CardHeading
                  title="How you'd win it"
                  hint="Our read on where to position you against everyone else bidding."
                />

                {strategy.pricingApproach ? (
                  <div className="mt-5 flex items-start gap-3 rounded-control border border-brand-100 bg-brand-50/50 p-4">
                    <Icon name="trending_up" className="mt-0.5 text-[18px] text-brand-600" />
                    <div>
                      <p className="text-h3 text-brand-900">
                        {PRICING_APPROACH[strategy.pricingApproach.toLowerCase()]?.label ??
                          `Price ${strategy.pricingApproach}`}
                      </p>
                      <p className="mt-0.5 text-meta text-brand-700">
                        {PRICING_APPROACH[strategy.pricingApproach.toLowerCase()]?.blurb ?? ""}
                      </p>
                    </div>
                  </div>
                ) : null}

                {strategy.pricingReasoning ? (
                  <p className="mt-4 text-base leading-relaxed text-body">
                    {strategy.pricingReasoning}
                  </p>
                ) : null}

                {strategy.winThemes.length > 0 ? (
                  <Bullets
                    title="Themes to build the proposal around"
                    items={strategy.winThemes}
                    icon="star"
                    tone="brand"
                  />
                ) : null}

                {strategy.differentiators.length > 0 ? (
                  <Bullets
                    title="What sets you apart"
                    items={strategy.differentiators}
                    icon="check_circle"
                    tone="good"
                  />
                ) : null}

                {strategy.positioning ? (
                  <Passage title="Where to position yourself">{strategy.positioning}</Passage>
                ) : null}

                {strategy.teaming ? (
                  <Passage title="Teaming">{strategy.teaming}</Passage>
                ) : null}
              </Card>
            ) : null}

            {/* Risks */}
            {riskReport.risks.length > 0 ? (
              <Card>
                <CardHeading
                  title="Watch out for"
                  hint="Each of these could cost you the bid. The fix is listed underneath."
                  action={
                    riskReport.overall ? (
                      <Badge tone={severityTone(riskReport.overall)}>
                        {sentence(riskReport.overall)} risk overall
                      </Badge>
                    ) : undefined
                  }
                />
                <ul className="mt-5 space-y-3">
                  {riskReport.risks.map((r, i) => (
                    <RiskRow key={i} risk={r} />
                  ))}
                </ul>
              </Card>
            ) : null}

            {!reviewed ? (
              <Card padded={false}>
                <EmptyState
                  icon="auto_awesome"
                  title="Nothing analysed yet"
                  body="Run a review and we'll summarise the solicitation, pull out the requirements, flag the risks and suggest how to position your bid."
                  actions={
                    <Button tone="primary" loading={analyzing} onClick={analyze}>
                      Review this opportunity
                    </Button>
                  }
                />
              </Card>
            ) : null}

            <Card>
              <CardHeading
                title="Proposal"
                hint="Generate a first draft from the solicitation and your profile."
              />
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  icon="picture_as_pdf"
                  loading={downloading === "pdf"}
                  onClick={() => proposal("pdf")}
                >
                  Download as PDF
                </Button>
                <Button
                  icon="description"
                  loading={downloading === "docx"}
                  onClick={() => proposal("docx")}
                >
                  Download as Word
                </Button>
              </div>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-gap">
            <Card>
              <CardHeading title="The details" />
              <div className="mt-4">
                <DescList>
                  <DescRow label="Agency">{opp.agency_name || "—"}</DescRow>
                  <DescRow label="Closes">
                    {opp.due_date ? (
                      <>
                        <div>{formatDate(opp.due_date)}</div>
                        <div
                          className={cx(
                            "text-meta",
                            deadlineTone(opp.due_date) === "bad" ? "text-bad-ink" : "text-muted"
                          )}
                        >
                          {deadlineLabel(opp.due_date)}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </DescRow>
                  {value ? <DescRow label="Value">{value}</DescRow> : null}
                  {opp.location_city || opp.location_state ? (
                    <DescRow label="Where">
                      {[opp.location_city, opp.location_state].filter(Boolean).join(", ")}
                    </DescRow>
                  ) : null}
                  {opp.naics_code ? <DescRow label="Industry code">{opp.naics_code}</DescRow> : null}
                  {opp.set_aside || opp.set_aside_type ? (
                    <DescRow label="Set-aside">{opp.set_aside || opp.set_aside_type}</DescRow>
                  ) : null}
                  {opp.solicitation_number ? (
                    <DescRow label="Solicitation">
                      <span className="font-mono text-[12px]">{opp.solicitation_number}</span>
                    </DescRow>
                  ) : null}
                  {opp.source || opp.source_type ? (
                    <DescRow label="Source">{sentence(opp.source ?? opp.source_type)}</DescRow>
                  ) : null}
                </DescList>
              </div>
              {opp.source_url ? (
                <a
                  href={opp.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-base font-medium text-brand-600 hover:text-brand-700"
                >
                  View the original listing
                  <Icon name="open_in_new" className="text-[16px]" />
                </a>
              ) : null}
            </Card>

            {opp.fit_reasoning ? (
              <Card>
                <CardHeading title="Why we scored it this way" />
                <p className="mt-3 text-base leading-relaxed text-body">{opp.fit_reasoning}</p>
              </Card>
            ) : null}

            {opp.contact_name || opp.contact_email ? (
              <Card>
                <CardHeading title="Who to ask" />
                <div className="mt-4">
                  {opp.contact_name ? <p className="text-base text-ink">{opp.contact_name}</p> : null}
                  {opp.contact_email ? (
                    <a
                      href={`mailto:${opp.contact_email}`}
                      className="mt-0.5 block break-all text-base text-brand-600 hover:text-brand-700"
                    >
                      {opp.contact_email}
                    </a>
                  ) : null}
                </div>
              </Card>
            ) : null}

            {attachments.length > 0 ? (
              <Card>
                <CardHeading title="Documents" />
                <ul className="mt-4 space-y-2">
                  {attachments.map((a, i) => (
                    <li key={i}>
                      <a
                        href={a.url ?? a.link ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-base text-body hover:text-brand-700"
                      >
                        <Icon name="draft" className="text-[18px] text-faint" />
                        <span className="truncate">{a.name ?? a.filename ?? `File ${i + 1}`}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <Card>
              <CardHeading title="Go deeper" />
              <Button
                className="mt-4"
                block
                icon="neurology"
                onClick={() => navigate(`/war-room/${oppId}`)}
              >
                Size up the competition
              </Button>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "requirements" ? (
        <div className="max-w-3xl space-y-gap">
          {requirements.length > 0 ? (
            requirements.map((group) => (
              <Card key={group.key}>
                <CardHeading
                  title={group.label}
                  hint={group.hint || undefined}
                  action={<Badge>{group.items.length}</Badge>}
                />
                <ul className="mt-5 divide-y divide-line-soft">
                  {group.items.map((r, i) => (
                    <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <span
                        className={cx(
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          group.key === "mandatory" ? "bg-bad-solid" : "bg-brand-500"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-base leading-relaxed text-body">{r.text}</p>
                        {r.source || r.confidence ? (
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-meta text-faint">
                            {r.source ? <span>{clamp(r.source, 60)}</span> : null}
                            {r.confidence ? (
                              <span className="rounded-full bg-sunken px-1.5 py-0.5 text-[11px]">
                                {sentence(r.confidence)} confidence
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          ) : (
            <Card padded={false}>
              <EmptyState
                icon="fact_check"
                title="No requirements pulled out yet"
                body="Review the opportunity, or read the full solicitation line by line below."
                actions={
                  <Button tone="primary" loading={analyzing} onClick={analyze}>
                    Review this opportunity
                  </Button>
                }
              />
            </Card>
          )}

          {evaluation.factors.length > 0 ? (
            <Card>
              <CardHeading
                title="How they'll score you"
                hint={
                  evaluation.scoringMethod
                    ? sentence(evaluation.scoringMethod)
                    : "These are what the evaluators actually mark against."
                }
              />
              <ul className="mt-5 space-y-4">
                {evaluation.factors.map((f, i) => (
                  <li key={i} className="rounded-control border border-line bg-raised p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-h3">{f.name}</p>
                      {f.weightPct ? <Badge tone="brand">{f.weightPct}%</Badge> : null}
                    </div>
                    {f.description ? (
                      <p className="mt-2 text-base text-body">{f.description}</p>
                    ) : null}
                    {f.guidance ? (
                      <p className="mt-2 flex gap-2 text-meta text-muted">
                        <Icon name="star" className="mt-px text-[14px] text-brand-500" />
                        {f.guidance}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* Full shred */}
          {shredding ? (
            <Card>
              <div className="flex items-center gap-3">
                <Spinner className="text-brand-600" />
                <p className="text-base text-body">Reading every page…</p>
              </div>
            </Card>
          ) : shred?.error ? (
            <Alert tone="warn">{String(shred.error)}</Alert>
          ) : shredRequirements.length > 0 ? (
            <>
              {shredRequirements.map((group) => (
                <Card key={`shred-${group.key}`}>
                  <CardHeading
                    title={`${group.label} — full read`}
                    hint={group.hint || undefined}
                    action={<Badge>{group.items.length}</Badge>}
                  />
                  <ul className="mt-5 divide-y divide-line-soft">
                    {group.items.map((r, i) => (
                      <li key={i} className="py-3 text-base leading-relaxed text-body first:pt-0 last:pb-0">
                        {r.text}
                        {r.source ? (
                          <span className="ml-2 text-meta text-faint">{clamp(r.source, 40)}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
              {shredFactors.factors.length > 0 ? (
                <Card>
                  <CardHeading title="Evaluation factors — full read" />
                  <ul className="mt-4 space-y-2.5">
                    {shredFactors.factors.map((f, i) => (
                      <li key={i} className="flex gap-2.5 text-base text-body">
                        <Icon name="check_circle" className="mt-0.5 text-[16px] text-brand-500" />
                        <span>
                          {f.name}
                          {f.weightPct ? ` — ${f.weightPct}%` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </>
          ) : (
            <Card padded={false}>
              <EmptyState
                icon="fact_check"
                title="Read the whole solicitation"
                body="We'll go through it line by line and list everything you'd have to satisfy, with the page it came from."
                actions={
                  <Button tone="primary" onClick={runShred}>
                    Read it in full
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      ) : null}

      {tab === "compliance" ? (
        <div className="max-w-3xl space-y-gap">
          {checklist.length > 0 ? (
            <Card>
              <CardHeading
                title="Before you submit"
                hint="Paperwork and registrations the agency expects to already be in place."
                action={<Badge>{checklist.length}</Badge>}
              />
              <ul className="mt-5 space-y-3">
                {checklist.map((item, i) => (
                  <li key={i} className="rounded-control border border-line bg-raised p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-medium text-ink">{item.requirement}</p>
                      {item.urgency ? (
                        <Badge tone={severityTone(item.urgency)}>{severityLabel(item.urgency)}</Badge>
                      ) : null}
                    </div>
                    {item.action ? (
                      <p className="mt-2 flex gap-2 text-base text-body">
                        <Icon name="arrow_forward" className="mt-0.5 text-[16px] text-brand-500" />
                        {item.action}
                      </p>
                    ) : null}
                    {item.category ? (
                      <p className="mt-2 text-meta text-faint">{sentence(item.category)}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {matrixLoading ? (
            <Card>
              <div className="flex items-center gap-3">
                <Spinner className="text-brand-600" />
                <p className="text-base text-body">Checking each requirement against your profile…</p>
              </div>
            </Card>
          ) : matrix?.error ? (
            <Alert tone="warn">{String(matrix.error)}</Alert>
          ) : matrix ? (
            <>
              <div className="grid grid-cols-2 gap-gap">
                <Card>
                  <div className="text-meta text-muted">Requirements you meet</div>
                  <div className="mt-2 text-stat tnum text-ink">
                    {percentLabel(matrix.compliance_score)}
                  </div>
                </Card>
                <Card>
                  <div className="text-meta text-muted">Gaps to close</div>
                  <div className="mt-2 text-stat tnum text-ink">
                    {toStringList(matrix.critical_gaps).length}
                  </div>
                </Card>
              </div>

              {matrix.summary ? (
                <Card>
                  <p className="text-base leading-relaxed text-body">{matrix.summary}</p>
                </Card>
              ) : null}

              {toStringList(matrix.critical_gaps).length > 0 ? (
                <Card>
                  <CardHeading
                    title="What's missing"
                    hint="Close these before you submit, or say how you'll close them."
                  />
                  <ul className="mt-4 space-y-2.5">
                    {toStringList(matrix.critical_gaps).map((g, i) => (
                      <li key={i} className="flex gap-2.5 text-base text-body">
                        <Icon name="warning" className="mt-0.5 text-[16px] text-bad-solid" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {Array.isArray(matrix.matrix) && matrix.matrix.length > 0 ? (
                <Card padded={false} className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left">
                      <thead>
                        <tr className="border-b border-line bg-raised">
                          <th className="px-card py-3 text-caps uppercase text-muted">Requirement</th>
                          <th className="whitespace-nowrap px-card py-3 text-caps uppercase text-muted">
                            Can we?
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-soft">
                        {matrix.matrix.map((row: AnyObj, i: number) => {
                          const met = String(row.status ?? row.compliant ?? "").toLowerCase();
                          const good =
                            met === "true" || met.includes("yes") || met.includes("meet");
                          return (
                            <tr key={i}>
                              <td className="px-card py-3.5 text-base text-body">
                                {row.requirement ?? row.text ?? "—"}
                              </td>
                              <td className="px-card py-3.5">
                                <Badge tone={good ? "good" : "warn"}>
                                  {good ? "Yes" : sentence(row.status ?? "Needs work")}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : null}
            </>
          ) : (
            <Card padded={false}>
              <EmptyState
                icon="fact_check"
                title="Check it against your company"
                body="We'll take each requirement and tell you whether your profile already covers it."
                actions={
                  <Button tone="primary" onClick={runMatrix}>
                    Run the check
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      ) : null}
    </Page>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────── */

function RiskRow({ risk }: { risk: Risk }) {
  return (
    <li className="rounded-control border border-line bg-raised p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-h3 text-ink">{risk.title}</p>
        <div className="flex shrink-0 items-center gap-2">
          {risk.category ? <Badge>{sentence(risk.category)}</Badge> : null}
          {risk.severity ? (
            <Badge tone={severityTone(risk.severity)}>{severityLabel(risk.severity)}</Badge>
          ) : null}
        </div>
      </div>

      {risk.description ? (
        <p className="mt-2 text-base leading-relaxed text-body">{risk.description}</p>
      ) : null}

      {risk.mitigation ? (
        <div className="mt-3 flex gap-2.5 border-t border-line-soft pt-3">
          <Icon name="check_circle" className="mt-0.5 text-[16px] text-good-solid" />
          <div>
            <p className="text-meta font-medium text-body">What to do about it</p>
            <p className="mt-0.5 text-base leading-relaxed text-muted">{risk.mitigation}</p>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function Bullets({
  title,
  items,
  icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: string;
  tone: "brand" | "good";
}) {
  return (
    <div className="mt-6">
      <h3 className="text-h3">{title}</h3>
      <ul className="mt-2.5 space-y-2.5">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-base leading-relaxed text-body">
            <Icon
              name={icon}
              className={cx(
                "mt-0.5 text-[16px]",
                tone === "good" ? "text-good-solid" : "text-brand-500"
              )}
            />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Passage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-h3">{title}</h3>
      <p className="mt-2 text-base leading-relaxed text-body">{children}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-meta text-muted">{label}</div>
      <div className="mt-0.5 text-base text-ink">{value}</div>
    </div>
  );
}
