// src/components/ui/Toast.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: <CheckCircle2 size={15} className="text-emerald shrink-0" />,
  error: <AlertCircle size={15} className="text-rose shrink-0" />,
  warning: <AlertTriangle size={15} className="text-amber shrink-0" />,
  info: <Info size={15} className="text-accent shrink-0" />,
};

const styles = {
  success: 'border-emerald/20 bg-emerald-muted',
  error: 'border-rose/20 bg-rose-muted',
  warning: 'border-amber/20 bg-amber-muted',
  info: 'border-accent/20 bg-accent-muted',
};

function ToastItem({ id, type = 'info', message, title, onRemove }) {
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(id), 250);
  }, [id, onRemove]);

  useEffect(() => {
    const t = setTimeout(handleClose, 4000);
    return () => clearTimeout(t);
  }, [handleClose]);

  return (
    <div
      className={[
        'flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-lg min-w-[260px] max-w-[360px]',
        'bg-bg-raised',
        styles[type],
        exiting ? 'animate-slide-out-right' : 'animate-slide-in-right',
      ].join(' ')}
    >
      {icons[type]}
      <div className="flex-1 min-w-0">
        {title && <div className="text-[13px] font-semibold text-text-primary mb-0.5">{title}</div>}
        <div className="text-[12px] text-text-secondary leading-snug">{message}</div>
      </div>
      <button
        onClick={handleClose}
        className="shrink-0 text-text-quaternary hover:text-text-primary transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((type, message, title) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message, title }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const api = {
    success: (msg, title) => toast('success', msg, title),
    error: (msg, title) => toast('error', msg, title),
    warning: (msg, title) => toast('warning', msg, title),
    info: (msg, title) => toast('info', msg, title),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div id="toast-root" className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem {...t} onRemove={remove} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export default ToastProvider;
