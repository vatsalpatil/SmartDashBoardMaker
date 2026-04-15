// src/components/ui/Spinner.jsx
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-[1.5px]',
    md: 'w-5 h-5 border-2',
    lg: 'w-7 h-7 border-2',
    xl: 'w-10 h-10 border-[3px]',
  };
  return (
    <div
      className={[
        'rounded-full border-border-default border-t-accent animate-spin',
        sizes[size] ?? sizes.md,
        className,
      ].join(' ')}
    />
  );
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner size="lg" />
      <p className="text-[13px] text-text-tertiary">{message}</p>
    </div>
  );
}

export default Spinner;
