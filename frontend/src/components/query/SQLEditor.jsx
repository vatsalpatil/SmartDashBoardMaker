import { useState, useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, StandardSQL } from "@codemirror/lang-sql";
import { autocompletion } from "@codemirror/autocomplete";
import { Play, Save, Database, Sparkles, Terminal } from "lucide-react";
import { Button } from "../ui";
import { editorTheme, syntaxExtension } from "../../lib/editorTheme";

/* ── SQL Functions & Keywords for autocomplete ── */
const SQL_FUNCTIONS = [
  "SUM",
  "AVG",
  "COUNT",
  "MIN",
  "MAX",
  "COUNT_DISTINCT",
  "STDDEV",
  "VARIANCE",
  "MEDIAN",
  "MODE",
  "FIRST",
  "LAST",
  "STRING_AGG",
  "ABS",
  "CEIL",
  "FLOOR",
  "ROUND",
  "POWER",
  "SQRT",
  "MOD",
  "LOG",
  "EXP",
  "UPPER",
  "LOWER",
  "LENGTH",
  "TRIM",
  "SUBSTRING",
  "REPLACE",
  "CONCAT",
  "LEFT",
  "RIGHT",
  "STARTS_WITH",
  "ENDS_WITH",
  "REGEXP_MATCHES",
  "NOW",
  "CURRENT_DATE",
  "DATE_PART",
  "DATE_TRUNC",
  "DATE_DIFF",
  "EXTRACT",
  "CAST",
  "TRY_CAST",
  "TYPEOF",
  "COALESCE",
  "NULLIF",
  "IIF",
  "IFNULL",
  "ROW_NUMBER",
  "RANK",
  "DENSE_RANK",
  "NTILE",
  "LAG",
  "LEAD",
  "FIRST_VALUE",
  "LAST_VALUE",
  "PERCENT_RANK",
  "CUME_DIST",
];

const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "LIMIT",
  "OFFSET",
  "UNION",
  "UNION ALL",
  "INTERSECT",
  "EXCEPT",
  "WITH",
  "RECURSIVE",
  "OVER",
  "PARTITION BY",
  "WINDOW",
  "ASC",
  "DESC",
  "NULLS FIRST",
  "NULLS LAST",
  "INSERT INTO",
  "UPDATE",
  "DELETE FROM",
];

export function buildCompletionSource(tableName, columns) {
  return (context) => {
    const word = context.matchBefore(/[\w.]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    const options = [];
    if (columns?.length) {
      for (const col of columns)
        options.push({
          label: col,
          type: "property",
          detail: "⬡ Column",
          boost: 10,
        });
    }
    if (tableName)
      options.push({
        label: tableName,
        type: "class",
        detail: "⊞ Table",
        boost: 8,
      });
    for (const fn of SQL_FUNCTIONS)
      options.push({
        label: fn,
        type: "function",
        detail: "ƒ Function",
        apply: fn + "(",
        boost: 5,
      });
    for (const kw of SQL_KEYWORDS)
      options.push({
        label: kw,
        type: "keyword",
        detail: "⌘ Keyword",
        boost: 3,
      });
    return { from: word.from, options, filter: true };
  };
}

export default function SQLEditor({
  value,
  onChange,
  onExecute,
  onSave,
  tableName,
  columns = [],
  executing,
  queryName,
  onQueryNameChange,
  height = "240px",
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onExecute?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }
    },
    [onExecute, onSave],
  );

  const extensions = useMemo(() => {
    const completionSource = buildCompletionSource(tableName, columns);
    return [
      sql({ dialect: StandardSQL }),
      autocompletion({
        override: [completionSource],
        activateOnTyping: true,
        maxRenderedOptions: 40,
      }),
      editorTheme,
      syntaxExtension,
    ];
  }, [tableName, columns]);

  return (
    <div
      className="flex flex-col border border-border-default rounded-2xl overflow-hidden bg-bg-base shadow-2xl transition-all"
      onKeyDown={handleKeyDown}
    >
      {/* Premium Toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-bg-surface border-b border-border-default">
        {/* Left: Table Context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-bg-base border border-border-muted flex items-center justify-center shrink-0">
            <Terminal size={14} className="text-text-quaternary" />
          </div>
          {tableName ? (
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-text-quaternary font-black uppercase tracking-widest leading-none mb-1">
                Active Table
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <Database size={12} className="text-accent" />
                <code className="font-mono text-[13px] text-text-primary font-bold truncate">
                  {tableName}
                </code>
              </div>
            </div>
          ) : (
            <span className="text-[12px] text-text-quaternary font-bold">
              SQL Editor
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="relative group mr-2">
            <input
              value={queryName || ""}
              onChange={(e) => onQueryNameChange?.(e.target.value)}
              placeholder="Query Name..."
              className="h-9 px-3 text-[12px] bg-bg-base border border-border-default rounded-xl text-text-primary placeholder:text-text-quaternary outline-none focus:border-accent transition-all w-36 font-bold shadow-inner"
            />
            <Sparkles
              size={10}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-accent opacity-30 px-0.5"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-bg-base rounded-xl border border-border-default">
            <button
              onClick={onSave}
              disabled={!value?.trim() || !queryName?.trim()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest text-text-tertiary hover:text-text-primary hover:bg-bg-muted transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Save size={14} />
              Save
            </button>
            <div className="w-px h-4 bg-border-muted" />
            <button
              onClick={onExecute}
              disabled={executing || !value?.trim()}
              className="qb-btn qb-btn--primary"
            >
              {executing ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
              Run
            </button>
          </div>
          <div className="ml-2 hidden lg:flex flex-col items-center">
            <span className="text-[9px] font-black text-text-quaternary uppercase tracking-tighter">
              CMD+ENTER
            </span>
          </div>
        </div>
      </div>

      {/* CodeMirror editor */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <CodeMirror
          value={value}
          onChange={onChange}
          height={height}
          extensions={extensions}
          theme="none"
          placeholder="-- Write your SQL query here... (Ctrl+Enter to run)"
          className="text-[14px] font-mono selection:bg-accent/20"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            completionKeymap: true,
            bracketMatching: true,
            closeBrackets: true,
          }}
        />
      </div>
    </div>
  );
}
