import { useState, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  Label,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ZAxis,
  RadialBarChart,
  RadialBar,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Layers,
  Maximize2,
  Minimize2,
  ChevronDown,
  Table2,
  Edit3,
  X,
  Loader2,
  Database,
  RefreshCw,
  ArrowDownUp,
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
    borderRadius: "8px",
    fontSize: "10px",
    color: "#fff",
    backdropFilter: "blur(20px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    padding: "6px 10px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  itemStyle: { padding: "2px 0" },
  cursor: { stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 },
};

const formatValue = (value) => {
  if (typeof value !== "number") return value;
  const absVal = Math.abs(value);
  if (absVal >= 10000000) return (value / 10000000).toFixed(1) + " Cr";
  if (absVal >= 100000) return (value / 100000).toFixed(1) + " L";
  if (absVal >= 1000) return (value / 1000).toFixed(1) + " k";
  return value.toLocaleString();
};

export default function DashboardChartPreview({
  data,
  config,
  onConfigChange,
  onToggleFullscreen,
  isFullscreen,
  onEdit,
  onRemove,
  isEditing,
  isBuilder = false,
}) {
  const [aggMode, setAggMode] = useState(config.agg_mode || "sum");

  // 1. Validation Logic
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20 animate-in fade-in duration-700">
        <Activity size={40} strokeWidth={1} className="animate-pulse" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">
          Neural Interface Ready // Awaiting Pipeline
        </span>
      </div>
    );
  }

  // 2. Data Resolution Helper
  const getFieldVal = (row, field) => {
    if (!row || !field) return undefined;
    if (row[field] !== undefined) return row[field];
    const lowerField = field.toLowerCase();
    const keys = Object.keys(row);
    const insensitiveKey = keys.find((k) => k.toLowerCase() === lowerField);
    if (insensitiveKey) return row[insensitiveKey];

    // Check for aggregated versions
    const aggs = ["sum_", "avg_", "count_", "min_", "max_"];
    for (const a of aggs) {
      const aggLower = (a + field).toLowerCase();
      const match = keys.find((k) => k.toLowerCase() === aggLower);
      if (match) return row[match];
    }
    return undefined;
  };

  // Auto-detect 1x1 data shape (perfect for raw aggregation queries like COUNT(*))
  const isAutomaticKPI =
    data.length === 1 && Object.keys(data[0] || {}).length === 1;
  const autoKpiField = isAutomaticKPI ? Object.keys(data[0])[0] : null;

  const chartType = isAutomaticKPI
    ? "kpi"
    : config.view_mode === "table"
      ? config?.chart_type === "pivot_table"
        ? "pivot_table"
        : "table"
      : config?.chart_type || "bar";
  const isValidField = (f) => f && getFieldVal(data[0], f) !== undefined;

  let _xFields = config?.x_fields?.length > 0
    ? config.x_fields
    : [config?.x_field].filter(Boolean);
  _xFields = _xFields.filter(isValidField);

  if (_xFields.length === 0 && !isAutomaticKPI && data[0]) {
    const cols = Object.keys(data[0]);
    const firstStr = cols.find(c => typeof data[0][c] === 'string');
    _xFields = [firstStr || cols[0]].filter(Boolean);
  }

  const xFieldsArray = isAutomaticKPI ? [] : _xFields;
  const xField = xFieldsArray[0];

  let _yFields = config?.y_fields?.length > 0
    ? config.y_fields
    : config?.y_field
      ? [config.y_field]
      : [];
  _yFields = _yFields.filter(isValidField);

  if (_yFields.length === 0 && !isAutomaticKPI && data[0]) {
    const cols = Object.keys(data[0]);
    const numCols = cols.filter(c => typeof data[0][c] === 'number' && !_xFields.includes(c));
    _yFields = numCols.length > 0 ? [numCols[0]] : [cols.filter(c => !_xFields.includes(c))[0]].filter(Boolean);
  }

  const yFields = isAutomaticKPI ? [autoKpiField] : _yFields;
  const palette =
    COLOR_PALETTES[config?.color_palette || "default"]?.colors ||
    COLOR_PALETTES.default.colors;

  // 3. Transformation
  const resolvedData = data.slice(0, config.limit || 50).map((row, idx) => {
    const newRow = { ...row, __idx: idx };
    xFieldsArray.forEach((f) => {
      newRow[f] = getFieldVal(row, f);
    });
    yFields.forEach((f) => {
      const val = getFieldVal(row, f);
      newRow[f] =
        val !== null && val !== "" && !isNaN(Number(val)) ? Number(val) : val;
    });
    return newRow;
  });

  const renderContent = () => {
    if (yFields.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-white/10">
          <Layers size={32} />
          <span className="text-[9px] font-semibold uppercase tracking-widest">
            Assign Metrics to Begin Compilation
          </span>
        </div>
      );
    }

    if (chartType === "table") {
      // Order columns: Dimensions first, then Metrics. Exclude internal __idx.
      const rawCols = Object.keys(resolvedData[0] || {});
      const xFields = config.x_fields || [config.x_field].filter(Boolean);
      const yFields = config.y_fields || [config.y_field].filter(Boolean);

      const cols = [
        ...xFields.filter((f) => rawCols.includes(f)),
        ...yFields.filter((f) => rawCols.includes(f) && !xFields.includes(f)),
      ];

      // Calculate totals for numeric columns based on mode
      const totals = cols.reduce((acc, col) => {
        const values = resolvedData
          .map((r) => r[col])
          .filter((v) => typeof v === "number" && !isNaN(v));
        if (values.length === 0) {
          acc[col] = null;
          return acc;
        }

        switch (aggMode) {
          case "avg":
            acc[col] = values.reduce((sum, v) => sum + v, 0) / values.length;
            break;
          case "min":
            acc[col] = Math.min(...values);
            break;
          case "max":
            acc[col] = Math.max(...values);
            break;
          case "count":
            acc[col] = values.length;
            break;
          default: // sum
            acc[col] = values.reduce((sum, v) => sum + v, 0);
        }
        return acc;
      }, {});

      // ── SINGLE-SCROLLER table: the table itself scrolls, no parent overflow wrapper ──
      return (
        <div
          className="w-full h-full overflow-auto custom-scrollbar rounded-2xl border border-border-default"
          style={{ background: "var(--color-bg-raised)" }}
        >
          <table
            className="w-full border-separate border-spacing-0"
            style={{ minWidth: "max-content" }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 40,
                background: "var(--color-bg-raised)",
              }}
            >
              <tr>
                {cols.map((c) => (
                  <th
                    key={c}
                    style={{ background: "var(--color-bg-overlay)" }}
                    className="text-left px-2 py-1 text-[10px] font-bold text-text-tertiary uppercase tracking-widest border-b border-border-default whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      {c}
                      <div className="flex flex-col opacity-30">
                        <ChevronDown size={8} className="rotate-180 -mb-0.5" />
                        <ChevronDown size={8} />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resolvedData.map((row, i) => (
                <tr key={i} className="hover:bg-bg-muted/40 transition-colors">
                  {cols.map((c) => {
                    const val = row[c];
                    const isNum = typeof val === "number" && !isNaN(val);
                    return (
                      <td
                        key={c}
                        className={`px-2 py-1 text-[11px] border-b border-border-muted whitespace-nowrap ${isNum ? "font-semibold text-text-primary tabular-nums tracking-wide" : "font-medium text-text-secondary"}`}
                      >
                        {isNum
                          ? val.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : (val ?? "-")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot
              style={{
                position: "sticky",
                bottom: 0,
                zIndex: 40,
                background: "var(--color-bg-overlay)",
              }}
            >
              <tr>
                {cols.map((c, idx) => {
                  const val = totals[c];
                  const isNum = typeof val === "number" && val !== null;
                  return (
                    <td
                      key={`total-${c}`}
                      title={isNum ? val.toLocaleString() : undefined}
                      className="px-2 py-1.5 text-[11px] font-bold text-emerald border-t border-border-strong whitespace-nowrap tracking-wide"
                    >
                      {idx === 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="bg-transparent text-emerald font-bold uppercase outline-none cursor-pointer border-b border-emerald/20 hover:border-emerald text-[10px] nodrag transition-all flex items-center gap-1">
                              {aggMode}{" "}
                              <ChevronDown size={10} className="opacity-50" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>
                              Aggregation Mode
                            </DropdownMenuLabel>
                            {["sum", "avg", "min", "max", "count"].map((m) => (
                              <DropdownMenuItem
                                key={m}
                                onClick={() => {
                                  setAggMode(m);
                                  onConfigChange?.({ ...config, agg_mode: m });
                                }}
                                className="uppercase"
                              >
                                {m}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : isNum ? (
                        formatValue(val)
                      ) : (
                        "-"
                      )}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (chartType === "pivot_table") {
      const rowDim = config.x_fields?.[0] || config.x_field;
      const colDim = config.x_fields?.[1];
      const valDim = config.y_fields?.[0] || config.y_field;

      if (!colDim || !valDim) {
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/10">
            <Layers size={32} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-center leading-relaxed">
              Pivot Requires 2 Dimensions & 1 Metric
              <br />
              <span className="text-white/40 font-medium">
                Add dimensions and a metric to pivot.
              </span>
            </span>
          </div>
        );
      }

      // Collect distinct columns and rows safely, handling nulls/empty
      const colVals = [...new Set(resolvedData.map((r) => r[colDim]))]
        .filter((v) => v !== undefined)
        .sort((a, b) => String(a).localeCompare(String(b)));

      const rowVals = [...new Set(resolvedData.map((r) => r[rowDim]))]
        .filter((v) => v !== undefined)
        .sort((a, b) => String(a).localeCompare(String(b)));

      if (colVals.length === 0 || rowVals.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/10">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-center">
              Compiling Matrix...
              <br />
              <span className="text-white/40 font-medium text-[9px] lowercase">
                No distinct {colVals.length === 0 ? colDim : rowDim} values
                found in preview sample.
              </span>
            </span>
          </div>
        );
      }

      const pivotData = {};
      resolvedData.forEach((r) => {
        const rowKey = r[rowDim];
        const colKey = r[colDim];
        const val = r[valDim];
        if (rowKey === undefined || colKey === undefined) return;

        const rK = String(rowKey);
        const cK = String(colKey);

        if (!pivotData[rK]) pivotData[rK] = {};
        if (!pivotData[rK][cK]) pivotData[rK][cK] = [];
        pivotData[rK][cK].push(Number(val) || 0);
      });

      // Aggregation
      const aggregatedPivot = {};
      rowVals.forEach((rv) => {
        const r = String(rv);
        aggregatedPivot[r] = {};
        colVals.forEach((cv) => {
          const c = String(cv);
          const vals = pivotData[r]?.[c] || [];
          if (vals.length === 0) return;

          let aggVal = 0;
          switch (aggMode) {
            case "avg":
              aggVal = vals.reduce((a, b) => a + b, 0) / vals.length;
              break;
            case "min":
              aggVal = Math.min(...vals);
              break;
            case "max":
              aggVal = Math.max(...vals);
              break;
            case "count":
              aggVal = vals.length;
              break;
            default:
              aggVal = vals.reduce((a, b) => a + b, 0); // sum
          }
          aggregatedPivot[r][c] = aggVal;
        });
      });

      return (
        <div className="w-full h-full overflow-auto custom-scrollbar rounded-2xl border border-border-default bg-bg-surface-raised relative">
          <table
            className="w-full border-separate border-spacing-0"
            style={{ minWidth: "max-content" }}
          >
            <thead style={{ position: "sticky", top: 0, zIndex: 50 }}>
              <tr>
                <th
                  style={{
                    background: "var(--color-bg-overlay)",
                    backdropFilter: "blur(8px)",
                  }}
                  className="text-left px-2 py-1.5 text-[10px] font-bold text-text-quaternary uppercase tracking-[0.1em] border-b border-r border-border-default whitespace-nowrap shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-accent underline decoration-accent/30 underline-offset-2">
                      {rowDim}
                    </span>
                    <span className="text-text-quaternary opacity-40 ml-2">
                      ↳ {colDim}
                    </span>
                  </div>
                </th>
                {colVals.map((cv) => {
                  const c = String(cv);
                  return (
                    <th
                      key={c}
                      style={{
                        background: "var(--color-bg-overlay)",
                        backdropFilter: "blur(8px)",
                      }}
                      className="text-right px-3 py-1.5 text-[10px] font-bold text-text-tertiary tracking-widest border-b border-border-default whitespace-nowrap uppercase shadow-sm"
                    >
                      {c === "null" || c === "" ? (
                        <span className="italic opacity-30 text-[10px]">
                          Unknown
                        </span>
                      ) : (
                        c
                      )}
                    </th>
                  );
                })}
                <th
                  style={{
                    background: "var(--color-bg-overlay)",
                    backdropFilter: "blur(8px)",
                  }}
                  className="text-right px-3 py-1.5 text-[10px] font-bold text-emerald uppercase tracking-widest border-b border-l border-border-strong whitespace-nowrap shadow-md"
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted/30">
              {rowVals.map((rv, i) => {
                const r = String(rv);
                let rowTotal = 0;
                let hasValues = false;
                return (
                  <tr
                    key={i}
                    className="hover:bg-bg-muted/40 transition-colors group/row"
                  >
                    <td className="px-2 py-1 text-[10px] border-r border-border-muted whitespace-nowrap font-bold text-text-secondary bg-bg-surface/50">
                      {r === "null" || r === "" ? (
                        <span className="italic opacity-30 text-[10px]">
                          Unknown
                        </span>
                      ) : (
                        r
                      )}
                    </td>
                    {colVals.map((cv) => {
                      const c = String(cv);
                      const val = aggregatedPivot[r]?.[c];
                      if (val !== undefined) {
                        rowTotal += val;
                        hasValues = true;
                      }
                      return (
                        <td
                          key={c}
                          className="px-3 py-1 text-[10px] whitespace-nowrap text-right tabular-nums text-text-primary font-semibold tracking-wide group-hover/row:text-accent transition-colors"
                        >
                          {val !== undefined
                            ? val.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })
                            : "-"}
                        </td>
                      );
                    })}
                    <td className="px-3 py-1 text-[10px] border-l border-border-strong whitespace-nowrap text-right tabular-nums font-bold text-emerald bg-emerald/[0.02] shadow-inner tracking-wide">
                      {hasValues
                        ? rowTotal.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot style={{ position: "sticky", bottom: 0, zIndex: 50 }}>
              <tr>
                <td
                  style={{
                    background: "var(--color-bg-overlay)",
                    backdropFilter: "blur(8px)",
                  }}
                  className="px-2 py-2 text-[11px] font-bold border-t border-r border-border-strong whitespace-nowrap shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-emerald-muted text-emerald font-bold uppercase outline-none cursor-pointer px-2 py-1 rounded text-[9px] tracking-tighter hover:bg-emerald hover:text-white transition-all flex items-center gap-1.5">
                        {aggMode}{" "}
                        <ChevronDown size={10} className="stroke-[3]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Matrix Aggregation</DropdownMenuLabel>
                      {["sum", "avg", "min", "max", "count"].map((m) => (
                        <DropdownMenuItem
                          key={m}
                          onClick={() => {
                            setAggMode(m);
                            onConfigChange?.({ ...config, agg_mode: m });
                          }}
                          className="uppercase font-bold text-[11px]"
                        >
                          {m}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                {colVals.map((cv) => {
                  const c = String(cv);
                  let colTotal = 0;
                  let hasValues = false;
                  rowVals.forEach((rv) => {
                    const r = String(rv);
                    const val = aggregatedPivot[r]?.[c];
                    if (val !== undefined) {
                      colTotal += val;
                      hasValues = true;
                    }
                  });
                  return (
                    <td
                      key={c}
                      style={{
                        background: "var(--color-bg-overlay)",
                        backdropFilter: "blur(8px)",
                      }}
                      className="px-3 py-2 text-[11px] font-bold border-t border-border-strong whitespace-nowrap text-right text-emerald tabular-nums shadow-[0_-2px_10px_rgba(0,0,0,0.1)] tracking-wide"
                    >
                      {hasValues
                        ? colTotal.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })
                        : "-"}
                    </td>
                  );
                })}
                <td
                  style={{
                    background: "var(--color-bg-overlay)",
                    backdropFilter: "blur(8px)",
                  }}
                  className="px-3 py-2 text-[11px] font-bold border-t border-l border-border-strong whitespace-nowrap text-right text-emerald tabular-nums bg-emerald/10 shadow-[0_-2px_10px_rgba(0,0,0,0.2)] tracking-wide"
                >
                  {rowVals
                    .reduce((acc, rv) => {
                      const r = String(rv);
                      let rSum = 0;
                      colVals.forEach((cv) => {
                        const c = String(cv);
                        const val = aggregatedPivot[r]?.[c];
                        if (val !== undefined) rSum += val;
                      });
                      return acc + rSum;
                    }, 0)
                    .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    // KPI
    if (chartType === "kpi") {
      const val = resolvedData[0]?.[yFields[0]] || 0;
      const isNum = typeof val === "number" && !isNaN(val);
      const displayVal =
        isFullscreen && isNum
          ? val.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : formatValue(val);
      const exactVal = isNum
        ? val.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : String(val);

      return (
        <div
          className="flex flex-col items-center justify-center h-full space-y-1 group/kpi relative cursor-default"
          title={exactVal}
        >
          <span className="text-3xl font-bold text-white tracking-tighter drop-shadow-2xl">
            {displayVal}
          </span>

          <span className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.3em]">
            {config.title || yFields[0]}
          </span>
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

    // ── Gradient defs for area/gradient fill ──
    const gradientDefs = (config.gradient_fill || chartType === "stacked_area" || chartType === "percent_area") ? (
      <defs>
        {yFields.map((f, i) => (
          <linearGradient key={f} id={`grad_${f}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={palette[i % palette.length]} stopOpacity={0.35} />
            <stop offset="95%" stopColor={palette[i % palette.length]} stopOpacity={0.03} />
          </linearGradient>
        ))}
      </defs>
    ) : null;

    // ── curve type: monotone (default) | linear | step ──
    const curveType = config.curve_type === "linear" ? "linear" : config.curve_type === "step" ? "step" : "monotone";

    // ── Pie / Donut / Rose / Nested-Donut ──
    if (
      chartType === "pie" ||
      chartType === "donut" ||
      chartType === "rose" ||
      chartType === "nested_donut"
    ) {
      // For nested_donut render multiple concentric rings, one per yField
      if (chartType === "nested_donut") {
        const rings = yFields.slice(0, 4);
        const totalR = 85;
        const step = Math.floor((totalR - 20) / Math.max(rings.length, 1));
        return (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <RePieChart>
              {rings.map((f, ri) => {
                const outer = totalR - ri * step;
                const inner = outer - step + 4;
                return (
                  <Pie
                    key={f}
                    data={resolvedData}
                    dataKey={f}
                    nameKey={xField}
                    cx="50%"
                    cy="50%"
                    innerRadius={`${inner}%`}
                    outerRadius={`${outer}%`}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {resolvedData.map((_, idx) => (
                      <Cell key={idx} fill={palette[(idx + ri * 3) % palette.length]} fillOpacity={0.85} />
                    ))}
                  </Pie>
                );
              })}
              <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => formatValue(v)} />} />
              {config.legend_position !== "hidden" && (
                <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" height={20} />
              )}
            </RePieChart>
          </ChartContainer>
        );
      }

      // Active-sector donut: highlight hovered slice
      const isDonut = chartType === "donut";
      const isRose = chartType === "rose";
      const showInnerText = config.inner_text && isDonut;
      const innerR = isDonut ? "60%" : isRose ? "20%" : 0;
      const outerR = "83%";

      return (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RePieChart>
            <Pie
              data={resolvedData}
              dataKey={yFields[0]}
              nameKey={xField}
              cx="50%"
              cy="50%"
              innerRadius={innerR}
              outerRadius={outerR}
              paddingAngle={isRose ? 4 : 2}
              stroke="none"
              // Rose chart: variable outer radius via custom shape is complex;
              // use paddingAngle variation and slightly larger slices for visual effect
              startAngle={isRose ? 90 : 0}
              endAngle={isRose ? 450 : 360}
              activeIndex={config.active_sector ? undefined : -1}
            >
              {resolvedData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={palette[index % palette.length]}
                  fillOpacity={0.85}
                  stroke={config.active_sector ? undefined : "none"}
                />
              ))}
              {config.show_data_labels && (
                <LabelList
                  dataKey={xField}
                  position="outside"
                  style={{ fontSize: 8, fill: "var(--color-text-tertiary)", fontWeight: 600 }}
                />
              )}
              {showInnerText && (
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && viewBox.cx && viewBox.cy) {
                      const totalVal = resolvedData.reduce((acc, r) => acc + (Number(r[yFields[0]]) || 0), 0);
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy - 4}
                            className="fill-text-primary text-xl font-bold"
                          >
                            {formatValue(totalVal)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy + 12}
                            className="fill-text-quaternary text-[9px] font-bold tracking-widest uppercase"
                          >
                            Total
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              )}
            </Pie>
            <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => formatValue(v)} />} />
            {config.legend_position !== "hidden" && (
              <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" height={20} />
            )}
          </RePieChart>
        </ChartContainer>
      );
    }

    // ── Radar ──
    if (chartType === "radar") {
      const fillOp = config.fill_opacity !== undefined ? config.fill_opacity : 0.2;
      return (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={resolvedData}>
            <PolarGrid stroke="var(--color-border-muted)" strokeOpacity={0.2} />
            <PolarAngleAxis
              dataKey={xField}
              tick={{ fill: "var(--color-text-tertiary)", fontSize: 8, fontWeight: "600" }}
            />
            <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={false} axisLine={false} />
            {yFields.map((f, i) => (
              <Radar
                key={f}
                name={f}
                dataKey={f}
                stroke={palette[i % palette.length]}
                fill={palette[i % palette.length]}
                fillOpacity={fillOp}
                dot={config.show_markers ? { r: 3, fill: palette[i % palette.length] } : false}
              />
            ))}
            <ChartTooltip
              cursor={{ stroke: "var(--color-accent)", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={<ChartTooltipContent formatter={(v) => formatValue(v)} />}
            />
            {config.legend_position !== "hidden" && (
              <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" height={20} />
            )}
          </RadarChart>
        </ChartContainer>
      );
    }

    // ── Radial Bar ──
    if (chartType === "radial_bar") {
      return (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={7} data={resolvedData}>
            <RadialBar
              minAngle={15}
              label={config.show_data_labels ? { position: "insideStart", fill: "#fff", fontSize: 8 } : false}
              background
              clockWise
              dataKey={yFields[0]}
              isAnimationActive={false}
            >
              {resolvedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
              ))}
            </RadialBar>
            <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => formatValue(v)} />} />
            {config.legend_position !== "hidden" && (
              <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" height={20} />
            )}
          </RadialBarChart>
        </ChartContainer>
      );
    }

    // ── All Composed / Bar / Line / Area variants ──
    const isHorizontal = chartType === "horizontal_bar";
    const isStackedBar  = chartType === "stacked_bar";
    const isPercentBar  = chartType === "stacked_percent_bar";
    const isStackedArea = chartType === "stacked_area";
    const isPercentArea = chartType === "percent_area";
    const isAnyStacked  = isStackedBar || isPercentBar || isStackedArea || isPercentArea;

    // For percent stacking, compute per-row totals
    const percentTotals = (isPercentBar || isPercentArea)
      ? resolvedData.map(row => yFields.reduce((s, f) => s + (Number(row[f]) || 0), 0))
      : null;

    const stackedResolvedData = (isPercentBar || isPercentArea)
      ? resolvedData.map((row, ri) => {
          const total = percentTotals[ri] || 1;
          const newRow = { ...row };
          yFields.forEach(f => { newRow[f] = ((Number(row[f]) || 0) / total) * 100; });
          return newRow;
        })
      : resolvedData;

    return (
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ComposedChart
          data={stackedResolvedData}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          {gradientDefs}
          {/* Zero reference line for negative-bar charts */}
          {(config.conditional_color || chartType === "bar") && !isHorizontal && (
            <ReferenceLine yAxisId="left" y={0} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          )}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-muted)"
            strokeOpacity={0.2}
            vertical={false}
          />
          {/* ── AXES ── */}
          {isHorizontal ? (
            <>
              {/* Horizontal bar: category axis on Y, value axis on X */}
              <YAxis
                yAxisId="left"
                dataKey={xField}
                type="category"
                width={72}
                tick={{ fill: "var(--color-text-tertiary)", fontSize: 9, fontWeight: "bold" }}
                tickFormatter={(v) => String(v).length > 10 ? String(v).slice(0, 10) + "…" : String(v)}
                axisLine={false}
                tickLine={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "var(--color-text-tertiary)", fontSize: 9, fontWeight: "bold" }}
                tickFormatter={formatValue}
                axisLine={false}
                tickLine={false}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xField}
                type="category"
                tick={{ fill: "var(--color-text-tertiary)", fontSize: 9, fontWeight: "bold" }}
                tickFormatter={(v) => String(v).length > 12 ? String(v).slice(0, 12) + "…" : String(v)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                type="number"
                domain={isPercentBar || isPercentArea ? [0, 100] : ["auto", "auto"]}
                tickFormatter={isPercentBar || isPercentArea ? (v) => `${v}%` : formatValue}
                tick={{ fill: "var(--color-text-tertiary)", fontSize: 9, fontWeight: "bold" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              {!isAnyStacked && yFields.length > 1 && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "var(--color-text-tertiary)", fontSize: 9, fontWeight: "bold" }}
                  tickFormatter={formatValue}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
              )}
            </>
          )}
          <ChartTooltip
            cursor={{ stroke: "var(--color-accent)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={
              <ChartTooltipContent
                formatter={(v, name) => [
                  (isPercentBar || isPercentArea) ? `${Number(v).toFixed(1)}%` : formatValue(v),
                  name
                ]}
              />
            }
          />
          {config.legend_position !== "hidden" && (
            <ChartLegend content={<ChartLegendContent />} verticalAlign="top" align="center" />
          )}

          {/* ── SERIES ── */}
          {yFields.map((f, i) => {
            const color = palette[i % palette.length];
            // Determine per-field series type for composed charts
            let seriesType = chartType;
            if (chartType === "composed") {
              const defaults = config.default_series || {};
              seriesType = defaults[i] || (i === 0 ? "bar" : "line");
            }

            const axisId = isHorizontal ? "left" : (config.y_axis_assign?.[f] || (i === 0 ? "left" : "right"));

            // ── BAR variants ──
            if (
              seriesType === "bar" ||
              seriesType === "horizontal_bar" ||
              seriesType === "stacked_bar" ||
              seriesType === "stacked_percent_bar"
            ) {
              return (
                <Bar
                  yAxisId={axisId}
                  key={f}
                  dataKey={f}
                  stackId={isAnyStacked && (isStackedBar || isPercentBar) ? "stack" : undefined}
                  radius={isAnyStacked && i === yFields.length - 1 ? [4, 4, 0, 0] : isAnyStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  barSize={isHorizontal ? 10 : 14}
                  isAnimationActive={false}
                  layout={isHorizontal ? "vertical" : "horizontal"}
                >
                  {/* Conditional coloring (positive = green, negative = red) */}
                  {config.conditional_color
                    ? resolvedData.map((row, ri) => (
                        <Cell
                          key={ri}
                          fill={(Number(row[f]) || 0) >= 0 ? "#22c55e" : "#ef4444"}
                          fillOpacity={0.85}
                        />
                      ))
                    : resolvedData.map((_, ri) => (
                        <Cell key={ri} fill={isAnyStacked ? color : (yFields.length === 1 ? color : palette[i % palette.length])} fillOpacity={0.85} />
                      ))
                  }
                  {config.show_data_labels && (
                    <LabelList
                      dataKey={f}
                      position={isHorizontal ? "right" : "top"}
                      style={{ fontSize: 8, fill: "var(--color-text-tertiary)", fontWeight: 700 }}
                      formatter={formatValue}
                    />
                  )}
                </Bar>
              );
            }

            // ── LINE variants ──
            if (seriesType === "line") {
              return (
                <Line
                  yAxisId={axisId}
                  key={f}
                  dataKey={f}
                  stroke={color}
                  strokeWidth={2}
                  type={curveType}
                  dot={config.show_markers || config.custom_dots
                    ? { r: config.custom_dots ? 5 : 3, fill: color, stroke: "var(--color-bg-raised)", strokeWidth: 2 }
                    : { r: 0 }
                  }
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                >
                  {config.show_data_labels && (
                    <LabelList
                      dataKey={f}
                      position="top"
                      style={{ fontSize: 8, fill: "var(--color-text-tertiary)", fontWeight: 700 }}
                      formatter={formatValue}
                    />
                  )}
                </Line>
              );
            }

            // ── AREA variants (area / stacked_area / percent_area) ──
            if (
              seriesType === "area" ||
              seriesType === "stacked_area" ||
              seriesType === "percent_area"
            ) {
              const fillSrc = config.gradient_fill || isStackedArea || isPercentArea
                ? `url(#grad_${f})`
                : color;
              return (
                <Area
                  yAxisId={axisId}
                  key={f}
                  dataKey={f}
                  stackId={isStackedArea || isPercentArea ? "stack" : undefined}
                  stroke={color}
                  strokeWidth={2}
                  fill={fillSrc}
                  fillOpacity={config.gradient_fill || isStackedArea || isPercentArea ? 1 : 0.15}
                  type={curveType}
                  dot={config.show_markers
                    ? { r: 3, fill: color, stroke: "var(--color-bg-raised)", strokeWidth: 2 }
                    : false
                  }
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                >
                  {config.show_data_labels && (
                    <LabelList
                      dataKey={f}
                      position="top"
                      style={{ fontSize: 8, fill: "var(--color-text-tertiary)", fontWeight: 700 }}
                      formatter={formatValue}
                    />
                  )}
                </Area>
              );
            }

            return null;
          })}
        </ComposedChart>
      </ChartContainer>
    );
  };

  return (
    <div
      className="flex flex-col h-full w-full p-1.5 group/preview"
      style={{ background: "var(--color-bg-raised)" }}
    >
      {/* ── HEADER ── */}
      <div className="relative flex items-center justify-between mb-1 z-20 shrink-0">
        <div
          className="flex-1 drag-handle cursor-move select-none min-w-0"
          title="Drag to move widget"
        >
          <h3 className="text-[11px] font-bold text-text-primary truncate pr-1">
            {config.title || "Live Insight"}
          </h3>
        </div>

        {/* Controls — always visible in editing, hover-reveal otherwise */}
        <div
          className={[
            "flex items-center gap-2 shrink-0 transition-all duration-200",
            isEditing || isBuilder
              ? ""
              : "opacity-0 group-hover/preview:opacity-100",
          ].join(" ")}
        >
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="w-5 h-5 rounded-md flex items-center justify-center text-text-quaternary hover:text-text-primary hover:bg-bg-muted transition-all"
            >
              {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
            </button>
          )}

          {/* Dimension Switcher (Pivot Specific) */}
          {chartType === "pivot_table" && config.x_fields?.length >= 2 && (
            <div className="flex items-center gap-1.5 bg-bg-muted border border-border-default rounded-xl p-1 shadow-sm">
              <div className="flex items-center gap-1 px-1.5">
                <span className="text-[9px] font-black text-text-quaternary uppercase tracking-tighter">
                  Rows
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-bg-base border border-border-muted rounded-lg px-2 py-1 text-[10px] font-bold text-text-primary outline-none hover:border-accent transition-all flex items-center gap-1">
                      {config.x_fields[0]} <ChevronDown size={10} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {config.x_fields.map((f) => (
                      <DropdownMenuItem
                        key={f}
                        onClick={() => {
                          const next = [
                            f,
                            ...config.x_fields.filter((x) => x !== f),
                          ];
                          onConfigChange?.({ ...config, x_fields: next });
                        }}
                      >
                        {f}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <button
                onClick={() => {
                  const next = [...(config.x_fields || [])];
                  [next[0], next[1]] = [next[1], next[0]];
                  onConfigChange?.({ ...config, x_fields: next });
                }}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-accent text-white hover:rotate-180 transition-all duration-500 shadow-md"
                title="Swap Rows & Columns"
              >
                <ArrowDownUp size={12} />
              </button>

              <div className="flex items-center gap-1 px-1.5">
                <span className="text-[9px] font-black text-text-quaternary uppercase tracking-tighter">
                  Cols
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-bg-base border border-border-muted rounded-lg px-2 py-1 text-[10px] font-bold text-text-primary outline-none hover:border-accent transition-all flex items-center gap-1">
                      {config.x_fields[1]} <ChevronDown size={10} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {config.x_fields.map((f) => (
                      <DropdownMenuItem
                        key={f}
                        onClick={() => {
                          if (f === config.x_fields[0]) return;
                          const next = [
                            config.x_fields[0],
                            f,
                            ...config.x_fields.filter(
                              (x, i) => x !== f && i !== 0,
                            ),
                          ];
                          onConfigChange?.({ ...config, x_fields: next });
                        }}
                      >
                        {f}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* X-axis switcher (Standard Charts) */}
          {config.x_fields?.length > 1 &&
            chartType !== "table" &&
            chartType !== "kpi" &&
            chartType !== "pivot_table" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-bg-muted border border-border-default rounded-lg pl-3 pr-2 py-1 text-[11px] font-medium text-text-secondary outline-none cursor-pointer hover:border-accent transition-all flex items-center gap-2">
                    {xField}{" "}
                    <ChevronDown size={11} className="text-text-quaternary" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Dimension Switch</DropdownMenuLabel>
                  {config.x_fields.map((f) => (
                    <DropdownMenuItem
                      key={f}
                      onClick={() => {
                        const nextX = f;
                        const nextSortRules = [
                          { col: nextX, dir: "ASC" },
                          ...(config.sort_rules || []).filter(
                            (r) =>
                              r.col !== nextX &&
                              !config.x_fields?.includes(r.col),
                          ),
                        ];
                        onConfigChange?.({
                          ...config,
                          x_field: nextX,
                          sort_rules: nextSortRules,
                        });
                      }}
                    >
                      {f}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          {/* Chart / Table toggle */}
          {chartType !== "kpi" && config?.chart_type !== "pivot_table" && (
            <div className="flex items-center bg-bg-muted border border-border-default rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() =>
                  onConfigChange?.({ ...config, view_mode: "chart" })
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-[11px] font-bold ${
                  chartType !== "table"
                    ? "bg-accent text-white"
                    : "text-text-quaternary hover:text-text-primary"
                }`}
              >
                <BarChart3 size={12} /> Chart
              </button>
              <button
                onClick={() =>
                  onConfigChange?.({ ...config, view_mode: "table" })
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-[11px] font-bold ${
                  chartType === "table"
                    ? "bg-accent text-white"
                    : "text-text-quaternary hover:text-text-primary"
                }`}
              >
                <Table2 size={12} /> Table
              </button>
            </div>
          )}

          {/* Edit / Remove */}
          {isEditing && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={onEdit}
                className="w-5 h-5 rounded-md border border-border-default flex items-center justify-center text-text-quaternary hover:text-emerald hover:bg-emerald-muted transition-all"
              >
                <Edit3 size={10} />
              </button>
              <button
                onClick={onRemove}
                className="w-5 h-5 rounded-md border border-border-default flex items-center justify-center text-text-quaternary hover:text-rose hover:bg-rose-muted transition-all"
              >
                <X size={10} />
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
