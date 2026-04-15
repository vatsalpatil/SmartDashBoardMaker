import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Database,
  Search,
  BarChart3,
  LayoutDashboard,
  Component,
  ChevronLeft,
  ChevronRight,
  Wand2,
  PlugZap,
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

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const location = useLocation();

  const collapsed = !isHovered;

  return (
    <>
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={[
          "relative flex flex-col h-screen border-r border-border-default bg-bg-surface shrink-0 z-40",
          "transition-[width] duration-200 ease-out",
          collapsed ? "w-[60px]" : "w-[220px]",
        ].join(" ")}
      >
        {/* ── Brand ─────────────────────────────────────── */}
        <div
          className={[
            "flex items-center h-14 border-b border-border-muted shrink-0",
            collapsed ? "justify-center" : "px-6 gap-3",
          ].join(" ")}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5 animate-fade-in min-w-0">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Layers size={15} className="text-white" />
              </div>
              <span className="font-heading text-[15px] font-bold text-text-primary tracking-tight truncate">
                Dashtor
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center animate-scale-in">
              <Layers size={16} className="text-white" />
            </div>
          )}
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden py-3 ${collapsed ? "px-0" : "px-3"}`}
        >
          <div
            className={`flex flex-col gap-0.5 ${collapsed ? "items-center" : ""}`}
          >
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  [
                    "flex items-center rounded-lg transition-all duration-150 group relative",
                    collapsed ? "w-9 h-9 justify-center" : "h-9 gap-3 px-3",
                    isActive
                      ? "border border-accent text-accent bg-accent/5"
                      : "border border-transparent text-text-tertiary hover:bg-white/5 hover:text-text-secondary",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={collapsed ? 18 : 16}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className="shrink-0"
                    />

                    {!collapsed && (
                      <span
                        className={[
                          "text-[13px] whitespace-nowrap truncate",
                          isActive ? "font-semibold" : "font-medium",
                        ].join(" ")}
                      >
                        {label}
                      </span>
                    )}

                    {/* Tooltip on collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-bg-overlay border border-border-default rounded-md text-[12px] font-medium text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                        {label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ── Bottom controls ──────────────────────────── */}
        <div
          className={`border-t border-border-muted py-2 flex flex-col gap-1 ${collapsed ? "px-0 items-center" : "px-3"}`}
        >
          {/* Theme button */}
          <button
            onClick={() => setThemeOpen(true)}
            title={collapsed ? "Theme" : undefined}
            className={[
              "flex items-center rounded-lg text-text-tertiary hover:text-accent hover:bg-accent-muted transition-all duration-150 group relative",
              collapsed ? "w-9 h-9 justify-center" : "h-8 gap-3 px-3 w-full",
            ].join(" ")}
          >
            <Palette size={collapsed ? 17 : 15} className="shrink-0" />
            {!collapsed && (
              <span className="text-[12px] font-medium">Theme</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-bg-overlay border border-border-default rounded-md text-[12px] font-medium text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                Theme
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Theme Panel Modal */}
      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
    </>
  );
}
