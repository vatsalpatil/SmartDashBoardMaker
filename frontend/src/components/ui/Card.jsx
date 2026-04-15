// src/components/ui/Card.jsx
export function Card({ children, className = '', hover = true, glow = false, glass = false, padding = 'md', onClick, ...props }) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6', xl: 'p-8' };

  return (
    <div
      className={[
        'rounded-xl border border-border-default transition-all duration-200',
        glass ? 'glass' : 'bg-bg-raised',
        hover ? 'hover:border-border-strong' : '',
        glow ? 'hover:shadow-glow-accent' : '',
        onClick ? 'cursor-pointer active:scale-[0.995]' : '',
        paddings[padding] ?? paddings.md,
        className,
      ].join(' ')}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-[14px] font-semibold text-text-primary tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export default Card;
