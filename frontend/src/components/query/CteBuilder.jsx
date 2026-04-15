import { useMemo } from 'react';
import { Plus, X, Layers } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, StandardSQL } from '@codemirror/lang-sql';
import { autocompletion } from '@codemirror/autocomplete';
import { editorTheme, syntaxExtension } from '../../lib/editorTheme';

let _id = 0;
const uid = () => `cte_${++_id}`;

export default function CteBuilder({ ctes, onChange, completions }) {
  const add = () => onChange([...(ctes || []), { id: uid(), name: `cte_${(ctes||[]).length+1}`, sql: 'SELECT * FROM ...' }]);
  const del = i => onChange((ctes || []).filter((_, j) => j !== i));
  const upd = (i, k, v) => onChange((ctes || []).map((c, j) => j === i ? { ...c, [k]: v } : c));

  const extensions = useMemo(() => [
    sql({ dialect: StandardSQL }),
    editorTheme,
    syntaxExtension,
    ...(completions ? [autocompletion({ override: [completions], activateOnTyping: true, maxRenderedOptions: 30 })] : [])
  ], [completions]);

  return (
    <div className="qb-cte-builder">
      {(ctes || []).map((c, i) => (
        <div key={c.id} className="qb-card qb-card--orange">
          <div className="qb-card-header" style={{ marginBottom: 12 }}>
            <div className="flex items-center gap-2 mb-1.5" style={{ flex: 1 }}>
              <Layers size={13} style={{ color: 'var(--orange)' }} />
              <input className="bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]" value={c.name} onChange={e => upd(i, 'name', e.target.value)} placeholder="cte_name" style={{ fontWeight: 800, flex: 0.6 }} />
            </div>
            <button className="qb-btn-icon qb-btn-icon--danger" onClick={() => del(i)}><X size={14} /></button>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', minHeight: 120 }}>
            <CodeMirror
              value={c.sql}
              onChange={val => upd(i, 'sql', val)}
              extensions={extensions}
              theme="none"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightActiveLine: false,
                foldGutter: false,
                completionKeymap: true,
              }}
              style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>
      ))}

      <button className="w-full py-1.5 rounded-lg bg-[rgba(92,98,236,0.1)] text-[#7b81f5] text-[0.7rem] font-medium border border-dashed border-[rgba(92,98,236,0.3)] hover:bg-[rgba(92,98,236,0.15)] flex justify-center items-center gap-1 mt-1 transition-all" onClick={add} style={{ borderColor: 'rgba(249,115,22,0.4)', color: '#f97316' }}><Plus size={13} /> Add CTE Block</button>
    </div>
  );
}
