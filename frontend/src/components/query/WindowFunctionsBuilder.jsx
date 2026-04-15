import { Plus, X, Layers } from 'lucide-react';

/**
 * WindowFunctionsBuilder — Visual OVER (PARTITION BY ... ORDER BY ...) builder
 * Generates: func() OVER (PARTITION BY col ORDER BY col ASC) AS alias
 */

const WINDOW_FUNCS = [
  { group: 'Ranking', funcs: ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'NTILE(4)', 'PERCENT_RANK()', 'CUME_DIST()'] },
  { group: 'Aggregate', funcs: ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'] },
  { group: 'Offset', funcs: ['LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE'] },
];

const ALL_FUNCS = WINDOW_FUNCS.flatMap(g => g.funcs);

let _id = 0;
const uid = () => `wf_${++_id}`;

export function buildWindowSQL(w, quoteId) {
  if (!w.func || !w.alias) return '';
  const qid = quoteId || (c => `"${c}"`);
  
  let fn = w.func;
  // For aggregate/offset funcs, wrap column
  if (!fn.includes('(')) {
    const col = w.col ? qid(w.col) : '*';
    fn = `${fn}(${col})`;
  }
  
  let over = 'OVER (';
  const parts = [];
  if (w.partBy) parts.push(`PARTITION BY ${qid(w.partBy)}`);
  if (w.orderBy) parts.push(`ORDER BY ${qid(w.orderBy)} ${w.dir || 'ASC'}`);
  if (w.frameType && w.frameStart) {
    const frame = `${w.frameType} BETWEEN ${w.frameStart} AND ${w.frameEnd || 'CURRENT ROW'}`;
    parts.push(frame);
  }
  over += parts.join(' ') + ')';
  
  return `${fn} ${over} AS "${w.alias}"`;
}

export default function WindowFunctionsBuilder({ windowFuncs, onChange, columns }) {
  const add = () => onChange([...(windowFuncs || []), {
    id: uid(), func: 'ROW_NUMBER()', alias: `win_${(windowFuncs || []).length + 1}`,
    col: '', partBy: '', orderBy: '', dir: 'ASC', frameType: '', frameStart: '', frameEnd: ''
  }]);
  const del = i => onChange((windowFuncs || []).filter((_, j) => j !== i));
  const upd = (i, k, v) => onChange((windowFuncs || []).map((w, j) => j === i ? { ...w, [k]: v } : w));

  const needsCol = (fn) => !fn.includes('(') || ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE'].some(f => fn.startsWith(f));

  return (
    <div>
      {(windowFuncs || []).map((w, i) => {
        const sql = buildWindowSQL(w, c => `"${c}"`);
        return (
          <div key={w.id} className="qb-card qb-card--purple">
            <div className="qb-card-header">
              <div className="qb-card-badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                <Layers size={11} /> Window Function
              </div>
              <div className="flex items-center gap-2 mb-1.5" style={{ gap: '4px' }}>
                <input
                  className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]"
                  value={w.alias}
                  onChange={e => upd(i, 'alias', e.target.value)}
                  placeholder="alias"
                  style={{ width: '120px', fontWeight: 600 }}
                />
                <button className="qb-btn-icon qb-btn-icon--danger" onClick={() => del(i)}>
                  <X size={12} />
                </button>
              </div>
            </div>

            <div className="qb-grid-3">
              <div>
                <div className="qb-label">Function</div>
                <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={w.func} onChange={e => upd(i, 'func', e.target.value)}>
                  {WINDOW_FUNCS.map(g => (
                    <optgroup key={g.group} label={`── ${g.group} ──`}>
                      {g.funcs.map(f => <option key={f} value={f}>{f}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              {needsCol(w.func) && (
                <div>
                  <div className="qb-label">Column</div>
                  <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={w.col || ''} onChange={e => upd(i, 'col', e.target.value)}>
                    <option value="">Column...</option>
                    <option value="*">* (all)</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div>
                <div className="qb-label">Partition By</div>
                <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={w.partBy || ''} onChange={e => upd(i, 'partBy', e.target.value)}>
                  <option value="">None</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="qb-grid-3" style={{ marginTop: '8px' }}>
              <div>
                <div className="qb-label">Order By</div>
                <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={w.orderBy || ''} onChange={e => upd(i, 'orderBy', e.target.value)}>
                  <option value="">None</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="qb-label">Direction</div>
                <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={w.dir || 'ASC'} onChange={e => upd(i, 'dir', e.target.value)}>
                  <option value="ASC">ASC ↑</option>
                  <option value="DESC">DESC ↓</option>
                </select>
              </div>
              <div>
                <div className="qb-label">Frame</div>
                <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={w.frameType || ''} onChange={e => upd(i, 'frameType', e.target.value)}>
                  <option value="">Default</option>
                  <option value="ROWS">ROWS</option>
                  <option value="RANGE">RANGE</option>
                </select>
              </div>
            </div>

            {sql && (
              <div className="qb-sql-preview" style={{ marginTop: '8px' }}>
                <code>{sql}</code>
              </div>
            )}
          </div>
        );
      })}

      <button onClick={add} className="w-full py-1.5 rounded-lg bg-[rgba(92,98,236,0.1)] text-[#7b81f5] text-[0.7rem] font-medium border border-dashed border-[rgba(92,98,236,0.3)] hover:bg-[rgba(92,98,236,0.15)] flex justify-center items-center gap-1 mt-1 transition-all" style={{ borderColor: 'rgba(139,92,246,0.35)', color: '#a78bfa' }}>
        <Plus size={12} /> Add Window Function
      </button>
    </div>
  );
}
