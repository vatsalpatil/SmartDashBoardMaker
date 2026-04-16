import { useState } from 'react';
import { ChevronDown, ChevronRight, Ruler, RotateCcw } from 'lucide-react';

export default function AxisControls({ config, onConfigChange }) {
  const [expanded, setExpanded] = useState(false);
  const update = (patch) => onConfigChange({ ...config, ...patch });

  const yMode = config?.axis_y_mode || 'smart';
  const yMin = config?.axis_y_min ?? '';
  const yMax = config?.axis_y_max ?? '';
  const yType = config?.axis_y_type || 'linear';
  const xRotation = config?.axis_x_rotation ?? 0;
  const reversed = config?.axis_reversed || false;
  const yLabel = config?.axis_y_label || '';
  const xLabel = config?.axis_x_label || '';
  const showGrid = config?.show_grid !== false;
  const showGridX = config?.show_grid_x || false;

  const sectionLabel = { fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', marginTop: '8px' };
  const rowStyle = { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' };
  const inputStyle = { fontSize: '0.72rem', padding: '3px 8px', height: '26px' };
  const toggleBtn = (active, onClick, label, keyStr) => (
    <button
      key={keyStr || label}
      onClick={onClick}
      style={{
        padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.63rem', fontWeight: 600,
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent)' : 'var(--bg-tertiary)',
        color: active ? 'white' : 'var(--text-secondary)',
        cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'var(--font-sans)',
      }}
    >
      {label}
    </button>
  );

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
        <Ruler size={12} style={{ color: 'var(--accent)' }} />
        Axis Controls
      </button>

      {expanded && (
        <div style={{
          padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        }}>
          {/* Y-Axis Scaling Mode */}
          <div style={sectionLabel}>Y-Axis Scaling</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {toggleBtn(yMode === 'smart', () => update({ axis_y_mode: 'smart' }), '🧠 Smart')}
            {toggleBtn(yMode === 'zero', () => update({ axis_y_mode: 'zero' }), '0 From Zero')}
            {toggleBtn(yMode === 'manual', () => update({ axis_y_mode: 'manual' }), '✏️ Manual')}
          </div>

          {/* Manual min/max */}
          {yMode === 'manual' && (
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Min</div>
                <input className="input" type="number" value={yMin} style={inputStyle}
                  onChange={e => update({ axis_y_min: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="Auto"
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Max</div>
                <input className="input" type="number" value={yMax} style={inputStyle}
                  onChange={e => update({ axis_y_max: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="Auto"
                />
              </div>
            </div>
          )}

          {/* Y-Axis Type */}
          <div style={sectionLabel}>Y-Axis Scale Type</div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
            {toggleBtn(yType === 'linear', () => update({ axis_y_type: 'linear' }), 'Linear')}
            {toggleBtn(yType === 'logarithmic', () => update({ axis_y_type: 'logarithmic' }), 'Log Scale')}
          </div>

          {/* X-axis label rotation */}
          <div style={sectionLabel}>X-Axis Label Angle</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {[0, -30, -45, -60, -90].map(angle => (
              toggleBtn(xRotation === angle, () => update({ axis_x_rotation: angle }), `${angle}°`, `angle-${angle}`)
            ))}
          </div>

          {/* Grid Lines */}
          <div style={sectionLabel}>Grid Lines</div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
            {toggleBtn(showGrid, () => update({ show_grid: !showGrid }), showGrid ? '▦ Y Grid ON' : '▦ Y Grid OFF')}
            {toggleBtn(showGridX, () => update({ show_grid_x: !showGridX }), showGridX ? '▤ X Grid ON' : '▤ X Grid OFF')}
          </div>

          {/* Axis Labels */}
          <div style={sectionLabel}>Axis Labels</div>
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: '2px' }}>X Label</div>
              <input className="input" value={xLabel} style={inputStyle}
                onChange={e => update({ axis_x_label: e.target.value })} placeholder="Auto"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Y Label</div>
              <input className="input" value={yLabel} style={inputStyle}
                onChange={e => update({ axis_y_label: e.target.value })} placeholder="Auto"
              />
            </div>
          </div>

          {/* Reversed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={reversed} onChange={e => update({ axis_reversed: e.target.checked })}
                style={{ accentColor: 'var(--accent)', width: '13px', height: '13px' }}
              />
              <RotateCcw size={11} /> Reversed axis
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
