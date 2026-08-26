import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/ui/kit";

const CONTACT_EMAIL = "info@sentrihq.com";

/**
 * Placeholders. These deliberately do NOT contain invented legal text — a
 * privacy policy or terms of service has to be written for the actual business
 * by someone qualified. Replace the body of each with the real document.
 */
const PAGES = {
  privacy: {
    title: "Privacy Policy",
    lead: "How SentriBiD handles your company information and the documents you upload.",
  },
  terms: {
    title: "Terms of Service",
    lead: "The agreement between you and SentriBiD when you use the product.",
  },
} as const;

export default function LegalPage({ page }: { page: keyof typeof PAGES }) {
  const { title, lead } = PAGES[page];

  useEffect(() => {
    document.title = `${title} · SentriBiD`;
  }, [title]);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-content items-center px-5 sm:px-8">
          <Link to="/" className="text-[19px] font-semibold tracking-[-0.02em] text-brand-700">
            SentriBiD
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-prose px-5 py-20 sm:px-8">
        <h1 className="text-h1">{title}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-muted">{lead}</p>

        <div className="mt-10 rounded-card border border-line bg-canvas p-6">
          <div className="flex gap-3">
            <Icon name="info" className="mt-0.5 text-[20px] text-brand-600" />
            <div>
              <p className="text-h3 text-ink">We're finalising this document.</p>
              <p className="mt-2 text-base leading-relaxed text-body">
                Until it's published here, email us and we'll answer any question about how your
                data is handled directly.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(title)}`}
                className="mt-4 inline-flex items-center gap-1.5 text-base font-medium text-brand-600 hover:text-brand-700"
              >
                {CONTACT_EMAIL}
                <Icon name="arrow_forward" className="text-[16px]" />
              </a>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="mt-10 inline-flex items-center gap-1.5 text-base font-medium text-muted hover:text-ink"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          Back to the homepage
        </Link>
      </main>
    </div>
  );
}
