import { useState, useMemo } from "react";
import { Table2, Download, Braces, ChevronLeft, ChevronRight, Check, Eye, EyeOff, Search, ArrowUpDown, ArrowUp, ArrowDown, FileJson, FileSpreadsheet, Filter, Plus, X, SlidersHorizontal, Save, Sparkles } from "lucide-react";
import { Btn, TypePill } from "./Atoms";

const ROWS_PER_PAGE = 20;

const FILTER_OPS = [
  { value: "contains",     label: "contains" },
  { value: "not_contains", label: "not contains" },
  { value: "starts_with",  label: "starts with" },
  { value: "equals",       label: "= equals" },
  { value: "gt",           label: "> greater than" },
  { value: "lt",           label: "< less than" },
  { value: "gte",          label: "≥ greater/eq" },
  { value: "lte",          label: "≤ less/eq" },
];

export default function DataExplorer({ 
  previewRows, cols, onBack, 
  filters, setFilters, filterLogic, setFilterLogic,
  onSaveDataset, isSaving 
}) {
  const [pg, setPg] = useState(1);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [showColPanel, setShowColPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const selCols = cols.filter(c => c.selected);
  const activeFilters = filters.filter(f => f.active && f.column);

  const allColNames = useMemo(() => selCols.map(c => c.alias || c.label), [selCols]);

  const [visibleCols, setVisibleCols] = useState(() =>
    allColNames.reduce((acc, n) => ({ ...acc, [n]: true }), {})
  );

  const visibleColNames = allColNames.filter(n => visibleCols[n] !== false);

  const toggleCol = (name) => setVisibleCols(v => ({ ...v, [name]: !v[name] }));
  const toggleAll = (val) => setVisibleCols(allColNames.reduce((acc, n) => ({ ...acc, [n]: val }), {}));

  // Table-level sort
  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPg(1);
  };

  const sortedRows = useMemo(() => {
    if (!sortCol) return previewRows;
    return [...previewRows].sort((a, b) => {
      const va = a[sortCol], vb = b[sortCol];
      if (typeof va === "number" && typeof vb === "number")
        return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc"
        ? String(va ?? "").localeCompare(String(vb ?? ""))
        : String(vb ?? "").localeCompare(String(va ?? ""));
    });
  }, [previewRows, sortCol, sortDir]);

  // Row-level search
  const filteredRows = useMemo(() => {
    if (!search.trim()) return sortedRows;
    const q = search.toLowerCase();
    return sortedRows.filter(row =>
      visibleColNames.some(col => String(row[col] ?? "").toLowerCase().includes(q))
    );
  }, [sortedRows, search, visibleColNames]);

  const totPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const pagedRows = filteredRows.slice((pg - 1) * ROWS_PER_PAGE, pg * ROWS_PER_PAGE);

  const exportCSV = () => {
    if (!previewRows.length) return;
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const csv = [
      visibleColNames.map(c => escapeCSV(c)).join(","),
      ...previewRows.map(r => visibleColNames.map(h => escapeCSV(r[h])).join(","))
    ].join("\n");
    download(csv, "text/csv", `api_export_${Date.now()}.csv`);
  };

  const hiddenCount = allColNames.length - visibleColNames.length;

  const addFilter = () => {
    setFilters(f => [...f, { column: "", op: "contains", value: "", active: true }]);
    setShowFilters(true);
  };
  const remFilter = (i) => setFilters(f => f.filter((_, j) => j !== i));
  const updFilter = (i, f, v) => setFilters(fs => { const n = [...fs]; n[i] = { ...n[i], [f]: v }; return n; });

  return (
    <div
      style={{
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-border-default)",
        borderRadius: 20,
        boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}
      className="animate-slide-up flex flex-col"
    >
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border-default bg-bg-surface/30 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
            <Table2 size={15} className="text-accent" />
          </div>
          <div>
            <div className="font-black text-[14px] text-text-primary">Data Explorer</div>
            <div className="text-[11px] text-text-quaternary">
              <span className="text-emerald font-bold">{filteredRows.length}</span> rows
              {" · "}<span className="text-accent font-bold">{visibleColNames.length}</span> cols
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={[
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold transition-colors",
              showFilters || activeFilters.length > 0
                ? "bg-violet/10 border-violet/30 text-violet"
                : "bg-bg-base border-border-muted text-text-secondary hover:border-border-default"
            ].join(" ")}
          >
            <Filter size={13} />
            Filters
            {activeFilters.length > 0 && (
              <span className="bg-violet/20 text-violet px-1.5 py-0.5 rounded text-[9px] font-black">{activeFilters.length}</span>
            )}
          </button>

          {/* Column Visibility */}
          <div className="relative">
            <button
              onClick={() => setShowColPanel(!showColPanel)}
              className={[
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold transition-colors",
                showColPanel || hiddenCount > 0
                  ? "bg-amber/10 border-amber/30 text-amber"
                  : "bg-bg-base border-border-muted text-text-secondary hover:border-border-default"
            ].join(" ")}
            >
              <Eye size={13} />
              Columns
              {hiddenCount > 0 && (
                <span className="bg-amber/20 text-amber px-1.5 py-0.5 rounded text-[9px] font-black">{hiddenCount} hidden</span>
              )}
            </button>
            {showColPanel && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-bg-overlay border border-border-default rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                <div className="px-4 py-3 border-b border-border-muted flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-quaternary">Select Columns</span>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAll(true)} className="text-[10px] font-bold text-accent hover:underline">All</button>
                    <span className="text-text-quaternary">·</span>
                    <button onClick={() => toggleAll(false)} className="text-[10px] font-bold text-text-quaternary hover:text-rose hover:underline">None</button>
                  </div>
                </div>
                <div className="p-3 flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {allColNames.map(name => (
                    <button
                      key={name}
                      onClick={() => toggleCol(name)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-surface transition-colors text-left"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${visibleCols[name] !== false ? "bg-accent border-accent" : "border-border-strong bg-transparent"}`}>
                        {visibleCols[name] !== false && <Check size={9} className="text-white" />}
                      </div>
                      <span className="text-[12px] font-bold text-text-primary truncate">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-muted bg-bg-base text-text-secondary text-[11px] font-bold hover:bg-bg-surface transition-colors">
            <Download size={13} /> CSV
          </button>

          <button 
            onClick={onSaveDataset} 
            disabled={isSaving || filteredRows.length === 0}
            className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald text-white text-[12px] font-black hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald/20 disabled:opacity-50"
          >
            <Save size={14} />
            {isSaving ? "Saving..." : "Save as Dataset"}
          </button>
        </div>
      </div>

      {/* ── FILTER BUILDER ── */}
      {showFilters && (
        <div className="border-b border-border-default bg-bg-surface/20 p-5 animate-slide-up relative">
          <button onClick={() => setShowFilters(false)} className="absolute top-3 right-3 text-text-quaternary hover:text-text-primary transition-colors">
            <X size={14} />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-quaternary">Filter Logic</span>
            <div className="flex bg-bg-base border border-border-muted rounded-lg p-0.5 gap-0.5">
              {["AND", "OR"].map(l => (
                <button
                  key={l}
                  onClick={() => setFilterLogic(l)}
                  className={`px-3 py-1 rounded text-[11px] font-black transition-all ${filterLogic === l ? "bg-accent text-white shadow-sm" : "text-text-quaternary hover:text-text-secondary"}`}
                >
                  {l === "AND" ? "All Match" : "Any Match"}
                </button>
              ))}
            </div>
            <button
              onClick={addFilter}
              className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-violet/10 text-violet border border-violet/25 rounded-lg text-[11px] font-black hover:bg-violet/20 transition-colors"
            >
              <Plus size={12} /> Add Rule
            </button>
          </div>

          {filters.length === 0 ? (
            <div className="text-center py-6 text-text-quaternary text-[12px] italic border border-dashed border-border-muted rounded-xl">
              No filter rules applied.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filters.map((f, i) => {
                const colMeta = selCols.find(c => (c.alias || c.label) === f.column);
                return (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${f.active ? "bg-bg-base border-border-muted" : "bg-bg-base/40 border-border-muted/40 opacity-60"}`}>
                    <select
                      value={f.column}
                      onChange={e => updFilter(i, "column", e.target.value)}
                      className={`text-[12px] font-bold rounded-lg px-3 py-1.5 outline-none border transition-colors ${f.column ? "bg-bg-surface border-border-default text-text-primary" : "bg-bg-surface border-border-muted text-text-quaternary"}`}
                    >
                      <option value="">Column…</option>
                      {selCols.map(c => <option key={c.originalKey} value={c.alias || c.label}>{c.alias || c.label}</option>)}
                    </select>
                    {colMeta?.type && <TypePill type={colMeta.type} />}
                    <select
                      value={f.op}
                      onChange={e => updFilter(i, "op", e.target.value)}
                      className="text-[11px] font-bold rounded-lg px-2 py-1.5 bg-bg-surface border border-border-muted outline-none text-text-secondary"
                    >
                      {FILTER_OPS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                    </select>
                    <input
                      value={f.value}
                      onChange={e => updFilter(i, "value", e.target.value)}
                      placeholder="Value…"
                      className="flex-1 text-[12px] font-mono bg-bg-surface border border-border-muted rounded-lg px-3 py-1.5 text-text-primary outline-none focus:border-accent/50"
                    />
                    <button onClick={() => updFilter(i, "active", !f.active)} className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${f.active ? "bg-violet/15 border-violet/30 text-violet" : "bg-bg-surface border-border-muted text-text-quaternary"}`}>
                      <SlidersHorizontal size={13} />
                    </button>
                    <button onClick={() => remFilter(i)} className="w-7 h-7 rounded flex items-center justify-center text-text-quaternary hover:bg-rose/10 hover:text-rose transition-colors">
                       <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SEARCH BAR ── */}
      <div className="px-5 py-3 border-b border-border-default bg-bg-surface/5 flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-quaternary" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPg(1); }}
            placeholder="Search rows…"
            className="w-full pl-9 pr-4 py-2 bg-bg-base border border-border-muted rounded-lg text-[12px] text-text-primary outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="overflow-x-auto relative" style={{ maxHeight: "480px", overflowY: "auto" }}>
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-bg-surface border-b border-border-default">
              <th className="px-4 py-3 text-[10px] font-black text-text-quaternary uppercase tracking-widest w-12 text-center">#</th>
              {visibleColNames.map(col => (
                <th key={col} className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => handleSort(col)}
                    className="flex items-center gap-1.5 group text-[10px] font-black text-text-quaternary uppercase tracking-widest hover:text-text-secondary transition-colors"
                  >
                    {col}
                    <span className={`transition-colors ${sortCol === col ? "text-accent" : "text-text-quaternary/40 group-hover:text-text-quaternary"}`}>
                      {sortCol === col ? (sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} />}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, i) => {
              const globalIdx = (pg - 1) * ROWS_PER_PAGE + i + 1;
              return (
                <tr key={i} className="border-b border-border-default/30 hover:bg-bg-surface/40 transition-colors group">
                  <td className="px-4 py-3 text-[11px] text-text-quaternary font-mono text-center border-r border-border-default/20">{globalIdx}</td>
                  {visibleColNames.map(col => {
                    const val = row[col];
                    const isNull = val === null || val === undefined;
                    const isNum = typeof val === "number";
                    const isBool = typeof val === "boolean";
                    return (
                      <td key={col} className="px-4 py-2.5 max-w-[250px]">
                        {isNull ? (
                          <span className="text-text-quaternary/50 italic text-[11px] font-mono">null</span>
                        ) : isBool ? (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${val ? "text-emerald bg-emerald/10" : "text-rose bg-rose/10"}`}>
                            {String(val)}
                          </span>
                        ) : isNum ? (
                          <span className="text-amber-400 font-mono text-[12px] font-bold">{val}</span>
                        ) : (
                          <span className="text-text-secondary text-[12px] truncate block font-medium" title={String(val)}>
                            {String(val)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={visibleColNames.length + 1} className="p-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-quaternary">
                    <Table2 size={32} className="opacity-30" />
                    <div className="text-[13px] font-bold">{search ? `No rows match "${search}"` : "No rows found."}</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER / PAGINATION ── */}
      <div className="px-5 py-3.5 bg-bg-surface/30 border-t border-border-default flex items-center justify-between flex-wrap gap-3">
        <Btn variant="ghost" onClick={onBack} size="sm">← Back to Schema</Btn>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[11px] text-text-quaternary font-mono font-bold">
            Page {pg} / {totPages}
          </span>
          <div className="flex bg-bg-base border border-border-muted rounded-lg overflow-hidden">
            <button
              disabled={pg === 1}
              onClick={() => setPg(p => p - 1)}
              className="px-3 py-1.5 text-text-secondary hover:bg-bg-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="w-px bg-border-muted" />
            <button
              disabled={pg === totPages}
              onClick={() => setPg(p => p + 1)}
              className="px-3 py-1.5 text-text-secondary hover:bg-bg-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function download(content, type, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
}
