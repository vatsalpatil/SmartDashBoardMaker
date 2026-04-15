import { useState, useMemo } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Braces, Table2, Layers, Search, Code, Check, Zap, Trash2, RefreshCw } from "lucide-react";
import { card, inputStyle, findAllArrays } from "./shared";
import { Badge, TabBar, Btn } from "./Atoms";
import CodeViewer from "../ui/CodeViewer";
import JsonTreeViewer from "./JsonTreeViewer";

export default function ResponseViewer({
  rawResp,
  respMs,
  respStatus,     // { code, text }
  respSize,       // bytes
  dataPath,
  setDataPath,
  onConfirmPath,
  onClear,
  srcRowsCount,
}) {
  const [viewTab, setViewTab] = useState("wizard");
  const [isOpen, setIsOpen] = useState(true);

  const arrayPaths = useMemo(() => {
    if (!rawResp) return [];
    return findAllArrays(rawResp);
  }, [rawResp]);

  if (!rawResp) return null;

  const sizeKb = respSize != null
    ? respSize >= 1024 ? `${(respSize / 1024).toFixed(1)} KB` : `${respSize} B`
    : `${(JSON.stringify(rawResp).length / 1024).toFixed(1)} KB`;

  const isOk = respStatus ? respStatus.code >= 200 && respStatus.code < 300 : true;
  const statusCode = respStatus?.code ?? "–";
  const statusLabel = respStatus ? `${respStatus.code} ${respStatus.text}` : "200 OK";

  return (
    <div style={card} className="overflow-hidden animate-slide-up bg-bg-base border-border-default">
      {/* HEADER */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-bg-surface/50 border-b border-border-default transition-colors bg-bg-raised"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          {isOk
            ? <CheckCircle2 size={22} className="text-emerald" />
            : <XCircle size={22} className="text-rose" />
          }
          <div className="font-black text-[15px] text-text-primary">Response Snapshot</div>

          {/* Real status code badge */}
          <Badge
            bg={isOk ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)"}
            color={isOk ? "var(--color-emerald)" : "var(--color-rose)"}
            border={isOk ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}
          >
            {statusLabel}
          </Badge>

          {respMs != null && (
            <Badge bg="var(--color-bg-base)" color="var(--color-amber)">
              {respMs}ms
            </Badge>
          )}
          <Badge bg="var(--color-bg-base)" color="var(--color-violet)">{sizeKb}</Badge>
          {srcRowsCount > 0 && (
            <Badge bg="rgba(59,130,246,0.10)" color="var(--color-accent)" border="rgba(59,130,246,0.20)">
              {srcRowsCount} rows detected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {onClear && (
            <button
              onClick={onClear}
              title="Clear response"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-muted text-text-quaternary hover:text-rose hover:border-rose/30 bg-bg-base transition-colors text-[11px] font-bold"
            >
              <Trash2 size={13} /> Clear
            </button>
          )}
          {isOpen
            ? <ChevronUp size={20} className="text-text-tertiary" />
            : <ChevronDown size={20} className="text-text-tertiary" />
          }
        </div>
      </div>

      {/* CONTENT */}
      {isOpen && (
        <div className="flex flex-col h-[600px] bg-bg-base border-border-default">
          <div className="p-4 bg-bg-surface/30 border-b border-border-default flex items-center justify-between gap-4 flex-wrap">
            <TabBar
              tabs={[
                { id: "wizard", label: "Extract Wizard", icon: Zap },
                { id: "tree",   label: "Tree View",      icon: Layers },
                { id: "raw",    label: "Raw JSON",        icon: Code },
              ]}
              active={viewTab}
              onChange={setViewTab}
            />

            <div className="flex items-center gap-3 bg-bg-raised px-4 py-2 rounded-xl border border-border-muted flex-1 max-w-lg">
              <Search size={16} className="text-text-quaternary" />
              <div className="text-[12px] font-bold text-text-secondary shrink-0">Path:</div>
              <input
                value={dataPath}
                onChange={(e) => setDataPath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onConfirmPath()}
                placeholder="e.g. $, data, items, results"
                className="bg-transparent border-none outline-none text-[13px] font-mono text-emerald-400 font-bold w-full"
              />
              <Btn size="sm" onClick={onConfirmPath} disabled={!dataPath} className="shrink-0 bg-emerald/20 text-emerald hover:bg-emerald/30 border-emerald/30">
                <Check size={14} /> Extract
              </Btn>
            </div>
          </div>

          <div className="flex-1 overflow-auto relative custom-scrollbar">
            {viewTab === "wizard" && (
              <div className="p-8 max-w-3xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-[18px] font-black text-text-primary">
                    {Array.isArray(rawResp) ? `Root Array — ${rawResp.length} items` : "Object with nested arrays"}
                  </h3>
                  <p className="text-[13px] text-text-tertiary mt-2">
                    {Array.isArray(rawResp)
                      ? "The root response is an array. Click Extract below to map the full schema."
                      : "Select a detected array below to instantly map the schema, or use manual path input."}
                  </p>
                </div>

                {/* Root array shortcut */}
                {Array.isArray(rawResp) && (
                  <div className="flex items-center justify-between p-4 bg-accent/5 border border-accent/20 rounded-xl mb-4 group">
                    <div className="flex items-center gap-3">
                      <code className="text-[14px] text-accent font-bold px-2 py-1 bg-accent/10 rounded">$ (root array)</code>
                      <span className="text-[12px] text-text-quaternary font-medium">({rawResp.length} items)</span>
                    </div>
                    <Btn
                      size="sm"
                      onClick={() => {
                        setDataPath("$");
                        setTimeout(() => onConfirmPath(), 0);
                      }}
                      className="bg-accent hover:bg-accent-hover text-white shadow-lg"
                    >
                      Extract <Table2 size={14} className="ml-1" />
                    </Btn>
                  </div>
                )}

                {arrayPaths.length === 0 && !Array.isArray(rawResp) ? (
                  <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500/80 text-[13px]">
                    No nested arrays detected automatically. Use the manual path input or explore the Tree View to navigate the structure.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {arrayPaths
                      .filter(arr => arr.path !== "$" || !Array.isArray(rawResp))
                      .map((arr, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-bg-surface border border-border-default rounded-xl hover:border-border-strong transition-colors group">
                          <div className="flex items-center gap-3">
                            <code className="text-[14px] text-violet-400 font-bold px-2 py-1 bg-violet-400/10 rounded">
                              {arr.path === "$" ? "(root document)" : `"${arr.path}"`}
                            </code>
                            <span className="text-[12px] text-text-quaternary font-medium">({arr.count} items)</span>
                          </div>
                          <Btn
                            size="sm"
                            onClick={() => {
                              setDataPath(arr.path);
                              setTimeout(() => onConfirmPath(), 0);
                            }}
                            className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-accent hover:bg-accent-hover text-white shadow-lg"
                          >
                            Extract <Table2 size={14} className="ml-1" />
                          </Btn>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {viewTab === "tree" && (
              <div className="h-full absolute inset-0">
                <JsonTreeViewer
                  data={rawResp}
                  onSelectPath={setDataPath}
                  defaultSelectedPath={dataPath}
                />
              </div>
            )}
            {viewTab === "raw" && (
              <div className="h-full absolute inset-0">
                <CodeViewer value={JSON.stringify(rawResp, null, 2)} language="json" height="100%" />
              </div>
            )}
          </div>

          <div className="p-3 bg-bg-surface border-t border-border-default flex items-center gap-4 text-[12px] font-medium text-text-tertiary shrink-0 z-10">
            <InfoIcon />
            {viewTab === "wizard" && "Click Extract on any path, or use the Tree View to find deep structures."}
            {viewTab === "tree" && "Click any leaf node to select its path, then click Extract above."}
            {viewTab === "raw" && "Read-only raw JSON. Switch to Extract Wizard or Tree View to navigate."}
            {srcRowsCount > 0 && (
              <span className="ml-auto text-emerald font-bold">
                ✓ {srcRowsCount} rows ready for Schema mapping
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoIcon() {
  return <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold">i</div>;
}
