import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Database, Search, XCircle, Table2, Play } from "lucide-react";
import SQLEditor from "../components/query/SQLEditor";
import QueryResults from "../components/query/QueryResults";
import SavedQueries from "../components/query/SavedQueries";
import { listDatasets, executeQuery, saveQuery, getDataset } from "../lib/api";
import { Card, PageContainer } from "../components/ui";
import { useToast } from "../components/ui/Toast";

export default function QueryPage() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const preselectedDataset = searchParams.get("dataset");

  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(
    preselectedDataset || "",
  );
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [sqlText, setSqlText] = useState("");
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [savedRefresh, setSavedRefresh] = useState(0);
  const [queryName, setQueryName] = useState("");
  const [currentQueryId, setCurrentQueryId] = useState(null);

  // Resizer
  const [editorHeight, setEditorHeight] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const editorTopRef = useRef(0);

  useEffect(() => {
    listDatasets().then((d) => setDatasets(d.datasets || []));
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      getDataset(selectedDataset)
        .then((ds) => {
          setDatasetInfo(ds);
          if (!sqlText) {
            const tblName = ds.table_name || ds.name || "dataset";
            setSqlText(`SELECT * FROM ${tblName} LIMIT 100`);
          }
        })
        .catch(console.error);
    }
  }, [selectedDataset]);

  const handleExecute = async () => {
    if (!sqlText.trim() || !selectedDataset) return;
    setExecuting(true);
    setError(null);
    try {
      const res = await executeQuery(sqlText, selectedDataset, page, 50);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || "Query execution failed");
      setResult(null);
    } finally {
      setExecuting(false);
    }
  };

  const handlePageChange = async (newPage) => {
    setPage(newPage);
    setExecuting(true);
    try {
      const res = await executeQuery(sqlText, selectedDataset, newPage, 50);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || "Query failed");
    } finally {
      setExecuting(false);
    }
  };

  const handleSave = async () => {
    if (!sqlText.trim() || !selectedDataset || !queryName?.trim()) {
      toast.warning(
        "Please provide a dataset, SQL, and query name before saving.",
      );
      return;
    }
    try {
      await saveQuery({
        name: queryName,
        sql: sqlText,
        dataset_id: String(selectedDataset),
        id: currentQueryId,
      });
      setSavedRefresh((k) => k + 1);
      setQueryName("");
      toast.success("Query saved successfully!");
    } catch {
      toast.error("Failed to save query");
    }
  };

  const handleLoadQuery = (q) => {
    setSqlText(q.sql_text);
    setSelectedDataset(q.dataset_id);
    setQueryName(q.name);
    setCurrentQueryId(q.id);
    setActiveTab("editor");
  };

  // Resizer logic
  const startDrag = (e) => {
    e.preventDefault();
    if (containerRef.current) {
      editorTopRef.current = containerRef.current.getBoundingClientRect().top;
    }
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const newH = Math.max(
        120,
        Math.min(600, e.clientY - editorTopRef.current - 100),
      );
      setEditorHeight(newH);
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  const columns = datasetInfo?.columns?.map((c) => c.name) || [];

  const tabs = [
    { id: "editor", label: "SQL Editor", icon: <Search size={14} /> },
    { id: "saved", label: "Library", icon: <Database size={14} /> },
  ];

  return (
    <PageContainer wide>
      <div
        ref={containerRef}
        className="flex flex-col gap-6 animate-fade-in w-full pb-10"
      >
        {/* Header/Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-6 pt-4">
          <div className="flex items-center gap-6">
            <h1 className="text-[28px] font-black text-text-primary tracking-tight">
              SQL Console
            </h1>

            {/* Tabs */}
            <div
              className="flex items-center gap-1.5 p-1.5 bg-bg-surface border border-border-default rounded-xl shadow-inner"
              style={{
                marginTop: "5px",
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : "text-text-tertiary hover:text-text-secondary hover:bg-bg-muted",
                  ].join(" ")}
                  style={
                    activeTab === tab.id
                      ? {
                          paddingTop: "5px",
                          paddingRight: "10px",
                          paddingBottom: "5px",
                          paddingLeft: "10px",
                        }
                      : {}
                  }
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dataset selector */}
          <div
            className="flex items-center gap-3 bg-bg-raised border border-border-default rounded-xl px-4 py-2.5 shadow-sm hover:border-accent/40 transition-colors"
            style={{ marginTop: "5px", paddingLeft: "20px" }}
          >
            <Database size={16} className="text-accent shrink-0" />
            <div className="relative">
              <select
                value={String(selectedDataset || "")}
                onChange={(e) => {
                  setSelectedDataset(e.target.value);
                  setSqlText("");
                  setResult(null);
                  setCurrentQueryId(null);
                  setQueryName("");
                }}
                className="bg-transparent border-none text-text-primary text-[14px] font-bold outline-none cursor-pointer focus:ring-0 appearance-none min-w-[200px]"
              >
                <option value="" className="bg-bg-base">
                  Choose Source Dataset
                </option>
                {datasets.map((ds) => (
                  <option
                    key={ds.id}
                    value={String(ds.id)}
                    className="bg-bg-base"
                  >
                    {ds.name}
                  </option>
                ))}
              </select>
            </div>
            {datasetInfo && (
              <div className="flex items-center gap-3 border-l border-border-default pl-4">
                <code className="px-2 py-0.5 rounded bg-accent-muted text-accent font-mono text-[11px] font-black uppercase tracking-widest">
                  {datasetInfo.table_name || datasetInfo.name}
                </code>
              </div>
            )}
          </div>
        </div>

        {activeTab === "editor" ? (
          <div className="flex flex-col gap-0 min-h-0">
            {/* SQL Editor */}
            <div
              style={{ height: editorHeight, flexShrink: 0 }}
              className="relative z-10 custom-shadow-lg rounded-2xl border border-border-default overflow-hidden"
            >
              <SQLEditor
                value={sqlText}
                onChange={setSqlText}
                onExecute={handleExecute}
                onSave={handleSave}
                tableName={datasetInfo?.table_name || datasetInfo?.name}
                columns={columns}
                executing={executing}
                queryName={queryName}
                onQueryNameChange={setQueryName}
                height={`${editorHeight}px`}
              />
            </div>

            {/* Resizer */}
            <div
              className={`w-full py-1.5 cursor-ns-resize hover:bg-accent/10 transition-colors flex items-center justify-center group ${isDragging ? "bg-accent/20" : ""}`}
              onMouseDown={startDrag}
            >
              <div className="w-12 h-1 bg-border-strong rounded-full group-hover:bg-accent/50 transition-colors" />
            </div>

            {/* Error Overlay */}
            {error && (
              <div className="p-5 my-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-start gap-4 animate-slide-up">
                <XCircle size={18} className="text-rose mt-0.5 shrink-0" />
                <span className="text-rose font-mono text-[13px] leading-relaxed break-all font-medium">
                  {error}
                </span>
              </div>
            )}

            {/* Results */}
            <div className="mt-4 bg-bg-raised/30 rounded-2xl border border-divider overflow-hidden min-h-[400px] shadow-sm">
              <div className="px-6 py-4 border-b border-divider bg-bg-surface/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Table2 size={16} className="text-text-quaternary" />
                  <span className="text-[14px] font-black text-text-primary uppercase tracking-widest">
                    Query Results
                  </span>
                </div>
                {result && (
                  <span className="text-[12px] text-text-tertiary font-medium">
                    Rows: {result.total?.toLocaleString() || 0}
                  </span>
                )}
              </div>
              <div className="p-0 h-full">
                {result ? (
                  <QueryResults
                    result={result}
                    page={page}
                    onPageChange={handlePageChange}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-text-quaternary gap-4">
                    <Play size={40} className="opacity-20" />
                    <p className="text-[14px] italic">
                      Ready to execute query...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-bg-raised border border-border-default rounded-3xl p-8 animate-fade-in shadow-xl">
            <SavedQueries
              key={savedRefresh}
              datasetId={selectedDataset || undefined}
              onLoadQuery={handleLoadQuery}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
