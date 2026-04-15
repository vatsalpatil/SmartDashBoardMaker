/**
 * Chart Presets Catalog
 * Each category contains multiple preset variations with display config overrides.
 * These are merged into the base config to produce different chart behaviors.
 */

export const CHART_CATALOG = [
  {
    id: 'line',
    label: 'Line Charts',
    icon: 'LineChart',
    presets: [
      { id: 'basic_line',    label: 'Basic Line',     desc: 'Simple line chart',                   overrides: { chart_type: 'line' } },
      { id: 'spline',        label: 'Spline',         desc: 'Smooth curved line',                  overrides: { chart_type: 'line', curve_type: 'monotone' } },
      { id: 'line_markers',  label: 'With Markers',   desc: 'Line with data point markers',        overrides: { chart_type: 'line', show_markers: true, marker_size: 5 } },
      { id: 'line_labels',   label: 'Data Labels',    desc: 'Show values on each point',           overrides: { chart_type: 'line', show_data_labels: true } },
      { id: 'step_line',     label: 'Step Line',      desc: 'Stepped / staircase style',           overrides: { chart_type: 'line', curve_type: 'step' } },
      { id: 'line_dashed',   label: 'Dashed Line',    desc: 'Dashed line style',                   overrides: { chart_type: 'line', stroke_dash: '8 4' } },
      { id: 'line_dots',     label: 'Dotted Line',    desc: 'Dotted line style',                   overrides: { chart_type: 'line', stroke_dash: '2 4' } },
    ]
  },
  {
    id: 'area',
    label: 'Area Charts',
    icon: 'TrendingUp',
    presets: [
      { id: 'basic_area',    label: 'Basic Area',     desc: 'Filled area under line',              overrides: { chart_type: 'area' } },
      { id: 'spline_area',   label: 'Spline Area',    desc: 'Smooth curved area',                  overrides: { chart_type: 'area', curve_type: 'monotone' } },
      { id: 'stacked_area',  label: 'Stacked Area',   desc: 'Stacked areas for composition',       overrides: { chart_type: 'stacked_area' } },
      { id: 'percent_area',  label: 'Percentage Area', desc: '100% stacked composition',           overrides: { chart_type: 'percent_area' } },
      { id: 'gradient_area', label: 'Gradient Area',  desc: 'Area with gradient fill',             overrides: { chart_type: 'area', gradient_fill: true } },
      { id: 'area_markers',  label: 'Area + Markers', desc: 'Area with data point markers',        overrides: { chart_type: 'area', show_markers: true } },
    ]
  },
  {
    id: 'bar',
    label: 'Bar / Column',
    icon: 'BarChart3',
    presets: [
      { id: 'basic_column',   label: 'Column',           desc: 'Vertical bar chart',                overrides: { chart_type: 'bar' } },
      { id: 'horizontal_bar', label: 'Horizontal Bar',    desc: 'Horizontal bar chart',              overrides: { chart_type: 'horizontal_bar' } },
      { id: 'grouped_bar',    label: 'Grouped',           desc: 'Side-by-side bars',                 overrides: { chart_type: 'grouped_bar' } },
      { id: 'stacked_bar',    label: 'Stacked',           desc: 'Stacked vertical bars',             overrides: { chart_type: 'stacked_bar' } },
      { id: 'stacked_pct',    label: 'Stacked %',         desc: '100% stacked bars',                 overrides: { chart_type: 'stacked_percent_bar' } },
      { id: 'waterfall',      label: 'Waterfall',         desc: 'Running total waterfall',           overrides: { chart_type: 'waterfall' } },
      { id: 'bar_rounded',    label: 'Rounded Bars',      desc: 'Bars with rounded corners',         overrides: { chart_type: 'bar', bar_border_radius: 8 } },
      { id: 'bar_labels',     label: 'With Labels',       desc: 'Bars with value labels',            overrides: { chart_type: 'bar', show_data_labels: true } },
      { id: 'bar_negative',   label: 'Pos/Neg Bars',      desc: 'Conditional positive/negative color', overrides: { chart_type: 'bar', conditional_color: true } },
    ]
  },
  {
    id: 'pie',
    label: 'Pie / Donut',
    icon: 'PieChart',
    presets: [
      { id: 'basic_pie',     label: 'Pie',             desc: 'Standard pie chart',                  overrides: { chart_type: 'pie' } },
      { id: 'donut',         label: 'Donut',           desc: 'Ring-style pie chart',                 overrides: { chart_type: 'donut' } },
      { id: 'semi_donut',    label: 'Semi-Circle',     desc: 'Half-circle donut',                   overrides: { chart_type: 'semi_donut' } },
      { id: 'pie_labels',    label: 'Labeled Pie',     desc: 'Pie with value + percent labels',     overrides: { chart_type: 'pie', show_data_labels: true, data_label_format: 'name_percent' } },
      { id: 'nested_donut',  label: 'Nested Donut',    desc: 'Concentric donut rings',              overrides: { chart_type: 'nested_donut' } },
      { id: 'rose',          label: 'Nightingale Rose', desc: 'Variable-radius sectors',            overrides: { chart_type: 'rose' } },
    ]
  },
  {
    id: 'scatter',
    label: 'Scatter / Bubble',
    icon: 'ScatterChart',
    presets: [
      { id: 'basic_scatter', label: 'Scatter Plot',    desc: 'XY scatter chart',                    overrides: { chart_type: 'scatter' } },
      { id: 'bubble',        label: 'Bubble',          desc: 'Bubble chart (size = 3rd metric)',    overrides: { chart_type: 'bubble' } },
      { id: 'scatter_line',  label: 'Scatter + Trend', desc: 'Scatter with regression line',       overrides: { chart_type: 'scatter', show_trend_line: true } },
    ]
  },
  {
    id: 'composed',
    label: 'Combination',
    icon: 'Layers',
    presets: [
      { id: 'bar_line',      label: 'Bar + Line',      desc: 'Mixed bar and line',                  overrides: { chart_type: 'composed', default_series: { 0: 'bar', 1: 'line' } } },
      { id: 'area_line',     label: 'Area + Line',     desc: 'Area base with line overlay',        overrides: { chart_type: 'composed', default_series: { 0: 'area', 1: 'line' } } },
      { id: 'bar_area',      label: 'Bar + Area',      desc: 'Bars with area background',          overrides: { chart_type: 'composed', default_series: { 0: 'bar', 1: 'area' } } },
    ]
  },
  {
    id: 'specialized',
    label: 'Specialized',
    icon: 'Activity',
    presets: [
      { id: 'radar',         label: 'Radar / Spider',  desc: 'Multi-axis radar chart',              overrides: { chart_type: 'radar' } },
      { id: 'funnel',        label: 'Funnel',          desc: 'Conversion funnel chart',              overrides: { chart_type: 'funnel' } },
      { id: 'treemap',       label: 'Treemap',         desc: 'Hierarchical treemap',                overrides: { chart_type: 'treemap' } },
      { id: 'radial_bar',    label: 'Radial Bar',      desc: 'Circular progress bars',              overrides: { chart_type: 'radial_bar' } },
      { id: 'gauge',         label: 'Gauge',           desc: 'Speedometer / gauge',                 overrides: { chart_type: 'gauge' } },
      { id: 'heatmap',       label: 'Heatmap',         desc: 'Color-coded data grid',               overrides: { chart_type: 'heatmap' } },
    ]
  },
  {
    id: 'data',
    label: 'Data Views',
    icon: 'Table2',
    presets: [
      { id: 'kpi',           label: 'KPI Card',        desc: 'Single metric display',               overrides: { chart_type: 'kpi' } },
      { id: 'table',         label: 'Data Table',      desc: 'Tabular data view',                   overrides: { chart_type: 'table' } },
      { id: 'pivot',         label: 'Pivot Table',     desc: 'Cross-tabulated pivot table',         overrides: { chart_type: 'pivot' } },
    ]
  },
];

