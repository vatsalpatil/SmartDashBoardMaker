import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Database,
  Play,
  Save,
  Plus,
  Trash2,
  Code2,
  Copy,
  Layers,
  GitMerge,
  Table2,
  Filter,
  SortAsc,
  SortDesc,
  FunctionSquare,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  GripVertical,
  Download,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Info,
  Zap,
  Lightbulb,
  AlertTriangle,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  listDatasets,
  executeQuery,
  saveQuery,
  getDataset,
  saveQueryAsDataset,
  listSavedQueries,
  deleteSavedQuery,
  getSavedQuery,
  validateQuery,
  exportQueryCSV,
} from "../lib/api";

import QueryResults from "../components/query/QueryResults";
import WhereBuilder, { newGroup } from "../components/query/WhereBuilder";
import HavingBuilder from "../components/query/HavingBuilder";
import CaseBuilder from "../components/query/CaseBuilder";
import UnionBuilder from "../components/query/UnionBuilder";
import NullFunctionsBuilder from "../components/query/NullFunctionsBuilder";
import CteBuilder from "../components/query/CteBuilder";
import WindowFunctionsBuilder from "../components/query/WindowFunctionsBuilder";
import SourceSelector from "../components/visualizations/SourceSelector";
import useDragReorder from "../hooks/useDragReorder";
import { PageContainer } from "../components/ui";
import { useToast } from "../components/ui/Toast";
import CodeViewer from "../components/ui/CodeViewer";

import CodeMirror from "@uiw/react-codemirror";
import { sql, StandardSQL } from "@codemirror/lang-sql";
import { autocompletion } from "@codemirror/autocomplete";
import { buildCompletionSource } from "../components/query/SQLEditor";
import { editorTheme, syntaxExtension } from "../lib/editorTheme";

import {
  uid,
  AGG_FUNCTIONS,
  JOIN_TYPES,
  ColPicker,
  SectionHdr,
  ColSel,
  buildSQL,
  deriveComputedCols,
} from "../lib/queryBuilderUtils";

const TABS = [
  { id: "columns", label: "Columns", icon: Table2, color: "#6366f1" },
  { id: "filters", label: "Filters", icon: Filter, color: "#ec4899" },
  { id: "joins", label: "Joins", icon: GitMerge, color: "#8b5cf6" },
  { id: "advanced", label: "Advanced", icon: Layers, color: "#f97316" },
];

const TEMPLATES = [
  {
    name: "Top 10",
    icon: "🏆",
    tip: "ORDER BY + LIMIT 10",
    apply: (s) => ({
      ...s,
      orderBy: [{ id: uid(), col: "", dir: "DESC" }],
      limit: "10",
    }),
  },
  {
    name: "Count by",
    icon: "📊",
    tip: "GROUP BY + COUNT",
    apply: (s) => ({
      ...s,
      selects: [
        { id: uid(), col: "", alias: "", agg: "" },
        { id: uid(), col: "*", alias: "count", agg: "COUNT" },
      ],
      groupBy: [""],
    }),
  },
  {
    name: "Time Series",
    icon: "📈",
    tip: "Date + SUM",
    apply: (s) => ({
      ...s,
      selects: [
        { id: uid(), col: "", alias: "period", agg: "" },
        { id: uid(), col: "", alias: "total", agg: "SUM" },
      ],
      groupBy: [""],
      orderBy: [{ id: uid(), col: "", dir: "ASC" }],
    }),
  },
];

