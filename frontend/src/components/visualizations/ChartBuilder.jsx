import { useState, useEffect } from 'react';
import { 
  BarChart3, Database, Ruler, Palette, Zap, ArrowDownNarrowWide, ArrowUpNarrowWide,
  Layout, Type, Settings2, BarChart2, LineChart, AreaChart, ChevronDown, Activity,
  PieChart, ScatterChart, Layers, Table2, Hash, TrendingUp, Search, X, Loader2, Check
} from 'lucide-react';
import { CHART_CATALOG, PRESET_MAP } from '../../lib/chartPresets';
import AxisControls from './AxisControls';
import VisualControls from './VisualControls';
import InteractionControls from './InteractionControls';

const TYPE_ICONS = {
  line: LineChart,
  area: TrendingUp,
  bar: BarChart3,
  pie: PieChart,
  scatter: ScatterChart,
  composed: Layers,
  specialized: Activity,
  data: Table2
};

export default function ChartBuilder({ columns, config, onConfigChange, onFieldClick, uniqueValues = {}, onValueFetch }) {
  const [activeTab, setActiveTab] = useState('data');

  const update = (patch) => {
    onConfigChange({ ...config, ...patch });
  };

  // Auto-fetch values for current X-Axis dimension
  useEffect(() => {
    if (config.x_field && onValueFetch && !uniqueValues[config.x_field]) {
      onValueFetch(config.x_field);
    }
  }, [config.x_field, uniqueValues]);

  const tabs = [
    { id: 'data', label: 'Mapping', icon: Database },
    { id: 'axis', label: 'Axes', icon: Ruler },
    { id: 'style', label: 'Styling', icon: Palette },
    { id: 'interact', label: 'Interactions', icon: Zap },
  ];

  // Helper to get array of columns even if source is string-based
  const safeColumns = (columns || []).map(c => typeof c === 'string' ? { name: c, type: 'string' } : c);

  return (
    <div className="flex h-full bg-[#020205] text-text-primary overflow-hidden font-sans border-r border-white/5">
      {/* Vertical Navigation Rail - Extreme Density */}
      <div className="w-[64px] flex flex-col items-center py-6 gap-6 border-r border-white/[0.03] bg-[#000] shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "group relative p-3 rounded-xl transition-all duration-300",
              activeTab === tab.id 
                ? "bg-accent/20 text-accent shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                : "text-white/20 hover:text-white/40"
            ].join(" ")}
          >
            <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          </button>
        ))}
        <div className="mt-auto p-3 text-white/5">
          <Settings2 size={14} />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#050510]">
        {/* Compact Operation Header */}
        <div className="px-6 py-4 border-b border-white/[0.03] flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] leading-none">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <span className="text-[9px] text-white/30 font-bold mt-1 uppercase tracking-widest">Operation Center</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[8px] font-black text-emerald-500 uppercase">Live</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar scroll-smooth">
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              
              {/* Identity Section */}
              <div className="space-y-3">
                <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Type size={9} className="text-accent" /> Identity
                </label>
                <div className="bg-[#0a0a15]/60 border border-white/5 rounded-xl p-3 shadow-inner">
                  <input
                    className="w-full bg-transparent border-none text-[12px] font-black text-white placeholder-white/5 outline-none tracking-tight uppercase"
                    placeholder="WIDGET TITLE..."
                    value={config.title || ''}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                </div>
              </div>

              {/* Categories Section - High Density List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Layout size={10} className="text-emerald-400" /> Dimension Hierarchy
                  </label>
                  <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">{safeColumns.filter(c => {
                    const dt = (c.type || c.dtype || '').toLowerCase();
                    return dt.includes('string') || dt.includes('utf') || dt.includes('date');
                  }).length} Identified</span>
                </div>

                <div className="bg-[#0a0a15]/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col max-h-[280px]">
                  <div className="overflow-y-auto p-2 custom-scrollbar-mini space-y-1">
                    {safeColumns.filter(c => {
                      const dt = (c.type || c.dtype || '').toLowerCase();
                      const isNumeric = dt.includes('int') || dt.includes('float') || dt.includes('double') || dt.includes('decimal') || dt.includes('num');
                      const isDate = dt.includes('date') || dt.includes('time') || dt.includes('stamp');
                      return (dt.includes('string') || dt.includes('utf') || isDate) && !isNumeric;
                    }).map(col => {
                      const active = (config.x_fields || []).includes(col.name);
                      return (
                        <button
                          key={col.name}
                          onClick={() => onFieldClick(col.name, 'dimension')}
                          className={[
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                            active 
                              ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]" 
                              : "hover:bg-white/[0.03] text-white/30 hover:text-white/60"
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-3.5 h-3.5 rounded border transition-all duration-300 flex items-center justify-center ${
                              active ? 'border-emerald-500 bg-emerald-500 text-black rotate-0 shadow-glow' : 'border-white/10 group-hover:border-white/20 rotate-45'
                            }`}>
                              {active && <Check size={10} strokeWidth={4} />}
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest truncate">{col.name}</span>
                          </div>
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Metric Orchestration Section */}
              <div className="space-y-4">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Database size={10} className="text-rose-500" /> Metric Orchestration
                </label>
                
                <div className="space-y-3">
                  {(config.y_fields || (config.y_field ? [config.y_field] : [])).map((f, i) => {
                    const currentAgg = (config.field_aggregations || {})[f] || config.aggregation || 'none';
                    const currentPersona = config.field_chart_types?.[f] || config.chart_type || 'bar';
                    const isDual = (config.y_axis_assign?.[f] || (i === 0 ? 'left' : 'right')) === 'right';

                    return (
                      <div key={f} className="flex flex-col gap-3 p-4 bg-[#0a0a15] border border-white/[0.05] rounded-xl animate-in zoom-in-95 duration-300 relative group/card hover:border-rose-500/30 transition-all shadow-2xl">
                         {/* Header: Field Identity */}
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2.5 overflow-hidden">
                             <div className={`w-1.5 h-1.5 rounded-full ${isDual ? 'bg-amber-500' : 'bg-rose-500'} shadow-glow shrink-0`} />
                             <span className="text-[11px] font-black text-white uppercase tracking-widest truncate">{f}</span>
                           </div>
                           <button 
                             onClick={() => {
                               const newY = (config.y_fields || []).filter(y => y !== f);
                               const remAggs = { ...(config.field_aggregations || {}) }; delete remAggs[f];
                               const remAssign = { ...(config.y_axis_assign || {}) }; delete remAssign[f];
                               const remTypes = { ...(config.field_chart_types || {}) }; delete remTypes[f];
                               update({ y_fields: newY, y_field: newY[0] || '', field_aggregations: remAggs, y_axis_assign: remAssign, field_chart_types: remTypes });
                             }}
                             className="text-white/10 hover:text-rose-500 transition-colors p-1"
                           >
                              <X size={14} />
                           </button>
                         </div>
                         
                         {/* Controls Grid: 2x2 + 1 Span */}
                         <div className="grid grid-cols-2 gap-2.5">
                           {/* Visual Selection */}
                           <div className="relative">
                             <select
                               className="w-full bg-[#121225] border border-white/5 rounded-lg text-[9px] font-black text-rose-400/80 uppercase tracking-tighter px-2 py-2.5 outline-none cursor-pointer appearance-none pl-7 hover:border-rose-500/20 transition-all"
                               value={currentPersona}
                               onChange={(e) => {
                                 const val = e.target.value;
                                 const patch = { field_chart_types: { ...(config.field_chart_types || {}), [f]: val } };
                                 if (i === 0) patch.chart_type = val; // Sync first metric with global type
                                 update(patch);
                               }}
                             >
                               {CHART_CATALOG.map(cat => (
                                 <optgroup key={cat.id} label={cat.label.toUpperCase()} className="bg-[#050510] text-white/40">
                                   {cat.presets.map(p => (
                                     <option key={p.id} value={p.overrides.chart_type}>{p.label}</option>
                                   ))}
                                 </optgroup>
                               ))}
                             </select>
                             <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                               {(() => {
                                 const p = Object.values(PRESET_MAP).find(x => x.overrides.chart_type === currentPersona);
                                 const Icon = TYPE_ICONS[p?.category || 'bar'] || BarChart3;
                                 return <Icon size={12} />;
                               })()}
                             </div>
                           </div>

                           {/* Aggregation Selection */}
                           <select
                             className="bg-[#121225] border border-white/5 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-tighter px-2 py-2 outline-none cursor-pointer appearance-none text-center hover:border-emerald-500/20 transition-all"
                             value={currentAgg}
                             onChange={(e) => update({ field_aggregations: { ...(config.field_aggregations || {}), [f]: e.target.value } })}
                           >
                             <option value="none">Direct</option>
                             <option value="sum">Sum</option>
                             <option value="avg">Avg</option>
                             <option value="count">Count</option>
                             <option value="min">Min</option>
                             <option value="max">Max</option>
                           </select>

                           {/* Axis Alignment */}
                           <div className="col-span-2 flex bg-[#121225] p-0.5 rounded-lg border border-white/5">
                             {['left', 'right'].map(axis => (
                               <button
                                 key={axis}
                                 onClick={() => update({ y_axis_assign: { ...(config.y_axis_assign || {}), [f]: axis } })}
                                 className={[
                                   "flex-1 py-1.5 rounded-md text-[9px] font-black transition-all uppercase tracking-widest",
                                   (config.y_axis_assign?.[f] || (i === 0 ? 'left' : 'right')) === axis
                                     ? (axis === 'left' ? "bg-rose-500 text-white shadow-glow" : "bg-amber-500 text-black shadow-glow")
                                     : "text-white/20 hover:text-white/40"
                                 ].join(" ")}
                               >
                                 {axis === 'left' ? 'Primary' : 'Secondary'} Axis
                               </button>
                             ))}
                           </div>
                         </div>
                      </div>
                    );
                  })}
                  
                  <select
                    className="w-full bg-transparent border border-dashed border-white/10 rounded-xl text-[10px] text-white/20 px-4 py-3 font-black uppercase tracking-[0.2em] hover:text-rose-400 hover:border-rose-400/40 transition-all cursor-pointer text-center"
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const val = e.target.value;
                      if (!(config.y_fields || []).includes(val)) {
                        update({ y_fields: [...(config.y_fields || []), val], y_field: (config.y_fields || [])[0] || val });
                      }
                    }}
                  >
                    <option value="" className="bg-[#050510]">+ Add Performance Metric</option>
                    {safeColumns.filter(c => {
                      const dt = (c.type || c.dtype || '').toLowerCase();
                      return dt.includes('int') || dt.includes('float') || dt.includes('double') || dt.includes('decimal') || dt.includes('num');
                    }).map(c => (
                      <option key={c.name} value={c.name} className="bg-[#050510] text-white">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Insight - ADVANCED VALUE SELECTION */}
              {config.x_field && (
                <div className="space-y-3 pt-4 border-t border-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Search size={9} className="text-accent" /> Categories: <span className="text-accent/60 lowercase italic truncate max-w-[100px]">{config.x_field}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button 
                         onClick={() => {
                           const vals = uniqueValues[config.x_field] || [];
                           update({ x_axis_filters: vals });
                         }}
                         className="text-[8px] font-black text-white/20 hover:text-emerald-400 uppercase tracking-widest transition-colors"
                      >
                         All
                      </button>
                      <button 
                         onClick={() => update({ x_axis_filters: [] })} 
                         className="text-[8px] font-black text-rose-500/50 hover:text-rose-500 uppercase tracking-widest transition-colors"
                      >
                         Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 p-3 bg-[#0a0a15]/40 border border-white/5 rounded-xl">
                    {/* Value Grid */}
                    <div className="max-h-32 overflow-y-auto custom-scrollbar-mini pr-1">
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
                                  "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border",
                                  active 
                                    ? "bg-accent text-white border-accent shadow-glow" 
                                    : "bg-white/5 border-transparent text-white/30 hover:text-white/50 hover:bg-white/[0.08]"
                                ].join(" ")}
                              >
                                {String(val)}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 gap-2 opacity-20">
                           <Loader2 size={12} className="animate-spin" />
                           <span className="text-[8px] font-black uppercase tracking-[0.2em]">Syncing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Query Limit */}
              <div className="space-y-4 pt-4 border-t border-white/[0.03]">
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-rose-500/50 uppercase tracking-widest">Pipeline Depth</span>
                    <span className="text-[10px] font-black text-amber-400 font-mono">
                      {config.limit >= 5000 ? 'MAX' : config.limit}
                    </span>
                  </div>
                  <input 
                    type="range" min={10} max={5000} step={10}
                    value={config.limit || 5000}
                    onChange={e => update({ limit: Number(e.target.value) })}
                    className="w-full h-1 bg-white/5 rounded-lg accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'axis' && <div className="animate-in slide-in-from-right-2 duration-300 h-full"><AxisControls config={config} onConfigChange={onConfigChange} /></div>}
          {activeTab === 'style' && <div className="animate-in slide-in-from-right-2 duration-300 h-full"><VisualControls config={config} onConfigChange={onConfigChange} /></div>}
          {activeTab === 'interact' && <div className="animate-in slide-in-from-right-2 duration-300 h-full"><InteractionControls config={config} onConfigChange={onConfigChange} /></div>}
        </div>
      </div>
    </div>
  );
}
