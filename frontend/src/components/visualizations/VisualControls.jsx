import { useState } from 'react';
import { ChevronDown, ChevronRight, Palette, Check } from 'lucide-react';
import { COLOR_PALETTES } from '../../lib/chartPresets';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu";

export default function VisualControls({ config, onConfigChange }) {
  const [expanded, setExpanded] = useState(false);
  const [showPalettes, setShowPalettes] = useState(false);
  const update = (patch) => onConfigChange({ ...config, ...patch });

  const palette = config?.color_palette || 'default';
  const lineWidth = config?.line_width ?? 2;
  const markerSize = config?.marker_size ?? 4;
  const showMarkers = config?.show_markers || false;
  const showDataLabels = config?.show_data_labels || false;
  const dataLabelFormat = config?.data_label_format || 'value';
  const legendPos = config?.legend_position || 'bottom';
  const gradientFill = config?.gradient_fill || false;
  const barRadius = config?.bar_border_radius ?? 4;
  const areaOpacity = config?.area_opacity ?? 0.3;
  const curveType = config?.curve_type || 'monotone';
  const condColor = config?.conditional_color || false;
  const strokeDash = config?.stroke_dash || '';

  const chartType = config?.chart_type || 'bar';
  const isLine = ['line', 'spline'].includes(chartType) || chartType?.includes('line');
  const isArea = chartType?.includes('area');
  const isBar = ['bar', 'horizontal_bar', 'stacked_bar', 'grouped_bar', 'stacked_percent_bar', 'waterfall'].includes(chartType);

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
        <Palette size={12} style={{ color: '#ec4899' }} />
        Visual Style
      </button>

      {expanded && (
        <div style={{
          padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        }}>
          {/* Color Palette */}
          <div style={sectionLabel}>Color Palette</div>
          <div style={{ position: 'relative', marginBottom: '6px' }}>
            <button
              onClick={() => setShowPalettes(!showPalettes)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '6px 10px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <div style={{ display: 'flex', gap: '2px' }}>
                {(COLOR_PALETTES[palette]?.colors || COLOR_PALETTES.default.colors).slice(0, 6).map((c, i) => (
                  <div key={i} style={{ width: '12px', height: '12px', borderRadius: '3px', background: c }} />
                ))}
              </div>
              <span style={{ flex: 1, textAlign: 'left' }}>{COLOR_PALETTES[palette]?.label || 'Default'}</span>
              <ChevronDown size={11} style={{ transform: showPalettes ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {showPalettes && (
              <>
                <div onClick={() => setShowPalettes(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '6px', zIndex: 50,
                  boxShadow: 'var(--shadow-xl)', maxHeight: '200px', overflowY: 'auto',
                  display: 'flex', flexDirection: 'column', gap: '2px',
                }}>
                  {Object.entries(COLOR_PALETTES).map(([id, pal]) => (
                    <button
                      key={id}
                      onClick={() => { update({ color_palette: id }); setShowPalettes(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                        border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                        background: palette === id ? 'rgba(99,102,241,0.1)' : 'transparent',
                        color: palette === id ? 'var(--accent)' : 'var(--text-primary)',
                        fontSize: '0.7rem', transition: 'all 0.1s', fontFamily: 'var(--font-sans)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {pal.colors.slice(0, 6).map((c, i) => (
                          <div key={i} style={{ width: '10px', height: '10px', borderRadius: '2px', background: c }} />
                        ))}
                      </div>
                      <span>{pal.label}</span>
                      {palette === id && <Check size={11} style={{ marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Curve Type (for line/area) */}
          {(isLine || isArea) && (
            <>
              <div style={sectionLabel}>Curve Style</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {[
                  { id: 'monotone', label: 'Smooth' },
                  { id: 'linear', label: 'Straight' },
                  { id: 'step', label: 'Step' },
                  { id: 'basis', label: 'Basis' },
                  { id: 'natural', label: 'Natural' },
                ].map(c => toggleBtn(curveType === c.id, () => update({ curve_type: c.id }), c.label))}
              </div>
            </>
          )}

          {/* Line Width (for line/area) */}
          {(isLine || isArea) && (
            <>
              <div style={sectionLabel}>Line Width: {lineWidth}px</div>
              <input type="range" min={1} max={6} step={0.5} value={lineWidth}
                onChange={e => update({ line_width: Number(e.target.value) })}
                style={sliderStyle}
              />
            </>
          )}

          {/* Stroke Dash */}
          {isLine && (
            <>
              <div style={sectionLabel}>Line Style</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {[
                  { id: '', label: 'Solid' },
                  { id: '8 4', label: 'Dashed' },
                  { id: '2 4', label: 'Dotted' },
                  { id: '8 4 2 4', label: 'Dash-Dot' },
                ].map(d => toggleBtn(strokeDash === d.id, () => update({ stroke_dash: d.id }), d.label))}
              </div>
            </>
          )}

          {/* Markers */}
          {(isLine || isArea) && (
            <>
              <div style={sectionLabel}>Data Markers</div>
              <div style={rowStyle}>
                {toggleBtn(showMarkers, () => update({ show_markers: !showMarkers }), showMarkers ? '● ON' : '○ OFF')}
                {showMarkers && (
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Size: {markerSize}px</span>
                    <input type="range" min={2} max={10} step={1} value={markerSize}
                      onChange={e => update({ marker_size: Number(e.target.value) })}
                      style={sliderStyle}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bar Border Radius */}
          {isBar && (
            <>
              <div style={sectionLabel}>Corner Radius: {barRadius}px</div>
              <input type="range" min={0} max={20} step={1} value={barRadius}
                onChange={e => update({ bar_border_radius: Number(e.target.value) })}
                style={sliderStyle}
              />
            </>
          )}

          {/* Gradient Fill */}
          {(isArea || isBar) && (
            <>
              <div style={sectionLabel}>Gradient Fill</div>
              <div style={{ marginBottom: '6px' }}>
                {toggleBtn(gradientFill, () => update({ gradient_fill: !gradientFill }), gradientFill ? '🌈 ON' : '🌈 OFF')}
              </div>
            </>
          )}

          {/* Area Opacity */}
          {isArea && (
            <>
              <div style={sectionLabel}>Area Opacity: {Math.round(areaOpacity * 100)}%</div>
              <input type="range" min={0.05} max={1} step={0.05} value={areaOpacity}
                onChange={e => update({ area_opacity: Number(e.target.value) })}
                style={sliderStyle}
              />
            </>
          )}

          {/* Conditional Color (pos/neg bars) */}
          {isBar && (
            <>
              <div style={sectionLabel}>Conditional Color (Pos/Neg)</div>
              <div style={rowStyle}>
                {toggleBtn(condColor, () => update({ conditional_color: !condColor }), condColor ? '✅ ON' : 'OFF')}
                {condColor && (
                  <>
                    <input type="color" value={config?.conditional_positive || '#22c55e'}
                      onChange={e => update({ conditional_positive: e.target.value })}
                      style={{ width: '24px', height: '24px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                      title="Positive color"
                    />
                    <input type="color" value={config?.conditional_negative || '#ef4444'}
                      onChange={e => update({ conditional_negative: e.target.value })}
                      style={{ width: '24px', height: '24px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                      title="Negative color"
                    />
                  </>
                )}
              </div>
            </>
          )}

          {/* Data Labels */}
          <div style={sectionLabel}>Data Labels</div>
          <div style={rowStyle}>
            {toggleBtn(showDataLabels, () => update({ show_data_labels: !showDataLabels }), showDataLabels ? '📊 ON' : '📊 OFF')}
            {showDataLabels && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border-muted text-[11px] font-bold text-text-primary hover:border-accent transition-all" style={{ background: 'var(--color-bg-overlay)' }}>
                    {dataLabelFormat} <ChevronDown size={10} className="text-text-quaternary" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Label Format</DropdownMenuLabel>
                  {[
                    { id: 'value', label: 'Value' },
                    { id: 'percent', label: 'Percent' },
                    { id: 'name', label: 'Name' },
                    { id: 'name_value', label: 'Name + Value' },
                    { id: 'name_percent', label: 'Name + %' },
                  ].map(f => (
                    <DropdownMenuItem key={f.id} onClick={() => update({ data_label_format: f.id })}>
                      {f.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Legend Position */}
          <div style={sectionLabel}>Legend</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {[
              { id: 'bottom', label: '⬇ Bottom' },
              { id: 'top', label: '⬆ Top' },
              { id: 'right', label: '➡ Right' },
              { id: 'hidden', label: '🚫 Hidden' },
            ].map(l => toggleBtn(legendPos === l.id, () => update({ legend_position: l.id }), l.label))}
          </div>
        </div>
      )}
    </div>
  );
}
