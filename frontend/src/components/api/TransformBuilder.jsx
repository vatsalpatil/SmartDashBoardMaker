import { useState } from "react";
import {
  SlidersHorizontal, Plus, X, ArrowDownUp, Calculator,
  ChevronDown, Filter, ArrowUp, ArrowDown, Sparkles, AlertCircle
} from "lucide-react";
import { inputStyle, labelStyle, TYPE_COLOR } from "./shared";
import { Btn, TypePill } from "./Atoms";

const FILTER_OPS = [
  { value: "contains",     label: "contains",      group: "text" },
  { value: "not_contains", label: "not contains",  group: "text" },
  { value: "starts_with",  label: "starts with",   group: "text" },
  { value: "equals",       label: "= equals",      group: "both" },
  { value: "gt",           label: "> greater than", group: "number" },
  { value: "lt",           label: "< less than",    group: "number" },
  { value: "gte",          label: "≥ greater/eq",   group: "number" },
  { value: "lte",          label: "≤ less/eq",      group: "number" },
];

export default function TransformBuilder({
  cols, filters, setFilters, sort, setSort,
  computedCols, setComputedCols, filterLogic, setFilterLogic,
  onBack, isSidePanel
}) {
  const [tab, setTab] = useState("filters");

  const selCols = cols.filter(c => c.selected);
  const activeFilters = filters.filter(f => f.active && f.column);
  const activeComputed = computedCols.filter(c => c.name && c.expr);

  const addFilter = () => setFilters(f => [...f, { column: "", op: "contains", value: "", active: true }]);
  const remFilter = (i) => setFilters(f => f.filter((_, j) => j !== i));
  const updFilter = (i, f, v) => setFilters(fs => { const n = [...fs]; n[i] = { ...n[i], [f]: v }; return n; });

  const addComputed = () => setComputedCols(c => [...c, { name: "", expr: "" }]);
  const remComputed = (i) => setComputedCols(c => c.filter((_, j) => j !== i));
  const updComputed = (i, f, v) => setComputedCols(cs => { const n = [...cs]; n[i] = { ...n[i], [f]: v }; return n; });

  const TABS = [
    { id: "filters",  label: "Filters",         badge: activeFilters.length,  icon: Filter },
    { id: "sort",     label: "Sort",             badge: sort.column ? 1 : 0,   icon: ArrowDownUp },
    { id: "computed", label: "Computed",         badge: activeComputed.length, icon: Calculator },
  ];

  return (
    <div
      style={{
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-border-default)",
        borderRadius: 20,
        boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}
      className="animate-slide-up"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border-default bg-bg-surface/30">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet/15 border border-violet/20 flex items-center justify-center shrink-0">
            <SlidersHorizontal size={15} className="text-violet" />
          </div>
          <div>
            <div className="font-black text-[14px] text-text-primary">Transform Engine</div>
            <div className="text-[11px] text-text-quaternary">Filter · Sort · Compute</div>
          </div>
          {(activeFilters.length > 0 || sort.column || activeComputed.length > 0) && (
            <div className="ml-auto flex items-center gap-1.5 text-[10px] font-black text-amber bg-amber/10 border border-amber/20 px-2.5 py-1 rounded-full">
              <Sparkles size={9} />
              ACTIVE
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-border-default bg-bg-surface/20">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex-1 flex items-center justify-center gap-2 py-3 px-2 text-[12px] font-black transition-all border-b-2",
              tab === t.id
                ? "border-accent text-accent bg-accent/5"
                : "border-transparent text-text-quaternary hover:text-text-secondary hover:bg-bg-surface/50"
            ].join(" ")}
          >
            <t.icon size={13} />
            {t.label}
            {t.badge > 0 && (
              <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                tab === t.id ? "bg-accent text-white" : "bg-bg-muted text-text-tertiary"
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">

        {/* ── FILTERS ── */}
        {tab === "filters" && (
          <div className="flex flex-col gap-4">
            {/* Logic Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-quaternary shrink-0">Match</span>
              <div className="flex bg-bg-base border border-border-muted rounded-lg p-0.5 gap-0.5">
                {["AND", "OR"].map(l => (
                  <button
                    key={l}
                    onClick={() => setFilterLogic(l)}
                    className={[
                      "px-4 py-1.5 rounded-md text-[11px] font-black transition-all",
                      filterLogic === l
                        ? "bg-accent text-white shadow-sm shadow-accent/30"
                        : "text-text-quaternary hover:text-text-secondary"
                    ].join(" ")}
                  >
                    {l === "AND" ? "All Match" : "Any Match"}
                  </button>
                ))}
              </div>
              <button
                onClick={addFilter}
                className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-accent/10 text-accent border border-accent/25 rounded-lg text-[11px] font-black hover:bg-accent/20 transition-colors"
              >
                <Plus size={12} /> Add Filter
              </button>
            </div>

            {/* Filter Rows */}
            {filters.length === 0 ? (
              <EmptyState icon={Filter} text="No filters applied. All rows are visible." />
            ) : (
              <div className="flex flex-col gap-2.5">
                {filters.map((f, i) => {
                  const colMeta = selCols.find(c => (c.alias || c.label) === f.column);
                  const colType = colMeta?.type || "string";
                  return (
                    <div
                      key={i}
                      className={[
                        "rounded-xl border transition-all",
                        f.active
                          ? "bg-bg-base border-border-muted"
                          : "bg-bg-base/40 border-border-muted/40 opacity-60"
                      ].join(" ")}
                    >
                      {/* Column row */}
                      <div className="flex items-center gap-2 px-3 pt-3">
                        <select
                          value={f.column}
                          onChange={e => updFilter(i, "column", e.target.value)}
                          className={[
                            "flex-1 text-[12px] font-bold rounded-lg px-3 py-2 outline-none border transition-colors",
                            f.column
                              ? "bg-bg-surface border-border-default text-text-primary"
                              : "bg-bg-surface border-border-muted text-text-quaternary"
                          ].join(" ")}
                          style={{ fontFamily: "var(--font-family-sans)" }}
                        >
                          <option value="">Choose column…</option>
                          {selCols.map(c => {
                            const name = c.alias || c.label;
                            return <option key={c.originalKey} value={name}>{name}</option>;
                          })}
                        </select>

                        {/* Active toggle */}
                        <button
                          onClick={() => updFilter(i, "active", !f.active)}
                          title={f.active ? "Disable filter" : "Enable filter"}
                          className={[
                            "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors shrink-0",
                            f.active
                              ? "bg-accent/15 border-accent/30 text-accent"
                              : "bg-bg-surface border-border-muted text-text-quaternary"
                          ].join(" ")}
                        >
                          <SlidersHorizontal size={13} />
                        </button>

                        <button onClick={() => remFilter(i)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-quaternary hover:bg-rose/10 hover:text-rose border border-transparent hover:border-rose/20 transition-colors shrink-0">
                          <X size={13} />
                        </button>
                      </div>

                      {/* Op + Value row */}
                      <div className="flex items-center gap-2 px-3 pb-3 pt-2">
                        {colType && f.column && (
                          <TypePill type={colType} />
                        )}
                        <select
                          value={f.op}
                          onChange={e => updFilter(i, "op", e.target.value)}
                          className="text-[11px] font-bold rounded-lg px-2.5 py-2 bg-bg-surface border border-border-muted outline-none text-text-secondary transition-colors hover:border-border-default shrink-0"
                          style={{ fontFamily: "var(--font-family-sans)" }}
                        >
                          {FILTER_OPS.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                        <input
                          value={f.value}
                          onChange={e => updFilter(i, "value", e.target.value)}
                          placeholder="Filter value…"
                          className="flex-1 text-[12px] font-mono bg-bg-surface border border-border-muted rounded-lg px-3 py-2 text-text-primary outline-none placeholder:text-text-quaternary focus:border-accent/50 transition-colors"
                        />
                      </div>

                      {/* AND/OR between rows */}
                      {i < filters.length - 1 && (
                        <div className="flex items-center gap-2 px-4 py-1 border-t border-border-muted/40 bg-bg-surface/30">
                          <div className="flex-1 h-px bg-border-muted/40" />
                          <span className="text-[9px] font-black text-text-quaternary px-2 py-0.5 bg-bg-raised border border-border-muted rounded">
                            {filterLogic}
                          </span>
                          <div className="flex-1 h-px bg-border-muted/40" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SORT ── */}
        {tab === "sort" && (
          <div className="flex flex-col gap-4">
            <div>
              <label style={labelStyle}>Sort Column</label>
              <select
                value={sort.column}
                onChange={e => setSort(s => ({ ...s, column: e.target.value }))}
                className="w-full text-[13px] rounded-xl px-4 py-3 bg-bg-base border border-border-muted outline-none text-text-primary font-bold focus:border-accent/50 transition-colors"
                style={{ fontFamily: "var(--font-family-sans)" }}
              >
                <option value="">— Default order —</option>
                {selCols.map(c => {
                  const name = c.alias || c.label;
                  return <option key={c.originalKey} value={name}>{name}</option>;
                })}
              </select>
            </div>

            {sort.column && (
              <div>
                <label style={labelStyle}>Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { dir: "asc",  icon: ArrowUp,   label: "Ascending",  sub: "A → Z, 0 → 9" },
                    { dir: "desc", icon: ArrowDown,  label: "Descending", sub: "Z → A, 9 → 0" },
                  ].map(({ dir, icon: Icon, label, sub }) => (
                    <button
                      key={dir}
                      onClick={() => setSort(s => ({ ...s, dir }))}
                      className={[
                        "flex flex-col items-center gap-1 py-4 px-3 rounded-xl border transition-all text-center",
                        sort.dir === dir
                          ? "bg-accent/10 border-accent/40 text-accent"
                          : "bg-bg-base border-border-muted text-text-tertiary hover:border-border-default hover:text-text-secondary"
                      ].join(" ")}
                    >
                      <Icon size={18} />
                      <div className="text-[12px] font-black">{label}</div>
                      <div className="text-[10px] font-medium opacity-70">{sub}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setSort({ column: "", dir: "asc" })}
                  className="w-full mt-3 py-2 text-[11px] font-bold text-text-quaternary hover:text-rose border border-dashed border-border-muted hover:border-rose/30 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <X size={12} /> Clear Sort
                </button>
              </div>
            )}

            {!sort.column && (
              <EmptyState icon={ArrowDownUp} text="Select a column above to define the sort order." />
            )}
          </div>
        )}

        {/* ── COMPUTED COLUMNS ── */}
        {tab === "computed" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-bold text-text-secondary">Computed Fields</div>
                <div className="text-[11px] text-text-quaternary mt-0.5">Use column names in expressions</div>
              </div>
              <button
                onClick={addComputed}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-violet/10 text-violet border border-violet/25 rounded-lg text-[11px] font-black hover:bg-violet/20 transition-colors"
              >
                <Plus size={12} /> New Field
              </button>
            </div>

            {/* Available columns hint */}
            {selCols.length > 0 && (
              <div className="p-3 bg-bg-surface border border-border-muted rounded-xl text-[11px]">
                <div className="text-text-quaternary font-bold mb-2 flex items-center gap-1.5"><AlertCircle size={11} /> Available column names:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selCols.map(c => (
                    <code key={c.originalKey} className="px-2 py-0.5 bg-bg-raised border border-border-muted rounded text-[10px] text-violet-400 font-bold">
                      {c.alias || c.label}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {computedCols.length === 0 ? (
              <EmptyState icon={Calculator} text="No computed columns. Create formulas using existing column values." />
            ) : (
              <div className="flex flex-col gap-3">
                {computedCols.map((cc, i) => (
                  <div key={i} className="bg-bg-base border border-border-muted rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={cc.name}
                        onChange={e => updComputed(i, "name", e.target.value)}
                        placeholder="field_name"
                        className="flex-1 text-[13px] font-bold font-mono bg-bg-surface border border-border-muted rounded-lg px-3 py-2 text-violet-400 outline-none focus:border-violet/50 placeholder:text-text-quaternary transition-colors"
                      />
                      <button onClick={() => remComputed(i)} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-quaternary hover:bg-rose/10 hover:text-rose border border-transparent hover:border-rose/20 transition-colors shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black text-text-quaternary font-mono shrink-0">=</span>
                      <div className="relative flex-1">
                        <Calculator size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-quaternary" />
                        <input
                          value={cc.expr}
                          onChange={e => updComputed(i, "expr", e.target.value)}
                          placeholder="e.g. revenue - cost"
                          className="w-full pl-8 pr-3 py-2 text-[12px] font-mono bg-bg-surface border border-border-muted rounded-lg text-text-primary outline-none focus:border-violet/50 placeholder:text-text-quaternary transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back button (not side panel) */}
      {!isSidePanel && (
        <div className="px-5 pb-5">
          <Btn variant="ghost" onClick={onBack} className="w-full">Back to Schema</Btn>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border-muted flex items-center justify-center text-text-quaternary">
        <Icon size={18} />
      </div>
      <p className="text-[12px] text-text-quaternary max-w-[200px] leading-relaxed">{text}</p>
    </div>
  );
}
