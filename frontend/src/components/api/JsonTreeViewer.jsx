import { useState } from "react";
import { ChevronRight, ChevronDown, Copy, CheckCircle2 } from "lucide-react";
import CodeViewer from "../ui/CodeViewer";
import { inferType } from "./shared";

function TreeNode({ label, value, path, isLast, onSelectNode, selectedPath, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const type = inferType(value);
  const isObj = type === "object";
  const isArr = type === "array";
  const isComplex = isObj || isArr;
  const isSelected = selectedPath === path;

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelectNode(path, value);
  };

  const len = isComplex ? Object.keys(value).length : 0;

  return (
    <div className="font-mono text-[13px] ml-4 border-l border-border-muted/30 pl-2 py-0.5">
      <div
        className={`flex items-start group cursor-pointer rounded px-1 transition-colors ${
          isSelected ? "bg-accent/20 border border-accent/40" : "hover:bg-bg-surface"
        }`}
        onClick={(e) => {
          if (isComplex) {
            setExpanded(!expanded);
          } else {
            handleSelect(e);
          }
        }}
        onDoubleClick={handleSelect}
      >
        <div className="flex items-center mt-[2px] w-4 shrink-0 text-text-quaternary">
          {isComplex && (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </div>
        
        <div className="flex-1 break-all flex flex-wrap items-center gap-1">
          {label !== undefined && (
            <span className="text-violet-400 font-medium">"{label}"</span>
          )}
          {label !== undefined && <span className="text-text-tertiary mr-1">:</span>}
          
          {isComplex ? (
            <span className="text-text-quaternary text-[12px]">
              {isArr ? "[" : "{"} {expanded ? "" : `${len} ${isArr ? "items" : "keys"} ${isArr ? "]" : "}"}`}
            </span>
          ) : (
            <span className={
              type === "string" ? "text-emerald-400" :
              type === "number" || type === "integer" || type === "float" ? "text-amber-400" :
              type === "boolean" ? "text-rose-400" : "text-text-quaternary"
            }>
              {type === "string" ? `"${value}"` : String(value)}
            </span>
          )}
          {!isLast && !expanded && <span className="text-text-tertiary">,</span>}
        </div>
      </div>

      {isComplex && expanded && (
        <div>
          {Object.entries(value).map(([k, v], idx, arr) => (
            <TreeNode
              key={k}
              label={isArr ? undefined : k}
              value={v}
              path={path ? `${path}${isArr ? `[${k}]` : `.${k}`}` : (isArr ? `[${k}]` : k)}
              isLast={idx === arr.length - 1}
              onSelectNode={onSelectNode}
              selectedPath={selectedPath}
            />
          ))}
          <div className="text-text-quaternary ml-4 -mt-1">
            {isArr ? "]" : "}"}{!isLast && ","}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JsonTreeViewer({ data, onSelectPath, defaultSelectedPath }) {
  const [selectedPath, setSelectedPath] = useState(defaultSelectedPath || "");
  const [copied, setCopied] = useState(false);

  const handleSelectNode = (path) => {
    setSelectedPath(path);
    if (onSelectPath) onSelectPath(path);
  };

  const handleCopy = () => {
    if (!selectedPath) return;
    navigator.clipboard.writeText(selectedPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#111] rounded-xl border border-border-default overflow-hidden">
      <div className="p-3 bg-bg-surface flex items-center justify-between border-b border-border-default">
        <div className="flex-1 font-mono text-[12px] flex items-center gap-2 overflow-hidden bg-bg-base px-3 py-1.5 rounded-lg border border-border-muted mr-3">
          <span className="text-text-quaternary shrink-0">Path:</span>
          <span className="text-emerald-400 truncate font-bold">
            {selectedPath || "(root)"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          disabled={!selectedPath}
          className="flex items-center gap-2 px-3 py-1.5 bg-bg-raised hover:bg-bg-muted border border-border-default rounded-lg text-[11px] font-bold text-text-secondary disabled:opacity-50 transition-colors"
        >
          {copied ? <CheckCircle2 size={14} className="text-emerald" /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Path"}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {data === undefined ? (
          <div className="text-text-quaternary italic p-4 text-[13px]">No data available.</div>
        ) : (
          <TreeNode
            value={data}
            path=""
            isLast={true}
            onSelectNode={handleSelectNode}
            selectedPath={selectedPath}
            defaultExpanded={true}
          />
        )}
      </div>
    </div>
  );
}
