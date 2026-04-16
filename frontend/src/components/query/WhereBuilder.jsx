import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, ListTree, ChevronDown } from 'lucide-react';
import { executeQuery } from '../../lib/api';
import { ColPicker, quoteIdentifier, inferType, ValInput, extractCteCols, CteColPicker } from '../../lib/queryBuilderUtils';

const GROUP_COLORS = ['#6366f1','#ec4899','#f59e0b','#22c55e','#06b6d4','#a855f7'];

// ── Complete operator sets per type ───────────────────────────────────────
const TYPE_OPS = {
  number: [
    '=','!=','>','<','>=','<=',
    'BETWEEN','NOT BETWEEN',
    'IN','NOT IN',
    'EXISTS','NOT EXISTS',
    'IS NULL','IS NOT NULL',
  ],
  text: [
    '=','!=',
    'LIKE','NOT LIKE','ILIKE',
    'IN','NOT IN',
    'EXISTS','NOT EXISTS',
    'IS NULL','IS NOT NULL',
  ],
  date: [
    '=','!=','>','<','>=','<=',
    'BETWEEN','NOT BETWEEN',
    'IS NULL','IS NOT NULL',
  ],
  boolean: ['=','!=','IS NULL','IS NOT NULL'],
};

const ALL_OPS = [
  '=','!=','>','<','>=','<=',
  'LIKE','NOT LIKE','ILIKE',
  'IN','NOT IN',
  'BETWEEN','NOT BETWEEN',
  'EXISTS','NOT EXISTS',
  'IS NULL','IS NOT NULL',
];

// Group ops by category for a cleaner dropdown UI
const OP_GROUPS = [
  { label: 'Comparison',  ops: ['=','!=','>','<','>=','<='] },
  { label: 'Range',       ops: ['BETWEEN','NOT BETWEEN'] },
  { label: 'List',        ops: ['IN','NOT IN'] },
  { label: 'Pattern',     ops: ['LIKE','NOT LIKE','ILIKE'] },
  { label: 'Existence',   ops: ['EXISTS','NOT EXISTS'] },
  { label: 'Null',        ops: ['IS NULL','IS NOT NULL'] },
];

let _uid = 0;
const uid = () => `id_${++_uid}_${Math.random().toString(36).slice(2,6)}`;
export const newRule = (logicBefore='AND') => ({ id:uid(), type:'rule', logicBefore, col:'', op:'=', val:'', not:false });
export const newGroupNode = (logicBefore='AND') => ({ id:uid(), type:'group', logicBefore, children:[newRule()] });
export const newGroup = () => newGroupNode('AND');

