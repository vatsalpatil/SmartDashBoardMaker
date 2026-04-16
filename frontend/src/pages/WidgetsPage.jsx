import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Plus,
  Search,
  Trash2,
  Edit2,
  Table2,
  ExternalLink,
  Code2,
  TerminalSquare,
  Database,
  Loader2,
} from "lucide-react";
import {
  listVisualizations,
  deleteVisualization,
  listSavedQueries,
  deleteSavedQuery,
  executeQuery,
} from "../lib/api";
import { buildSQL } from "../lib/sqlBuilder";
import ChartPreview from "../components/visualizations/ChartPreview";
import { PageContainer, Button, EmptyState } from "../components/ui";
import { useToast } from "../components/ui/Toast";
import { useConfirm } from "../components/ui/ConfirmDialog";

// ── Always-visible widget thumbnail ──────────────────────────────────────
const WidgetThumbnail = memo(function WidgetThumbnail({ viz }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const localConfig = {
          ...viz.config,
          title: "",
          chart_type: viz.chart_type || viz.config?.chart_type,
        };
        let sql = localConfig.custom_sql;
        const isQueryBased =
          localConfig.source_type === "query" ||
          localConfig.source_query_id ||
          (!localConfig.source_type && localConfig.custom_sql?.includes("AS q"));

        if (isQueryBased) {
          let baseQueryText = localConfig.source_query_sql;
          if (!baseQueryText && localConfig.custom_sql) {
            const match = localConfig.custom_sql.match(/FROM\s+\((.*?)\)\s+AS\s+q/is);
            if (match && match[1]) baseQueryText = match[1].trim();
          }
          if (baseQueryText)
            sql = buildSQL(localConfig, `(${baseQueryText})`, null) || localConfig.custom_sql;
        } else {
          const tableName = `dataset_${viz.dataset_id.replace(/-/g, "_")}`;
          sql = buildSQL(localConfig, { table_name: tableName }, null) || localConfig.custom_sql;
        }

        if (sql) {
          const result = await executeQuery(sql, viz.dataset_id, 1, 50);
          if (mounted) setData(result.rows || []);
        }
      } catch (err) {
        console.error("WidgetThumbnail Error:", err);
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [viz.id]); // Only re-run if widget ID changes

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-bg-surface">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={22} className="text-accent/60 animate-spin" />
          <span className="text-[10px] text-text-tertiary font-medium">Loading preview…</span>
        </div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-surface gap-2">
        <LayoutGrid size={24} strokeWidth={1.5} className="text-text-quaternary/40" />
        <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
          {error ? "Preview Unavailable" : "No Data"}
        </span>
      </div>
    );
  }

  const previewConfig = {
    ...viz.config,
    title: "",
    chart_type: viz.chart_type || viz.config?.chart_type,
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[-20px] left-0 right-0 bottom-[-30px]">
        <ChartPreview data={data} config={previewConfig} />
      </div>
    </div>
  );
});

