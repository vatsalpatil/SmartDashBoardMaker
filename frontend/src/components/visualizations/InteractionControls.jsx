import { useState } from 'react';
import { ChevronDown, ChevronRight, Zap, Download } from 'lucide-react';

export default function InteractionControls({ config, onConfigChange }) {
  const [expanded, setExpanded] = useState(false);
  const update = (patch) => onConfigChange({ ...config, ...patch });

  const zoomEnabled = config?.zoom_enabled || false;
  const animEnabled = config?.animation_enabled !== false;
  const animDuration = config?.animation_duration ?? 400;
  const tooltipShared = config?.tooltip_shared !== false;
  const crosshair = config?.crosshair_enabled || false;
  const brushEnabled = config?.brush_enabled || false;
  const showTrend = config?.show_trend_line || false;

  const sectionLabel = { fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', marginTop: '8px' };
  const rowStyle = { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' };
  const sliderStyle = { width: '100%', accentColor: 'var(--accent)', height: '4px', cursor: 'pointer' };
  const toggleBtn = (active, onClick, label) => (
    <button onClick={onClick} style={{
      padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.62rem', fontWeight: 600,
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent)' : 'var(--bg-secondary)',
      color: active ? 'white' : 'var(--text-secondary)',
      cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'var(--font-sans)',
    }}>
      {label}
    </button>
  );

  const chartType = config?.chart_type || 'bar';
  const isCartesian = ['bar', 'horizontal_bar', 'stacked_bar', 'grouped_bar', 'stacked_percent_bar',
    'line', 'area', 'stacked_area', 'percent_area', 'scatter', 'composed', 'waterfall'].includes(chartType);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px', width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
          fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)',
          fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.03em',
        }}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Zap size={12} style={{ color: '#f59e0b' }} />
        Interactions
      </button>

      {expanded && (
        <div style={{
          padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        }}>
          {/* Tooltip Mode */}
          <div style={sectionLabel}>Tooltip</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {toggleBtn(tooltipShared, () => update({ tooltip_shared: true }), '📋 Shared')}
            {toggleBtn(!tooltipShared, () => update({ tooltip_shared: false }), '📌 Individual')}
          </div>

          {/* Crosshair */}
          {isCartesian && (
            <>
              <div style={sectionLabel}>Crosshair</div>
              <div style={{ marginBottom: '6px' }}>
                {toggleBtn(crosshair, () => update({ crosshair_enabled: !crosshair }), crosshair ? '✚ ON' : '✚ OFF')}
              </div>
            </>
          )}

          {/* Brush / Range Selector */}
          {isCartesian && (
            <>
              <div style={sectionLabel}>Range Brush (Zoom)</div>
              <div style={{ marginBottom: '6px' }}>
                {toggleBtn(brushEnabled, () => update({ brush_enabled: !brushEnabled }), brushEnabled ? '🔍 Brush ON' : '🔍 Brush OFF')}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.3 }}>
                Adds a draggable range selector at the bottom of the chart for zooming into data ranges.
              </div>
            </>
          )}

          {/* Trend Line */}
          {isCartesian && (
            <>
              <div style={sectionLabel}>Trend Line</div>
              <div style={{ marginBottom: '6px' }}>
                {toggleBtn(showTrend, () => update({ show_trend_line: !showTrend }), showTrend ? '📈 ON' : '📈 OFF')}
              </div>
            </>
          )}

          {/* Animation */}
          <div style={sectionLabel}>Animation</div>
          <div style={rowStyle}>
            {toggleBtn(animEnabled, () => update({ animation_enabled: !animEnabled }), animEnabled ? '✨ ON' : '✨ OFF')}
            {animEnabled && (
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Duration: {animDuration}ms</span>
                <input type="range" min={0} max={2000} step={100} value={animDuration}
                  onChange={e => update({ animation_duration: Number(e.target.value) })}
                  style={sliderStyle}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
