import { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import './Modal.css';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null);

  const showModal = useCallback((options) => {
    setModal({
      type: options.type || 'info',
      title: options.title || '',
      message: options.message || '',
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      showButtons: options.showButtons !== false // Default to true
    });
  }, []);

  const hideModal = useCallback(() => {
    setModal(null);
  }, []);

  const handleConfirm = () => {
    modal?.onConfirm?.();
    hideModal();
  };

  const handleCancel = () => {
    modal?.onCancel?.();
    hideModal();
  };

  const alert = {
    success: (title, message) => showModal({ type: 'success', title, message }),
    error: (title, message) => showModal({ type: 'error', title, message }),
    warning: (title, message) => showModal({ type: 'warning', title, message }),
    info: (title, message) => showModal({ type: 'info', title, message }),
    loading: (title, message) => showModal({ type: 'loading', title, message, showButtons: false }),
    hide: () => hideModal(),
    confirm: (title, message, onConfirm, onCancel) => showModal({
      type: 'confirm',
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm,
      onCancel
    })
  };

  return (
    <ModalContext.Provider value={alert}>
      {children}
      {modal && (
        <div className="modal-overlay" onClick={modal.type !== 'loading' ? hideModal : undefined}>
          <div className={`modal-content modal-${modal.type}`} onClick={e => e.stopPropagation()}>
            {modal.type !== 'loading' && (
              <button className="modal-close" onClick={hideModal}>
                <X size={20} />
              </button>
            )}
            
            <div className="modal-icon">
              {modal.type === 'success' && <CheckCircle size={48} />}
              {modal.type === 'error' && <AlertCircle size={48} />}
              {modal.type === 'warning' && <AlertTriangle size={48} />}
              {modal.type === 'info' && <Info size={48} />}
              {modal.type === 'confirm' && <AlertTriangle size={48} />}
              {modal.type === 'loading' && <Loader2 size={48} className="modal-spinner" />}
            </div>

            <h3 className="modal-title">{modal.title}</h3>
            <p className="modal-message">{modal.message}</p>

            {modal.showButtons && (
              <div className="modal-actions">
                {modal.cancelText && (
                  <button className="btn btn-secondary" onClick={handleCancel}>
                    {modal.cancelText}
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleConfirm}>
                  {modal.confirmText}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
