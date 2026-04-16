import React, { useState, useEffect } from 'react';
import {
  BarChart3, Database, Ruler, Palette, Zap,
  Layout, Type, Settings2, LineChart, AreaChart,
  PieChart, ScatterChart, Layers, Table2, TrendingUp,
  Search, X, Loader2, Check, ArrowDownUp, ChevronDown,
} from 'lucide-react';
import { CHART_CATALOG, PRESET_MAP } from '../../lib/chartPresets';
import AxisControls from './AxisControls';
import VisualControls from './VisualControls';
import InteractionControls from './InteractionControls';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu";

const TYPE_ICONS = {
  line: LineChart,
  area: TrendingUp,
  bar: BarChart3,
  pie: PieChart,
  scatter: ScatterChart,
  composed: Layers,
  specialized: BarChart3,
  data: Table2,
};

export default function ChartBuilder({ columns, config, onConfigChange, onFieldClick, uniqueValues = {}, onValueFetch }) {
  const [activeTab, setActiveTab] = useState('data');

  const update = (patch) => onConfigChange({ ...config, ...patch });

  useEffect(() => {
    if (config.x_field && onValueFetch && !uniqueValues[config.x_field]) {
      onValueFetch(config.x_field);
    }
  }, [config.x_field, uniqueValues]);

  const tabs = [
    { id: 'data',     label: 'Mapping',      icon: Database },
    { id: 'axis',     label: 'Axes',         icon: Ruler },
    { id: 'style',    label: 'Styling',      icon: Palette },
    { id: 'interact', label: 'Interactions', icon: Zap },
  ];

  const safeColumns = (columns || []).map(c => typeof c === 'string' ? { name: c, type: 'string' } : c);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Vertical Tab Sidebar ── */}
      <div className="qb-tabs-v">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`qb-tab-v${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <tab.icon size={18} />
            <span className="qb-tab-v-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Builder Content Area ── */}
      <div className="qb-tab-content custom-scrollbar" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>

        {/* Header strip */}
        <div className="px-5 py-3.5 border-b border-border-muted flex items-center justify-between shrink-0" style={{ background: 'var(--color-bg-surface)' }}>
          <div>
            <h2 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] leading-none">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>
          <div className="px-2 py-0.5 rounded border border-emerald/30 bg-emerald-muted">
            <span className="text-[8px] font-black text-emerald uppercase">Live</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* ── DATA TAB ── */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">

              {/* Widget Title */}
              <div className="space-y-2">
                <label className="qb-section-title flex items-center gap-1.5" style={{ marginBottom: 0 }}>
                  <Type size={11} className="text-accent" /> Title
                </label>
                <div className="border border-border-default rounded-xl px-3 py-2" style={{ background: 'var(--color-bg-muted)' }}>
                  <input
                    className="w-full bg-transparent border-none text-[12px] font-semibold text-text-primary placeholder-text-quaternary outline-none"
                    placeholder="Widget title…"
                    value={config.title || ''}
                    onChange={e => update({ title: e.target.value })}
                  />
                </div>
              </div>

              {/* Dimension Hierarchy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="qb-section-title flex items-center gap-1.5" style={{ marginBottom: 0 }}>
                    <Layout size={11} className="text-emerald" /> Dimensions
                  </label>
                  <span className="text-[9px] font-bold text-text-quaternary uppercase">
                    {safeColumns.filter(c => {
                      const dt = (c.type || c.dtype || '').toLowerCase();
                      return dt.includes('string') || dt.includes('utf') || dt.includes('date');
                    }).length} cols
                  </span>
                </div>

                <div className="border border-border-muted rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-muted)' }}>
                  <div className="overflow-y-auto max-h-[220px] p-1.5 space-y-0.5 custom-scrollbar-mini">
                    {safeColumns.filter(c => {
                      const dt = (c.type || c.dtype || '').toLowerCase();
                      const isNum = dt.includes('int') || dt.includes('float') || dt.includes('double') || dt.includes('decimal') || dt.includes('num');
                      return (dt.includes('string') || dt.includes('utf') || dt.includes('date') || dt.includes('time')) && !isNum;
                    }).map(col => {
                      const active = (config.x_fields || []).includes(col.name);
                      return (
                        <button
                          key={col.name}
                          onClick={() => onFieldClick(col.name, 'dimension')}
                          className={[
                            'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all border border-transparent',
                            active
                              ? 'bg-emerald-muted text-emerald border-emerald/20'
                              : 'text-text-tertiary hover:text-text-primary hover:bg-bg-subtle',
                          ].join(' ')}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className={`w-3.5 h-3.5 rounded transition-all flex items-center justify-center shrink-0 ${
                              active ? 'bg-emerald text-white' : 'border border-border-strong'
                            }`}>
                              {active && <Check size={9} strokeWidth={4} />}
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-wide truncate">{col.name}</span>
                          </div>
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-emerald shrink-0" />}
                        </button>
                      );
                    })}
                    {safeColumns.filter(c => {
                      const dt = (c.type || c.dtype || '').toLowerCase();
                      return dt.includes('string') || dt.includes('utf') || dt.includes('date') || dt.includes('time');
                    }).length === 0 && (
                      <div className="text-center py-4 text-text-quaternary text-[11px]">No text/date columns found</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metric Orchestration */}
              <div className="space-y-2">
                <label className="qb-section-title flex items-center gap-1.5" style={{ marginBottom: 0 }}>
                  <Database size={11} className="text-rose" /> Metrics
                </label>

                <div className="space-y-3">
                  {(config.y_fields || (config.y_field ? [config.y_field] : [])).map((f, i) => {
                    const currentAgg = (config.field_aggregations || {})[f] || config.aggregation || 'none';
                    const currentPersona = config.field_chart_types?.[f] || config.chart_type || 'bar';
                    const isDual = (config.y_axis_assign?.[f] || (i === 0 ? 'left' : 'right')) === 'right';

                    return (
                      <div key={f} className="flex flex-col gap-2.5 p-3 border border-border-default rounded-xl transition-all hover:border-rose/30" style={{ background: 'var(--color-bg-raised)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDual ? 'bg-amber' : 'bg-rose'}`} />
                            <span className="text-[11px] font-bold text-text-primary uppercase tracking-wide truncate">{f}</span>
                          </div>
                          <button
                            onClick={() => {
                              const newY = (config.y_fields || []).filter(y => y !== f);
                              const remAggs = { ...(config.field_aggregations || {}) }; delete remAggs[f];
                              const remAssign = { ...(config.y_axis_assign || {}) }; delete remAssign[f];
                              const remTypes = { ...(config.field_chart_types || {}) }; delete remTypes[f];
                              const nextSortRules = (config.sort_rules || []).filter(r => r.col !== f);
                              update({ 
                                y_fields: newY, 
                                y_field: newY[0] || '', 
                                field_aggregations: remAggs, 
                                y_axis_assign: remAssign, 
                                field_chart_types: remTypes,
                                sort_rules: nextSortRules
                              });
                            }}
                            className="text-text-quaternary hover:text-rose transition-colors p-0.5"
                          >
                            <X size={13} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="w-full flex items-center justify-between border border-border-muted rounded-lg text-[10px] font-bold text-text-secondary px-2 py-1.5 pl-6 outline-none cursor-pointer hover:border-border-strong transition-all relative" style={{ background: 'var(--color-bg-overlay)' }}>
                                  <span className="truncate">{(Object.values(PRESET_MAP).find(x => x.overrides.chart_type === currentPersona))?.label || currentPersona}</span>
                                  <ChevronDown size={10} className="text-text-quaternary" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {CHART_CATALOG.map(cat => (
                                  <React.Fragment key={cat.id}>
                                    <DropdownMenuLabel>{cat.label}</DropdownMenuLabel>
                                    {cat.presets.map(p => (
                                      <DropdownMenuItem 
                                        key={p.id} 
                                        onClick={() => {
                                          const val = p.overrides.chart_type;
                                          const patch = { field_chart_types: { ...(config.field_chart_types || {}), [f]: val } };
                                          if (i === 0) patch.chart_type = val;
                                          update(patch);
                                        }}
                                      >
                                        {p.label}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                  </React.Fragment>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-quaternary z-20">
                              {(() => {
                                const p = Object.values(PRESET_MAP).find(x => x.overrides.chart_type === currentPersona);
                                const Icon = TYPE_ICONS[p?.category || 'bar'] || BarChart3;
                                return <Icon size={11} />;
                              })()}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="border border-border-muted rounded-lg text-[10px] font-bold text-emerald px-2 py-1.5 outline-none cursor-pointer flex items-center justify-center gap-1 hover:border-emerald/30 transition-all uppercase" style={{ background: 'var(--color-bg-overlay)' }}>
                                {currentAgg === 'none' ? 'Direct' : currentAgg} <ChevronDown size={10} className="text-emerald/50" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aggregation Type</DropdownMenuLabel>
                              {['none', 'sum', 'avg', 'count', 'min', 'max'].map(agg => (
                                <DropdownMenuItem key={agg} onClick={() => update({ field_aggregations: { ...(config.field_aggregations || {}), [f]: agg } })} className="uppercase">
                                  {agg}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <div className="col-span-2 flex border border-border-muted p-0.5 rounded-lg gap-0.5" style={{ background: 'var(--color-bg-overlay)' }}>
                            {['left', 'right'].map(axis => (
                              <button
                                key={axis}
                                onClick={() => update({ y_axis_assign: { ...(config.y_axis_assign || {}), [f]: axis } })}
                                className={[
                                  'flex-1 py-1 rounded-md text-[9px] font-black transition-all uppercase tracking-widest',
                                  (config.y_axis_assign?.[f] || (i === 0 ? 'left' : 'right')) === axis
                                    ? axis === 'left' ? 'bg-rose text-white' : 'bg-amber text-bg-base'
                                    : 'text-text-quaternary hover:text-text-secondary',
                                ].join(' ')}
                              >
                                {axis === 'left' ? 'Primary' : 'Secondary'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full border border-dashed border-border-strong rounded-xl text-[10px] text-text-tertiary px-4 py-3 font-bold uppercase tracking-[0.15em] hover:text-rose hover:border-rose/40 transition-all cursor-pointer flex items-center justify-center gap-2" style={{ background: 'transparent' }}>
                         + Add Metric
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="max-h-[300px] overflow-y-auto custom-scrollbar-mini">
                      <DropdownMenuLabel>Available Metrics</DropdownMenuLabel>
                      {safeColumns.filter(c => {
                        const dt = (c.type || c.dtype || '').toLowerCase();
                        return dt.includes('int') || dt.includes('float') || dt.includes('double') || dt.includes('decimal') || dt.includes('num');
                      }).map(c => (
                        <DropdownMenuItem 
                          key={c.name} 
                          onClick={() => {
                            const val = c.name;
                            if (!(config.y_fields || []).includes(val)) {
                              const nextY = [...(config.y_fields || []), val];
                              let nextSortRules = [...(config.sort_rules || [])];
                              if (!nextSortRules.some(r => r.col === val)) {
                                nextSortRules.push({ col: val, dir: 'DESC' });
                              }
                              update({ 
                                y_fields: nextY, 
                                y_field: nextY[0] || val,
                                sort_rules: nextSortRules 
                              });
                            }
                          }}
                        >
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Category / Value Filter */}
              {config.x_field && (
                <div className="space-y-2 pt-3 border-t border-border-muted">
                  <div className="flex items-center justify-between">
                    <label className="qb-section-title flex items-center gap-1.5" style={{ marginBottom: 0 }}>
                      <Search size={11} className="text-accent" /> Filter: <span className="text-accent italic lowercase ml-1">{config.x_field}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => update({ x_axis_filters: uniqueValues[config.x_field] || [] })} className="text-[9px] font-bold text-text-quaternary hover:text-emerald uppercase transition-colors">All</button>
                      <button onClick={() => update({ x_axis_filters: [] })} className="text-[9px] font-bold text-text-quaternary hover:text-rose uppercase transition-colors">Clear</button>
                    </div>
                  </div>

                  <div className="border border-border-muted rounded-xl p-2.5" style={{ background: 'var(--color-bg-muted)' }}>
                    <div className="max-h-28 overflow-y-auto custom-scrollbar-mini pr-1">
                      {uniqueValues[config.x_field] ? (
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueValues[config.x_field].map(val => {
                            const active = (config.x_axis_filters || []).includes(String(val));
                            return (
                              <button
                                key={val}
                                onClick={() => {
                                  const strVal = String(val);
                                  const newFilters = active
                                    ? (config.x_axis_filters || []).filter(v => v !== strVal)
                                    : [...(config.x_axis_filters || []), strVal];
                                  update({ x_axis_filters: newFilters });
                                }}
                                className={[
                                  'px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all border',
                                  active
                                    ? 'bg-accent text-white border-accent'
                                    : 'border-border-default text-text-tertiary hover:text-text-primary hover:border-border-strong',
                                ].join(' ')}
                                style={active ? {} : { background: 'var(--color-bg-raised)' }}
                              >
                                {String(val)}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-3 gap-2 text-text-quaternary">
                          <Loader2 size={12} className="animate-spin" />
                          <span className="text-[9px] font-bold uppercase">Loading…</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Row Limit */}
              <div className="space-y-2 pt-3 border-t border-border-muted">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-quaternary uppercase">Row Limit</span>
                  <span className="text-[11px] font-black text-amber font-mono">
                    {config.limit >= 5000 ? 'MAX' : config.limit}
                  </span>
                </div>
                <input
                  type="range" min={10} max={5000} step={10}
                  value={config.limit || 5000}
                  onChange={e => update({ limit: Number(e.target.value) })}
                  className="w-full h-1 rounded-lg cursor-pointer accent-amber"
                  style={{ background: 'var(--color-bg-subtle)' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'axis' && <div className="animate-in slide-in-from-right-2 duration-300"><AxisControls config={config} onConfigChange={onConfigChange} /></div>}
          {activeTab === 'style' && <div className="animate-in slide-in-from-right-2 duration-300"><VisualControls config={config} onConfigChange={onConfigChange} /></div>}
          {activeTab === 'interact' && <div className="animate-in slide-in-from-right-2 duration-300"><InteractionControls config={config} onConfigChange={onConfigChange} /></div>}
        </div>
      </div>
    </div>
  );
}