// ── Main Page ─────────────────────────────────────────────────────────────
export default function WidgetsPage() {
  const [activeTab, setActiveTab] = useState("widgets");
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
        listSavedQueries(),
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
    } catch {
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
    } catch {
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
        {/* Header */}
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
                style={{ left: '16px' }}
                className="absolute top-1/2 -translate-y-1/2 text-text-quaternary group-focus-within:text-accent transition-colors"
                strokeWidth={2}
              />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '48px' }}
                className="w-full pr-4 py-3 bg-bg-raised border border-border-default rounded-2xl text-[14px] text-text-primary placeholder-text-quaternary outline-none focus:border-accent transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("widgets")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "widgets"
                  ? "bg-bg-muted text-text-primary shadow-sm shadow-black/20"
                  : "text-text-tertiary hover:text-text-primary hover:bg-bg-muted/50"
              }`}
            >
              Visual Widgets{" "}
              <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'widgets' ? 'bg-accent/20 text-accent font-black' : 'bg-bg-muted text-text-quaternary'}`}>
                {widgets.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("queries")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "queries"
                  ? "bg-bg-muted text-text-primary shadow-sm shadow-black/20"
                  : "text-text-tertiary hover:text-text-primary hover:bg-bg-muted/50"
              }`}
            >
              Saved Queries{" "}
              <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'queries' ? 'bg-violet/20 text-violet font-black' : 'bg-bg-muted text-text-quaternary'}`}>
                {queries.length}
              </span>
            </button>
          </div>
          <Button
            onClick={() =>
              activeTab === "widgets" ? navigate("/visualize") : navigate("/query")
            }
            variant="primary"
            icon={<Plus size={18} />}
            className="h-[40px] px-6 text-[14px] font-bold"
          >
            New {activeTab === "widgets" ? "Widget" : "Query"}
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[320px] rounded-[20px] bg-bg-surface border border-border-muted animate-pulse"
              />
            ))}
          </div>
        ) : activeTab === "widgets" ? (
          filteredWidgets.length === 0 ? (
            <div className="bg-bg-raised rounded-[40px] border border-border-muted p-16">
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
                  className="group relative flex flex-col bg-bg-surface rounded-[20px] border border-border-muted hover:border-accent/40 transition-all duration-300 shadow-sm overflow-hidden p-5 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 z-20 relative">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-[12px] bg-accent-muted flex items-center justify-center shrink-0">
                        <LayoutGrid size={18} className="text-accent" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-[13px] text-text-primary truncate">{w.name}</h3>
                        <span className="px-2 py-0.5 mt-0.5 rounded border border-border-muted text-[10px] font-bold text-text-tertiary uppercase tracking-wider bg-transparent w-fit">
                          {w.chart_type?.replace("_", " ") || "WIDGET"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/visualize?edit=${w.id}`);
                        }}
                        className="w-7 h-7 rounded-full bg-bg-muted hover:bg-bg-subtle text-text-tertiary hover:text-text-primary transition-all flex items-center justify-center border border-border-muted"
                        title="Edit Widget"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWidget(w.id, w.name);
                        }}
                        className="w-7 h-7 rounded-full bg-bg-muted hover:bg-rose/10 text-text-tertiary hover:text-rose transition-all flex items-center justify-center border border-border-muted"
                        title="Delete Widget"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* ── Always-visible chart preview ── */}
                  <div
                    className="flex-1 min-h-[180px] rounded-[12px] bg-bg-raised border border-border-muted relative overflow-hidden cursor-pointer transition-all duration-300 group-hover:border-accent/30"
                    onClick={() => navigate(`/visualize?edit=${w.id}`)}
                  >
                    <WidgetThumbnail viz={w} />
                    {/* Subtle open icon on hover */}
                    <div className="absolute bottom-2.5 right-2.5 text-accent opacity-0 group-hover:opacity-80 transition-opacity z-20 pointer-events-none">
                      <ExternalLink size={13} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-border-muted flex items-center justify-between text-[11px] text-text-tertiary z-20 relative">
                    <div className="flex items-center gap-1.5">
                      <Database size={11} className="text-emerald-500" />
                      <span className="font-medium truncate max-w-[140px]">
                        {w.dataset_id}
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
        ) : filteredQueries.length === 0 ? (
          <div className="bg-bg-raised rounded-[40px] border border-border-muted p-16">
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
                className="group relative flex flex-col bg-bg-surface rounded-[20px] border border-border-muted hover:border-violet/40 transition-all duration-300 shadow-sm overflow-hidden p-5 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4 z-20">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-[14px] bg-violet-muted flex items-center justify-center shrink-0">
                      <TerminalSquare size={20} className="text-violet" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-bold text-[14px] text-text-primary truncate mb-1">{q.name}</h3>
                      <span className="px-2 py-0.5 rounded border border-border-muted text-[10px] font-bold text-violet-text uppercase tracking-wider bg-violet-muted shrink-0">
                        SQL
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/query?edit=${q.id}`);
                      }}
                      className="w-8 h-8 rounded-full bg-bg-muted hover:bg-bg-subtle text-text-tertiary hover:text-text-primary transition-all flex items-center justify-center border border-border-muted"
                      title="Open Query"
                    >
                      <ExternalLink size={13} className="text-violet" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuery(q.id, q.name);
                      }}
                      className="w-8 h-8 rounded-full bg-bg-muted hover:bg-rose/10 text-text-tertiary hover:text-rose transition-all flex items-center justify-center border border-border-muted"
                      title="Delete Query"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div
                  className="flex-1 min-h-[170px] rounded-[14px] bg-bg-raised border border-border-muted relative overflow-hidden cursor-pointer p-4 flex flex-col hover:border-violet/30 transition-colors"
                  onClick={() => navigate(`/query?view=${q.id}`)}
                >
                  <div
                    className="font-mono text-[10px] md:text-[11px] text-text-tertiary leading-relaxed overflow-hidden"
                    dangerouslySetInnerHTML={{
                      __html:
                        (q.sql_text || "").substring(0, 300).replace(/\n/g, "<br/>") +
                        ((q.sql_text || "").length > 300 ? "..." : ""),
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-raised to-transparent" />
                  <div className="absolute bottom-3 right-3 text-violet opacity-80 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                    <Code2 size={14} />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border-muted flex items-center justify-between text-[11px] text-text-tertiary z-20">
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
        )}
      </div>
    </PageContainer>
  );
}
