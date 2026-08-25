import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import Page from "@/components/Page";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  Input,
  LinkButton,
  Select,
  SkeletonRows,
  Tabs,
  cx,
} from "@/ui/kit";
import {
  clamp,
  compactMoney,
  deadlineLabel,
  deadlineTone,
  initials,
  percentLabel,
  recommendationLabel,
  scoreTone,
  shortDate,
  toPercent,
} from "@/lib/format";

type Tab = "search" | "matched" | "partners";
type Opp = Record<string, any>;
type Award = Record<string, any>;
type Pitch = Record<string, any>;

const TABS = [
  { value: "search" as const, label: "Search" },
  { value: "matched" as const, label: "Matched for me" },
  { value: "partners" as const, label: "Partners" },
];

const SUMMARIES: Record<Tab, string> = {
  search:
    "Search every open federal contract on SAM.gov. Save the ones worth chasing and they move into your pipeline.",
  matched:
    "Contracts SentriBiD picked out for you, based on the industry codes and locations in your company profile.",
  partners:
    "Companies that just won prime contracts in your industry. Reach out and offer to work under them.",
};

export default function FindWorkPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = raw === "matched" || raw === "partners" ? raw : "search";

  function setTab(next: Tab) {
    const p = new URLSearchParams(params);
    if (next === "search") p.delete("tab");
    else p.set("tab", next);
    setParams(p, { replace: true });
  }

  return (
    <Page title="Find Work" summary={SUMMARIES[tab]}>
      <Tabs value={tab} onChange={setTab} options={TABS} className="mb-gap" />
      {tab === "partners" ? <PartnersTab /> : <ContractsTab key={tab} matched={tab === "matched"} />}
    </Page>
  );
}

/* ── Search + Matched ─────────────────────────────────────────────────── */

