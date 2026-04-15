import { Filter, X, Plus } from 'lucide-react';
import { Select, Input } from '../ui/Input';

export default function GlobalFilters({ filters = [], columns = [], onFiltersChange }) {
  const addFilter = () => onFiltersChange([...filters, { column: '', operator: 'equals', value: '' }]);

  const updateFilter = (idx, patch) => {
    const updated = filters.map((f, i) => i === idx ? { ...f, ...patch } : f);
    onFiltersChange(updated);
  };

  const removeFilter = (idx) => onFiltersChange(filters.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
          <Filter size={13} className="text-accent" />
          Global Filters
        </div>
        <button 
          className="btn-secondary text-[10px] px-2.5 py-1 h-auto flex items-center gap-1" 
          onClick={addFilter}
        >
          <Plus size={11} />
          Add Filter
        </button>
      </div>

      {filters.length === 0 && (
        <div className="text-[11px] text-text-quaternary italic px-1">No filters applied</div>
      )}

      <div className="flex flex-col gap-2">
        {filters.map((f, idx) => (
          <div key={idx} className="flex gap-2 items-center animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <Select
              containerClass="w-[160px]"
              className="py-1 px-2.5 text-[12px] h-8 bg-bg-base border-border-default font-medium"
              value={f.column}
              onChange={(e) => updateFilter(idx, { column: e.target.value })}
            >
              <option value="" className="bg-bg-base">Column...</option>
              {columns.map(c => <option key={c} value={c} className="bg-bg-base">{c}</option>)}
            </Select>
            <Select
              containerClass="w-[100px]"
              className="py-1 px-2.5 text-[12px] h-8 bg-bg-base border-border-default font-medium text-accent"
              value={f.operator}
              onChange={(e) => updateFilter(idx, { operator: e.target.value })}
            >
              <option value="equals" className="bg-bg-base">=</option>
              <option value="not_equals" className="bg-bg-base">≠</option>
              <option value="gt" className="bg-bg-base">&gt;</option>
              <option value="lt" className="bg-bg-base">&lt;</option>
              <option value="contains" className="bg-bg-base">contains</option>
            </Select>
            <Input
              containerClass="flex-1"
              className="py-1 px-2.5 text-[12px] h-8 bg-bg-base border-border-default placeholder:text-text-quaternary"
              value={f.value}
              onChange={(e) => updateFilter(idx, { value: e.target.value })}
              placeholder="Value..."
            />
            <button 
              onClick={() => removeFilter(idx)} 
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-quaternary hover:text-rose hover:bg-rose-muted transition-all"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
