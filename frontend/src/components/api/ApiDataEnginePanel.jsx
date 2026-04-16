/**
 * ApiDataEnginePanel
 * Self-contained panel that brings the full API Data Engine workflow
 * (Playground → Schema Mapper → Live Transform & Preview) into any parent page.
 * Mirrors the logic from ApiIntegrationPage but rendered inline.
 */
import { useState, useCallback, useEffect } from "react";
import {
  PlugZap,
  ChevronDown,
  FlaskConical,
  CheckCircle2,
  Settings2,
  Braces,
  SlidersHorizontal,
  Globe,
  History,
  Clock,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";
import { uploadDataset, listDatasets } from "../../lib/api";

import {
  EXAMPLES,
  applyTransforms,
  extractByPath,
  extractRows,
  buildSchema,
} from "./shared";
import ApiPlayground from "./ApiPlayground";
import ResponseViewer from "./ResponseViewer";
import SchemaMapper from "./SchemaMapper";
import DataExplorer from "./DataExplorer";

const MAX_HISTORY = 10;

function statusText(code) {
  const map = {
    200: "OK", 201: "Created", 204: "No Content",
    400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
    404: "Not Found", 500: "Internal Server Error",
    502: "Bad Gateway", 503: "Service Unavailable",
  };
  return map[code] || "";
}

function statusBadgeText(code) {
  if (!code) return "ERR";
  if (code >= 200 && code < 300) return `${code} OK`;
  if (code >= 300 && code < 400) return `${code} Redirect`;
  if (code >= 400 && code < 500) return `${code} Client Error`;
  return `${code} Server Error`;
}

function methodColor(method) {
  const m = {
    GET: "text-blue-400 bg-blue-400/10",
    POST: "text-emerald-400 bg-emerald-400/10",
    PUT: "text-amber-400 bg-amber-400/10",
    PATCH: "text-orange-400 bg-orange-400/10",
    DELETE: "text-rose-400 bg-rose-400/10",
  };
  return m[method] || "text-text-secondary bg-bg-raised";
}

const STEPS = [
  { id: 1, label: "API Playground", icon: Settings2 },
  { id: 2, label: "Schema Mapper", icon: Braces },
  { id: 3, label: "Live Transform & Preview", icon: SlidersHorizontal },
];

export default function ApiDataEnginePanel() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [isSavingDataset, setIsSavingDataset] = useState(false);
  const [useProxy, setUseProxy] = useState(true);

  // -- Playground State --
  const [cfg, setCfg] = useState({
    name: "",
    url: "",
    method: "GET",
    authType: "None",
    authKey: "", authVal: "", authHeader: "X-API-Key",
    basicUser: "", basicPass: "",
    contentType: "application/json",
    body: "",
    headers: [],
    params: [],
  });

  // -- Execution State --
  const [loading, setLoading] = useState(false);
  const [rawResp, setRawResp] = useState(null);
  const [respErr, setRespErr] = useState(null);
  const [respMs, setRespMs] = useState(null);
  const [respStatus, setRespStatus] = useState(null);
  const [respSize, setRespSize] = useState(null);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showEx, setShowEx] = useState(false);
  
  const [savedApis, setSavedApis] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [savedApiSearch, setSavedApiSearch] = useState("");
  const [existingId, setExistingId] = useState(null);

  // -- Data Extraction & Schema State --
  const [dataPath, setDataPath] = useState("");
  const [srcRows, setSrcRows] = useState([]);
  const [cols, setCols] = useState([]);

  // -- Transform State --
  const [filters, setFilters] = useState([{ column: "", op: "contains", value: "", active: true }]);
  const [filterLogic, setFilterLogic] = useState("AND");
  const [sort] = useState({ column: "", dir: "asc" });
  const [previewData, setPreviewData] = useState([]);

  // Auto-apply transforms
  useEffect(() => {
    if (step >= 3 && srcRows.length > 0 && cols.length > 0) {
      setPreviewData(applyTransforms(srcRows, cols, filters, sort, filterLogic));
    }
  }, [srcRows, cols, filters, sort, filterLogic, step]);

  const updateConfig = (patch) => setCfg((c) => ({ ...c, ...patch }));

  const fetchApi = useCallback(async () => {
    if (!cfg.url.trim()) return;
    setLoading(true);
    setRespErr(null);
    setRawResp(null);
    setRespStatus(null);
    setRespSize(null);
    setSrcRows([]);

    const t0 = Date.now();
    try {
      let url = cfg.url;
      const ep = cfg.params.filter((p) => p.enabled && p.key);
      if (ep.length)
        url += (url.includes("?") ? "&" : "?") + new URLSearchParams(ep.map((p) => [p.key, p.value])).toString();

      const hh = {};
      cfg.headers.filter((h) => h.enabled && h.key).forEach((h) => { hh[h.key] = h.value; });
      if (cfg.authType === "Bearer Token" && cfg.authVal) hh["Authorization"] = `Bearer ${cfg.authVal}`;
      if (cfg.authType === "API Key" && cfg.authKey) hh[cfg.authHeader || "X-API-Key"] = cfg.authKey;
      if (cfg.authType === "Basic Auth" && cfg.basicUser) hh["Authorization"] = "Basic " + btoa(`${cfg.basicUser}:${cfg.basicPass}`);

      let res;
      if (useProxy) {
        const bodyStr = (["POST", "PUT", "PATCH"].includes(cfg.method) && cfg.body) ? cfg.body : null;
        res = await fetch("http://localhost:8000/api/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, method: cfg.method, headers: hh, body: bodyStr }),
        });
      } else {
        const opts = { method: cfg.method, headers: hh };
        if (["POST", "PUT", "PATCH"].includes(cfg.method) && cfg.body) {
          opts.body = cfg.body;
          hh["Content-Type"] = cfg.contentType;
        }
        res = await fetch(url, opts);
      }

      const elapsed = Date.now() - t0;
      setRespMs(elapsed);
      setRespStatus({ code: res.status, text: res.statusText || statusText(res.status) });

      const txt = await res.text();
      setRespSize(new TextEncoder().encode(txt).length);

      let parsed;
      try { parsed = JSON.parse(txt); } catch { parsed = txt; }
      setRawResp(parsed);
      if (!res.ok) setRespErr(`HTTP ${res.status} — ${res.statusText}`);

      const entry = {
        id: Date.now(),
        method: cfg.method,
        url: cfg.url,
        name: cfg.name || cfg.url,
        status: res.status,
        ms: elapsed,
        ts: new Date().toLocaleTimeString(),
        cfg: { ...cfg },
      };
      setHistory((h) => [entry, ...h].slice(0, MAX_HISTORY));
    } catch (err) {
      setRespErr(err.message || "Network error");
      setRespMs(Date.now() - t0);
      setRespStatus({ code: 0, text: "Error" });
    } finally {
      setLoading(false);
    }
  }, [cfg, useProxy]);

  const detectSchema = () => {
    if (!rawResp) return;
    try {
      const extracted = extractByPath(rawResp, dataPath);
      const rows = extractRows(extracted);
      setSrcRows(rows);
      const sch = buildSchema(rows);
      setCols((prevCols) =>
        Object.entries(sch).map(([k, m]) => {
          const existing = prevCols.find((c) => c.originalKey === k);
          return {
            originalKey: k,
            label: k.split(".").pop(),
            alias: existing ? existing.alias : "",
            type: m.type,
            selected: existing ? existing.selected : true,
            isPrimary: existing ? existing.isPrimary : (m.type === "integer" && (k === "id" || k.endsWith(".id") || k.endsWith("_id"))),
            nulls: m.nulls,
            sample: m.sample,
          };
        })
      );
      setStep(2);
    } catch (err) {
      setRespErr(`Schema Detection failed: ${err.message}`);
    }
  };

  const clearResponse = () => {
    setRawResp(null);
    setRespErr(null);
    setRespMs(null);
    setRespStatus(null);
    setRespSize(null);
    setSrcRows([]);
  };

  const loadFromHistory = (entry) => {
    setCfg(entry.cfg);
    setShowHistory(false);
    clearResponse();
    setStep(1);
  };

  const saveAsDataset = async () => {
    if (!previewData.length) return;
    setIsSavingDataset(true);
    try {
      const activeCols = cols.filter((c) => c.selected).map((c) => c.alias || c.label);
      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '""';
        let str = typeof val === "object" ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };
      const csvLines = [
        activeCols.map((c) => escapeCSV(c)).join(","),
        ...previewData.map((r) => activeCols.map((h) => escapeCSV(r[h])).join(",")),
      ];
      const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
      const file = new File([blob], `${cfg.name || "API_Dataset"}_${Date.now()}.csv`, { type: "text/csv" });
      const res = await uploadDataset(file, cfg.name || "API Data Export", "url", { format: "JSON", url: cfg.url, config: cfg }, existingId);
      setExistingId(res.id);
      toast.success(existingId ? "Dataset updated successfully!" : "Dataset saved successfully!");
      // Optionally stay on page or navigate
      // navigate(`/dataset/${res.id}`); 
    } catch (err) {
      toast.error(err.message || "Failed to save dataset");
    } finally {
      setIsSavingDataset(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in w-full pb-6">

      {/* ── Sub-header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-muted flex items-center justify-center shrink-0">
            <PlugZap size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-text-primary tracking-tight leading-tight">API Data Engine</h3>
            <p className="text-[12px] text-text-tertiary">Connect, extract, transform, and save external API data</p>
          </div>
        </div>

        {/* History + Examples + Saved APIs */}
        <div className="flex items-center gap-2 relative">
          
          {/* Saved APIs */}
          <div className="relative">
            <button
              onClick={async () => {
                setShowSaved(!showSaved);
                setShowHistory(false);
                setShowEx(false);
                setSavedApiSearch("");
                if (!showSaved) {
                  try {
                    const data = await listDatasets();
                    setSavedApis(data.datasets.filter((d) => d.source_type === "url" && (d.source_meta?.config || d.source_meta?.format === "JSON")));
                  } catch (e) {}
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-default bg-bg-raised text-text-secondary font-bold text-[12px] hover:border-emerald/40 transition-all shadow-sm"
            >
              <PlugZap size={14} className="text-emerald" />
              My APIs
              <ChevronDown size={12} className={showSaved ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {showSaved && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-bg-overlay border border-border-default rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in flex flex-col max-h-[400px]">
                <div className="px-3 py-3 border-b border-border-muted bg-bg-surface/50 flex flex-col gap-2 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-quaternary px-2">Saved API Datasets</span>
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-quaternary" />
                    <input 
                      type="text"
                      value={savedApiSearch}
                      onChange={(e) => setSavedApiSearch(e.target.value)}
                      placeholder="Search datasets..."
                      className="w-full bg-bg-raised border border-border-muted rounded-lg pl-7 pr-3 py-1.5 text-[12px] outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/30 transition-all text-text-secondary placeholder-text-quaternary"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 min-h-0">
                  {(() => {
                    const filtered = savedApis.filter(ds => 
                      ds.name.toLowerCase().includes(savedApiSearch.toLowerCase()) || 
                      ds.source_meta?.url?.toLowerCase().includes(savedApiSearch.toLowerCase())
                    );
                    if (filtered.length === 0) {
                      return <div className="p-8 text-center text-text-quaternary text-[12px] italic">No matches found</div>;
                    }
                    return filtered.map((ds) => (
                      <button
                        key={ds.id}
                        onClick={() => {
                          updateConfig(ds.source_meta.config || {
                            name: ds.name,
                            url: ds.source_meta.url || "",
                            method: "GET",
                            authType: "None",
                            authKey: "", authVal: "", authHeader: "X-API-Key",
                            basicUser: "", basicPass: "",
                            contentType: "application/json",
                            body: "",
                            headers: [],
                            params: [],
                          });
                          setExistingId(ds.id);
                          setShowSaved(false);
                          setStep(1);
                          clearResponse();
                        }}
                        className="w-full text-left px-5 py-3 hover:bg-bg-muted transition-colors flex items-center gap-3 border-b border-border-muted last:border-0"
                      >
                        <Globe size={14} className="text-emerald shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-text-primary truncate">{ds.name}</div>
                          <div className="text-[11px] text-text-quaternary font-mono truncate">
                            {ds.source_meta.config?.method || "GET"} · {ds.source_meta.url?.replace("https://", "")}
                          </div>
                        </div>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <div className="relative">
            <button
              onClick={() => { setShowHistory(!showHistory); setShowEx(false); setShowSaved(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-default bg-bg-raised text-text-secondary font-bold text-[12px] hover:border-accent/40 transition-all shadow-sm"
            >
              <History size={14} className="text-violet" />
              History
              {history.length > 0 && (
                <span className="bg-violet/20 text-violet px-1.5 py-0.5 rounded-full text-[10px] font-black">
                  {history.length}
                </span>
              )}
            </button>
            {showHistory && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-bg-overlay border border-border-default rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                <div className="px-5 py-3 border-b border-border-muted bg-bg-surface/50 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-quaternary">Request History</span>
                  {history.length > 0 && (
                    <button onClick={() => setHistory([])} className="text-[11px] text-rose/70 hover:text-rose font-bold transition-colors">
                      Clear All
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div className="p-8 text-center text-text-quaternary text-[12px] italic">No requests yet</div>
                ) : (
                  history.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => loadFromHistory(e)}
                      className="w-full text-left px-5 py-3 hover:bg-bg-muted transition-colors flex items-center gap-3 border-b border-border-muted last:border-0"
                    >
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${methodColor(e.method)}`}>{e.method}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-bold text-text-primary truncate">{e.name}</div>
                        <div className="text-[10px] text-text-quaternary font-mono">{e.ts} · {e.ms}ms · {statusBadgeText(e.status)}</div>
                      </div>
                      <span className={`text-[10px] font-black ${e.status >= 200 && e.status < 300 ? "text-emerald" : "text-rose"}`}>
                        {e.status || "ERR"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Examples */}
          <div className="relative">
            <button
              onClick={() => { setShowEx(!showEx); setShowHistory(false); setShowSaved(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-default bg-bg-raised text-text-secondary font-bold text-[12px] hover:border-accent/40 transition-all shadow-sm"
            >
              <FlaskConical size={14} className="text-accent" />
              Examples
              <ChevronDown size={12} className={showEx ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {showEx && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-bg-overlay border border-border-default rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                <div className="px-5 py-3 border-b border-border-muted bg-bg-surface/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-quaternary">Try a live endpoint</span>
                </div>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.name}
                    onClick={() => { updateConfig({ name: ex.name, url: ex.url, method: ex.method }); setShowEx(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-bg-muted transition-colors flex items-center gap-3 border-b border-border-muted last:border-0"
                  >
                    <Globe size={14} className="text-accent shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-text-primary truncate">{ex.name}</div>
                      <div className="text-[11px] text-text-quaternary font-mono truncate">{ex.url.replace("https://", "")}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Step Progress ── */}
      <div className="grid grid-cols-3 gap-3">
        {STEPS.map((s) => {
          const done = s.id < step && cols.length > 0;
          const active = s.id === step;
          const locked = s.id > step && cols.length === 0;
          return (
            <button
              key={s.id}
              disabled={locked}
              onClick={() => !locked && setStep(s.id)}
              className={[
                "flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[12px] transition-all duration-300 border w-full",
                active
                  ? "border-accent text-white bg-accent/5 shadow-lg shadow-accent/5"
                  : done
                    ? "border-emerald/40 text-emerald bg-emerald/5"
                    : locked
                      ? "border-[#222] text-text-quaternary opacity-50 cursor-not-allowed bg-transparent"
                      : "border-[#444] text-text-tertiary hover:border-[#666] bg-transparent hover:bg-white/5",
              ].join(" ")}
            >
              {done ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
              <span>{s.label}</span>
              {s.id === 1 && history.length > 0 && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-text-quaternary font-normal">
                  <Clock size={10} /> {history.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ── */}
      <div className="flex flex-col gap-4">
        {step === 1 && (
          <>
            <ApiPlayground
              cfg={cfg}
              onUpdate={updateConfig}
              onFetch={fetchApi}
              loading={loading}
              respErr={respErr}
              onRetry={rawResp ? fetchApi : undefined}
              useProxy={useProxy}
              setUseProxy={setUseProxy}
            />
            <ResponseViewer
              rawResp={rawResp}
              respMs={respMs}
              respStatus={respStatus}
              respSize={respSize}
              dataPath={dataPath}
              setDataPath={setDataPath}
              onConfirmPath={detectSchema}
              onClear={clearResponse}
              srcRowsCount={extractRows(extractByPath(rawResp, dataPath)).length}
            />
          </>
        )}

        {step === 2 && cols.length > 0 && (
          <SchemaMapper
            cols={cols}
            setCols={setCols}
            respMs={respMs}
            srcRowsCount={srcRows.length}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && cols.length > 0 && (
          <div className="animate-slide-up">
            <DataExplorer
              previewRows={previewData}
              cols={cols}
              filters={filters}
              setFilters={setFilters}
              filterLogic={filterLogic}
              setFilterLogic={setFilterLogic}
              onBack={() => setStep(2)}
              onSaveDataset={saveAsDataset}
              isSaving={isSavingDataset}
            />
          </div>
        )}
      </div>
    </div>
  );
}
