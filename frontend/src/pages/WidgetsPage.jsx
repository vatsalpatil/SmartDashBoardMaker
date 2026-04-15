import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit2,
  Table2,
  ExternalLink,
  Code2,
  TerminalSquare,
  Database,
  Loader2
} from "lucide-react";
import { listVisualizations, deleteVisualization, listSavedQueries, deleteSavedQuery, executeQuery } from "../lib/api";
import { buildSQL } from "../lib/sqlBuilder";
import ChartPreview from "../components/visualizations/ChartPreview";
import { PageContainer, Button, EmptyState, Badge } from "../components/ui";
import { useToast } from "../components/ui/Toast";
import { useConfirm } from "../components/ui/ConfirmDialog";

function WidgetThumbnail({ viz }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const localConfig = { ...viz.config, title: '', chart_type: viz.chart_type || viz.config?.chart_type };
        let sql = localConfig.custom_sql;
        const isQueryBased = localConfig.source_type === 'query' || localConfig.source_query_id || (!localConfig.source_type && localConfig.custom_sql?.includes('AS q'));

        if (isQueryBased) {
          let baseQueryText = localConfig.source_query_sql;
          if (!baseQueryText && localConfig.custom_sql) {
            const match = localConfig.custom_sql.match(/FROM\s+\((.*?)\)\s+AS\s+q/is);
            if (match && match[1]) baseQueryText = match[1].trim();
          }
          if (baseQueryText) sql = buildSQL(localConfig, `(${baseQueryText})`, null) || localConfig.custom_sql;
        } else {
          const tableName = `dataset_${viz.dataset_id.replace(/-/g, '_')}`;
          sql = buildSQL(localConfig, { table_name: tableName }, null) || localConfig.custom_sql;
        }

        if (sql) {
          const result = await executeQuery(sql, viz.dataset_id, 1, 50);
          if (mounted) setData(result.rows || []);
        }
      } catch (err) {
        console.error("WidgetThumbnail Error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [viz]);

  if (loading) {
    return <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={24} className="text-white/20 animate-spin" /></div>;
  }

  const previewConfig = { ...viz.config, title: '', chart_type: viz.chart_type || viz.config?.chart_type };

  return (
    <div className="absolute inset-0 pointer-events-none origin-top overflow-hidden opacity-90 transition-all duration-300">
      <div className="absolute top-[-30px] left-0 right-0 bottom-[-50px]">
        <ChartPreview data={data} config={previewConfig} />
      </div>
    </div>
  );
}

export default function WidgetsPage() {
  const [activeTab, setActiveTab] = useState("widgets"); // "widgets" | "queries"
  const [widgets, setWidgets] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vizData, queryData] = await Promise.all([
        listVisualizations(),
        listSavedQueries()
      ]);
      setWidgets(vizData.visualizations || []);
      setQueries(queryData.queries || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteWidget = async (id, name) => {
    const ok = await confirm({
      title: "Delete Widget?",
      message: `Are you sure you want to delete "${name}"?`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await deleteVisualization(id);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
      toast.success("Widget deleted");
    } catch (err) {
      toast.error("Failed to delete widget");
    }
  };

  const handleDeleteQuery = async (id, name) => {
    const ok = await confirm({
      title: "Delete Query?",
      message: `Are you sure you want to delete "${name}"?`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await deleteSavedQuery(id);
      setQueries((prev) => prev.filter((q) => q.id !== id));
      toast.success("Query deleted");
    } catch (err) {
      toast.error("Failed to delete query");
    }
  };

  const filteredWidgets = widgets.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredQueries = queries.filter((q) =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageContainer wide>
      <div className="flex flex-col gap-6 animate-fade-in w-full pb-20">
        
        {/* Header & Global Actions */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-violet-muted flex items-center justify-center shrink-0 shadow-lg shadow-violet/10">
              <LayoutGrid size={28} className="text-violet" />
            </div>
            <div>
              <h1 className="text-[32px] font-black text-text-primary tracking-tight leading-tight">
                Library
              </h1>
              <p className="text-[15px] text-text-tertiary mt-1 font-medium italic">
                Manage your saved visualizations and queries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group w-full sm:w-72">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-quaternary group-focus-within:text-accent transition-colors"
              />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-bg-raised border border-border-default rounded-2xl text-[14px] text-text-primary placeholder-text-quaternary outline-none focus:border-accent transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Tab Switcher & Context Action */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("widgets")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "widgets" 
                  ? "bg-white/10 text-white" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              Visual Widgets <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/10 text-[10px]">{widgets.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("queries")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "queries" 
                  ? "bg-white/10 text-white" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              Saved Queries <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/10 text-[10px]">{queries.length}</span>
            </button>
          </div>
          
          <Button
            onClick={() => activeTab === 'widgets' ? navigate("/visualize") : navigate("/query")}
            variant="primary"
            icon={<Plus size={18} />}
            className="h-[40px] px-6 text-[14px] font-bold"
          >
            New {activeTab === 'widgets' ? 'Widget' : 'Query'}
          </Button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[320px] rounded-[32px] bg-bg-surface border border-border-muted animate-pulse"
              />
            ))}
          </div>
        ) : activeTab === "widgets" ? (
          filteredWidgets.length === 0 ? (
            <div className="bg-[#0a0a0f] rounded-[40px] border border-white/5 p-16">
              <EmptyState
                icon={LayoutGrid}
                title={searchQuery ? "No widgets found" : "No widgets yet"}
                description={
                  searchQuery
                    ? "Try adjusting your search terms"
                    : "Start by creating your first visualization from a dataset."
                }
                action={() => navigate("/visualize")}
                actionLabel="Create First Widget"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWidgets.map((w) => (
                <div
                  key={w.id}
                  className="group relative flex flex-col bg-[#0a0a0f] rounded-[20px] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-sm overflow-hidden p-5"
                >
                  <div className="flex items-start justify-between mb-4 z-20">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-[14px] bg-[#1a233a] flex items-center justify-center shrink-0">
                        <LayoutGrid size={20} className="text-[#3b82f6]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-[14px] text-white truncate mb-1">
                          {w.name}
                        </h3>
                        <div className="flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider bg-transparent shrink-0 mt-0.5">
                            {w.chart_type?.replace('_', ' ') || 'WIDGET'}
                          </span>
                          <span className="text-[11px] text-white/30 font-mono leading-tight break-all overflow-hidden line-clamp-2">
                            ID: {w.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/visualize?edit=${w.id}`); }}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center"
                        title="Edit Widget"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteWidget(w.id, w.name); }}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-500 transition-all flex items-center justify-center"
                        title="Delete Widget"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-[170px] rounded-[14px] bg-[#0c101a] border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:bg-[#0c101a]/80 transition-colors z-10 cursor-pointer" onClick={() => navigate(`/visualize?edit=${w.id}`)}>
                    <div className="flex flex-col items-center gap-2 text-white/10 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
                      <LayoutGrid size={28} strokeWidth={1.5} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">View Preview</span>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none absolute inset-0">
                      <WidgetThumbnail viz={w} />
                    </div>

                    <div className="absolute bottom-3 right-3 text-[#3b82f6] opacity-80 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                       <ExternalLink size={14} />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/[0.03] flex items-center justify-between text-[11px] text-white/40 z-20">
                    <div className="flex items-center gap-1.5">
                      <Database size={12} className="text-emerald-500" />
                      <span className="font-medium truncate max-w-[150px]">
                        Dataset: {w.dataset_id}
                      </span>
                    </div>
                    <span className="italic font-mono">
                      {new Date(w.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredQueries.length === 0 ? (
            <div className="bg-[#0a0a0f] rounded-[40px] border border-white/5 p-16">
              <EmptyState
                icon={Code2}
                title={searchQuery ? "No queries found" : "No saved queries yet"}
                description={
                  searchQuery
                    ? "Try adjusting your search terms"
                    : "Save your custom SQL queries to reuse them later."
                }
                action={() => navigate("/query")}
                actionLabel="Write New Query"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredQueries.map((q) => (
                <div
                  key={q.id}
                  className="group relative flex flex-col bg-[#0a0a0f] rounded-[20px] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-sm overflow-hidden p-5"
                >
                  <div className="flex items-start justify-between mb-4 z-20">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-[14px] bg-[#2a1b3d] flex items-center justify-center shrink-0">
                        <TerminalSquare size={20} className="text-[#a855f7]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-[14px] text-white truncate mb-1">
                          {q.name}
                        </h3>
                        <div className="flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider bg-transparent shrink-0 mt-0.5">
                            SQL
                          </span>
                          <span className="text-[11px] text-white/30 font-mono leading-tight break-all overflow-hidden line-clamp-2">
                            ID: {q.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/query?edit=${q.id}`); }}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center"
                        title="Open Query"
                      >
                        <ExternalLink size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuery(q.id, q.name); }}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-500 transition-all flex items-center justify-center"
                        title="Delete Query"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-[170px] rounded-[14px] bg-[#0c101a] border border-white/5 relative overflow-hidden group-hover:bg-[#0c101a]/80 transition-colors z-10 cursor-pointer p-4 flex flex-col" onClick={() => navigate(`/query?view=${q.id}`)}>
                    <div className="font-mono text-[10px] md:text-[11px] text-white/30 leading-relaxed overflow-hidden" dangerouslySetInnerHTML={{ __html: (q.sql_text || '').substring(0, 300).replace(/\n/g, '<br/>') + ((q.sql_text || '').length > 300 ? '...' : '') }} />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0c101a] to-transparent" />
                    
                    <div className="absolute bottom-3 right-3 text-[#a855f7] opacity-80 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                       <Code2 size={14} />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/[0.03] flex items-center justify-between text-[11px] text-white/40 z-20">
                    <div className="flex items-center gap-1.5">
                      <Database size={12} className="text-emerald-500" />
                      <span className="font-medium truncate max-w-[150px]">
                        Dataset: {q.dataset_id}
                      </span>
                    </div>
                    <span className="italic font-mono">
                      {new Date(q.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>
    </PageContainer>
  );
}
