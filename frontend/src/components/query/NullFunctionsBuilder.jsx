import { Plus, X, Lightbulb } from 'lucide-react';
import { quoteIdentifier } from '../../lib/queryBuilderUtils';

let _id = 0;
const uid = () => `nf_${++_id}`;

const NULL_FUNCS = [
  { value: 'COALESCE', label: 'COALESCE — First non-null', hint: 'Returns first non-NULL value from list' },
  { value: 'IFNULL',   label: 'IFNULL — Default if NULL', hint: 'Replace NULL with fallback' },
  { value: 'NULLIF',   label: 'NULLIF — Equal to NULL', hint: 'Returns NULL if values match (avoids div/0)' },
  { value: 'IIF',      label: 'IIF — Inline if/else', hint: 'Simplified CASE: IF(cond, true, false)' },
];

export function buildNullFuncSQL(nf, ambiguousCols = new Set(), mainAlias = '') {
  if (!nf || !nf.func) return '';
  const alias = nf.alias ? ` AS "${nf.alias}"` : '';
  switch (nf.func) {
    case 'COALESCE': {
      const cols = (nf.cols || []).filter(Boolean);
      if (!cols.length) return '';
      const parts = cols.map(c => c.startsWith("'") || !isNaN(c) ? c : quoteIdentifier(c, ambiguousCols, mainAlias));
      if (nf.fallback !== undefined && nf.fallback !== '') parts.push(isNaN(nf.fallback) ? `'${nf.fallback}'` : String(nf.fallback));
      return `COALESCE(${parts.join(', ')})${alias}`;
    }
    case 'IFNULL': {
      if (!nf.col) return '';
      const fb = nf.fallback !== undefined && nf.fallback !== '' ? (isNaN(nf.fallback) ? `'${nf.fallback}'` : String(nf.fallback)) : 'NULL';
      return `IFNULL(${quoteIdentifier(nf.col, ambiguousCols, mainAlias)}, ${fb})${alias}`;
    }
    case 'NULLIF': {
      if (!nf.col || !nf.val) return '';
      const v = isNaN(nf.val) ? `'${nf.val}'` : nf.val;
      return `NULLIF(${quoteIdentifier(nf.col, ambiguousCols, mainAlias)}, ${v})${alias}`;
    }
    case 'IIF': {
      if (!nf.condition) return '';
      const t = nf.thenVal !== undefined ? (isNaN(nf.thenVal) ? `'${nf.thenVal}'` : nf.thenVal) : 'NULL';
      const e = nf.elseVal !== undefined ? (isNaN(nf.elseVal) ? `'${nf.elseVal}'` : nf.elseVal) : 'NULL';
      return `IIF(${nf.condition}, ${t}, ${e})${alias}`;
    }
    default: return '';
  }
}

