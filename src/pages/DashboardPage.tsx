import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import Page from "@/components/Page";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeading,
  EmptyState,
  Icon,
  LinkButton,
  SkeletonRows,
  SkeletonTiles,
  StatTile,
  cx,
} from "@/ui/kit";
import {
  clamp,
  daysUntil,
  deadlineLabel,
  deadlineTone,
  percentLabel,
  scoreTone,
  shortDate,
  toPercent,
} from "@/lib/format";

type Opp = Record<string, any>;
type Bid = Record<string, any>;

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function oppScore(o: Opp): number | null {
  return toPercent(o.fit_score ?? o.ai_confidence_score);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [opps, setOpps] = useState<Opp[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [oppsRes, bidsRes, meRes] = await Promise.allSettled([
        api.get("/opportunities"),
        api.get("/bids", { params: { limit: 100, offset: 0 } }),
        api.get("/auth/me"),
      ]);
      if (!alive) return;

      if (oppsRes.status === "fulfilled") setOpps(asArray(oppsRes.value.data));
      if (bidsRes.status === "fulfilled") setBids(asArray(bidsRes.value.data));
      if (meRes.status === "fulfilled") {
        const raw = meRes.value.data?.full_name || meRes.value.data?.username || "";
        setName(String(raw).split(" ")[0] || "");
      }
      if (oppsRes.status === "rejected" && bidsRes.status === "rejected") {
        setErr("We couldn't reach the server. Your work is safe — try refreshing in a moment.");
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const open = opps.filter((o) => String(o.status ?? "").toLowerCase() !== "converted");
    const addedThisWeek = opps.filter((o) => {
      const d = daysUntil(o.created_at);
      return d !== null && d >= -7;
    }).length;

    const inProgress = bids.filter((b) =>
      ["draft", "pending", "in_review"].includes(String(b.status ?? "").toLowerCase())
    );
    const awaiting = bids.filter((b) => String(b.status ?? "").toLowerCase() === "draft");
    const approved = bids.filter((b) => String(b.status ?? "").toLowerCase() === "approved");

    const closingSoon = [...opps, ...bids].filter((r) => {
      const d = daysUntil(r.due_date ?? r.deadline_date);
      return d !== null && d >= 0 && d <= 7;
    });

    return { open, addedThisWeek, inProgress, awaiting, approved, closingSoon };
  }, [opps, bids]);

  const recommended = useMemo(
    () =>
      [...opps]
        .filter((o) => String(o.status ?? "").toLowerCase() !== "converted")
        .sort((a, b) => (oppScore(b) ?? -1) - (oppScore(a) ?? -1))
        .slice(0, 3),
    [opps]
  );

  const deadlines = useMemo(() => {
    const merged: Record<string, any>[] = [
      ...opps.map((o) => ({ ...o, _kind: "opp" })),
      ...bids.map((b) => ({ ...b, _kind: "bid" })),
    ];
    return merged
        .map((r) => ({
          id: r.id,
          kind: r._kind as "opp" | "bid",
          title: r.title || r.contract_title || "Untitled",
          date: r.due_date ?? r.deadline_date,
          days: daysUntil(r.due_date ?? r.deadline_date),
        }))
        .filter((r) => r.days !== null && r.days >= 0)
        .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
        // An opportunity and the bid it became share a title — show it once,
        // preferring the bid, which is the thing you actually have to finish.
        .filter((r, _i, list) => {
          const key = r.title.trim().toLowerCase();
          const twin = list.find((x) => x.title.trim().toLowerCase() === key && x.kind === "bid");
          return !twin || twin === r;
        })
        .slice(0, 4);
  }, [opps, bids]);

  return (
    <Page
      title={`${greeting()}${name ? `, ${name}` : ""}`}
      summary="A running view of what's open, what's due, and what's waiting on a decision from you."
      actions={
        <>
          <LinkButton to="/find-work" icon="travel_explore">
            Find contracts
          </LinkButton>
          <LinkButton to="/bids/new" tone="primary" icon="upload_file">
            Upload an RFP
          </LinkButton>
        </>
      }
    >
      {err ? <Alert className="mb-gap">{err}</Alert> : null}

      {loading ? (
        <SkeletonTiles />
      ) : (
        <div className="grid grid-cols-2 gap-gap lg:grid-cols-4">
          <StatTile
            label="Open opportunities"
            value={stats.open.length}
            hint={
              stats.addedThisWeek > 0
                ? `${stats.addedThisWeek} added this week`
                : "Nothing new this week"
            }
          />
          <StatTile
            label="Bids in progress"
            value={stats.inProgress.length}
            hint={
              stats.closingSoon.length > 0
                ? `${stats.closingSoon.length} closing within 7 days`
                : "None closing this week"
            }
          />
          <StatTile
            label="Waiting on your approval"
            value={stats.awaiting.length}
            hint={stats.awaiting.length > 0 ? "Review them" : "You're all caught up"}
            hintTo={stats.awaiting.length > 0 ? "/bids?status=draft" : undefined}
          />
          <StatTile
            label="Approved"
            value={stats.approved.length}
            hint="Priced and signed off"
            tone={stats.approved.length > 0 ? "good" : undefined}
          />
        </div>
      )}

      <div className="mt-gap grid grid-cols-1 gap-gap lg:grid-cols-3">
        {/* Recommended */}
        <Card className="self-start lg:col-span-2">
          <CardHeading
            title="Worth a look"
            hint="Open contracts, ranked by how well they fit your company profile."
          />

          <div className="mt-5">
            {loading ? (
              <SkeletonRows rows={3} />
            ) : recommended.length === 0 ? (
              <EmptyState
                icon="search"
                title="No opportunities yet"
                body="Search SAM.gov or upload an RFP and it'll show up here."
                actions={
                  <>
                    <LinkButton to="/find-work" tone="primary">
                      Search contracts
                    </LinkButton>
                    <LinkButton to="/bids/new">Upload an RFP</LinkButton>
                  </>
                }
                className="py-10"
              />
            ) : (
              <ul className="divide-y divide-line-soft">
                {recommended.map((o) => {
                  const score = oppScore(o);
                  return (
                    <li
                      key={o.id}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/opportunities/${o.id}`}
                          className="text-h3 text-ink transition-colors hover:text-brand-700"
                        >
                          {clamp(o.title || "Untitled opportunity", 70)}
                        </Link>
                        <p className="mt-1 text-meta text-muted">
                          {o.agency_name || "Agency not listed"}
                          {o.naics_code ? ` · NAICS ${o.naics_code}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 sm:justify-end">
                        <div className="flex flex-col items-start gap-1 sm:items-end">
                          {score !== null ? (
                            <Badge tone={scoreTone(score)}>{percentLabel(score)} win chance</Badge>
                          ) : (
                            <Badge>Not scored yet</Badge>
                          )}
                          <span
                            className={cx(
                              "text-meta",
                              deadlineTone(o.due_date) === "bad"
                                ? "text-bad-ink"
                                : deadlineTone(o.due_date) === "warn"
                                ? "text-warn-ink"
                                : "text-muted"
                            )}
                          >
                            {deadlineLabel(o.due_date)}
                          </span>
                        </div>
                        <Button size="sm" onClick={() => navigate(`/opportunities/${o.id}`)}>
                          View
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {recommended.length > 0 ? (
            <div className="mt-5 border-t border-line-soft pt-4">
              <Link
                to="/find-work"
                className="inline-flex items-center gap-1 text-base font-medium text-brand-600 hover:text-brand-700"
              >
                See all opportunities
                <Icon name="arrow_forward" className="text-[16px]" />
              </Link>
            </div>
          ) : null}
        </Card>

        {/* Right rail */}
        <div className="flex flex-col gap-gap">
          <Card>
            <CardHeading title="Deadlines" />
            <div className="mt-4">
              {loading ? (
                <SkeletonRows rows={3} />
              ) : deadlines.length === 0 ? (
                <p className="text-base text-muted">Nothing with a date on it right now.</p>
              ) : (
                <ul className="space-y-3.5">
                  {deadlines.map((d) => {
                    const tone = deadlineTone(d.date);
                    return (
                      <li key={`${d.kind}-${d.id}`} className="flex items-center justify-between gap-3">
                        <Link
                          to={d.kind === "bid" ? `/bids/${d.id}` : `/opportunities/${d.id}`}
                          className="flex min-w-0 items-center gap-2.5 text-base text-ink transition-colors hover:text-brand-700"
                        >
                          <span
                            className={cx(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              tone === "bad"
                                ? "bg-bad-solid"
                                : tone === "warn"
                                ? "bg-warn-solid"
                                : "bg-neutral-line"
                            )}
                          />
                          <span className="truncate">{clamp(d.title, 34)}</span>
                        </Link>
                        <span
                          className={cx(
                            "shrink-0 text-meta tnum",
                            tone === "bad" ? "text-bad-ink" : "text-muted"
                          )}
                        >
                          {shortDate(d.date)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeading title="Quick actions" />
            <div className="mt-4 flex flex-col gap-2.5">
              <LinkButton to="/bids/new" icon="upload_file" block className="justify-start">
                Upload an RFP
              </LinkButton>
              <LinkButton to="/find-work" icon="search" block className="justify-start">
                Search contracts
              </LinkButton>
              <LinkButton
                to="/find-work?tab=partners"
                icon="handshake"
                block
                className="justify-start"
              >
                Find a teaming partner
              </LinkButton>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
