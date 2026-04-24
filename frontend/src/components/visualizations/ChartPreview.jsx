import { useState, useMemo, useRef } from "react";
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
  Sector,
} from "recharts";
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Sphere,
  ZoomableGroup,
} from "react-simple-maps";
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
    borderRadius: "12px",
    fontSize: "12px",
    color: "#fff",
    backdropFilter: "blur(20px)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    padding: "12px 16px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  itemStyle: { padding: "3px 0" },
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

export default function ChartPreview({
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
  const [mapTooltip, setMapTooltip] = useState(null);
  const [activePieIndex, setActivePieIndex] = useState(-1);
  const containerRef = useRef(null);

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
  const xField = config.x_field || xFieldsArray[0];

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

  // 3. Transformation & Sorting
  const sortBy = config.sort_by || "default";
  let processedData = [...data];

  if (sortBy !== "default" && xField && yFields.length > 0) {
    processedData.sort((a, b) => {
      if (sortBy === "alpha") {
        const valA = String(getFieldVal(a, xField) || "");
        const valB = String(getFieldVal(b, xField) || "");
        return valA.localeCompare(valB);
      }
      if (sortBy === "value_desc" || sortBy === "value_asc") {
        const field = yFields[0];
        const valA = Number(getFieldVal(a, field)) || 0;
        const valB = Number(getFieldVal(b, field)) || 0;
        return sortBy === "value_desc" ? valB - valA : valA - valB;
      }
      return 0;
    });
  }

  const resolvedData = processedData
    .slice(0, config.limit || 50)
    .map((row, idx) => {
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
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">
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
          <span className="text-[9px] font-black uppercase tracking-widest">
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
                    className="text-left px-4 py-2 text-[14px] font-black text-text-tertiary uppercase tracking-widest border-b border-border-default whitespace-nowrap"
                  >
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
                  {cols.map((c) => {
                    const val = row[c];
                    const isNum = typeof val === "number" && !isNaN(val);
                    return (
                      <td
                        key={c}
                        className={`px-4 py-2.5 text-[16px] border-b border-border-muted whitespace-nowrap ${isNum ? "font-black text-text-primary tabular-nums tracking-wide" : "font-bold text-text-secondary"}`}
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
                      className="px-4 py-3 text-[16px] font-black text-emerald border-t border-border-strong whitespace-nowrap tracking-wide"
                    >
                      {idx === 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="bg-transparent text-emerald font-black uppercase outline-none cursor-pointer border-b border-emerald/20 hover:border-emerald text-[13px] nodrag transition-all flex items-center gap-1">
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
            <span className="text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">
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
            <span className="text-[10px] font-black uppercase tracking-widest text-center">
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
                  className="text-left px-4 py-2 text-[13px] font-black text-text-quaternary uppercase tracking-[0.2em] border-b border-r border-border-default whitespace-nowrap shadow-sm"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-accent underline decoration-accent/30 underline-offset-4">
                      {rowDim}
                    </span>
                    <span className="text-text-quaternary opacity-40 ml-4">
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
                      className="text-right px-5 py-2 text-[14px] font-black text-text-tertiary tracking-widest border-b border-border-default whitespace-nowrap uppercase shadow-sm"
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
                  className="text-right px-5 py-2 text-[14px] font-black text-emerald uppercase tracking-widest border-b border-l border-border-strong whitespace-nowrap shadow-md"
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
                    <td className="px-4 py-2.5 text-[15px] border-r border-border-muted whitespace-nowrap font-black text-text-secondary bg-bg-surface/50">
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
                          className="px-5 py-2.5 text-[16px] whitespace-nowrap text-right tabular-nums text-text-primary font-black tracking-wide group-hover/row:text-accent transition-colors"
                        >
                          {val !== undefined
                            ? val.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })
                            : "-"}
                        </td>
                      );
                    })}
                    <td className="px-5 py-2.5 text-[16px] border-l border-border-strong whitespace-nowrap text-right tabular-nums font-black text-emerald bg-emerald/[0.02] shadow-inner tracking-wide">
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
                  className="px-4 py-3 text-[16px] font-black border-t border-r border-border-strong whitespace-nowrap shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-emerald-muted text-emerald font-black uppercase outline-none cursor-pointer px-2 py-1 rounded text-[9px] tracking-tighter hover:bg-emerald hover:text-white transition-all flex items-center gap-1.5">
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
                      className="px-5 py-3 text-[16px] font-black border-t border-border-strong whitespace-nowrap text-right text-emerald tabular-nums shadow-[0_-2px_10px_rgba(0,0,0,0.1)] tracking-wide"
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
                  className="px-5 py-3 text-[17px] font-black border-t border-l border-border-strong whitespace-nowrap text-right text-emerald tabular-nums bg-emerald/10 shadow-[0_-2px_10px_rgba(0,0,0,0.2)] tracking-wide"
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

      // Apply format settings
      const fmt = config.kpi_format || "auto";
      const prefix = config.kpi_prefix || "";
      const suffix = config.kpi_suffix || "";

      let displayVal;
      if (!isNum) {
        displayVal = String(val);
      } else if (fmt === "currency") {
        displayVal = val.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 1,
        });
      } else if (fmt === "percent") {
        displayVal = val.toLocaleString(undefined, {
          style: "percent",
          maximumFractionDigits: 1,
        });
      } else if (fmt === "number") {
        displayVal = val.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        });
      } else {
        // auto — compact formatting
        displayVal = isFullscreen
          ? val.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : formatValue(val);
      }

      const exactVal = isNum
        ? val.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : String(val);

      return (
        <div
          className="flex flex-col items-center justify-center h-full space-y-2 group/kpi relative cursor-default"
          title={exactVal}
        >
          <span className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
            {prefix}
            {displayVal}
            {suffix}
          </span>

          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
            {config.title || yFields[0]}
          </span>
        </div>
      );
    }

    const isStackedBar = chartType === "bar" && config.stacking === "stacked";
    const isPercentBar = chartType === "bar" && config.stacking === "percent";
    const isStackedArea = chartType === "area" && config.stacking === "stacked";
    const isPercentArea = chartType === "area" && config.stacking === "percent";
    const isAnyStacked =
      isStackedBar || isPercentBar || isStackedArea || isPercentArea;

    // Charts
    const chartConfig = {};
    yFields.forEach((f, i) => {
      chartConfig[f] = {
        label: f,
        color:
          config.series_colors?.[f] ||
          palette[(i * (isAnyStacked ? 2 : 1)) % palette.length],
      };
    });

    // ── Gradient defs for area fill ──
    const gradientDefs =
      chartType === "stacked_area" || chartType === "percent_area" ? (
        <defs>
          {yFields.map((f, i) => {
            const color =
              config.series_colors?.[f] ||
              palette[(i * (isAnyStacked ? 2 : 1)) % palette.length];
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

    // ── Pie / Donut / Rose / Nested-Donut ──
    if (
      chartType === "pie" ||
      chartType === "donut" ||
      chartType === "rose" ||
      chartType === "nested_donut"
    ) {
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
                  verticalAlign={
                    config.legend_position === "top"
                      ? "top"
                      : config.legend_position === "right"
                        ? "middle"
                        : "bottom"
                  }
                  align={
                    config.legend_position === "right" ? "right" : "center"
                  }
                  layout={
                    config.legend_position === "right"
                      ? "vertical"
                      : "horizontal"
                  }
                  height={config.legend_position === "right" ? undefined : 36}
                />
              )}
            </RePieChart>
          </ChartContainer>
        );
      }

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
              startAngle={isRose ? 90 : 0}
              endAngle={isRose ? 450 : 360}
              activeIndex={config.active_sector ? activePieIndex : -1}
              activeShape={(props) => {
                const {
                  cx,
                  cy,
                  innerRadius,
                  outerRadius,
                  startAngle,
                  endAngle,
                  fill,
                } = props;
                return (
                  <g>
                    <Sector
                      cx={cx}
                      cy={cy}
                      innerRadius={innerRadius}
                      outerRadius={outerRadius + 10}
                      startAngle={startAngle}
                      endAngle={endAngle}
                      fill={fill}
                      fillOpacity={1}
                      stroke={fill}
                      strokeWidth={2}
                    />
                  </g>
                );
              }}
              isAnimationActive={config.animation_enabled !== false}
            >
              {resolvedData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={palette[index % palette.length]}
                  fillOpacity={0.85}
                  stroke="none"
                  onMouseEnter={() =>
                    config.active_sector && setActivePieIndex(index)
                  }
                  onMouseLeave={() => setActivePieIndex(-1)}
                  style={{
                    outline: "none",
                    cursor: config.active_sector ? "pointer" : "default",
                  }}
                />
              ))}
              {config.show_data_labels && (
                <LabelList
                  dataKey="__label"
                  position={config.label_position || "outside"}
                  isAnimationActive={false}
                  style={{
                    fontSize: 14,
                    fill: config.label_color || "var(--color-text-tertiary)",
                    fontWeight: 700,
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
                            y={viewBox.cy - 6}
                            className="fill-text-primary text-2xl font-bold"
                          >
                            {formatValue(totalVal)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy + 16}
                            className="fill-text-quaternary text-[11px] font-bold tracking-widest uppercase"
                          >
                            Total {yFields[0]}
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
                height={config.legend_position === "right" ? undefined : 36}
              />
            )}
          </RePieChart>
        </ChartContainer>
      );
    }

    // ── Universal Axis Helper ──
    const getAxisProps = (prefix) => {
      const mode = config[`${prefix}_mode`] || "smart";
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
        domain = [0, (max) => max * 1.1];
      } else if (mode === "manual") {
        domain = [minV ?? "auto", maxV ?? "auto"];
      } else {
        // Smart mode: add padding to prevent jumping
        domain = [
          (min) => (min < 0 ? min * 1.1 : min * 0.95),
          (max) => (max < 0 ? max * 0.95 : max * 1.1),
        ];
      }

      return { domain, scale: "linear" };
    };

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
            {config.show_grid !== false && (
              <PolarGrid
                stroke="var(--color-border-muted)"
                strokeOpacity={0.2}
              />
            )}
            <PolarAngleAxis
              dataKey={xField}
              tick={{
                fill: "var(--color-text-tertiary)",
                fontSize: 14,
                fontWeight: "bold",
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
                    ? { r: 4, fill: palette[i % palette.length] }
                    : false
                }
              >
                {config.show_data_labels && (
                  <LabelList
                    dataKey={f}
                    position="top"
                    style={{
                      fontSize: 14,
                      fill: config.label_color || "var(--color-text-tertiary)",
                      fontWeight: "bold",
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
                height={config.legend_position === "right" ? undefined : 36}
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
            innerRadius={`${config.radial_inner_radius ?? 10}%`}
            outerRadius={`${config.radial_outer_radius ?? 80}%`}
            barSize={config.radial_bar_size ?? 10}
            data={resolvedData.map((d, i) => ({
              ...d,
              fill: palette[i % palette.length],
            }))}
          >
            <RadialBar
              minAngle={15}
              label={
                config.show_data_labels
                  ? { position: "insideStart", fill: "#fff", fontSize: 12 }
                  : false
              }
              background
              clockWise
              dataKey={yFields[0]}
              nameKey={xField}
              isAnimationActive={config.animation_enabled !== false}
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
                height={config.legend_position === "right" ? undefined : 36}
              />
            )}
          </RadialBarChart>
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

    // ── Candlestick ──
    if (chartType === "candlestick") {
      const openField = config.candle_open || yFields[0];
      const highField = config.candle_high || yFields[1];
      const lowField = config.candle_low || yFields[2];
      const closeField = config.candle_close || yFields[3];

      if (!openField || !highField || !lowField || !closeField) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-text-quaternary text-[11px] text-center px-4">
            <Activity size={24} className="mb-2 opacity-50" />
            Candlestick chart requires 4 mapped fields (Open, High, Low, Close).
            <br />
            Please map them in the settings panel.
          </div>
        );
      }

      const upColor = config.candle_up || "#22c55e";
      const downColor = config.candle_down || "#ef4444";
      const wickW = config.candle_wick_width ?? 2;
      const bodyW = config.candle_body_width ?? 10;

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
              margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff"
                strokeOpacity={0.2}
                horizontal={config.show_grid !== false}
                vertical={!!config.show_grid_x}
                yAxisId="left"
              />
              <XAxis
                xAxisId={0}
                dataKey={xField}
                stroke="var(--color-text-tertiary)"
                fontSize={12}
                fontWeight="bold"
                tickLine={false}
                axisLine={{ stroke: "var(--color-border-muted)" }}
                tickMargin={12}
                tick={{
                  angle: config.axis_x_rotation || 0,
                  textAnchor: config.axis_x_rotation
                    ? config.axis_x_rotation < 0
                      ? "end"
                      : "start"
                    : "middle",
                }}
              />
              <XAxis xAxisId={1} dataKey={xField} hide={true} />
              <YAxis
                yAxisId="left"
                domain={primaryAxis.domain}
                scale={primaryAxis.scale}
                stroke="var(--color-text-tertiary)"
                fontSize={12}
                fontWeight="bold"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tickFormatter={formatValue}
                tickCount={6}
                width={80}
              />
              <ChartTooltip
                cursor={{ fill: "var(--color-bg-muted)", opacity: 0.5 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="glass px-4 py-3 rounded-xl border border-white/10 shadow-2xl">
                        <p className="text-[11px] font-black text-text-quaternary uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
                          {String(getFieldVal(d, xField))}
                        </p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                          <span className="text-[10px] text-text-tertiary font-bold uppercase">
                            Open:
                          </span>
                          <span className="text-[12px] text-white font-black text-right">
                            {formatTooltipValue(d._open)}
                          </span>

                          <span className="text-[10px] text-text-tertiary font-bold uppercase">
                            High:
                          </span>
                          <span className="text-[12px] text-white font-black text-right">
                            {formatTooltipValue(d._high)}
                          </span>

                          <span className="text-[10px] text-text-tertiary font-bold uppercase">
                            Low:
                          </span>
                          <span className="text-[12px] text-white font-black text-right">
                            {formatTooltipValue(d._low)}
                          </span>

                          <span className="text-[10px] text-text-tertiary font-bold uppercase">
                            Close:
                          </span>
                          <span
                            className="text-[12px] font-black text-right"
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
                isAnimationActive={config.animation_enabled !== false}
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
                isAnimationActive={config.animation_enabled !== false}
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
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                  name="Trend Line"
                  isAnimationActive={config.animation_enabled !== false}
                />
              )}
              {config.brush_enabled && (
                <Brush
                  dataKey={xField}
                  height={30}
                  stroke="var(--color-accent)"
                  fill="var(--color-bg-muted)"
                  travellerWidth={10}
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

      const tileOpacity = config.tile_opacity ?? 0.85;
      const labelMin = config.treemap_label_min ?? 40;
      let treeData = resolvedData.map((d) => ({
        name: String(getFieldVal(d, xField) ?? "Unknown"),
        size: Number(getFieldVal(d, valF)) || 0,
      }));
      if (config.sort_by === "value_desc")
        treeData.sort((a, b) => b.size - a.size);
      if (config.sort_by === "value_asc")
        treeData.sort((a, b) => a.size - b.size);

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
                className="text-[14px] font-black"
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
                const minLbl = labelMin;
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
                      fillOpacity={tileOpacity}
                    />
                    {config.show_data_labels !== false &&
                      width > minLbl &&
                      height > 20 && (
                        <text
                          x={x + width / 2}
                          y={y + height / 2}
                          textAnchor="middle"
                          fill={config.label_color || "#fff"}
                          fontSize={15}
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

    // ── World Map (Choropleth & Bubble) ──
    if (chartType === "world_map") {
      const geoUrl =
        "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
      const colorLow = config.map_color_low || "#1e293b";
      const colorHigh = config.map_color_high || "#8b5cf6";
      const colorNone = config.map_color_none || "rgba(255,255,255,0.05)";
      const projection = config.map_projection || "geoNaturalEarth1";
      const mapMode = config.map_mode || "choropleth"; // 'choropleth' or 'bubble'
      const showGraticule = config.map_show_graticule !== false;

      const CENTROIDS = {
        afghanistan: [66.0, 33.0],
        albania: [20.0, 41.0],
        algeria: [3.0, 28.0],
        angola: [18.0, -12.0],
        argentina: [-64.0, -38.0],
        armenia: [45.0, 40.0],
        australia: [133.0, -25.0],
        austria: [14.0, 47.0],
        azerbaijan: [47.5, 40.0],
        bahamas: [-77.0, 24.0],
        bangladesh: [90.0, 24.0],
        belarus: [28.0, 53.0],
        belgium: [4.0, 50.5],
        belize: [-88.5, 17.0],
        benin: [2.0, 9.5],
        bhutan: [90.5, 27.5],
        bolivia: [-64.0, -16.0],
        "bosnia and herzegovina": [18.0, 44.0],
        botswana: [24.0, -22.0],
        brazil: [-55.0, -10.0],
        brunei: [114.5, 4.5],
        bulgaria: [25.0, 43.0],
        "burkina faso": [-2.0, 13.0],
        burundi: [30.0, -3.5],
        cambodia: [105.0, 13.0],
        cameroon: [12.0, 7.0],
        canada: [-106.0, 60.0],
        "central african rep.": [21.0, 7.0],
        chad: [19.0, 15.0],
        chile: [-71.0, -30.0],
        china: [105.0, 35.0],
        colombia: [-72.0, 4.0],
        congo: [15.0, -1.0],
        "costa rica": [-84.0, 10.0],
        croatia: [15.5, 45.0],
        cuba: [-80.0, 21.5],
        cyprus: [33.0, 35.0],
        czechia: [15.5, 50.0],
        "dem. rep. congo": [24.0, -3.0],
        denmark: [10.0, 56.0],
        djibouti: [43.0, 11.5],
        "dominican rep.": [-70.5, 19.0],
        ecuador: [-77.5, -2.0],
        egypt: [30.0, 27.0],
        "el salvador": [-89.0, 13.5],
        "equatorial guinea": [10.0, 1.5],
        eritrea: [39.0, 15.0],
        estonia: [26.0, 59.0],
        ethiopia: [39.0, 8.0],
        "falkland is.": [-59.5, -51.5],
        fiji: [178.0, -18.0],
        finland: [26.0, 64.0],
        france: [2.0, 46.0],
        "french guiana": [-53.0, 4.0],
        gabon: [11.5, -1.0],
        gambia: [-15.5, 13.5],
        georgia: [43.5, 42.0],
        germany: [10.0, 51.0],
        ghana: [-2.0, 8.0],
        greece: [22.0, 39.0],
        greenland: [-40.0, 72.0],
        guatemala: [-90.5, 15.5],
        guinea: [-11.0, 11.0],
        "guinea-bissau": [-15.0, 12.0],
        guyana: [-59.0, 5.0],
        haiti: [-72.5, 19.0],
        honduras: [-86.5, 15.0],
        hungary: [20.0, 47.0],
        iceland: [-18.0, 65.0],
        india: [78.0, 22.0],
        indonesia: [120.0, -5.0],
        iran: [53.0, 32.0],
        iraq: [44.0, 33.0],
        ireland: [-8.0, 53.0],
        israel: [34.8, 31.0],
        italy: [12.0, 43.0],
        "ivory coast": [-5.5, 7.5],
        jamaica: [-77.5, 18.0],
        japan: [138.0, 36.0],
        jordan: [36.0, 31.0],
        kazakhstan: [68.0, 48.0],
        kenya: [38.0, 1.0],
        kuwait: [47.5, 29.5],
        kyrgyzstan: [75.0, 41.5],
        laos: [105.0, 18.0],
        latvia: [25.0, 57.0],
        lebanon: [35.8, 33.8],
        lesotho: [28.5, -29.5],
        liberia: [-9.5, 6.5],
        libya: [17.0, 25.0],
        lithuania: [24.0, 56.0],
        luxembourg: [6.0, 49.8],
        madagascar: [47.0, -20.0],
        malawi: [34.0, -13.5],
        malaysia: [112.5, 2.5],
        mali: [-4.0, 17.0],
        malta: [14.5, 35.9],
        mauritania: [-12.0, 20.0],
        mexico: [-102.0, 23.0],
        moldova: [28.5, 47.0],
        mongolia: [103.0, 46.0],
        montenegro: [19.0, 42.5],
        morocco: [-7.0, 32.0],
        mozambique: [35.0, -18.5],
        myanmar: [96.0, 22.0],
        namibia: [17.0, -22.0],
        nepal: [84.0, 28.0],
        netherlands: [5.5, 52.5],
        "new zealand": [174.0, -41.0],
        nicaragua: [-85.0, 13.0],
        niger: [8.0, 16.0],
        nigeria: [8.0, 10.0],
        "north korea": [127.0, 40.0],
        "north macedonia": [21.5, 41.6],
        norway: [10.0, 62.0],
        oman: [57.0, 21.0],
        pakistan: [70.0, 30.0],
        panama: [-80.0, 9.0],
        "papua new guinea": [143.0, -6.0],
        paraguay: [-58.0, -23.0],
        peru: [-75.0, -10.0],
        philippines: [122.0, 13.0],
        poland: [20.0, 52.0],
        portugal: [-8.0, 39.5],
        "puerto rico": [-66.5, 18.2],
        qatar: [51.2, 25.3],
        romania: [25.0, 46.0],
        russia: [105.0, 60.0],
        rwanda: [30.0, -2.0],
        "saudi arabia": [45.0, 25.0],
        senegal: [-14.0, 14.5],
        serbia: [21.0, 44.0],
        "sierra leone": [-11.5, 8.5],
        singapore: [103.8, 1.3],
        slovakia: [19.5, 48.5],
        slovenia: [15.0, 46.0],
        somalia: [46.0, 6.0],
        "south africa": [24.0, -29.0],
        "south korea": [128.0, 36.0],
        "south sudan": [30.0, 7.0],
        spain: [-4.0, 40.0],
        "sri lanka": [81.0, 7.0],
        sudan: [30.0, 15.0],
        suriname: [-56.0, 4.0],
        sweden: [15.0, 62.0],
        switzerland: [8.0, 47.0],
        syria: [38.0, 35.0],
        taiwan: [121.0, 24.0],
        tajikistan: [71.0, 38.5],
        tanzania: [35.0, -6.0],
        thailand: [101.0, 15.0],
        togo: [1.0, 8.0],
        "trinidad and tobago": [-61.0, 10.5],
        tunisia: [9.0, 34.0],
        turkey: [35.0, 39.0],
        turkmenistan: [60.0, 40.0],
        uganda: [32.5, 1.5],
        ukraine: [32.0, 49.0],
        "united arab emirates": [54.0, 24.0],
        "united kingdom": [-2.0, 54.0],
        "united states": [-95.0, 38.0],
        usa: [-95.0, 38.0],
        uruguay: [-56.0, -33.0],
        uzbekistan: [64.0, 41.0],
        venezuela: [-66.0, 7.0],
        vietnam: [106.0, 16.0],
        "western sahara": [-12.0, 24.5],
        yemen: [48.0, 15.0],
        zambia: [28.5, -14.5],
        zimbabwe: [30.0, -19.0],
      };

      // Build a name -> value lookup from the data
      const valueMap = {};
      resolvedData.forEach((row) => {
        const name = String(getFieldVal(row, xField) || "").trim();
        const val = Number(getFieldVal(row, yFields[0])) || 0;
        if (name) valueMap[name.toLowerCase()] = val;
      });

      const values = Object.values(valueMap);
      const minVal = values.length ? Math.min(...values) : 0;
      const maxVal = values.length ? Math.max(...values) : 1;
      const range = maxVal - minVal || 1;

      // Linear colour interpolation between two hex colours
      const lerp = (a, b, t) => {
        const hex = (s) => parseInt(s, 16);
        const r1 = hex(a.slice(1, 3)),
          g1 = hex(a.slice(3, 5)),
          b1 = hex(a.slice(5, 7));
        const r2 = hex(b.slice(1, 3)),
          g2 = hex(b.slice(3, 5)),
          b2 = hex(b.slice(5, 7));
        const ri = Math.round(r1 + (r2 - r1) * t);
        const gi = Math.round(g1 + (g2 - g1) * t);
        const bi = Math.round(b1 + (b2 - b1) * t);
        return `rgb(${ri},${gi},${bi})`;
      };

      return (
        <div ref={containerRef} className="relative w-full h-full">
          {/* Colour scale legend */}
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-[8px] font-bold text-white/50 uppercase tracking-wider">
              Low
            </span>
            <div
              className="w-20 h-2 rounded-full"
              style={{
                background: `linear-gradient(to right, ${colorLow}, ${colorHigh})`,
              }}
            />
            <span className="text-[8px] font-bold text-white/50 uppercase tracking-wider">
              High
            </span>
          </div>

          {/* Floating tooltip */}
          {mapTooltip && (
            <div
              className="absolute z-20 px-3 py-2 rounded-lg pointer-events-none"
              style={{
                left: mapTooltip.x + 10,
                top: mapTooltip.y - 36,
                background: "rgba(10,10,20,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
                color: "#fff",
              }}
            >
              <p className="text-[9px] font-black text-text-quaternary uppercase tracking-widest mb-0.5">
                {mapTooltip.name}
              </p>
              <p
                className="text-[13px] font-black"
                style={{ color: colorHigh }}
              >
                {mapTooltip.val !== null
                  ? formatTooltipValue(mapTooltip.val)
                  : "No data"}
              </p>
            </div>
          )}

          <ComposableMap
            projection={projection}
            style={{ width: "100%", height: "100%" }}
            projectionConfig={{ scale: 147 }}
          >
            <ZoomableGroup>
              {showGraticule && (
                <Graticule stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
              )}
              <Sphere
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.5}
                fill="transparent"
              />
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const name = geo.properties.name || "";
                    const val = valueMap[name.toLowerCase()] ?? null;
                    const t = val !== null ? (val - minVal) / range : null;
                    const fill =
                      t !== null ? lerp(colorLow, colorHigh, t) : colorNone;

                    // If in bubble mode, countries are neutral
                    const finalFill = mapMode === "bubble" ? colorNone : fill;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={finalFill}
                        stroke={
                          mapMode === "bubble"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.2)"
                        }
                        strokeWidth={0.5}
                        style={{
                          default: {
                            outline: "none",
                            transition: "all 300ms ease",
                          },
                          hover: {
                            outline: "none",
                            fillOpacity: 0.8,
                            fill: colorHigh,
                          },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(e) => {
                          if (!containerRef.current) return;
                          const rect =
                            containerRef.current.getBoundingClientRect();
                          setMapTooltip({
                            name,
                            val,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          });
                        }}
                        onMouseMove={(e) => {
                          if (!containerRef.current) return;
                          const rect =
                            containerRef.current.getBoundingClientRect();
                          setMapTooltip((p) =>
                            p
                              ? {
                                  ...p,
                                  x: e.clientX - rect.left,
                                  y: e.clientY - rect.top,
                                }
                              : p,
                          );
                        }}
                        onMouseLeave={() => setMapTooltip(null)}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Markers for Bubble Map Mode */}
              {mapMode === "bubble" &&
                Object.entries(valueMap).map(([name, val]) => {
                  const coords = CENTROIDS[name.toLowerCase()];
                  if (!coords) return null;
                  const t = (val - minVal) / range;
                  const radius = 4 + t * 16;
                  const color = lerp(colorLow, colorHigh, t);
                  return (
                    <Marker key={name} coordinates={coords}>
                      <circle
                        r={radius}
                        fill={color}
                        fillOpacity={0.8}
                        stroke="#fff"
                        strokeWidth={1}
                        style={{
                          filter: `drop-shadow(0 0 6px ${color})`,
                          transition:
                            "all 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        }}
                        onMouseEnter={(e) => {
                          const rect =
                            containerRef.current.getBoundingClientRect();
                          setMapTooltip({
                            name: name.toUpperCase(),
                            val,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          });
                        }}
                        onMouseLeave={() => setMapTooltip(null)}
                      />
                    </Marker>
                  );
                })}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      );
    }

    // ── All Composed / Bar / Line / Area variants ──
    const isHorizontal = config.orientation === "horizontal";

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
          barCategoryGap="20%"
          barGap={2}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: config.axis_x_rotation
              ? Math.abs(config.axis_x_rotation) * 0.8 + 20
              : 5,
          }}
        >
          {(isStackedArea || isPercentArea) && gradientDefs}
          {(config.conditional_color || chartType === "bar") && (
            <ReferenceLine
              yAxisId={isHorizontal ? undefined : "left"}
              xAxisId={isHorizontal ? "left" : undefined}
              y={isHorizontal ? undefined : 0}
              x={isHorizontal ? 0 : undefined}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          )}
          {(config.show_grid !== false || config.show_grid_x) && (
            <CartesianGrid
              yAxisId="left"
              xAxisId={isHorizontal ? "left" : undefined}
              strokeDasharray="3 3"
              stroke="#ffffff"
              strokeOpacity={0.2}
              horizontal={config.show_grid !== false}
              vertical={!!config.show_grid_x}
            />
          )}
          {isHorizontal ? (
            <>
              <YAxis
                yAxisId="left"
                dataKey={xField}
                type="category"
                width={150}
                tick={{
                  fill: "var(--color-text-tertiary)",
                  fontSize: 15,
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
                xAxisId="left"
                type="number"
                domain={primaryAxis.domain}
                scale={primaryAxis.scale}
                label={
                  config.axis_y_label
                    ? {
                        value: config.axis_y_label,
                        position: "insideBottom",
                        offset: -10,
                        fill: "var(--color-text-tertiary)",
                        fontSize: 12,
                        fontWeight: "bold",
                      }
                    : undefined
                }
                tick={{
                  fill: "var(--color-text-tertiary)",
                  fontSize: 15,
                  fontWeight: "bold",
                }}
                tickFormatter={formatValue}
                axisLine={false}
                tickLine={false}
              />
              {!isAnyStacked && yFields.length > 1 && (
                <XAxis
                  xAxisId="right"
                  orientation="top"
                  type="number"
                  domain={secondaryAxis.domain}
                  scale={secondaryAxis.scale}
                  label={
                    config.axis_y_secondary_label
                      ? {
                          value: config.axis_y_secondary_label,
                          position: "insideTop",
                          offset: -10,
                          fill: "var(--color-text-tertiary)",
                          fontSize: 12,
                          fontWeight: "bold",
                        }
                      : undefined
                  }
                  tick={{
                    fill: "var(--color-text-tertiary)",
                    fontSize: 15,
                    fontWeight: "bold",
                  }}
                  tickFormatter={formatValue}
                  axisLine={false}
                  tickLine={false}
                />
              )}
            </>
          ) : (
            <>
              <XAxis
                dataKey={xField}
                type="category"
                tick={{
                  fill: "var(--color-text-tertiary)",
                  fontSize: 15,
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
                        fontSize: 12,
                        fontWeight: "bold",
                      }
                    : undefined
                }
                tickFormatter={
                  isPercentBar || isPercentArea ? (v) => `${v}%` : formatValue
                }
                tick={{
                  fill: "var(--color-text-tertiary)",
                  fontSize: 15,
                  fontWeight: "bold",
                }}
                axisLine={false}
                tickLine={false}
                width={100}
                tickMargin={15}
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
                          fontSize: 12,
                          fontWeight: "bold",
                        }
                      : undefined
                  }
                  tick={{
                    fill: "var(--color-text-tertiary)",
                    fontSize: 15,
                    fontWeight: "bold",
                  }}
                  tickFormatter={formatValue}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  tickMargin={12}
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
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
                      {name}
                    </span>
                    <span className="text-white text-[11px] font-black">
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
              height={30}
              stroke="var(--color-accent)"
              fill="var(--color-bg-muted)"
              travellerWidth={10}
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

          {yFields.map((f, i) => {
            const color =
              config.series_colors?.[f] ||
              palette[(i * (isAnyStacked ? 2 : 1)) % palette.length];
            let seriesType = chartType;
            if (chartType === "composed") {
              seriesType =
                config.series_types?.[f] || (i === 0 ? "bar" : "line");
            }
            const axisId = isAnyStacked
              ? "left"
              : config.y_axis_assign?.[f] || (i === 0 ? "left" : "right");
            const seriesXAxisId = isHorizontal ? axisId : undefined;
            const seriesYAxisId = isHorizontal ? "left" : axisId;

            if (
              seriesType === "bar" ||
              seriesType === "horizontal_bar" ||
              seriesType === "stacked_bar" ||
              seriesType === "stacked_percent_bar"
            ) {
              return (
                <Bar
                  xAxisId={seriesXAxisId}
                  yAxisId={seriesYAxisId}
                  key={f}
                  dataKey={f}
                  fill={color}
                  stroke={isAnyStacked ? "rgba(0,0,0,0.25)" : "none"}
                  strokeWidth={isAnyStacked ? 1 : 0}
                  stackId={
                    isAnyStacked && (isStackedBar || isPercentBar)
                      ? "stack"
                      : undefined
                  }
                  radius={(() => {
                    const r = config.bar_border_radius ?? 4;
                    if (isAnyStacked && i === yFields.length - 1)
                      return [r, r, 0, 0];
                    if (isAnyStacked) return [0, 0, 0, 0];
                    return [r, r, 0, 0];
                  })()}
                  maxBarSize={isHorizontal ? 40 : 60}
                  isAnimationActive={config.animation_enabled !== false}
                  layout={isHorizontal ? "vertical" : "horizontal"}
                >
                  {config.conditional_color
                    ? resolvedData.map((row, ri) => (
                        <Cell
                          key={ri}
                          fill={
                            (Number(row[f]) || 0) >= 0
                              ? config.conditional_positive || "#22c55e"
                              : config.conditional_negative || "#ef4444"
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
                        fontSize: 14,
                        fill:
                          config.label_color || "var(--color-text-tertiary)",
                        fontWeight: 700,
                      }}
                      formatter={formatValue}
                    />
                  )}
                </Bar>
              );
            }

            if (seriesType === "line") {
              const useArea =
                config.area_opacity != null && config.area_opacity > 0;
              const Comp = useArea ? Area : Line;
              return (
                <Comp
                  xAxisId={seriesXAxisId}
                  yAxisId={seriesYAxisId}
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
                  fill={useArea ? color : undefined}
                  fillOpacity={useArea ? config.area_opacity : undefined}
                  dot={
                    config.show_markers || config.custom_dots
                      ? {
                          r: config.custom_dots ? 6 : (config.marker_size ?? 4),
                          fill: color,
                          stroke: color,
                          strokeWidth: 0,
                        }
                      : { r: 0 }
                  }
                  activeDot={{ r: (config.marker_size ?? 4) + 2 }}
                  isAnimationActive={config.animation_enabled !== false}
                >
                  {config.show_data_labels && (
                    <LabelList
                      dataKey={f}
                      position="top"
                      style={{
                        fontSize: 14,
                        fill:
                          config.label_color || "var(--color-text-tertiary)",
                        fontWeight: 700,
                      }}
                      formatter={formatValue}
                    />
                  )}
                </Comp>
              );
            }

            if (
              seriesType === "area" ||
              seriesType === "stacked_area" ||
              seriesType === "percent_area"
            ) {
              const fillSrc =
                isStackedArea || isPercentArea ? `url(#grad_${f})` : color;
              return (
                <Area
                  xAxisId={seriesXAxisId}
                  yAxisId={seriesYAxisId}
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
                  activeDot={{ r: (config.marker_size ?? 4) + 2 }}
                  isAnimationActive={config.animation_enabled !== false}
                >
                  {config.show_data_labels && (
                    <LabelList
                      dataKey={f}
                      position="top"
                      style={{
                        fontSize: 14,
                        fill:
                          config.label_color || "var(--color-text-tertiary)",
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
              strokeWidth={2}
              strokeDasharray="5 5"
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
      className="flex flex-col h-full w-full p-2.5 group/preview"
      style={{ background: "var(--color-bg-raised)" }}
    >
      {/* ── HEADER ── */}
      <div className="relative flex items-center justify-between mb-2 z-20 shrink-0">
        <div
          className="flex-1 drag-handle cursor-move select-none min-w-0"
          title="Drag to move widget"
        >
          <h3 className="text-[14px] font-bold text-text-primary truncate pr-2">
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
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-quaternary hover:text-text-primary hover:bg-bg-muted transition-all"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
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
            config.chart_type !== "table" &&
            config.chart_type !== "pivot_table" && (
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
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="w-7 h-7 rounded-lg border border-border-default flex items-center justify-center text-text-quaternary hover:text-emerald hover:bg-emerald-muted transition-all"
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={onRemove}
                className="w-7 h-7 rounded-lg border border-border-default flex items-center justify-center text-text-quaternary hover:text-rose hover:bg-rose-muted transition-all"
              >
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
