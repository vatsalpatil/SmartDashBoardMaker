import { Plus, X, Lightbulb, Search } from 'lucide-react';
import { ColPicker, quoteIdentifier, ValInput, extractCteCols, CteColPicker } from '../../lib/queryBuilderUtils';
import { executeQuery } from '../../lib/api';
import { useState, useRef, useCallback, useEffect } from 'react';

const HAVING_FUNCS = ['COUNT','COUNT DISTINCT','SUM','AVG','MIN','MAX','MEDIAN','STDDEV'];
const NUM_OPS = ['=','!=','>','<','>=','<=','BETWEEN'];

let _id = 0;
const uid = () => `h_${++_id}`;

function aggExpr(c, ambiguousCols, mainAlias) {
  const col = quoteIdentifier(c.col, ambiguousCols, mainAlias);
  return c.aggFunc==='COUNT DISTINCT'?`COUNT(DISTINCT ${col})`:`${c.aggFunc}(${col})`;
}

export function buildHavingSQL(conds, ambiguousCols = new Set(), mainAlias = '', cteNames = []) {
  return (conds||[]).map((c,i)=>{
    if (!c.val && c.val!==0 && c.valType !== 'cte_subquery') return null;
    
    let expr = aggExpr(c, ambiguousCols, mainAlias);
    let valStr;
    const vType = c.valType || 'literal';
    
    if (vType === 'cte_subquery') {
      const cteName = c.cteRef?.cteName;
      if (!cteName) return null;
      const subCol = c.cteRef?.cteCol || 'AvgValue';
      valStr = `(SELECT "${subCol}" FROM "${cteName}")`;
    } else if (vType === 'column') {
      if (!c.val) return null;
      valStr = quoteIdentifier(c.val, ambiguousCols, mainAlias);
    } else {
      if (c.op==='BETWEEN') {
        const [a,b] = Array.isArray(c.val)?c.val:String(c.val).split(',');
        valStr = `${(a||'').trim()} AND ${(b||'').trim()}`;
      } else {
        valStr = isNaN(String(c.val).trim())||String(c.val).trim()===''?`'${c.val}'`:c.val;
      }
    }
    
    let full = `${expr} ${c.op} ${valStr}`;
    if (c.not) full = `NOT (${full})`;
    return i===0?full:`${c.condLogic||'AND'} ${full}`;
  }).filter(Boolean).join('\n  ');
}

