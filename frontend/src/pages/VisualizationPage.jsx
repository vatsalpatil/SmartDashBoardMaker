import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BarChart3, Code2, Save, AlertCircle, Database, Search, ChevronRight, 
  Activity, Zap, Ruler, Palette, Settings2, Maximize2, Minimize2, Trash2, 
  RefreshCw, Layout, Type, Table2, ChevronDown, Loader2, X
} from 'lucide-react';
import { 
  listDatasets, listSavedQueries, getDataset, getVisualization, 
  executeQuery, updateVisualization, createVisualization 
} from '../lib/api';
import { buildSQL } from '../lib/sqlBuilder';
import ChartBuilder from '../components/visualizations/ChartBuilder';
import ChartPreview from '../components/visualizations/ChartPreview';
import { Button } from '../components/ui/Button';
import SearchableSelect from '../components/ui/SearchableSelect';

export default function VisualizationPage() {
  const [searchParams] = useSearchParams();
  const editVizId = searchParams.get('edit');
  const preselectedDataset = searchParams.get('datasetId');

  const [datasets, setDatasets] = useState([]);
  const [savedQueries, setSavedQueries] = useState([]);
  const [selectedSource, setSelectedSource] = useState(
    preselectedDataset ? `dataset_${preselectedDataset}` : "",
  );
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [queryInfo, setQueryInfo] = useState(null);

  const [config, setConfig] = useState({
    chart_type: "bar",
    aggregation: "sum",
    field_aggregations: {},
    filters: [],
    x_fields: [],
    y_fields: [],
    limit: 5000,
  });
  const [queryData, setQueryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vizName, setVizName] = useState("");
  const [error, setError] = useState(null);
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [showSQL, setShowSQL] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const autoUpdateTimer = useRef(null);

  useEffect(() => {
    Promise.all([listDatasets(), listSavedQueries()])
      .then(([dsRes, qRes]) => {
        setDatasets(dsRes.datasets || []);
        setSavedQueries(qRes.queries || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (editVizId) {
      getVisualization(editVizId)
        .then((viz) => {
          setVizName(viz.name);
          if (viz.config.source_type === "query") {
            setSelectedSource(`query_${viz.config.source_query_id}`);
          } else {
            setSelectedSource(`dataset_${viz.dataset_id}`);
          }
          setConfig(viz.config);
        })
        .catch(console.error);
    }
  }, [editVizId, savedQueries]);

  useEffect(() => {
    if (!selectedSource) {
      setDatasetInfo(null);
      setQueryInfo(null);
      setDynamicColumns([]);
      return;
    }

    // Reset mapping when source changes if not in edit mode init
    if (!editVizId) {
      setConfig(prev => ({
        ...prev,
        x_field: "",
        x_fields: [],
        y_field: "",
        y_fields: [],
        field_aggregations: {},
      }));
    }

    if (selectedSource.startsWith("dataset_")) {
      const id = selectedSource.replace("dataset_", "");
      getDataset(id)
        .then((ds) => {
          setDatasetInfo(ds);
          setQueryInfo(null);
          const cols = ds.columns || [];
          setDynamicColumns(cols);
        })
        .catch(console.error);
    } else if (selectedSource.startsWith("query_")) {
      const id = selectedSource.replace("query_", "");
      const query = savedQueries.find(q => String(q.id) === id);
      if (query) {
        setQueryInfo(query);
        getDataset(query.dataset_id)
          .then(ds => {
            setDatasetInfo(ds);
            extractColumns(query.sql_text, query.dataset_id);
          })
          .catch(console.error);
      }
    }
  }, [selectedSource, savedQueries]);

  const extractColumns = async (sql, dsId) => {
    if (!sql || !sql.trim()) return;
    try {
      const cleanSql = sql.trim().replace(/;$/, "");
      const result = await executeQuery(`SELECT * FROM (${cleanSql}) LIMIT 0`, dsId, 1, 1);
      if (result.rows?.length > 0 || result.columns) {
        const cols = (result.columns || Object.keys(result.rows[0] || {})).map(name => ({
          name,
          type: 'string' // Best guess
        }));
        setDynamicColumns(cols);
      }
    } catch (e) {
      console.error("Failed to extract query columns", e);
    }
  };

  const getUniqueValuesForColumn = async (column) => {
    if (!datasetInfo || !column || uniqueValues[column]) return;
    try {
      const colSafe = `"${column.replace(/"/g, '""')}"`;
      const baseTable = queryInfo ? `(${queryInfo.sql_text})` : `"${datasetInfo.table_name}"`;
      const sql = `SELECT DISTINCT ${colSafe} as val FROM ${baseTable} WHERE ${colSafe} IS NOT NULL LIMIT 100`;
      const result = await executeQuery(sql, datasetInfo.id, 1, 100);
      const vals = (result.rows || []).map(r => r.val).filter(v => v !== null && v !== "");
      setUniqueValues(prev => ({ ...prev, [column]: vals }));
    } catch (e) {
      console.error("Failed fetching unique values", e);
    }
  };

  const configKey = JSON.stringify({
    ct: config.chart_type,
    x: config.x_field,
    xf: config.x_fields,
    y: config.y_fields,
    agg: config.aggregation,
    fa: config.field_aggregations,
    f: config.filters,
    xfi: config.x_axis_filters,
    lim: config.limit,
    sb: config.sort_by,
    sd: config.sort_dir,
    vm: config.view_mode
  });

  useEffect(() => {
    if (!autoUpdate || !datasetInfo) return;
    const hasFields = (config.x_fields?.length > 0) || (config.y_fields?.length > 0);
    if (!hasFields) return;

    if (autoUpdateTimer.current) clearTimeout(autoUpdateTimer.current);
    autoUpdateTimer.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const sql = buildSQL(config, datasetInfo, queryInfo?.sql_text);
        setGeneratedSQL(sql);
        const result = await executeQuery(sql, datasetInfo.id, 1, config.limit || 50);
        setQueryData(result.rows || []);
      } catch (err) {
        setError(err.response?.data?.detail || "Query execution failed");
        setQueryData([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(autoUpdateTimer.current);
  }, [configKey, autoUpdate, datasetInfo?.id]);

  const handleSave = async () => {
    const finalName = vizName.trim() || config.title?.trim();
    if (!finalName || !datasetInfo) return;
    try {
      const payload = {
        name: finalName,
        dataset_id: datasetInfo.id,
        chart_type: config.chart_type,
        config: {
          ...config,
          source_type: queryInfo ? "query" : "dataset",
          source_query_id: queryInfo?.id,
          custom_sql: buildSQL(config, datasetInfo, queryInfo?.sql_text),
        },
      };
      if (editVizId) {
        await updateVisualization(editVizId, payload);
        alert("Visualization updated!");
      } else {
        await createVisualization(payload);
        alert("Visualization saved!");
        setVizName("");
      }
    } catch (err) {
      alert(`Failed to save: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleFieldClick = (fieldName, fieldType) => {
    setConfig(prev => {
      if (fieldType === 'dimension') {
        const current = prev.x_fields || [];
        // Always Multi-Select in Sidebar (Building the Pool)
        const next = current.includes(fieldName) ? current.filter(f => f !== fieldName) : [...current, fieldName];
        
        return { 
          ...prev, 
          x_fields: next, 
          // Ensure x_field (Primary Axis) is always one of the selected ones
          x_field: next.includes(prev.x_field) ? prev.x_field : (next[0] || '')
        };
      }
      if (fieldType === 'measure') {
        const current = prev.y_fields || [];
        const isAdding = !current.includes(fieldName);
        const next = isAdding ? [...current, fieldName] : current.filter(f => f !== fieldName);
        
        let nextFieldAggs = { ...(prev.field_aggregations || {}) };
        if (isAdding) {
          nextFieldAggs[fieldName] = 'sum'; // Default to SUM on start
        } else {
          delete nextFieldAggs[fieldName];
        }

        return { 
          ...prev, 
          y_fields: next, 
          field_aggregations: nextFieldAggs,
          aggregation: 'sum' // Also ensure global aggregation is sum
        };
      }
      return prev;
    });
  };

  const sourceOptions = [
    ...datasets.map(d => ({ value: `dataset_${d.id}`, label: `Dataset: ${d.name}`, icon: Database })),
    ...savedQueries.map(q => ({ value: `query_${q.id}`, label: `Query: ${q.name}`, icon: Code2 }))
  ];

  return (
    <div className="flex h-full bg-[#020205] text-text-primary overflow-hidden font-sans">
      
      {/* ── OPERATION CENTER (Left Rail) ── */}
      <div className="w-[450px] border-r border-white/5 flex flex-col bg-[#050510] relative z-20 shadow-2xl">
        <div className="p-6 border-b border-white/[0.03] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/30 shadow-glow">
              <Zap size={16} className="text-accent" />
            </div>
            <div>
              <h1 className="text-[12px] font-black text-white uppercase tracking-[0.2em] leading-none">Visualization</h1>
              <span className="text-[9px] text-text-quaternary font-bold uppercase tracking-widest block mt-1">Creator Engine</span>
            </div>
          </div>
          
          <SearchableSelect
            options={sourceOptions}
            value={selectedSource}
            onChange={setSelectedSource}
            placeholder="Select Source Dataset/Query..."
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <ChartBuilder
            columns={dynamicColumns}
            config={config}
            onConfigChange={setConfig}
            onFieldClick={handleFieldClick}
            uniqueValues={uniqueValues}
            onValueFetch={getUniqueValuesForColumn}
          />
        </div>
      </div>

        {/* ── IMMERSIVE PREVIEW (Right Fill) ── */}
      <div className={`flex-1 flex flex-col min-w-0 relative bg-[#020208] transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[1000] p-6' : ''}`}>
        
        {/* ACTION TOOLBAR (Precision Command Strip) */}
        <div className="h-20 border-b border-white/[0.03] bg-transparent px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-[14px] font-black text-white/90 uppercase tracking-tight">
              {vizName || config.title || 'UNNAMED INSIGHT ENGINE'}
            </h2>
            <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-0.5">
              ORCHESTRATING {config.x_field} VS {config.y_fields?.length || 0} METRICS
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Command Strip Group */}
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-1.5 rounded-2xl backdrop-blur-3xl shadow-3xl">
              
              {/* Fullscreen Trigger */}
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* X-Axis Focal Control (Only needed for Charts) */}
              <div className="flex items-center gap-3">
                {config.view_mode === 'table' ? (
                  <div className="px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3 shadow-inner">
                    <Table2 size={14} className="text-emerald-500/40" />
                    <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em]">
                      Displaying {(config.x_fields || []).length} Dimensions
                    </span>
                  </div>
                ) : (
                  <div className="relative group/sel">
                    <select 
                      className="bg-[#121225] border border-white/5 rounded-xl px-5 py-2.5 text-[11px] font-black text-rose-400 outline-none cursor-pointer appearance-none pr-10 min-w-[160px] transition-all hover:border-rose-500/30 shadow-2xl"
                      value={config.x_field}
                      onChange={(e) => setConfig({ ...config, x_field: e.target.value })}
                    >
                      {(config.x_fields || []).length > 0 ? (
                        config.x_fields.map(f => (
                          <option key={f} value={f}>{f.toUpperCase()}</option>
                        ))
                      ) : (
                        <option value="">No Dimensions Selected</option>
                      )}
                    </select>
                    <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500/30 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Chart / Table Binary Toggle */}
              <div className="flex bg-[#0a0a15] p-1 rounded-xl shrink-0">
                <button 
                  onClick={() => setConfig({ ...config, view_mode: 'chart' })}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${config.view_mode !== 'table' ? 'bg-white/10 text-white shadow-glow' : 'text-white/20 hover:text-white/40'}`}
                >
                  <BarChart3 size={12} /> CHART
                </button>
                <button 
                  onClick={() => setConfig({ ...config, view_mode: 'table' })}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${config.view_mode === 'table' ? 'bg-white/10 text-white shadow-glow' : 'text-white/20 hover:text-white/40'}`}
                >
                  <Table2 size={12} /> TABLE
                </button>
              </div>
            </div>

            <Button
              variant="accent"
              icon={<Save size={16} />}
              onClick={handleSave}
              className="px-8 shadow-glow"
              disabled={!datasetInfo || (!vizName && !config.title)}
            >
              Assemble
            </Button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="flex-1 relative overflow-hidden">
          <div className={`absolute inset-0 flex flex-col transition-all duration-700 ${isFullscreen ? 'p-4' : 'p-10'}`}>
            {error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                  <AlertCircle size={32} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-rose-500 uppercase tracking-widest mb-2">Interface Collapse</h3>
                <p className="max-w-md text-white/30 text-sm font-medium">{error}</p>
                <Button variant="ghost" onClick={() => setAutoUpdate(true)} className="mt-8 border-white/5">RESYNC ENGINE</Button>
              </div>
            ) : (
              <div className={`flex-1 relative border border-white/[0.03] bg-white/[0.01] backdrop-blur-sm overflow-hidden flex flex-col shadow-inner transition-all duration-700 ${isFullscreen ? 'rounded-[1.5rem]' : 'rounded-[2.5rem]'}`}>
                {loading && (
                   <div className="absolute inset-0 bg-[#020205]/60 backdrop-blur-xl z-[100] flex flex-col items-center justify-center gap-4">
                      <Loader2 size={48} className="text-accent animate-spin" />
                      <span className="text-[10px] font-black tracking-[0.4em] text-accent animate-pulse uppercase">Modelling Synthetic Insight</span>
                   </div>
                )}
                <div className="flex-1 p-6 md:p-8 min-h-0 flex flex-col">
                   <ChartPreview data={queryData} config={config} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SQL Drawer */}
        {showSQL && (
           <div className="absolute bottom-6 right-6 w-1/2 max-h-[40%] bg-bg-overlay/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-3xl z-50 flex flex-col animate-in slide-in-from-bottom-8 duration-500">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">Compiled SQL Engine</span>
                <button onClick={() => setShowSQL(false)} className="text-white/20 hover:text-white"><X size={16} /></button>
              </div>
              <div className="flex-1 p-6 overflow-auto custom-scrollbar">
                <pre className="text-[12px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap">
                  {generatedSQL}
                </pre>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
