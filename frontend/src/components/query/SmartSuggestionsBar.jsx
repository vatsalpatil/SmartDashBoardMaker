import { Lightbulb, AlertTriangle, Zap, Info, X } from 'lucide-react';
import { useState } from 'react';

/**
 * SmartSuggestionsBar
 * Context-aware suggestion chips based on current query state.
 */

const SUGGESTION_ICONS = {
  warning: AlertTriangle,
  perf: Zap,
  info: Info,
  tip: Lightbulb,
};

const SUGGESTION_COLORS = {
  warning: { bg: 'rgba(245,158,11,0.03)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b', icon: '#f59e0b' },
  perf:    { bg: 'rgba(239,68,68,0.03)',   border: 'rgba(239,68,68,0.25)', text: '#f43f5e', icon: '#f43f5e' },
  info:    { bg: 'rgba(59,130,246,0.03)',  border: 'rgba(59,130,246,0.25)', text: '#60a5fa', icon: '#60a5fa' },
  tip:     { bg: 'rgba(129,140,248,0.03)', border: 'rgba(129,140,248,0.25)', text: '#818cf8', icon: '#818cf8' },
};

export function generateSuggestions({ selects, joins, wheres, groupBy, havingConds, orderBy, limit, ctes, winFuncs, queryMode, unions }) {
  const suggestions = [];
  const hasAgg = selects.some(s => s.agg && s.agg !== '');
  const hasNonAgg = selects.some(s => !s.agg && s.col && s.col !== '*');
  const hasGroupBy = groupBy.filter(Boolean).length > 0;
  const hasHaving = (havingConds || []).length > 0;
  const hasJoins = (joins || []).length > 0;
  const hasLimit = limit && String(limit).trim() !== '';
  const hasCte = (ctes || []).length > 0;
  const hasWindow = (winFuncs || []).length > 0;

  // Missing GROUP BY when using aggregation
  if (hasAgg && hasNonAgg && !hasGroupBy) {
    suggestions.push({
      id: 'add-groupby',
      type: 'warning',
      msg: 'Using aggregation + raw columns — add GROUP BY to avoid errors',
      action: 'Add GROUP BY',
    });
  }

  // HAVING without GROUP BY
  if (hasHaving && !hasGroupBy) {
    suggestions.push({
      id: 'having-no-groupby',
      type: 'warning',
      msg: 'HAVING requires GROUP BY to work correctly',
      action: null,
    });
  }

  // Large joins without LIMIT
  if (hasJoins && !hasLimit) {
    suggestions.push({
      id: 'join-no-limit',
      type: 'perf',
      msg: `${joins.length} join${joins.length > 1 ? 's' : ''} without LIMIT — may be slow on large data`,
      action: 'Add LIMIT',
    });
  }

  // No columns selected (just *)
  if (selects.length === 1 && selects[0].col === '*' && hasJoins) {
    suggestions.push({
      id: 'select-star-join',
      type: 'perf',
      msg: 'SELECT * with JOINs returns all columns — select specific columns for better performance',
      action: null,
    });
  }

  // GROUP BY without aggregation
  if (hasGroupBy && !hasAgg) {
    suggestions.push({
      id: 'groupby-no-agg',
      type: 'tip',
      msg: 'GROUP BY without aggregation works like DISTINCT — add COUNT(), SUM(), etc. to compute metrics',
      action: null,
    });
  }

  // Window functions without ORDER BY in the window
  if (hasWindow && !winFuncs.some(w => w.orderBy)) {
    suggestions.push({
      id: 'window-no-order',
      type: 'warning',
      msg: 'Some window functions like ROW_NUMBER() need ORDER BY inside the window',
      action: null,
    });
  }

  // CTE without using it in main query
  if (hasCte) {
    suggestions.push({
      id: 'cte-info',
      type: 'info',
      msg: 'CTEs defined above — reference them by name in your SELECT or JOIN',
      action: null,
    });
  }

  // UNION with mismatched column hints
  if ((unions || []).length > 0) {
    suggestions.push({
      id: 'union-columns',
      type: 'info',
      msg: 'UNION requires same number of columns and compatible types in each SELECT',
      action: null,
    });
  }

  // No ORDER BY on analytics queries
  if (hasAgg && hasGroupBy && orderBy.filter(o => o.col).length === 0) {
    suggestions.push({
      id: 'add-orderby',
      type: 'tip',
      msg: 'Tip: Add ORDER BY to sort your grouped results',
      action: 'Add ORDER BY',
    });
  }

  return suggestions;
}

export default function SmartSuggestionsBar({ suggestions, onAction, onDismiss }) {
  const [dismissed, setDismissed] = useState(new Set());

  const visible = suggestions.filter(s => !dismissed.has(s.id));
  if (!visible.length) return null;

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '6px',
      padding: '8px 12px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
        <Lightbulb size={10} /> Smart Hints
      </div>
      {visible.map(s => {
        const color = SUGGESTION_COLORS[s.type] || SUGGESTION_COLORS.info;
        const Icon = SUGGESTION_ICONS[s.type] || Info;
        return (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: color.bg, border: `1px solid ${color.border}`,
            borderRadius: '999px', padding: '3px 10px 3px 7px',
            fontSize: '0.68rem', color: color.text,
          }}>
            <Icon size={10} style={{ color: color.icon, flexShrink: 0 }} />
            <span>{s.msg}</span>
            {s.action && (
              <button onClick={() => onAction?.(s)} style={{
                background: 'transparent', border: `1px solid ${color.border}`, borderRadius: '4px',
                color: color.text, fontSize: '0.62rem', fontWeight: 800,
                padding: '1px 6px', cursor: 'pointer', marginLeft: '4px',
                textTransform: 'uppercase',
              }}>
                {s.action}
              </button>
            )}
            <button onClick={() => { setDismissed(d => new Set([...d, s.id])); onDismiss?.(s); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: color.text, display: 'flex', padding: '0', opacity: 0.6 }}>
              <X size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
