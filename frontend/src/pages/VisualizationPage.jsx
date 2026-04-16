import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, Code2, Save, AlertCircle, Database, CheckCircle2,
  Activity, Zap, Ruler, Palette, Settings, Eye, PenLine, ArrowLeft, Maximize2, Minimize2, ChevronDown, RefreshCw, X, Loader2, Table2
} from 'lucide-react';

import { getDataset, executeQuery, updateVisualization, getVisualization, listDatasets, listSavedQueries, createVisualization, getSavedQuery } from '../lib/api';
import { buildSQL } from '../lib/sqlBuilder';
import ChartBuilder from '../components/visualizations/ChartBuilder';
import ChartPreview from '../components/visualizations/ChartPreview';
import SearchableSelect from '../components/ui/SearchableSelect';
import { useToast } from '../components/ui/Toast';

export default function VisualizationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [datasets, setDatasets] = useState([]);
  const [savedQueries, setSavedQueries] = useState([]);

  useEffect(() => {
    Promise.all([listDatasets(), listSavedQueries()])
      .then(([ds, sq]) => {
        setDatasets(ds.datasets || []);
        setSavedQueries(sq.queries || []);
      })
      .catch(err => console.error("Failed to load sources:", err));
  }, []);

  const sourceParam = searchParams.get('source');
  const vizIdParam = searchParams.get('id') || searchParams.get('edit');

  const [editVizId, setEditVizId] = useState(null);
  const [vizName, setVizName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef(null);

  const [selectedSource, setSelectedSource] = useState('');
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [queryInfo, setQueryInfo] = useState(null);
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});

  const [config, setConfig] = useState({
    title: '',
    chart_type: 'bar',
    view_mode: 'chart',
    x_fields: [],
    x_field: '',
    y_fields: [],
    y_field: '',
    field_aggregations: {},
    limit: 500,
    show_legend: true,
    show_labels: false,
    x_axis_filters: [], // Add generic filtering
  });

  const [queryData, setQueryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSQL, setShowSQL] = useState(false);
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Resize state
  const [leftW, setLeftW] = useState(420);
  const containerRef = useRef(null);

  const startLeftResize = (e) => {
    e.preventDefault();
    document.body.classList.add('qb-resizing');
    const startX = e.clientX;
    const startW = leftW;
    const onMove = (ev) => {
      const newW = Math.max(300, Math.min(600, startW + (ev.clientX - startX)));
      setLeftW(newW);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.classList.remove('qb-resizing');
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // 1. Initial Load (Edit Mode or Param Init)
  useEffect(() => {
    if (vizIdParam) {
      loadVisualization(vizIdParam);
    } else if (sourceParam) {
      setSelectedSource(sourceParam);
      initializeSource(sourceParam);
    }
  }, [vizIdParam, sourceParam]);

  const loadVisualization = async (id) => {
    try {
      const data = await getVisualization(id);
      setEditVizId(data.id);
      setVizName(data.name);
      
      const st = data.config?.source_type === 'query' 
        ? `query_${data.config?.source_query_id}` 
        : `dataset_${data.dataset_id}`;
      
      setSelectedSource(st);
      
      const defaultConfig = {
        title: '',
        chart_type: 'bar',
        view_mode: 'chart',
        x_fields: [],
        x_field: '',
        y_fields: [],
        y_field: '',
        field_aggregations: {},
        limit: 500,
        show_legend: true,
        show_labels: false,
        x_axis_filters: [],
      };

      const loadedConfig = { ...defaultConfig, ...(data.config || {}) };
      if (loadedConfig.chart_type === 'pivot_table') {
        loadedConfig.view_mode = 'table';
      }
      setConfig(loadedConfig);
      
      await initializeSource(st);
    } catch (err) {
      toast.error('Failed to load visualization');
      navigate('/visualizations');
    }
  };

  const initializeSource = async (src) => {
    try {
      setLoading(true);
      setError(null);
      if (src.startsWith('dataset_')) {
        const id = src.replace('dataset_', '');
        const info = await getDataset(id);
        setDatasetInfo(info);
        setQueryInfo(null);
        setDynamicColumns(info.columns || []);
      } else if (src.startsWith('query_')) {
        const id = src.replace('query_', '');
        const savedQ = await getSavedQuery(id);
        const res = await executeQuery(savedQ.sql, savedQ.dataset_id, 1, 1);
        setQueryInfo({ id, sql_text: savedQ.sql });
        setDatasetInfo({ id: savedQ.dataset_id, table_name: `(${savedQ.sql})` });
        
        if (res.columns) {
           setDynamicColumns(res.columns.map(c => ({ name: c, type: 'string' })));
        } else if (res.rows?.length > 0) {
           setDynamicColumns(Object.keys(res.rows[0]).map(k => ({ name: k, type: 'string' })));
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Unique Values for Filters
  const getUniqueValuesForColumn = useCallback(async (colName) => {
    if (!datasetInfo || uniqueValues[colName]) return;
    try {
      const fromClause = datasetInfo.table_name.startsWith('(') ? `${datasetInfo.table_name} AS base_q` : `"${datasetInfo.table_name}"`;
      let q = `SELECT DISTINCT "${colName}" FROM ${fromClause} WHERE "${colName}" IS NOT NULL LIMIT 50`;
      const result = await executeQuery(q, datasetInfo.id);
      if (result.rows) {
        setUniqueValues(prev => ({
          ...prev,
          [colName]: result.rows.map(r => r[colName]).sort()
        }));
      }
    } catch (e) {
      console.error('Failed to fetch unique values', e);
    }
  }, [datasetInfo, uniqueValues]);

  // 3. Core SQL Builder & Executor


  const autoUpdateTimer = useRef(null);
  const [autoUpdate, setAutoUpdate] = useState(true);
  
  // Hash to prevent identical back-to-back triggers
  const configKey = JSON.stringify({
    x: config.x_fields,
    y: config.y_fields,
    x_single: config.x_field,
    y_single: config.y_field,
    aggs: config.field_aggregations,
    sort_rules: config.sort_rules,
    filter: config.x_axis_filters,
    lim: config.limit,
    view: config.view_mode,
    ds: datasetInfo?.id
  });

  useEffect(() => {
    if (!autoUpdate || !datasetInfo) return;
    clearTimeout(autoUpdateTimer.current);
    
    // Only execute if we have fields mapped
    if ((config.x_fields?.length || config.x_field) || (config.y_fields?.length || config.y_field)) {
       autoUpdateTimer.current = setTimeout(async () => {
         setLoading(true);
         setError(null);
         try {
           const finalSQL = buildSQL(config, datasetInfo, queryInfo?.sql_text);
           setGeneratedSQL(finalSQL);
           const result = await executeQuery(finalSQL, datasetInfo.id);
           setQueryData(result.rows || []);
         } catch (err) {
           const errMsg = err.response?.data?.detail;
           setError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) || err.message);
         } finally {
           setLoading(false);
         }
       }, 600); // debounce time
    } else {
       // Clear data if no fields
       setQueryData([]);
       setGeneratedSQL('');
    }

    return () => clearTimeout(autoUpdateTimer.current);
  }, [configKey, autoUpdate, datasetInfo?.id]);

  const handleSave = async () => {
    const finalName = vizName.trim() || config.title?.trim();
    if (!finalName) {
      toast.error('Please give this visualization a name first.');
      setEditingName(true);
      setTimeout(() => nameInputRef.current?.focus(), 100);
      return;
    }
    if (!datasetInfo) {
      toast.error('Please select a data source first.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: finalName,
        dataset_id: datasetInfo.id,
        chart_type: config.chart_type,
        config: {
          ...config,
          source_type: queryInfo ? 'query' : 'dataset',
          source_query_id: queryInfo?.id,
          custom_sql: buildSQL(config, datasetInfo, queryInfo?.sql_text),
        },
      };
      if (editVizId) {
        await updateVisualization(editVizId, payload);
        toast.success('Visualization updated!');
      } else {
        await createVisualization(payload);
        toast.success('Visualization saved to library!');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      toast.error(`Failed to save: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldClick = (fieldName, fieldType) => {
    setConfig(prev => {
      if (fieldType === 'dimension') {
        const current = prev.x_fields || [];
        const isAdding = !current.includes(fieldName);
        const next = isAdding ? [...current, fieldName] : current.filter(f => f !== fieldName);
        
        let nextSortRules = [...(prev.sort_rules || [])];
        if (isAdding) {
          // Auto-add ONLY the active dimension to sort rules
          if (!nextSortRules.some(r => r.col === fieldName)) {
            nextSortRules = [{ col: fieldName, dir: 'ASC' }, ...nextSortRules.filter(r => !next.includes(r.col))];
          }
        } else {
          // Auto-remove from sort rules
          nextSortRules = nextSortRules.filter(r => r.col !== fieldName);
        }

        return {
          ...prev,
          x_fields: next,
          x_field: next.includes(prev.x_field) ? prev.x_field : (next[0] || ''),
          sort_rules: nextSortRules,
        };
      }
      return prev;
    });
  };

  const sourceOptions = [
    ...datasets.map(d => ({ value: `dataset_${d.id}`, label: `Dataset: ${d.name}`, icon: Database })),
    ...savedQueries.map(q => ({ value: `query_${q.id}`, label: `Query: ${q.name}`, icon: Code2 })),
  ];

  const canSave = vizName.trim() && datasetInfo;

  return (
    <div 
      className="flex flex-col h-full overflow-hidden bg-bg-base" 
      ref={containerRef}
      style={{ "--qb-left-w": isFullscreen ? "0px" : `${leftW}px` }}
    >
      {/* ── Outer Toolbar (Matches QB) ── */}
      {!isFullscreen && (
        <div className="qb-toolbar gap-3">
          <button
            className="qb-btn qb-btn--ghost px-2"
          onClick={() => navigate(-1)}
          title="Go back"
        >
          <ArrowLeft size={16} />
        </button>

        <Activity size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />

        {/* Name Editor */}
        <div className="relative min-w-[200px]" style={{ marginRight: '10px' }}>
          {editingName || !vizName ? (
            <div className="flex items-center gap-1">
              <input
                ref={nameInputRef}
                className="qb-input text-[13px] font-semibold w-full"
                placeholder="Name visualization…"
                value={vizName}
                onChange={e => setVizName(e.target.value)}
                onBlur={() => { if (vizName.trim()) setEditingName(false); }}
                autoFocus={editingName}
              />
              {vizName.trim() && (
                <button
                  className="qb-btn text-accent p-1"
                  onClick={() => setEditingName(false)}
                >
                  <CheckCircle2 size={14} />
                </button>
              )}
            </div>
          ) : (
            <button
              className="qb-btn qb-btn--ghost w-full justify-start gap-2 max-w-[300px]"
              onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.focus(), 50); }}
            >
              <span className="text-[14px] font-bold text-text-primary truncate">{vizName}</span>
              <PenLine size={12} className="text-text-muted shrink-0" />
            </button>
          )}
        </div>

        {/* Source Selector */}
        <SearchableSelect
          options={sourceOptions}
          value={selectedSource}
          onChange={(val) => {
            setSelectedSource(val);
            if (val) initializeSource(val);
          }}
          placeholder="Select Dataset…"
          className="w-[280px]"
        />

        {/* Tools */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button
            className={`qb-btn qb-btn--ghost ${showSQL ? 'text-accent border-accent/20 bg-accent-muted' : ''}`}
            onClick={() => setShowSQL(!showSQL)}
          >
            <Code2 size={13} /> {showSQL ? 'Hide SQL' : 'Show SQL'}
          </button>

          <button
            className="qb-btn qb-btn--run"
            onClick={handleSave}
            disabled={isSaving || !canSave}
            style={savedSuccess ? { background: 'var(--color-emerald-muted)', color: 'var(--color-emerald)', borderColor: 'var(--color-emerald)' } : {}}
          >
            {isSaving ? (
              <><Loader2 size={13} className="animate-spin" /> Saving…</>
            ) : savedSuccess ? (
              <><CheckCircle2 size={13} /> Saved!</>
            ) : (
              <><Save size={13} /> {editVizId ? 'Update' : 'Save'}</>
            )}
          </button>
        </div>
      </div>
      )}

      {/* ── Core Workspace ── */}
      <div className="qb-workspace">
        
        {/* Left Panel (Builder) */}
        {!isFullscreen && (
          <div className="qb-left-panel" style={{ width: "var(--qb-left-w)" }}>
            {selectedSource ? (
              <ChartBuilder
              columns={dynamicColumns}
              config={config}
              onConfigChange={setConfig}
              onFieldClick={handleFieldClick}
              uniqueValues={uniqueValues}
              onValueFetch={getUniqueValuesForColumn}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-text-quaternary">
              <Database size={28} />
              <p className="text-[13px] font-medium">Select a data source first</p>
            </div>
          )}
        </div>
        )}

        {/* Resize Handle */}
        {!isFullscreen && <div className="qb-resize-handle" onMouseDown={startLeftResize} />}

        {/* Right Panel (Preview) */}
        <div className="qb-right-panel" style={{ background: 'var(--color-bg-base)' }}>
          <div className={`relative h-full w-full flex flex-col transition-all duration-700 ${isFullscreen ? 'p-1' : 'p-8'}`}>
            
            {error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-rose-muted border border-rose/20 flex items-center justify-center mb-5">
                  <AlertCircle size={28} className="text-rose" />
                </div>
                <h3 className="text-[15px] font-black text-rose mb-2">Query Error</h3>
                <p className="max-w-md text-text-tertiary text-[13px]">{String(error)}</p>
                <button
                  className="mt-6 px-4 py-2 rounded-xl bg-bg-muted border border-border-default text-text-tertiary hover:text-text-primary hover:bg-bg-subtle text-[12px] transition-all"
                  onClick={() => { setError(null); setAutoUpdate(true); }}
                >
                  <RefreshCw size={12} className="inline mr-2" /> Retry
                </button>
              </div>
            ) : !selectedSource ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl border border-border-default flex items-center justify-center" style={{ background: 'var(--color-bg-muted)' }}>
                  <Database size={28} className="text-text-quaternary" />
                </div>
                <p className="text-[13px] text-text-tertiary font-medium">Select a data source to begin building</p>
              </div>
            ) : (
              <div className="flex-1 relative border border-border-muted rounded-3xl overflow-hidden flex flex-col card-elevation" style={{ background: 'var(--color-bg-surface)' }}>
                {loading && (
                  <div className="absolute inset-0 backdrop-blur-lg z-[100] flex flex-col items-center justify-center gap-3" style={{ background: 'var(--color-bg-base)', opacity: 0.85 }}>
                    <Loader2 size={36} className="text-accent animate-spin" />
                    <span className="text-[11px] font-bold tracking-[0.3em] text-accent uppercase animate-pulse">
                      Running Query…
                    </span>
                  </div>
                )}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <ChartPreview 
                    data={queryData} 
                    config={config} 
                    isBuilder={true} 
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                    onConfigChange={setConfig}
                  />
                </div>
              </div>
            )}

            {/* SQL Drawer */}
            {showSQL && (
              <div className="absolute bottom-6 right-6 w-[480px] max-h-[45%] backdrop-blur-3xl border border-border-default rounded-2xl shadow-xl z-50 flex flex-col card-elevation">
                <div className="px-5 py-3 border-b border-border-muted flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Generated SQL</span>
                  <button onClick={() => setShowSQL(false)} className="text-text-quaternary hover:text-text-primary transition-colors">
                    <X size={15} />
                  </button>
                </div>
                <div className="flex-1 p-5 overflow-auto custom-scrollbar">
                  <pre className="text-[11px] font-mono text-text-tertiary leading-relaxed whitespace-pre-wrap">
                    {generatedSQL || '-- Build your chart to see the generated SQL'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
