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
import { Parser } from "node-sql-parser";

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

const SQL_SYNC_AGGS = new Set(AGG_FUNCTIONS);

function cleanSqlIdentifier(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^["'`]|["'`]$/g, "");
}


function readColumnRef(expr) {
  if (!expr) return "";

  function deepExtract(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    if (typeof obj !== "object") return String(obj);
    if (Array.isArray(obj)) return deepExtract(obj[0]);
    if (obj.expr) return deepExtract(obj.expr);
    if (obj.column && typeof obj.column !== "function") return deepExtract(obj.column);
    if (obj.value !== undefined) return deepExtract(obj.value);
    if (obj.name) return deepExtract(obj.name);
    return "";
  }

  const rawCol = deepExtract(expr);
  if (rawCol === "*") return "*";
  if (!rawCol) return "";

  // Handle table prefix if present in the top-level expression
  let tbl = "";
  if (expr.table) {
    tbl = deepExtract(expr.table);
  }

  const cleanCol = cleanSqlIdentifier(rawCol);
  const cleanTbl = cleanSqlIdentifier(tbl);

  return cleanTbl ? `${cleanTbl}.${cleanCol}` : cleanCol;
}


function readLiteral(expr) {
  if (!expr) return "";
  if (expr.type === "number") return String(expr.value);
  if (
    expr.type === "string" ||
    expr.type === "single_quote_string" ||
    expr.type === "double_quote_string"
  ) {
    const val = expr.value ?? "";
    return typeof val === "object" ? "" : String(val);
  }
  if (expr.type === "bool") return String(expr.value);
  if (expr.type === "null") return "NULL";
  return "";
}


function parseSelectColumn(column) {
  if (!column?.expr) return null;
  const alias = cleanSqlIdentifier(column.as || "");
  if (column.expr.type === "column_ref") {
    return {
      id: uid(),
      col: readColumnRef(column.expr),
      agg: "",
      alias,
      _autoAlias: false,
    };
  }
  if (column.expr.type === "star") {
    return { id: uid(), col: "*", agg: "", alias, _autoAlias: false };
  }
  if (column.expr.type === "aggr_func") {
    const aggName = String(column.expr.name || "").toUpperCase();
    const isDistinct =
      aggName === "COUNT" &&
      column.expr.args &&
      !Array.isArray(column.expr.args) &&
      column.expr.args.distinct === "DISTINCT";
    const agg = isDistinct ? "COUNT DISTINCT" : aggName;
    if (!SQL_SYNC_AGGS.has(agg)) return null;
    const argExpr = Array.isArray(column.expr.args)
      ? column.expr.args[0]?.expr || column.expr.args[0]
      : column.expr.args?.expr || column.expr.args;
    const col = readColumnRef(argExpr);
    return {
      id: uid(),
      col: col || "*",
      agg,
      alias,
      _autoAlias: false,
    };
  }
  return null;
}

function parseCaseExpr(expr, alias) {
  if (!expr || expr.type !== "case") return null;
  const whens = (expr.args || []).map((arg) => {
    if (arg.type !== "when") return null;
    let col = "";
    let op = "=";
    let val = "";
    const cond = arg.cond;
    if (cond) {
      if (cond.type === "binary_expr") {
        col = readColumnRef(cond.left);
        op = String(cond.operator || "=").toUpperCase();
        val = readLiteral(cond.right) || readColumnRef(cond.right);
      } else {
        col = readColumnRef(cond);
      }
    }
    return {
      id: uid(),
      col,
      op,
      val,
      then: readLiteral(arg.result) || readColumnRef(arg.result),
    };
  }).filter(Boolean);

  return {
    id: uid(),
    alias,
    whens: whens.length ? whens : [{ id: uid(), col: "", op: "=", val: "", then: "" }],
    elseVal: readLiteral(expr.else) || readColumnRef(expr.else) || "NULL",
  };
}

function parseNullFuncExpr(expr, alias) {
  if (!expr || expr.type !== "function") return null;
  const fn = String(expr.name?.name?.[0]?.value || expr.name || "").toUpperCase();
  const args = Array.isArray(expr.args) ? expr.args : (expr.args?.value || []);
  
  if (fn === "COALESCE") {
    const cols = args.map(a => readColumnRef(a) || readLiteral(a)).filter(Boolean);
    return {
      id: uid(),
      func: "COALESCE",
      alias,
      cols: cols.length > 1 ? cols.slice(0, -1) : cols,
      fallback: cols.length > 1 ? cols[cols.length - 1] : "",
    };
  }
  if (fn === "IFNULL" || fn === "NVL") {
    return {
      id: uid(),
      func: "IFNULL",
      alias,
      col: readColumnRef(args[0]),
      fallback: readLiteral(args[1]) || readColumnRef(args[1]),
    };
  }
  if (fn === "NULLIF") {
    return {
      id: uid(),
      func: "NULLIF",
      alias,
      col: readColumnRef(args[0]),
      val: readLiteral(args[1]) || readColumnRef(args[1]),
    };
  }
  if (fn === "IIF") {
    return {
      id: uid(),
      func: "IIF",
      alias,
      condition: "", 
      thenVal: readLiteral(args[1]) || readColumnRef(args[1]),
      elseVal: readLiteral(args[2]) || readColumnRef(args[2]),
    };
  }
  return null;
}

function parseWindowFuncExpr(expr, alias) {
  if (!expr || !expr.over) return null;
  const fnName = String(expr.name?.name?.[0]?.value || expr.name || "").toUpperCase();
  const isAgg = ["SUM", "AVG", "COUNT", "MIN", "MAX"].includes(fnName);
  
  const col = isAgg ? readColumnRef(expr.args?.[0]?.expr || expr.args?.[0]) : "";
  const partBy = expr.over.partitionby?.[0] ? readColumnRef(expr.over.partitionby[0]) : "";
  const orderByEntry = expr.over.orderby?.[0];
  const orderBy = orderByEntry ? readColumnRef(orderByEntry.expr) : "";
  const dir = orderByEntry ? (orderByEntry.type || "ASC") : "ASC";
  
  return {
    id: uid(),
    func: isAgg ? fnName : `${fnName}()`,
    alias,
    col,
    partBy,
    orderBy,
    dir,
    frameType: "",
    frameStart: "",
    frameEnd: ""
  };
}


function parseJoinCondition(onExpr, joinAlias) {
  if (!onExpr || onExpr.type !== "binary_expr" || onExpr.operator !== "=") {
    return { leftCol: "", rightCol: "" };
  }
  const left = onExpr.left;
  const right = onExpr.right;
  if (left?.type !== "column_ref" || right?.type !== "column_ref") {
    return { leftCol: "", rightCol: "" };
  }

  const leftIsJoin =
    cleanSqlIdentifier(left.table) === cleanSqlIdentifier(joinAlias);
  const rightIsJoin =
    cleanSqlIdentifier(right.table) === cleanSqlIdentifier(joinAlias);

  if (leftIsJoin && !rightIsJoin) {
    return { leftCol: right.column || "", rightCol: left.column || "" };
  }
  return { leftCol: left.column || "", rightCol: right.column || "" };
}

function parseWhereNode(node, logicBefore = "AND") {
  if (!node) return null;

  if (
    node.type === "binary_expr" &&
    (node.operator === "AND" || node.operator === "OR")
  ) {
    const left = parseWhereNode(node.left, "AND");
    const right = parseWhereNode(node.right, node.operator);
    const children = [left, right].filter(Boolean);
    if (!children.length) return null;
    return {
      id: uid(),
      type: "group",
      logicBefore,
      children,
    };
  }

  if (node.type !== "binary_expr") return null;

  const column = readColumnRef(node.left);
  if (!column) return null;

  const op = String(node.operator || "").toUpperCase();
  const baseRule = {
    id: uid(),
    type: "rule",
    logicBefore,
    col: column,
    op,
    val: "",
    not: false,
  };

  if (op === "IS" && node.right?.type === "null") {
    return { ...baseRule, op: "IS NULL" };
  }
  if (op === "IS NOT" && node.right?.type === "null") {
    return { ...baseRule, op: "IS NOT NULL" };
  }
  if (op === "BETWEEN" || op === "NOT BETWEEN") {
    const values = node.right?.value?.map(readLiteral).filter(Boolean) || [];
    return { ...baseRule, op, val: values.join(",") };
  }
  if (op === "IN" || op === "NOT IN") {
    const values =
      node.right?.value?.map(readLiteral).filter((v) => v !== "") || [];
    return { ...baseRule, op, val: values.join(", ") };
  }
  if (node.right?.type === "column_ref") {
    return {
      ...baseRule,
      valType: "column",
      val: readColumnRef(node.right),
    };
  }

  return {
    ...baseRule,
    op,
    val: readLiteral(node.right),
  };
}

function flattenHavingNode(node, logic = "AND", result = []) {
  if (!node) return result;
  if (
    node.type === "binary_expr" &&
    (node.operator === "AND" || node.operator === "OR")
  ) {
    flattenHavingNode(node.left, result.length === 0 ? "AND" : logic, result);
    flattenHavingNode(node.right, node.operator, result);
    return result;
  }
  result.push({ node, logic });
  return result;
}

function parseHavingCondition(entry) {
  const node = entry?.node;
  if (!node || node.type !== "binary_expr") return null;
  if (node.left?.type !== "aggr_func") return null;

  const aggName = String(node.left.name || "").toUpperCase();
  const isDistinct =
    aggName === "COUNT" &&
    node.left.args &&
    !Array.isArray(node.left.args) &&
    node.left.args.distinct === "DISTINCT";
  const aggFunc = isDistinct ? "COUNT DISTINCT" : aggName;
  if (!SQL_SYNC_AGGS.has(aggFunc)) return null;

  const argExpr = Array.isArray(node.left.args)
    ? node.left.args[0]?.expr || node.left.args[0]
    : node.left.args?.expr || node.left.args;
  const col = readColumnRef(argExpr) || "*";
  const op = String(node.operator || "").toUpperCase();

  if (node.right?.type === "column_ref") {
    return {
      id: uid(),
      aggFunc,
      col,
      op,
      valType: "column",
      val: readColumnRef(node.right),
      condLogic: entry.logic,
    };
  }

  if (op === "BETWEEN") {
    const values = node.right?.value?.map(readLiteral).filter(Boolean) || [];
    return {
      id: uid(),
      aggFunc,
      col,
      op,
      val: values.join(","),
      condLogic: entry.logic,
    };
  }

  return {
    id: uid(),
    aggFunc,
    col,
    op,
    val: readLiteral(node.right),
    condLogic: entry.logic,
  };
}

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
  // resize
  const [leftW, setLeftW] = useState(460);
  const [sqlPct, setSqlPct] = useState(40);
  const [hDrag, setHDrag] = useState(false);
  const [vDrag, setVDrag] = useState(false);
  const hDragRef = useRef(false);
  const vDragRef = useRef(false);
  const containerRef = useRef(null);
  const rightRef = useRef(null);

  const [mode, setMode] = useState("ui"); // "ui" | "sql"
  const typingTimer = useRef(null);
  const isLoadingRef = useRef(false);
  const isLoadingQuery = useRef(null);

  // Authority Wrappers: Ensuring every UI change re-claims authority from SQL
  const uSelects = (v) => {
    setMode("ui");
    setSelects(v);
  };
  const uJoins = (v) => {
    setMode("ui");
    setJoins(v);
  };
  const uWheres = (v) => {
    setMode("ui");
    setWheres(v);
  };
  const uGroupBy = (v) => {
    setMode("ui");
    setGroupBy(v);
  };
  const uHaving = (v) => {
    setMode("ui");
    setHavingConds(v);
  };
  const uOrderBy = (v) => {
    setMode("ui");
    setOrderBy(v);
  };
  const uLimit = (v) => {
    setMode("ui");
    setLimit(v);
  };
  const uOffset = (v) => {
    setMode("ui");
    setOffset(v);
  };
  const uCtes = (v) => {
    setMode("ui");
    setCtes(v);
  };
  const uWinFuncs = (v) => {
    setMode("ui");
    setWinFuncs(v);
  };
  const uUnions = (v) => {
    setMode("ui");
    setUnions(v);
  };
  const uCases = (v) => {
    setMode("ui");
    setCases(v);
  };
  const uNullFuncs = (v) => {
    setMode("ui");
    setNullFuncs(v);
  };
  const uDS = (v) => {
    setMode("ui");
    setSelDS(v);
  };
  const uDistinct = (v) => {
    setMode("ui");
    setSelectDistinct(v);
  };

  const selDrag = useDragReorder(selects, uSelects);
  const grpDrag = useDragReorder(groupBy, uGroupBy);
  const ordDrag = useDragReorder(orderBy, uOrderBy);

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
  const activeSQL = manSQL;

  const syncSQLToUI = useCallback(
    (sqlText) => {
      if (!sqlText || !sqlText.trim() || isLoadingRef.current) return;
      try {
        const parser = new Parser();
        let ast;
        try {
          ast = parser.astify(sqlText, { database: "postgresql" });
        } catch {
          ast = parser.astify(sqlText);
        }
        const parsed = Array.isArray(ast) ? ast[0] : ast;
        
        // Critical: Only update UI if we have a valid SELECT query and a table source
        // This prevents the editor from resetting while the user is typing (e.g., mid-FROM clause)
        if (!parsed || parsed.type !== "select" || !parsed.from) {
          return;
        }

        // 1. Primary Extraction: Regex (High Reliability for simple columns)
        const regexSelects = [];
        const selMatch = sqlText.match(/SELECT\s+(DISTINCT\s+)?(.+?)\s+FROM/is);
        if (selMatch) {
          const rawCols = selMatch[2].split(/,(?![^(]*\))/); 
          rawCols.forEach((c) => {
            const parts = c.trim().split(/\s+AS\s+/i);
            const raw = parts[0].trim();
            const alias = parts[1] ? cleanSqlIdentifier(parts[1]) : "";

            let agg = "";
            let col = raw;
            const aggMatch = raw.match(/^([a-zA-Z_ ]+)\(([\s\S]+)\)$/i);
            if (aggMatch) {
              const fn = aggMatch[1].trim().toUpperCase();
              if (SQL_SYNC_AGGS.has(fn)) {
                agg = fn;
                col = cleanSqlIdentifier(aggMatch[2]);
              }
            } else {
              col = cleanSqlIdentifier(raw);
            }
            if (col && !raw.toUpperCase().includes("CASE") && !raw.toUpperCase().includes("OVER") && !raw.toUpperCase().includes("COALESCE")) {
              regexSelects.push({ id: uid(), col, agg, alias, _autoAlias: false });
            }
          });
        }

        const mainFrom = parsed.from?.[0];
        const mainTable = cleanSqlIdentifier(mainFrom?.table || "");

        // Categorize parsed columns from AST
        const nextSelects = [];
        const nextCases = [];
        const nextNullFuncs = [];
        const nextWinFuncs = [];

        if (parsed.columns) {
          parsed.columns.forEach((colObj) => {
            const expr = colObj.expr;
            const alias = cleanSqlIdentifier(colObj.as || "");

            if (expr?.over) {
              const wf = parseWindowFuncExpr(expr, alias);
              if (wf && wf.alias !== "[object Object]") nextWinFuncs.push(wf);
              return;
            }
            if (expr?.type === "case") {
              const cf = parseCaseExpr(expr, alias);
              if (cf && cf.alias !== "[object Object]") nextCases.push(cf);
              return;
            }
            if (expr?.type === "function") {
              const nf = parseNullFuncExpr(expr, alias);
              if (nf && nf.alias !== "[object Object]") {
                nextNullFuncs.push(nf);
                return;
              }
            }
            const sel = parseSelectColumn(colObj);
            if (sel && sel.col && typeof sel.col === "string" && !sel.col.includes("[object Object]")) {
              nextSelects.push(sel);
            }
          });
        }

        const parsedWheres = parseWhereNode(parsed.where);
        const parsedHaving = flattenHavingNode(parsed.having).map(parseHavingCondition).filter(Boolean);
        const parsedJoins = parsed.from?.slice(1).map((item) => {
          const { leftCol, rightCol } = parseJoinCondition(item.on, item.as || item.table);
          return { id: uid(), type: item.join || "INNER JOIN", table: cleanSqlIdentifier(item.table || ""), leftCol, rightCol };
        }).filter((join) => join.table) || [];
        
        const parsedGroupBy = parsed.groupby?.columns?.map((expr) => readColumnRef(expr)).filter((v) => v && typeof v === "string" && !v.includes("[object Object]")) || [];
        const parsedOrderBy = parsed.orderby?.map((item) => ({ id: uid(), col: readColumnRef(item.expr), dir: item.type || "ASC" })).filter((item) => item.col && typeof item.col === "string" && !item.col.includes("[object Object]")) || [];

        // Only switch dataset if the new one definitely exists
        if (mainTable) {
          const match = datasets.find(d => d.table_name === mainTable || d.name === mainTable);
          if (match && match.id !== selDS) {
            setSelDS(match.id);
          }
        }

        // Apply all state changes only if we reached this point (likely valid query)
        setSelects(nextSelects.length ? nextSelects : regexSelects.length ? regexSelects : [{ id: uid(), col: "*", alias: "", agg: "", _autoAlias: true }]);
        setJoins(parsedJoins);
        setWheres(parsedWheres ? [parsedWheres] : [newGroup()]);
        setGroupBy(parsedGroupBy);
        setHavingConds(parsedHaving);
        setOrderBy(parsedOrderBy);
        setSelectDistinct(!!parsed.distinct);
        setLimit(parsed.limit?.value?.[0]?.value !== undefined ? String(parsed.limit.value[0].value) : "");
        setOffset(parsed.limit?.value?.[1]?.value !== undefined ? String(parsed.limit.value[1].value) : "");
        setCases(nextCases);
        setNullFuncs(nextNullFuncs);
        setWinFuncs(nextWinFuncs);
        setCtes([]);
        setUnions([]);
      } catch (e) {
        // Silently wait for the user to finish typing valid SQL
      }
    },
    [datasets, selDS],
  );


  useEffect(() => {
    if (mode === "ui" && !isLoadingRef.current) {
      setManSQL(genSQL);
    }
  }, [genSQL, mode]);

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

  useEffect(() => {
    if (mode === "sql") {
      const t = setTimeout(() => {
        syncSQLToUI(manSQL);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [manSQL, mode, syncSQLToUI]);

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
      const uWheres = (ws) => {
        setMode("ui");
        setWheres(ws);
      };
      const uGroups = (gs) => {
        setMode("ui");
        setGroupBy(gs);
      };
      const uOrders = (os) => {
        setMode("ui");
        setOrderBy(os);
      };
      const uCases = (cs) => {
        setMode("ui");
        setCases(cs);
      };
      const uNulls = (ns) => {
        setMode("ui");
        setNullFuncs(ns);
      };
      const uWins = (ws) => {
        setMode("ui");
        setWinFuncs(ws);
      };
      const uSelects = (ss) => {
        setMode("ui");
        setSelects(ss);
      };
      const uJoins = (js) => {
        setMode("ui");
        setJoins(js);
      };
      const uCtes = (cs) => {
        setMode("ui");
        setCtes(cs);
      };
      const uUnions = (us) => {
        setMode("ui");
        setUnions(us);
      };
      const uDS = (id) => {
        setMode("ui");
        setSelDS(id);
      };
      const uDistinct = (v) => {
        setMode("ui");
        setSelectDistinct(v);
      };
      const uLimit = (v) => {
        setMode("ui");
        setLimit(v);
      };
      const uOffset = (v) => {
        setMode("ui");
        setOffset(v);
      };
      const uHaving = (v) => {
        setMode("ui");
        setHavingConds(v);
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
      toast.error(
        "Failed to save: " + (e.response?.data?.detail || "Unknown error"),
      );
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

  const setUIMode = () => setMode("ui");
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
      } catch (e) {
        console.error("Config parse error", e);
        setManSQL(q.sql_text);
      }
    } else {
      setManSQL(q.sql_text);
    }
    setQName(q.name);
    setSelDS(q.dataset_id);
    setMode("ui");
    isLoadingRef.current = false;
  };

  const clearAll = () => {
    setMode("ui");
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

  const updSel = (i, k, v) => {
    setMode("ui");
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
  };

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
      <>
        <div
          className="flex flex-col h-full overflow-hidden bg-bg-base outline-none"
          ref={containerRef}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.shiftKey || e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              run();
            }
          }}
          tabIndex={-1}
          style={{ "--qb-left-w": `${leftW}px`, "--qb-sql-h": `${sqlPct}%` }}
        >
          <div className="qb-toolbar">
            <Database
              size={15}
              style={{ color: "var(--accent)", flexShrink: 0 }}
            />
            <div className="flex-1 max-w-[320px]">
              <SourceSelector
                datasets={datasets}
                value={selDS}
                onChange={(val) => {
                  setMode("ui");
                  setSelDS(val);
                  setResult(null);
                  setErr(null);
                }}
              />
            </div>
            {dsInfo && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-muted border border-border-default shrink-0">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  {dsInfo.table_name}
                </span>
                <span className="w-1 h-1 rounded-full bg-border-strong" />
                <span className="text-[10px] font-bold text-emerald tracking-wide">
                  {dsInfo.row_count?.toLocaleString()} rows
                </span>
              </div>
            )}
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
                        setSavedQueries((qs) =>
                          qs.filter((x) => x.id !== q.id),
                        ),
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
              style={{ width: "var(--qb-left-w)" }}
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
                          onClick={() => {
                            setMode("ui");
                            setSelectDistinct(!selectDistinct);
                          }}
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
                              uSelects(selects.filter((_, j) => j !== i))
                            }
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="qb-add-btn"
                        onClick={() =>
                          uSelects([
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
                      <div
                        className="qb-section-title"
                        style={{ marginTop: 16 }}
                      >
                        CASE WHEN
                      </div>
                      <CaseBuilder
                        cases={cases}
                        onChange={uCases}
                        columns={allCols}
                      />
                      <div
                        className="qb-section-title"
                        style={{ marginTop: 16 }}
                      >
                        NULL HANDLING
                      </div>
                      <NullFunctionsBuilder
                        nullFuncs={nullFuncs}
                        onChange={uNullFuncs}
                        columns={allCols}
                      />
                      <div
                        className="qb-section-title"
                        style={{ marginTop: 16 }}
                      >
                        WINDOW FUNCTIONS
                      </div>
                      <WindowFunctionsBuilder
                        windowFuncs={winFuncs}
                        onChange={uWinFuncs}
                        columns={allCols}
                      />
                    </>
                  )}
                  {activeTab === "filters" && (
                    <>
                      <div className="qb-section-title">WHERE</div>
                      <WhereBuilder
                        groups={wheres}
                        onChange={uWheres}
                        columns={allCols}
                        datasetInfo={dsInfo}
                        selectedDataset={selDS}
                        tableName={tbl}
                        ctes={ctes}
                      />
                      <div
                        className="qb-section-title"
                        style={{ marginTop: 16 }}
                      >
                        HAVING
                      </div>
                      <HavingBuilder
                        conditions={havingConds}
                        onChange={uHaving}
                        columns={allCols}
                        computedCols={computedCols}
                        selects={selects}
                      />
                      <div
                        className="qb-section-title"
                        style={{ marginTop: 16 }}
                      >
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
                              uGroupBy(groupBy.map((y, j) => (j === i ? v : y)))
                            }
                            columns={allCols}
                            dsInfo={dsInfo}
                          />
                          <button
                            className="qb-btn-icon qb-btn-icon--danger"
                            onClick={() =>
                              uGroupBy(groupBy.filter((_, j) => j !== i))
                            }
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="qb-add-btn"
                        onClick={() => uGroupBy([...groupBy, ""])}
                      >
                        <Plus size={12} /> Add Group
                      </button>
                      <div
                        className="qb-section-title"
                        style={{ marginTop: 16 }}
                      >
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
                              uOrderBy(
                                orderBy.map((y, j) =>
                                  j === i ? { ...y, col: v } : y,
                                ),
                              )
                            }
                            columns={allCols}
                            dsInfo={dsInfo}
                          />
                          <button
                            className="qb-btn qb-btn--ghost qb-sort-dir"
                            onClick={() =>
                              uOrderBy(
                                orderBy.map((y, j) =>
                                  j === i
                                    ? {
                                        ...y,
                                        dir: y.dir === "ASC" ? "DESC" : "ASC",
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
                              uOrderBy(orderBy.filter((_, j) => j !== i))
                            }
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="qb-add-btn"
                        onClick={() =>
                          uOrderBy([
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
                              uJoins(
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
                              uJoins(
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
                                uJoins(
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
                                uJoins(
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
                            className="qb-btn-icon qb-btn-icon--danger qb-join-del"
                            onClick={() =>
                              uJoins(joins.filter((_, j) => j !== i))
                            }
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="qb-add-btn"
                        onClick={() =>
                          uJoins([
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
                      <div className="qb-section-title">CTES (WITH)</div>
                      <CteBuilder ctes={ctes} onChange={uCtes} />
                      <div
                        className="qb-section-title"
                        style={{ marginTop: 16 }}
                      >
                        UNIONS
                      </div>
                      <UnionBuilder
                        unions={unions}
                        onChange={uUnions}
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
                  SQL Editor
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
                  <button
                    className="qb-btn qb-btn--secondary"
                    onClick={doExport}
                  >
                    <Download size={12} />
                  </button>
                )}
              </div>

              {showSQL && (
                <div
                  className="qb-sql-panel"
                  style={{ height: "var(--qb-sql-h)", flexShrink: 0 }}
                >
                  <CodeMirror
                    value={manSQL}
                    onChange={(val) => {
                      setMode("sql");
                      setManSQL(val);
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

        <style>{`
        .qb-mode-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
        .qb-valid-badge { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; }
        .qb-valid-badge.checking { background: #333; color: #888; }
        .qb-valid-badge.valid { background: #065f46; color: #34d399; }
        .qb-valid-badge.invalid { background: #991b1b; color: #f87171; }
      `}</style>
      </>
    </PageContainer>
  );
}
