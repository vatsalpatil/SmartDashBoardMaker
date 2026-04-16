import { useState } from 'react';
import { Filter, X, Plus, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu";

export default function FilterControls({ columns, filters, onFiltersChange, uniqueValues, onFocusColumn }) {
  const [showAdd, setShowAdd] = useState(false);

  const addFilter = (column) => {
    const newFilters = [...(filters || []), {
      column,
      operator: 'equals',
      value: '',
    }];
    onFiltersChange(newFilters);
    setShowAdd(false);
  };

  const updateFilter = (idx, patch) => {
    const updated = filters.map((f, i) => i === idx ? { ...f, ...patch } : f);
    onFiltersChange(updated);
  };

  const removeFilter = (idx) => {
    onFiltersChange(filters.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <label className="form-label" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-heading)' }}>
          <Filter size={14} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent)' }} />
          Filters
        </label>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => setShowAdd(!showAdd)}
          style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '6px 10px', borderRadius: 'var(--radius-full)' }}
        >
          <Plus size={14} /> Add Filter
        </button>
      </div>

      {/* Add filter dropdown list */}
      {showAdd && (
        <div style={{
          border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)', padding: '8px', marginBottom: '16px',
          maxHeight: '200px', overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', gap: '4px'
        }}>
          {columns.length === 0 && <div style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>No columns available</div>}
          {columns.map(col => (
            <div
              key={col}
              style={{
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)',
                transition: 'all 0.15s ease',
              }}
              onClick={() => addFilter(col)}
              onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'var(--accent-light)';
                 e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'transparent';
                 e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              {col}
            </div>
          ))}
        </div>
      )}

      {/* Active filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filters?.map((f, idx) => {
          const isMulti = f.operator === 'in' || f.operator === 'not_in';
          
          return (
            <div key={idx} style={{
              display: 'flex', flexDirection: 'column', gap: '10px',
              background: 'var(--bg-tertiary)', padding: '14px', 
              borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge" style={{
                  background: 'var(--accent)', color: 'white', padding: '4px 8px',
                  fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-sm)'
                }}>
                  {f.column}
                </span>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => removeFilter(idx)}
                  style={{ padding: '4px', height: 'auto', width: 'auto', color: 'var(--text-muted)' }}
                  title="Remove Filter"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-between w-full px-3 py-2 border border-border-default rounded-lg text-[13px] font-semibold text-text-primary hover:border-accent transition-all" style={{ background: 'var(--color-bg-raised)' }}>
                      {(() => {
                        switch(f.operator) {
                          case 'equals': return '= Equals';
                          case 'not_equals': return '≠ Not Equals';
                          case 'in': return '∈ IN (Multi)';
                          case 'not_in': return '∉ NOT IN';
                          case 'gt': return '> Greater Than';
                          case 'lt': return '< Less Than';
                          case 'gte': return '≥ Greater or Equal';
                          case 'lte': return '≤ Less or Equal';
                          case 'contains': return '≈ LIKE/Contains';
                          default: return f.operator;
                        }
                      })()}
                      <ChevronDown size={14} className="text-text-quaternary" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuLabel>Operator</DropdownMenuLabel>
                    {[
                      { id: 'equals', label: '= Equals' },
                      { id: 'not_equals', label: '≠ Not Equals' },
                      { id: 'in', label: '∈ IN (Multi-Select)' },
                      { id: 'not_in', label: '∉ NOT IN' },
                      { id: 'gt', label: '> Greater Than' },
                      { id: 'lt', label: '< Less Than' },
                      { id: 'gte', label: '≥ Greater or Equal' },
                      { id: 'lte', label: '≤ Less or Equal' },
                      { id: 'contains', label: '≈ LIKE' },
                    ].map(op => (
                      <DropdownMenuItem key={op.id} onClick={() => {
                        const nextOp = op.id;
                        const willBeMulti = nextOp === 'in' || nextOp === 'not_in';
                        
                        if (willBeMulti && onFocusColumn) {
                          onFocusColumn(f.column);
                        }
                        
                        if (willBeMulti && !Array.isArray(f.value)) {
                          updateFilter(idx, { operator: nextOp, value: f.value ? [f.value] : [] });
                        } else if (!willBeMulti && Array.isArray(f.value)) {
                          updateFilter(idx, { operator: nextOp, value: f.value[0] || '' });
                        } else {
                          updateFilter(idx, { operator: nextOp });
                        }
                      }}>
                        {op.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {isMulti ? (
                  <div style={{
                    maxHeight: '160px', overflowY: 'auto', background: 'var(--bg-input)',
                    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '8px',
                    display: 'flex', flexDirection: 'column', gap: '2px'
                  }}>
                     {(!uniqueValues || !uniqueValues[f.column]) ? (
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>Loading values...</div>
                     ) : uniqueValues[f.column].length === 0 ? (
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>No values found</div>
                     ) : (
                       [...uniqueValues[f.column]].sort((a, b) =>
                         String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true })
                       ).map(val => {
                         const valArray = Array.isArray(f.value) ? f.value : [];
                         const isChecked = valArray.includes(val);
                         return (
                           <label key={val} style={{ 
                             display: 'flex', alignItems: 'center', gap: '8px', 
                             padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                             fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-primary)',
                             background: isChecked ? 'var(--bg-hover)' : 'transparent',
                             transition: 'background 0.1s'
                           }}>
                             <input 
                               type="checkbox" 
                               checked={isChecked}
                               onChange={(e) => {
                                 let newArr = [...valArray];
                                 if (e.target.checked) newArr.push(val);
                                 else newArr = newArr.filter(v => v !== val);
                                 updateFilter(idx, { value: newArr });
                               }}
                               style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: '14px', height: '14px' }}
                             />
                             {val}
                           </label>
                         );
                       })
                     )}
                  </div>
                ) : (
                  <div style={{ width: '100%', position: 'relative' }}>
                    <input
                      className="input"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem', background: 'var(--bg-input)' }}
                      value={f.value}
                      list={`filter-list-${idx}`}
                      onFocus={() => onFocusColumn && onFocusColumn(f.column)}
                      onChange={(e) => updateFilter(idx, { value: e.target.value })}
                      placeholder="Select or enter value..."
                    />
                    {uniqueValues && uniqueValues[f.column] && (
                      <datalist id={`filter-list-${idx}`}>
                        {[...uniqueValues[f.column]].sort((a, b) => 
                          String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true })
                        ).map(val => (
                          <option key={val} value={val} />
                        ))}
                      </datalist>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(!filters || filters.length === 0) && (
          <div style={{ 
            fontSize: '0.85rem', color: 'var(--text-muted)', 
            textAlign: 'center', padding: '24px', 
            background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border)'
          }}>
            No active filters. Click 'Add Filter' to constrain data.
          </div>
        )}
      </div>
    </div>
  );
}
