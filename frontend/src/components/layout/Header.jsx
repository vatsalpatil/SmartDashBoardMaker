// src/components/layout/Header.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeMeta = {
  "/": { title: "Datasets", crumbs: [] },
  "/upload": {
    title: "Upload Dataset",
    crumbs: [{ label: "Datasets", to: "/" }],
  },
  "/query": { title: "SQL Editor", crumbs: [] },
  "/custom": { title: "Visual SQL Builder", crumbs: [] },
  "/api": { title: "API Integration", crumbs: [] },
  "/visualize": { title: "Visualization Builder", crumbs: [] },
  "/dashboards": { title: "Dashboards", crumbs: [] },
  "/widgets": { title: "Widgets", crumbs: [] },
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  let meta = routeMeta[location.pathname];
  if (!meta) {
    if (location.pathname.startsWith("/dataset/")) {
      meta = {
        title: "Dataset Details",
        crumbs: [{ label: "Datasets", to: "/" }],
      };
    } else {
      meta = { title: "VeryDash", crumbs: [] };
    }
  }

  return (
    <header className="h-16 bg-bg-surface border-b border-border-default flex items-center shrink-0 z-30">
      <div className="w-full flex items-center justify-between px-5">
        {/* Left: Breadcrumbs + Title */}
        <div className="flex items-center gap-3 min-w-0">
          {meta.crumbs.length > 0 && (
            <div className="flex items-center gap-2 text-text-quaternary text-[12px]">
              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-bg-muted hover:text-text-secondary transition-all"
                title="Home"
              >
                <Home size={14} />
              </button>
              {meta.crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-2">
                  <ChevronRight size={20} className="opacity-30" />
                  <button
                    onClick={() => navigate(c.to)}
                    className="hover:text-text-secondary transition-colors font-medium"
                  >
                    {c.label}
                  </button>
                </span>
              ))}
              <ChevronRight size={20} className="opacity-30" />
            </div>
          )}

          <h2
            className="text-[14px] font-black text-text-primary tracking-tight truncate"
          >
            {meta.title}
          </h2>
        </div>

        {/* Right: Engine Status */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-base border border-border-muted shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_8px_var(--color-emerald)] animate-pulse" />
            <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">
              Engine Active
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-bg-raised border border-border-default flex items-center justify-center text-text-quaternary text-[10px] font-bold">
            VS
          </div>
        </div>
      </div>
    </header>
  );
}
