import { useState } from 'react';
import { Plus, X } from 'lucide-react';

let _id = 0;
const uid = () => `dml_${++_id}`;

const selStyle = {
  fontSize: '0.7rem', padding: '3px 20px 3px 6px', height: '26px',
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
  outline: 'none', cursor: 'pointer', appearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23636b83' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
};
const inpStyle = {
  fontSize: '0.7rem', padding: '3px 6px', height: '26px',
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none',
};
const lbl = t => <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase' }}>{t}</div>;

export function buildDMLSQL({ dmlMode, dmlTable, insertRows, updateSets, deleteWhere, insertSelectSQL }) {
  if (!dmlTable) return '';
  const tbl = `"${dmlTable}"`;
  if (dmlMode === 'INSERT') {
    const rows = (insertRows || []).filter(r => r.col && r.val !== '');
    if (!rows.length) return `INSERT INTO ${tbl} () VALUES ()`;
    const cols = rows.map(r => `"${r.col}"`).join(', ');
    const vals = rows.map(r => isNaN(r.val) || r.val === '' ? `'${r.val}'` : r.val).join(', ');
    return `INSERT INTO ${tbl} (${cols})\nVALUES (${vals})`;
  }
  if (dmlMode === 'INSERT_SELECT') {
    return `INSERT INTO ${tbl}\n${insertSelectSQL || 'SELECT * FROM ...'}`;
  }
  if (dmlMode === 'UPDATE') {
    const sets = (updateSets || []).filter(s => s.col && s.val !== '');
    if (!sets.length) return `UPDATE ${tbl} SET ...`;
    const setParts = sets.map(s => `  "${s.col}" = ${isNaN(s.val) || s.val === '' ? `'${s.val}'` : s.val}`).join(',\n');
    const w = deleteWhere ? `\nWHERE ${deleteWhere}` : '';
    return `UPDATE ${tbl}\nSET\n${setParts}${w}`;
  }
  if (dmlMode === 'DELETE') {
    const w = deleteWhere ? `\nWHERE ${deleteWhere}` : '';
    return `DELETE FROM ${tbl}${w}`;
  }
  return '';
}

