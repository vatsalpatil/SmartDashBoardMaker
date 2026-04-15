import os

target = "c:/Users/Vatsal/Document/VSCodeFiles/PythonCode/SmartDashBoardMaker/frontend/src/components/visualizations/ChartPreview.jsx"

code = """import { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, Area, Scatter as RechartsScatter,
  ScatterChart, XAxis as ScatterXAxis, YAxis as ScatterYAxis,
  PieChart, Pie, Cell,
  RadarChart, Radar as RadarSeries, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap as RTreemap,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Brush, Funnel, FunnelChart, LabelList
} from 'recharts';
import { BarChart3, Table2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Check, Filter, Edit, X, GripVertical } from 'lucide-react';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#22c55e', '#06b6d4', '#f97316', '#a855f7',
  '#14b8a6', '#ef4444', '#3b82f6', '#84cc16',
];

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(10, 11, 20, 0.95)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 'var(--radius-lg)',
    fontSize: '0.85rem',
    color: '#ffffff',
    boxShadow: 'var(--shadow-lg)',
    padding: '12px 16px',
    fontFamily: 'var(--font-sans)',
  },
  itemStyle: {
    padding: '3px 0',
    fontWeight: 600,
    color: '#ffffff',
  },
  labelStyle: {
    marginBottom: '8px',
    fontWeight: 800,
    color: '#818cf8',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-heading)',
  },
  cursor: {
    stroke: 'var(--accent)',
    strokeWidth: 2,
    strokeDasharray: '6 6',
    opacity: 0.2,
  }
};

const formatValue = (value) => {
  if (typeof value !== 'number') return value;
  const absVal = Math.abs(value);
  if (absVal >= 10000000) return (value / 10000000).toFixed(2).replace(/\\.?0+$/, '') + ' Cr';
  if (absVal >= 100000) return (value / 100000).toFixed(2).replace(/\\.?0+$/, '') + ' L';
  if (absVal >= 1000) return (value / 1000).toFixed(1).replace(/\\.?0+$/, '') + 'k';
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const formatFullValue = (value) => {
  if (typeof value !== 'number') return String(value ?? '');
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export default function ChartPreview({ data, config, height = '100%', onConfigChange }) {
  const [viewMode, setViewMode] = useState(config?.view_mode || 'chart');
  const [tableFooterAgg, setTableFooterAgg] = useState('sum');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [dimSwitcherOpen, setDimSwitcherOpen] = useState(false);

  // Sync internal viewMode with config.view_mode
  useEffect(() => {
    if (config?.view_mode && config.view_mode !== viewMode) {
      setViewMode(config.view_mode);
    }
  }, [config?.view_mode]);

  // Function to sort data
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const modifier = sortConfig.direction === 'asc' ? 1 : -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * modifier;
    }
    return String(aVal).localeCompare(String(bVal)) * modifier;
  });

  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '12px',
      }}>
        <BarChart3 size={48} style={{ opacity: 0.15 }} />
        <div style={{ fontSize: '0.85rem' }}>No data to visualize</div>
      </div>
    );
  }

  const chartType = config?.chart_type || 'bar';
  const xField = config?.x_field;
  const xFields = config?.x_fields || (xField ? [xField] : []);
  const yFields = config?.y_fields || (config?.y_field ? [config.y_field] : []);
  const yField = yFields[0];
  const title = config?.title;

  // For charts (non-table), the active x_field used for rendering
  const activeXField = xField || xFields[0] || '';
  const hasMultipleDimensions = xFields.length > 1 && chartType !== 'table';
  const xFieldOptions = xFields.reduce((acc, f) => ({ ...acc, [f]: f }), {});

  if (yFields.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem'
      }}>
        Select at least one metric field
      </div>
    );
  }

  /* ── Dimension Switcher for charts with multiple x_fields ── */
  const renderDimensionSwitcher = () => {
    if (!hasMultipleDimensions) return null;

    if (viewMode === 'table') {
      const activeTableFields = config.table_x_fields !== undefined ? config.table_x_fields : xFields;

      return (
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setDimSwitcherOpen(!dimSwitcherOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
              border: '1px solid var(--border)', fontSize: '0.7rem',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            <Filter size={12} />
            Grouping ({activeTableFields.length})
            <ChevronDown size={12} style={{ transform: dimSwitcherOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {dimSwitcherOpen && (
            <>
              <div 
                onClick={() => setDimSwitcherOpen(false)} 
                style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
              />
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '6px', zIndex: 50,
                minWidth: '160px', boxShadow: 'var(--shadow-xl)',
                display: 'flex', flexDirection: 'column', gap: '2px'
              }}>
                {xFields.map(field => {
                  const isActive = activeTableFields.includes(field);
                  return (
                    <button
                      key={field}
                      onClick={() => {
                        let newFields = [...activeTableFields];
                        if (isActive) newFields = newFields.filter(f => f !== field);
                        else newFields.push(field);
                        onConfigChange?.({ ...config, table_x_fields: newFields });
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                        border: 'none', cursor: 'pointer',
                        background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '0.7rem', fontWeight: 500, textAlign: 'left',
                        transition: 'all 0.1s'
                      }}
                    >
                      {field}
                      {isActive && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setDimSwitcherOpen(!dimSwitcherOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', fontSize: '0.7rem',
            fontWeight: 600, cursor: 'pointer'
          }}
        >
          X: {activeXField}
          <ChevronDown size={12} style={{ transform: dimSwitcherOpen ? 'rotate(180deg)' : 'none' }} />
        </button>

        {dimSwitcherOpen && (
          <>
            <div 
              onClick={() => setDimSwitcherOpen(false)} 
              style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
            />
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: '4px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '6px', zIndex: 50,
              minWidth: '140px', boxShadow: 'var(--shadow-xl)',
              display: 'flex', flexDirection: 'column', gap: '2px'
            }}>
              {xFields.map(field => {
                const isActive = field === activeXField;
                return (
                  <button
                    key={field}
                    onClick={() => {
                      onConfigChange?.({ ...config, x_field: field });
                      setDimSwitcherOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                      border: 'none', cursor: 'pointer',
                      background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '0.7rem', fontWeight: 500, transition: 'all 0.1s'
                    }}
                  >
                    {field}
                    {isActive && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  /* ── Tabbed Header ── */
  const renderHeader = () => (
    <div 
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.02)',
        flexShrink: 0, gap: '8px', flexWrap: 'nowrap',
        position: 'sticky', top: 0, zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        {renderDimensionSwitcher()}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {!['table', 'kpi', 'pivot'].includes(chartType) && (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => {
                const newState = !config._mode_open;
                onConfigChange?.({ ...config, _mode_open: newState });
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                border: '1px solid var(--border)', fontSize: '0.7rem',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {viewMode === 'chart' ? <BarChart3 size={12} /> : <Table2 size={12} />}
              View: {viewMode === 'chart' ? 'Chart' : 'Data'}
              <ChevronDown size={12} style={{ transform: config._mode_open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {config._mode_open && (
              <>
                <div 
                  onClick={() => onConfigChange?.({ ...config, _mode_open: false })} 
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '6px', zIndex: 50,
                  minWidth: '120px', boxShadow: 'var(--shadow-xl)',
                  display: 'flex', flexDirection: 'column', gap: '2px'
                }}>
                  {[
                    { id: 'chart', icon: BarChart3, label: 'Chart' },
                    { id: 'table', icon: Table2, label: 'Data' },
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setViewMode(v.id);
                        onConfigChange?.({ ...config, view_mode: v.id, _mode_open: false });
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                        border: 'none', cursor: 'pointer',
                        background: viewMode === v.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        color: viewMode === v.id ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '0.72rem', fontWeight: 500, textAlign: 'left',
                        transition: 'all 0.1s'
                      }}
                    >
                      <v.icon size={12} />
                      {v.label}
                      {viewMode === v.id && <Check size={12} style={{ marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  /* ── Main Layout Wrapper ── */
  const renderLayout = (children) => {
    return (
      <div 
        style={{
          display: 'flex', flexDirection: 'column',
          height: '100%', width: '100%',
          overflow: 'hidden', position: 'relative'
        }}>
        {renderHeader()}
        <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    );
  };

  /* ── Data Grid ── */
  const renderTable = () => {
    const cols = Object.keys(data[0] || {});
    
    const handleSort = (col) => {
      setSortConfig(prev => ({
        key: col,
        direction: prev.key === col && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    };

    // Function to calculate aggregation for a column
    const calculateAgg = (colName, type) => {
      const numericValues = sortedData
        .map(row => row[colName])
        .filter(val => typeof val === 'number');
      
      if (numericValues.length === 0) return null;

      switch (type) {
        case 'sum':
          return numericValues.reduce((a, b) => a + b, 0);
        case 'avg':
          return numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        case 'count':
          return sortedData.length;
        case 'distinct':
          return new Set(sortedData.map(row => row[colName])).size;
        case 'max':
          return Math.max(...numericValues);
        case 'min':
          return Math.min(...numericValues);
        default:
          return null;
      }
    };

    return (
      <div style={{ overflow: 'auto', flex: 1, height: '100%' }}>
        <table className="data-table" style={{ fontSize: '0.75rem', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {cols.map((c, idx) => {
                const isNumeric = sortedData.some(row => typeof row[c] === 'number');
                const isSorted = sortConfig.key === c;
                return (
                  <th 
                    key={c} 
                    onClick={() => handleSort(c)}
                    style={{ 
                      textAlign: isNumeric ? 'right' : 'left',
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: isNumeric ? 'flex-end' : 'flex-start', gap: '4px' }}>
                      {c}
                      {isSorted ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={10} color="var(--accent)" /> : <ArrowDown size={10} color="var(--accent)" />
                      ) : (
                        <ArrowUpDown size={10} style={{ opacity: 0.2 }} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.slice(0, 500).map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                {cols.map((c, idx) => {
                  const val = row[c];
                  const isNum = typeof val === 'number';
                  return (
                    <td key={c} 
                      title={isNum ? formatFullValue(val) : String(val ?? '')}
                      style={{ 
                        textAlign: isNum ? 'right' : 'left',
                        padding: '6px 12px',
                      }}>
                      {isNum ? formatValue(val) : val?.toString()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
            <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid var(--border)' }}>
              {cols.map((c, idx) => {
                const isNumeric = sortedData.some(row => typeof row[c] === 'number');
                const isFirst = idx === 0;

                if (isFirst) {
                  return (
                    <td key={`footer-${c}`} style={{ padding: '4px 8px', borderRight: '1px solid var(--border-light)' }}>
                      <select 
                        value={tableFooterAgg}
                        onChange={(e) => setTableFooterAgg(e.target.value)}
                        style={{
                          background: 'var(--accent)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 4px',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="sum">SUM</option>
                        <option value="avg">AVG</option>
                        <option value="count">COUNT</option>
                        <option value="distinct">DISTINCT</option>
                        <option value="max">MAX</option>
                        <option value="min">MIN</option>
                      </select>
                    </td>
                  );
                }

                if (isNumeric) {
                  const aggVal = calculateAgg(c, tableFooterAgg);
                  return (
                    <td key={`footer-${c}`} 
                      title={aggVal !== null ? formatFullValue(aggVal) : ''}
                      style={{ 
                        textAlign: 'right', 
                        padding: '6px 12px', 
                        fontWeight: 800, 
                        color: 'var(--accent)' 
                      }}>
                      {aggVal !== null ? formatValue(aggVal) : '-'}
                    </td>
                  );
                }

                return <td key={`footer-${c}`} style={{ padding: '6px 12px' }}></td>;
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  /* ── Pivot Table ── */
  const renderPivotTable = () => {
    const rowFields = xFields.length > 0 ? xFields : [];
    const colField = config?.color_field || config?.group_by;
    const valFields = yFields.length > 0 ? yFields : [];

    if (rowFields.length === 0 && !colField) {
      return renderTable();
    }

    // Identify unique column headers
    let colValues = [];
    if (colField) {
      const uniqueVals = new Set();
      data.forEach(d => {
        if (d[colField] !== undefined && d[colField] !== null) {
          uniqueVals.add(String(d[colField]));
        }
      });
      colValues = Array.from(uniqueVals).sort();
    }

    // Build row groups
    const rowGroups = {};
    data.forEach(row => {
      const rowKeyStr = rowFields.map(f => row[f] ?? '').join('|||');
      if (!rowGroups[rowKeyStr]) {
        rowGroups[rowKeyStr] = { _rowValues: rowFields.reduce((acc, f) => ({...acc, [f]: row[f]}), {}) };
      }
      const targetGroup = rowGroups[rowKeyStr];
      if (colField) {
        const cVal = String(row[colField]);
        if (!targetGroup[cVal]) targetGroup[cVal] = {};
        valFields.forEach(v => { targetGroup[cVal][v] = row[v]; });
      } else {
        valFields.forEach(v => { targetGroup[v] = row[v]; });
      }
    });

    const rows = Object.values(rowGroups).sort((a, b) => {
      for (const rf of rowFields) {
        if (a._rowValues[rf] < b._rowValues[rf]) return -1;
        if (a._rowValues[rf] > b._rowValues[rf]) return 1;
      }
      return 0;
    });

    // Helper: get numeric value from a row for a colValue + valField
    const getCellNum = (rowArr, cv, vf) => {
      if (colField) {
        const v = rowArr[cv]?.[vf];
        return typeof v === 'number' ? v : 0;
      }
      const v = rowArr[vf];
      return typeof v === 'number' ? v : 0;
    };

    // Compute row totals (sum across all colValues for each valField)
    const getRowTotal = (rowArr, vf) => {
      if (!colField) return typeof rowArr[vf] === 'number' ? rowArr[vf] : 0;
      return colValues.reduce((sum, cv) => sum + getCellNum(rowArr, cv, vf), 0);
    };

    // Compute grand totals
    const grandTotals = {};
    if (colField) {
      colValues.forEach(cv => {
        grandTotals[cv] = {};
        valFields.forEach(vf => {
          grandTotals[cv][vf] = rows.reduce((sum, r) => sum + getCellNum(r, cv, vf), 0);
        });
      });
    }
    // Grand total per valField (across all columns)
    const grandRowTotals = {};
    valFields.forEach(vf => {
      grandRowTotals[vf] = rows.reduce((sum, r) => sum + getRowTotal(r, vf), 0);
    });

    const thStyle = { padding: '8px 12px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 3, fontWeight: 700, color: 'var(--text-muted)' };
    const thSubStyle = { padding: '6px 12px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border-light)', textAlign: 'right', background: 'var(--bg-tertiary)', position: 'sticky', top: colField ? '35px' : 0, zIndex: 2, fontSize: '0.68rem', color: 'var(--accent)' };
    const tdRowStyle = { padding: '6px 12px', fontWeight: 600, color: 'var(--text-primary)', borderRight: '1px solid var(--border-light)', background: 'var(--bg-primary)', position: 'sticky', left: 0, zIndex: 1 };
    const tdStyle = { padding: '6px 12px', textAlign: 'right', borderRight: '1px solid var(--border-light)' };
    const totalCellStyle = { padding: '6px 12px', textAlign: 'right', borderRight: '1px solid var(--border-light)', fontWeight: 700, color: '#6366f1' };
    const grandRowStyle = { background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' };

    return (
      <div style={{ overflow: 'auto', flex: 1, height: '100%' }}>
        <table className="data-table" style={{ fontSize: '0.75rem', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            {colField && (
              <tr>
                {rowFields.map(rf => (
                  <th key={rf} rowSpan={valFields.length > 1 ? 2 : 1} style={thStyle}>{rf}</th>
                ))}
                {colValues.map(cv => (
                  <th key={cv} colSpan={valFields.length > 1 ? valFields.length : 1} style={{ ...thStyle, textAlign: 'center', color: 'var(--text-heading)', borderRight: '1px solid var(--border-light)' }}>
                    {cv}
                  </th>
                ))}
                <th rowSpan={valFields.length > 1 ? 2 : 1} colSpan={valFields.length > 1 ? valFields.length : 1} style={{ ...thStyle, textAlign: 'center', color: '#6366f1', background: 'var(--bg-tertiary)', borderLeft: '2px solid var(--border)' }}>
                  Total
                </th>
              </tr>
            )}
            {/* Sub-header row: only show when multiple value fields OR no colField */}
            {(colField && valFields.length > 1) && (
              <tr>
                {colValues.map(cv => (
                  valFields.map(vf => (
                    <th key={`${cv}_${vf}`} style={thSubStyle}>
                      {vf}
                    </th>
                  ))
                ))}
              </tr>
            )}
            {!colField && (
              <tr>
                {rowFields.map(rf => (
                  <th key={rf} style={thStyle}>{rf}</th>
                ))}
                {valFields.map(vf => (
                  <th key={vf} style={{ ...thSubStyle, top: 0 }}>{vf}</th>
                ))}
                <th style={{ ...thSubStyle, top: 0, color: '#6366f1', fontWeight: 700, background: 'var(--bg-tertiary)', borderLeft: '2px solid var(--border)' }}>Total</th>
              </tr>
            )}
          </thead>
          <tbody>
            {rows.map((rowArr, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                {rowFields.map(rf => (
                  <td key={rf} style={tdRowStyle}>
                    {rowArr._rowValues[rf]?.toString() || '-'}
                  </td>
                ))}
                {colField ? colValues.map(cv => (
                  valFields.map(vf => {
                    const val = rowArr[cv]?.[vf];
                    return (
                      <td key={`${cv}_${vf}`} 
                        title={typeof val === 'number' ? formatFullValue(val) : String(val ?? '')}
                        style={tdStyle}>
                        {typeof val === 'number' ? formatValue(val) : (val ?? '-')}
                      </td>
                    );
                  })
                )) : (
                  valFields.map(vf => {
                    const val = rowArr[vf];
                    return (
                      <td key={vf} 
                        title={typeof val === 'number' ? formatFullValue(val) : String(val ?? '')}
                        style={tdStyle}>
                        {typeof val === 'number' ? formatValue(val) : (val ?? '-')}
                      </td>
                    );
                  })
                )}
                {/* Row total */}
                {valFields.map(vf => {
                  const val = getRowTotal(rowArr, vf);
                  return (
                    <td key={`total_${vf}`} 
                      title={formatFullValue(val)}
                      style={{ ...totalCellStyle, borderLeft: colField ? '2px solid var(--border)' : undefined }}>
                      {formatValue(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {/* Grand total footer */}
          <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
            <tr style={grandRowStyle}>
              <td colSpan={rowFields.length} style={{ ...tdRowStyle, fontWeight: 800, color: '#6366f1', background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                Grand Total
              </td>
              {colField ? colValues.map(cv => (
                valFields.map(vf => {
                  const val = grandTotals[cv]?.[vf] ?? 0;
                  return (
                    <td key={`gt_${cv}_${vf}`} 
                      title={formatFullValue(val)}
                      style={{ ...totalCellStyle, background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                      {formatValue(val)}
                    </td>
                  );
                })
              )) : (
                valFields.map(vf => {
                  const val = grandRowTotals[vf];
                  return (
                    <td key={`gt_${vf}`} 
                      title={formatFullValue(val)}
                      style={{ ...totalCellStyle, background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                      {formatValue(val)}
                    </td>
                  );
                })
              )}
              {/* Grand-grand total */}
              {valFields.map(vf => {
                const val = grandRowTotals[vf];
                return (
                  <td key={`ggt_${vf}`} 
                    title={formatFullValue(val)}
                    style={{ ...totalCellStyle, background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)', borderLeft: colField ? '2px solid var(--border)' : undefined, color: '#8b5cf6', fontWeight: 800 }}>
                    {formatValue(val)}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  /* Prepare chart data */
  const chartData = data.slice(0, config?.limit || 500).map(row => {
    const newRow = { ...row };
    yFields.forEach(yF => {
      const val = newRow[yF];
      newRow[yF] = val !== null && val !== '' && !isNaN(Number(val)) ? Number(val) : val;
    });
    return newRow;
  });

  /* ── KPI ── */
  if (chartType === 'kpi') {
    const agg = config?.aggregation || 'sum';
    let value = 0;
    const nums = data.map(r => Number(r[yField])).filter(v => !isNaN(v));
    if (agg === 'sum') value = nums.reduce((a, b) => a + b, 0);
    else if (agg === 'avg') value = nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
    else if (agg === 'count' || agg === 'count_distinct') value = agg === 'count_distinct' ? new Set(nums).size : nums.length;
    else if (agg === 'min') value = Math.min(...nums);
    else if (agg === 'max') value = Math.max(...nums);
    else value = nums[0] || 0;

    return renderLayout(
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', padding: '20px',
      }}>
        <div style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800,
          color: 'var(--text-heading)', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {formatValue(value)}
        </div>
        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {title || `${agg.toUpperCase()} of ${yField}`}
        </div>
      </div>
    );
  }

  /* ── Table ── */
  if (chartType === 'table' || viewMode === 'table') {
    return renderLayout(renderTable());
  }

  /* ── Pivot Table ── */
  if (chartType === 'pivot') {
    return renderLayout(renderPivotTable());
  }

  /* ── Validate numerics for standard charts ── */
  const isStandardChart = ['bar', 'horizontal_bar', 'stacked_bar', 'line', 'area'].includes(chartType);
  if (isStandardChart) {
    const invalidFields = yFields.filter(yF => !chartData.some(row => typeof row[yF] === 'number'));
    if (invalidFields.length > 0) {
      return renderLayout(
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', padding: '20px'
        }}>
          No valid numeric data found for expected fields. <br />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Check your data casting (make sure metrics are numbers).
          </span>
        </div>
      );
    }
  }

  /* ── Render Individual Chart Types ── */
  const renderChartType = () => {
    switch (chartType) {
      case 'pie':
      case 'donut':
        return (
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={chartData} dataKey={yField} nameKey={activeXField}
              cx="50%" cy="50%"
              outerRadius="75%"
              innerRadius={chartType === 'donut' ? '55%' : 0}
              paddingAngle={chartType === 'donut' ? 2 : 0}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius * 1.15;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text x={x} y={y} fill="var(--text-muted)" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="11" fontWeight="600">
                    {formatValue(value)}
                  </text>
                );
              }}
              labelLine={{ stroke: 'var(--border)', strokeWidth: 1, opacity: 0.5 }}
            >
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />)}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(val, name) => [formatFullValue(val), name]} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
            <ScatterXAxis dataKey={activeXField} type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
            <ScatterYAxis dataKey={yField} type="number" tickFormatter={formatValue} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <RechartsScatter name={yField} data={chartData} fill={COLORS[0]}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </RechartsScatter>
          </ScatterChart>
        );

      case 'radar':
        return (
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="var(--border)" opacity={0.5} />
            <PolarAngleAxis dataKey={activeXField} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={formatValue} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            {yFields.map((field, idx) => (
              <RadarSeries key={field} name={field} dataKey={field} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.3} strokeWidth={2} />
            ))}
          </RadarChart>
        );

      case 'funnel':
        const funnelData = chartData.map(r => ({ name: r[activeXField], value: Number(r[yField]) })).sort((a, b) => b.value - a.value);
        return (
          <FunnelChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
            <Tooltip {...tooltipStyle} />
            <Funnel data={funnelData} dataKey="value" nameKey="name" isAnimationActive>
              <LabelList position="right" fill="var(--text-primary)" stroke="none" dataKey="name" fontSize={11} fontWeight={600} />
              <LabelList position="center" fill="#ffffff" stroke="none" formatter={(val) => formatValue(val)} fontSize={12} fontWeight={800} />
            </Funnel>
          </FunnelChart>
        );

      case 'treemap':
        const CustomTreemapContent = (props) => {
          const { root, depth, x, y, width, height, index, name, value } = props;
          return (
            <g>
              <rect x={x} y={y} width={width} height={height} style={{ fill: COLORS[index % COLORS.length], stroke: 'var(--bg-card)', strokeWidth: 2, rx: depth === 1 ? 4 : 0 }} />
              {width > 60 && height > 40 && (
                <>
                  <text x={x + width / 2} y={y + height / 2 - 4} textAnchor="middle" fill="white" fontSize={12} fontWeight={700} style={{ fontFamily: 'var(--font-heading)', pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {String(name).length * 8 > width ? String(name).slice(0, Math.floor(width / 8)) + '..' : name}
                  </text>
                  <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" fill="rgba(255,255,255,0.92)" fontSize={11} fontWeight={500} style={{ fontFamily: 'var(--font-sans)', pointerEvents: 'none', textShadow: '0 1px 1px rgba(0,0,0,0.4)' }}>
                    {formatValue(value)}
                  </text>
                </>
              )}
            </g>
          );
        };
        const treemapData = chartData.map(r => ({ name: r[activeXField], size: Number(r[yField]) })).filter(r => r.size > 0);
        return (
          <RTreemap data={treemapData} dataKey="size" nameKey="name" isAnimationActive={true} content={<CustomTreemapContent />}>
            <Tooltip {...tooltipStyle} formatter={(val, name) => [formatFullValue(val), name]} />
          </RTreemap>
        );

      default:
        // Bar, Stacked Bar, Line, Area
        return (
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }} layout={chartType === 'horizontal_bar' ? 'vertical' : 'horizontal'}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={chartType === 'horizontal_bar'} horizontal={chartType !== 'horizontal_bar'} opacity={0.5} />
            {chartType === 'horizontal_bar' ? (
              <>
                <XAxis type="number" tickFormatter={formatValue} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey={activeXField} type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} width={80} />
              </>
            ) : (
              <>
                <XAxis dataKey={activeXField} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis tickFormatter={formatValue} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              </>
            )}
            <Tooltip {...tooltipStyle} formatter={(val) => [formatFullValue(val), 'Value']} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            
            {yFields.map((field, idx) => {
              const type = config.series_types?.[field] || chartType;
              const isStacked = chartType === 'stacked_bar';
              const color = COLORS[idx % COLORS.length];

              if (type === 'line') {
                return <Line key={field} type="monotone" dataKey={field} stroke={color} strokeWidth={3} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0, fill: 'white' }} />;
              }
              if (type === 'area') {
                return (
                  <Area key={field} type="monotone" dataKey={field} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color${field})`} />
                );
              }
              // Render as bar
              return (
                <Bar key={field} dataKey={field} stackId={isStacked ? "a" : undefined} fill={color} radius={isStacked ? [0, 0, 0, 0] : chartType === 'horizontal_bar' ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={60} />
              );
            })}
          </ComposedChart>
        );
    }
  };

  return renderLayout(
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChartType()}
      </ResponsiveContainer>
    </div>
  );
}
"""

with open(target, "w", encoding="utf-8") as f:
    f.write(code)

print("ChartPreview.jsx generated successfully!")
