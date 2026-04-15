import { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, Area, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, 
  Scatter, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ZAxis
} from "recharts";
import { Activity, AlertCircle, TrendingUp, BarChart3, Layers, Maximize2, Minimize2, ChevronDown, Table2, Edit3, X } from "lucide-react";
import { COLOR_PALETTES } from "../../lib/chartPresets";

const tooltipStyle = {
  contentStyle: {
    background: "rgba(10, 10, 20, 0.9)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#fff",
    backdropFilter: "blur(20px)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    padding: "12px 16px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  itemStyle: { padding: "3px 0" },
  cursor: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }
};

const formatValue = (value) => {
  if (typeof value !== "number") return value;
  const absVal = Math.abs(value);
  if (absVal >= 10000000) return (value / 10000000).toFixed(1) + " Cr";
  if (absVal >= 100000) return (value / 100000).toFixed(1) + " L";
  if (absVal >= 1000) return (value / 1000).toFixed(1) + " k";
  return value.toLocaleString();
};

export default function ChartPreview({ 
  data, 
  config, 
  onConfigChange, 
  onToggleFullscreen, 
  isFullscreen,
  onEdit,
  onRemove,
  isEditing 
}) {
  const [aggMode, setAggMode] = useState(config.agg_mode || 'sum');

  // 1. Validation Logic
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20 animate-in fade-in duration-700">
        <Activity size={40} strokeWidth={1} className="animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Interface Ready // Awaiting Pipeline</span>
      </div>
    );
  }

  // 2. Data Resolution Helper
  const getFieldVal = (row, field) => {
    if (!row || !field) return undefined;
    if (row[field] !== undefined) return row[field];
    const lowerField = field.toLowerCase();
    const keys = Object.keys(row);
    const insensitiveKey = keys.find(k => k.toLowerCase() === lowerField);
    if (insensitiveKey) return row[insensitiveKey];
    
    // Check for aggregated versions
    const aggs = ['sum_', 'avg_', 'count_', 'min_', 'max_'];
    for (const a of aggs) {
      const aggLower = (a + field).toLowerCase();
      const match = keys.find(k => k.toLowerCase() === aggLower);
      if (match) return row[match];
    }
    return undefined;
  };

  // Auto-detect 1x1 data shape (perfect for raw aggregation queries like COUNT(*))
  const isAutomaticKPI = data.length === 1 && Object.keys(data[0] || {}).length === 1;
  const autoKpiField = isAutomaticKPI ? Object.keys(data[0])[0] : null;

  const chartType = isAutomaticKPI ? 'kpi' : (config.view_mode === 'table' ? 'table' : (config?.chart_type || "bar"));
  const xField = isAutomaticKPI ? null : (config?.x_field || (config?.x_fields?.[0]));
  const yFields = isAutomaticKPI ? [autoKpiField] : (config?.y_fields?.length > 0 ? config.y_fields : (config?.y_field ? [config.y_field] : []));
  const palette = COLOR_PALETTES[config?.color_palette || 'default']?.colors || COLOR_PALETTES.default.colors;

  // 3. Transformation
  const resolvedData = data.slice(0, config.limit || 50).map(row => {
    const newRow = { ...row };
    if (xField) newRow[xField] = getFieldVal(row, xField);
    yFields.forEach(f => {
      const val = getFieldVal(row, f);
      newRow[f] = (val !== null && val !== "" && !isNaN(Number(val))) ? Number(val) : val;
    });
    return newRow;
  });

  const renderContent = () => {
    if (yFields.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-white/10">
          <Layers size={32} />
          <span className="text-[9px] font-black uppercase tracking-widest">Assign Metrics to Begin Compilation</span>
        </div>
      );
    }

    if (chartType === 'table') {
      const cols = Object.keys(resolvedData[0] || {});
      
      // Calculate totals for numeric columns based on mode
      const totals = cols.reduce((acc, col) => {
        const values = resolvedData.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v));
        if (values.length === 0) {
          acc[col] = null;
          return acc;
        }

        switch (aggMode) {
          case 'avg':
            acc[col] = values.reduce((sum, v) => sum + v, 0) / values.length;
            break;
          case 'min':
            acc[col] = Math.min(...values);
            break;
          case 'max':
            acc[col] = Math.max(...values);
            break;
          case 'count':
            acc[col] = values.length;
            break;
          default: // sum
            acc[col] = values.reduce((sum, v) => sum + v, 0);
        }
        return acc;
      }, {});

      return (
        <div className="w-full h-full flex flex-col animate-in fade-in zoom-in-95 duration-500 overflow-hidden bg-[#13141b]/90 rounded-2xl border border-white/5">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 bg-[#13141b] z-40">
                <tr>
                  {cols.map(c => (
                    <th key={c} className="text-left px-6 py-4 text-[13px] font-bold text-white/50 uppercase tracking-widest border-b border-white/5 whitespace-nowrap cursor-pointer hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2">
                        {c}
                        <div className="flex flex-col opacity-30">
                          <ChevronDown size={10} className="rotate-180 -mb-1" />
                          <ChevronDown size={10} />
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resolvedData.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    {cols.map((c, colIdx) => {
                      const val = row[c];
                      const isNum = typeof val === 'number' && !isNaN(val);
                      return (
                        <td key={c} className={`px-6 py-4 text-[14px] border-b border-white/[0.02] whitespace-nowrap ${isNum ? 'font-bold text-white' : 'font-medium text-white/80'}`}>
                           {isNum ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (val || '-')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-[#13141b] z-40">
                <tr className="bg-[#1a1b26]">
                  {cols.map((c, idx) => {
                    const val = totals[c];
                    const isNum = typeof val === 'number' && val !== null;
                    return (
                      <td key={`total-${c}`} className="px-6 py-4 text-[14px] font-black text-emerald-400 border-t border-white/10 whitespace-nowrap bg-[#1a1b26]">
                        {idx === 0 ? (
                          <div className="flex items-center gap-2">
                             
                             <select 
                               value={aggMode}
                               onChange={(e) => {
                                 const m = e.target.value;
                                 setAggMode(m);
                                 onConfigChange?.({ ...config, agg_mode: m });
                               }}
                               className="bg-transparent text-emerald-400 font-black uppercase outline-none cursor-pointer border-b border-emerald-400/20 hover:border-emerald-400 focus:border-emerald-400 transition-all text-[11px] nodrag"
                             >
                               <option className="bg-[#1e1e2d] text-white" value="sum">Sum</option>
                               <option className="bg-[#1e1e2d] text-white" value="avg">Avg</option>
                               <option className="bg-[#1e1e2d] text-white" value="min">Min</option>
                               <option className="bg-[#1e1e2d] text-white" value="max">Max</option>
                               <option className="bg-[#1e1e2d] text-white" value="count">Count</option>
                             </select>
                          </div>
                        ) : (isNum ? formatValue(val) : '-')}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    }

    // KPI
    if (chartType === 'kpi') {
      const val = resolvedData[0]?.[yFields[0]] || 0;
      const isNum = typeof val === 'number' && !isNaN(val);
      const displayVal = (isFullscreen && isNum) ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : formatValue(val);
      const exactVal = isNum ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(val);

      return (
        <div 
          className="flex flex-col items-center justify-center h-full space-y-2 group/kpi relative cursor-default"
          title={exactVal}
        >
          <span className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
            {displayVal}
          </span>
          
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">{config.title || yFields[0]}</span>
        </div>
      );
    }

    // Charts
    return (
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'pie' || chartType === 'donut' || chartType === 'rose' ? (
          <PieChart>
            <Pie
              data={resolvedData}
              dataKey={yFields[0]}
              nameKey={xField}
              cx="50%" cy="50%"
              innerRadius={chartType === 'donut' ? "65%" : (chartType === 'rose' ? "20%" : 0)}
              outerRadius="85%"
              paddingAngle={2}
              stroke="none"
            >
              {resolvedData.map((entry, index) => (
                <Cell key={index} fill={palette[index % palette.length]} fillOpacity={0.8} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={val => formatValue(val)} />
            {config.legend_position !== 'hidden' && <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }} />}
          </PieChart>
        ) : chartType === 'radar' ? (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={resolvedData}>
            <PolarGrid stroke="white" strokeOpacity={0.05} />
            <PolarAngleAxis dataKey={xField} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            {yFields.map((f, i) => (
              <Radar
                key={f}
                name={f}
                dataKey={f}
                stroke={palette[i % palette.length]}
                fill={palette[i % palette.length]}
                fillOpacity={0.2}
              />
            ))}
            <Tooltip {...tooltipStyle} />
          </RadarChart>
        ) : (
          <ComposedChart 
            data={resolvedData} 
            layout={chartType === 'horizontal_bar' ? 'vertical' : 'horizontal'}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="white" strokeOpacity={0.03} vertical={false} />
            <XAxis dataKey={xField} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 'bold' }} tickFormatter={formatValue} axisLine={false} tickLine={false} />
            {yFields.length > 1 && <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} tickFormatter={formatValue} axisLine={false} tickLine={false} />}
            <Tooltip {...tooltipStyle} formatter={val => formatValue(val)} />
            <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingBottom: '10px' }} />
            {yFields.map((f, i) => {
              const type = config.field_chart_types?.[f] || config.chart_type || 'bar';
              const axisId = (config.y_axis_assign?.[f] || (i === 0 ? 'left' : 'right'));
              if (type.includes('bar')) return <Bar yAxisId={axisId} key={f} dataKey={f} fill={palette[i % palette.length]} radius={[4, 4, 0, 0]} barSize={24} fillOpacity={0.8} />;
              if (type.includes('line')) return <Line yAxisId={axisId} key={f} dataKey={f} stroke={palette[i % palette.length]} strokeWidth={2} dot={{ r: 2 }} type="monotone" />;
              if (type.includes('area')) return <Area yAxisId={axisId} key={f} dataKey={f} stroke={palette[i % palette.length]} fill={palette[i % palette.length]} fillOpacity={0.1} type="monotone" />;
              return null;
            })}
          </ComposedChart>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex flex-col h-full w-full p-5 group/preview">
      {/* ── HEADER ── */}
      <div className="relative flex items-center justify-between mb-6 z-20 shrink-0">
        <div className="flex-1 drag-handle cursor-move select-none w-full min-w-0" title="Drag to move widget">
          <h3 className="text-[17px] font-bold text-white truncate w-full pr-2">
            {config.title || 'Live Insight'}
          </h3>
        </div>
        
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/preview:pointer-events-auto bg-bg-raised pl-6 py-2 before:content-[''] before:absolute before:-left-12 before:top-0 before:bottom-0 before:w-12 before:bg-gradient-to-r before:from-transparent before:to-bg-raised z-30">
          {onToggleFullscreen && (
            <button 
              onClick={onToggleFullscreen}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-xl"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}

          {/* Focal Dimension Switcher */}
          {(config.x_fields?.length > 1 && chartType !== 'table' && chartType !== 'kpi') && (
            <div className="relative">
              <select 
                className="bg-transparent border border-white/10 rounded-lg pl-4 pr-8 py-1.5 text-[14px] font-medium text-white outline-none cursor-pointer appearance-none hover:bg-white/5 transition-all"
                value={xField}
                onChange={(e) => onConfigChange?.({ ...config, x_field: e.target.value })}
              >
                {config.x_fields.map(f => (
                  <option className="bg-[#1e1e2d] text-white" key={f} value={f}>{f}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
            </div>
          )}

          {/* View Toggles */}
          {chartType !== 'kpi' && (
            <div className="flex items-center bg-transparent border border-white/10 rounded-xl p-1 gap-1">
              <button 
                onClick={() => onConfigChange?.({ ...config, view_mode: 'chart' })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[14px] font-bold ${chartType !== 'table' ? 'bg-white/10 text-white border border-white/5' : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'}`}
              >
                <BarChart3 size={15} /> Chart
              </button>
              <button 
                onClick={() => onConfigChange?.({ ...config, view_mode: 'table' })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[14px] font-bold ${chartType === 'table' ? 'bg-white/10 text-white border border-white/5' : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'}`}
              >
                <Table2 size={15} /> Table
              </button>
            </div>
          )}

          {/* Utility Box */}
          {isEditing && (
            <div className="flex items-center gap-1.5 ml-1">
              <button onClick={onEdit} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-emerald-500/20 transition-all">
                <Edit3 size={15} />
              </button>
              <button onClick={onRemove} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-rose-500 hover:bg-rose-500/20 transition-all">
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {renderContent()}
      </div>
    </div>
  );
}