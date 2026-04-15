import { useState, useMemo } from 'react';
import {
  BarChart3, LineChart, PieChart, TrendingUp, Table2, Hash,
  ScatterChart, Layers, Activity, Search, Star, Clock,
  ChevronDown, ChevronRight, Check
} from 'lucide-react';
import { Input } from '../ui/Input';
import { CHART_CATALOG, PRESET_MAP } from '../../lib/chartPresets';

const ICON_MAP = {
  LineChart, TrendingUp, BarChart3, PieChart,
  ScatterChart, Layers, Activity, Table2, Hash,
};

export default function ChartTypePicker({ config, onConfigChange }) {
  const [search, setSearch] = useState('');
  const activeType = config?.chart_type || 'bar';
  const activePreset = config?.chart_preset || null;

  // Find which category the active type belongs to
  const initialActiveCatId = useMemo(() => {
    for (const cat of CHART_CATALOG) {
      if (cat.presets.some(p => p.id === activePreset || p.overrides.chart_type === activeType)) {
        return cat.id;
      }
    }
    return 'bar';
  }, [activeType, activePreset]);

  const [expandedCat, setExpandedCat] = useState(initialActiveCatId);

  // Recent presets from localStorage
  const [recentIds, setRecentIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chart_recents') || '[]'); } catch { return []; }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chart_favorites') || '[]'); } catch { return []; }
  });

  const addRecent = (presetId) => {
    const updated = [presetId, ...recentIds.filter(r => r !== presetId)].slice(0, 6);
    setRecentIds(updated);
    localStorage.setItem('chart_recents', JSON.stringify(updated));
  };
  const toggleFav = (presetId) => {
    const updated = favorites.includes(presetId)
      ? favorites.filter(f => f !== presetId)
      : [...favorites, presetId];
    setFavorites(updated);
    localStorage.setItem('chart_favorites', JSON.stringify(updated));
  };

  const handleSelect = (preset) => {
    addRecent(preset.id);
    onConfigChange({ ...config, ...preset.overrides, chart_preset: preset.id });
  };

  // Filtered catalog
  const filtered = useMemo(() => {
    if (!search) return CHART_CATALOG;
    const q = search.toLowerCase();
    return CHART_CATALOG.map(cat => ({
      ...cat,
      presets: cat.presets.filter(p =>
        p.label.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        cat.label.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.presets.length > 0);
  }, [search]);

  const toggleCat = (catId) => {
    setExpandedCat(prev => prev === catId ? null : catId);
  };

  const isActive = (preset) => {
    if (activePreset) return preset.id === activePreset;
    return preset.overrides.chart_type === activeType;
  };

  const renderPresetButton = (preset, showCategory = false) => {
    const active = isActive(preset);
    const isFav = favorites.includes(preset.id);
    return (
      <button
        key={preset.id}
        onClick={() => handleSelect(preset)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 10px', width: '100%', textAlign: 'left',
          borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
          background: active ? 'var(--accent-light)' : 'transparent',
          color: active ? 'var(--accent)' : 'var(--text-primary)',
          transition: 'all 0.12s', fontSize: '0.74rem', fontWeight: active ? 600 : 400,
          fontFamily: 'var(--font-sans)', position: 'relative',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {active && <Check size={10} />}
            <span style={{ fontWeight: 600 }}>{preset.label}</span>
          </div>
          {showCategory && (
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {PRESET_MAP[preset.id]?.categoryLabel}
            </span>
          )}
          <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: '1px', lineHeight: 1.2 }}>
            {preset.desc}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFav(preset.id); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
            color: isFav ? '#f59e0b' : 'var(--text-muted)', opacity: isFav ? 1 : 0.3,
            transition: 'all 0.15s', display: 'flex', flexShrink: 0,
          }}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={11} fill={isFav ? '#f59e0b' : 'none'} />
        </button>
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Input
        icon={<Search size={13} />}
        placeholder="Search chart types..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="h-8 text-[12px]"
      />

      {/* Favorites section */}
      {favorites.length > 0 && !search && (
        <div>
          <div style={{
            fontSize: '0.6rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase',
            letterSpacing: '0.06em', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Star size={9} fill="#f59e0b" /> Favorites
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {favorites.map(fId => PRESET_MAP[fId] && renderPresetButton(PRESET_MAP[fId], true))}
          </div>
        </div>
      )}

      {/* Recent section */}
      {recentIds.length > 0 && !search && (
        <div>
          <div style={{
            fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.06em', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Clock size={9} /> Recent
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', padding: '2px 0' }}>
            {recentIds.slice(0, 5).map(rId => {
              const p = PRESET_MAP[rId];
              if (!p) return null;
              const active = isActive(p);
              return (
                <button
                  key={rId}
                  onClick={() => handleSelect(p)}
                  style={{
                    padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.62rem',
                    fontWeight: 600, border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: active ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'var(--font-sans)',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category list */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '1px',
        maxHeight: '350px', overflowY: 'auto',
      }}>
        {filtered.map(cat => {
          const Icon = ICON_MAP[cat.icon] || BarChart3;
          const isExpanded = expandedCat === cat.id || search;
          const catHasActive = cat.presets.some(p => isActive(p));
          return (
            <div key={cat.id}>
              <button
                onClick={() => toggleCat(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                  padding: '5px 6px', border: 'none', cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', fontWeight: 700,
                  background: catHasActive ? 'rgba(99,102,241,0.05)' : 'transparent',
                  color: catHasActive ? 'var(--accent)' : 'var(--text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.03em',
                  fontFamily: 'var(--font-heading)', transition: 'all 0.12s',
                }}
              >
                {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                <Icon size={12} />
                {cat.label}
                <span style={{
                  marginLeft: 'auto', fontSize: '0.6rem', background: 'var(--bg-tertiary)',
                  padding: '1px 5px', borderRadius: '6px', color: 'var(--text-muted)', fontWeight: 500,
                }}>
                  {cat.presets.length}
                </span>
              </button>

              {isExpanded && (
                <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {cat.presets.map(p => renderPresetButton(p))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
