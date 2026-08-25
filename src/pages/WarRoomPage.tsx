import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  Spinner,
  cx,
} from "@/ui/kit";
import { clamp, percentLabel, scoreTone, sentence, toPercent } from "@/lib/format";

type AnyObj = Record<string, any>;

export default function WarRoomPage() {
  const { oppId } = useParams();
  const [data, setData] = useState<AnyObj | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/opportunities/${oppId}`)
      .then((r) => {
        setTitle(r.data?.title ?? "");
        if (r.data?.war_room_analysis) {
          try {
            setData(JSON.parse(r.data.war_room_analysis));
          } catch {
            /* stored analysis isn't valid JSON — treat as absent */
          }
        }
      })
      .catch(() => {});
  }, [oppId]);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const r = await api.post(`/discovery/war-room/${oppId}`);
      if (r.data?.error) setErr(String(r.data.error));
      else setData(r.data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "The analysis didn't finish.");
    } finally {
      setLoading(false);
    }
  }

  const win = data?.win_probability ?? {};
  const landscape = data?.competitive_landscape ?? {};
  const ghost = data?.ghost_proposal ?? {};
  const strategy = data?.our_win_strategy ?? {};
  const score = toPercent(win.score);

  return (
    <Page
      title="Competition"
      summary="Who else is likely to bid, what their proposal probably looks like, and how you beat it."
      back={{ to: `/opportunities/${oppId}`, label: "Back to the opportunity" }}
      eyebrow={title ? <p className="text-meta text-muted">{clamp(title, 80)}</p> : undefined}
      actions={
        data ? (
          <Button loading={loading} onClick={run} icon="auto_awesome">
            Run it again
          </Button>
        ) : null
      }
    >
      {err ? (
        <Alert tone="warn" className="mb-gap" onDismiss={() => setErr(null)}>
          {err}
        </Alert>
      ) : null}

      {loading && !data ? (
        <Card>
          <div className="flex items-center gap-3">
            <Spinner className="text-brand-600" />
            <p className="text-base text-body">
              Looking at past awards, likely bidders and how this normally goes…
            </p>
          </div>
        </Card>
      ) : !data ? (
        <Card padded={false}>
          <EmptyState
            icon="neurology"
            title="Size up the competition"
            body="We'll work out who else is likely to bid, sketch the proposal they'd write, and suggest how to beat it."
            actions={
              <Button tone="primary" onClick={run}>
                Run the analysis
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-gap">
          <div className="grid grid-cols-1 gap-gap sm:grid-cols-3">
            <Card>
              <div className="text-meta text-muted">Your win chance</div>
              <div
                className={cx(
                  "mt-2 text-stat tnum",
                  score === null
                    ? "text-faint"
                    : scoreTone(score) === "good"
                    ? "text-good-solid"
                    : "text-ink"
                )}
              >
                {score === null ? "—" : percentLabel(score)}
              </div>
              {win.confidence ? (
                <div className="mt-1 text-meta text-muted">{sentence(win.confidence)} confidence</div>
              ) : null}
            </Card>
            <Card>
              <div className="text-meta text-muted">Expected bidders</div>
              <div className="mt-2 text-stat tnum text-ink">
                {landscape.total_expected_bidders ?? "—"}
              </div>
              {landscape.competitive_intensity ? (
                <div className="mt-1 text-meta text-muted">
                  {sentence(landscape.competitive_intensity)} competition
                </div>
              ) : null}
            </Card>
            <Card>
              <div className="text-meta text-muted">Named competitors</div>
              <div className="mt-2 text-stat tnum text-ink">
                {asList(landscape.likely_competitors).length}
              </div>
              <div className="mt-1 text-meta text-muted">Companies we can identify</div>
            </Card>
          </div>

          {data.bottom_line || data.executive_brief ? (
            <Card>
              <CardHeading title="The short version" />
              <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-body">
                {data.bottom_line ?? data.executive_brief}
              </p>
            </Card>
          ) : null}

          {asList(win.key_factors).length > 0 ? (
            <Card>
              <CardHeading title="What decides it" />
              <ul className="mt-4 space-y-2.5">
                {asList(win.key_factors).map((f, i) => (
                  <li key={i} className="flex gap-2.5 text-base text-body">
                    <Icon name="check_circle" className="mt-0.5 text-[16px] text-brand-500" />
                    {text(f)}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {asList(landscape.likely_competitors).length > 0 ? (
            <Card>
              <CardHeading title="Who you're up against" />
              <ul className="mt-4 divide-y divide-line-soft">
                {asList(landscape.likely_competitors).map((c: any, i) => (
                  <li key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-h3">{text(c.name ?? c)}</p>
                      {c.threat_level ? (
                        <Badge tone={String(c.threat_level).toLowerCase() === "high" ? "bad" : "warn"}>
                          {sentence(c.threat_level)} threat
                        </Badge>
                      ) : null}
                    </div>
                    {c.notes || c.strengths ? (
                      <p className="mt-1 text-base text-muted">{text(c.notes ?? c.strengths)}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {ghost.description || ghost.technical_approach || ghost.pricing_strategy ? (
            <Card>
              <CardHeading
                title="Their likely proposal"
                hint="Our best guess at what a strong competitor would submit."
              />
              <div className="mt-5 space-y-5">
                {ghost.description ? <Para>{ghost.description}</Para> : null}
                {ghost.technical_approach ? (
                  <Block title="How they'd do the work">{ghost.technical_approach}</Block>
                ) : null}
                {ghost.pricing_strategy ? (
                  <Block title="How they'd price it">{ghost.pricing_strategy}</Block>
                ) : null}
                {asList(ghost.weaknesses_to_exploit).length > 0 ? (
                  <div>
                    <h3 className="text-h3">Where they're weak</h3>
                    <ul className="mt-2 space-y-2">
                      {asList(ghost.weaknesses_to_exploit).map((w, i) => (
                        <li key={i} className="flex gap-2.5 text-base text-body">
                          <Icon name="arrow_forward" className="mt-0.5 text-[16px] text-brand-500" />
                          {text(w)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          {asList(strategy.primary_win_themes).length > 0 ||
          strategy.pricing_strategy ||
          asList(strategy.teaming_recommendations).length > 0 ? (
            <Card>
              <CardHeading title="How you win it" />
              <div className="mt-5 space-y-5">
                {asList(strategy.primary_win_themes).length > 0 ? (
                  <div>
                    <h3 className="text-h3">Lead with</h3>
                    <ul className="mt-2 space-y-2">
                      {asList(strategy.primary_win_themes).map((t, i) => (
                        <li key={i} className="flex gap-2.5 text-base text-body">
                          <Icon name="check_circle" className="mt-0.5 text-[16px] text-good-solid" />
                          {text(t)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {strategy.pricing_strategy ? (
                  <Block title="Pricing">{strategy.pricing_strategy}</Block>
                ) : null}
                {asList(strategy.teaming_recommendations).length > 0 ? (
                  <div>
                    <h3 className="text-h3">Worth teaming with</h3>
                    <ul className="mt-2 space-y-2">
                      {asList(strategy.teaming_recommendations).map((t, i) => (
                        <li key={i} className="flex gap-2.5 text-base text-body">
                          <Icon name="handshake" className="mt-0.5 text-[16px] text-brand-500" />
                          {text(t)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          {asList(data.counter_strategies).length > 0 ? (
            <Card>
              <CardHeading title="If they undercut you" />
              <ul className="mt-4 space-y-2.5">
                {asList(data.counter_strategies).map((c, i) => (
                  <li key={i} className="flex gap-2.5 text-base text-body">
                    <Icon name="check" className="mt-0.5 text-[16px] text-brand-500" />
                    {text(c)}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {asList(data.action_plan).length > 0 ? (
            <Card>
              <CardHeading title="What to do next" />
              <ol className="mt-4 space-y-3">
                {asList(data.action_plan).map((a, i) => (
                  <li key={i} className="flex gap-3 text-base text-body">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[12px] font-semibold text-brand-700">
                      {i + 1}
                    </span>
                    {text(a)}
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </div>
      )}
    </Page>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="whitespace-pre-wrap text-base leading-relaxed text-body">{children}</p>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-h3">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-body">{children}</p>
    </div>
  );
}

function asList(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n+/)
      .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter(Boolean);
  }
  return [];
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const o = value as AnyObj;
    return String(o.text ?? o.name ?? o.description ?? o.theme ?? JSON.stringify(o));
  }
  return String(value ?? "");
}