// ── SQL builder (handles all new operators) ───────────────────────────────
export function buildWhereSQL(node, ambiguousCols = new Set(), mainAlias = '', cteNames = []) {
  if (Array.isArray(node)) {
    if (node.length === 0) return '';
    if (node[0].conditions) {
      node = { type:'group', children: node.flatMap(g => g.conditions.map(c=>({type:'rule',...c}))) };
    } else {
      node = { type:'group', children: node };
    }
  }
  if (!node || !node.children) return '';

  const buildNode = (n) => {
    if (n.type === 'rule') {
      if (!n.col) return null;
      const col = quoteIdentifier(n.col, ambiguousCols, mainAlias);
      const isCte = (v) => cteNames && cteNames.includes(v);

      // CTE subquery comparison
      if (n.valType === 'cte_subquery' || (n.valType === 'column' && isCte(n.val))) {
        const cteName = n.valType === 'cte_subquery' ? n.cteRef?.cteName : n.val;
        if (!cteName) return null;
        const subCol = (n.valType === 'cte_subquery' ? n.cteRef?.cteCol : '') || 'AvgProfit';
        const subQ = `(SELECT "${subCol}" FROM "${cteName}")`;
        const sql = `${col} ${n.op} ${subQ}`;
        return n.not ? `NOT (${sql})` : sql;
      }

      // Column-to-column comparison
      if (n.valType === 'column') {
        if (!n.val) return null;
        const col2 = quoteIdentifier(n.val, ambiguousCols, mainAlias);
        const sql = `${col} ${n.op} ${col2}`;
        return n.not ? `NOT (${sql})` : sql;
      }

      // NULL checks
      if (n.op === 'IS NULL' || n.op === 'IS NOT NULL') return `${col} ${n.op}`;

      // EXISTS / NOT EXISTS — use a subquery or just the value as inline SQL
      if (n.op === 'EXISTS' || n.op === 'NOT EXISTS') {
        const subSql = n.val || '';
        if (!subSql.trim()) return null;
        // If user typed a sub-select, wrap it; otherwise treat val as a column/expression
        const inner = subSql.trim().toUpperCase().startsWith('SELECT')
          ? `(${subSql.trim()})`
          : subSql.trim();
        return `${n.op} ${inner}`;
      }

      const v = n.val;
      if (v === '' || v === null || v === undefined) return null;

      // IN / NOT IN
      if (n.op === 'IN' || n.op === 'NOT IN') {
        const vals = Array.isArray(v) ? v : String(v).split(',').map(s => s.trim()).filter(Boolean);
        if (!vals.length) return null;
        return `${col} ${n.op} (${vals.map(x => isNaN(x) ? `'${x}'` : x).join(', ')})`;
      }

      // BETWEEN / NOT BETWEEN
      if (n.op === 'BETWEEN' || n.op === 'NOT BETWEEN') {
        const parts = Array.isArray(v) ? v : String(v).split(',').map(s => s.trim());
        const [a, b] = parts;
        if (!a || !b) return null;
        const fmtA = isNaN(a) ? `'${a}'` : a;
        const fmtB = isNaN(b) ? `'${b}'` : b;
        if (n.op === 'NOT BETWEEN') return `${col} NOT BETWEEN ${fmtA} AND ${fmtB}`;
        return `${col} BETWEEN ${fmtA} AND ${fmtB}`;
      }

      // LIKE / NOT LIKE / ILIKE
      if (n.op === 'LIKE' || n.op === 'NOT LIKE' || n.op === 'ILIKE') {
        const sql = `${col} ${n.op} '${v}'`;
        return n.not ? `NOT (${sql})` : sql;
      }

      // Default comparison
      const sql = `${col} ${n.op} ${isNaN(v) || v === '' ? `'${v}'` : v}`;
      return n.not ? `NOT (${sql})` : sql;
    }

    if (n.type === 'group') {
      const parts = (n.children || []).map((child, i) => {
        const sql = buildNode(child);
        if (!sql) return null;
        if (i === 0) return sql;
        return `${child.logicBefore || 'AND'} ${sql}`;
      }).filter(Boolean);
      if (!parts.length) return null;
      const grpSql = parts.length === 1 ? parts[0] : `(${parts.join(' ')})`;
      return n.not ? `NOT ${grpSql}` : grpSql;
    }
    return null;
  };

  const sql = buildNode(node);
  if (sql && sql.startsWith('(') && sql.endsWith(')')) return sql.slice(1, -1);
  return sql || '';
}