function ContractsTab({ matched }: { matched: boolean }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [naics, setNaics] = useState("");
  const [setAside, setSetAside] = useState("");
  const [agency, setAgency] = useState("");
  const [results, setResults] = useState<Opp[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!matched) return;
    api
      .get("/profile")
      .then((r) => setProfile(r.data || {}))
      .catch(() => setProfile({}));
  }, [matched]);

  // The "Matched for me" tab has nothing to type — run it as soon as it opens.
  useEffect(() => {
    if (matched) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched]);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      let data: any;
      if (matched) {
        data = (await api.post("/discovery/sam/auto-match", { keyword, naics, limit: 15 })).data;
      } else {
        const p = new URLSearchParams();
        if (keyword) p.append("keyword", keyword);
        if (naics) p.append("naics", naics);
        if (setAside) p.append("set_aside", setAside);
        if (agency) p.append("agency", agency);
        p.append("limit", "25");
        data = (await api.get(`/discovery/sam/search?${p}`)).data;
      }
      if (data?.error) {
        setErr(String(data.error));
        setResults([]);
      } else {
        setResults(Array.isArray(data?.opportunities) ? data.opportunities : []);
        setTotal(Number(data?.total) || 0);
      }
    } catch (e: any) {
      setErr(
        e?.response?.data?.detail ||
          "The search didn't come back. Check that your SAM.gov key is saved in Settings."
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function save(opp: Opp) {
    const key = String(opp.sam_notice_id ?? opp.solicitation_number ?? opp.title);
    setSaving(key);
    try {
      const r = await api.post("/discovery/sam/import", { opportunity: opp });
      navigate(`/opportunities/${r.data.id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "We couldn't save that one. Try again in a moment.");
    } finally {
      setSaving(null);
    }
  }

  const naicsList: string[] = Array.isArray(profile?.naics_codes)
    ? profile!.naics_codes
    : String(profile?.naics_codes ?? "")
        .split(/[,\s]+/)
        .filter(Boolean);

  return (
    <>
      {matched ? (
        <Card className="mb-gap flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Icon name="auto_awesome" className="mt-0.5 text-[20px] text-brand-600" />
            <p className="text-base text-body">
              {naicsList.length > 0 ? (
                <>
                  Matched against your profile — {naicsList.length}{" "}
                  {naicsList.length === 1 ? "industry code" : "industry codes"}
                  {profile?.set_aside_eligible ? ", small business set-aside" : ""}.
                </>
              ) : (
                <>
                  Your profile has no industry codes yet, so matching is running blind. Add a few and
                  results get sharper.
                </>
              )}
            </p>
          </div>
          <LinkButton to="/settings" className="shrink-0">
            Edit profile
          </LinkButton>
        </Card>
      ) : (
        <Card className="mb-gap">
          <form onSubmit={run} className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <Field label="What are you looking for?" className="flex-1">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. IT support, janitorial, cybersecurity"
              />
            </Field>
            <Field label="Industry code" className="lg:w-40">
              <Input
                value={naics}
                onChange={(e) => setNaics(e.target.value)}
                placeholder="Optional"
                inputMode="numeric"
              />
            </Field>
            <Field label="Set-aside" className="lg:w-44">
              <Select value={setAside} onChange={(e) => setSetAside(e.target.value)}>
                <option value="">Any</option>
                <option value="SBA">Small business</option>
                <option value="WOSB">Woman-owned</option>
                <option value="SDVOSBC">Veteran-owned</option>
                <option value="8A">8(a)</option>
                <option value="HZC">HUBZone</option>
              </Select>
            </Field>
            <Field label="Agency" className="lg:w-48">
              <Input
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="Any agency"
              />
            </Field>
            <Button type="submit" tone="primary" size="lg" loading={loading} icon="search">
              Search
            </Button>
          </form>
        </Card>
      )}

      {err ? (
        <Alert tone="warn" className="mb-gap" onDismiss={() => setErr(null)}>
          {err}
        </Alert>
      ) : null}

      {loading ? (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      ) : results === null ? (
        <Card padded={false}>
          <EmptyState
            icon="search"
            title="Nothing searched yet"
            body="Describe the kind of work you do and we'll pull matching contracts from SAM.gov."
          />
        </Card>
      ) : results.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon="search_off"
            title="No contracts matched"
            body="Try a broader keyword, or drop the agency and set-aside filters."
          />
        </Card>
      ) : (
        <>
          <p className="mb-4 text-meta text-muted">
            {results.length} shown{total > results.length ? ` of ${total} found` : ""}
          </p>
          <div className="flex flex-col gap-4">
            {results.map((o, i) => (
              <ContractCard
                key={o.sam_notice_id ?? `${o.solicitation_number}-${i}`}
                opp={o}
                showReasons={matched}
                saving={
                  saving === String(o.sam_notice_id ?? o.solicitation_number ?? o.title)
                }
                onSave={() => save(o)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ContractCard({
  opp,
  showReasons,
  saving,
  onSave,
}: {
  opp: Opp;
  showReasons?: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const score = toPercent(opp.fit_score);
  const rec = recommendationLabel(opp.recommendation);
  const reasons: string[] = Array.isArray(opp.match_reasons) ? opp.match_reasons : [];
  const gaps: string[] = Array.isArray(opp.gaps) ? opp.gaps : [];
  const tone = deadlineTone(opp.due_date);

  return (
    <Card className="transition-shadow hover:shadow-lift">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-h2">{clamp(opp.title || "Untitled contract", 90)}</h3>

          <p className="mt-1.5 text-meta text-muted">
            {[
              opp.agency_name,
              opp.type,
              opp.posted_date ? `Posted ${shortDate(opp.posted_date)}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "No agency listed"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {opp.naics_code ? <Badge>NAICS {opp.naics_code}</Badge> : null}
            {opp.set_aside_description ? (
              <Badge tone="brand">{clamp(opp.set_aside_description, 40)}</Badge>
            ) : null}
            {opp.solicitation_number ? (
              <span className="inline-flex items-center rounded-full bg-sunken px-2 py-0.5 font-mono text-[11px] text-muted">
                {opp.solicitation_number}
              </span>
            ) : null}
          </div>

          {showReasons && reasons.length > 0 ? (
            <div className="mt-4 rounded-control border border-line-soft bg-raised p-3">
              <p className="text-meta font-medium text-body">Why this matches you</p>
              <ul className="mt-1.5 space-y-1">
                {reasons.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex gap-2 text-meta text-muted">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                    {r}
                  </li>
                ))}
              </ul>
              {gaps.length > 0 ? (
                <p className="mt-2.5 flex items-start gap-1.5 text-meta text-warn-ink">
                  <Icon name="warning" className="mt-px text-[14px]" />
                  {gaps.slice(0, 2).join(" · ")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-4 lg:flex-col lg:items-end lg:justify-start">
          <div className="flex flex-col gap-1 lg:items-end">
            {score !== null ? (
              <Badge tone={scoreTone(score)}>{percentLabel(score)} win chance</Badge>
            ) : null}
            {rec ? <span className="text-meta text-muted">{rec}</span> : null}
            <span
              className={cx(
                "text-meta",
                tone === "bad" ? "text-bad-ink" : tone === "warn" ? "text-warn-ink" : "text-muted"
              )}
            >
              {deadlineLabel(opp.due_date)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {opp.description_url ? (
              <a
                href={opp.description_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-white px-3 text-base font-medium text-body shadow-card transition-colors hover:bg-raised"
              >
                Details
                <Icon name="open_in_new" className="text-[16px]" />
              </a>
            ) : null}
            <Button tone="primary" loading={saving} onClick={onSave}>
              Save to pipeline
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Partners ─────────────────────────────────────────────────────────── */

function PartnersTab() {
  const [days, setDays] = useState(90);
  const [awards, setAwards] = useState<Award[] | null>(null);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openPitch, setOpenPitch] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const r = await api.get(`/discovery/subcontract-scout?days=${days}&limit=15`);
      setAwards(Array.isArray(r.data?.awards) ? r.data.awards : []);
      setPitches(Array.isArray(r.data?.pitches) ? r.data.pitches : []);
    } catch (e: any) {
      setErr(
        e?.response?.data?.detail ||
          "We couldn't run this. Add at least one industry code to your profile first."
      );
      setAwards([]);
    } finally {
      setLoading(false);
    }
  }

  function pitchFor(recipient: string): Pitch | undefined {
    return pitches.find((p) => p.award_recipient === recipient);
  }

  async function copyPitch(p: Pitch, key: string) {
    const text = `Subject: ${p.pitch_subject ?? ""}\n\n${p.pitch_body ?? ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setErr("Your browser blocked the copy. Select the text and copy it manually.");
    }
  }

  return (
    <>
      <Card className="mb-gap flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-h2">Team up on bigger contracts</h2>
          <p className="mt-1 text-base text-muted">
            Some contracts are too large to win alone. These companies just won one in your industry
            — being their subcontractor is often the easier way in.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="How far back to look"
            className="w-40"
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
          </Select>
          <Button tone="primary" onClick={run} loading={loading}>
            Find partners
          </Button>
        </div>
      </Card>

      {err ? (
        <Alert tone="warn" className="mb-gap" onDismiss={() => setErr(null)}>
          {err}
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-gap md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <SkeletonRows rows={2} />
            </Card>
          ))}
        </div>
      ) : awards === null ? (
        <Card padded={false}>
          <EmptyState
            icon="handshake"
            title="Find your next teaming partner"
            body="We'll scan recent federal awards in your industry codes and draft an intro email for each one."
            actions={
              <Button tone="primary" onClick={run}>
                Find partners
              </Button>
            }
          />
        </Card>
      ) : awards.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon="handshake"
            title="No recent awards in your codes"
            body="Try a longer look-back window, or add more industry codes to your profile."
            actions={<LinkButton to="/settings">Edit profile</LinkButton>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-gap md:grid-cols-2">
          {awards.map((a, i) => {
            const key = String(a.recipient ?? i);
            const pitch = pitchFor(a.recipient);
            const isOpen = openPitch === key;
            return (
              <Card key={key} padded={false} className="flex flex-col">
                <div className="flex-1 p-card">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-meta font-semibold text-brand-700">
                      {initials(a.recipient, "?")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-h3">{a.recipient || "Unknown company"}</h3>
                      <p className="mt-0.5 text-meta text-muted">
                        {compactMoney(a.amount)} · {a.agency || "Agency not listed"}
                        {a.start_date ? ` · ${shortDate(a.start_date)}` : ""}
                      </p>
                    </div>
                  </div>

                  {a.description || a.title ? (
                    <p className="mt-3 text-base text-body">
                      {clamp(a.description || a.title, 130)}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.naics ? <Badge>NAICS {a.naics}</Badge> : null}
                    {a.place_of_performance ? <Badge>{a.place_of_performance}</Badge> : null}
                  </div>

                  {isOpen && pitch ? (
                    <div className="mt-4 rounded-control border border-line bg-raised p-4">
                      <p className="text-meta font-medium text-body">Subject</p>
                      <p className="mt-1 text-base text-ink">{pitch.pitch_subject}</p>
                      <p className="mt-3 text-meta font-medium text-body">Message</p>
                      <p className="mt-1 whitespace-pre-wrap text-base text-body">
                        {pitch.pitch_body}
                      </p>
                      {Array.isArray(pitch.key_selling_points) &&
                      pitch.key_selling_points.length > 0 ? (
                        <>
                          <p className="mt-3 text-meta font-medium text-body">Lead with</p>
                          <ul className="mt-1 space-y-1">
                            {pitch.key_selling_points.map((s: string, j: number) => (
                              <li key={j} className="flex gap-2 text-meta text-muted">
                                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 border-t border-line-soft px-card py-3">
                  {pitch ? (
                    <>
                      <Button size="sm" onClick={() => setOpenPitch(isOpen ? null : key)}>
                        {isOpen ? "Hide draft" : "Read intro email"}
                      </Button>
                      <Button
                        size="sm"
                        tone="ghost"
                        icon={copied === key ? "check" : "content_copy"}
                        onClick={() => copyPitch(pitch, key)}
                      >
                        {copied === key ? "Copied" : "Copy"}
                      </Button>
                    </>
                  ) : (
                    <span className="text-meta text-muted">No draft email for this one.</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
