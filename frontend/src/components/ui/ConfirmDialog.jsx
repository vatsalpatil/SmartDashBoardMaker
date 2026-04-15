// src/components/ui/ConfirmDialog.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { Button } from './Button';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        title: options.title || 'Are you sure?',
        message: options.message || 'This action cannot be undone.',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        variant: options.variant || 'danger',
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={handleCancel}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              {state?.cancelLabel}
            </Button>
            <Button variant={state?.variant || 'danger'} size="sm" onClick={handleConfirm}>
              {state?.confirmLabel}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-rose-muted flex items-center justify-center">
            <AlertTriangle size={20} className="text-rose" />
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-text-primary mb-1">{state?.title}</h4>
            <p className="text-[13px] text-text-tertiary leading-relaxed">{state?.message}</p>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}

export default ConfirmProvider;
