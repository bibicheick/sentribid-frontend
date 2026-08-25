import { useEffect, useState } from "react";
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
      setShred(r.data);
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
      <Page
        title="Loading"
        summary="Fetching this opportunity."
        back={{ to: "/find-work", label: "Back to Find Work" }}
      >
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
  const requirements: string[] = toArray(opp.ai_requirements);
  const risks: string[] = toArray(opp.ai_risk_flags);
  const attachments: AnyObj[] = Array.isArray(opp.attachments) ? opp.attachments : [];

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
            {opp.ai_summary ? "Review again" : "Review this"}
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
          { value: "requirements", label: "Requirements" },
          { value: "compliance", label: "Can we meet it?" },
        ]}
        className="mb-gap"
      />

      {tab === "overview" ? (
        <div className="grid grid-cols-1 gap-gap lg:grid-cols-3">
          <div className="space-y-gap lg:col-span-2">
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
                    {rec ?? (score === null ? "Not reviewed yet" : "No recommendation yet")}
                  </p>
                  <p className="mt-1 text-base text-muted">
                    {opp.ai_summary
                      ? clamp(opp.ai_summary, 220)
                      : "Run a review and we'll read the solicitation and score it against your profile."}
                  </p>
                </div>
              </div>
            </Card>

            {opp.ai_bid_strategy ? (
              <Card>
                <CardHeading title="How you'd win it" />
                <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-body">
                  {opp.ai_bid_strategy}
                </p>
              </Card>
            ) : null}

            {risks.length > 0 ? (
              <Card>
                <CardHeading title="Watch out for" />
                <ul className="mt-4 space-y-2.5">
                  {risks.map((r, i) => (
                    <li key={i} className="flex gap-2.5 text-base text-body">
                      <Icon name="warning" className="mt-0.5 text-[16px] text-warn-solid" />
                      {r}
                    </li>
                  ))}
                </ul>
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
                  {opp.naics_code ? (
                    <DescRow label="Industry code">{opp.naics_code}</DescRow>
                  ) : null}
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
            </Card>

            {opp.contact_name || opp.contact_email ? (
              <Card>
                <CardHeading title="Who to ask" />
                <div className="mt-4">
                  {opp.contact_name ? (
                    <p className="text-base text-ink">{opp.contact_name}</p>
                  ) : null}
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
        <div className="max-w-3xl">
          {requirements.length > 0 && !shred ? (
            <Card className="mb-gap">
              <CardHeading
                title="What the agency asked for"
                hint="Pulled out of the solicitation during the review."
              />
              <ul className="mt-5 space-y-3">
                {requirements.map((r, i) => (
                  <li key={i} className="flex gap-3 text-base text-body">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {shredding ? (
            <Card>
              <div className="flex items-center gap-3">
                <Spinner className="text-brand-600" />
                <p className="text-base text-body">Reading every page…</p>
              </div>
            </Card>
          ) : shred?.error ? (
            <Alert tone="warn">{String(shred.error)}</Alert>
          ) : shred ? (
            <>
              <p className="mb-4 text-meta text-muted">
                {shred.total_requirements_count ?? toArray(shred.requirements).length} requirements
                found
              </p>
              <Card>
                <ul className="divide-y divide-line-soft">
                  {toArray(shred.requirements).map((r: any, i: number) => (
                    <li key={i} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-base text-body">
                        {typeof r === "string" ? r : r.requirement ?? r.text ?? JSON.stringify(r)}
                      </p>
                      {typeof r === "object" && (r.section || r.page) ? (
                        <p className="mt-0.5 text-meta text-faint">
                          {[r.section, r.page ? `p.${r.page}` : null].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Card>

              {toArray(shred.evaluation_factors).length > 0 ? (
                <Card className="mt-gap">
                  <CardHeading
                    title="How they'll score you"
                    hint="These are the things the evaluators actually mark against."
                  />
                  <ul className="mt-4 space-y-2.5">
                    {toArray(shred.evaluation_factors).map((f: any, i: number) => (
                      <li key={i} className="flex gap-2.5 text-base text-body">
                        <Icon name="check_circle" className="mt-0.5 text-[16px] text-brand-500" />
                        {typeof f === "string" ? f : f.factor ?? JSON.stringify(f)}
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
                title="Pull out every requirement"
                body="We'll go through the solicitation line by line and list everything you'd have to satisfy."
                actions={
                  <Button tone="primary" onClick={runShred}>
                    Read the solicitation
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      ) : null}

      {tab === "compliance" ? (
        <div className="max-w-3xl">
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
              <div className="mb-gap grid grid-cols-2 gap-gap">
                <Card>
                  <div className="text-meta text-muted">Requirements you meet</div>
                  <div className="mt-2 text-stat tnum text-ink">
                    {percentLabel(matrix.compliance_score)}
                  </div>
                </Card>
                <Card>
                  <div className="text-meta text-muted">Gaps to close</div>
                  <div className="mt-2 text-stat tnum text-ink">
                    {toArray(matrix.critical_gaps).length}
                  </div>
                </Card>
              </div>

              {matrix.summary ? (
                <Card className="mb-gap">
                  <p className="text-base leading-relaxed text-body">{matrix.summary}</p>
                </Card>
              ) : null}

              {toArray(matrix.critical_gaps).length > 0 ? (
                <Card className="mb-gap">
                  <CardHeading title="What's missing" />
                  <ul className="mt-4 space-y-2.5">
                    {toArray(matrix.critical_gaps).map((g: any, i: number) => (
                      <li key={i} className="flex gap-2.5 text-base text-body">
                        <Icon name="warning" className="mt-0.5 text-[16px] text-bad-solid" />
                        {typeof g === "string" ? g : g.gap ?? JSON.stringify(g)}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {toArray(matrix.matrix).length > 0 ? (
                <Card padded={false} className="overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-line bg-raised">
                        <th className="px-card py-3 text-caps uppercase text-muted">Requirement</th>
                        <th className="px-card py-3 text-caps uppercase text-muted">Can we?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {toArray(matrix.matrix).map((row: any, i: number) => {
                        const met = String(row.status ?? row.compliant ?? "").toLowerCase();
                        const good = met === "true" || met.includes("yes") || met.includes("meet");
                        return (
                          <tr key={i}>
                            <td className="px-card py-3 text-base text-body">
                              {row.requirement ?? row.text ?? "—"}
                            </td>
                            <td className="px-card py-3">
                              <Badge tone={good ? "good" : "warn"}>
                                {good ? "Yes" : sentence(row.status ?? "Needs work")}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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

function toArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fall through to line splitting */
      }
    }
    return trimmed
      .split(/\n+/)
      .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter(Boolean);
  }
  return [];
}
