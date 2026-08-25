import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon, cx } from "@/ui/kit";

const CONTACT_EMAIL = "info@sentrihq.com";

/** All served from public/ — local files, so nothing to expire and nothing to fetch. */
const HERO_IMAGE = "/hero.jpg";
const WORKING_IMAGE = "/working.jpg";
const STREET_IMAGE = "/auth-backdrop.jpg";

const PAIN_POINTS = [
  "Tens of thousands of contracts are open at any moment. Finding the handful that fit you is a full-time job on its own.",
  "By the time you work out the incumbent was always going to win it, you've spent a week you can't bill.",
  "The solicitation runs to eighty pages and it's due in twenty-one days.",
];

/** "illustration" uses the artwork above; "preview" uses the drawn dashboard. */
const HERO_VISUAL: "illustration" | "preview" = "illustration";

const FEATURES = [
  {
    icon: "trending_up",
    title: "Match score",
    body: "See how well your past work and industry codes line up with a contract before you spend a day on it.",
  },
  {
    icon: "fact_check",
    title: "Requirement extraction",
    body: "We pull out every mandatory certification, deadline and deliverable, with the section it came from.",
  },
  {
    icon: "edit",
    title: "Proposal drafting",
    body: "A structured first draft built from your company profile and what the agency actually asked for.",
  },
];