// ── Operator dropdown with grouped options ────────────────────────────────
function OpSelect({ value, onChange, availableOps }) {
  // Build filtered groups
  const filtered = OP_GROUPS
    .map(g => ({ ...g, ops: g.ops.filter(op => availableOps.includes(op)) }))
    .filter(g => g.ops.length > 0);

  return (
    <select
      className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec] cursor-pointer"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ minWidth: 90, flexShrink: 0 }}
    >
      {filtered.map(g => (
        <optgroup key={g.label} label={g.label}>
          {g.ops.map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// ── Value input that adapts to operator ──────────────────────────────────
function SmartValInput({ op, col, val, onChange, vals, onLoad, colType }) {
  // Operators that need no value input
  if (['IS NULL','IS NOT NULL'].includes(op)) {
    return <span className="text-[10px] text-white/20 italic px-2">no value needed</span>;
  }

  // EXISTS / NOT EXISTS — free-text subquery
  if (['EXISTS','NOT EXISTS'].includes(op)) {
    return (
      <div style={{ flex: 1, minWidth: 180 }}>
        <input
          className="qb-input w-full font-mono text-[0.7rem]"
          value={val || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="SELECT 1 FROM table WHERE …"
        />
      </div>
    );
  }

  // BETWEEN / NOT BETWEEN — two inputs
  if (['BETWEEN','NOT BETWEEN'].includes(op)) {
    const parts = Array.isArray(val) ? val : String(val || '').split(',').map(s => s.trim());
    const [a, b] = parts;
    const update = (idx, v) => {
      const next = [a || '', b || ''];
      next[idx] = v;
      onChange(next.join(','));
    };
    return (
      <div className="flex items-center gap-1" style={{ flex: 1 }}>
        <input
          className="qb-input"
          placeholder="from"
          value={a || ''}
          onChange={e => update(0, e.target.value)}
          style={{ width: 80 }}
        />
        <span className="text-[10px] text-white/30">and</span>
        <input
          className="qb-input"
          placeholder="to"
          value={b || ''}
          onChange={e => update(1, e.target.value)}
          style={{ width: 80 }}
        />
      </div>
    );
  }

  // IN / NOT IN — comma separated
  if (['IN','NOT IN'].includes(op)) {
    return (
      <div style={{ flex: 1, minWidth: 140 }}>
        <input
          className="qb-input w-full"
          value={val || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="val1, val2, val3"
        />
        <div className="text-[9px] text-white/20 mt-0.5 pl-1">Comma-separated values</div>
      </div>
    );
  }

  // LIKE / NOT LIKE — with pattern hint
  if (['LIKE','NOT LIKE','ILIKE'].includes(op)) {
    return (
      <div style={{ flex: 1, minWidth: 140 }}>
        <input
          className="qb-input w-full"
          value={val || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="%pattern%"
        />
        <div className="text-[9px] text-white/20 mt-0.5 pl-1">Use % as wildcard</div>
      </div>
    );
  }

  // Default — use existing ValInput
  return <ValInput col={col} op={op} val={val} onChange={onChange} vals={vals} onLoad={onLoad} colType={colType} />;
}

// ── Filter Rule component ─────────────────────────────────────────────────
function FilterNode({ node, onChange, onRemove, columns, loadVals, vCache, datasetInfo, depth, ctes }) {
  if (node.type === 'rule') {
    const ctype = inferType(datasetInfo?.columns?.find(c => c.name === node.col));
    const vType = node.valType || 'literal';
    const cteNames = (ctes || []).filter(c => c.name).map(c => c.name);
    const availableOps = vType !== 'literal' ? ['=','!=','>','<','>=','<='] : (TYPE_OPS[ctype] || ALL_OPS);

    return (
      <div className="qb-filter-rule" style={{ gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--border-light)' }}>
        {/* NOT toggle */}
        <button
          className={`qb-btn qb-btn--ghost${node.not ? ' qb-btn--danger' : ''}`}
          style={{ height: 28, width: 36, fontSize: '0.65rem', flexShrink: 0 }}
          onClick={() => onChange({...node, not:!node.not})}
          title="Toggle NOT"
        >
          {node.not ? 'NOT' : 'IF'}
        </button>

        {/* Column picker */}
        <div style={{ flex: 1, minWidth: 100 }}>
          <ColPicker value={node.col} onChange={v => onChange({...node, col:v, val:'', op:'='})} columns={columns} dsInfo={datasetInfo} />
        </div>

        {/* Operator grouped dropdown */}
        <OpSelect value={node.op} onChange={op => onChange({...node, op, val:''})} availableOps={availableOps} />

        {/* Value mode toggle (literal / column / CTE sub) */}
        <div className="qb-val-mode-group">
          {[['literal','Value'],['column','Field'],['cte_subquery','Sub']].map(([m, lbl]) => (
            <button
              key={m}
              className={`qb-val-mode-btn${vType === m ? ' active' : ''}`}
              onClick={() => onChange({...node, valType:m, val:'', cteRef: m === 'cte_subquery' ? { cteName: cteNames[0]||'', cteCol:'' } : undefined})}
              disabled={m === 'cte_subquery' && !cteNames.length}
              title={m === 'cte_subquery' ? 'Use a CTE result' : `Compare to ${lbl}`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Value input — adapts to operator */}
        {vType === 'literal' && (
          <SmartValInput
            op={node.op}
            col={node.col}
            val={node.val}
            onChange={v => onChange({...node, val:v})}
            vals={vCache[node.col]}
            onLoad={loadVals}
            colType={ctype}
          />
        )}

        {vType === 'column' && (
          <div style={{ flex: 1.2, minWidth: 120 }}>
            <ColPicker
              value={node.val}
              onChange={v => {
                if (cteNames.includes(v)) {
                  onChange({...node, valType:'cte_subquery', val:'', cteRef:{ cteName:v, cteCol:'' }});
                } else {
                  onChange({...node, val:v});
                }
              }}
              columns={columns}
              dsInfo={datasetInfo}
              placeholder="Select field..."
            />
          </div>
        )}

        {vType === 'cte_subquery' && (
          <div className="flex items-center gap-2 mb-1.5" style={{ flex: 1.5, gap: 4 }}>
            <select
              className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]"
              style={{ flex: 1 }}
              value={node.cteRef?.cteName||''}
              onChange={e => onChange({...node, cteRef:{...node.cteRef, cteName:e.target.value}})}
            >
              <option value="">CTE...</option>
              {cteNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div style={{ flex: 1, position: 'relative' }}>
              <CteColPicker
                value={node.cteRef?.cteCol||''}
                cteSql={ctes?.find(x => x.name === node.cteRef?.cteName)?.sql}
                onChange={v => onChange({...node, cteRef:{...node.cteRef, cteCol:v}})}
              />
            </div>
          </div>
        )}

        {depth > 0 && <button className="qb-btn-icon qb-btn-icon--danger" onClick={onRemove}><X size={12}/></button>}
      </div>
    );
  }

  if (node.type === 'group') {
    const color = GROUP_COLORS[depth % GROUP_COLORS.length];
    return (
      <div className="qb-filter-group" style={{ borderLeft:`3px solid ${color}`, border:`1px solid ${color}25`, background:'rgba(0,0,0,0.02)' }}>
        <div className="qb-card-header" style={{ marginBottom: 6 }}>
          <span className="qb-label" style={{ color, margin: 0, opacity: 0.8 }}>{depth===0?'ROOT':'GROUP'}</span>
          <div className="flex items-center gap-2 mb-1.5">
            <button className="qb-btn qb-btn--secondary" style={{ height:22, fontSize:'0.65rem' }} onClick={()=>onChange({...node, children:[...node.children, newGroupNode('AND')]})}>
              <ListTree size={10}/> Sub
            </button>
            {depth > 0 && <button className="qb-btn-icon qb-btn-icon--danger" onClick={onRemove}><X size={12}/></button>}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {(node.children||[]).map((child, i) => (
            <div key={child.id} className="flex items-center gap-2 mb-1.5" style={{ flexWrap:'nowrap', alignItems:'flex-start' }}>
              {i > 0 ? (
                <select
                  className="qb-logic-select"
                  value={child.logicBefore||'AND'}
                  onChange={e => onChange({...node, children:node.children.map((c,j)=>j===i?{...c,logicBefore:e.target.value}:c)})}
                  style={{ background:color, marginTop: child.type==='rule'?8:12 }}
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              ) : <div style={{ width:44 }} />}
              <div style={{ flex:1 }}>
                <FilterNode
                  depth={depth+1}
                  node={child}
                  onChange={newC => onChange({...node, children:node.children.map((c,j)=>j===i?newC:c)})}
                  onRemove={() => onChange({...node, children:node.children.filter((_,j)=>j!==i)})}
                  columns={columns}
                  loadVals={loadVals}
                  vCache={vCache}
                  datasetInfo={datasetInfo}
                  ctes={ctes}
                />
              </div>
            </div>
          ))}
          <button
            className="qb-btn qb-btn--ghost"
            onClick={()=>onChange({...node, children:[...node.children, newRule()]})}
            style={{ color, marginLeft:50, padding:'2px 0' }}
          >
            <Plus size={12}/> Add Condition
          </button>
        </div>
      </div>
    );
  }
}

export default function WhereBuilder({ groups, onChange, columns, datasetInfo, selectedDataset, tableName, ctes }) {
  const [vCache, setVCache] = useState({});
  const loading = useRef(new Set());

  useEffect(() => {
    if (Array.isArray(groups)) {
      if (groups.length === 0) onChange(newGroupNode('AND'));
      else onChange(groups[0]);
    }
  }, [groups]);

  const loadVals = useCallback(async (col) => {
    if (!col || !selectedDataset || !tableName || vCache[col] || loading.current.has(col)) return;
    loading.current.add(col);
    try {
      const res = await executeQuery(
        `SELECT DISTINCT "${col}" as val FROM "${tableName}" WHERE "${col}" IS NOT NULL ORDER BY 1 LIMIT 100`,
        selectedDataset, 1, 100
      );
      setVCache(c => ({ ...c, [col]: (res.rows||[]).map(r=>r.val).filter(v=>v!==null&&v!=='') }));
    } catch {}
    finally { loading.current.delete(col); }
  }, [selectedDataset, tableName, vCache]);

  const rootNode = Array.isArray(groups) ? groups[0] : groups;
  if (!rootNode) return null;

  return (
    <div className="qb-where-builder">
      <FilterNode
        depth={0}
        node={rootNode}
        onChange={onChange}
        columns={columns}
        datasetInfo={datasetInfo}
        loadVals={loadVals}
        vCache={vCache}
        onRemove={() => {}}
        ctes={ctes}
      />
    </div>
  );
}
