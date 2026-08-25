import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Field,
  Icon,
  Input,
  Textarea,
  cx,
} from "@/ui/kit";

const CERTIFICATIONS = [
  "Small business",
  "Woman-owned",
  "Veteran-owned",
  "Service-disabled veteran-owned",
  "8(a)",
  "HUBZone",
  "Minority-owned",
];

const STEPS = ["Your company", "What you do", "Live contract search"];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [naics, setNaics] = useState("");
  const [certs, setCerts] = useState<string[]>([]);
  const [setAside, setSetAside] = useState(false);
  const [competencies, setCompetencies] = useState("");
  const [pitch, setPitch] = useState("");
  const [samKey, setSamKey] = useState("");

  function finish(skipped = false) {
    localStorage.setItem("onboarding_complete", "true");
    if (skipped) navigate("/", { replace: true });
  }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      await api.put("/profile", {
        company_name: companyName,
        company_description: description,
        naics_codes: naics,
        certifications: certs.join(", "),
        set_aside_eligible: setAside,
        core_competencies: competencies,
        elevator_pitch: pitch,
      });
      if (samKey.trim()) localStorage.setItem("sam_api_key", samKey.trim());
      finish();
      navigate("/", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "That didn't save. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  }

  const canContinue =
    step === 0 ? companyName.trim().length > 0 : step === 1 ? naics.trim().length > 0 : true;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
            Sentri<span className="text-brand-600">BiD</span>
          </span>
          <button
            type="button"
            onClick={() => finish(true)}
            className="text-meta font-medium text-muted transition-colors hover:text-body"
          >
            Skip for now
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-10">
          <h1 className="text-h1">Let's set you up</h1>
          <p className="mt-1.5 text-base text-muted">
            Three short questions. They decide which contracts we show you and how your proposals
            read, so it's worth a couple of minutes.
          </p>
        </div>

        <ol className="mb-8 flex gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <div
                className={cx(
                  "h-1 rounded-full transition-colors",
                  i <= step ? "bg-brand-600" : "bg-line"
                )}
              />
              <p
                className={cx(
                  "mt-2 text-meta",
                  i === step ? "font-medium text-brand-700" : "text-muted"
                )}
              >
                {label}
              </p>
            </li>
          ))}
        </ol>

        {err ? (
          <Alert className="mb-gap" onDismiss={() => setErr(null)}>
            {err}
          </Alert>
        ) : null}

        <Card>
          {step === 0 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-h2">Tell us about your company</h2>
                <p className="mt-1 text-base text-muted">
                  This goes on every proposal we write for you.
                </p>
              </div>
              <Field label="Company name">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Legal business name"
                  autoFocus
                />
              </Field>
              <Field
                label="What does your company do?"
                hint="Two or three sentences in plain language. No jargon needed."
              >
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. We digitise and manage employee records for school districts across Maryland and Virginia. We've been doing it for eleven years."
                />
              </Field>
            </div>
          ) : step === 1 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-h2">What kind of work do you want?</h2>
                <p className="mt-1 text-base text-muted">
                  Industry codes are how the government sorts contracts. Adding yours is the single
                  biggest thing you can do to get good matches.
                </p>
              </div>
              <Field
                label="Industry codes (NAICS)"
                hint="Separate several with commas. Not sure? Put in your best guess — you can fix it later."
              >
                <Input
                  value={naics}
                  onChange={(e) => setNaics(e.target.value)}
                  placeholder="541512, 541519"
                  autoFocus
                />
              </Field>
              <Field label="Certifications you hold">
                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                  {CERTIFICATIONS.map((c) => (
                    <Checkbox
                      key={c}
                      label={c}
                      checked={certs.includes(c)}
                      onChange={(e) =>
                        setCerts(
                          e.target.checked ? [...certs, c] : certs.filter((x) => x !== c)
                        )
                      }
                    />
                  ))}
                </div>
              </Field>
              <div className="border-t border-line-soft pt-5">
                <Checkbox
                  label="We qualify for small business set-asides"
                  checked={setAside}
                  onChange={(e) => setSetAside(e.target.checked)}
                />
              </div>
              <Field label="What are you best at?" hint="Used when drafting your proposals.">
                <Textarea
                  rows={3}
                  value={competencies}
                  onChange={(e) => setCompetencies(e.target.value)}
                  placeholder="e.g. Records digitisation, certification tracking, FERPA compliance."
                />
              </Field>
              <Field
                label="Your elevator pitch"
                hint="Optional. Two sentences we use at the top of teaming emails."
              >
                <Textarea rows={2} value={pitch} onChange={(e) => setPitch(e.target.value)} />
              </Field>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-h2">Connect SAM.gov</h2>
                <p className="mt-1 text-base text-muted">
                  A free key from sam.gov lets us search live federal contracts. You can skip this
                  and add it later from Settings.
                </p>
              </div>
              <Field
                label="SAM.gov API key"
                hint="Stored in this browser only — it never leaves your machine."
              >
                <Input
                  value={samKey}
                  onChange={(e) => setSamKey(e.target.value)}
                  type="password"
                  autoComplete="off"
                  className="font-mono"
                  placeholder="Paste your key"
                />
              </Field>

              <div className="rounded-control border border-line bg-raised p-4">
                <p className="text-base font-medium text-ink">Getting one takes about a minute</p>
                <ol className="mt-2 space-y-1.5 text-base text-muted">
                  <li>1. Sign in at sam.gov.</li>
                  <li>2. Open Account Details, then Request Public API Key.</li>
                  <li>3. Copy the key and paste it above.</li>
                </ol>
                <a
                  href="https://sam.gov"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-base font-medium text-brand-600 hover:text-brand-700"
                >
                  Open sam.gov
                  <Icon name="open_in_new" className="text-[16px]" />
                </a>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line-soft pt-5">
            {step > 0 ? (
              <Button tone="ghost" icon="arrow_back" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <Button
                tone="primary"
                size="lg"
                disabled={!canContinue}
                onClick={() => setStep(step + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button tone="primary" size="lg" loading={saving} onClick={save}>
                Finish setup
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
