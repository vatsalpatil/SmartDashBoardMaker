// src/components/ui/Skeleton.jsx
export function SkeletonBlock({ className = '', height = 'h-4', width = 'w-full' }) {
  return (
    <div className={`skeleton rounded ${height} ${width} ${className}`} />
  );
}

export function SkeletonCard({ rows = 3, className = '' }) {
  return (
    <div className={`bg-bg-raised border border-border-default rounded-xl p-5 space-y-3 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton w-9 h-9 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-36 rounded" />
          <div className="skeleton h-2.5 w-20 rounded" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-2.5 rounded" style={{ width: `${60 + Math.random() * 35}%` }} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="border border-border-default rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-bg-overlay px-4 py-2.5 flex gap-4 border-b border-border-default">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-3 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-2.5 flex gap-4 border-b border-border-muted last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton h-3 rounded flex-1" style={{ opacity: 1 - i * 0.12 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkeletonCard;
