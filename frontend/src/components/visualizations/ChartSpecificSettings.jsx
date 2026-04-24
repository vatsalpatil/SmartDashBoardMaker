import { useState } from "react";
import { COLOR_PALETTES } from "../../lib/chartPresets";
import { Check } from "lucide-react";


/* ── Tiny reusable primitives ── */
const Row = ({ children }) => (
  <div className="flex items-center gap-2 flex-wrap">{children}</div>
);
const SectionLabel = ({ children }) => (
  <p className="text-[8px] font-black text-text-quaternary uppercase tracking-[0.18em] mt-3 mb-1.5">
    {children}
  </p>
);
const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={[
      "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border transition-all cursor-pointer",
      active
        ? "bg-accent text-white border-accent"
        : "border-border-default text-text-tertiary hover:border-border-strong hover:text-text-secondary",
    ].join(" ")}
    style={active ? {} : { background: "var(--color-bg-raised)" }}
  >
    {children}
  </button>
);
const Slider = ({ label, value, min, max, step, onChange, suffix = "" }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-[8px] font-bold text-text-quaternary uppercase">
        {label}
      </span>
      <span className="text-[9px] font-black text-accent font-mono">
        {value}
        {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 rounded-lg cursor-pointer accent-indigo-500"
      style={{ background: "var(--color-bg-subtle)" }}
    />
  </div>
);
const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-[10px] font-semibold text-text-secondary">
      {label}
    </span>
    <button
      onClick={() => onChange(!value)}
      className={[
        "relative w-8 h-4 rounded-full transition-colors duration-200",
        value ? "bg-accent" : "bg-bg-subtle border border-border-default",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200",
          value ? "left-4.5" : "left-0.5",
        ].join(" ")}
      />
    </button>
  </div>
);
const ColorPicker = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-[10px] font-semibold text-text-secondary">
      {label}
    </span>
    <input
      type="color"
      value={value || "#ffffff"}
      onChange={(e) => onChange(e.target.value)}
      className="w-6 h-6 rounded-lg cursor-pointer border border-border-muted p-0 bg-transparent overflow-hidden"
    />
  </div>
);