export default function NullFunctionsBuilder({ nullFuncs, onChange, columns }) {
  const add = () => onChange([...(nullFuncs || []), { id: uid(), func: 'COALESCE', alias: '', cols: ['', ''], fallback: '' }]);
  const del = i => onChange((nullFuncs || []).filter((_, j) => j !== i));
  const upd = (i, v) => onChange((nullFuncs || []).map((n, j) => j === i ? v : n));

  return (
    <div className="qb-null-builder">
      {(nullFuncs || []).map((nf, i) => (
        <div key={nf.id} className="qb-card" style={{ borderLeft: '3px solid #10b981' }}>
          <div className="qb-card-header" style={{ marginBottom: 12 }}>
            <div className="flex items-center gap-2 mb-1.5" style={{ flex: 1 }}>
              <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={nf.func} onChange={e => upd(i, { ...nf, func: e.target.value })} style={{ flex: 1.5, minWidth: 160, fontWeight: 700 }}>
                {NULL_FUNCS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={nf.alias || ''} onChange={e => upd(i, { ...nf, alias: e.target.value })} placeholder="alias (col name)" style={{ fontWeight: 600, flex: 1 }} />
            </div>
            <button className="qb-btn-icon qb-btn-icon--danger" onClick={() => del(i)}><X size={14} /></button>
          </div>

          <div className="qb-tip qb-tip--info" style={{ marginBottom: 12, fontSize: '0.65rem' }}>
            <Lightbulb size={12} style={{ flexShrink: 0 }} />
            <span>{NULL_FUNCS.find(f => f.value === nf.func)?.hint}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nf.func === 'COALESCE' && (
              <div>
                <div className="qb-label">Candidate Columns (first non-null wins)</div>
                <div className="flex items-center gap-2 mb-1.5" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {(nf.cols || []).map((c, ci) => (
                    <div key={ci} className="flex items-center gap-2 mb-1.5" style={{ flexWrap: 'nowrap', gap: 2 }}>
                      <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={c} onChange={e => { const nc = [...(nf.cols || [])]; nc[ci] = e.target.value; upd(i, { ...nf, cols: nc }); }} style={{ width: 120 }}>
                        <option value="">Col...</option>
                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                      </select>
                      {(nf.cols || []).length > 1 && <button className="flex items-center justify-center w-7 h-7 rounded-lg text-[#6b7294] hover:text-[#f1f3f9] hover:bg-white/[0.05] transition-colors" onClick={() => upd(i, { ...nf, cols: (nf.cols || []).filter((_, j) => j !== ci) })}><X size={10} /></button>}
                    </div>
                  ))}
                  <button className="qb-btn qb-btn--ghost" style={{ height: 26, fontSize: '0.65rem' }} onClick={() => upd(i, { ...nf, cols: [...(nf.cols || []), ''] })}>+ col</button>
                </div>
                <div className="qb-label" style={{ marginTop: 8 }}>Final Fallback</div>
                <input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={nf.fallback || ''} onChange={e => upd(i, { ...nf, fallback: e.target.value })} placeholder="0 or 'N/A'" style={{ width: 140 }} />
              </div>
            )}

            {nf.func === 'IFNULL' && (
              <div className="grid grid-cols-2 gap-2 w-full">
                <div><div className="qb-label">Column</div><select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={nf.col || ''} onChange={e => upd(i, { ...nf, col: e.target.value })}><option value="">Col...</option>{columns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><div className="qb-label">Fallback Value</div><input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={nf.fallback || ''} onChange={e => upd(i, { ...nf, fallback: e.target.value })} placeholder="e.g. 0" /></div>
              </div>
            )}

            {nf.func === 'NULLIF' && (
              <div className="grid grid-cols-2 gap-2 w-full">
                <div><div className="qb-label">Column</div><select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={nf.col || ''} onChange={e => upd(i, { ...nf, col: e.target.value })}><option value="">Col...</option>{columns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><div className="qb-label">Value to nullify</div><input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={nf.val || ''} onChange={e => upd(i, { ...nf, val: e.target.value })} placeholder="e.g. 0" /></div>
              </div>
            )}

            {nf.func === 'IIF' && (
              <div className="qb-grid-3" style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
                <div><div className="qb-label">Condition (SQL)</div><input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={nf.condition || ''} onChange={e => upd(i, { ...nf, condition: e.target.value })} placeholder='"col" > 0' style={{ fontFamily: 'var(--font-mono)' }} /></div>
                <div><div className="qb-label">True</div><input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={nf.thenVal || ''} onChange={e => upd(i, { ...nf, thenVal: e.target.value })} placeholder="val" /></div>
                <div><div className="qb-label">False</div><input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={nf.elseVal || ''} onChange={e => upd(i, { ...nf, elseVal: e.target.value })} placeholder="val" /></div>
              </div>
            )}
          </div>

          <div className="qb-sql-preview" style={{ marginTop: 12 }}>
            <code>{buildNullFuncSQL(nf)}</code>
          </div>
        </div>
      ))}

      <button className="w-full py-1.5 rounded-lg bg-[rgba(92,98,236,0.1)] text-[#7b81f5] text-[0.7rem] font-medium border border-dashed border-[rgba(92,98,236,0.3)] hover:bg-[rgba(92,98,236,0.15)] flex justify-center items-center gap-1 mt-1 transition-all" onClick={add} style={{ borderColor: 'rgba(16,185,129,0.4)', color: '#10b981' }}><Plus size={13} /> Add NULL Function</button>
    </div>
  );
}
