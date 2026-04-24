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
  Brush,
  Treemap,
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
  if (absVal >= 10000000)
    return (
      (value / 10000000).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }) + " Cr"
    );
  if (absVal >= 100000)
    return (
      (value / 100000).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }) + " L"
    );
  if (absVal >= 1000)
    return (
      (value / 1000).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }) + " k"
    );
  return value.toLocaleString();
};

const formatTooltipValue = (value) => {
  if (typeof value !== "number") return value;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const ChartCrosshair = (props) => {
  const { x, y, width, height } = props;
  if (x === undefined || y === undefined) return null;
  return (
    <g>
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="6 6"
      />
      <line
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="#3b82f6"
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.6}
      />
      <circle cx={x} cy={y} r={4} fill="#3b82f6" />
    </g>
  );
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

  let _xFields =
    config?.x_fields?.length > 0
      ? config.x_fields
      : [config?.x_field].filter(Boolean);
  _xFields = _xFields.filter(isValidField);

  if (_xFields.length === 0 && !isAutomaticKPI && data[0]) {
    const cols = Object.keys(data[0]);
    const firstStr = cols.find((c) => typeof data[0][c] === "string");
    _xFields = [firstStr || cols[0]].filter(Boolean);
  }

  const xFieldsArray = isAutomaticKPI ? [] : _xFields;
  const xField = xFieldsArray[0];

  let _yFields =
    config?.y_fields?.length > 0
      ? config.y_fields
      : config?.y_field
        ? [config.y_field]
        : [];
  _yFields = _yFields.filter(isValidField);

  if (_yFields.length === 0 && !isAutomaticKPI && data[0]) {
    const cols = Object.keys(data[0]);
    const numCols = cols.filter(
      (c) => typeof data[0][c] === "number" && !_xFields.includes(c),
    );
    _yFields =
      numCols.length > 0
        ? [numCols[0]]
        : [cols.filter((c) => !_xFields.includes(c))[0]].filter(Boolean);
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

  const trendData = useMemo(() => {
    if (
      !config.show_trend_line ||
      (yFields.length === 0 && config.chart_type !== "candlestick") ||
      resolvedData.length < 2
    )
      return null;
    const field =
      config.chart_type === "candlestick"
        ? config.candle_close || yFields[0]
        : yFields[0];
    const n = resolvedData.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;
    resolvedData.forEach((d, i) => {
      const v = Number(d[field]) || 0;
      sumX += i;
      sumY += v;
      sumXY += i * v;
      sumX2 += i * i;
    });
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return null;
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    return resolvedData.map((d, i) => ({
      ...d,
      _trend: slope * i + intercept,
    }));
  }, [config.show_trend_line, yFields, resolvedData]);

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
        color: config.series_colors?.[f] || palette[i % palette.length],
      };
    });

    // ── Gradient defs for area/gradient fill ──
    const gradientDefs =
      config.gradient_fill ||
      chartType === "stacked_area" ||
      chartType === "percent_area" ? (
        <defs>
          {yFields.map((f, i) => {
            const color =
              config.series_colors?.[f] || palette[i % palette.length];
            return (
              <linearGradient
                key={f}
                id={`grad_${f}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0.03} />
              </linearGradient>
            );
          })}
        </defs>
      ) : null;

    // ── curve type: monotone (default) | linear | step ──
    const curveType =
      config.curve_type === "linear"
        ? "linear"
        : config.curve_type === "step"
          ? "step"
          : "monotone";

    // ── Universal Axis Helper ──
    const getAxisProps = (prefix) => {
      const mode = config[`${prefix}_mode`] || "smart";
      const type = config[`${prefix}_type`] || "linear";
      const minV = config[`${prefix}_min`];
      const maxV = config[`${prefix}_max`];

      let domain = ["auto", "auto"];
      const isPercent =
        chartType === "stacked_percent_bar" ||
        chartType === "percent_area" ||
        config.stacking === "percent";

      if (isPercent) {
        domain = [0, 100];
      } else if (mode === "zero") {
        domain = [0, (max) => Math.max(max * 1.1, max + 1)];
      } else if (mode === "manual") {
        domain = [minV ?? "auto", maxV ?? "auto"];
      } else {
        // Smart mode: add padding to prevent jumping
        domain = [
          (min) => (min < 0 ? min * 1.1 : min * 0.95),
          (max) => (max < 0 ? max * 0.95 : max * 1.1),
        ];
      }

      return { domain, scale: type };
    };

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
        const coloredData = resolvedData.map((d, i) => ({
          ...d,
          fill: palette[i % palette.length],
        }));
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
                    data={coloredData}
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
                      <Cell
                        key={idx}
                        fill={palette[(idx + ri * 3) % palette.length]}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Pie>
                );
              })}
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(v) => formatTooltipValue(v)}
                  />
                }
              />
              {config.legend_position !== "hidden" && (
                <ChartLegend
                  content={<ChartLegendContent nameKey={xField} />}
                  verticalAlign="bottom"
                  height={20}
                />
              )}
            </RePieChart>
          </ChartContainer>
        );
      }

      // Active-sector donut: highlight hovered slice
      const isDonut =
        chartType === "donut" || (config.pie_inner_radius ?? 0) > 0;
      const isRose = chartType === "rose";
      const showInnerText = config.inner_text && isDonut;
      const innerR =
        config.pie_inner_radius != null
          ? `${config.pie_inner_radius}%`
          : isDonut
            ? "60%"
            : isRose
              ? "20%"
              : 0;
      const outerR =
        config.pie_outer_radius != null ? `${config.pie_outer_radius}%` : "83%";

      return (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RePieChart>
            <Pie
              data={resolvedData.map((d, i) => {
                const name = String(d[xField] || "");
                const val = Number(d[yFields[0]]) || 0;
                let label = name;
                if (config.label_type === "value") label = formatValue(val);
                else if (config.label_type === "both")
                  label = `${name}: ${formatValue(val)}`;
                return {
                  ...d,
                  fill: palette[i % palette.length],
                  __label: label,
                };
              })}
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
                  dataKey="__label"
                  position={config.label_position || "outside"}
                  style={{
                    fontSize: 10,
                    fill: "var(--color-text-tertiary)",
                    fontWeight: 600,
                  }}
                />
              )}
              {showInnerText && (
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && viewBox.cx && viewBox.cy) {
                      const totalVal = resolvedData.reduce(
                        (acc, r) => acc + (Number(r[yFields[0]]) || 0),
                        0,
                      );
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
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent formatter={(v) => formatTooltipValue(v)} />
              }
            />
            {config.legend_position !== "hidden" && (
              <ChartLegend
                content={<ChartLegendContent nameKey={xField} />}
                verticalAlign="bottom"
                height={20}
              />
            )}
          </RePieChart>
        </ChartContainer>
      );
    }

    // ── Radar ──
    if (chartType === "radar") {
      const isFilled = config.radar_filled !== false;
      const fillOp = isFilled
        ? config.fill_opacity !== undefined
          ? config.fill_opacity
          : 0.2
        : 0;
      return (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={resolvedData}>
            <PolarGrid stroke="var(--color-border-muted)" strokeOpacity={0.2} />
            <PolarAngleAxis
              dataKey={xField}
              tick={{
                fill: "var(--color-text-tertiary)",
                fontSize: 10,
                fontWeight: "600",
              }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, "auto"]}
              tick={false}
              axisLine={false}
            />
            {yFields.map((f, i) => (
              <Radar
                key={f}
                name={f}
                dataKey={f}
                stroke={palette[i % palette.length]}
                fill={palette[i % palette.length]}
                fillOpacity={fillOp}
                dot={
                  config.show_markers
                    ? { r: 3, fill: palette[i % palette.length] }
                    : false
                }
              >
                {config.show_data_labels && (
                  <LabelList
                    dataKey={f}
                    position="top"
                    style={{
                      fontSize: 10,
                      fill: "var(--color-text-tertiary)",
                      fontWeight: 700,
                    }}
                    formatter={formatValue}
                  />
                )}
              </Radar>
            ))}
            <ChartTooltip
              cursor={{
                stroke: "var(--color-accent)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              content={
                <ChartTooltipContent formatter={(v) => formatTooltipValue(v)} />
              }
            />
            {config.legend_position !== "hidden" && (
              <ChartLegend
                content={<ChartLegendContent />}
                verticalAlign="bottom"
                height={20}
              />
            )}
          </RadarChart>
        </ChartContainer>
      );
    }

    // ── Radial Bar ──
    if (chartType === "radial_bar") {
      return (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="10%"
            outerRadius="80%"
            barSize={7}
            data={resolvedData.map((d, i) => ({
              ...d,
              fill: palette[i % palette.length],
            }))}
          >
            <RadialBar
              minAngle={15}
              label={
                config.show_data_labels
                  ? { position: "insideStart", fill: "#fff", fontSize: 8 }
                  : false
              }
              background
              clockWise
              dataKey={yFields[0]}
              nameKey={xField}
              isAnimationActive={false}
            >
              {resolvedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={palette[index % palette.length]}
                />
              ))}
            </RadialBar>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent formatter={(v) => formatTooltipValue(v)} />
              }
            />
            {config.legend_position !== "hidden" && (
              <ChartLegend
                content={<ChartLegendContent nameKey={xField} />}
                verticalAlign="bottom"
                height={20}
              />
            )}
          </RadialBarChart>
        </ChartContainer>
      );
    }

    // ── Scatter / Bubble ──
    if (chartType === "scatter" || chartType === "bubble") {
      const xF = yFields[0];
      const yF = yFields[1] || yFields[0];
      const zF = config.size_field;
      const dotR = config.dot_size ?? 5;
      const scatterData = resolvedData.map((row) => ({
        x: Number(getFieldVal(row, xF)) || 0,
        y: Number(getFieldVal(row, yF)) || 0,
        z: zF ? Number(getFieldVal(row, zF)) || 1 : 1,
        name: xField ? getFieldVal(row, xField) : "",
      }));
      return (
        <ChartContainer
          config={{
            x: { label: xF, color: palette[0] },
            y: { label: yF, color: palette[1] },
          }}
          className="h-full w-full"
        >
          <ScatterChart margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
            {(config.show_grid !== false || config.show_grid_x) && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff"
                strokeOpacity={0.15}
                horizontal={config.show_grid !== false}
                vertical={!!config.show_grid_x}
              />
            )}
            <XAxis
              type="number"
              dataKey="x"
              name={xF}
              tick={{
                fill: "var(--color-text-tertiary)",
                fontSize: 12,
                fontWeight: "bold",
              }}
              tickFormatter={formatValue}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yF}
              tick={{
                fill: "var(--color-text-tertiary)",
                fontSize: 12,
                fontWeight: "bold",
              }}
              tickFormatter={formatValue}
              axisLine={false}
              tickLine={false}
              width={65}
              tickMargin={8}
              tickCount={8}
            />
            {chartType === "bubble" && (
              <ZAxis type="number" dataKey="z" range={[30, 400]} />
            )}
            <ChartTooltip
              cursor={{
                stroke: "var(--color-accent)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              content={
                <ChartTooltipContent formatter={(v) => formatTooltipValue(v)} />
              }
            />
            <Scatter
              name="data"
              data={scatterData}
              fill={palette[0]}
              fillOpacity={0.75}
              r={chartType === "bubble" ? undefined : dotR}
              isAnimationActive={config.animation_enabled !== false}
            />
          </ScatterChart>
        </ChartContainer>
      );
    }

    // ── Funnel (custom SVG) ──
    if (chartType === "funnel") {
      const maxVal = Math.max(
        ...resolvedData.map((r) => Number(getFieldVal(r, yFields[0])) || 0),
        1,
      );
      const showPct = config.funnel_show_pct || false;
      return (
        <div className="flex flex-col items-center justify-center h-full gap-1 px-4">
          {resolvedData.map((row, i) => {
            const val = Number(getFieldVal(row, yFields[0])) || 0;
            const label = xField
              ? String(getFieldVal(row, xField) ?? "")
              : String(i + 1);
            const pct = ((val / maxVal) * 100).toFixed(0);
            const barW = `${Math.max(20, (val / maxVal) * 100)}%`;
            const color = palette[i % palette.length];
            const prevVal =
              i > 0
                ? Number(getFieldVal(resolvedData[i - 1], yFields[0])) || val
                : val;
            const convPct = i > 0 ? ((val / prevVal) * 100).toFixed(0) : 100;
            return (
              <div
                key={i}
                className="flex flex-col items-center w-full gap-0.5"
              >
                {showPct && i > 0 && (
                  <span className="text-[9px] font-bold text-text-quaternary">
                    ↓ {convPct}%
                  </span>
                )}
                <div className="flex items-center w-full gap-2">
                  <span
                    className="text-[10px] font-bold text-text-tertiary text-right shrink-0"
                    style={{ width: 120, minWidth: 120 }}
                  >
                    {label}
                  </span>
                  <div
                    className="flex-1 flex items-center justify-center"
                    style={{ height: 28 }}
                  >
                    <div
                      style={{
                        width: barW,
                        height: "100%",
                        background: color,
                        borderRadius: 4,
                        opacity: 0.85,
                        transition: "width 0.4s ease",
                      }}
                      className="flex items-center justify-center"
                    >
                      {config.show_data_labels !== false && (
                        <span className="text-[10px] font-black text-white">
                          {formatValue(val)}
                        </span>
                      )}
                    </div>
                  </div>
                  {showPct && (
                    <span
                      className="text-[9px] font-bold text-text-quaternary shrink-0"
                      style={{ width: 36 }}
                    >
                      {pct}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // ── Waterfall (custom bar logic) ──
    if (chartType === "waterfall") {
      const posColor = config.conditional_positive || "#22c55e";
      const negColor = config.conditional_negative || "#ef4444";
      const totalColor = config.waterfall_total_color || palette[0];

      let running = 0;
      const wfData = resolvedData.map((row, i) => {
        const val = Number(getFieldVal(row, yFields[0])) || 0;
        const isLast = i === resolvedData.length - 1;
        const start = isLast ? 0 : running;
        running += val;
        return {
          label: xField ? String(getFieldVal(row, xField) ?? i) : String(i),
          value: val,
          start: isLast ? 0 : start,
          end: isLast ? running : running,
          isTotal: isLast,
          color: isLast ? totalColor : val >= 0 ? posColor : negColor,
        };
      });

      const allVals = wfData.map((d) => [d.start, d.end]).flat();
      const minV = Math.min(0, ...allVals);
      const maxV = Math.max(...allVals);
      const range = maxV - minV || 1;
      const H = 180;

      return (
        <div className="flex flex-col items-end justify-end w-full h-full px-4 pb-4 pt-4">
          <div className="flex items-end gap-1.5 w-full h-full">
            {wfData.map((d, i) => {
              const barH = (Math.abs(d.end - d.start) / range) * H;
              const offsetFromBottom =
                ((Math.min(d.start, d.end) - minV) / range) * H;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  {config.show_data_labels !== false && (
                    <span
                      className="text-[9px] font-black"
                      style={{ color: d.color }}
                    >
                      {formatValue(d.value)}
                    </span>
                  )}
                  <div
                    className="relative w-full flex flex-col justify-end"
                    style={{ height: H }}
                  >
                    <div
                      className="absolute w-full rounded-sm transition-all"
                      style={{
                        height: Math.max(2, barH),
                        bottom: offsetFromBottom,
                        background: d.color,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-text-quaternary text-center truncate w-full">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── Histogram (computed bins) ──
    if (chartType === "histogram") {
      const numBins = config.histogram_bins ?? 20;
      const rawVals = resolvedData
        .map((r) => Number(getFieldVal(r, yFields[0])))
        .filter((v) => !isNaN(v));
      if (rawVals.length === 0) return null;
      const minV2 = Math.min(...rawVals);
      const maxV2 = Math.max(...rawVals);
      const binSize = (maxV2 - minV2) / numBins || 1;
      const bins = Array.from({ length: numBins }, (_, i) => ({
        name: `${(minV2 + i * binSize).toFixed(1)}`,
        count: rawVals.filter(
          (v) => v >= minV2 + i * binSize && v < minV2 + (i + 1) * binSize,
        ).length,
      }));
      return (
        <ChartContainer
          config={{ count: { label: "Count", color: palette[0] } }}
          className="h-full w-full"
        >
          <ComposedChart
            data={bins}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            {(config.show_grid !== false || config.show_grid_x) && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff"
                strokeOpacity={0.15}
                horizontal={config.show_grid !== false}
                vertical={!!config.show_grid_x}
              />
            )}
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{
                fill: "var(--color-text-tertiary)",
                fontSize: 12,
                fontWeight: "bold",
              }}
              axisLine={false}
              tickLine={false}
              width={65}
              tickMargin={8}
              tickCount={8}
            />
            <ChartTooltip
              cursor={{
                stroke: "var(--color-accent)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              content={<ChartTooltipContent />}
            />
            <Bar
              yAxisId="left"
              dataKey="count"
              radius={[2, 2, 0, 0]}
              isAnimationActive={config.animation_enabled !== false}
            >
              {bins.map((_, i) => (
                <Cell key={i} fill={palette[0]} fillOpacity={0.8} />
              ))}
            </Bar>
          </ComposedChart>
        </ChartContainer>
      );
    }

    // ── Candlestick ──
    if (chartType === "candlestick") {
      const openField = config.candle_open || yFields[0];
      const highField = config.candle_high || yFields[1];
      const lowField = config.candle_low || yFields[2];
      const closeField = config.candle_close || yFields[3];

      if (!openField || !highField || !lowField || !closeField) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-text-quaternary text-[9px] text-center px-4">
            <Activity size={18} className="mb-2 opacity-50" />
            OHLC mapping required
          </div>
        );
      }

      const upColor = config.candle_up || "#22c55e";
      const downColor = config.candle_down || "#ef4444";
      const wickW = config.candle_wick_width ?? 1;
      const bodyW = config.candle_body_width ?? 6;

      const candleData = (trendData || resolvedData).map((row) => {
        const o = Number(getFieldVal(row, openField)) || 0;
        const h = Number(getFieldVal(row, highField)) || 0;
        const l = Number(getFieldVal(row, lowField)) || 0;
        const c = Number(getFieldVal(row, closeField)) || 0;
        return {
          ...row,
          _wick: [l, h],
          _body: [Math.min(o, c), Math.max(o, c)],
          _isUp: c >= o,
          _open: o,
          _close: c,
          _high: h,
          _low: l,
        };
      });

      const primaryAxis = getAxisProps("axis_y");

      return (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={candleData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-muted)"
                strokeOpacity={0.1}
                vertical={false}
              />
              <XAxis
                xAxisId={0}
                dataKey={xField}
                tick={{
                  fill: "var(--color-text-tertiary)",
                  fontSize: 9,
                  fontWeight: "bold",
                }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => String(v).slice(0, 8)}
              />
              <XAxis xAxisId={1} dataKey={xField} hide={true} />
              <YAxis
                yAxisId="left"
                domain={primaryAxis.domain}
                scale={primaryAxis.scale}
                tick={{
                  fill: "var(--color-text-tertiary)",
                  fontSize: 9,
                  fontWeight: "bold",
                }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
                tickCount={5}
                width={60}
              />
              <ChartTooltip
                cursor={{ fill: "var(--color-bg-muted)", opacity: 0.3 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="glass px-2 py-1.5 rounded-lg border border-white/10 shadow-xl text-[9px]">
                        <p className="font-black text-text-quaternary uppercase mb-1 truncate max-w-[100px]">
                          {String(getFieldVal(d, xField))}
                        </p>
                        <div className="grid grid-cols-2 gap-x-2">
                          <span className="text-text-tertiary font-bold uppercase">
                            O:
                          </span>
                          <span className="text-white font-black text-right">
                            {formatTooltipValue(d._open)}
                          </span>
                          <span className="text-text-tertiary font-bold uppercase">
                            C:
                          </span>
                          <span
                            className="font-black text-right"
                            style={{ color: d._isUp ? upColor : downColor }}
                          >
                            {formatTooltipValue(d._close)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                xAxisId={0}
                yAxisId="left"
                dataKey="_wick"
                barSize={wickW}
                isAnimationActive={false}
              >
                {candleData.map((d, i) => (
                  <Cell key={i} fill={d._isUp ? upColor : downColor} />
                ))}
              </Bar>
              <Bar
                xAxisId={1}
                yAxisId="left"
                dataKey="_body"
                barSize={bodyW}
                isAnimationActive={false}
              >
                {candleData.map((d, i) => (
                  <Cell key={i} fill={d._isUp ? upColor : downColor} />
                ))}
              </Bar>
              {config.show_trend_line && (
                <Line
                  xAxisId={0}
                  yAxisId="left"
                  type="monotone"
                  dataKey="_trend"
                  stroke="var(--color-accent)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                  name="Trend Line"
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      );
    }

    // ── Treemap ──
    if (chartType === "treemap") {
      const valF = yFields[0];
      if (!valF) {
        return (
          <div className="flex items-center justify-center h-full text-text-quaternary text-[11px]">
            Treemap requires a value (Y-Axis).
          </div>
        );
      }

      const treeData = resolvedData.map((d) => ({
        name: String(getFieldVal(d, xField) ?? "Unknown"),
        size: Number(getFieldVal(d, valF)) || 0,
      }));

      const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
          return (
            <div
              className="px-3 py-2 rounded-lg"
              style={{
                background: "rgba(10, 10, 20, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(20px)",
                color: "#fff",
              }}
            >
              <div className="text-[10px] font-bold text-text-quaternary uppercase mb-1">
                {payload[0].payload.name}
              </div>
              <div
                className="text-[12px] font-black"
                style={{ color: palette[0] }}
              >
                {formatTooltipValue(payload[0].value)}
              </div>
            </div>
          );
        }
        return null;
      };

      return (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treeData}
              dataKey="size"
              aspectRatio={4 / 3}
              content={(props) => {
                const { x, y, width, height, index, name } = props;
                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={palette[index % palette.length]}
                      stroke="var(--color-bg-base)"
                      strokeWidth={2}
                    />
                    {width > 40 && height > 20 && (
                      <text
                        x={x + width / 2}
                        y={y + height / 2}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={11}
                        fontWeight="bold"
                        dy={4}
                      >
                        {name}
                      </text>
                    )}
                  </g>
                );
              }}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </ChartContainer>
      );
    }

    // ── All Composed / Bar / Line / Area variants ──
    const isHorizontal = config.orientation === "horizontal";
    const isStackedBar = chartType === "bar" && config.stacking === "stacked";
    const isPercentBar = chartType === "bar" && config.stacking === "percent";
    const isStackedArea = chartType === "area" && config.stacking === "stacked";
    const isPercentArea = chartType === "area" && config.stacking === "percent";
    const isAnyStacked =
      isStackedBar || isPercentBar || isStackedArea || isPercentArea;

    // For percent stacking, compute per-row totals
    const percentTotals =
      isPercentBar || isPercentArea
        ? resolvedData.map((row) =>
            yFields.reduce((s, f) => s + (Number(row[f]) || 0), 0),
          )
        : null;

    const stackedResolvedData =
      isPercentBar || isPercentArea
        ? resolvedData.map((row, ri) => {
            const total = percentTotals[ri] || 1;
            const newRow = { ...row };
            yFields.forEach((f) => {
              newRow[f] = ((Number(row[f]) || 0) / total) * 100;
            });
            return newRow;
          })
        : resolvedData;

    const primaryAxis = getAxisProps("axis_y");
    const secondaryAxis = getAxisProps("axis_y_secondary");

    const finalData = trendData || stackedResolvedData;

    return (
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ComposedChart
          data={finalData}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{
            top: 15,
            right: 25,
            left: 15,
            bottom: config.axis_x_rotation
              ? Math.abs(config.axis_x_rotation) * 0.6 + 15
              : 5,
          }}
        >
          {gradientDefs}
          {/* Zero reference line for negative-bar charts */}
          {(config.conditional_color || chartType === "bar") &&
            !isHorizontal && (
              <ReferenceLine
                yAxisId="left"
                y={0}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
            )}
          {(config.show_grid !== false || config.show_grid_x) && (
            <CartesianGrid
              yAxisId="left"
              strokeDasharray="3 3"
              stroke="#ffffff"
              strokeOpacity={0.2}
              horizontal={config.show_grid !== false}
              vertical={!!config.show_grid_x}
            />
          )}
          {/* ── AXES ── */}
          {isHorizontal ? (
            <>
              {/* Horizontal bar: category axis on Y, value axis on X */}
              <YAxis
                yAxisId="left"
                dataKey={xField}
                type="category"
                width={100}
                tick={{
                  fill: "var(--color-text-tertiary)",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
                tickFormatter={(v) =>
                  String(v).length > 25
                    ? String(v).slice(0, 25) + "…"
                    : String(v)
                }
                axisLine={false}
                tickLine={false}
              />
              <XAxis
                type="number"
                tick={{
                  fill: "var(--color-text-tertiary)",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
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
                tick={{
                  fill: "var(--color-text-tertiary)",
                  fontSize: 11,
                  fontWeight: "bold",
                  angle: config.axis_x_rotation || 0,
                  textAnchor:
                    config.axis_x_rotation < 0
                      ? "end"
                      : config.axis_x_rotation > 0
                        ? "start"
                        : "middle",
                }}
                tickFormatter={(v) =>
                  String(v).length > 25
                    ? String(v).slice(0, 25) + "…"
                    : String(v)
                }
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                type="number"
                domain={primaryAxis.domain}
                scale={primaryAxis.scale}
                label={
                  config.axis_y_label
                    ? {
                        value: config.axis_y_label,
                        angle: -90,
                        position: "insideLeft",
                        fill: "var(--color-text-tertiary)",
                        fontSize: 10,
                        fontWeight: "bold",
                      }
                    : undefined
                }
                tickFormatter={
                  isPercentBar || isPercentArea ? (v) => `${v}%` : formatValue
                }
                tick={{
                  fill: "var(--color-text-tertiary)",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
                axisLine={false}
                tickLine={false}
                width={85}
                tickMargin={10}
                tickCount={8}
              />
              {!isAnyStacked && yFields.length > 1 && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={secondaryAxis.domain}
                  scale={secondaryAxis.scale}
                  label={
                    config.axis_y_secondary_label
                      ? {
                          value: config.axis_y_secondary_label,
                          angle: 90,
                          position: "insideRight",
                          fill: "var(--color-text-tertiary)",
                          fontSize: 10,
                          fontWeight: "bold",
                        }
                      : undefined
                  }
                  tick={{
                    fill: "var(--color-text-tertiary)",
                    fontSize: 11,
                    fontWeight: "bold",
                  }}
                  tickFormatter={formatValue}
                  axisLine={false}
                  tickLine={false}
                  width={75}
                  tickMargin={10}
                  tickCount={6}
                />
              )}
            </>
          )}
          <ChartTooltip
            shared={true}
            cursor={
              config.crosshair_enabled
                ? (props) => <ChartCrosshair {...props} />
                : false
            }
            content={
              <ChartTooltipContent
                formatter={(v, name) => (
                  <div className="flex justify-between items-center w-full gap-6">
                    <span className="text-white/50 text-[9px] font-bold uppercase tracking-widest">
                      {name}
                    </span>
                    <span className="text-white text-[10px] font-black">
                      {isPercentBar || isPercentArea
                        ? `${Number(v).toFixed(1)}%`
                        : formatTooltipValue(v)}
                    </span>
                  </div>
                )}
              />
            }
          />
          {config.brush_enabled && (
            <Brush
              dataKey={xField}
              height={20}
              stroke="var(--color-accent)"
              fill="var(--color-bg-muted)"
              travellerWidth={8}
            />
          )}
          {config.legend_position !== "hidden" && (
            <ChartLegend
              content={<ChartLegendContent />}
              verticalAlign={
                config.legend_position === "top"
                  ? "top"
                  : config.legend_position === "right"
                    ? "middle"
                    : "bottom"
              }
              align={config.legend_position === "right" ? "right" : "center"}
              layout={
                config.legend_position === "right" ? "vertical" : "horizontal"
              }
            />
          )}

          {/* ── SERIES ── */}
          {yFields.map((f, i) => {
            const color =
              config.series_colors?.[f] || palette[i % palette.length];
            // Determine per-field series type for composed charts
            let seriesType = chartType;
            if (chartType === "composed") {
              const defaults = config.default_series || {};
              seriesType = defaults[i] || (i === 0 ? "bar" : "line");
            }

            const axisId = isHorizontal
              ? "left"
              : config.y_axis_assign?.[f] || (i === 0 ? "left" : "right");

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
                  fill={color}
                  stackId={
                    isAnyStacked && (isStackedBar || isPercentBar)
                      ? "stack"
                      : undefined
                  }
                  radius={
                    isAnyStacked && i === yFields.length - 1
                      ? [4, 4, 0, 0]
                      : isAnyStacked
                        ? [0, 0, 0, 0]
                        : [4, 4, 0, 0]
                  }
                  barSize={isHorizontal ? 10 : 14}
                  isAnimationActive={config.animation_enabled !== false}
                  layout={isHorizontal ? "vertical" : "horizontal"}
                >
                  {/* Conditional coloring (positive = green, negative = red) */}
                  {config.conditional_color
                    ? resolvedData.map((row, ri) => (
                        <Cell
                          key={ri}
                          fill={
                            (Number(row[f]) || 0) >= 0 ? "#22c55e" : "#ef4444"
                          }
                          fillOpacity={0.85}
                        />
                      ))
                    : resolvedData.map((_, ri) => (
                        <Cell
                          key={ri}
                          fill={
                            isAnyStacked
                              ? color
                              : yFields.length === 1
                                ? color
                                : color
                          }
                          fillOpacity={0.85}
                        />
                      ))}
                  {config.show_data_labels && (
                    <LabelList
                      dataKey={f}
                      position={isHorizontal ? "right" : "top"}
                      style={{
                        fontSize: 10,
                        fill: "var(--color-text-tertiary)",
                        fontWeight: 700,
                      }}
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
                  strokeWidth={config.line_width ?? 2}
                  strokeDasharray={config.stroke_dash || ""}
                  type={
                    config.curve_type === "basis"
                      ? "natural"
                      : config.curve_type || "monotone"
                  }
                  connectNulls={config.connect_nulls !== false}
                  dot={
                    config.show_markers || config.custom_dots
                      ? {
                          r: config.custom_dots ? 5 : (config.marker_size ?? 4),
                          fill: color,
                          stroke: color,
                          strokeWidth: 0,
                        }
                      : { r: 0 }
                  }
                  activeDot={{ r: (config.marker_size ?? 4) + 1 }}
                  isAnimationActive={config.animation_enabled !== false}
                >
                  {config.show_data_labels && (
                    <LabelList
                      dataKey={f}
                      position="top"
                      style={{
                        fontSize: 10,
                        fill: "var(--color-text-tertiary)",
                        fontWeight: 700,
                      }}
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
              const fillSrc =
                config.gradient_fill || isStackedArea || isPercentArea
                  ? `url(#grad_${f})`
                  : color;
              return (
                <Area
                  yAxisId={axisId}
                  key={f}
                  dataKey={f}
                  stackId={isStackedArea || isPercentArea ? "stack" : undefined}
                  stroke={color}
                  strokeWidth={config.line_width ?? 2}
                  strokeDasharray={config.stroke_dash || ""}
                  fill={fillSrc}
                  fillOpacity={
                    config.gradient_fill || isStackedArea || isPercentArea
                      ? 1
                      : 0.15
                  }
                  type={
                    config.curve_type === "basis"
                      ? "natural"
                      : config.curve_type || "monotone"
                  }
                  connectNulls={config.connect_nulls !== false}
                  dot={
                    config.show_markers
                      ? {
                          r: config.marker_size ?? 4,
                          fill: color,
                          stroke: color,
                          strokeWidth: 0,
                        }
                      : false
                  }
                  activeDot={{ r: (config.marker_size ?? 4) + 1 }}
                  isAnimationActive={config.animation_enabled !== false}
                >
                  {config.show_data_labels && (
                    <LabelList
                      dataKey={f}
                      position="top"
                      style={{
                        fontSize: 10,
                        fill: "var(--color-text-tertiary)",
                        fontWeight: 700,
                      }}
                      formatter={formatValue}
                    />
                  )}
                </Area>
              );
            }

            return null;
          })}
          {config.show_trend_line && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="_trend"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              name="Trend Line"
              isAnimationActive={config.animation_enabled !== false}
            />
          )}
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
          {chartType !== "kpi" &&
            chartType !== "table" &&
            chartType !== "pivot_table" && (
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
      <div className="flex-1 h-full w-full relative overflow-hidden z-10">
        {renderContent()}
      </div>
    </div>
  );
}