export default function LandingPage() {
  useEffect(() => {
    document.title = "SentriBiD — win government contracts without the complexity";
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <Nav />
      <Hero />
      <Problem />
      <Coverage />
      <Features />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ── Nav ──────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-10">
          <Link to="/" className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
            Sentri<span className="text-brand-600">BiD</span>
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            <NavLink href="#features">How it works</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href={`mailto:${CONTACT_EMAIL}`}>Contact</NavLink>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden h-10 items-center rounded-control px-3.5 text-base font-medium text-body transition-colors hover:bg-sunken sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex h-10 items-center rounded-control bg-brand-600 px-4 text-base font-medium text-white shadow-card transition-colors hover:bg-brand-700"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-base text-muted transition-colors hover:text-ink">
      {children}
    </a>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto grid max-w-content items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-meta font-medium text-brand-700">
            Built for small businesses, not beltway consultants
          </span>

          <h1 className="mt-5 text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[48px] lg:text-[56px]">
            Win government contracts without the complexity.
          </h1>

          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted">
            SentriBiD finds federal opportunities that match your business and helps you write
            winning proposals in days, not weeks.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex h-12 items-center rounded-control bg-brand-600 px-6 text-[15px] font-medium text-white shadow-card transition-colors hover:bg-brand-700"
            >
              Start for free
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center rounded-control border border-line bg-surface px-6 text-[15px] font-medium text-body shadow-card transition-colors hover:bg-raised"
            >
              See how it works
            </a>
          </div>

          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            {["No card required", "Set up in 10 minutes", "Cancel anytime"].map((t) => (
              <li key={t} className="flex items-center gap-1.5 text-meta text-muted">
                <Icon name="check" className="text-[15px] text-good-solid" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {HERO_VISUAL === "illustration" ? <HeroIllustration /> : <ProductPreview />}
      </div>
    </header>
  );
}

function HeroIllustration() {
  return (
    <div className="aspect-[3/2] w-full overflow-hidden rounded-panel border border-line bg-canvas shadow-pop">
      <img
        src={HERO_IMAGE}
        alt="A business owner reviewing her contract pipeline in SentriBiD"
        className="h-full w-full object-cover"
        width={1264}
        height={848}
        loading="eager"
      />
    </div>
  );
}

/**
 * The product, drawn in markup rather than a stock illustration. It stays sharp
 * at any size, weighs nothing, and shows people the thing they're signing up for.
 */
function ProductPreview() {
  const rows = [
    { title: "Electronic Records Compliance System", agency: "Prince George's County Schools", score: "85%", tone: "good" },
    { title: "IT Help Desk Support Services", agency: "Department of Veterans Affairs", score: "62%", tone: "warn" },
    { title: "Facility Maintenance — Building 4", agency: "General Services Administration", score: "41%", tone: "warn" },
  ];

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-panel border border-line bg-canvas shadow-pop">
        {/* browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-line bg-raised px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
          <span className="ml-3 rounded bg-sunken px-2 py-0.5 text-[10px] text-faint">
            sentribid.com
          </span>
        </div>

        <div className="flex">
          {/* sidebar */}
          <div className="hidden w-32 shrink-0 border-r border-line bg-surface p-3 sm:block">
            <div className="mb-3 h-6 rounded bg-brand-600" />
            {["Dashboard", "Find Work", "Pipeline", "My Bids"].map((label, i) => (
              <div
                key={label}
                className={cx(
                  "mb-1 rounded px-2 py-1.5 text-[10px] font-medium",
                  i === 0 ? "bg-brand-50 text-brand-700" : "text-faint"
                )}
              >
                {label}
              </div>
            ))}
          </div>

          {/* content */}
          <div className="min-w-0 flex-1 p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Open", "12"],
                ["In progress", "4"],
                ["To approve", "2"],
                ["Won", "3"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-surface p-2.5">
                  <div className="text-[9px] text-faint">{label}</div>
                  <div className="mt-0.5 text-[18px] font-semibold tnum text-ink">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-lg border border-line bg-surface p-3">
              <div className="text-[11px] font-semibold text-ink">Worth a look</div>
              <div className="mt-2 divide-y divide-line-soft">
                {rows.map((r) => (
                  <div key={r.title} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-medium text-ink">{r.title}</div>
                      <div className="truncate text-[9px] text-faint">{r.agency}</div>
                    </div>
                    <span
                      className={cx(
                        "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-medium",
                        r.tone === "good"
                          ? "border-good-line bg-good-bg text-good-ink"
                          : "border-warn-line bg-warn-bg text-warn-ink"
                      )}
                    >
                      {r.score} win chance
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── The problem ──────────────────────────────────────────────────────── */

function Problem() {
  return (
    <section className="border-b border-line bg-canvas">
      <div className="mx-auto grid max-w-content items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-24">
        <div className="order-2 aspect-[4/3] w-full overflow-hidden rounded-panel border border-line bg-surface shadow-lift lg:order-1">
          <img
            src={WORKING_IMAGE}
            alt="Two people working through a table covered in printed solicitations and sticky notes"
            className="h-full w-full object-cover"
            width={1024}
            height={1024}
            loading="lazy"
          />
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[36px]">
            There's a reason most small businesses never bid.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            It isn't that the work isn't there. It's that getting to a decision costs more than most
            small teams can spare.
          </p>

          <ul className="mt-7 space-y-4">
            {PAIN_POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bad-solid" />
                <span className="text-base leading-relaxed text-body">{point}</span>
              </li>
            ))}
          </ul>

          <p className="mt-7 border-l-2 border-brand-600 pl-4 text-[17px] leading-relaxed text-ink">
            SentriBiD does the reading, so you can make the call in an afternoon.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Coverage + data sources ──────────────────────────────────────────── */

/**
 * Industry codes, titles verified against the BLS QCEW industry list and
 * naics.com. Don't add one without checking it — this is a public claim about
 * what the product covers.
 */
const NAICS_EXAMPLES = [
  { code: "541512", label: "Computer systems design" },
  { code: "541330", label: "Engineering services" },
  { code: "236220", label: "Commercial construction" },
  { code: "561210", label: "Facilities support" },
  { code: "561720", label: "Janitorial services" },
  { code: "561612", label: "Security guards and patrol" },
  { code: "541611", label: "Management consulting" },
];

const SOURCES = [
  { name: "SAM.gov", href: "https://sam.gov", what: "Open federal solicitations" },
  {
    name: "USAspending.gov",
    href: "https://www.usaspending.gov",
    what: "Awarded contracts and prime contractors",
  },
];

function Coverage() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-content px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[36px]">
            Works for whatever you do.
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-muted">
            Every open federal contract, in every industry code. A few of the ones small businesses
            bid on most:
          </p>
        </div>

        <ul className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2.5">
          {NAICS_EXAMPLES.map((n) => (
            <li
              key={n.code}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-2 pl-3 pr-4 shadow-card"
            >
              <span className="font-mono text-[12px] text-brand-600">{n.code}</span>
              <span className="text-base text-body">{n.label}</span>
            </li>
          ))}
          <li className="inline-flex items-center rounded-full border border-dashed border-line px-4 py-2 text-base text-muted">
            …and every other code
          </li>
        </ul>

        <div className="mx-auto mt-14 max-w-3xl border-t border-line pt-10">
          <p className="text-center text-caps uppercase text-muted">Data comes from</p>
          <ul className="mt-5 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            {SOURCES.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-card border border-line bg-surface px-5 py-3 shadow-card transition-shadow hover:shadow-lift"
                >
                  <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                    {s.name.split(".")[0]}
                    <span className="font-normal text-muted">.{s.name.split(".")[1]}</span>
                  </span>
                  <span className="hidden h-8 w-px bg-line sm:block" />
                  <span className="hidden text-meta text-muted sm:block">{s.what}</span>
                  <Icon
                    name="open_in_new"
                    className="text-[15px] text-faint transition-colors group-hover:text-brand-600"
                  />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-meta text-muted">
            Public data from the US government. SentriBiD is an independent product and isn't
            affiliated with or endorsed by any federal agency.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Features ─────────────────────────────────────────────────────────── */

function Features() {
  return (
    <section id="features" className="border-b border-line bg-canvas">
      <div className="mx-auto max-w-content px-5 py-20 sm:px-8 lg:py-24">
        <h2 className="text-center text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[36px]">
          Decide with confidence.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[17px] leading-relaxed text-muted">
          Three things that turn a pile of solicitations into a decision you can defend.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-card border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-lift"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                <Icon name={f.icon} className="text-[22px]" />
              </span>
              <h3 className="mt-5 text-h2">{f.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ──────────────────────────────────────────────────────────── */

function Pricing() {
  return (
    <section id="pricing" className="border-b border-line">
      <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8 lg:py-24">
        <h2 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[36px]">
          Pricing
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[17px] leading-relaxed text-muted">
          Every business bids differently. Tell us what you're going after and we'll work out what
          makes sense for you.
        </p>

        <div className="mx-auto mt-10 max-w-md rounded-card border border-line bg-surface p-8 shadow-card">
          <Icon name="forum" className="mx-auto text-[24px] text-brand-600" />
          <p className="mt-4 text-h2">Talk to us</p>
          <p className="mt-2 text-base text-muted">
            No sales script. We'll ask what you do and tell you straight whether this helps.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-control bg-brand-600 px-5 text-[15px] font-medium text-white shadow-card transition-colors hover:bg-brand-700"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ────────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section
      className="border-b border-line bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.90), rgba(255,255,255,0.90)), url("${STREET_IMAGE}")`,
      }}
    >
      <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8 lg:py-28">
        <h2 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[40px]">
          Ready to find your first contract?
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          Set up your profile and see what you match with. It takes ten minutes and costs nothing.
        </p>
        <Link
          to="/register"
          className="mt-8 inline-flex h-12 items-center rounded-control bg-brand-600 px-8 text-[15px] font-medium text-white shadow-card transition-colors hover:bg-brand-700"
        >
          Create your account
        </Link>
        <p className="mt-4 text-meta text-muted">No card required.</p>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-canvas">
      <div className="mx-auto max-w-content px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-2">
            <span className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
              Sentri<span className="text-brand-600">BiD</span>
            </span>
            <p className="mt-3 max-w-xs text-base text-muted">
              Making government contracting workable for small businesses.
            </p>
          </div>

          <div>
            <h3 className="text-meta font-semibold text-ink">Product</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <a href="#features" className="text-base text-muted hover:text-ink">
                  How it works
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-base text-muted hover:text-ink">
                  Pricing
                </a>
              </li>
              <li>
                <Link to="/login" className="text-base text-muted hover:text-ink">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-meta font-semibold text-ink">Company</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-base text-muted hover:text-ink"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <p className="text-center text-meta text-muted">
            © {new Date().getFullYear()} SentriBiD. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
