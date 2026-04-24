import { useState } from "react";
import {
  BarChart3,
  Database,
  X,
  Check,
  Plus,
  ChevronDown,
  Loader2,
  Hash,
  Calendar,
  Type,
  ArrowUpDown,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu";
import { CHART_CATALOG, PRESET_MAP } from "../../lib/chartPresets";

// Chart-type-specific field well definitions
const FIELD_SCHEMA = {
  bar: {
    x: { label: "X-Axis (Category)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Y-Axis (Values)", multi: true, types: ["dimension", "metric"] },
  },
  horizontal_bar: {
    x: { label: "Category (Y-Axis)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Values (X-Axis)", multi: true, types: ["dimension", "metric"] },
  },
  stacked_bar: {
    x: { label: "X-Axis (Category)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Segments (Values)", multi: true, types: ["dimension", "metric"] },
  },
  stacked_percent_bar: {
    x: { label: "X-Axis (Category)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Segments (Values)", multi: true, types: ["dimension", "metric"] },
  },
  composed: {
    x: { label: "X-Axis", multi: true, types: ["dimension", "metric"] },
    y: { label: "Metrics (Bar + Line)", multi: true, types: ["dimension", "metric"] },
  },
  line: {
    x: { label: "X-Axis (Time or Category)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Y-Axis (Values)", multi: true, types: ["dimension", "metric"] },
  },
  area: {
    x: { label: "X-Axis (Time or Category)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Area Values", multi: true, types: ["dimension", "metric"] },
  },
  stacked_area: {
    x: { label: "X-Axis", multi: true, types: ["dimension", "metric"] },
    y: { label: "Stacked Series", multi: true, types: ["dimension", "metric"] },
  },
  percent_area: {
    x: { label: "X-Axis", multi: true, types: ["dimension", "metric"] },
    y: { label: "100% Series", multi: true, types: ["dimension", "metric"] },
  },
  pie: {
    x: { label: "Category (Slice)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Value (Slice Size)", multi: true, types: ["dimension", "metric"] },
  },
  donut: {
    x: { label: "Category (Slice)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Value (Slice Size)", multi: true, types: ["dimension", "metric"] },
  },
  nested_donut: {
    x: { label: "Category (Slice)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Ring Values", multi: true, types: ["dimension", "metric"] },
  },
  scatter: {
    x: { label: "X-Axis (Numeric)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Y-Axis (Numeric)", multi: true, types: ["dimension", "metric"] },
  },
  bubble: {
    x: { label: "X-Axis (Numeric)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Y-Axis (Numeric)", multi: true, types: ["dimension", "metric"] },
    size: { label: "Bubble Size (Numeric)", optional: true, types: ["metric"] },
  },
  radar: {
    x: { label: "Axis Labels (Category)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Radar Values", multi: true, types: ["dimension", "metric"] },
  },
  radial_bar: {
    x: { label: "Category", multi: true, types: ["dimension", "metric"] },
    y: { label: "Bar Values", multi: true, types: ["dimension", "metric"] },
  },
  waterfall: {
    x: { label: "Stage / Category", multi: true, types: ["dimension", "metric"] },
    y: { label: "Change Value", multi: true, types: ["dimension", "metric"] },
  },
  funnel: {
    x: { label: "Stage (Category)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Value per Stage", multi: true, types: ["dimension", "metric"] },
  },
  histogram: {
    y: { label: "Numeric Field to Distribute", multi: true, types: ["metric"] },
  },
  treemap: {
    x: { label: "Category (Hierarchy)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Size Value", multi: true, types: ["dimension", "metric"] },
  },
  kpi: { y: { label: "KPI Value", multi: true, types: ["dimension", "metric"] } },
  table: {
    x: { label: "Dimensions (Columns)", multi: true, types: ["dimension", "metric"] },
    y: { label: "Metrics (Columns)", multi: true, types: ["dimension", "metric"] },
  },
  pivot_table: {
    x: { label: "Rows + Columns", multi: true, types: ["dimension", "metric"] },
    y: { label: "Cell Value", multi: true, types: ["dimension", "metric"] },
  },
};

const getSchema = (chartType) => FIELD_SCHEMA[chartType] || FIELD_SCHEMA["bar"];

const getColumnType = (col) => {
  const dt = (col.type || col.dtype || "").toLowerCase();
  if (dt.includes("date") || dt.includes("time") || dt.includes("timestamp"))
    return "date";
  if (
    dt.includes("int") ||
    dt.includes("float") ||
    dt.includes("double") ||
    dt.includes("decimal") ||
    dt.includes("num")
  )
    return "metric";
  return "dimension";
};

const ColTypeIcon = ({ col }) => {
  const type = getColumnType(col);
  if (type === "date")
    return <Calendar size={10} className="text-amber shrink-0" />;
  if (type === "metric")
    return <Hash size={10} className="text-rose shrink-0" />;
  return <Type size={10} className="text-emerald shrink-0" />;
};

const WELL_COLORS = {
  x: {
    accent: "emerald",
    border: "border-emerald/30",
    bg: "bg-emerald/5",
    text: "text-emerald",
    dot: "bg-emerald",
  },
  y: {
    accent: "rose",
    border: "border-rose/30",
    bg: "bg-rose/5",
    text: "text-rose",
    dot: "bg-rose",
  },
  colorBy: {
    accent: "amber",
    border: "border-amber/30",
    bg: "bg-amber/5",
    text: "text-amber",
    dot: "bg-amber",
  },
  size: {
    accent: "accent",
    border: "border-accent/30",
    bg: "bg-accent/5",
    text: "text-accent",
    dot: "bg-accent",
  },
};

export default function FieldWells({
  columns,
  config,
  onConfigChange,
  uniqueValues,
  onValueFetch,
}) {
  const update = (patch) => onConfigChange({ ...config, ...patch });
  const chartType = config?.chart_type || "bar";
  const schema = getSchema(chartType);
  const safeColumns = (columns || []).map((c) =>
    typeof c === "string" ? { name: c, type: "string" } : c,
  );

  const dimCols = safeColumns.filter((c) => getColumnType(c) !== "metric");
  const metricCols = safeColumns.filter((c) => getColumnType(c) === "metric");

  const xFields = config?.x_fields || (config?.x_field ? [config.x_field] : []);
  const yFields = config?.y_fields || (config?.y_field ? [config.y_field] : []);

  const addX = (name) => {
    if (schema.x?.multi) {
      const next = xFields.includes(name) ? xFields : [...xFields, name];
      update({ x_fields: next, x_field: next[0] || "" });
    } else {
      update({ x_fields: [name], x_field: name });
    }
  };

  const removeX = (name) => {
    const next = xFields.filter((f) => f !== name);
    update({ x_fields: next, x_field: next[0] || "" });
  };

  const addY = (name) => {
    if (!yFields.includes(name)) {
      const next = schema.y?.multi ? [...yFields, name] : [name];
      const aggs = { ...(config.field_aggregations || {}), [name]: "sum" };
      update({
        y_fields: next,
        y_field: next[0] || "",
        field_aggregations: aggs,
      });
    }
  };

  const removeY = (name) => {
    const next = yFields.filter((f) => f !== name);
    const remAggs = { ...(config.field_aggregations || {}) };
    delete remAggs[name];
    const remAssign = { ...(config.y_axis_assign || {}) };
    delete remAssign[name];
    update({
      y_fields: next,
      y_field: next[0] || "",
      field_aggregations: remAggs,
      y_axis_assign: remAssign,
    });
  };

  const toggleAgg = (field, agg) => {
    update({
      field_aggregations: {
        ...(config.field_aggregations || {}),
        [field]: agg,
      },
    });
  };

  const toggleAxis = (field, axis) => {
    update({
      y_axis_assign: { ...(config.y_axis_assign || {}), [field]: axis },
    });
  };

  const getFilteredColumns = (types) => {
    if (!types) return columns;
    const hasDim = types.includes("dimension");
    const hasMet = types.includes("metric");
    if (hasDim && hasMet) return safeColumns;
    if (hasDim) return dimCols;
    if (hasMet) return metricCols;
    return safeColumns;
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[9px] font-black text-text-quaternary uppercase tracking-[0.15em]">
          <BarChart3 size={10} className="text-accent" /> Widget Title
        </label>
        <input
          className="w-full px-3 py-2 rounded-xl border border-border-muted text-[12px] font-semibold text-text-primary placeholder-text-quaternary outline-none focus:border-accent transition-colors"
          style={{ background: "var(--color-bg-muted)" }}
          placeholder="Chart title…"
          value={config.title || ""}
          onChange={(e) => update({ title: e.target.value })}
        />
      </div>

      {/* X Field Well */}
      {schema.x && (
        <FieldWell
          wellKey="x"
          label={schema.x.label}
          required={!schema.x.optional}
          multi={schema.x.multi}
          fields={xFields}
          columns={getFilteredColumns(schema.x.types)}
          onAdd={addX}
          onRemove={removeX}
          config={config}
          schema={schema.x}
        />
      )}

      {/* Y Field Well */}
      {schema.y && (
        <div>
          <FieldWell
            wellKey="y"
            label={schema.y.label}
            required={!schema.y.optional}
            multi={schema.y.multi}
            fields={yFields}
            columns={getFilteredColumns(schema.y.types)}
            onAdd={addY}
            onRemove={removeY}
            config={config}
            schema={schema.y}
            hideTags={true}
          />

          {/* Per-metric controls */}
          {yFields.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {yFields.map((f, i) => {
                const agg = (config.field_aggregations || {})[f] || "sum";
                const axis =
                  (config.y_axis_assign || {})[f] ||
                  (i === 0 ? "left" : "right");
                const isDual = yFields.length > 1;
                return (
                  <div
                    key={f}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border-muted"
                    style={{ background: "var(--color-bg-raised)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-rose shrink-0" />
                    <span className="flex-1 text-[10px] font-bold text-text-primary uppercase tracking-wide truncate">
                      {f}
                    </span>

                    {/* Series Type for Composed */}
                    {chartType === "composed" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 px-2 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/5 text-[9px] font-black text-indigo-400 uppercase outline-none cursor-pointer hover:bg-indigo-500/10 transition-all">
                            {config.series_types?.[f] || (i === 0 ? "bar" : "line")} <ChevronDown size={8} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Chart Type</DropdownMenuLabel>
                          {["bar", "line", "area"].map(
                            (t) => (
                              <DropdownMenuItem
                                key={t}
                                onClick={() => update({ series_types: { ...(config.series_types || {}), [f]: t } })}
                                className="uppercase text-[11px]"
                              >
                                {t}
                              </DropdownMenuItem>
                            ),
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Aggregation */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald/30 bg-emerald/5 text-[9px] font-black text-emerald uppercase outline-none cursor-pointer hover:bg-emerald/10 transition-all">
                          {agg} <ChevronDown size={8} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aggregation</DropdownMenuLabel>
                        {["sum", "avg", "count", "min", "max", "none"].map(
                          (a) => (
                            <DropdownMenuItem
                              key={a}
                              onClick={() => toggleAgg(f, a)}
                              className="uppercase text-[11px]"
                            >
                              {a === "none" ? "Direct / No Agg" : a}
                            </DropdownMenuItem>
                          ),
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Axis assignment (only if multiple metrics) */}
                    {isDual && (
                      <div
                        className="flex border border-border-muted rounded-lg p-0.5 gap-0.5"
                        style={{ background: "var(--color-bg-overlay)" }}
                      >
                        {["left", "right"].map((a) => (
                          <button
                            key={a}
                            onClick={() => toggleAxis(f, a)}
                            className={[
                              "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all",
                              axis === a
                                ? a === "left"
                                  ? "bg-rose text-white"
                                  : "bg-amber text-bg-base"
                                : "text-text-quaternary hover:text-text-secondary",
                            ].join(" ")}
                          >
                            {a === "left" ? "←L" : "R→"}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => removeY(f)}
                      className="text-text-quaternary hover:text-rose transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bubble size field */}
      {schema.size && (
        <FieldWell
          wellKey="size"
          label={schema.size.label}
          required={false}
          multi={false}
          fields={config.size_field ? [config.size_field] : []}
          columns={metricCols}
          onAdd={(name) => update({ size_field: name })}
          onRemove={() => update({ size_field: "" })}
          config={config}
          schema={schema.size}
        />
      )}

      {/* Filters strip */}
      {xFields.length > 0 && (
        <FilterStrip
          config={config}
          onConfigChange={onConfigChange}
          uniqueValues={uniqueValues}
          onValueFetch={onValueFetch}
        />
      )}

      {/* Row limit */}
      <div className="space-y-1.5 pt-3 border-t border-border-muted">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-text-quaternary uppercase tracking-[0.12em]">
            Row Limit
          </span>
          <span className="text-[10px] font-black text-amber font-mono">
            {(config.limit || 5000) >= 5000 ? "MAX" : config.limit}
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={5000}
          step={10}
          value={config.limit || 5000}
          onChange={(e) => update({ limit: Number(e.target.value) })}
          className="w-full h-1 rounded-lg cursor-pointer accent-amber"
          style={{ background: "var(--color-bg-subtle)" }}
        />
      </div>
    </div>
  );
}

function FieldWell({
  wellKey,
  label,
  required,
  multi,
  fields,
  columns,
  onAdd,
  onRemove,
  config,
  hideTags = false,
}) {
  const colors = WELL_COLORS[wellKey] || WELL_COLORS.x;
  const isEmpty = fields.length === 0;
  const canAdd = multi ? true : fields.length === 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${colors.text}`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {label}
        </label>
        {required && isEmpty && (
          <span className="flex items-center gap-1 text-[8px] font-bold text-rose/70">
            <AlertCircle size={8} /> Required
          </span>
        )}
        {!required && (
          <span className="text-[8px] font-bold text-text-quaternary italic">
            Optional
          </span>
        )}
      </div>

      {/* Filled fields */}
      {!hideTags &&
        fields.map((f) => (
          <div
            key={f}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colors.border} ${colors.bg} group`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} />
            <span className="flex-1 text-[11px] font-bold text-text-primary truncate uppercase tracking-wide">
              {f}
            </span>
            <button
              onClick={() => onRemove(f)}
              className="text-text-quaternary hover:text-rose transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}

      {/* Add field dropdown */}
      {canAdd && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed transition-all cursor-pointer ${
                isEmpty
                  ? `border-${colors.accent}/40 hover:border-${colors.accent}/60`
                  : "border-border-muted hover:border-border-strong"
              }`}
              style={{ background: "transparent" }}
            >
              <Plus
                size={11}
                className={isEmpty ? colors.text : "text-text-quaternary"}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wide ${isEmpty ? colors.text : "text-text-quaternary hover:text-text-tertiary"}`}
              >
                {isEmpty ? `Add ${label.split("(")[0].trim()}` : "+ Add More"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 max-h-72 overflow-y-auto custom-scrollbar-mini"
          >
            <DropdownMenuLabel>Select Column</DropdownMenuLabel>
            {columns.length === 0 ? (
              <DropdownMenuItem
                disabled
                className="text-text-quaternary italic text-[11px]"
              >
                No matching columns
              </DropdownMenuItem>
            ) : (
              columns.map((col) => {
                const isUsed = fields.includes(col.name);
                return (
                  <DropdownMenuItem
                    key={col.name}
                    onClick={() => !isUsed && onAdd(col.name)}
                    className={isUsed ? "opacity-50" : ""}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <ColTypeIcon col={col} />
                      <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide">
                        {col.name}
                      </span>
                      {isUsed && (
                        <Check size={10} className="text-emerald shrink-0" />
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function FilterStrip({ config, onConfigChange, uniqueValues, onValueFetch }) {
  const update = (patch) => onConfigChange({ ...config, ...patch });
  const xField = config.x_field || config.x_fields?.[0];

  if (!xField) return null;

  const vals = uniqueValues?.[xField];
  const activeFilters = config.x_axis_filters || [];

  if (!vals && onValueFetch) {
    onValueFetch(xField);
  }

  return (
    <div className="space-y-2 pt-3 border-t border-border-muted">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[9px] font-black text-text-quaternary uppercase tracking-[0.12em]">
          <ArrowUpDown size={10} className="text-accent" /> Filter:{" "}
          <span className="text-accent italic lowercase ml-1">{xField}</span>
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => update({ x_axis_filters: vals || [] })}
            className="text-[8px] font-bold text-emerald hover:text-emerald/80 uppercase transition-colors"
          >
            All
          </button>
          <button
            onClick={() => update({ x_axis_filters: [] })}
            className="text-[8px] font-bold text-rose hover:text-rose/80 uppercase transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div
        className="border border-border-muted rounded-xl p-2.5"
        style={{ background: "var(--color-bg-muted)" }}
      >
        {!vals ? (
          <div className="flex items-center gap-2 py-1 text-text-quaternary">
            <Loader2 size={10} className="animate-spin" />
            <span className="text-[9px] font-bold uppercase">
              Loading values…
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar-mini">
            {vals.map((val) => {
              const active = activeFilters.includes(String(val));
              return (
                <button
                  key={val}
                  onClick={() => {
                    const sv = String(val);
                    const next = active
                      ? activeFilters.filter((v) => v !== sv)
                      : [...activeFilters, sv];
                    update({ x_axis_filters: next });
                  }}
                  className={[
                    "px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wide transition-all border",
                    active
                      ? "bg-accent text-white border-accent"
                      : "border-border-default text-text-quaternary hover:text-text-primary hover:border-border-strong",
                  ].join(" ")}
                  style={active ? {} : { background: "var(--color-bg-raised)" }}
                >
                  {String(val)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
