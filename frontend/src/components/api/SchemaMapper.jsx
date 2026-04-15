import { useState } from "react";
import { Search, Check, Columns3, Braces, ArrowRight, Zap, Hash, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from "lucide-react";
import { card, inputStyle, TYPE_COLOR } from "./shared";
import { Chk, TypePill, Btn } from "./Atoms";

export default function SchemaMapper({ cols, setCols, onNext, onBack, respMs, srcRowsCount }) {
  const [searchTerm, setSearchTerm] = useState("");

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const togAll = (v) => setCols(c => c.map(x => ({ ...x, selected: v })));
  const togCol = (i) => setCols(c => { const n = [...c]; n[i] = { ...n[i], selected: !n[i].selected }; return n; });
  const updCol = (i, f, v) => setCols(c => { const n = [...c]; n[i] = { ...n[i], [f]: v }; return n; });
  
  const handleReorder = (from, to) => {
    if (from === to) return;
    const n = [...cols];
    const [movedItem] = n.splice(from, 1);
    n.splice(to, 0, movedItem);
    setCols(n);
  };

  const selCols = cols.filter(c => c.selected);
  const filtered = cols.filter(col => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return col.originalKey.toLowerCase().includes(q) || (col.alias || col.label).toLowerCase().includes(q);
  });

  const typeGroups = cols.reduce((acc, col) => {
    acc[col.type] = (acc[col.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 animate-slide-up">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Braces,   label: "Records",      val: srcRowsCount, color: "accent",  num: true },
          { icon: Columns3, label: "Fields Found",  val: cols.length,  color: "violet",  num: true },
          { icon: Check,    label: "Selected",      val: selCols.length, color: "emerald", num: true },
          { icon: Zap,      label: "Latency",       val: `${respMs}ms`,  color: "amber",   num: false },
        ].map((s, i) => (
          <div key={i} style={card} className="p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-${s.color}-muted border border-${s.color}/20 flex items-center justify-center shrink-0`}>
              <s.icon size={18} className={`text-${s.color}`} />
            </div>
            <div>
              <div className={`text-[22px] font-black ${s.num ? "text-text-primary" : "text-text-primary"} leading-none`}>{s.val}</div>
              <div className="text-[10px] font-black text-text-quaternary uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TYPE SUMMARY PILLS ── */}
      {Object.keys(typeGroups).length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-quaternary">Field types:</span>
          {Object.entries(typeGroups).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1.5">
              <TypePill type={type} />
              <span className="text-[11px] font-bold text-text-quaternary">×{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── MAIN CARD ── */}
      <div style={card} className="overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border-default flex items-center justify-between gap-4 flex-wrap bg-bg-surface/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center">
              <Braces size={15} className="text-accent" />
            </div>
            <div>
              <div className="font-black text-[14px] text-text-primary">Field Mapping</div>
              <div className="text-[11px] text-text-quaternary">Map JSON paths → column names</div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-quaternary" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search fields…"
                style={inputStyle}
                className="!pl-9 w-[180px] !py-2 !text-[12px]"
              />
            </div>

            <div className="flex bg-bg-base border border-border-muted rounded-lg overflow-hidden">
              <button onClick={() => togAll(true)} className="px-3 py-2 text-[11px] font-bold text-text-secondary hover:bg-bg-raised hover:text-accent transition-colors flex items-center gap-1">
                <Eye size={12} /> All
              </button>
              <div className="w-px bg-border-muted" />
              <button onClick={() => togAll(false)} className="px-3 py-2 text-[11px] font-bold text-text-secondary hover:bg-bg-raised hover:text-rose transition-colors flex items-center gap-1">
                <EyeOff size={12} /> None
              </button>
            </div>
          </div>
        </div>

        {/* Selection state bar */}
        <div className="px-6 py-2.5 bg-bg-surface/10 border-b border-border-muted flex items-center gap-3 text-[11px]">
          <div className="flex-1 h-1.5 bg-bg-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: cols.length ? `${(selCols.length / cols.length) * 100}%` : "0%" }}
            />
          </div>
          <span className="font-bold text-text-quaternary shrink-0">
            <span className="text-accent">{selCols.length}</span>/{cols.length} selected
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[520px] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-bg-surface border-b border-border-default">
              <tr>
                <th className="px-4 py-3 w-12 text-[10px] font-black text-text-quaternary uppercase tracking-widest">Use</th>
                <th className="px-4 py-3 text-[10px] font-black text-text-quaternary uppercase tracking-widest">JSON Path</th>
                <th className="px-4 py-3 text-[10px] font-black text-text-quaternary uppercase tracking-widest">Column Name</th>
                <th className="px-4 py-3 text-[10px] font-black text-text-quaternary uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-[10px] font-black text-text-quaternary uppercase tracking-widest">Sample</th>
                <th className="px-4 py-3 text-[10px] font-black text-text-quaternary uppercase tracking-widest">Nulls</th>
                <th className="px-4 py-3 text-[10px] font-black text-text-quaternary uppercase tracking-widest w-16">Order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((col, idx) => {
                // find true index in original cols array
                const i = cols.findIndex(c => c.originalKey === col.originalKey);
                const nullPct = srcRowsCount > 0 ? Math.min(100, (col.nulls / srcRowsCount) * 100) : 0;

                return (
                  <tr
                    key={col.originalKey}
                    draggable
                    onDragStart={() => setDraggedIdx(i)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIdx(i);
                    }}
                    onDragEnd={() => {
                      if (draggedIdx !== null && dragOverIdx !== null) {
                        handleReorder(draggedIdx, dragOverIdx);
                      }
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    className={[
                      "border-b border-border-default/40 transition-all",
                      col.selected
                        ? "hover:bg-bg-surface/30"
                        : "opacity-40 bg-bg-surface/5 hover:bg-bg-surface/10",
                      draggedIdx === i ? "opacity-20 scale-[0.98] bg-accent/10" : "",
                      dragOverIdx === i && draggedIdx !== i ? "border-t-2 border-t-accent" : ""
                    ].join(" ")}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <Chk checked={col.selected} onChange={() => togCol(i)} />
                    </td>

                    {/* JSON Path */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        {col.isPrimary && (
                          <Hash size={11} className="text-amber shrink-0" title="Primary Key Candidate" />
                        )}
                        <code className="text-[11px] font-mono text-text-tertiary truncate block" title={col.originalKey}>
                          {col.originalKey}
                        </code>
                      </div>
                    </td>

                    {/* Alias */}
                    <td className="px-4 py-3">
                      <input
                        value={col.alias || col.label}
                        onChange={e => updCol(i, "alias", e.target.value)}
                        disabled={!col.selected}
                        className={[
                          "w-full bg-bg-base border rounded-lg px-3 py-1.5 text-[12px] font-bold text-text-primary transition-all outline-none",
                          col.selected
                            ? "border-border-muted focus:border-accent/50 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]"
                            : "border-transparent opacity-50 cursor-not-allowed"
                        ].join(" ")}
                      />
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <TypePill type={col.type} />
                    </td>

                    {/* Sample */}
                    <td className="px-4 py-3 max-w-[140px]">
                      {col.sample !== null && col.sample !== undefined ? (
                        <span className="text-[11px] font-mono text-text-quaternary truncate block" title={String(col.sample)}>
                          {typeof col.sample === "string" ? `"${col.sample.slice(0, 20)}${col.sample.length > 20 ? "…" : ""}"` : String(col.sample)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-quaternary/40 italic">—</span>
                      )}
                    </td>

                    {/* Null count */}
                    <td className="px-4 py-3">
                      {col.nulls > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-bg-raised rounded-full overflow-hidden">
                            <div className="h-full bg-rose/50 rounded-full" style={{ width: `${nullPct}%` }} />
                          </div>
                          <span className="text-[10px] text-rose/70 font-mono">{col.nulls}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald/60 font-bold">✓ full</span>
                      )}
                    </td>

                    {/* Reorder Handle */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center cursor-grab active:cursor-grabbing text-text-quaternary hover:text-accent transition-colors">
                        <GripVertical size={16} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-quaternary text-[13px] italic">
                    No fields match "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-default bg-bg-surface/20 flex items-center justify-between">
          <Btn variant="ghost" onClick={onBack}>← Back to API</Btn>
          <Btn
            onClick={onNext}
            disabled={selCols.length === 0}
            className="bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20"
          >
            Next: Transform <ArrowRight size={15} />
          </Btn>
        </div>
      </div>
    </div>
  );
}
