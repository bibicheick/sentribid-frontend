import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import Page from "@/components/Page";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeading,
  Checkbox,
  Field,
  Icon,
  Input,
  Select,
  SkeletonRows,
  Textarea,
  cx,
} from "@/ui/kit";

type Profile = Record<string, any>;

const SECTIONS = [
  { id: "company", label: "Company profile", icon: "business" },
  { id: "industry", label: "Industry & certifications", icon: "workspace_premium" },
  { id: "strengths", label: "What you're good at", icon: "star" },
  { id: "connections", label: "SAM.gov key", icon: "key" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const CERTIFICATIONS = [
  "Small business",
  "Woman-owned",
  "Veteran-owned",
  "Service-disabled veteran-owned",
  "8(a)",
  "HUBZone",
  "Minority-owned",
];

export default function SettingsPage() {
  const [section, setSection] = useState<SectionId>("company");
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const [samKey, setSamKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/profile");
        setProfile(r.data ?? {});
      } catch {
        setProfile({});
      } finally {
        setLoading(false);
      }
      setSamKey(localStorage.getItem("sam_api_key") ?? "");
    })();
  }, []);

  function set(field: string, value: any) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setNote(null);
    try {
      await api.put("/profile", profile);
      if (samKey.trim()) localStorage.setItem("sam_api_key", samKey.trim());
      else localStorage.removeItem("sam_api_key");
      setNote({ tone: "good", text: "Saved." });
      setTimeout(() => setNote(null), 3000);
    } catch (e: any) {
      setNote({
        tone: "bad",
        text: e?.response?.data?.detail || "That didn't save. Try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function uploadCapability(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setNote(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await api.post("/profile/capability-statement", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set("capability_statement_text", r.data?.extracted_text ?? "Uploaded");
      setNote({ tone: "good", text: "Capability statement read and saved." });
    } catch {
      setNote({ tone: "bad", text: "We couldn't read that file." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const naics = useMemo(() => toList(profile.naics_codes), [profile.naics_codes]);
  const certs = useMemo(() => toList(profile.certifications), [profile.certifications]);
  const vehicles = useMemo(() => toList(profile.contract_vehicles), [profile.contract_vehicles]);

  return (
    <Page
      title="Settings"
      summary="Your company details. SentriBiD uses these to match you with the right contracts and to write your proposals in your voice."
      actions={
        <Button tone="primary" loading={saving} onClick={save}>
          Save changes
        </Button>
      }
    >
      {note ? (
        <Alert tone={note.tone} className="mb-gap" onDismiss={() => setNote(null)}>
          {note.text}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-gap lg:flex-row">
        <nav className="lg:w-56 lg:shrink-0">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={cx(
                    "flex w-full items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-base font-medium transition-colors",
                    section === s.id
                      ? "bg-brand-50 text-brand-700"
                      : "text-muted hover:bg-sunken hover:text-body"
                  )}
                >
                  <Icon
                    name={s.icon}
                    className={cx("text-[18px]", section === s.id ? "text-brand-600" : "text-faint")}
                  />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          {loading ? (
            <Card>
              <SkeletonRows rows={5} />
            </Card>
          ) : section === "company" ? (
            <Card>
              <CardHeading
                title="Company profile"
                hint="The basics an agency expects to see on any bid you submit."
              />
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Company name" className="sm:col-span-2">
                  <Input
                    value={profile.company_name ?? ""}
                    onChange={(e) => set("company_name", e.target.value)}
                    placeholder="Legal business name"
                  />
                </Field>
                <Field label="UEI number" hint="The 12-character ID from SAM.gov.">
                  <Input
                    value={profile.duns_uei ?? ""}
                    onChange={(e) => set("duns_uei", e.target.value)}
                    className="font-mono"
                    placeholder="ABC123DEF456"
                  />
                </Field>
                <Field label="CAGE code">
                  <Input
                    value={profile.cage_code ?? ""}
                    onChange={(e) => set("cage_code", e.target.value)}
                    className="font-mono"
                    placeholder="5 characters"
                  />
                </Field>
                <Field label="Website">
                  <Input
                    value={profile.website ?? ""}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://"
                    type="url"
                  />
                </Field>
                <Field label="Company size">
                  <Select
                    value={profile.employee_count ?? ""}
                    onChange={(e) => set("employee_count", e.target.value)}
                  >
                    <option value="">Choose one</option>
                    <option value="1-10">1–10 employees</option>
                    <option value="11-50">11–50 employees</option>
                    <option value="51-200">51–200 employees</option>
                    <option value="201-500">201–500 employees</option>
                    <option value="500+">More than 500</option>
                  </Select>
                </Field>
                <Field
                  label="Annual revenue"
                  hint="Used for set-aside size checks. Nobody outside your account sees it."
                  className="sm:col-span-2 sm:max-w-xs"
                >
                  <Input
                    value={profile.annual_revenue ?? ""}
                    onChange={(e) => set("annual_revenue", e.target.value)}
                    placeholder="e.g. 2,400,000"
                    inputMode="numeric"
                  />
                </Field>
                <Field
                  label="About your company"
                  hint="A short description. We use this when drafting your proposals."
                  className="sm:col-span-2"
                >
                  <Textarea
                    rows={4}
                    value={profile.company_description ?? ""}
                    onChange={(e) => set("company_description", e.target.value)}
                    placeholder="What you do, who you do it for, and how long you've been at it."
                  />
                </Field>
              </div>
            </Card>
          ) : section === "industry" ? (
            <div className="space-y-gap">
              <Card>
                <CardHeading
                  title="Industry codes (NAICS)"
                  hint="This is the single biggest thing that decides which contracts we show you."
                />
                <div className="mt-5">
                  <ChipEditor
                    values={naics}
                    onChange={(v) => set("naics_codes", v)}
                    placeholder="e.g. 541512"
                    addLabel="Add a code"
                    empty="No codes yet — add at least one so matching can work."
                  />
                </div>
              </Card>

              <Card>
                <CardHeading
                  title="Certifications"
                  hint="Tick everything your business currently holds."
                />
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {CERTIFICATIONS.map((c) => (
                    <Checkbox
                      key={c}
                      label={c}
                      checked={certs.includes(c)}
                      onChange={(e) =>
                        set(
                          "certifications",
                          e.target.checked ? [...certs, c] : certs.filter((x) => x !== c)
                        )
                      }
                    />
                  ))}
                </div>
                <div className="mt-5 border-t border-line-soft pt-5">
                  <Checkbox
                    label="We qualify for small business set-asides"
                    checked={Boolean(profile.set_aside_eligible)}
                    onChange={(e) => set("set_aside_eligible", e.target.checked)}
                  />
                </div>
              </Card>

              <Card>
                <CardHeading
                  title="Contract vehicles"
                  hint="GSA schedules, IDIQs, BPAs — anything you're already on."
                />
                <div className="mt-5">
                  <ChipEditor
                    values={vehicles}
                    onChange={(v) => set("contract_vehicles", v)}
                    placeholder="e.g. GSA MAS"
                    addLabel="Add a vehicle"
                    empty="None added."
                  />
                </div>
              </Card>
            </div>
          ) : section === "strengths" ? (
            <div className="space-y-gap">
              <Card>
                <CardHeading
                  title="What you're good at"
                  hint="The more specific you are here, the better your proposals read."
                />
                <div className="mt-6 space-y-5">
                  <Field
                    label="Core competencies"
                    hint="The work you do best, in your own words."
                  >
                    <Textarea
                      rows={3}
                      value={profile.core_competencies ?? ""}
                      onChange={(e) => set("core_competencies", e.target.value)}
                      placeholder="e.g. Records digitisation for school districts, staff certification tracking, FERPA compliance."
                    />
                  </Field>
                  <Field
                    label="What sets you apart"
                    hint="Why an agency should pick you over a bigger competitor."
                  >
                    <Textarea
                      rows={3}
                      value={profile.differentiators ?? ""}
                      onChange={(e) => set("differentiators", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Past performance"
                    hint="Contracts you've delivered. Include the agency and the year."
                  >
                    <Textarea
                      rows={4}
                      value={profile.past_performance ?? ""}
                      onChange={(e) => set("past_performance", e.target.value)}
                    />
                  </Field>
                  <Field label="Key people" hint="Names, roles and the clearances they hold.">
                    <Textarea
                      rows={3}
                      value={profile.key_personnel ?? ""}
                      onChange={(e) => set("key_personnel", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Elevator pitch"
                    hint="Two sentences. Used at the top of teaming emails."
                  >
                    <Textarea
                      rows={2}
                      value={profile.elevator_pitch ?? ""}
                      onChange={(e) => set("elevator_pitch", e.target.value)}
                    />
                  </Field>
                </div>
              </Card>

              <Card>
                <CardHeading
                  title="Capability statement"
                  hint="Already have one? Upload it and we'll pull the details out."
                  action={
                    <Button
                      icon="upload_file"
                      loading={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      Upload
                    </Button>
                  }
                />
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={uploadCapability}
                />
                {profile.capability_statement_text ? (
                  <div className="mt-5 flex items-start gap-2.5 rounded-control border border-good-line bg-good-bg px-4 py-3">
                    <Icon name="check_circle" className="text-[18px] text-good-ink" />
                    <p className="text-base text-good-ink">
                      We've read your capability statement and it's feeding into your proposals.
                    </p>
                  </div>
                ) : (
                  <p className="mt-5 text-base text-muted">Nothing uploaded yet.</p>
                )}
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeading
                title="SAM.gov API key"
                hint="Needed to search live federal contracts. It's free and takes a few minutes to get."
              />
              <Field
                label="Your key"
                className="mt-6 max-w-md"
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

              <div className="mt-6 rounded-control border border-line bg-raised p-4">
                <p className="text-base font-medium text-ink">How to get one</p>
                <ol className="mt-2 space-y-1.5 text-base text-muted">
                  <li>1. Sign in at sam.gov with your account.</li>
                  <li>2. Open Account Details, then Request Public API Key.</li>
                  <li>3. Copy the key it shows you and paste it above.</li>
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
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}

/* ── Chip editor ──────────────────────────────────────────────────────── */

function ChipEditor({
  values,
  onChange,
  placeholder,
  addLabel,
  empty,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  addLabel: string;
  empty: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v || values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  }

  return (
    <div>
      {values.length > 0 ? (
        <ul className="mb-4 flex flex-wrap gap-2">
          {values.map((v) => (
            <li key={v}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-raised py-1 pl-3 pr-1.5 text-base text-body">
                {v}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  aria-label={`Remove ${v}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-faint transition-colors hover:bg-sunken hover:text-bad-ink"
                >
                  <Icon name="close" className="text-[14px]" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-base text-muted">{empty}</p>
      )}

      <div className="flex max-w-sm gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button onClick={add} icon="add">
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value ?? "")
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