/** Flatten all presets into a single lookup map */
export const PRESET_MAP = {};
CHART_CATALOG.forEach(cat => {
  cat.presets.forEach(p => {
    PRESET_MAP[p.id] = { ...p, category: cat.id, categoryLabel: cat.label };
  });
});

/** Get the preset for a given chart_type (best match) */
export function getPresetForType(chartType) {
  // Direct match on preset id
  if (PRESET_MAP[chartType]) return PRESET_MAP[chartType];
  // Match on chart_type override
  for (const p of Object.values(PRESET_MAP)) {
    if (p.overrides.chart_type === chartType) return p;
  }
  return PRESET_MAP['basic_column'];
}

/** Color palettes */
export const COLOR_PALETTES = {
  default:    { label: 'Default',      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#f97316', '#a855f7', '#14b8a6', '#ef4444', '#3b82f6', '#84cc16'] },
  vibrant:    { label: 'Vibrant',      colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7CB342', '#E91E63', '#00BCD4'] },
  pastel:     { label: 'Pastel',       colors: ['#a5b4fc', '#c4b5fd', '#f9a8d4', '#fcd34d', '#6ee7b7', '#67e8f9', '#fdba74', '#d8b4fe', '#5eead4', '#fca5a5'] },
  earth:      { label: 'Earth Tones',  colors: ['#92400e', '#b45309', '#a16207', '#4d7c0f', '#047857', '#0e7490', '#1e40af', '#6b21a8', '#be123c', '#78350f'] },
  monochrome: { label: 'Monochrome',   colors: ['#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'] },
  warm:       { label: 'Warm',         colors: ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#f59e0b', '#f97316', '#ef4444', '#fb923c', '#fbbf24', '#fcd34d'] },
  cool:       { label: 'Cool',         colors: ['#0284c7', '#0891b2', '#0d9488', '#059669', '#16a34a', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3'] },
  neon:       { label: 'Neon',         colors: ['#00ff88', '#00e5ff', '#ff4081', '#ffea00', '#651fff', '#00b0ff', '#ff6d00', '#76ff03', '#d500f9', '#1de9b6'] },
  sunset:     { label: 'Sunset',       colors: ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#818cf8', '#c084fc', '#f472b6', '#fb7185'] },
};

/** Default config values for new customization options */
export const DEFAULT_VISUAL_CONFIG = {
  // Axis
  axis_y_mode: 'smart',            // 'smart' | 'zero' | 'manual'
  axis_y_min: null,
  axis_y_max: null,
  axis_y_type: 'linear',           // 'linear' | 'logarithmic'
  axis_y_tick_count: null,
  axis_x_rotation: 0,              // 0 | -30 | -45 | -60 | -90
  axis_reversed: false,
  axis_y_label: '',
  axis_x_label: '',

  // Visual
  color_palette: 'default',
  custom_colors: [],
  line_width: 2,
  marker_size: 4,
  show_markers: false,
  show_grid: true,
  show_grid_x: false,
  show_data_labels: false,
  data_label_format: 'value',       // 'value' | 'percent' | 'name' | 'name_value' | 'name_percent'
  legend_position: 'bottom',        // 'top' | 'bottom' | 'right' | 'left' | 'hidden'
  gradient_fill: false,
  bar_border_radius: 4,
  area_opacity: 0.3,
  curve_type: 'monotone',           // 'monotone' | 'linear' | 'step' | 'basis' | 'natural'
  stroke_dash: '',

  // Interaction
  zoom_enabled: false,
  animation_enabled: true,
  animation_duration: 400,
  tooltip_shared: true,
  crosshair_enabled: false,
  brush_enabled: false,

  // Conditional
  conditional_color: false,
  conditional_positive: '#22c55e',
  conditional_negative: '#ef4444',

  // Trend
  show_trend_line: false,

  // Chart preset tracking
  chart_preset: null,
};
