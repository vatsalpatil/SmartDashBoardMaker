import { useState, useMemo } from 'react';
import { Database, Search, ChevronDown, ChevronRight, Hash, Type, Calendar } from 'lucide-react';
import { Input } from '../ui/Input';

const TYPE_ICONS = {
  measure: { icon: Hash, color: 'var(--color-emerald)', label: 'Measure' },
  dimension: { icon: Type, color: 'var(--color-violet)', label: 'Dimension' },
  date: { icon: Calendar, color: 'var(--color-amber)', label: 'Date' },
};

function classifyColumn(col) {
  const dtype = (col.dtype || col.type || '').toLowerCase();
  const name = (col.name || '').toLowerCase();

  // Date detection
  if (
    dtype.includes('date') || dtype.includes('time') || dtype.includes('timestamp') ||
    name.includes('date') || name.includes('_at') || name.endsWith('_dt') ||
    name === 'year' || name === 'month' || name === 'day'
  ) {
    return 'date';
  }

  // Numeric → measure
  if (
    dtype.includes('int') || dtype.includes('float') || dtype.includes('double') ||
    dtype.includes('numeric') || dtype.includes('decimal') || dtype.includes('number') ||
    dtype.includes('i64') || dtype.includes('i32') || dtype.includes('f64') || dtype.includes('f32') ||
    dtype.includes('u32') || dtype.includes('u64')
  ) {
    return 'measure';
  }

  return 'dimension';
}

export default function DataPane({ columns = [], onFieldClick, config = {} }) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const classified = useMemo(() => {
    const groups = { dimension: [], measure: [], date: [] };
    columns.forEach(col => {
      const colObj = typeof col === 'string' ? { name: col, dtype: '' } : col;
      const type = classifyColumn(colObj);
      groups[type].push({ ...colObj, fieldType: type });
    });
    return groups;
  }, [columns]);

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return classified;
    const filter = (arr) => arr.filter(c => c.name.toLowerCase().includes(q));
    return {
      dimension: filter(classified.dimension),
      measure: filter(classified.measure),
      date: filter(classified.date),
    };
  }, [classified, search]);

  const isFieldUsed = (name) => {
    return config.x_field === name ||
      (config.x_fields || []).includes(name) ||
      (config.y_fields || []).includes(name) ||
      config.color_field === name ||
      config.group_by === name;
  };

  const toggle = (group) => setCollapsed(p => ({ ...p, [group]: !p[group] }));

  const renderGroup = (key, label) => {
    const items = filteredGroups[key];
    if (items.length === 0) return null;
    const { icon: Icon, color } = TYPE_ICONS[key];
    const isCollapsed = collapsed[key];

    return (
      <div key={key} className="mb-1">
        <div
          onClick={() => toggle(key)}
          className="flex items-center gap-2 px-3 py-2 cursor-pointer text-[10px] font-bold text-text-quaternary uppercase tracking-widest select-none hover:text-text-tertiary transition-colors"
        >
          {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
          <Icon size={10} style={{ color }} />
          {label}
          <span className="ml-auto text-[10px] bg-bg-muted px-1.5 py-px rounded text-text-quaternary">
            {items.length}
          </span>
        </div>

        {!isCollapsed && (
          <div className="flex flex-col gap-px">
            {items.map(col => {
              const used = isFieldUsed(col.name);
              return (
                <div
                  key={col.name}
                  onClick={() => onFieldClick?.(col.name, col.fieldType)}
                  className={[
                    'flex items-center gap-2 px-2 py-1.5 pl-6 text-[12px] cursor-pointer rounded transition-all duration-100',
                    used
                      ? 'text-accent font-medium bg-accent-muted'
                      : 'text-text-secondary hover:bg-bg-muted',
                  ].join(' ')}
                >
                  <Icon size={10} style={{ color, opacity: 0.7, flexShrink: 0 }} />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {col.name}
                  </span>
                  {used && (
                    <span className="ml-auto text-accent text-[9px]">●</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header */}
      <div className="p-5 border-b border-border-default">
        <div className="flex items-center gap-2.5 text-[12px] font-bold text-text-primary mb-4 px-1">
          <Database size={14} className="text-accent" />
          Fields
        </div>

        <Input
          icon={<Search size={14} />}
          placeholder="Search fields..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 text-[11px]"
        />
      </div>

      {/* Field Groups */}
      <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
        {columns.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-text-quaternary">
            Select a data source
          </div>
        ) : (
          <>
            {renderGroup('dimension', 'Dimensions')}
            {renderGroup('date', 'Dates')}
            {renderGroup('measure', 'Measures')}
          </>
        )}
      </div>

      {/* Tip */}
      {columns.length > 0 && (
        <div className="px-3 py-2 border-t border-border-muted text-[10px] text-text-quaternary text-center">
          Click to add to chart
        </div>
      )}
    </div>
  );
}
