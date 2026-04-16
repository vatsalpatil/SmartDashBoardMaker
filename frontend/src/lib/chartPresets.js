/**
 * Chart Presets Catalog
 * Expanded to include as many Shadcn-style variations as possible.
 */

export const CHART_CATALOG = [
  {
    id: 'area',
    label: 'Area Charts',
    icon: 'TrendingUp',
    presets: [
      { id: 'area_default', label: 'Area Default', overrides: { chart_type: 'area' } },
      { id: 'area_linear', label: 'Area Linear', overrides: { chart_type: 'area', curve_type: 'linear' } },
      { id: 'area_step', label: 'Area Step', overrides: { chart_type: 'area', curve_type: 'step' } },
      { id: 'area_stacked', label: 'Area Stacked', overrides: { chart_type: 'stacked_area' } },
      { id: 'area_stacked_expand', label: 'Area Stacked Expand', overrides: { chart_type: 'percent_area' } },
      { id: 'area_dot', label: 'Area with Dots', overrides: { chart_type: 'area', show_markers: true } },
      { id: 'area_gradient', label: 'Area Gradient', overrides: { chart_type: 'area', gradient_fill: true } },
    ]
  },
  {
    id: 'bar',
    label: 'Bar Charts',
    icon: 'BarChart3',
    presets: [
      { id: 'bar_default', label: 'Bar Default', overrides: { chart_type: 'bar' } },
      { id: 'bar_horizontal', label: 'Bar Horizontal', overrides: { chart_type: 'horizontal_bar' } },
      { id: 'bar_stacked', label: 'Bar Stacked', overrides: { chart_type: 'stacked_bar' } },
      { id: 'bar_stacked_expand', label: 'Bar Stacked Expand', overrides: { chart_type: 'stacked_percent_bar' } },
      { id: 'bar_label', label: 'Bar with Label', overrides: { chart_type: 'bar', show_data_labels: true } },
      { id: 'bar_mixed', label: 'Bar Mixed', overrides: { chart_type: 'composed', default_series: { 0: 'bar', 1: 'line' } } },
      { id: 'bar_active', label: 'Bar Active', overrides: { chart_type: 'bar', active_cursor: true } },
      { id: 'bar_negative', label: 'Bar Negative', overrides: { chart_type: 'bar', conditional_color: true } },
    ]
  },
  {
    id: 'line',
    label: 'Line Charts',
    icon: 'LineChart',
    presets: [
      { id: 'line_default', label: 'Line Default', overrides: { chart_type: 'line' } },
      { id: 'line_linear', label: 'Line Linear', overrides: { chart_type: 'line', curve_type: 'linear' } },
      { id: 'line_step', label: 'Line Step', overrides: { chart_type: 'line', curve_type: 'step' } },
      { id: 'line_dot', label: 'Line with Dots', overrides: { chart_type: 'line', show_markers: true } },
      { id: 'line_label', label: 'Line with Label', overrides: { chart_type: 'line', show_data_labels: true } },
      { id: 'line_custom_dot', label: 'Line Custom Dot', overrides: { chart_type: 'line', custom_dots: true } },
    ]
  },
  {
    id: 'pie',
    label: 'Pie Charts',
    icon: 'PieChart',
    presets: [
      { id: 'pie_default', label: 'Pie Default', overrides: { chart_type: 'pie' } },
      { id: 'pie_label', label: 'Pie Header Label', overrides: { chart_type: 'pie', show_data_labels: true } },
      { id: 'pie_label_custom', label: 'Pie Custom Label', overrides: { chart_type: 'pie', custom_labels: true } },
      { id: 'pie_donut', label: 'Donut Chart', overrides: { chart_type: 'donut' } },
      { id: 'pie_donut_active', label: 'Donut Active', overrides: { chart_type: 'donut', active_sector: true } },
      { id: 'pie_donut_text', label: 'Donut with Text', overrides: { chart_type: 'donut', inner_text: true } },
      { id: 'pie_stacked', label: 'Pie Stacked', overrides: { chart_type: 'nested_donut' } },
    ]
  },
  {
    id: 'radar',
    label: 'Radar Charts',
    icon: 'Activity',
    presets: [
      { id: 'radar_default', label: 'Radar Default', overrides: { chart_type: 'radar' } },
      { id: 'radar_dots', label: 'Radar Dots', overrides: { chart_type: 'radar', show_markers: true } },
      { id: 'radar_lines', label: 'Radar Lines Only', overrides: { chart_type: 'radar', fill_opacity: 0 } },
    ]
  },
  {
    id: 'radial',
    label: 'Radial Charts',
    icon: 'Layers',
    presets: [
      { id: 'radial_default', label: 'Radial Default', overrides: { chart_type: 'radial_bar' } },
      { id: 'radial_label', label: 'Radial Labeled', overrides: { chart_type: 'radial_bar', show_data_labels: true } },
      { id: 'radial_stacked', label: 'Radial Stacked', overrides: { chart_type: 'radial_bar', stacked: true } },
    ]
  },
  {
    id: 'data',
    label: 'Data Views',
    icon: 'Table2',
    presets: [
      { id: 'kpi',           label: 'KPI Card',        overrides: { chart_type: 'kpi' } },
      { id: 'table',         label: 'Data Table',      overrides: { chart_type: 'table' } },
    ]
  },
];

export const PRESET_MAP = {};
CHART_CATALOG.forEach(cat => {
  cat.presets.forEach(p => {
    PRESET_MAP[p.id] = { ...p, category: cat.id, categoryLabel: cat.label };
  });
});

export function getPresetForType(chartType) {
  if (PRESET_MAP[chartType]) return PRESET_MAP[chartType];
  for (const p of Object.values(PRESET_MAP)) {
    if (p.overrides.chart_type === chartType) return p;
  }
  return PRESET_MAP['bar_default'];
}

export const COLOR_PALETTES = {
  default:    { label: 'Default',      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#f97316', '#a855f7', '#14b8a6', '#ef4444', '#3b82f6', '#84cc16'] },
  vibrant:    { label: 'Vibrant',      colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7CB342', '#E91E63', '#00BCD4'] },
  pastel:     { label: 'Pastel',       colors: ['#a5b4fc', '#c4b5fd', '#f9a8d4', '#fcd34d', '#6ee7b7', '#67e8f9', '#fdba74', '#d8b4fe', '#5eead4', '#fca5a5'] },
  monochrome: { label: 'Monochrome',   colors: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'] },
};

export const DEFAULT_VISUAL_CONFIG = {
  axis_y_mode: 'smart',
  axis_x_rotation: 0,
  color_palette: 'default',
  show_grid: true,
  legend_position: 'bottom',
  animation_enabled: true,
};
