import { useState, useMemo } from "react";
import { Table2, Download, Braces, ChevronLeft, ChevronRight, Check, Eye, EyeOff, Search, ArrowUpDown, ArrowUp, ArrowDown, FileJson, FileSpreadsheet } from "lucide-react";
import { Btn } from "./Atoms";

const ROWS_PER_PAGE = 20;

export default function DataTablePreview({ previewRows, cols, computedCols, onBack, isSidePanel }) {
  const [pg, setPg] = useState(1);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [showColPanel, setShowColPanel] = useState(false);

  // All column names
  const allColNames = useMemo(() => [
    ...cols.filter(c => c.selected).map(c => c.alias || c.label),
    ...computedCols.filter(c => c.name && c.expr).map(c => c.name),
  ], [cols, computedCols]);

  const [visibleCols, setVisibleCols] = useState(() =>
    allColNames.reduce((acc, n) => ({ ...acc, [n]: true }), {})
  );

  // Sync new columns into visibility state without resetting old ones
  const visibleColNames = allColNames.filter(n => visibleCols[n] !== false);

  const toggleCol = (name) => setVisibleCols(v => ({ ...v, [name]: !v[name] }));
  const toggleAll = (val) => setVisibleCols(allColNames.reduce((acc, n) => ({ ...acc, [n]: val }), {}));

  // Table-level sort (separate from global sort in TransformBuilder)
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
    const csv = [
      visibleColNames.join(","),
      ...previewRows.map(r => visibleColNames.map(h => JSON.stringify(r[h] ?? "")).join(","))
    ].join("\n");
    download(csv, "text/csv", `api_export_${Date.now()}.csv`);
  };

  const exportJSON = () => {
    if (!previewRows.length) return;
    const out = previewRows.map(r => {
      const obj = {};
      visibleColNames.forEach(c => obj[c] = r[c]);
      return obj;
    });
    download(JSON.stringify(out, null, 2), "application/json", `api_export_${Date.now()}.json`);
  };

  const hiddenCount = allColNames.length - visibleColNames.length;

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
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border-default bg-bg-surface/30 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald/15 border border-emerald/20 flex items-center justify-center shrink-0">
            <Table2 size={15} className="text-emerald" />
          </div>
          <div>
            <div className="font-black text-[14px] text-text-primary">Data Preview</div>
            <div className="text-[11px] text-text-quaternary">
              <span className="text-emerald font-bold">{filteredRows.length}</span>
              {filteredRows.length !== previewRows.length && ` of ${previewRows.length}`} rows
              {" · "}<span className="text-accent font-bold">{visibleColNames.length}</span> columns
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Column Visibility */}
          <div className="relative">
            <button
              onClick={() => setShowColPanel(!showColPanel)}
              className={[
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold transition-colors",
                showColPanel
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "bg-bg-base border-border-muted text-text-secondary hover:border-border-default"
              ].join(" ")}
            >
              {showColPanel ? <EyeOff size={13} /> : <Eye size={13} />}
              Columns
              {hiddenCount > 0 && (
                <span className="bg-rose/20 text-rose px-1.5 py-0.5 rounded text-[9px] font-black">{hiddenCount} hidden</span>
              )}
            </button>

            {showColPanel && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-bg-overlay border border-border-default rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                <div className="px-4 py-3 border-b border-border-muted flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-quaternary">Column Visibility</span>
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
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        visibleCols[name] !== false
                          ? "bg-accent border-accent"
                          : "border-border-strong bg-transparent"
                      }`}>
                        {visibleCols[name] !== false && <Check size={9} className="text-white" />}
                      </div>
                      <span className="text-[12px] font-bold text-text-primary truncate">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald/20 bg-emerald/5 text-emerald text-[11px] font-bold hover:bg-emerald/15 transition-colors"
          >
            <FileSpreadsheet size={13} /> CSV
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber/20 bg-amber/5 text-amber text-[11px] font-bold hover:bg-amber/15 transition-colors"
          >
            <FileJson size={13} /> JSON
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="px-4 py-3 border-b border-border-default bg-bg-surface/10">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-quaternary" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPg(1); }}
            placeholder="Search across visible columns…"
            className="w-full pl-9 pr-4 py-2.5 bg-bg-base border border-border-muted rounded-xl text-[13px] text-text-primary font-mono outline-none placeholder:text-text-quaternary focus:border-accent/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPg(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-quaternary hover:text-text-primary transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="overflow-x-auto relative" style={{ maxHeight: "520px", overflowY: "auto" }}>
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-bg-surface border-b border-border-default">
              <th className="px-4 py-3 text-[10px] font-black text-text-quaternary uppercase tracking-widest w-10 whitespace-nowrap">#</th>
              {visibleColNames.map(col => (
                <th key={col} className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => handleSort(col)}
                    className="flex items-center gap-1.5 group text-[10px] font-black text-text-quaternary uppercase tracking-widest hover:text-text-secondary transition-colors"
                  >
                    {col}
                    <span className={`transition-colors ${sortCol === col ? "text-accent" : "text-text-quaternary/40 group-hover:text-text-quaternary"}`}>
                      {sortCol === col
                        ? (sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />)
                        : <ArrowUpDown size={10} />
                      }
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
                <tr
                  key={i}
                  className="border-b border-border-default/30 hover:bg-bg-surface/40 transition-colors group"
                >
                  <td className="px-4 py-3 text-[11px] text-text-quaternary font-mono">{globalIdx}</td>
                  {visibleColNames.map(col => {
                    const val = row[col];
                    const isNull = val === null || val === undefined;
                    const isNum = typeof val === "number";
                    const isBool = typeof val === "boolean";
                    return (
                      <td key={col} className="px-4 py-3 max-w-[250px]">
                        {isNull ? (
                          <span className="text-text-quaternary/50 italic text-[11px] font-mono">null</span>
                        ) : isBool ? (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${val ? "text-emerald bg-emerald/10" : "text-rose bg-rose/10"}`}>
                            {String(val)}
                          </span>
                        ) : isNum ? (
                          <span className="text-amber-400 font-mono text-[12px] font-bold">{val}</span>
                        ) : (
                          <span className="text-text-secondary text-[12px] truncate block" title={String(val)}>
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
                <td colSpan={visibleColNames.length + 1} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-quaternary">
                    <Table2 size={32} className="opacity-30" />
                    <div className="text-[13px] font-bold">
                      {search ? `No rows match "${search}"` : "No rows match the current filters."}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER / PAGINATION ── */}
      <div className="px-5 py-3.5 bg-bg-surface/30 border-t border-border-default flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-[11px] font-bold text-text-quaternary">
          {sortCol && (
            <button
              onClick={() => { setSortCol(null); setSortDir("asc"); }}
              className="flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors"
            >
              <ArrowUpDown size={11} /> Sorted: {sortCol} {sortDir}
              <span className="text-text-quaternary">×</span>
            </button>
          )}
          {search && (
            <span className="text-violet">
              Showing {filteredRows.length} of {previewRows.length} rows
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[11px] text-text-quaternary font-mono">
            Page {pg} / {totPages}
          </span>
          <div className="flex bg-bg-base border border-border-muted rounded-lg overflow-hidden">
            <button
              disabled={pg === 1}
              onClick={() => setPg(p => p - 1)}
              className="px-3 py-2 text-text-secondary hover:bg-bg-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="w-px bg-border-muted" />
            <button
              disabled={pg === totPages}
              onClick={() => setPg(p => p + 1)}
              className="px-3 py-2 text-text-secondary hover:bg-bg-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
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
