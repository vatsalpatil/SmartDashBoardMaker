/**
 * Chart Catalog — Flat, one entry per unique chart type.
 * All visual variations are controlled through Settings, not separate types.
 */

export const CHART_CATALOG = [
  {
    id: 'bar',
    label: 'Bar Chart',
    icon: 'BarChart3',
    color: '#6366f1',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Compare values across categories',
    bestFor: 'Category comparisons, rankings — supports vertical, horizontal, stacked & 100%',
    chart_type: 'bar',
  },
  {
    id: 'composed',
    label: 'Smart Combine',
    icon: 'Layers',
    color: '#0ea5e9',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Combine Line, Bar, and Area charts',
    bestFor: 'Comparing metrics with different scales or types',
    chart_type: 'composed',
  },
  {
    id: 'line',
    label: 'Line Chart',
    icon: 'LineChart',
    color: '#8b5cf6',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Show trends over a continuous axis',
    bestFor: 'Time series, trends — supports smooth, step, dotted & shaded fill',
    chart_type: 'line',
  },
  {
    id: 'area',
    label: 'Area Chart',
    icon: 'TrendingUp',
    color: '#06b6d4',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Line with filled area — emphasise magnitude',
    bestFor: 'Volume over time — supports stacked & 100% normalized',
    chart_type: 'area',
  },
  {
    id: 'pie',
    label: 'Pie / Donut',
    icon: 'PieChart',
    color: '#ec4899',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Proportional slices of a whole',
    bestFor: 'Up to 6–7 categories, part-to-whole — supports hollow center (Donut)',
    chart_type: 'pie',
  },
  {
    id: 'radar',
    label: 'Radar Chart',
    icon: 'Activity',
    color: '#22c55e',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Multi-variable comparison in a spider-web layout',
    bestFor: 'Performance across multiple dimensions',
    chart_type: 'radar',
  },
  {
    id: 'funnel',
    label: 'Funnel',
    icon: 'Layers',
    color: '#7c3aed',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Progressive reduction across process stages',
    bestFor: 'Sales funnel, conversion rates, pipelines',
    chart_type: 'funnel',
  },
  {
    id: 'treemap',
    label: 'Treemap',
    icon: 'Layers',
    color: '#b45309',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Hierarchical data as nested rectangles',
    bestFor: 'Part-to-whole with hierarchy',
    chart_type: 'treemap',
  },
  {
    id: 'world_map',
    label: 'World Map',
    icon: 'Globe',
    color: '#0ea5e9',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Choropleth world map — colour countries by value',
    bestFor: 'Country-level KPIs, geographic distributions',
    chart_type: 'world_map',
  },
  {
    id: 'candlestick',
    label: 'Candlestick',
    icon: 'Activity',
    color: '#10b981',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Show open, high, low, close values',
    bestFor: 'Financial data, stock price movements',
    chart_type: 'candlestick',
  },

  {
    id: 'kpi',
    label: 'KPI Card',
    icon: 'Zap',
    color: '#64748b',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Bold single-number for at-a-glance metrics',
    bestFor: 'Revenue, users, churn, NPS — headline metrics',
    chart_type: 'kpi',
  },
  {
    id: 'table',
    label: 'Data Table',
    icon: 'Table2',
    color: '#475569',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Tabular view with sortable columns',
    bestFor: 'Full detail view, data export',
    chart_type: 'table',
    view_mode: 'table',
  },
  {
    id: 'pivot_table',
    label: 'Pivot Table',
    icon: 'Table2',
    color: '#334155',
    category: 'all',
    categoryLabel: 'All Charts',
    desc: 'Cross-tabulation matrix',
    bestFor: 'Multi-dimensional aggregation, cross-analysis',
    chart_type: 'pivot_table',
    view_mode: 'table',
  },
];

/** Map by id for O(1) lookup */
export const PRESET_MAP = Object.fromEntries(CHART_CATALOG.map((c) => [c.id, c]));

/** Get the catalog entry for a given chart_type */
export function getPresetForType(chartType) {
  return CHART_CATALOG.find((c) => c.chart_type === chartType) || CHART_CATALOG[0];
}

export const CHART_CATEGORIES = [
  { id: 'all', label: 'All Charts' },
];

export const COLOR_PALETTES = {
  default: {
    label: 'Default',
    colors: ['#4f46e5', '#f59e0b', '#06b6d4', '#ec4899', '#22c55e', '#8b5cf6', '#f97316', '#14b8a6', '#ef4444', '#3b82f6', '#a855f7', '#84cc16'],
  },
  vibrant: {
    label: 'Vibrant',
    colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7CB342', '#E91E63', '#00BCD4'],
  },
  pastel: {
    label: 'Pastel',
    colors: ['#a5b4fc', '#c4b5fd', '#f9a8d4', '#fcd34d', '#6ee7b7', '#67e8f9', '#fdba74', '#d8b4fe', '#5eead4', '#fca5a5'],
  },
  monochrome: {
    label: 'Monochrome',
    colors: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'],
  },
  warm: {
    label: 'Warm',
    colors: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#e11d48', '#dc2626'],
  },
  cool: {
    label: 'Cool',
    colors: ['#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#22d3ee', '#38bdf8'],
  },
  nature: {
    label: 'Nature',
    colors: ['#16a34a', '#15803d', '#166534', '#4ade80', '#86efac', '#bbf7d0', '#65a30d', '#a3e635'],
  },
  sunset: {
    label: 'Sunset',
    colors: ['#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48', '#f97316', '#f59e0b', '#fbbf24'],
  },
};
