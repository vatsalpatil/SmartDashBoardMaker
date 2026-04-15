// src/components/ui/Modal.jsx
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, footer, size = 'md', className = '' }) {
  const overlayRef = useRef(null);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-5xl',
  };

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
    >
      <div
        className={[
          'relative w-full bg-bg-raised border border-border-default rounded-xl shadow-xl animate-scale-in flex flex-col max-h-[85vh] overflow-hidden',
          sizes[size] ?? sizes.md,
          className,
        ].join(' ')}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-muted shrink-0">
            <h3 className="text-[15px] font-semibold text-text-primary">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-text-quaternary hover:text-text-primary hover:bg-bg-muted transition-all"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border-muted flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