export default function CustomQueryPage() {
  const [searchParams] = useSearchParams();
  const qParam = searchParams.get("query");
  const toast = useToast();

  const [datasets, setDatasets] = useState([]);
  const [selDS, setSelDS] = useState("");
  const [dsInfo, setDsInfo] = useState(null);

  const [selectDistinct, setSelectDistinct] = useState(false);
  const [selects, setSelects] = useState([
    { id: uid(), col: "*", alias: "", agg: "", _autoAlias: true },
  ]);
  const [cases, setCases] = useState([]);
  const [nullFuncs, setNullFuncs] = useState([]);
  const [winFuncs, setWinFuncs] = useState([]);
  const [joins, setJoins] = useState([]);
  const [wheres, setWheres] = useState([newGroup()]);
  const [groupBy, setGroupBy] = useState([]);
  const [havingConds, setHavingConds] = useState([]);
  const [orderBy, setOrderBy] = useState([]);
  const [limit, setLimit] = useState("200");
  const [offset, setOffset] = useState("");
  const [ctes, setCtes] = useState([]);
  const [unions, setUnions] = useState([]);

  const [activeTab, setActiveTab] = useState("columns");
  const [sqlMode, setSqlMode] = useState(false);
  const [manSQL, setManSQL] = useState("");
  const [result, setResult] = useState(null);
  const [exec, setExec] = useState(false);
  const [err, setErr] = useState(null);
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [qName, setQName] = useState("");
  const [execTime, setExecTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedQueries, setSavedQueries] = useState([]);
  const [currentQueryId, setCurrentQueryId] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [validState, setValidState] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showSQL, setShowSQL] = useState(true);

  // resize
  const [leftW, setLeftW] = useState(460);
  const [sqlPct, setSqlPct] = useState(40);
  const [hDrag, setHDrag] = useState(false);
  const [vDrag, setVDrag] = useState(false);
  const hDragRef = useRef(false);
  const vDragRef = useRef(false);
  const containerRef = useRef(null);
  const rightRef = useRef(null);

  const isTypingSQL = useRef(false);
  const isLoadingRef = useRef(false);
  const isLoadingQuery = useRef(false);

  const selDrag = useDragReorder(selects, setSelects);
  const grpDrag = useDragReorder(groupBy, setGroupBy);
  const ordDrag = useDragReorder(orderBy, setOrderBy);

  useEffect(() => {
    listDatasets().then((d) => setDatasets(d.datasets || []));
    listSavedQueries().then((q) => {
      const qs = q.queries || [];
      setSavedQueries(qs);
      if (qParam && !isLoadingQuery.current) {
        const m = qs.find((i) => i.id === qParam);
        if (m) loadQuery(m);
        else {
          isLoadingQuery.current = true;
          getSavedQuery(qParam)
            .then(loadQuery)
            .finally(() => (isLoadingQuery.current = false));
        }
      }
    });
  }, [qParam]);

  useEffect(() => {
    if (selDS) getDataset(selDS).then(setDsInfo);
    else setDsInfo(null);
  }, [selDS]);

  const onHMove = useCallback((e) => {
    if (!hDragRef.current || !containerRef.current) return;
    const newW = Math.max(320, Math.min(window.innerWidth - 450, e.clientX));
    containerRef.current.style.setProperty("--qb-left-w", `${newW}px`);
  }, []);

  const onVMove = useCallback((e) => {
    if (!vDragRef.current || !containerRef.current || !rightRef.current) return;
    const r = rightRef.current.getBoundingClientRect();
    const pct = Math.max(
      15,
      Math.min(85, ((e.clientY - r.top) / r.height) * 100),
    );
    containerRef.current.style.setProperty("--qb-sql-h", `${pct}%`);
  }, []);

  const onMouseUp = useCallback(() => {
    if (hDragRef.current || vDragRef.current) {
      if (containerRef.current) {
        const style = getComputedStyle(containerRef.current);
        setLeftW(parseInt(style.getPropertyValue("--qb-left-w")));
        setSqlPct(parseInt(style.getPropertyValue("--qb-sql-h")));
      }
      hDragRef.current = false;
      vDragRef.current = false;
      setHDrag(false);
      setVDrag(false);
      document.body.classList.remove("qb-resizing");
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", onHMove);
    document.addEventListener("mousemove", onVMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onHMove);
      document.removeEventListener("mousemove", onVMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [onHMove, onVMove, onMouseUp]);

  const cols = dsInfo?.columns?.map((c) => c.name) || [];
  const tbl = dsInfo?.table_name || dsInfo?.name || "";
  const cteNames = (ctes || []).filter((c) => c.name).map((c) => c.name);
  let allColsSet = new Set([...cols, ...cteNames]);
  joins.forEach((j) => {
    if (!j.table) return;
    const rDS = datasets.find(
      (d) => d.table_name === j.table || d.name === j.table,
    );
    if (rDS) {
      const alias = rDS.name.replace(/[^a-zA-Z0-9_]/g, "_");
      (rDS.columns || []).forEach((c) => {
        allColsSet.add(`${alias}.${c.name}`);
        allColsSet.add(c.name);
      });
    }
  });
  const allCols = Array.from(allColsSet);
  const computedCols = deriveComputedCols({
    selects,
    cases,
    nullFuncs,
    windowFuncs: winFuncs,
  });
  const genSQL = buildSQL({
    tableName: tbl,
    selects,
    joins,
    wheres,
    groupBy,
    havingConds,
    orderBy,
    limit,
    offset,
    ctes,
    windowFuncs: winFuncs,
    unions,
    cases,
    nullFuncs,
    selectDistinct,
    datasets,
  });
  const activeSQL = sqlMode && isTypingSQL.current ? manSQL : genSQL;

  useEffect(() => {
    if (!isTypingSQL.current && !isLoadingRef.current) setManSQL(genSQL);
  }, [genSQL]);

  useEffect(() => {
    if (!activeSQL.trim() || !selDS) {
      setValidState(null);
      return;
    }
    setValidState("checking");
    const t = setTimeout(async () => {
      try {
        const r = await validateQuery(activeSQL, selDS);
        setValidState(r.valid ? "valid" : "invalid");
      } catch {
        setValidState(null);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [activeSQL, selDS]);

  const run = useCallback(async () => {
    if (exec || !activeSQL.trim()) return;
    setExec(true);
    setErr(null);
    setResult(null);
    const t = Date.now();
    try {
      const res = await executeQuery(activeSQL, selDS || undefined, page, 50);
      setResult(res || { rows: [], columns: [] });
      setExecTime(Date.now() - t);
    } catch (e) {
      setErr(e.response?.data?.detail || "Query failed");
    } finally {
      setExec(false);
    }
  }, [exec, activeSQL, selDS, page]);

  const changePage = async (p) => {
    setPage(p);
    setExec(true);
    try {
      const r = await executeQuery(activeSQL, selDS, p, 50);
      setResult(r);
    } catch (e) {
      setErr(e.response?.data?.detail || "");
    } finally {
      setExec(false);
    }
  };

  const save = async (type = "query") => {
    if (!qName.trim() || !activeSQL.trim()) return;
    setIsSaving(true);
    try {
      const config = {
        selects,
        cases,
        nullFuncs,
        joins,
        wheres,
        groupBy,
        havingConds,
        orderBy,
        limit,
        offset,
        ctes,
        winFuncs,
        unions,
        selectDistinct,
      };
      if (type === "dataset") {
        await saveQueryAsDataset(qName, activeSQL, selDS);
        const d = await listDatasets();
        setDatasets(d.datasets || []);
        toast.success("Query saved as new dataset successfully!");
      } else {
        const res = await saveQuery({
          name: qName,
          sql_text: activeSQL,
          dataset_id: selDS || "",
          description: "",
          config: JSON.stringify(config),
          id: currentQueryId,
        });
        if (res?.id) setCurrentQueryId(res.id);
        toast.success("Query saved to library successfully!");
      }
      const qList = await listSavedQueries();
      setSavedQueries(qList.queries || []);
    } catch (e) {
      toast.error("Failed to save: " + (e.response?.data?.detail || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(activeSQL);
    setCopied(true);
    toast.success("SQL copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };
  const doExport = async () => {
    if (!activeSQL.trim() || !selDS) return;
    setIsExporting(true);
    try {
      await exportQueryCSV(activeSQL, selDS);
    } catch (e) {
      setErr("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const loadQuery = (q) => {
    isLoadingRef.current = true;
    setCurrentQueryId(q.id);
    if (q.config) {
      try {
        const c =
          typeof q.config === "string" ? JSON.parse(q.config) : q.config;
        if (c.selects) setSelects(c.selects);
        if (c.joins) setJoins(c.joins);
        if (c.wheres) setWheres(c.wheres);
        if (c.groupBy) setGroupBy(c.groupBy);
        if (c.havingConds) setHavingConds(c.havingConds);
        if (c.orderBy) setOrderBy(c.orderBy);
        if (c.limit !== undefined) setLimit(c.limit);
        if (c.offset !== undefined) setOffset(c.offset);
        if (c.ctes) setCtes(c.ctes);
        if (c.winFuncs) setWinFuncs(c.winFuncs);
        if (c.unions) setUnions(c.unions);
        if (c.cases) setCases(c.cases);
        if (c.nullFuncs) setNullFuncs(c.nullFuncs);
        if (c.selectDistinct !== undefined) setSelectDistinct(c.selectDistinct);
        setSqlMode(false);
      } catch {
        setSqlMode(true);
      }
    } else setSqlMode(true);
    setManSQL(q.sql_text);
    setQName(q.name);
    setSelDS(q.dataset_id);
    isLoadingRef.current = false;
  };

  const clearAll = () => {
    setSelects([{ id: uid(), col: "*", alias: "", agg: "", _autoAlias: true }]);
    setJoins([]);
    setWheres([newGroup()]);
    setGroupBy([]);
    setHavingConds([]);
    setOrderBy([]);
    setLimit("200");
    setOffset("");
    setCtes([]);
    setWinFuncs([]);
    setUnions([]);
    setCases([]);
    setNullFuncs([]);
    setSelectDistinct(false);
    setResult(null);
    setErr(null);
    setQName("");
    setCurrentQueryId(null);
  };

  const updSel = (i, k, v) =>
    setSelects((s) =>
      s.map((x, j) => {
        if (j !== i) return x;
        const next = { ...x, [k]: v };
        if (k === "col" || k === "agg") {
          if (next.col && next.col !== "*") {
            let base = next.col.charAt(0).toUpperCase() + next.col.slice(1);
            if (next.agg) {
              let pref = next.agg.toLowerCase();
              pref =
                pref === "sum"
                  ? "Total"
                  : pref === "avg"
                    ? "Average"
                    : pref.charAt(0).toUpperCase() + pref.slice(1);
              next.alias = pref + base;
            } else next.alias = base;
          }
        }
        return next;
      }),
    );

  const completionSource = useMemo(
    () => buildCompletionSource(tbl, cols),
    [tbl, cols],
  );
  const tabBadge = {
    columns:
      selects.filter((s) => s.col).length +
      cases.length +
      nullFuncs.length +
      winFuncs.length,
    filters:
      (Array.isArray(wheres) ? 1 : wheres?.children?.length || 0) +
      groupBy.filter(Boolean).length +
      orderBy.filter((o) => o.col).length,
    joins: joins.length,
    advanced: ctes.length + unions.length,
  };

  const ValidBadge = () => {
    if (!validState || !activeSQL.trim()) return null;
    if (validState === "checking")
      return <span className="qb-valid-badge checking">● Checking…</span>;
    if (validState === "valid")
      return (
        <span className="qb-valid-badge valid">
          <CheckCircle2 size={10} /> Valid
        </span>
      );
    return (
      <span className="qb-valid-badge invalid">
        <AlertCircle size={10} /> Syntax Error
      </span>
    );
  };

  return (
    <PageContainer fullscreen>
      <div
        className="flex flex-col h-full overflow-hidden bg-bg-base"
        ref={containerRef}
        style={{ "--qb-left-w": `${leftW}px`, "--qb-sql-h": `${sqlPct}%` }}
      >
        <div className="qb-toolbar">
          <Database
            size={15}
            style={{ color: "var(--accent)", flexShrink: 0 }}
          />
          <SourceSelector
            datasets={datasets}
            value={selDS}
            onChange={(val) => {
              setSelDS(val);
              setResult(null);
              setErr(null);
            }}
          />
          {dsInfo && (
            <span
              style={{
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                padding: "2px 8px",
                borderRadius: "99px",
              }}
            >
              {dsInfo.table_name} · {dsInfo.row_count?.toLocaleString()} rows
            </span>
          )}
          <div className="qb-mode-toggle">
            {[
              ["vis", <>◧</>, "Visual"],
              ["sql", <Code2 size={11} />, "SQL"],
            ].map(([m, icon, lbl]) => (
              <button
                key={m}
                className={`qb-mode-btn${(m === "sql" ? sqlMode : !sqlMode) ? " active" : ""}`}
                onClick={() => setSqlMode(m === "sql")}
              >
                {icon} {lbl}
              </button>
            ))}
          </div>
          <button
            className="qb-btn qb-btn--ghost"
            onClick={() => setShowSaved(!showSaved)}
          >
            <BookOpen size={13} /> Saved
          </button>
          <button className="qb-btn qb-btn--ghost" onClick={clearAll}>
            <RotateCcw size={13} />
          </button>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ValidBadge />
            <button
              className="qb-btn qb-btn--run"
              onClick={run}
              disabled={exec || !activeSQL.trim()}
            >
              {exec ? (
                "Running…"
              ) : (
                <>
                  <Play size={13} /> Run
                </>
              )}
            </button>
          </div>
        </div>

        {showSaved && (
          <div
            style={{
              padding: "10px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-card)",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {savedQueries.map((q) => (
              <div
                key={q.id}
                className="qb-saved-item"
                onClick={() => {
                  loadQuery(q);
                  setShowSaved(false);
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                <span>{q.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSavedQuery(q.id).then(() =>
                      setSavedQueries((qs) => qs.filter((x) => x.id !== q.id)),
                    );
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="qb-workspace">
          <div
            className="qb-left-panel"
            style={{ width: "var(--qb-left-w)", opacity: sqlMode ? 0.7 : 1 }}
          >
            <div
              style={{ display: "flex", height: "100%", overflow: "hidden" }}
            >
              {/* Vertical Tab Sidebar */}
              <div className="qb-tabs-v">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    className={`qb-tab-v${activeTab === t.id ? " active" : ""}`}
                    onClick={() => setActiveTab(t.id)}
                    title={t.label}
                  >
                    <t.icon size={18} />
                    <span className="qb-tab-v-label">{t.label}</span>
                    {tabBadge[t.id] > 0 && (
                      <span className="qb-tab-v-badge">{tabBadge[t.id]}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Builder Content Area */}
              <div className="qb-tab-content">
                {activeTab === "columns" && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span className="qb-section-title">SELECT</span>
                      <button
                        className={`qb-distinct-toggle ${selectDistinct ? "on" : "off"}`}
                        onClick={() => setSelectDistinct(!selectDistinct)}
                      >
                        DISTINCT
                      </button>
                    </div>
                    {selects.map((s, i) => (
                      <div key={s.id} className="qb-select-row">
                        <div className="qb-drag-handle">
                          <GripVertical size={11} />
                        </div>
                        <ColPicker
                          value={s.col}
                          onChange={(v) => updSel(i, "col", v)}
                          columns={allCols}
                          dsInfo={dsInfo}
                          allowStar
                        />
                        <select
                          className="qb-select"
                          value={s.agg}
                          onChange={(e) => updSel(i, "agg", e.target.value)}
                        >
                          <option value="">No agg</option>
                          {AGG_FUNCTIONS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                        <input
                          className="qb-input"
                          value={s.alias}
                          onChange={(e) => updSel(i, "alias", e.target.value)}
                          placeholder="alias"
                        />
                        <button
                          className="qb-btn-icon qb-btn-icon--danger"
                          onClick={() =>
                            setSelects((x) => x.filter((_, j) => j !== i))
                          }
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    <button
                      className="qb-add-btn"
                      onClick={() =>
                        setSelects([
                          ...selects,
                          {
                            id: uid(),
                            col: "",
                            alias: "",
                            agg: "",
                            _autoAlias: true,
                          },
                        ])
                      }
                    >
                      <Plus size={12} /> Add Column
                    </button>
                    <div className="qb-section-title" style={{ marginTop: 16 }}>
                      CASE WHEN
                    </div>
                    <CaseBuilder
                      cases={cases}
                      onChange={setCases}
                      columns={allCols}
                    />
                    <div className="qb-section-title" style={{ marginTop: 16 }}>
                      NULL HANDLING
                    </div>
                    <NullFunctionsBuilder
                      nullFuncs={nullFuncs}
                      onChange={setNullFuncs}
                      columns={allCols}
                    />
                    <div className="qb-section-title" style={{ marginTop: 16 }}>
                      WINDOW FUNCTIONS
                    </div>
                    <WindowFunctionsBuilder
                      windowFuncs={winFuncs}
                      onChange={setWinFuncs}
                      columns={allCols}
                    />
                  </>
                )}
                {activeTab === "filters" && (
                  <>
                    <div className="qb-section-title">WHERE</div>
                    <WhereBuilder
                      groups={wheres}
                      onChange={setWheres}
                      columns={allCols}
                      datasetInfo={dsInfo}
                      selectedDataset={selDS}
                      tableName={tbl}
                      ctes={ctes}
                    />
                    <div className="qb-section-title" style={{ marginTop: 16 }}>
                      HAVING
                    </div>
                    <HavingBuilder
                      conditions={havingConds}
                      onChange={setHavingConds}
                      columns={allCols}
                      computedCols={computedCols}
                      selects={selects}
                    />
                    <div className="qb-section-title" style={{ marginTop: 16 }}>
                      GROUP BY
                    </div>
                    {groupBy.map((g, i) => (
                      <div
                        key={i}
                        className="qb-row"
                        style={{ marginBottom: 4, display: "flex", gap: 8 }}
                      >
                        <ColPicker
                          value={g}
                          onChange={(v) =>
                            setGroupBy(groupBy.map((y, j) => (j === i ? v : y)))
                          }
                          columns={allCols}
                          dsInfo={dsInfo}
                        />
                        <button
                          className="qb-btn-icon qb-btn-icon--danger"
                          onClick={() =>
                            setGroupBy(groupBy.filter((_, j) => j !== i))
                          }
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    <button
                      className="qb-add-btn"
                      onClick={() => setGroupBy([...groupBy, ""])}
                    >
                      <Plus size={12} /> Add Group
                    </button>
                    <div className="qb-section-title" style={{ marginTop: 16 }}>
                      ORDER BY
                    </div>
                    {orderBy.map((o, i) => (
                      <div
                        key={o.id}
                        className="qb-row"
                        style={{ marginBottom: 4, display: "flex", gap: 8 }}
                      >
                        <ColPicker
                          value={o.col}
                          onChange={(v) =>
                            setOrderBy(
                              orderBy.map((y, j) =>
                                j === i ? { ...y, col: v } : y,
                              ),
                            )
                          }
                          columns={allCols}
                          dsInfo={dsInfo}
                        />
                        <button
                          className="qb-btn"
                          style={{ minWidth: 50 }}
                          onClick={() =>
                            setOrderBy(
                              orderBy.map((y, j) =>
                                j === i
                                  ? {
                                      ...y,
                                      dir: o.dir === "ASC" ? "DESC" : "ASC",
                                    }
                                  : y,
                              ),
                            )
                          }
                        >
                          {o.dir}
                        </button>
                        <button
                          className="qb-btn-icon qb-btn-icon--danger"
                          onClick={() =>
                            setOrderBy(orderBy.filter((_, j) => j !== i))
                          }
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    <button
                      className="qb-add-btn"
                      onClick={() =>
                        setOrderBy([
                          ...orderBy,
                          { id: uid(), col: "", dir: "ASC" },
                        ])
                      }
                    >
                      <Plus size={12} /> Add Sort
                    </button>
                  </>
                )}
                {activeTab === "joins" && (
                  <>
                    <div className="qb-section-title">JOINS</div>
                    {joins.map((j, i) => (
                      <div key={j.id} className="qb-join-block">
                        <select
                          className="qb-select"
                          value={j.type}
                          onChange={(e) =>
                            setJoins(
                              joins.map((y, n) =>
                                n === i ? { ...y, type: e.target.value } : y,
                              ),
                            )
                          }
                        >
                          {JOIN_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <select
                          className="qb-select"
                          value={j.table}
                          onChange={(e) =>
                            setJoins(
                              joins.map((y, n) =>
                                n === i ? { ...y, table: e.target.value } : y,
                              ),
                            )
                          }
                        >
                          <option value="">Table...</option>
                          {datasets.map((d) => (
                            <option key={d.id} value={d.table_name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <div className="qb-grid-2" style={{ marginTop: 4 }}>
                          <ColPicker
                            value={j.leftCol}
                            onChange={(v) =>
                              setJoins(
                                joins.map((y, n) =>
                                  n === i ? { ...y, leftCol: v } : y,
                                ),
                              )
                            }
                            columns={cols}
                            dsInfo={dsInfo}
                            placeholder="Left col"
                          />
                          <ColPicker
                            value={j.rightCol}
                            onChange={(v) =>
                              setJoins(
                                joins.map((y, n) =>
                                  n === i ? { ...y, rightCol: v } : y,
                                ),
                              )
                            }
                            columns={
                              datasets
                                .find((d) => d.table_name === j.table)
                                ?.columns?.map((c) => c.name) || []
                            }
                            placeholder="Right col"
                          />
                        </div>
                        <button
                          className="qb-btn-icon qb-btn-icon--danger"
                          style={{ marginTop: 4 }}
                          onClick={() =>
                            setJoins(joins.filter((_, n) => n !== i))
                          }
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    <button
                      className="qb-add-btn"
                      onClick={() =>
                        setJoins([
                          ...joins,
                          {
                            id: uid(),
                            type: "INNER JOIN",
                            table: "",
                            leftCol: "",
                            rightCol: "",
                          },
                        ])
                      }
                    >
                      <Plus size={12} /> Add Join
                    </button>
                  </>
                )}
                {activeTab === "advanced" && (
                  <>
                    <div className="qb-section-title">CTEs</div>
                    <CteBuilder
                      ctes={ctes}
                      onChange={setCtes}
                      completions={completionSource}
                    />
                    <div className="qb-section-title" style={{ marginTop: 16 }}>
                      UNIONS
                    </div>
                    <UnionBuilder
                      unions={unions}
                      onChange={setUnions}
                      datasets={datasets}
                      cteNames={cteNames}
                      columns={allCols}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            className={`qb-resize-handle${hDrag ? " active" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              hDragRef.current = true;
              setHDrag(true);
              document.body.classList.add("qb-resizing");
            }}
          />

          <div ref={rightRef} className="qb-right-panel">
            <div className="qb-results-header">
              <button
                className="qb-btn-icon"
                onClick={() => setShowSQL(!showSQL)}
              >
                {showSQL ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <span style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                {sqlMode ? "SQL Editor" : "Generated SQL"}
              </span>
              <div style={{ flex: 1 }} />
              <input
                className="qb-query-name"
                value={qName}
                onChange={(e) => setQName(e.target.value)}
                placeholder="Query name…"
              />
              <button
                className="qb-btn qb-btn--secondary"
                onClick={() => save("query")}
                disabled={isSaving || !qName.trim()}
              >
                <Save size={12} /> Save
              </button>
              <button
                className="qb-btn qb-btn--primary"
                onClick={() => save("dataset")}
                disabled={isSaving || !qName.trim()}
              >
                <Layers size={12} /> Dataset
              </button>
              {result && (
                <button className="qb-btn qb-btn--secondary" onClick={doExport}>
                  <Download size={12} />
                </button>
              )}
            </div>

            {showSQL && (
              <div
                className="qb-sql-panel"
                style={{ height: "var(--qb-sql-h)", flexShrink: 0 }}
              >
                {sqlMode ? (
                  <CodeMirror
                    value={manSQL}
                    onChange={(val) => {
                      isTypingSQL.current = true;
                      setManSQL(val);
                      if (window._tm) clearTimeout(window._tm);
                      window._tm = setTimeout(() => {
                        isTypingSQL.current = false;
                      }, 600);
                    }}
                    extensions={[
                      sql({ dialect: StandardSQL }),
                      autocompletion({ override: [completionSource] }),
                      editorTheme,
                      syntaxExtension,
                    ]}
                    theme="none"
                    height="100%"
                  />
                ) : (
                  <CodeViewer value={activeSQL} language="sql" height="100%" />
                )}
              </div>
            )}

            {showSQL && (
              <div
                className={`qb-resize-handle-v${vDrag ? " active" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  vDragRef.current = true;
                  setVDrag(true);
                  document.body.classList.add("qb-resizing");
                }}
              />
            )}

            <div className="qb-results-body">
              {err && (
                <div className="qb-error">
                  <AlertCircle size={14} /> {err}
                </div>
              )}
              {exec && (
                <div className="qb-empty">
                  <div className="spinner spinner-lg" />
                </div>
              )}
              {result && !exec && (
                <QueryResults
                  result={result}
                  page={page}
                  onPageChange={changePage}
                />
              )}
            </div>
          </div>
        </div>
        <div className="qb-status-bar">
          <span>{tbl || "No dataset selected"}</span>
          <span style={{ marginLeft: "auto" }}>
            Shift+Enter to run · {execTime ? `${execTime}ms` : ""}
          </span>
        </div>
      </div>
    </PageContainer>
  );
}
