import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/ui/kit";

const CONTACT_EMAIL = "info@sentrihq.com";

/** All served from public/ — local files, so nothing to expire and nothing to fetch. */
const HERO_IMAGE = "/hero.jpg";
const WORKING_IMAGE = "/working.jpg";
const STREET_IMAGE = "/auth-backdrop.jpg";

const FEATURES = [
  {
    icon: "trending_up",
    title: "Match score",
    body: "See how well your past work and NAICS codes align with a contract before you bid.",
  },
  {
    icon: "fact_check",
    title: "Requirement extraction",
    body: "We pull out every mandatory certification and deadline so you don't miss a thing.",
  },
  {
    icon: "edit",
    title: "Proposal drafting",
    body: "Generate a structured first draft based on your company's profile and the agency's specific needs.",
  },
];

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

export default function LandingPage() {
  useEffect(() => {
    document.title = "SentriBiD — win government contracts";
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <Nav />
      <Hero />
      <Coverage />
      <Features />
      <Statement />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ── Nav ──────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[19px] font-semibold tracking-[-0.02em] text-brand-700">
            SentriBiD
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <NavLink href="#features">How it works</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#about">About</NavLink>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Kept even though the mock omits it — without it, people who already
              have an account have no way in from the homepage. */}
          <Link
            to="/login"
            className="hidden h-9 items-center rounded-control px-3 text-base font-medium text-body transition-colors hover:bg-sunken sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex h-9 items-center rounded-control bg-brand-600 px-4 text-base font-medium text-white transition-opacity hover:opacity-90"
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
      <div className="mx-auto grid max-w-content items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h1 className="text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[48px] lg:text-[56px]">
            Win government contracts without the complexity.
          </h1>

          <p className="max-w-lg text-[17px] leading-[1.5] text-muted">
            SentriBiD finds federal opportunities that match your business and helps you write
            winning proposals in days, not weeks.
          </p>

          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex h-12 items-center rounded-control bg-brand-600 px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Start for free
            </Link>
          </div>
        </div>

        <div className="aspect-[3/2] w-full overflow-hidden rounded-panel border border-line bg-canvas">
          <img
            src={HERO_IMAGE}
            alt="A business owner reviewing her contract pipeline in SentriBiD"
            className="h-full w-full object-cover"
            width={1264}
            height={848}
            loading="eager"
          />
        </div>
      </div>
    </header>
  );
}

/* ── Coverage + data sources ──────────────────────────────────────────── */

function Coverage() {
  return (
    <section id="about" className="border-b border-line">
      <div className="mx-auto max-w-content px-5 py-16 sm:px-8">
        <p className="text-center text-caps uppercase tracking-[0.12em] text-muted">
          Works across every industry code
        </p>

        <ul className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2.5">
          {NAICS_EXAMPLES.map((n) => (
            <li
              key={n.code}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-3 pr-4"
            >
              <span className="font-mono text-[12px] text-brand-600">{n.code}</span>
              <span className="text-base text-body">{n.label}</span>
            </li>
          ))}
          <li className="inline-flex items-center rounded-full border border-dashed border-line px-4 py-1.5 text-base text-muted">
            …and every other code
          </li>
        </ul>

        <div className="mx-auto mt-12 max-w-3xl border-t border-line pt-10">
          <p className="text-center text-caps uppercase tracking-[0.12em] text-muted">
            Data comes from
          </p>
          <ul className="mt-5 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            {SOURCES.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-card border border-line bg-surface px-5 py-3 transition-shadow hover:shadow-card"
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
    <section id="features" className="border-b border-line bg-wash">
      <div className="mx-auto max-w-content px-5 py-24 sm:px-8">
        <h2 className="text-center text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">
          Decide with confidence.
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-card border border-line bg-surface p-6 shadow-card transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                <Icon name={f.icon} className="text-[22px]" />
              </span>
              <h3 className="mt-6 text-h2">{f.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Statement ────────────────────────────────────────────────────────── */

/**
 * The mock had a customer testimonial here. It quoted the founder as though she
 * were a customer, so this says the same thing as a claim the product makes —
 * no quote marks, nobody misrepresented.
 */
function Statement() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <div className="overflow-hidden rounded-panel border border-line">
          <img
            src={WORKING_IMAGE}
            alt="Two people working through a table covered in printed solicitations and sticky notes"
            className="h-full w-full object-cover"
            width={1024}
            height={1024}
            loading="lazy"
          />
        </div>

        <p className="mt-10 text-[26px] font-medium leading-[1.35] tracking-[-0.02em] text-ink sm:text-[28px]">
          Twenty hours reading RFPs, or five minutes knowing whether it's a fit.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          That's the whole difference. SentriBiD does the reading so you can spend your week on the
          bids you're actually going to win.
        </p>
      </div>
    </section>
  );
}

/* ── Pricing / final CTA ──────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section id="pricing" className="border-b border-line bg-wash">
      <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <h2 className="text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">
          Ready to find your first contract?
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          Set up your profile and see what you match with. It takes ten minutes and costs nothing.
        </p>

        <Link
          to="/register"
          className="mt-8 inline-flex h-12 items-center rounded-control bg-brand-600 px-8 text-[15px] font-medium text-white shadow-card transition-opacity hover:opacity-90"
        >
          Create your account
        </Link>

        <p className="mt-10 text-base text-muted">
          Want to talk pricing first?{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-surface">
      <div className="mx-auto max-w-content px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="text-[19px] font-semibold tracking-[-0.02em] text-brand-700">
              SentriBiD
            </span>
            <p className="mt-4 max-w-xs text-meta leading-relaxed text-muted">
              Making government contracting accessible for small businesses.
            </p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              { label: "How it works", href: "#features" },
              { label: "Pricing", href: "#pricing" },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { label: "About", href: "#about" },
              { label: "Contact", href: `mailto:${CONTACT_EMAIL}` },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { label: "Privacy Policy", to: "/privacy" },
              { label: "Terms of Service", to: "/terms" },
            ]}
          />
        </div>

        <div className="mt-16 border-t border-line pt-8">
          <p className="text-center text-meta text-muted">
            © {new Date().getFullYear()} SentriBiD. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href?: string; to?: string }>;
}) {
  return (
    <div>
      <h3 className="text-h3 text-ink">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            {l.to ? (
              <Link to={l.to} className="text-base text-muted transition-colors hover:text-ink">
                {l.label}
              </Link>
            ) : (
              <a href={l.href} className="text-base text-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { STREET_IMAGE, HERO_IMAGE };