export default function HavingBuilder({ conditions, onChange, columns, computedCols = [], selects, ctes, selectedDataset, tableName }) {
  const [vCache, setVCache] = useState({});
  const loading = useRef(new Set());

  const add = () => onChange([...(conditions||[]), { id:uid(), aggFunc:'COUNT', col:'*', op:'>', val:'', condLogic:'AND' }]);
  const del = i => onChange(conditions.filter((_,j)=>j!==i));
  const upd = (i,k,v) => onChange(conditions.map((c,j)=>j===i?{...c,[k]:v}:c));

  const loadVals = useCallback(async (col) => {
    if (!col||!selectedDataset||!tableName||vCache[col]||loading.current.has(col)) return;
    loading.current.add(col);
    try {
      // For HAVING, we still suggest unique values from the base column being aggregated
      const res = await executeQuery(`SELECT DISTINCT "${col}" as val FROM "${tableName}" WHERE "${col}" IS NOT NULL ORDER BY 1 LIMIT 100`, selectedDataset, 1, 100);
      setVCache(c=>({...c,[col]:(res.rows||[]).map(r=>r.val).filter(v=>v!==null&&v!=='')}));
    } catch(e) {} finally { loading.current.delete(col); }
  }, [selectedDataset, tableName, vCache]);

  return (
    <div className="qb-having-builder">
      {/* Suggestions from SELECT */}
      {selects?.some(s=>s.agg&&s.col) && (
        <div className="qb-tip qb-tip--info" style={{ marginBottom: 12 }}>
          <Lightbulb size={12} style={{ flexShrink: 0 }} />
          <div className="flex items-center gap-2 mb-1.5" style={{ flex: 1, gap: 6 }}>
            <span style={{ fontSize:'0.65rem', opacity: 0.8 }}>Suggestions:</span>
            {selects.filter(s=>s.agg&&s.col).map((s,i)=>(
              <button key={i} onClick={()=>onChange([...(conditions||[]),{ id:uid(), aggFunc:s.agg, col:s.col, op:'>', val:'', condLogic:'AND' }])}
                className="qb-tag" style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>
                + {s.alias || `${s.agg}(${s.col})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {(conditions||[]).map((c,i)=>{
        const vType = c.valType || 'literal';
        const cteNames = (ctes||[]).filter(c=>c.name).map(c=>c.name);

        return (
          <div key={c.id} className="flex items-center gap-2 mb-1.5" style={{ alignItems: 'flex-start', marginBottom: 8, flexWrap: 'nowrap' }}>
            {i>0 ? (
              <select className="qb-logic-select" value={c.condLogic||'AND'} onChange={e=>upd(i,'condLogic',e.target.value)} style={{ marginTop: 2 }}>
                <option value="AND">AND</option><option value="OR">OR</option>
              </select>
            ) : <div style={{ width: 44 }} />}

            <div className="qb-filter-rule" style={{ flex: 1, gap: 8, padding: '8px 4px' }}>
              <button 
                className={`qb-btn qb-btn--ghost${c.not ? ' qb-btn--danger' : ''}`} 
                style={{ height: 28, width: 44, fontSize: '0.65rem' }} 
                onClick={() => upd(i, 'not', !c.not)}
              >
                {c.not ? 'NOT' : 'IF'}
              </button>
              
              <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={c.aggFunc} onChange={e=>upd(i,'aggFunc',e.target.value)} style={{ width: 90 }}>
                {HAVING_FUNCS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>

              <div style={{ flex: 1 }}>
                <ColPicker 
                  value={c.col} 
                  onChange={v=>upd(i,'col',v)} 
                  columns={[...(computedCols||[]), ...(columns||[])]} 
                  allowStar 
                  dsInfo={{ columns: (columns||[]).map(n=>({name:n, dtype:''})) }} 
                  suggestions={[...new Set(selects?.filter(s=>s.col && s.col!=='*').map(s=>s.col)||[])]}
                />
              </div>

              <select className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" value={c.op} onChange={e=>upd(i,'op',e.target.value)} style={{ width: 70, fontWeight: 700 }}>
                {NUM_OPS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>

              <div className="qb-val-mode-group">
                {[['literal', 'Value'], ['column', 'Field'], ['cte_subquery', 'Sub']].map(([m, lbl]) => (
                  <button 
                    key={m} 
                    className={`qb-val-mode-btn${vType === m ? ' active' : ''}`}
                    onClick={() => upd(i, 'valType', m)}
                    disabled={m === 'cte_subquery' && !cteNames.length}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {vType === 'literal' && (
                <div style={{ flex: 1 }}>
                   <ValInput col={c.col} op={c.op} val={c.val} onChange={v=>upd(i,'val',v)} vals={vCache[c.col]} onLoad={loadVals} colType="number" />
                </div>
              )}

              {vType === 'column' && (
                <div style={{ flex: 1.2 }}>
                  <ColPicker value={c.val} onChange={v=>upd(i,'val',v)} columns={[...(computedCols||[]), ...(columns||[])]} dsInfo={{ columns: (columns||[]).map(n=>({name:n, dtype:''})) }} placeholder="Select field..." />
                </div>
              )}

              {vType === 'cte_subquery' && (
                <div className="flex items-center gap-2 mb-1.5" style={{ flex: 1.5, gap: 4 }}>
                  <select 
                    className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]" 
                    style={{ flex: 1 }}
                    value={c.cteRef?.cteName||''} 
                    onChange={e=>upd(i,'cteRef',{...c.cteRef, cteName:e.target.value})}
                  >
                    <option value="">CTE...</option>
                    {cteNames.map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <CteColPicker 
                      value={c.cteRef?.cteCol||''} 
                      cteSql={ctes?.find(x => x.name === c.cteRef?.cteName)?.sql}
                      onChange={v=>upd(i,'cteRef',{...c.cteRef, cteCol:v})} 
                    />
                  </div>
                </div>
              )}

              <button className="qb-btn-icon qb-btn-icon--danger" onClick={()=>del(i)}><X size={12}/></button>
            </div>
          </div>
        );
      })}

      <button className="qb-btn qb-btn--secondary" onClick={add} style={{ marginLeft: 50, height: 26, fontSize: '0.7rem' }}>
        <Plus size={10}/> Add Condition
      </button>
    </div>
  );
}


