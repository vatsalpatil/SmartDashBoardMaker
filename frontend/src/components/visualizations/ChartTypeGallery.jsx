import React, { useState, useMemo } from "react";
import { Search, Check, Star, Clock } from "lucide-react";
import {
  CHART_CATALOG,
  CHART_CATEGORIES,
  PRESET_MAP,
} from "../../lib/chartPresets";
import {
  BarChart3,
  LineChart,
  TrendingUp,
  PieChart,
  ScatterChart,
  Activity,
  Layers,
  Table2,
  Zap,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ICON_MAP = {
  BarChart3,
  LineChart,
  TrendingUp,
  PieChart,
  ScatterChart,
  Activity,
  Layers,
  Table2,
  Zap,
  Globe,
};

// Mini chart preview SVGs for each chart type
const CHART_MINI_PREVIEWS = {
  bar: (color) => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <rect
        x={4}
        y={12}
        width={5}
        height={16}
        rx={1.5}
        fill={color}
        opacity={0.3}
      />
      <rect
        x={12}
        y={6}
        width={5}
        height={22}
        rx={1.5}
        fill={color}
        opacity={0.6}
      />
      <rect
        x={20}
        y={14}
        width={5}
        height={14}
        rx={1.5}
        fill={color}
        opacity={0.4}
      />
      <rect x={28} y={4} width={5} height={24} rx={1.5} fill={color} />
      <rect
        x={36}
        y={10}
        width={5}
        height={18}
        rx={1.5}
        fill={color}
        opacity={0.7}
      />
    </svg>
  ),
  composed: (color) => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <rect
        x={6}
        y={14}
        width={6}
        height={14}
        rx={1}
        fill={color}
        opacity={0.3}
      />
      <rect
        x={18}
        y={8}
        width={6}
        height={20}
        rx={1}
        fill={color}
        opacity={0.3}
      />
      <rect
        x={30}
        y={12}
        width={6}
        height={16}
        rx={1}
        fill={color}
        opacity={0.3}
      />
      <path
        d="M4,22 L14,14 L24,18 L34,6 L42,10"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="14" r="2" fill={color} />
      <circle cx="34" cy="6" r="2" fill={color} />
    </svg>
  ),
  line: (color) => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <path
        d="M4,22 L12,14 L20,18 L28,6 L36,12 L42,4"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14" r="2.5" fill={color} />
      <circle cx="28" cy="6" r="2.5" fill={color} />
      <circle cx="42" cy="4" r="2.5" fill={color} />
    </svg>
  ),
  area: (color) => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M2,24 L10,14 L18,20 L26,6 L34,14 L42,8 L42,28 L2,28 Z"
        fill="url(#areaGrad)"
      />
      <path
        d="M2,24 L10,14 L18,20 L26,6 L34,14 L42,8"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  pie: (color) => (
    <svg viewBox="0 0 28 28" className="w-full h-full">
      <path d="M14,14 L14,2 A12,12 0 0,1 25.5,18 Z" fill={color} opacity={1} />
      <path
        d="M14,14 L25.5,18 A12,12 0 0,1 6,24 Z"
        fill={color}
        opacity={0.6}
      />
      <path d="M14,14 L6,24 A12,12 0 0,1 14,2 Z" fill={color} opacity={0.3} />
    </svg>
  ),
  donut: (color) => (
    <svg viewBox="0 0 28 28" className="w-full h-full">
      <path d="M14,14 L14,2 A12,12 0 0,1 25.5,18 Z" fill={color} opacity={1} />
      <path
        d="M14,14 L25.5,18 A12,12 0 0,1 6,24 Z"
        fill={color}
        opacity={0.6}
      />
      <path d="M14,14 L6,24 A12,12 0 0,1 14,2 Z" fill={color} opacity={0.3} />
      <circle cx="14" cy="14" r="6" fill="var(--color-bg-surface)" />
    </svg>
  ),
  radar: (color) => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <path
        d="M16,2 L29,11 L24,27 L8,27 L3,11 Z"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity={0.2}
      />
      <path
        d="M16,7 L25,13 L21,23 L11,23 L7,13 Z"
        fill={color}
        opacity={0.4}
        stroke={color}
        strokeWidth="1.5"
      />
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        opacity={0.1}
      />
    </svg>
  ),
  radial_bar: (color) => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <path
        d="M16,4 A12,12 0 0,1 28,16"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        opacity={0.8}
      />
      <path
        d="M16,8 A8,8 0 0,1 24,16"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        opacity={0.5}
      />
      <path
        d="M16,12 A4,4 0 0,1 20,16"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        opacity={0.3}
      />
    </svg>
  ),
  funnel: (color) => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <path d="M2,2 L42,2 L36,8 L8,8 Z" fill={color} opacity={1} />
      <path d="M9,10 L35,10 L31,17 L13,17 Z" fill={color} opacity={0.6} />
      <path d="M14,19 L30,19 L26,26 L18,26 Z" fill={color} opacity={0.3} />
    </svg>
  ),
  candlestick: (color) => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <line x1="10" y1="4" x2="10" y2="24" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="8" width="8" height="10" fill={color} />
      <line x1="22" y1="8" x2="22" y2="28" stroke="#ef4444" strokeWidth="1.5" />
      <rect x="18" y="14" width="8" height="10" fill="#ef4444" />
      <line x1="34" y1="2" x2="34" y2="22" stroke={color} strokeWidth="1.5" />
      <rect x="30" y="6" width="8" height="12" fill={color} />
    </svg>
  ),
  treemap: (color) => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <rect x={0} y={0} width={26} height={18} rx={2} fill={color} />
      <rect
        x={28}
        y={0}
        width={16}
        height={18}
        rx={2}
        fill={color}
        opacity={0.5}
      />
      <rect
        x={0}
        y={20}
        width={14}
        height={8}
        rx={2}
        fill={color}
        opacity={0.7}
      />
      <rect
        x={16}
        y={20}
        width={10}
        height={8}
        rx={2}
        fill={color}
        opacity={0.3}
      />
      <rect
        x={28}
        y={20}
        width={16}
        height={8}
        rx={2}
        fill={color}
        opacity={0.4}
      />
    </svg>
  ),
  world_map: (color) => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <circle
        cx="22"
        cy="14"
        r="13"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity={0.2}
      />
      <path
        d="M12,8 Q18,6 22,10 Q26,14 22,18 Q18,22 12,20 Q8,18 12,8 Z"
        fill={color}
        opacity={0.6}
      />
      <path
        d="M28,8 Q34,6 38,10 Q42,14 38,18 Q34,22 28,20 Q24,18 28,8 Z"
        fill={color}
        opacity={0.4}
      />
    </svg>
  ),
  heatmap: (color) => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      {Array.from({ length: 15 }, (_, i) => (
        <rect
          key={i}
          x={(i % 5) * 8.5}
          y={Math.floor(i / 5) * 9.5}
          width={7}
          height={8}
          rx={1.5}
          fill={color}
          opacity={0.2 + ((i * 0.13) % 0.8)}
        />
      ))}
    </svg>
  ),
  kpi: (color) => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <text
        x="50%"
        y="65%"
        textAnchor="middle"
        fontSize="18"
        fontWeight="900"
        fill={color}
        fontFamily="Inter, sans-serif"
      >
        42K
      </text>
    </svg>
  ),
  table: () => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <rect
        x={2}
        y={2}
        width={40}
        height={6}
        rx={1}
        fill="currentColor"
        opacity={0.4}
      />
      {[10, 17, 24].map((y) => (
        <rect
          key={y}
          x={2}
          y={y}
          width={40}
          height={5}
          rx={1}
          fill="currentColor"
          opacity={0.15}
        />
      ))}
    </svg>
  ),
  pivot_table: () => (
    <svg viewBox="0 0 44 28" className="w-full h-full">
      <rect
        x={2}
        y={2}
        width={40}
        height={6}
        rx={1}
        fill="currentColor"
        opacity={0.4}
      />
      <rect
        x={2}
        y={2}
        width={12}
        height={26}
        rx={1}
        fill="currentColor"
        opacity={0.3}
      />
      {[10, 16, 22].map((y) =>
        [16, 26, 36].map((x) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={8}
            height={4}
            rx={1}
            fill="currentColor"
            opacity={0.1}
          />
        )),
      )}
    </svg>
  ),
};

