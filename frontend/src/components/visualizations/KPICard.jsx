export default function KPICard({ label, value, subtitle, color }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: color || 'var(--text-heading)' }}>
        {typeof value === 'number'
          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : value
        }
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>
      )}
    </div>
  );
}
