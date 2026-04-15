import { Plus, X, Link2, Eye, Code2 } from 'lucide-react';

export function buildUnionSQL(unions, mainSQL) {
  if (!unions || !unions.length) return '';
  const parts = unions.map(u => {
    if (!u.sql && !u.selects?.length) return null;
    const connector = u.type || 'UNION ALL';
    const fromClause = u.table ? ` FROM "${u.table}"` : '';
    const sql = u.sql || `SELECT ${(u.selects||[]).map(s => `"${s}"`).join(', ')}${fromClause}`;
    return `${connector}\n${sql}`;
  }).filter(Boolean);
  return parts.length ? parts.join('\n') : '';
}

export default function UnionBuilder({ unions, onChange, datasets, cteNames = [], columns }) {
  const add = () => onChange([...(unions || []), { id: `u_${Date.now()}`, type: 'UNION ALL', table: '', selects: [], sql: '', _mode: 'visual' }]);
  const del = i => onChange(unions.filter((_, j) => j !== i));
  const upd = (i, k, v) => onChange(unions.map((u, j) => j === i ? { ...u, [k]: v } : u));

  return (
    <div className="qb-union-builder">
      {(unions || []).map((u, i) => (
        <div key={u.id} className="qb-card qb-card--cyan">
          <div className="qb-card-header" style={{ marginBottom: 12 }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Link2 size={13} style={{ color: 'var(--cyan)' }} />
              <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={u.type} onChange={e => upd(i, 'type', e.target.value)} style={{ fontWeight: 700, width: 120 }}>
                <option value="UNION">UNION</option>
                <option value="UNION ALL">UNION ALL</option>
              </select>
              <div className="flex bg-[rgba(255,255,255,0.04)] rounded-lg p-0.5" style={{ height: 26 }}>
                <button className={`qb-mode-btn${u._mode !== 'sql' ? ' active' : ''}`} onClick={() => upd(i, '_mode', 'visual')}><Eye size={12}/> Visual</button>
                <button className={`qb-mode-btn${u._mode === 'sql' ? ' active' : ''}`} onClick={() => upd(i, '_mode', 'sql')}><Code2 size={12}/> SQL</button>
              </div>
            </div>
            <button className="qb-btn-icon qb-btn-icon--danger" onClick={() => del(i)}><X size={14} /></button>
          </div>

          {u._mode === 'sql' ? (
            <textarea className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={u.sql} onChange={e => upd(i, 'sql', e.target.value)} rows={4} placeholder="SELECT col1, col2 FROM another_table" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }} />
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full">
              <div>
                <div className="qb-label">Target table / CTE</div>
                <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={u.table} onChange={e => upd(i, 'table', e.target.value)}>
                  <option value="">Select table...</option>
                  {cteNames.length > 0 && <optgroup label="── CTEs ──">{cteNames.map(n => <option key={n} value={n}>{n}</option>)}</optgroup>}
                  <optgroup label="── Datasets ──">{(datasets || []).map(d => <option key={d.id} value={d.table_name}>{d.name}</option>)}</optgroup>
                </select>
              </div>
              <div>
                <div className="qb-label">Columns <small>(must match count/types of main query)</small></div>
                <input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={(u.selects || []).join(', ')} onChange={e => upd(i, 'selects', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="col1, col2, col3" />
              </div>
            </div>
          )}

          <div className="qb-sql-preview" style={{ marginTop: 12 }}>
            <code>{u.type} {u._mode === 'sql' ? (u.sql || '...') : (u.selects?.length ? `SELECT ... FROM "${u.table || '?'}"` : '...')}</code>
          </div>
        </div>
      ))}

      <button className="w-full py-1.5 rounded-lg bg-[rgba(92,98,236,0.1)] text-[#7b81f5] text-[0.7rem] font-medium border border-dashed border-[rgba(92,98,236,0.3)] hover:bg-[rgba(92,98,236,0.15)] flex justify-center items-center gap-1 mt-1 transition-all" onClick={add} style={{ borderColor: 'rgba(34,211,238,0.4)', color: '#22d3ee' }}><Plus size={13} /> Add UNION Block</button>
      
      <div className="qb-tip qb-tip--cyan" style={{ marginTop: 12 }}>
        <Eye size={12} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.65rem' }}>UNION removes duplicates. UNION ALL is faster and keeps all rows.</span>
      </div>
    </div>
  );
}
