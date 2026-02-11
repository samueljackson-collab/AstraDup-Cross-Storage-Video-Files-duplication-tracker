import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colors = {
    success: 'border-green-600 bg-green-900/90',
    error: 'border-red-600 bg-red-900/90',
    info: 'border-green-700 bg-black/90',
  };

  const Icon = toast.type === 'error' ? XCircleIcon : CheckCircleIcon;
  const iconColor = toast.type === 'error' ? 'text-red-400' : 'text-green-400';

  return (
    <div
      className={`flex items-start p-3 rounded-lg border shadow-lg backdrop-blur-sm ${colors[toast.type]} animate-[slideIn_0.2s_ease-out]`}
      role="alert"
    >
      <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <p className="ml-3 text-sm text-green-300">{toast.message}</p>
      <button onClick={onDismiss} className="ml-auto pl-2 text-green-600 hover:text-green-400">
        <XCircleIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
