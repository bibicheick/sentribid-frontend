import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import Page from "@/components/Page";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  LinkButton,
  Meter,
  SearchInput,
  Select,
  SkeletonRows,
  StatTile,
  cx,
} from "@/ui/kit";
import {
  clamp,
  deadlineLabel,
  deadlineTone,
  formatDate,
  percentLabel,
  scoreTone,
  statusLabel,
  statusTone,
  toPercent,
} from "@/lib/format";

type Bid = Record<string, any>;
type Opp = Record<string, any>;

type Row = {
  key: string;
  id: number;
  kind: "bid" | "opportunity";
  code: string;
  title: string;
  agency: string;
  status: string;
  due: string | null;
  score: number | null;
  createdAt: string | null;
  convertedBidId?: number | null;
};

export default function BidsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [bids, setBids] = useState<Bid[]>([]);
  const [opps, setOpps] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [converting, setConverting] = useState<number | null>(null);

  const q = params.get("q") ?? "";
  const kind = params.get("kind") ?? "all";
  const status = params.get("status") ?? "all";
  const sort = params.get("sort") ?? "recent";

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(params);
    if (!value || value === "all" || value === "") p.delete(key);
    else p.set(key, value);
    setParams(p, { replace: true });
  }

  async function load() {
    setLoading(true);
    const [b, o] = await Promise.allSettled([
      api.get("/bids", { params: { limit: 100, offset: 0 } }),
      api.get("/opportunities"),
    ]);
    if (b.status === "fulfilled") setBids(Array.isArray(b.value.data) ? b.value.data : []);
    if (o.status === "fulfilled") setOpps(Array.isArray(o.value.data) ? o.value.data : []);
    if (b.status === "rejected" && o.status === "rejected") {
      setErr("We couldn't reach the server. Nothing has been lost — try refreshing.");
    } else {
      setErr(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const rows: Row[] = useMemo(() => {
    const bidRows: Row[] = bids.map((b) => ({
      key: `bid-${b.id}`,
      id: b.id,
      kind: "bid",
      code: b.bid_code ?? "",
      title: b.contract_title ?? "Untitled bid",
      agency: b.agency_name ?? "",
      status: b.status ?? "draft",
      due: b.deadline_date ?? null,
      score: null,
      createdAt: b.created_at ?? null,
    }));

    const oppRows: Row[] = opps.map((o) => ({
      key: `opp-${o.id}`,
      id: o.id,
      kind: "opportunity",
      code: o.opp_code ?? "",
      title: o.title ?? "Untitled opportunity",
      agency: o.agency_name ?? "",
      status: o.status ?? "new",
      due: o.due_date ?? null,
      score: toPercent(o.fit_score ?? o.ai_confidence_score),
      createdAt: o.created_at ?? null,
      convertedBidId: o.converted_bid_id ?? null,
    }));

    return [...bidRows, ...oppRows];
  }, [bids, opps]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = rows;

    if (kind !== "all") out = out.filter((r) => r.kind === kind);
    if (status !== "all") out = out.filter((r) => String(r.status).toLowerCase() === status);
    if (term) {
      out = out.filter((r) =>
        [r.title, r.agency, r.code].some((v) => String(v).toLowerCase().includes(term))
      );
    }

    const byDue = (a: Row, b: Row) => {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due).getTime() - new Date(b.due).getTime();
    };
    const byRecent = (a: Row, b: Row) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();

    return [...out].sort(sort === "due" ? byDue : byRecent);
  }, [rows, q, kind, status, sort]);

  const stats = useMemo(() => {
    const inProgress = bids.filter((b) =>
      ["draft", "pending", "in_review"].includes(String(b.status ?? "").toLowerCase())
    ).length;
    const approved = bids.filter((b) => String(b.status ?? "").toLowerCase() === "approved").length;
    const open = opps.filter((o) => String(o.status ?? "").toLowerCase() !== "converted").length;
    return { inProgress, approved, open };
  }, [bids, opps]);

  async function convert(oppId: number) {
    setConverting(oppId);
    try {
      const r = await api.post(`/opportunities/${oppId}/convert`);
      if (r.data?.bid_id) navigate(`/bids/${r.data.bid_id}`);
      else await load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "We couldn't turn that into a bid.");
    } finally {
      setConverting(null);
    }
  }

  const statusOptions = useMemo(() => {
    const seen = new Set(rows.map((r) => String(r.status).toLowerCase()).filter(Boolean));
    return Array.from(seen).sort();
  }, [rows]);

  return (
    <Page
      title="My Bids"
      summary="Everything you've saved or started — the opportunities you're weighing up and the bids you're building."
      actions={
        <LinkButton to="/bids/new" tone="primary" icon="add">
          New Bid
        </LinkButton>
      }
    >
      {err ? (
        <Alert className="mb-gap" onDismiss={() => setErr(null)}>
          {err}
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-gap sm:grid-cols-3">
        <StatTile label="Open opportunities" value={stats.open} hint="Not turned into a bid yet" />
        <StatTile label="Bids in progress" value={stats.inProgress} hint="Drafted, not approved" />
        <StatTile
          label="Approved"
          value={stats.approved}
          hint="Priced and signed off"
          tone={stats.approved > 0 ? "good" : undefined}
        />
      </div>

      <div className="mt-gap flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={q}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Search by contract, agency or code"
          className="min-w-[220px] flex-1"
          aria-label="Search your bids"
        />
        <Select
          value={kind}
          onChange={(e) => setParam("kind", e.target.value)}
          aria-label="Filter by type"
          className="w-[150px]"
        >
          <option value="all">Everything</option>
          <option value="opportunity">Opportunities</option>
          <option value="bid">Bids</option>
        </Select>
        <Select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          aria-label="Filter by status"
          className="w-[150px]"
        >
          <option value="all">Any status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          aria-label="Sort"
          className="w-[160px]"
        >
          <option value="recent">Newest first</option>
          <option value="due">Closing soonest</option>
        </Select>
      </div>

      <Card padded={false} className="mt-5 overflow-hidden">
        {loading ? (
          <div className="p-card">
            <SkeletonRows rows={5} />
          </div>
        ) : filtered.length === 0 ? (
          rows.length === 0 ? (
            <EmptyState
              icon="description"
              title="Nothing here yet"
              body="Save a contract from Find Work, or upload an RFP and we'll build the bid around it."
              actions={
                <>
                  <LinkButton to="/find-work" tone="primary">
                    Find contracts
                  </LinkButton>
                  <LinkButton to="/bids/new">Upload an RFP</LinkButton>
                </>
              }
            />
          ) : (
            <EmptyState
              icon="filter_alt_off"
              title="Nothing matches those filters"
              body="Try clearing the search box or widening the status filter."
              actions={
                <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  Clear filters
                </Button>
              }
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-line bg-raised">
                  <th className="px-card py-3 text-caps uppercase text-muted">Contract</th>
                  <th className="px-4 py-3 text-caps uppercase text-muted">Agency</th>
                  <th className="px-4 py-3 text-caps uppercase text-muted">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 text-caps uppercase text-muted">Due</th>
                  <th className="whitespace-nowrap px-4 py-3 text-caps uppercase text-muted">
                    Win chance
                  </th>
                  <th className="px-card py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {filtered.map((r) => {
                  const to =
                    r.kind === "bid"
                      ? `/bids/${r.id}`
                      : r.convertedBidId
                      ? `/bids/${r.convertedBidId}`
                      : `/opportunities/${r.id}`;
                  const tone = deadlineTone(r.due);
                  return (
                    <tr key={r.key} className="group transition-colors hover:bg-raised">
                      <td className="px-card py-4">
                        <div className="flex items-start gap-2.5">
                          <Icon
                            name={r.kind === "bid" ? "description" : "explore"}
                            className="mt-0.5 text-[18px] text-faint"
                          />
                          <div className="min-w-0">
                            <Link
                              to={to}
                              className="text-base font-medium text-ink transition-colors hover:text-brand-700"
                            >
                              {clamp(r.title, 62)}
                            </Link>
                            {r.code ? (
                              <div className="mt-0.5 font-mono text-[11px] text-faint">{r.code}</div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-base text-muted">
                        {clamp(r.agency || "—", 28)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {r.due ? (
                          <>
                            <div className="text-base tnum text-ink">{formatDate(r.due)}</div>
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
                              {deadlineLabel(r.due)}
                            </div>
                          </>
                        ) : (
                          <span className="text-base text-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {r.score !== null ? (
                          <>
                            <div className="text-base font-medium tnum text-ink">
                              {percentLabel(r.score)}
                            </div>
                            <Meter value={r.score} tone={scoreTone(r.score)} />
                          </>
                        ) : (
                          <span className="text-base text-faint">—</span>
                        )}
                      </td>
                      <td className="px-card py-4 text-right">
                        {r.kind === "opportunity" && !r.convertedBidId ? (
                          <Button
                            size="sm"
                            loading={converting === r.id}
                            onClick={() => convert(r.id)}
                          >
                            Turn into a bid
                          </Button>
                        ) : (
                          <LinkButton size="sm" to={to} trailingIcon="arrow_forward">
                            Open
                          </LinkButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!loading && filtered.length > 0 ? (
        <p className="mt-4 text-meta text-muted">
          Showing {filtered.length} of {rows.length}
        </p>
      ) : null}
    </Page>
  );
}
