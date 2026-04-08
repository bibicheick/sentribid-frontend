import { NavLink } from "react-router-dom";

export default function Shell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark" />
          <div>
            <div className="brandTitle">
              Sentri<span>BiD</span>
            </div>
            <div className="brandSub">AI-Powered Bid Intelligence</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/bids" className={({ isActive }) => (isActive ? "active" : "")}>
            🗂️ <span>My Bids</span>
          </NavLink>
          <NavLink to="/bids/new" className={({ isActive }) => (isActive ? "active" : "")}>
            ➕ <span>Create Bid</span>
          </NavLink>
          <a href="#" onClick={(e) => e.preventDefault()}>
            ⚙️ <span>Settings</span>
          </a>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>

        {children}
      </main>
    </div>
  );
}
