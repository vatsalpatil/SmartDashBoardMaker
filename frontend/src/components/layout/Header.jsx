import { useState } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import {
  ChevronRight,
  Home,
  Database,
  Search,
  BarChart3,
  LayoutDashboard,
  Component,
  Wand2,
  Layers,
  Palette,
} from "lucide-react";
import ThemePanel from "./ThemePanel";

const navItems = [
  { to: "/", icon: Database, label: "Data Sources", end: true },
  { to: "/query", icon: Search, label: "SQL Editor" },
  { to: "/custom", icon: Wand2, label: "Builder" },
  { to: "/visualize", icon: BarChart3, label: "Visualize" },
  { to: "/widgets", icon: Component, label: "Widgets" },
  { to: "/dashboards", icon: LayoutDashboard, label: "Dashboards" },
];

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
  const [themeOpen, setThemeOpen] = useState(false);
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
    <header className="h-14 bg-bg-surface border-b border-border-default flex items-center shrink-0 z-50 sticky top-0 shadow-sm">
      <div className="w-full flex items-center h-full px-6">
        {/* Left Area: Branding */}
        <div className="flex-1 flex items-center justify-start min-w-0">
          <div 
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0 shadow-glow-accent">
              <Layers size={18} className="text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-text-primary tracking-tight hidden lg:block">
              Dashtor
            </span>
          </div>
        </div>

        {/* Center Area: Navigation */}
        <nav className="flex items-center gap-5 flex-none h-full">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "flex items-center h-10 px-3.5 gap-2.5 rounded-lg transition-all duration-200 group whitespace-nowrap",
                  isActive
                    ? "text-accent bg-accent-muted/50 font-semibold"
                    : "text-text-tertiary hover:bg-bg-muted hover:text-text-primary",
                ].join(" ")
              }
            >
              <Icon size={16} />
              <span className="text-[13px]">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Area: Actions */}
        <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-base border border-border-muted shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_8px_var(--color-emerald)] animate-pulse" />
            <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest leading-none">
              Active
            </span>
          </div>

          {/* Theme Button */}
          <button
            onClick={() => setThemeOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent-muted transition-all duration-150 shrink-0"
            title="Theme Settings"
          >
            <Palette size={18} />
          </button>

          {/* Profile */}
          <div className="w-8 h-8 rounded-full bg-bg-raised border border-border-default flex items-center justify-center text-text-quaternary text-[11px] font-bold shadow-sm shrink-0">
            VS
          </div>
        </div>
      </div>

      {/* Theme Panel Modal */}
      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
    </header>
  );
}