const getMiniPreview = (chartType, color = "#6366f1") => {
  const fn = CHART_MINI_PREVIEWS[chartType];
  return fn ? fn(color) : CHART_MINI_PREVIEWS["bar"](color);
};

export default function ChartTypeGallery({
  config,
  onConfigChange,
  isCollapsed = false,
  onToggle,
}) {
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chart_favorites") || "[]");
    } catch {
      return [];
    }
  });

  const activeType = config?.chart_type || "bar";

  const toggleFav = (e, id) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("chart_favorites", JSON.stringify(updated));
  };

  const handleSelect = (chart) => {
    onConfigChange({
      ...config,
      chart_type: chart.chart_type,
      view_mode: chart.view_mode || "chart",
    });
  };

  const filteredCharts = useMemo(() => {
    let list = CHART_CATALOG;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q) ||
          c.bestFor.toLowerCase().includes(q),
      );
    }

    // Group by category
    const grouped = {};
    CHART_CATEGORIES.forEach(
      (cat) => (grouped[cat.id] = { ...cat, items: [] }),
    );

    list.forEach((chart) => {
      if (grouped[chart.category]) {
        grouped[chart.category].items.push(chart);
      }
    });

    return Object.values(grouped).filter((g) => g.items.length > 0);
  }, [search]);

  const renderItem = (chart) => {
    const active = activeType === chart.chart_type;
    const isFav = favorites.includes(chart.id);

    return (
      <div
        key={chart.id}
        onClick={() => handleSelect(chart)}
        className={[
          "group relative flex items-center transition-all duration-300 cursor-pointer overflow-hidden",
          isCollapsed
            ? "w-16 h-16 justify-center rounded-2xl mx-auto border-transparent"
            : "gap-3 p-2.5 rounded-xl border",
          active
            ? "border-accent/40 bg-accent/5 shadow-[0_0_20px_rgba(59,130,246,0.05)]"
            : "border-transparent hover:bg-white/5 hover:border-white/10",
        ].join(" ")}
      >
        {/* Glow effect for active state */}
        {active && (
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none" />
        )}

        {/* Active Indicator Bar */}
        {active && (
          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-accent shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
        )}

        {/* Icon container with modern elevation */}
        <div
          className={[
            "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
            active ? "scale-110 shadow-lg" : "group-hover:scale-105",
          ].join(" ")}
          style={{
            background: active ? `${chart.color}25` : "var(--color-bg-muted)",
            border: `1px solid ${active ? `${chart.color}40` : "rgba(255,255,255,0.03)"}`,
            boxShadow: active ? `0 8px 16px ${chart.color}15` : "none",
          }}
        >
          <div className="w-8 h-8">
            {getMiniPreview(
              chart.chart_type,
              active ? chart.color : chart.color,
            )}
          </div>
        </div>

        {/* Item Content */}
        {/* Item Label (Hidden when collapsed) */}
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={[
                  "text-[11px] font-bold tracking-tight truncate transition-colors",
                  active
                    ? "text-white"
                    : "text-text-secondary group-hover:text-text-primary",
                ].join(" ")}
              >
                {chart.label}
              </span>
              {active && (
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-accent/20">
                  <Check size={10} strokeWidth={3} className="text-accent" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Modern Tooltip (Detailed info) - Only show when NOT collapsed OR on hover? */}
        {/* Actually tooltips are good even in collapsed state */}
        <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 w-[calc(100%+20px)] p-2.5 rounded-xl glass shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 group-hover:bottom-[calc(100%+8px)] pointer-events-none transition-all duration-300 z-[100]">
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ color: chart.color, background: "currentColor" }}
              />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                Info
              </span>
            </div>
            <p className="text-[9px] text-text-secondary leading-normal italic font-medium">
              {chart.bestFor}
            </p>
            {/* Tooltip Arrow */}
            <div className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#0C0C0F] border-r border-b border-white/10" />
          </div>
        </div>

        {/* Favorite toggle - Hidden when collapsed */}
        {!isCollapsed && (
          <button
            onClick={(e) => toggleFav(e, chart.id)}
            className={[
              "absolute top-1.5 right-1.5 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 active:scale-90",
              isFav ? "opacity-100" : "",
            ].join(" ")}
          >
            <Star
              size={10}
              fill={isFav ? "#f59e0b" : "none"}
              stroke={isFav ? "#f59e0b" : "currentColor"}
              className={isFav ? "text-amber-400" : "text-text-quaternary"}
            />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "var(--color-bg-surface)" }}
    >
      <div className={["px-4 pt-6 pb-6 shrink-0 space-y-4 bg-bg-surface/80 backdrop-blur-xl relative z-10", !isCollapsed && "border-b border-white/5 shadow-sm"].join(' ')}>
        <div className="flex items-center justify-between">
          <div className={isCollapsed ? "w-full flex justify-center" : "flex items-center gap-2.5 min-w-0"}>
            {/* Toggle Trigger Area */}
            <div 
              onClick={onToggle}
              className={[
                "flex items-center cursor-pointer group/toggle transition-all duration-300",
                isCollapsed ? "w-7 h-7 rounded-lg bg-accent/10 hover:bg-accent hover:text-white flex items-center justify-center text-accent shadow-lg shadow-accent/10" : "gap-2"
              ].join(' ')}
            >
              {isCollapsed ? (
                <ChevronRight size={14} strokeWidth={3} className="group-hover/toggle:scale-110 transition-transform" />
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse shrink-0" />
                  <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] truncate group-hover/toggle:text-accent transition-colors">Catalog</span>
                </>
              )}
            </div>
          </div>
          {!isCollapsed && (
            <button 
              onClick={onToggle}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-accent hover:text-white flex items-center justify-center text-text-quaternary transition-all shadow-sm group"
              title="Collapse Gallery"
            >
               <ChevronLeft size={14} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className="relative group animate-in fade-in slide-in-from-top-2 duration-500">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-quaternary group-focus-within:text-accent transition-colors" />
            <input
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/5 text-[11px] text-text-primary placeholder-text-quaternary outline-none focus:border-accent/50 focus:bg-accent/5 focus:ring-4 focus:ring-accent/10 transition-all duration-300 shadow-inner"
              style={{ background: "rgba(255,255,255,0.02)" }}
              placeholder="Search charts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      <div
        className={[
          "flex-1 overflow-y-auto custom-scrollbar transition-all",
          isCollapsed ? "p-0 pt-3 space-y-4" : "p-2 space-y-3",
        ].join(" ")}
      >
        {/* Favorites Section */}
        {favorites.length > 0 && !search && (
          <div>
            <div className="flex items-center gap-1.5 px-1 py-1 mb-1">
              <Star size={9} fill="#f59e0b" className="text-amber-400" />
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-[0.15em]">
                Favorites
              </span>
            </div>
            <div className="flex flex-col gap-1.5 px-1">
              {favorites.map((id) => {
                const chart = PRESET_MAP[id];
                return chart ? renderItem(chart) : null;
              })}
            </div>
          </div>
        )}

        {/* Categories */}
        {filteredCharts.map((group) => (
          <div key={group.id} className="px-1">
            {!isCollapsed && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="h-px flex-1 bg-border-muted" />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-text-quaternary whitespace-nowrap">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-border-muted" />
              </div>
            )}
            <div className="flex flex-col gap-1.5 px-1">
              {group.items.map(renderItem)}
            </div>
          </div>
        ))}
      </div>

      {/* Active Selection Info */}
      {!isCollapsed && (
        <div className="shrink-0 px-3 py-2 border-t border-border-muted bg-bg-muted">
          {(() => {
            const activeItem = PRESET_MAP[activeType];
            if (!activeItem) return null;
            return (
              <div className="flex items-start gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                  style={{ background: activeItem.color }}
                />
                <div>
                  <p className="text-[9px] font-black text-text-primary uppercase tracking-wide">
                    {activeItem.label}
                  </p>
                  <p className="text-[8px] text-text-quaternary leading-tight mt-0.5">
                    {activeItem.bestFor}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