const FieldSelect = ({ label, value, options, onChange }) => (
  <div>
    <p className="text-[8px] text-text-quaternary mb-1">{label}</p>
    <select
      className="w-full px-2 py-1.5 rounded-lg border border-border-muted text-[10px] text-text-primary outline-none focus:border-accent appearance-none"
      style={{ background: "var(--color-bg-muted)" }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select...</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

/* ── Section wrapper ── */
const Section = ({ title, children }) => (
  <div
    className="space-y-2 p-3 rounded-xl border border-border-muted"
    style={{ background: "var(--color-bg-raised)" }}
  >
    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.15em]">
      {title}
    </p>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   CHART-TYPE-SPECIFIC PANELS
───────────────────────────────────────────────────────────── */

function BarSettings({ config, update }) {
  const barRadius = config.bar_border_radius ?? 4;
  const condColor = config.conditional_color || false;
  const gradient = config.gradient_fill || false;
  const sortBy = config.sort_by || "default";
  const showLabels = config.show_data_labels || false;

  const orientation = config.orientation || "vertical";
  const stacking = config.stacking || "none";

  return (
    <>
      <Section title="Layout & Stacking">
        <SectionLabel>Orientation</SectionLabel>
        <Row>
          {[
            ["vertical", "Vertical"],
            ["horizontal", "Horizontal"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={orientation === k}
              onClick={() => update({ orientation: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
        <SectionLabel>Stacking</SectionLabel>
        <Row>
          {[
            ["none", "Grouped"],
            ["stacked", "Stacked"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={stacking === k}
              onClick={() => update({ stacking: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
      </Section>
      <Section title="Bar Style">
        <Slider
          label="Corner Radius"
          value={barRadius}
          min={0}
          max={20}
          step={1}
          suffix="px"
          onChange={(v) => update({ bar_border_radius: v })}
        />

        <Toggle
          label="Data Labels"
          value={showLabels}
          onChange={(v) => update({ show_data_labels: v })}
        />
        {showLabels && (
          <ColorPicker
            label="Label Color"
            value={config.label_color || "var(--color-text-tertiary)"}
            onChange={(v) => update({ label_color: v })}
          />
        )}
      </Section>
      <Section title="Sorting">
        <Row>
          {[
            ["default", "Default"],
            ["value_desc", "Value ↓"],
            ["value_asc", "Value ↑"],
            ["alpha", "A–Z"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={sortBy === k}
              onClick={() => update({ sort_by: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
      </Section>
      <Section title="Color Mode">
        <Toggle
          label="Diverging Colors (Pos/Neg)"
          value={condColor}
          onChange={(v) => update({ conditional_color: v })}
        />
        {condColor && (
          <Row>
            <label className="text-[9px] text-text-quaternary">Positive</label>
            <input
              type="color"
              value={config.conditional_positive || "#22c55e"}
              onChange={(e) => update({ conditional_positive: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-none"
            />
            <label className="text-[9px] text-text-quaternary">Negative</label>
            <input
              type="color"
              value={config.conditional_negative || "#ef4444"}
              onChange={(e) => update({ conditional_negative: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-none"
            />
          </Row>
        )}
      </Section>
    </>
  );
}

function LineSettings({ config, update }) {
  const curve = config.curve_type || "monotone";
  const lw = config.line_width ?? 2;
  const dash = config.stroke_dash || "";
  const markers = config.show_markers || false;
  const markerSize = config.marker_size ?? 4;
  const shade = config.area_opacity != null && config.area_opacity > 0;
  const opacity = config.area_opacity ?? 0;
  const connectNulls = config.connect_nulls || false;
  const showLabels = config.show_data_labels || false;
  return (
    <>
      <Section title="Line Style">
        <SectionLabel>Curve</SectionLabel>
        <Row>
          {[
            ["monotone", "Smooth"],
            ["linear", "Straight"],
            ["step", "Step"],
            ["natural", "Curvy"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={curve === k}
              onClick={() => update({ curve_type: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
        <Slider
          label="Line Width"
          value={lw}
          min={1}
          max={6}
          step={0.5}
          suffix="px"
          onChange={(v) => update({ line_width: v })}
        />
        <SectionLabel>Line Style</SectionLabel>
        <Row>
          {[
            ["", "Solid"],
            ["8 4", "Dashed"],
            ["2 4", "Dotted"],
            ["8 4 2 4", "Dash-Dot"],
          ].map(([k, l]) => (
            <Chip
              key={k || "solid"}
              active={dash === k}
              onClick={() => update({ stroke_dash: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
      </Section>
      <Section title="Data Points">
        <Toggle
          label="Show Markers"
          value={markers}
          onChange={(v) => update({ show_markers: v })}
        />
        <Slider
          label="Marker Size"
          value={markerSize}
          min={2}
          max={12}
          step={1}
          suffix="px"
          onChange={(v) => update({ marker_size: v })}
        />
        <Toggle
          label="Data Labels"
          value={showLabels}
          onChange={(v) => update({ show_data_labels: v })}
        />
        {showLabels && (
          <ColorPicker
            label="Label Color"
            value={config.label_color || "var(--color-text-tertiary)"}
            onChange={(v) => update({ label_color: v })}
          />
        )}
        <Toggle
          label="Connect Null Values"
          value={connectNulls}
          onChange={(v) => update({ connect_nulls: v })}
        />
      </Section>
      <Section title="Shaded Area">
        <Toggle
          label="Fill Area Below Line"
          value={shade}
          onChange={(v) => update({ area_opacity: v ? 0.25 : 0 })}
        />
        {shade && (
          <Slider
            label="Fill Opacity"
            value={opacity}
            min={0.05}
            max={1}
            step={0.05}
            suffix="%"
            onChange={(v) => update({ area_opacity: v })}
          />
        )}
      </Section>
    </>
  );
}

function AreaSettings({ config, update }) {
  const curve = config.curve_type || "monotone";
  const opacity = config.area_opacity ?? 0.3;
  const gradient = config.gradient_fill || false;
  const markers = config.show_markers || false;
  const stacking = config.stacking || "none";

  return (
    <>
      <Section title="Stacking">
        <Row>
          {[
            ["none", "Overlapping"],
            ["stacked", "Stacked"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={stacking === k}
              onClick={() => update({ stacking: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
      </Section>
      <Section title="Area Style">
        <SectionLabel>Curve</SectionLabel>
        <Row>
          {[
            ["monotone", "Smooth"],
            ["linear", "Straight"],
            ["step", "Step"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={curve === k}
              onClick={() => update({ curve_type: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
        <Slider
          label="Fill Opacity"
          value={opacity}
          min={0.05}
          max={1}
          step={0.05}
          onChange={(v) => update({ area_opacity: v })}
        />

        <Toggle
          label="Show Markers"
          value={markers}
          onChange={(v) => update({ show_markers: v })}
        />
        <Slider
          label="Marker Size"
          value={config.marker_size ?? 4}
          min={2}
          max={12}
          step={1}
          suffix="px"
          onChange={(v) => update({ marker_size: v })}
        />
      </Section>
    </>
  );
}

function PieSettings({ config, update }) {
  const innerR =
    config.pie_inner_radius ?? (config.chart_type === "donut" ? 60 : 0);
  const outerR = config.pie_outer_radius ?? 80;
  const showLabels = config.show_data_labels || false;
  const labelPos = config.label_position || "outside";
  const innerText = config.inner_text || false;
  const activeSector = config.active_sector || false;

  const isDonut = innerR > 0;

  return (
    <>
      <Section title="Shape">
        <Slider
          label="Inner Radius (Donut Hole)"
          value={innerR}
          min={0}
          max={85}
          step={5}
          suffix="%"
          onChange={(v) => update({ pie_inner_radius: v })}
        />
        <Slider
          label="Outer Radius"
          value={outerR}
          min={40}
          max={100}
          step={5}
          suffix="%"
          onChange={(v) => update({ pie_outer_radius: v })}
        />
      </Section>
      <Section title="Labels">
        <Toggle
          label="Show Labels"
          value={showLabels}
          onChange={(v) => update({ show_data_labels: v })}
        />
        {showLabels && (
          <>
            <Row>
              {[
                ["outside", "Outside"],
                ["inside", "Inside"],
              ].map(([k, l]) => (
                <Chip
                  key={k}
                  active={labelPos === k}
                  onClick={() => update({ label_position: k })}
                >
                  {l}
                </Chip>
              ))}
            </Row>
            <div className="mt-3">
              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-2 block">
                Content
              </span>
              <Row>
                {[
                  ["name", "Name"],
                  ["value", "Value"],
                  ["both", "Both"],
                ].map(([k, l]) => (
                  <Chip
                    key={k}
                    active={(config.label_type || "name") === k}
                    onClick={() => update({ label_type: k })}
                  >
                    {l}
                  </Chip>
                ))}
              </Row>
            </div>
            <div className="mt-3">
              <ColorPicker
                label="Label Color"
                value={config.label_color || "var(--color-text-tertiary)"}
                onChange={(v) => update({ label_color: v })}
              />
            </div>
          </>
        )}
        {isDonut && (
          <Toggle
            label="Show Total in Center"
            value={innerText}
            onChange={(v) => update({ inner_text: v })}
          />
        )}
      </Section>
      <Section title="Interaction">
        <Toggle
          label="Highlight Active Slice"
          value={activeSector}
          onChange={(v) => update({ active_sector: v })}
        />
      </Section>
    </>
  );
}


function KpiSettings({ config, update }) {
  const fmt = config.kpi_format || "auto";
  const prefix = config.kpi_prefix || "";
  const suffix2 = config.kpi_suffix || "";
  const showSpark = config.show_sparkline || false;
  return (
    <>
      <Section title="Number Format">
        <Row>
          {[
            ["auto", "Auto"],
            ["number", "Number"],
            ["currency", "Currency"],
            ["percent", "Percent"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={fmt === k}
              onClick={() => update({ kpi_format: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <p className="text-[8px] text-text-quaternary mb-1">Prefix</p>
            <input
              className="w-full px-2 py-1.5 rounded-lg border border-border-muted text-[11px] text-text-primary outline-none focus:border-accent"
              style={{ background: "var(--color-bg-muted)" }}
              value={prefix}
              onChange={(e) => update({ kpi_prefix: e.target.value })}
              placeholder="$"
            />
          </div>
          <div>
            <p className="text-[8px] text-text-quaternary mb-1">Suffix</p>
            <input
              className="w-full px-2 py-1.5 rounded-lg border border-border-muted text-[11px] text-text-primary outline-none focus:border-accent"
              style={{ background: "var(--color-bg-muted)" }}
              value={suffix2}
              onChange={(e) => update({ kpi_suffix: e.target.value })}
              placeholder="%"
            />
          </div>
        </div>
      </Section>
      <Section title="Sparkline">
        <Toggle
          label="Show Mini Sparkline"
          value={showSpark}
          onChange={(v) => update({ show_sparkline: v })}
        />
      </Section>
    </>
  );
}

function RadarSettings({ config, update }) {
  const filled = config.radar_filled !== false;
  const fillOp = config.fill_opacity ?? 0.3;
  const markers = config.show_markers || false;
  return (
    <Section title="Radar Style">
      <Toggle
        label="Fill Area"
        value={filled}
        onChange={(v) => update({ radar_filled: v })}
      />
      {filled && (
        <Slider
          label="Fill Opacity"
          value={fillOp}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => update({ fill_opacity: v })}
        />
      )}
      <Toggle
        label="Show Markers"
        value={markers}
        onChange={(v) => update({ show_markers: v })}
      />
      <Toggle
        label="Data Labels"
        value={config.show_data_labels || false}
        onChange={(v) => update({ show_data_labels: v })}
      />
      {(config.show_data_labels) && (
        <ColorPicker
          label="Label Color"
          value={config.label_color || "var(--color-text-tertiary)"}
          onChange={(v) => update({ label_color: v })}
        />
      )}
    </Section>
  );
}

function FunnelSettings({ config, update }) {
  const showLabels = config.show_data_labels !== false;
  const showPct = config.funnel_show_pct || false;
  return (
    <>
      <Section title="Funnel Style">
        <Toggle
          label="Show Value Labels"
          value={showLabels}
          onChange={(v) => update({ show_data_labels: v })}
        />
        <Toggle
          label="Show Conversion %"
          value={showPct}
          onChange={(v) => update({ funnel_show_pct: v })}
        />
      </Section>
      <Section title="Sorting">
        <Row>
          {[
            ["default", "Default"],
            ["value_desc", "Value ↓"],
            ["value_asc", "Value ↑"],
            ["alpha", "A–Z"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={(config.sort_by || "default") === k}
              onClick={() => update({ sort_by: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
      </Section>
    </>
  );
}

function TreemapSettings({ config, update }) {
  const showLabels = config.show_data_labels !== false;
  const tileOpacity = config.tile_opacity ?? 0.85;
  const labelMinSize = config.treemap_label_min ?? 40;
  return (
    <>
      <Section title="Tiles">
        <Slider
          label="Tile Opacity"
          value={tileOpacity}
          min={0.2}
          max={1}
          step={0.05}
          onChange={(v) => update({ tile_opacity: v })}
        />
        <Toggle
          label="Show Labels"
          value={showLabels}
          onChange={(v) => update({ show_data_labels: v })}
        />
        {showLabels && (
          <>
            <ColorPicker
              label="Label Color"
              value={config.label_color || "#ffffff"}
              onChange={(v) => update({ label_color: v })}
            />
            <Slider
              label="Min Cell Size for Label"
              value={labelMinSize}
              min={10}
              max={100}
              step={5}
              suffix="px"
              onChange={(v) => update({ treemap_label_min: v })}
            />
          </>
        )}
      </Section>
      <Section title="Sorting">
        <Row>
          {[
            ["default", "Default"],
            ["value_desc", "Largest First"],
            ["value_asc", "Smallest First"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={(config.sort_by || "default") === k}
              onClick={() => update({ sort_by: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
      </Section>
    </>
  );
}

function RadialBarSettings({ config, update }) {
  const showLabels = config.show_data_labels || false;
  const innerR = config.radial_inner_radius ?? 10;
  const outerR = config.radial_outer_radius ?? 80;
  const barSize = config.radial_bar_size ?? 10;
  return (
    <>
      <Section title="Radial Shape">
        <Slider
          label="Inner Radius"
          value={innerR}
          min={5}
          max={50}
          step={5}
          suffix="%"
          onChange={(v) => update({ radial_inner_radius: v })}
        />
        <Slider
          label="Outer Radius"
          value={outerR}
          min={40}
          max={95}
          step={5}
          suffix="%"
          onChange={(v) => update({ radial_outer_radius: v })}
        />
        <Slider
          label="Bar Thickness"
          value={barSize}
          min={4}
          max={30}
          step={2}
          suffix="px"
          onChange={(v) => update({ radial_bar_size: v })}
        />
      </Section>
      <Section title="Labels">
        <Toggle
          label="Show Data Labels"
          value={showLabels}
          onChange={(v) => update({ show_data_labels: v })}
        />
      </Section>
    </>
  );
}

function WorldMapSettings({ config, update }) {
  const colorLow = config.map_color_low || "#1e293b";
  const colorHigh = config.map_color_high || "#8b5cf6";
  const colorNone = config.map_color_none || "rgba(255,255,255,0.05)";
  const projection = config.map_projection || "geoNaturalEarth1";
  const mapMode = config.map_mode || "choropleth";
  const showLabels = config.show_data_labels || false;
  const showGraticule = config.map_show_graticule !== false;
  return (
    <>
      <Section title="Visualization Mode">
        <Row>
          {[
            ["choropleth", "Heatmap"],
            ["bubble", "Bubble Map"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={mapMode === k}
              onClick={() => update({ map_mode: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
      </Section>
      <Section title="Colour Scale">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Low Value", colorLow, "map_color_low"],
            ["High Value", colorHigh, "map_color_high"],
            ["No Data", colorNone, "map_color_none"],
          ].map(([l, val, key]) => (
            <div key={key}>
              <p className="text-[7px] text-text-quaternary mb-1">{l}</p>
              <input
                type="color"
                value={val}
                onChange={(e) => update({ [key]: e.target.value })}
                className="w-full h-7 rounded cursor-pointer border border-border-muted"
              />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Projection">
        <Row>
          {[
            ["geoNaturalEarth1", "Natural Earth"],
            ["geoMercator", "Mercator"],
            ["geoOrthographic", "Globe"],
            ["geoEquirectangular", "Equirect."],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={projection === k}
              onClick={() => update({ map_projection: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>
      </Section>
      <Section title="Overlays">
        <Toggle
          label="Show Graticule (Grid)"
          value={showGraticule}
          onChange={(v) => update({ map_show_graticule: v })}
        />
        <Toggle
          label="Show Country Labels"
          value={showLabels}
          onChange={(v) => update({ show_data_labels: v })}
        />
      </Section>
    </>
  );
}

/* ── Candlestick Settings ── */
function CandlestickSettings({ config, update, columns }) {
  const colNames = (columns || []).map(c => c.name);
  const yFields = config.y_fields || [];
  
  const openField = config.candle_open || yFields[0] || "";
  const highField = config.candle_high || yFields[1] || "";
  const lowField = config.candle_low || yFields[2] || "";
  const closeField = config.candle_close || yFields[3] || "";

  return (
    <>
      <Section title="Field Mapping">
        <div className="grid grid-cols-2 gap-2">
          <FieldSelect label="Open" value={openField} options={colNames} onChange={v => update({ candle_open: v })} />
          <FieldSelect label="High" value={highField} options={colNames} onChange={v => update({ candle_high: v })} />
          <FieldSelect label="Low" value={lowField} options={colNames} onChange={v => update({ candle_low: v })} />
          <FieldSelect label="Close" value={closeField} options={colNames} onChange={v => update({ candle_close: v })} />
        </div>
      </Section>
      <Section title="Candle Style">
        <div className="grid grid-cols-2 gap-2 mt-1">
          <ColorPicker label="Bullish (Up)" value={config.candle_up || "#22c55e"} onChange={v => update({ candle_up: v })} />
          <ColorPicker label="Bearish (Down)" value={config.candle_down || "#ef4444"} onChange={v => update({ candle_down: v })} />
        </div>
        <Slider
          label="Wick Width"
          value={config.candle_wick_width ?? 2}
          min={1}
          max={5}
          step={1}
          suffix="px"
          onChange={(v) => update({ candle_wick_width: v })}
        />
        <Slider
          label="Body Width"
          value={config.candle_body_width ?? 10}
          min={4}
          max={30}
          step={2}
          suffix="px"
          onChange={(v) => update({ candle_body_width: v })}
        />
      </Section>
    </>
  );
}

/* ── Universal Style & Axis Settings ── */
function StyleSettings({ config, update }) {
  const palette = config.color_palette || "default";
  const legendPos = config.legend_position || "bottom";
  const showGrid = config.show_grid !== false;
  const showGridX = config.show_grid_x || false;
  const animEnabled = config.animation_enabled !== false;

  // Only show per-series colour pickers for chart types that actually have series
  const NO_SERIES_TYPES = ["world_map", "treemap", "kpi", "funnel", "candlestick"];
  const NO_LEGEND_TYPES = ["world_map", "kpi", "funnel"];
  const NO_GRID_TYPES   = ["world_map", "kpi", "pie", "donut", "nested_donut", "rose", "radar", "radial_bar", "treemap", "funnel"];

  const showSeriesColors = !NO_SERIES_TYPES.includes(config.chart_type);
  const showLegend      = !NO_LEGEND_TYPES.includes(config.chart_type);
  const showGrid_       = !NO_GRID_TYPES.includes(config.chart_type);

  const yFields =
    config.y_fields?.length > 0
      ? config.y_fields
      : config.y_field
        ? [config.y_field]
        : [];

  return (
    <>
      <Section title="Color Palette">
        <div className="grid grid-cols-1 gap-1">
          {Object.entries(COLOR_PALETTES).map(([id, pal]) => (
            <button
              key={id}
              onClick={() => update({ color_palette: id })}
              className={[
                "flex items-center gap-2.5 px-2 py-1.5 rounded-lg border transition-all cursor-pointer",
                palette === id
                  ? "border-accent bg-accent/10"
                  : "border-transparent hover:bg-bg-subtle",
              ].join(" ")}
            >
              <div className="flex gap-0.5">
                {pal.colors.slice(0, 7).map((c, i) => (
                  <div
                    key={i}
                    style={{
                      background: c,
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>
              <span
                className={`text-[9px] font-bold flex-1 text-left ${palette === id ? "text-accent" : "text-text-tertiary"}`}
              >
                {pal.label}
              </span>
              {palette === id && (
                <Check size={10} className="text-accent shrink-0" />
              )}
            </button>
          ))}
        </div>
      </Section>
      {showSeriesColors && yFields.length > 0 && (
        <Section title="Series Colors">
          <div className="grid grid-cols-2 gap-2 mt-1">
            {yFields.map((f, i) => {
              const defaultColor =
                COLOR_PALETTES[palette]?.colors[
                  i % COLOR_PALETTES[palette].colors.length
                ];
              return (
                <div key={f}>
                  <p
                    className="text-[7px] text-text-quaternary mb-1 truncate"
                    title={f}
                  >
                    {f}
                  </p>
                  <input
                    type="color"
                    value={config.series_colors?.[f] || defaultColor}
                    onChange={(e) =>
                      update({
                        series_colors: {
                          ...config.series_colors,
                          [f]: e.target.value,
                        },
                      })
                    }
                    className="w-full h-7 rounded cursor-pointer border border-border-muted"
                  />
                </div>
              );
            })}
          </div>
        </Section>
      )}
      {showLegend && (
        <Section title="Legend">
          <Row>
            {[
              ["bottom", "↓ Bottom"],
              ["top", "↑ Top"],
              ["right", "→ Right"],
              ["hidden", "Hidden"],
            ].map(([k, l]) => (
              <Chip
                key={k}
                active={legendPos === k}
                onClick={() => update({ legend_position: k })}
              >
                {l}
              </Chip>
            ))}
          </Row>
        </Section>
      )}
      {showGrid_ && (
        <Section title="Grid & Animation">
          <Toggle
            label="Horizontal Grid Lines"
            value={showGrid}
            onChange={(v) => update({ show_grid: v })}
          />
          <Toggle
            label="Vertical Grid Lines"
            value={showGridX}
            onChange={(v) => update({ show_grid_x: v })}
          />
          <Toggle
            label="Animations"
            value={animEnabled}
            onChange={(v) => update({ animation_enabled: v })}
          />
        </Section>
      )}
      {!showGrid_ && (
        <Section title="Animation">
          <Toggle
            label="Animations"
            value={animEnabled}
            onChange={(v) => update({ animation_enabled: v })}
          />
        </Section>
      )}
    </>
  );
}

function AxesSettings({ config, update }) {
  const [activeY, setActiveY] = useState("primary");
  const yFields = config.y_fields || (config.y_field ? [config.y_field] : []);
  const isAnyStacked =
    [
      "stacked_bar",
      "stacked_area",
      "stacked_percent_bar",
      "percent_area",
    ].includes(config.chart_type) ||
    config.stacking === "stacked" ||
    config.stacking === "percent";
  const hasSecondary = !isAnyStacked && yFields.length > 1 && config.chart_type !== "candlestick";

  const xRot = config.axis_x_rotation ?? 0;
  const xLabel = config.axis_x_label || "";

  const prefix = activeY === "primary" ? "axis_y" : "axis_y_secondary";

  const yMode = config[`${prefix}_mode`] || "smart";

  const yLabel = config[`${prefix}_label`] || "";
  const yMin = config[`${prefix}_min`];
  const yMax = config[`${prefix}_max`];

  const NO_AXES = [
    "pie",
    "donut",
    "rose",
    "nested_donut",
    "kpi",
    "treemap",
    "funnel",
    "radar",
    "radial_bar",
    "world_map",
    "waterfall",
  ];
  if (NO_AXES.includes(config.chart_type)) return null;

  return (
    <>
      <Section title={hasSecondary ? "Y-Axis Settings" : "Y-Axis"}>
        {hasSecondary && (
          <div className="flex gap-1 mb-4 p-1 rounded-lg bg-bg-muted border border-border-muted">
            <button
              onClick={() => setActiveY("primary")}
              className={`flex-1 py-1 rounded text-[9px] font-bold uppercase transition-all ${activeY === "primary" ? "bg-accent text-white shadow-sm" : "text-text-quaternary hover:text-text-secondary"}`}
            >
              Primary ({config.orientation === "horizontal" ? "Bottom" : "Left"})
            </button>
            <button
              onClick={() => setActiveY("secondary")}
              className={`flex-1 py-1 rounded text-[9px] font-bold uppercase transition-all ${activeY === "secondary" ? "bg-accent text-white shadow-sm" : "text-text-quaternary hover:text-text-secondary"}`}
            >
              Secondary ({config.orientation === "horizontal" ? "Top" : "Right"})
            </button>
          </div>
        )}

        <SectionLabel>Scale Mode</SectionLabel>
        <Row>
          {[
            ["smart", "Auto"],
            ["zero", "From 0"],
            ["manual", "Manual"],
          ].map(([k, l]) => (
            <Chip
              key={k}
              active={yMode === k}
              onClick={() => update({ [`${prefix}_mode`]: k })}
            >
              {l}
            </Chip>
          ))}
        </Row>

        {yMode === "manual" && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-[8px] text-text-quaternary mb-1">Min</p>
              <input
                type="number"
                className="w-full px-2 py-1.5 rounded-lg border border-border-muted text-[11px] text-text-primary outline-none focus:border-accent"
                style={{ background: "var(--color-bg-muted)" }}
                value={yMin ?? ""}
                onChange={(e) =>
                  update({
                    [`${prefix}_min`]:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Auto"
              />
            </div>
            <div>
              <p className="text-[8px] text-text-quaternary mb-1">Max</p>
              <input
                type="number"
                className="w-full px-2 py-1.5 rounded-lg border border-border-muted text-[11px] text-text-primary outline-none focus:border-accent"
                style={{ background: "var(--color-bg-muted)" }}
                value={yMax ?? ""}
                onChange={(e) =>
                  update({
                    [`${prefix}_max`]:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Auto"
              />
            </div>
          </div>
        )}


        <div className="mt-2">
          <p className="text-[8px] text-text-quaternary mb-1">
            {activeY === "primary" ? "Primary" : "Secondary"} {config.orientation === "horizontal" ? "Value (X)" : "Value (Y)"} Axis Label
          </p>
          <input
            className="w-full px-2 py-1.5 rounded-lg border border-border-muted text-[11px] text-text-primary outline-none focus:border-accent"
            style={{ background: "var(--color-bg-muted)" }}
            value={yLabel}
            onChange={(e) => update({ [`${prefix}_label`]: e.target.value })}
            placeholder="Auto"
          />
        </div>
      </Section>

      <Section title="X-Axis">
        <SectionLabel>
          Label Angle: <span className="text-accent">{xRot}°</span>
        </SectionLabel>
        <div className="flex items-center gap-3 px-1 mt-1">
          <input
            type="range"
            min="-90"
            max="90"
            step="1"
            className="flex-1 accent-accent h-1.5 bg-bg-muted rounded-lg appearance-none cursor-pointer"
            value={xRot}
            onChange={(e) =>
              update({ axis_x_rotation: Number(e.target.value) })
            }
          />
          <button
            onClick={() => update({ axis_x_rotation: 0 })}
            className="px-2 py-1 rounded bg-bg-muted border border-border-muted text-[8px] font-bold text-text-tertiary hover:text-text-primary transition-colors"
          >
            RESET
          </button>
        </div>
      </Section>
    </>
  );
}

function InteractionsSettings({ config, update }) {
  const brush = config.brush_enabled || false;
  const crosshair = config.crosshair_enabled || false;
  const trendLine = config.show_trend_line || false;

  // Charts with a category X-axis that support brush/crosshair/trend
  const TREND_CAPABLE = ["bar", "line", "area", "composed", "candlestick"];
  const BRUSH_CAPABLE = ["bar", "line", "area", "composed", "candlestick"];
  const NO_INTERACTIONS = [
    "pie", "donut", "rose", "nested_donut", "kpi",
    "treemap", "radar", "radial_bar", "funnel", "world_map",
    "table", "pivot_table",
  ];
  const ct = config.chart_type;
  if (NO_INTERACTIONS.includes(ct)) return null;

  const showBrush    = BRUSH_CAPABLE.includes(ct);
  const showTrend    = TREND_CAPABLE.includes(ct);
  const showCross    = true; // all remaining cartesian types

  return (
    <Section title="Chart Controls">
      {showCross && (
        <Toggle
          label="Crosshair"
          value={crosshair}
          onChange={(v) => update({ crosshair_enabled: v })}
        />
      )}
      {showBrush && (
        <Toggle
          label="Range Brush (Zoom)"
          value={brush}
          onChange={(v) => update({ brush_enabled: v })}
        />
      )}
      {showTrend && (
        <Toggle
          label="Trend Line"
          value={trendLine}
          onChange={(v) => update({ show_trend_line: v })}
        />
      )}
    </Section>
  );
}

/* ── MAIN DISPATCHER ── */
const SETTINGS_MAP = {
  // Cartesian
  bar: BarSettings,
  horizontal_bar: BarSettings,
  stacked_bar: BarSettings,
  stacked_percent_bar: BarSettings,
  composed: BarSettings,
  line: LineSettings,
  area: AreaSettings,
  stacked_area: AreaSettings,
  percent_area: AreaSettings,
  candlestick: CandlestickSettings,
  // Circular
  pie: PieSettings,
  donut: PieSettings,
  rose: PieSettings,
  nested_donut: PieSettings,
  radar: RadarSettings,
  radial_bar: RadialBarSettings,
  // Advanced
  funnel: FunnelSettings,
  treemap: TreemapSettings,
  // Geo
  world_map: WorldMapSettings,
  // Data views
  kpi: KpiSettings,
  table: null,
  pivot_table: null,
};

export default function ChartSpecificSettings({ config, onConfigChange, columns }) {
  const update = (patch) => onConfigChange({ ...config, ...patch });
  const chartType = config?.chart_type || "bar";
  const SpecificPanel = SETTINGS_MAP[chartType] || BarSettings;

  const NO_AXES = [
    "pie", "donut", "rose", "nested_donut",
    "kpi", "treemap", "funnel",
    "radar", "radial_bar",
    "world_map",
    "table", "pivot_table",
  ];
  const hasAxes = !NO_AXES.includes(chartType);

  // table and pivot_table have no chart-specific settings at all
  if (chartType === "table" || chartType === "pivot_table") {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-4">
          <StyleSettings config={config} update={update} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-4">
        {SpecificPanel && <SpecificPanel config={config} update={update} />}
        <StyleSettings config={config} update={update} />
        {hasAxes && <AxesSettings config={config} update={update} />}
        <InteractionsSettings config={config} update={update} />
      </div>
    </div>
  );
}
