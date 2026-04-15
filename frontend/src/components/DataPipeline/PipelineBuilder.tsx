import React, { useState } from 'react';
import { useStore, type PipelineStep, type FilterCondition, type AggregateStep } from '../../store/PipelineStore';

// ── Colour map ──────────────────────────────────────────────────────────────
const CHIP_CLASS: Record<string, string> = {
  FILTER: 'filter', GROUP_BY: 'group_by', SORT: 'sort',
  LIMIT: 'limit', CALCULATED_COLUMN: 'calc',
};
const CHIP_LABEL: Record<string, string> = {
  FILTER: 'Where', GROUP_BY: 'Group By', SORT: 'Sort',
  LIMIT: 'Limit', CALCULATED_COLUMN: 'Calc Col',
};
const CHIP_COLOR: Record<string, string> = {
  FILTER: '#f43f5e', GROUP_BY: '#8b5cf6', SORT: '#22d3ee',
  LIMIT: '#f59e0b', CALCULATED_COLUMN: '#10b981',
};

// ── Add Step Panel ───────────────────────────────────────────────────────────
type StepType = PipelineStep['StepType'];

function AddStepMenu({ onAdd }: { onAdd: (t: StepType) => void }) {
  const items: { type: StepType; label: string; icon: string }[] = [
    { type: 'FILTER', label: 'Filter', icon: '⊘' },
    { type: 'GROUP_BY', label: 'Group By', icon: '⊞' },
    { type: 'SORT', label: 'Sort', icon: '↕' },
    { type: 'LIMIT', label: 'Limit', icon: '#' },
    { type: 'CALCULATED_COLUMN', label: 'Calc Col', icon: 'ƒ' },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => onAdd(type)}
          className="btn-ghost text-xs"
          style={{ color: CHIP_COLOR[type], border: `1px solid ${CHIP_COLOR[type]}33`, borderRadius: 6, padding: '4px 10px' }}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

// ── Individual Step Editors ──────────────────────────────────────────────────
function FilterEditor({ config, onChange, schema }: { config: any; onChange: (c: any) => void; schema: { Name: string }[] }) {
  const conds: FilterCondition[] = config.Conditions ?? [{ Column: schema[0]?.Name ?? '', Operator: '=', Value: '', Logic: 'AND' }];
  const update = (idx: number, field: string, value: string) => {
    const next = conds.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    onChange({ Conditions: next });
  };
  const addCond = () => onChange({ Conditions: [...conds, { Column: schema[0]?.Name ?? '', Operator: '=', Value: '', Logic: 'AND' }] });
  const removeCond = (idx: number) => onChange({ Conditions: conds.filter((_, i) => i !== idx) });

  return (
    <div className="flex flex-col gap-2">
      {conds.map((c, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          {i > 0 && (
            <select value={c.Logic} onChange={e => update(i, 'Logic', e.target.value)}
              className="input select w-16 text-xs">
              <option>AND</option><option>OR</option>
            </select>
          )}
          <div className="flex gap-1.5 items-center">
            <select value={c.Column} onChange={e => update(i, 'Column', e.target.value)}
              className="input select flex-1 text-xs">
              {schema.map(s => <option key={s.Name}>{s.Name}</option>)}
            </select>
            <select value={c.Operator} onChange={e => update(i, 'Operator', e.target.value)}
              className="input select w-16 text-xs">
              {['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN'].map(op => <option key={op}>{op}</option>)}
            </select>
            <input value={c.Value} onChange={e => update(i, 'Value', e.target.value)}
              className="input flex-1 text-xs" placeholder="value" />
            <button onClick={() => removeCond(i)} style={{ color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        </div>
      ))}
      <button onClick={addCond} className="btn-ghost text-xs" style={{ justifyContent: 'flex-start' }}>+ Add condition</button>
    </div>
  );
}

function GroupByEditor({ config, onChange, schema }: { config: any; onChange: (c: any) => void; schema: { Name: string }[] }) {
  const cols: string[] = config.Columns ?? [];
  const aggs: AggregateStep[] = config.Aggregations ?? [];
  const toggleCol = (n: string) => onChange({ ...config, Columns: cols.includes(n) ? cols.filter(c => c !== n) : [...cols, n] });
  const addAgg = () => onChange({ ...config, Aggregations: [...aggs, { Column: schema[0]?.Name ?? '', Function: 'SUM', Alias: '' }] });
  const updateAgg = (i: number, field: string, val: string) => {
    const next = aggs.map((a, idx) => idx === i ? { ...a, [field]: val } : a);
    onChange({ ...config, Aggregations: next });
  };
  const removeAgg = (i: number) => onChange({ ...config, Aggregations: aggs.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="text-xs text-gray-400 mb-1">Group Columns</div>
        <div className="flex flex-wrap gap-1">
          {schema.map(s => (
            <button key={s.Name} onClick={() => toggleCol(s.Name)}
              className="text-xs px-2 py-1 rounded-md transition-all"
              style={{
                background: cols.includes(s.Name) ? 'rgba(139,92,246,0.3)' : 'var(--bg-elevated)',
                border: `1px solid ${cols.includes(s.Name) ? '#8b5cf6' : 'var(--border)'}`,
                color: cols.includes(s.Name) ? '#c4b5fd' : 'var(--text-secondary)',
              }}>
              {s.Name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-400 mb-1">Aggregations</div>
        {aggs.map((a, i) => (
          <div key={i} className="flex gap-1 items-center mb-1">
            <select value={a.Function} onChange={e => updateAgg(i, 'Function', e.target.value)}
              className="input select w-20 text-xs">
              {['SUM', 'AVG', 'MIN', 'MAX', 'COUNT'].map(f => <option key={f}>{f}</option>)}
            </select>
            <select value={a.Column} onChange={e => updateAgg(i, 'Column', e.target.value)}
              className="input select flex-1 text-xs">
              {schema.map(s => <option key={s.Name}>{s.Name}</option>)}
            </select>
            <input value={a.Alias} onChange={e => updateAgg(i, 'Alias', e.target.value)}
              className="input w-20 text-xs" placeholder="alias" />
            <button onClick={() => removeAgg(i)} style={{ color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        ))}
        <button onClick={addAgg} className="btn-ghost text-xs">+ Add aggregation</button>
      </div>
    </div>
  );
}

function SortEditor({ config, onChange, schema }: { config: any; onChange: (c: any) => void; schema: { Name: string }[] }) {
  return (
    <div className="flex gap-2">
      <select value={config.Column ?? schema[0]?.Name ?? ''} onChange={e => onChange({ ...config, Column: e.target.value })}
        className="input select flex-1 text-xs">
        {schema.map(s => <option key={s.Name}>{s.Name}</option>)}
      </select>
      <select value={config.Direction ?? 'ASC'} onChange={e => onChange({ ...config, Direction: e.target.value })}
        className="input select w-20 text-xs">
        <option>ASC</option><option>DESC</option>
      </select>
    </div>
  );
}

function LimitEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  return (
    <input type="number" value={config.Count ?? 100} onChange={e => onChange({ Count: Number(e.target.value) })}
      className="input text-xs w-32" placeholder="Row count" />
  );
}

function CalcColEditor({ config, onChange, schema }: { config: any; onChange: (c: any) => void; schema: { Name: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <input value={config.Alias ?? ''} onChange={e => onChange({ ...config, Alias: e.target.value })}
        className="input text-xs" placeholder="Column name (alias)" />
      <input value={config.Expression ?? ''} onChange={e => onChange({ ...config, Expression: e.target.value })}
        className="input text-xs font-mono" placeholder='e.g. revenue * 1.1' />
      <div className="flex flex-wrap gap-1 mt-1">
        {schema.map(s => (
          <button key={s.Name} onClick={() => onChange({ ...config, Expression: (config.Expression ?? '') + s.Name })}
            className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--accent-cyan)' }}>
            {s.Name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main PipelineBuilder ─────────────────────────────────────────────────────
export const PipelineBuilder: React.FC = () => {
  const { Steps, Schema, addStep, removeStep, updateStep } = useStore();
  const [OpenIdx, setOpenIdx] = useState<number | null>(null);

  const handleAdd = (type: StepType) => {
    const defaults: Record<StepType, object> = {
      FILTER: { Conditions: [{ Column: Schema[0]?.Name ?? '', Operator: '=', Value: '', Logic: 'AND' }] },
      GROUP_BY: { Columns: [], Aggregations: [] },
      SORT: { Column: Schema[0]?.Name ?? '', Direction: 'ASC' },
      LIMIT: { Count: 100 },
      CALCULATED_COLUMN: { Alias: '', Expression: '' },
    };
    addStep({ StepType: type, Config: defaults[type] } as PipelineStep);
    setOpenIdx(Steps.length);
  };

  const renderEditor = (step: PipelineStep, i: number) => {
    const props = { config: step.Config, onChange: (c: any) => updateStep(i, { ...step, Config: c } as PipelineStep), schema: Schema };
    switch (step.StepType) {
      case 'FILTER': return <FilterEditor {...props} />;
      case 'GROUP_BY': return <GroupByEditor {...props} />;
      case 'SORT': return <SortEditor {...props} />;
      case 'LIMIT': return <LimitEditor {...props} />;
      case 'CALCULATED_COLUMN': return <CalcColEditor {...props} />;
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto">
      {Schema.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center" style={{ color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48 }}>📁</div>
          <div className="text-sm">Upload a CSV to build your pipeline</div>
        </div>
      ) : (
        <>
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>ADD STEP</div>
            <AddStepMenu onAdd={handleAdd} />
          </div>

          {Steps.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {Steps.map((step, i) => (
                <div key={i} className={`step-chip ${CHIP_CLASS[step.StepType]}`} style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: CHIP_COLOR[step.StepType] }}>
                        {CHIP_LABEL[step.StepType]}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: 11 }}
                        onClick={() => setOpenIdx(OpenIdx === i ? null : i)}>
                        {OpenIdx === i ? '▲' : '▼'}
                      </button>
                      <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: 11, color: '#f43f5e' }}
                        onClick={() => removeStep(i)}>✕</button>
                    </div>
                  </div>
                  {OpenIdx === i && (
                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      {renderEditor(step, i)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {Steps.length === 0 && (
            <div className="text-xs text-center py-6" style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 8 }}>
              No steps added yet. Click above to add.
            </div>
          )}
        </>
      )}
    </div>
  );
};
