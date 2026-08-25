import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/ui/kit";

/**
 * Backdrop for the left panel, from the Stitch design. It sits under a heavy
 * white wash so the text stays readable — it's texture, not a picture.
 *
 * WARNING: this points at Google's Stitch CDN, which is temporary. Save the
 * file into `public/` and change this to "/auth-backdrop.png".
 */
const BACKDROP =
  "https://lh3.googleusercontent.com/aida/AEtjO1UmxMeYzkC7wKG-Qtx-_uFP0tKEtW0eKuVgj248Ps26c3AhIPBehHnmZRgfuS9fQE5dW9k7E4qQ25mU3ysNnxLbrPqwyVzp8DC8aiM6HewqUVl8parreztHAZRFwlMZ5DG5hGdJk8z1gFfbZpXvp9gXw4tkZHxH-XAaWtgVsv9J5ndKgs0bGh_Y9MB7Uca5FQ_GmBr85DLULrzgh94Ob_0BCo9CLypWO3VZ2iCZ8bh1lTlQb9tRgAbqFsV8";

const POINTS = [
  {
    icon: "travel_explore",
    title: "Find the work",
    body: "Search every open federal contract, or let SentriBiD surface the ones that fit your business.",
  },
  {
    icon: "fact_check",
    title: "Know what's worth bidding",
    body: "Upload the solicitation and get a straight answer on your odds before you spend a week on it.",
  },
  {
    icon: "draft",
    title: "Get the proposal written",
    body: "Requirements pulled out, pricing built, and a first draft ready to edit.",
  },
];

export default function AuthLayout({
  title,
  summary,
  children,
  footer,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} · SentriBiD`;
  }, [title]);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Left: the pitch. Hidden on small screens — nobody signs in to read it. */}
      <aside
        className="hidden w-[46%] max-w-xl flex-col justify-between border-r border-line bg-surface bg-cover bg-center p-12 lg:flex"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.88)), url("${BACKDROP}")`,
        }}
      >
        <Link to="/" className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
          Sentri<span className="text-brand-600">BiD</span>
        </Link>

        <div className="max-w-sm">
          <h2 className="text-display text-ink">
            Government contracts, without the guesswork.
          </h2>
          <ul className="mt-10 space-y-7">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                  <Icon name={p.icon} className="text-[18px]" />
                </span>
                <div>
                  <p className="text-h3 text-ink">{p.title}</p>
                  <p className="mt-1 text-base text-muted">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-meta text-faint">© {new Date().getFullYear()} SentriBiD</p>
      </aside>

      {/* Right: the form */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-10 block text-[19px] font-semibold tracking-[-0.02em] text-ink lg:hidden"
          >
            Sentri<span className="text-brand-600">BiD</span>
          </Link>

          <h1 className="text-h1">{title}</h1>
          <p className="mt-1.5 text-base text-muted">{summary}</p>

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8 text-base text-muted">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
