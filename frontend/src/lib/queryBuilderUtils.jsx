import { ChevronDown, ChevronRight, Hash, Type, Calendar, ToggleLeft, X } from 'lucide-react';
import { useEffect, useState, useRef, useMemo } from 'react';

import { buildWhereSQL } from '../components/query/WhereBuilder';
import { buildHavingSQL } from '../components/query/HavingBuilder';
import { buildCaseSQL } from '../components/query/CaseBuilder';
import { buildUnionSQL } from '../components/query/UnionBuilder';
import { buildNullFuncSQL } from '../components/query/NullFunctionsBuilder';

let _uid = 0;
export const uid = () => `u${++_uid}`;

export function quoteIdentifier(col, ambiguousCols = new Set(), mainAlias = '') {
  if (col === undefined || col === null || col === '') return '';
  if (typeof col === 'object') return '';
  const s = String(col);
  if (s.includes('[object Object]')) return '';
  if (s === '*') return '*';

  if (s.includes('.')) {
    return s.split('.').map(p => `"${p}"`).join('.');
  }
  if (ambiguousCols.has(s.toLowerCase()) && mainAlias) {
    return `"${mainAlias}"."${s}"`;
  }
  return `"${s}"`;
}

export const AGG_FUNCTIONS = ['COUNT', 'COUNT DISTINCT', 'SUM', 'AVG', 'MIN', 'MAX', 'MEDIAN', 'STDDEV'];
export const JOIN_TYPES = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'];
export const WINDOW_FUNCS = ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'LEAD', 'LAG'];

// ── Generic Column Helpers ─────────────────────────────────────────

export function inferType(colMeta) {
  const dt = (colMeta?.dtype || '').toLowerCase();
  if (/int|float|f64|i64|decimal|double|numeric/.test(dt)) return 'number';
  if (/date|time|timestamp/.test(dt)) return 'date';
  if (/bool/.test(dt)) return 'boolean';
  return 'text';
}

const TYPE_ICON = { number: Hash, text: Type, date: Calendar, boolean: ToggleLeft };
const TYPE_CLASS = { number: 'qb-col-type-number', text: 'qb-col-type-text', date: 'qb-col-type-date', boolean: 'qb-col-type-bool' };

/**
 * ColPicker — a searchable, type-aware dropdown for column selection.
 */
