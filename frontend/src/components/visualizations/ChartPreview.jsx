import { useState, useMemo } from 'react';
import { 
  ComposedChart, Bar, Line, Area, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, 
  Scatter, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ZAxis, RadialBarChart, RadialBar
} from "recharts";
import { 
  Activity, AlertCircle, TrendingUp, BarChart3, Layers, Maximize2, Minimize2, 
  ChevronDown, Table2, Edit3, X, Loader2, Database, RefreshCw 
} from "lucide-react";
import { COLOR_PALETTES } from "../../lib/chartPresets";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "../ui/chart";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu";

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
  isEditing,
  isBuilder = false
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
  const resolvedData = data.slice(0, config.limit || 50).map((row, idx) => {
    const newRow = { ...row, __idx: idx };
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
      // Order columns: Dimensions first, then Metrics. Exclude internal __idx.
      const rawCols = Object.keys(resolvedData[0] || {});
      const xFields = config.x_fields || [config.x_field].filter(Boolean);
      const yFields = config.y_fields || [config.y_field].filter(Boolean);
      
      const cols = [
        ...xFields.filter(f => rawCols.includes(f)),
        ...yFields.filter(f => rawCols.includes(f) && !xFields.includes(f))
      ];
      
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

      // ── SINGLE-SCROLLER table: the table itself scrolls, no parent overflow wrapper ──
      return (
        <div className="w-full h-full overflow-auto custom-scrollbar rounded-2xl border border-border-default" style={{ background: 'var(--color-bg-raised)' }}>
          <table className="w-full border-separate border-spacing-0" style={{ minWidth: 'max-content' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--color-bg-raised)' }}>
              <tr>
                {cols.map(c => (
                  <th key={c} style={{ background: 'var(--color-bg-overlay)' }} className="text-left px-5 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-widest border-b border-border-default whitespace-nowrap">
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
                <tr key={i} className="hover:bg-bg-muted/40 transition-colors">
                  {cols.map(c => {
                    const val = row[c];
                    const isNum = typeof val === 'number' && !isNaN(val);
                    return (
                      <td key={c} className={`px-5 py-3 text-[13px] border-b border-border-muted whitespace-nowrap ${isNum ? 'font-bold text-text-primary tabular-nums' : 'font-medium text-text-secondary'}`}>
                        {isNum ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (val ?? '-')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 40, background: 'var(--color-bg-overlay)' }}>
              <tr>
                {cols.map((c, idx) => {
                  const val = totals[c];
                  const isNum = typeof val === 'number' && val !== null;
                  return (
                    <td 
                      key={`total-${c}`} 
                      title={isNum ? val.toLocaleString() : undefined}
                      className="px-5 py-3 text-[13px] font-black text-emerald border-t border-border-strong whitespace-nowrap"
                    >
                      {idx === 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="bg-transparent text-emerald font-black uppercase outline-none cursor-pointer border-b border-emerald/20 hover:border-emerald text-[11px] nodrag transition-all flex items-center gap-1">
                              {aggMode} <ChevronDown size={10} className="opacity-50" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Aggregation Mode</DropdownMenuLabel>
                            {['sum', 'avg', 'min', 'max', 'count'].map(m => (
                              <DropdownMenuItem key={m} onClick={() => { setAggMode(m); onConfigChange?.({ ...config, agg_mode: m }); }} className="uppercase">
                                {m}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (isNum ? formatValue(val) : '-')}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
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
    const chartConfig = {};
    yFields.forEach((f, i) => {
      chartConfig[f] = {
        label: f,
        color: palette[i % palette.length],
      };
    });

    return (
      <ChartContainer config={chartConfig} className="h-full w-full">
        {chartType === 'pie' || chartType === 'donut' || chartType === 'rose' ? (
          <RePieChart>
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
            <ChartTooltip 
              cursor={false} 
              content={<ChartTooltipContent formatter={(v) => formatValue(v)} />} 
            />
            {config.legend_position !== 'hidden' && (
              <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" height={36} />
            )}
          </RePieChart>
        ) : chartType === 'radar' ? (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={resolvedData}>
            <PolarGrid stroke="var(--color-border-muted)" strokeOpacity={0.2} />
            <PolarAngleAxis dataKey={xField} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            {yFields.map((f, i) => (
              <Radar
                key={f}
                name={f}
                dataKey={f}
                stroke={`var(--color-${f})`}
                fill={`var(--color-${f})`}
                fillOpacity={0.2}
              />
            ))}
            <ChartTooltip 
              cursor={{ stroke: 'var(--color-accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={<ChartTooltipContent formatter={(v) => formatValue(v)} />} 
            />
          </RadarChart>
        ) : chartType === 'radial_bar' ? (
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="10%" 
            outerRadius="80%" 
            barSize={10} 
            data={resolvedData}
          >
            <RadialBar
              minAngle={15}
              label={{ position: 'insideStart', fill: '#fff' }}
              background
              clockWise
              dataKey={yFields[0]}
              isAnimationActive={false}
            >
              {resolvedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
              ))}
            </RadialBar>
            <ChartTooltip 
              cursor={false}
              content={<ChartTooltipContent formatter={(v) => formatValue(v)} />} 
            />
            {config.legend_position !== 'hidden' && (
              <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" height={36} />
            )}
          </RadialBarChart>
        ) : (
          <ComposedChart 
            data={resolvedData} 
            layout={chartType === 'horizontal_bar' ? 'vertical' : 'horizontal'}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" strokeOpacity={0.2} vertical={false} />
            <XAxis 
              dataKey={chartType === 'horizontal_bar' ? undefined : '__idx'} 
              type={chartType === 'horizontal_bar' ? 'number' : 'category'}
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 'bold' }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(idx) => {
                const row = resolvedData.find(r => r.__idx === idx);
                return row ? row[xField] : idx;
              }}
            />
            <YAxis 
              yAxisId="left" 
              dataKey={chartType === 'horizontal_bar' ? '__idx' : undefined}
              type={chartType === 'horizontal_bar' ? 'category' : 'number'}
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 'bold' }} 
              tickFormatter={(val) => {
                if (chartType === 'horizontal_bar') {
                  const row = resolvedData.find(r => r.__idx === val);
                  return row ? row[xField] : val;
                }
                return formatValue(val);
              }}
              axisLine={false} 
              tickLine={false} 
            />
            {yFields.length > 1 && (
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 'bold' }} 
                tickFormatter={formatValue} 
                axisLine={false} 
                tickLine={false} 
              />
            )}
            <ChartTooltip 
              cursor={{ stroke: 'var(--color-accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={<ChartTooltipContent 
                labelFormatter={(idx) => {
                  const row = resolvedData.find(r => r.__idx === idx);
                  return row ? row[xField] : idx;
                }} 
                formatter={(v) => formatValue(v)}
              />} 
            />
            {config.legend_position !== 'hidden' && (
              <ChartLegend content={<ChartLegendContent />} verticalAlign="top" align="center" />
            )}
            {yFields.map((f, i) => {
              const type = config.field_chart_types?.[f] || config.chart_type || 'bar';
              const axisId = (config.y_axis_assign?.[f] || (i === 0 ? 'left' : 'right'));
              
              if (type.includes('bar')) return (
                <Bar 
                  yAxisId={axisId} 
                  key={f} 
                  dataKey={f} 
                  fill={`var(--color-${f})`} 
                  radius={[4, 4, 0, 0]} 
                  barSize={24} 
                  fillOpacity={0.8} 
                  isAnimationActive={false}
                />
              );
              
              if (type.includes('line')) return (
                <Line 
                  yAxisId={axisId} 
                  key={f} 
                  dataKey={f} 
                  stroke={`var(--color-${f})`} 
                  strokeWidth={2} 
                  dot={{ r: 2 }} 
                  type="monotone" 
                  isAnimationActive={false}
                />
              );
              
              if (type.includes('area')) return (
                <Area 
                  yAxisId={axisId} 
                  key={f} 
                  dataKey={f} 
                  stroke={`var(--color-${f})`} 
                  fill={`var(--color-${f})`} 
                  fillOpacity={0.1} 
                  type="monotone" 
                  isAnimationActive={false}
                />
              );
              
              return null;
            })}
          </ComposedChart>
        )}
      </ChartContainer>
    );
  };

  return (
    <div className="flex flex-col h-full w-full p-4 group/preview" style={{ background: 'var(--color-bg-raised)' }}>
      {/* ── HEADER ── */}
      <div className="relative flex items-center justify-between mb-3 z-20 shrink-0">
        <div className="flex-1 drag-handle cursor-move select-none min-w-0" title="Drag to move widget">
          <h3 className="text-[15px] font-bold text-text-primary truncate pr-2">
            {config.title || 'Live Insight'}
          </h3>
        </div>

        {/* Controls — always visible in editing, hover-reveal otherwise */}
        <div className={[
          'flex items-center gap-2 shrink-0 transition-all duration-200',
          isEditing ? '' : 'opacity-0 group-hover/preview:opacity-100',
        ].join(' ')}>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-quaternary hover:text-text-primary hover:bg-bg-muted transition-all"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          {/* X-axis switcher */}
          {config.x_fields?.length > 1 && chartType !== 'table' && chartType !== 'kpi' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="bg-bg-muted border border-border-default rounded-lg pl-3 pr-2 py-1 text-[11px] font-medium text-text-secondary outline-none cursor-pointer hover:border-accent transition-all flex items-center gap-2">
                  {xField} <ChevronDown size={11} className="text-text-quaternary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Dimension Switch</DropdownMenuLabel>
                {config.x_fields.map(f => (
                  <DropdownMenuItem 
                    key={f} 
                    onClick={() => {
                      const nextX = f;
                      const nextSortRules = [
                        { col: nextX, dir: 'ASC' },
                        ...(config.sort_rules || []).filter(r => r.col !== nextX && !config.x_fields?.includes(r.col))
                      ];
                      onConfigChange?.({ ...config, x_field: nextX, sort_rules: nextSortRules });
                    }}
                  >
                    {f}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Chart / Table toggle */}
          {chartType !== 'kpi' && (
            <div className="flex items-center bg-bg-muted border border-border-default rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => onConfigChange?.({ ...config, view_mode: 'chart' })}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-[11px] font-bold ${
                  chartType !== 'table'
                    ? 'bg-accent text-white'
                    : 'text-text-quaternary hover:text-text-primary'
                }`}
              >
                <BarChart3 size={12} /> Chart
              </button>
              <button
                onClick={() => onConfigChange?.({ ...config, view_mode: 'table' })}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-[11px] font-bold ${
                  chartType === 'table'
                    ? 'bg-accent text-white'
                    : 'text-text-quaternary hover:text-text-primary'
                }`}
              >
                <Table2 size={12} /> Table
              </button>
            </div>
          )}

          {/* Edit / Remove */}
          {isEditing && (
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="w-7 h-7 rounded-lg border border-border-default flex items-center justify-center text-text-quaternary hover:text-emerald hover:bg-emerald-muted transition-all">
                <Edit3 size={13} />
              </button>
              <button onClick={onRemove} className="w-7 h-7 rounded-lg border border-border-default flex items-center justify-center text-text-quaternary hover:text-rose hover:bg-rose-muted transition-all">
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content fills remaining height exactly — NO extra wrapping overflow */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}