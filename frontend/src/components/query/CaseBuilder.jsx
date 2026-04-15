import { Plus, X, ChevronDown } from 'lucide-react';
import { quoteIdentifier } from '../../lib/queryBuilderUtils';

let _id = 0;
const uid = () => `case_${++_id}`;
const CASE_OPS = ['=', '!=', '>', '<', '>=', '<=', 'IS NULL', 'IS NOT NULL', 'LIKE', 'IN', 'BETWEEN'];

function newWhen() { return { id: uid(), col: '', op: '=', val: '', then: '' }; }

export function buildCaseSQL(expr, ambiguousCols = new Set(), mainAlias = '') {
  if (!expr.whens || !expr.whens.length) return '';
  const whenParts = expr.whens.map(w => {
    if (!w.col) return null;
    let condition;
    const qCol = quoteIdentifier(w.col, ambiguousCols, mainAlias);
    if (w.op === 'IS NULL' || w.op === 'IS NOT NULL') condition = `${qCol} ${w.op}`;
    else if (w.op === 'LIKE') condition = `${qCol} LIKE '${w.val}'`;
    else if (w.op === 'IN') {
      const vals = String(w.val).split(',').map(v => { const t = v.trim(); return isNaN(t) ? `'${t}'` : t; }).join(', ');
      condition = `${qCol} IN (${vals})`;
    } else if (w.op === 'BETWEEN') {
      const [a, b] = String(w.val).split(',').map(s => s.trim());
      condition = `${qCol} BETWEEN ${isNaN(a) ? `'${a}'` : a} AND ${isNaN(b) ? `'${b}'` : b}`;
    } else {
      const v = w.val;
      condition = `${qCol} ${w.op} ${isNaN(v) || v === '' ? `'${v}'` : v}`;
    }
    const thenVal = isNaN(w.then) || w.then === '' ? `'${w.then}'` : w.then;
    return `  WHEN ${condition} THEN ${thenVal}`;
  }).filter(Boolean);
  if (!whenParts.length) return '';
  const elseStr = expr.elseVal !== undefined && expr.elseVal !== ''
    ? `  ELSE ${isNaN(expr.elseVal) || expr.elseVal === '' ? `'${expr.elseVal}'` : expr.elseVal}`
    : '  ELSE NULL';
  const alias = expr.alias ? ` AS "${expr.alias}"` : '';
  return `CASE\n${whenParts.join('\n')}\n${elseStr}\nEND${alias}`;
}

export default function CaseBuilder({ cases, onChange, columns }) {
  const add = () => onChange([...(cases || []), { id: uid(), alias: `case_col_${(cases||[]).length+1}`, whens: [newWhen()], elseVal: 'NULL' }]);
  const del = i => onChange(cases.filter((_, j) => j !== i));
  const upd = (i, k, v) => onChange(cases.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const updWhen = (ci, wi, k, v) => {
    const expr = cases[ci];
    const newWhens = expr.whens.map((w, j) => j === wi ? { ...w, [k]: v } : w);
    upd(ci, 'whens', newWhens);
  };
  const addWhen = ci => upd(ci, 'whens', [...cases[ci].whens, newWhen()]);
  const delWhen = (ci, wi) => upd(ci, 'whens', cases[ci].whens.filter((_, j) => j !== wi));

  return (
    <div className="qb-case-builder">
      {(cases || []).map((expr, ci) => (
        <div key={expr.id} className="qb-card" style={{ borderLeft: '3px solid var(--accent-light)' }}>
          <div className="qb-card-header" style={{ marginBottom: 12 }}>
            <div className="flex items-center gap-2 mb-1.5" style={{ flex: 1 }}>
              <span className="qb-label" style={{ color: 'var(--accent)', fontWeight: 800 }}>CASE</span>
              <input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={expr.alias} onChange={e => upd(ci, 'alias', e.target.value)} placeholder="alias (col name)" style={{ fontWeight: 600, flex: 0.8 }} />
            </div>
            <button className="qb-btn-icon qb-btn-icon--danger" onClick={() => del(ci)}><X size={14} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {expr.whens.map((w, wi) => (
              <div key={w.id} className="flex items-center gap-2 mb-1.5" style={{ flexWrap: 'nowrap' }}>
                <span className="qb-label" style={{ width: 38, opacity: 0.6, fontSize: '0.6rem' }}>WHEN</span>
                <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={w.col} onChange={e => updWhen(ci, wi, 'col', e.target.value)} style={{ flex: 1.2 }}>
                  <option value="">Col...</option>{columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={w.op} onChange={e => updWhen(ci, wi, 'op', e.target.value)} style={{ flex: 0.8, fontWeight: 700 }}>
                  {CASE_OPS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {w.op !== 'IS NULL' && w.op !== 'IS NOT NULL' && (
                  <input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={w.val} onChange={e => updWhen(ci, wi, 'val', e.target.value)} placeholder={w.op==='IN'?'a,b,c':w.op==='BETWEEN'?'min,max':'val...'} style={{ flex: 1 }} />
                )}
                <span className="qb-label" style={{ opacity: 0.6, fontSize: '0.6rem' }}>THEN</span>
                <input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={w.then} onChange={e => updWhen(ci, wi, 'then', e.target.value)} placeholder="result" style={{ flex: 1.2, fontWeight: 600 }} />
                {expr.whens.length > 1 && <button className="flex items-center justify-center w-7 h-7 rounded-lg text-[#6b7294] hover:text-[#f1f3f9] hover:bg-white/[0.05] transition-colors" onClick={() => delWhen(ci, wi)}><X size={10} /></button>}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-1.5" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)', flexWrap: 'nowrap' }}>
             <span className="qb-label" style={{ width: 38, opacity: 0.6, fontSize: '0.6rem' }}>ELSE</span>
             <input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={expr.elseVal} onChange={e => upd(ci, 'elseVal', e.target.value)} placeholder="NULL or default" style={{ flex: 1 }} />
             <div style={{ flex: 1.5 }} />
          </div>

          <div className="qb-sql-preview" style={{ marginTop: 8 }}>
            <code>{buildCaseSQL(expr) || '-- configure WHEN above'}</code>
          </div>

          <button className="qb-btn qb-btn--ghost" onClick={() => addWhen(ci)} style={{ height: 24, fontSize: '0.65rem' }}><Plus size={12} /> Add WHEN</button>
        </div>
      ))}

      <button className="w-full py-1.5 rounded-lg bg-[rgba(92,98,236,0.1)] text-[#7b81f5] text-[0.7rem] font-medium border border-dashed border-[rgba(92,98,236,0.3)] hover:bg-[rgba(92,98,236,0.15)] flex justify-center items-center gap-1 mt-1 transition-all" onClick={add} style={{ borderColor: 'rgba(167,139,250,0.4)', color: '#a78bfa' }}><Plus size={13} /> Add CASE WHEN Expression</button>
    </div>
  );
}
