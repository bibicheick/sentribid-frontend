import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { Avatar, Icon, cx } from "@/ui/kit";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "space_dashboard", end: true },
  { to: "/find-work", label: "Find Work", icon: "travel_explore" },
  { to: "/pipeline", label: "Pipeline", icon: "view_kanban" },
  { to: "/bids", label: "My Bids", icon: "description" },
  { to: "/settings", label: "Settings", icon: "tune" },
];

type Me = { name: string; company: string };

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [me, setMe] = useState<Me>({ name: "", company: "" });
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const next: Me = { name: "", company: "" };
      try {
        const r = await api.get("/auth/me");
        next.name = r.data?.full_name || r.data?.username || r.data?.email || "";
        next.company = r.data?.company_name || "";
      } catch {
        /* not fatal — the shell still renders */
      }
      if (!next.company) {
        try {
          const r = await api.get("/profile");
          next.company = r.data?.company_name || "";
        } catch {
          /* ignore */
        }
      }
      if (alive) setMe(next);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar me={me} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="lg:pl-sidebar">
        <TopBar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-content px-5 pb-24 pt-6 sm:px-8 sm:pb-16 lg:px-page">
          <Outlet />
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────── */

function Sidebar({ me, open, onClose }: { me: Me; open: boolean; onClose: () => void }) {
  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-sidebar flex-col border-r border-line bg-surface",
          "transition-transform duration-200 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Wordmark />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="text-muted lg:hidden"
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <Link
            to="/bids/new"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-control bg-brand-600 text-base font-medium text-white shadow-card transition-colors hover:bg-brand-700"
          >
            <Icon name="add" className="text-[18px]" />
            New Bid
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  "group flex items-center gap-3 rounded-control px-3 py-2 text-base font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted hover:bg-sunken hover:text-body"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    filled={isActive}
                    className={cx("text-[20px]", isActive ? "text-brand-600" : "text-faint group-hover:text-muted")}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <UserMenu me={me} />
      </aside>
    </>
  );
}

function Wordmark() {
  return (
    <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
      Sentri<span className="text-brand-600">BiD</span>
    </span>
  );
}

/* ── User menu ────────────────────────────────────────────────────────── */

function UserMenu({ me }: { me: Me }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const display = me.name || me.company || "Your account";

  function signOut() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <div ref={ref} className="relative border-t border-line p-3">
      {open ? (
        <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-card border border-line bg-surface py-1 shadow-pop">
          <Link
            to="/settings"
            className="flex items-center gap-2.5 px-3 py-2 text-base text-body hover:bg-sunken"
          >
            <Icon name="tune" className="text-[18px] text-faint" />
            Company profile
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-base text-body hover:bg-sunken"
          >
            <Icon name="logout" className="text-[18px] text-faint" />
            Sign out
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-control px-2 py-2 text-left transition-colors hover:bg-sunken"
      >
        <Avatar name={display} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium text-ink">{display}</span>
          {me.company && me.company !== display ? (
            <span className="block truncate text-meta text-muted">{me.company}</span>
          ) : null}
        </span>
        <Icon name={open ? "expand_more" : "expand_less"} className="text-[18px] text-faint" />
      </button>
    </div>
  );
}

/* ── Top bar ──────────────────────────────────────────────────────────── */

function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/bids?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-content items-center gap-3 px-5 sm:px-8 lg:px-page">
        <button
          type="button"
          onClick={onOpenMenu}
          className="-ml-1 text-muted lg:hidden"
          aria-label="Open menu"
        >
          <Icon name="menu" className="text-[22px]" />
        </button>

        <div className="lg:hidden">
          <Wordmark />
        </div>

        <form onSubmit={submit} className="relative ml-auto hidden w-full max-w-xs sm:block">
          <Icon
            name="search"
            className="icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-faint"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search bids and contracts"
            aria-label="Search"
            className="h-9 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-base text-ink shadow-card transition-colors placeholder:text-faint hover:border-[#D7DAE0] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
          />
        </form>

        <Link
          to="/bids?status=pending"
          aria-label="Items waiting on you"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-sunken hover:text-body sm:ml-0"
        >
          <Icon name="notifications" className="text-[20px]" />
        </Link>
      </div>
    </header>
  );
}

/* ── Mobile tab bar ───────────────────────────────────────────────────── */

function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                isActive ? "text-brand-700" : "text-faint"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} filled={isActive} className="text-[22px]" />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
