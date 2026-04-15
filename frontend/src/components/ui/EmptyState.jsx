// src/components/ui/EmptyState.jsx
import { Button } from './Button';

export function EmptyState({ icon: Icon, title, description, action, actionLabel, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-bg-muted border border-border-default flex items-center justify-center mb-5">
          <Icon size={22} className="text-text-quaternary" />
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-text-primary mb-1.5">{title}</h3>
      {description && (
        <p className="text-[13px] text-text-tertiary max-w-xs leading-relaxed mb-5">
          {description}
        </p>
      )}
      {action && actionLabel && (
        <Button variant="primary" size="sm" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