export function ColPicker({ value, onChange, columns = [], dsInfo, allowStar = false, placeholder = 'Column...', suggestions = [] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const colMeta = col => dsInfo?.columns?.find(c => c.name === col);
  
  const filtered = useMemo(() => {
    const opts = allowStar ? ['*', ...columns] : columns;
    return opts.filter(c => String(c).toLowerCase().includes(q.toLowerCase()));
  }, [columns, q, allowStar]);

  const label = value || placeholder;
  const meta = colMeta(value);
  const type = meta ? inferType(meta) : null;
  const TypeIcon = type ? TYPE_ICON[type] : null;

  return (
    <div className="qb-column-picker" ref={ref}>
      <button className={`qb-column-picker-trigger${open ? ' open' : ''}`} onClick={() => { setOpen(o => !o); setQ(''); }} type="button">
        {TypeIcon && <TypeIcon size={12} style={{ flexShrink: 0, opacity: 0.7 }} />}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.78rem' }}>{label}</span>
        <ChevronDown size={11} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }} />
      </button>
      {open && (
        <div className="qb-column-picker-dropdown">
          <div className="qb-column-search">
            <input autoFocus placeholder="Search columns…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }} />
          </div>
          <div className="qb-column-list">
            <div className="qb-column-option" onClick={() => { onChange(''); setOpen(false); }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>— clear —</span>
            </div>
            {suggestions.length > 0 && !q && (
              <>
                <div style={{ padding: '6px 10px', fontSize: '0.6rem', fontWeight: 800, color: 'var(--accent)', background: 'var(--accent)10', letterSpacing: '0.05em' }}>SUGGESTIONS FROM SELECT</div>
                {suggestions.map(s => {
                  const m = colMeta(s);
                  const t = m ? inferType(m) : 'other';
                  return (
                    <div key={`sug_${s}`} className={`qb-column-option${value === s ? ' selected' : ''}`} onClick={() => { onChange(s); setOpen(false); setQ(''); }}>
                      <span className={`qb-col-type-badge ${TYPE_CLASS[t] || 'qb-col-type-other'}`}>{t.slice(0, 3)}</span>
                      <span style={{ flex: 1, fontWeight: 700 }}>{s}</span>
                    </div>
                  );
                })}
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              </>
            )}
            {filtered.map(c => {
              const m = colMeta(c);
              const t = m ? inferType(m) : 'other';
              return (
                <div key={c} className={`qb-column-option${value === c ? ' selected' : ''}`} onClick={() => { onChange(c); setOpen(false); setQ(''); }}>
                  <span className={`qb-col-type-badge ${TYPE_CLASS[t] || 'qb-col-type-other'}`}>{t.slice(0, 3)}</span>
                  <span style={{ flex: 1, marginLeft: '8px' }}>{c}</span>
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ padding: 10, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export function SectionHdr({ icon: Icon, title, color = 'var(--accent)', collapsed, onToggle, badge, description }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
        padding: '7px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)', marginBottom: collapsed ? '6px' : '10px',
        userSelect: 'none', transition: 'border-color 0.15s'
      }}
      title={description}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <Icon size={13} style={{ color }} />
      <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>{title}</span>
      {badge !== undefined && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{badge}</span>}
      {collapsed ? <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
    </div>
  );
}

export function ColSel({ value, onChange, columns = [], computedCols = [], suggestions = [], placeholder = 'Column...', allowStar = false }) {
  const hasComputed = computedCols.length > 0;
  const hasSuggestions = suggestions.length > 0;
  return (
    <select className="select" value={value} onChange={e => onChange(e.target.value)}
      style={{ fontSize: '0.72rem', padding: '3px 22px 3px 6px', height: '26px', minWidth: '100px', flexShrink: 0 }}>
      <option value="">{placeholder}</option>
      {allowStar && <option value="*">* (all)</option>}
      {hasSuggestions && (
        <optgroup label="── Suggestions ──">
          {suggestions.map(s => <option key={`sug_${s}`} value={s}>{s}</option>)}
        </optgroup>
      )}
      {hasComputed ? (
        <>
          <optgroup label="── Computed / Aliases ──">
            {computedCols.map(c => <option key={`comp_${c}`} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="── Dataset Columns ──">
            {columns.map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </>
      ) : (
        columns.map(c => <option key={c} value={c}>{c}</option>)
      )}
    </select>
  );
}

export function ValInput({ col, op, val, onChange, vals, onLoad, colType }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const noVal = op === 'IS NULL' || op === 'IS NOT NULL';
  const multi = op === 'IN' || op === 'NOT IN';
  const between = op === 'BETWEEN';
  const tags = multi ? (Array.isArray(val) ? val : (val ? String(val).split(',').map(s=>s.trim()).filter(Boolean) : [])) : [];
  const filtered = (vals||[]).filter(v => String(v).toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const fn = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  if (noVal) return null;
  if (between) {
    const parts = Array.isArray(val) ? val : (val||'').split(',');
    const [a,b] = [parts[0]||'', parts[1]||''];
    return (
      <div className="flex items-center gap-2 mb-1.5" style={{ flex: 1 }}>
        <input className="bg-transparent border border-[#444] rounded-md text-white text-[12px] px-2 py-1 flex-1 outline-none focus:border-accent" style={{ flex: 1 }} value={a} placeholder="from" onChange={e=>onChange([e.target.value,b])} />
        <span className="qb-label" style={{ margin: 0, opacity: 0.5 }}>AND</span>
        <input className="bg-transparent border border-[#444] rounded-md text-white text-[12px] px-2 py-1 flex-1 outline-none focus:border-accent" style={{ flex: 1 }} value={b} placeholder="to" onChange={e=>onChange([a,e.target.value])} />
      </div>
    );
  }

  return (
    <div style={{ position:'relative', flex:1, minWidth:0 }} ref={wrapRef}>
      {multi ? (
        <div onClick={() => { setOpen(true); if (col && onLoad) onLoad(col); }} className="qb-tag-input" style={{ background: 'transparent', border: '1px solid #444' }}>
          {tags.map(t => (
            <span key={t} className="qb-tag">
              {t} <X size={10} className="qb-tag-remove" onClick={e=>{ e.stopPropagation(); onChange(tags.filter(x=>x!==t)); }} />
            </span>
          ))}
          <input className="bg-transparent border-none text-white text-[12px] px-2 py-1 flex-1 outline-none" style={{ background:'transparent', flex: 1, padding: 0 }} placeholder={tags.length ? '' : '...'} value={search} onChange={e=>{setSearch(e.target.value);setOpen(true);}} />
        </div>
      ) : (
        <input className="bg-transparent border border-[#444] rounded-md text-white text-[12px] px-2 py-1 flex-1 outline-none focus:border-accent" value={typeof val==='string' ? val : (Array.isArray(val) ? val[0]||'' : '')}
          onChange={e=>{onChange(e.target.value);setSearch(e.target.value);setOpen(true);}} 
          onFocus={() => { setOpen(true); if (col && onLoad) onLoad(col); }}
          placeholder={colType==='date'?'YYYY-MM-DD':colType==='number'?'number...':'value...'}
          type={colType==='number'?'number':'text'} />
      )}
      {open && filtered.length > 0 && (
        <div className="qb-column-picker-dropdown" style={{ minWidth: '100%' }}>
          <div className="qb-column-list">
            {filtered.slice(0,50).map(v => (
              <div key={v} className="qb-column-option" onClick={() => { if (multi) { onChange(tags.includes(v) ? tags.filter(x=>x!==v) : [...tags, v]); } else { onChange(v); setOpen(false); } setSearch(''); }}>
                {v}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Extracts possible aliases from a CTE SQL block using regex */
export function extractCteCols(sql) {
  if (!sql) return [];
  const matches = [...sql.matchAll(/AS\s+"?([a-zA-Z0-9_]+)"?/gi)];
  const cols = matches.map(m => m[1]);
  const selectPart = sql.match(/SELECT\s+(.+?)\s+FROM/i);
  if (selectPart) {
     const inner = selectPart[1];
     const items = inner.split(',').map(s => s.trim().split(/\s+/).pop().replace(/"/g, ''));
     items.forEach(i => { if (!cols.includes(i) && !['*', 'ALL', 'DISTINCT'].includes(i.toUpperCase())) cols.push(i); });
  }
  return [...new Set(cols)];
}

export function CteColPicker({ value, cteSql, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrap = useRef(null);
  
  const options = extractCteCols(cteSql);
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const fn = e => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={wrap} style={{ position: 'relative', width: '100%' }}>
      <input 
        className="bg-transparent border border-[#444] rounded-md text-white text-[12px] px-2 py-1 flex-1 outline-none focus:border-accent w-full" 
        value={value} 
        onChange={e => { onChange(e.target.value); setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="sub col..."
      />
      {open && filtered.length > 0 && (
        <div className="qb-column-picker-dropdown" style={{ minWidth: '100%' }}>
          {filtered.map(o => (
            <div key={o} className="qb-column-option" onClick={() => { onChange(o); setOpen(false); setSearch(''); }}>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function deriveComputedCols({ selects = [], cases = [], nullFuncs = [], windowFuncs = [] }) {
  const aliases = [];
  selects.forEach(s => { if (s.alias && s.alias.trim()) aliases.push(s.alias.trim()); });
  cases.forEach(c => { if (c.alias && c.alias.trim()) aliases.push(c.alias.trim()); });
  nullFuncs.forEach(nf => { if (nf.alias && nf.alias.trim()) aliases.push(nf.alias.trim()); });
  windowFuncs.forEach(w => { if (w.alias && w.alias.trim()) aliases.push(w.alias.trim()); });
  return [...new Set(aliases)];
}

export function buildSQL({
  tableName, selects, joins, wheres, groupBy, havingConds, orderBy, limit, offset,
  ctes, windowFuncs, unions, cases, nullFuncs, selectDistinct, datasets = []
}) {
  if (!tableName && (!unions || unions.length === 0)) return '';
  const lines = [];
  
  const validCtes = (ctes || []).filter(c => c.name && c.sql);
  if (validCtes.length > 0)
    lines.push('WITH ' + validCtes.map(c => `${c.name} AS (\n  ${c.sql}\n)`).join(',\n'));

  if (!tableName && unions && unions.length > 0) {
    const uSql = buildUnionSQL(unions, '');
    if (uSql) lines.push(uSql);
    if (limit) lines.push(`LIMIT ${limit}`);
    if (offset) lines.push(`OFFSET ${offset}`);
    return lines.join('\n');
  }

  const colCounts = {};
  if (datasets.length > 0) {
    const track = dsName => (datasets.find(d => d.table_name === dsName || d.name === dsName)?.columns || []).forEach(c => {
      const lower = c.name.toLowerCase();
      colCounts[lower] = (colCounts[lower] || 0) + 1;
    });
    track(tableName);
    (joins || []).forEach(j => { if (j.table && !j.table.startsWith('__cte__')) track(j.table); });
  }
  const ambiguousCols = new Set(Object.keys(colCounts).filter(k => colCounts[k] > 1));

  let cleanMainAlias = '';
  if (tableName && !tableName.startsWith('__cte__')) {
    const mainDs = datasets.find(d => d.table_name === tableName || d.name === tableName);
    if (mainDs && mainDs.name) {
      cleanMainAlias = mainDs.name.replace(/[^a-zA-Z0-9_]/g, '_');
    }
  }

  const gCols = (groupBy || []).filter(Boolean);
  const rawSelCols = new Set((selects || []).filter(s => !s.agg && s.col).map(s => s.col));
  const aliases = new Set([
    ...(selects || []).map(s => s.alias),
    ...(windowFuncs || []).map(w => w.alias),
    ...(cases || []).map(c => c.alias),
    ...(nullFuncs || []).map(nf => nf.alias)
  ].filter(Boolean));

  const sParts = [];
  gCols.forEach(g => { if (!rawSelCols.has(g) && !aliases.has(g)) sParts.push(quoteIdentifier(g, ambiguousCols, cleanMainAlias)); });

  (selects || []).forEach(s => {
    if (!s.col) return;
    let e = quoteIdentifier(s.col, ambiguousCols, cleanMainAlias);
    if (s.agg) e = s.agg === 'COUNT DISTINCT' ? `COUNT(DISTINCT ${e})` : `${s.agg}(${e})`;
    if (s.alias) e += ` AS "${s.alias}"`;
    sParts.push(e);
  });

  (cases || []).forEach(c => {
    const cSql = buildCaseSQL(c, ambiguousCols, cleanMainAlias);
    if (cSql) sParts.push(cSql.replace(/\n/g, '\n  '));
  });

  (nullFuncs || []).forEach(nf => {
    const nfSql = buildNullFuncSQL(nf, ambiguousCols, cleanMainAlias);
    if (nfSql) sParts.push(nfSql);
  });

  (windowFuncs || []).forEach(w => {
    if (!w.func || !w.alias) return;
    let fn = w.func.includes('(') ? w.func : `${w.func}()`;
    let over = 'OVER (';
    if (w.partBy) over += `PARTITION BY ${quoteIdentifier(w.partBy, ambiguousCols, cleanMainAlias)} `;
    if (w.orderBy) over += `ORDER BY ${quoteIdentifier(w.orderBy, ambiguousCols, cleanMainAlias)} ${w.dir || 'ASC'}`;
    sParts.push(`${fn} ${over}) AS "${w.alias}"`);
  });

  if (!sParts.length) sParts.push('*');
  lines.push(`SELECT${selectDistinct ? ' DISTINCT' : ''}\n  ${sParts.join(',\n  ')}`);
  
  if (cleanMainAlias) lines.push(`FROM "${tableName}" AS "${cleanMainAlias}"`);
  else if (tableName) lines.push(`FROM "${tableName}"`);

  (joins || []).forEach(j => {
    if (!j.table || !j.leftCol || !j.rightCol) return;
    const isCTE = j.table.startsWith('__cte__');
    let joinTarget, joinAlias;
    if (isCTE) {
      const cteName = j.table.replace('__cte__', '');
      joinTarget = cteName;
      joinAlias = cteName;
    } else {
      const ds = datasets.find(d => d.name === j.table || d.table_name === j.table);
      if (ds) {
        joinTarget = `"${ds.table_name}"`;
        const cleanAlias = ds.name.replace(/[^a-zA-Z0-9_]/g, '_');
        joinTarget += ` AS "${cleanAlias}"`;
        joinAlias = `"${cleanAlias}"`;
      } else {
        joinTarget = `"${j.table}"`;
        joinAlias = `"${j.table}"`;
      }
    }
    const leftTableRef = cleanMainAlias || tableName;
    const leftQ = j.leftCol.includes('.') ? quoteIdentifier(j.leftCol) : quoteIdentifier(`${leftTableRef}.${j.leftCol}`);
    const rightQ = j.rightCol.includes('.') ? quoteIdentifier(j.rightCol) : `${joinAlias}.${quoteIdentifier(j.rightCol)}`;
    lines.push(`${j.type || 'INNER JOIN'} ${joinTarget} ON ${leftQ} = ${rightQ}`);
  });

    const wSQL = buildWhereSQL(wheres, ambiguousCols, cleanMainAlias, validCtes.map(c => c.name));
  if (wSQL) lines.push(`WHERE ${wSQL}`);

  if (gCols.length) {
    const gParts = gCols.map(g => {
      const sMatch = (selects || []).find(s => s.alias === g);
      if (sMatch && sMatch.col && !sMatch.agg) return quoteIdentifier(sMatch.col, ambiguousCols, cleanMainAlias);
      return quoteIdentifier(g, ambiguousCols, cleanMainAlias);
    });
    lines.push(`GROUP BY ${gParts.join(', ')}`);
  }

    const hSQL = buildHavingSQL(havingConds, ambiguousCols, cleanMainAlias, validCtes.map(c => c.name));
  if (hSQL) lines.push(`HAVING ${hSQL}`);

  const oCols = (orderBy || []).filter(o => o.col);
  if (oCols.length) {
    const oParts = oCols.map(o => {
      const sMatch = (selects || []).find(s => s.alias === o.col);
      if (sMatch && sMatch.col && !sMatch.agg) return `${quoteIdentifier(sMatch.col, ambiguousCols, cleanMainAlias)} ${o.dir}`;
      if (aliases.has(o.col)) return `"${o.col}" ${o.dir}`;
      if (gCols.length > 0 && !gCols.includes(o.col)) return `ANY_VALUE(${quoteIdentifier(o.col, ambiguousCols, cleanMainAlias)}) ${o.dir}`;
      return `${quoteIdentifier(o.col, ambiguousCols, cleanMainAlias)} ${o.dir}`;
    });
    lines.push(`ORDER BY ${oParts.join(', ')}`);
  }

  if (unions && unions.length > 0) {
    const unionParts = buildUnionSQL(unions, lines.join('\n'));
    if (unionParts) lines.push(unionParts);
  }

  if (limit && String(limit).trim() !== '') lines.push(`LIMIT ${limit}`);
  if (offset && String(offset).trim() !== '') lines.push(`OFFSET ${offset}`);
  
  return lines.join('\n');
}