export default function InsertUpdateDeleteBuilder({ state, onChange, columns, datasets }) {
  const { dmlMode = 'INSERT', dmlTable = '', insertRows = [], updateSets = [], deleteWhere = '', insertSelectSQL = '' } = state;
  const upd = (k, v) => onChange({ ...state, [k]: v });

  const addInsertRow = () => upd('insertRows', [...insertRows, { id: uid(), col: '', val: '' }]);
  const delInsertRow = i => upd('insertRows', insertRows.filter((_, j) => j !== i));
  const updInsertRow = (i, k, v) => upd('insertRows', insertRows.map((r, j) => j === i ? { ...r, [k]: v } : r));

  const addUpdateSet = () => upd('updateSets', [...updateSets, { id: uid(), col: '', val: '' }]);
  const delUpdateSet = i => upd('updateSets', updateSets.filter((_, j) => j !== i));
  const updUpdateSet = (i, k, v) => upd('updateSets', updateSets.map((s, j) => j === i ? { ...s, [k]: v } : s));

  const MODE_COLORS = { INSERT: '#10b981', INSERT_SELECT: '#06b6d4', UPDATE: '#f59e0b', DELETE: '#f43f5e' };
  const color = MODE_COLORS[dmlMode] || '#10b981';
  const sql = buildDMLSQL(state);

  return (
    <div>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {[
          { key: 'INSERT', label: 'INSERT INTO' },
          { key: 'INSERT_SELECT', label: 'INSERT SELECT' },
          { key: 'UPDATE', label: 'UPDATE' },
          { key: 'DELETE', label: 'DELETE' },
        ].map(m => (
          <button key={m.key} onClick={() => upd('dmlMode', m.key)}
            style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${dmlMode === m.key ? MODE_COLORS[m.key] : 'var(--border)'}`,
              background: dmlMode === m.key ? `${MODE_COLORS[m.key]}20` : 'transparent',
              color: dmlMode === m.key ? MODE_COLORS[m.key] : 'var(--text-muted)',
              cursor: 'pointer',
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Table selector */}
      <div style={{ marginBottom: '10px' }}>
        {lbl('Target Table')}
        <select value={dmlTable} onChange={e => upd('dmlTable', e.target.value)} style={{ ...selStyle, width: '100%' }}>
          <option value="">Select table...</option>
          {(datasets || []).map(d => <option key={d.id} value={d.table_name}>{d.name}</option>)}
        </select>
      </div>

      {/* INSERT */}
      {dmlMode === 'INSERT' && (
        <div>
          {lbl('Column → Value pairs')}
          {insertRows.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '4px' }}>
              <select value={r.col} onChange={e => updInsertRow(i, 'col', e.target.value)} style={{ ...selStyle, flex: 1, minWidth: '100px' }}>
                <option value="">Column...</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', flexShrink: 0 }}>=</span>
              <input value={r.val} onChange={e => updInsertRow(i, 'val', e.target.value)} placeholder="value..." style={{ ...inpStyle, flex: 1 }} />
              <button onClick={() => delInsertRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}><X size={11} /></button>
            </div>
          ))}
          <button onClick={addInsertRow} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', fontSize: '0.68rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 0' }}>
            <Plus size={10} /> Add row
          </button>
        </div>
      )}

      {/* INSERT SELECT */}
      {dmlMode === 'INSERT_SELECT' && (
        <div>
          {lbl('SELECT statement to insert from')}
          <textarea value={insertSelectSQL} onChange={e => upd('insertSelectSQL', e.target.value)}
            rows={4} placeholder="SELECT col1, col2 FROM source_table WHERE ..."
            style={{ ...inpStyle, width: '100%', height: 'auto', minHeight: '80px', fontFamily: 'var(--font-mono)', resize: 'vertical' }} />
        </div>
      )}

      {/* UPDATE */}
      {dmlMode === 'UPDATE' && (
        <div>
          {lbl('SET — Column = New Value')}
          {updateSets.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '4px' }}>
              <select value={s.col} onChange={e => updUpdateSet(i, 'col', e.target.value)} style={{ ...selStyle, flex: 1 }}>
                <option value="">Column...</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', flexShrink: 0 }}>=</span>
              <input value={s.val} onChange={e => updUpdateSet(i, 'val', e.target.value)} placeholder="new value" style={{ ...inpStyle, flex: 1 }} />
              <button onClick={() => delUpdateSet(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}><X size={11} /></button>
            </div>
          ))}
          <button onClick={addUpdateSet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', fontSize: '0.68rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 0' }}>
            <Plus size={10} /> Add SET
          </button>
          <div style={{ marginTop: '8px' }}>
            {lbl('WHERE condition (optional — leave blank updates ALL rows!)')}
            <input value={deleteWhere} onChange={e => upd('deleteWhere', e.target.value)}
              placeholder='"status" = \'inactive\'" style={{ ...inpStyle, width: '100%', fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>
      )}

      {/* DELETE */}
      {dmlMode === 'DELETE' && (
        <div>
          <div style={{ padding: '8px 10px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.68rem', color: '#f43f5e', fontWeight: 600 }}>⚠️ Warning: DELETE without WHERE removes ALL rows!</span>
          </div>
          {lbl('WHERE condition (strongly recommended)')}
          <input value={deleteWhere} onChange={e => upd('deleteWhere', e.target.value)}
            placeholder='"id" = 123' style={{ ...inpStyle, width: '100%', fontFamily: 'var(--font-mono)' }} />
        </div>
      )}

      {/* Preview */}
      {sql && (
        <div style={{ marginTop: '10px', padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: `1px solid ${color}40` }}>
          <pre style={{ fontSize: '0.65rem', color, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', margin: 0 }}>{sql}</pre>
        </div>
      )}
    </div>
  );
}
