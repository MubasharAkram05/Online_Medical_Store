import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './DialogContext.css';

const DialogContext = createContext(null);

const DEFAULT_CONFIRM = {
  title: 'Confirmation',
  message: 'Are you sure?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger'
};

const DEFAULT_PROMPT = {
  title: 'Input Required',
  message: 'Please enter a value.',
  placeholder: 'Type here...',
  confirmText: 'Submit',
  cancelText: 'Cancel',
  variant: 'primary',
  initialValue: ''
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};

const DialogModal = ({ dialog, onResolve }) => {
  const [inputValue, setInputValue] = useState(dialog?.options?.initialValue || '');

  if (!dialog) return null;

  const { type, options } = dialog;

  const handleCancel = () => onResolve(type === 'prompt' ? null : false);
  const handleConfirm = () => {
    if (type === 'prompt') {
      onResolve(inputValue);
      return;
    }
    onResolve(true);
  };

  const handleOverlayClick = () => {
    if (type === 'alert') {
      onResolve(true);
      return;
    }
    handleCancel();
  };

  return createPortal(
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="dialog-title">{options.title}</h3>
        <p className="dialog-message">{options.message}</p>

        {type === 'prompt' && (
          <input
            className="dialog-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={options.placeholder}
            autoFocus
          />
        )}

        <div className="dialog-actions">
          {type !== 'alert' && (
            <button type="button" className="dialog-btn dialog-btn-cancel" onClick={handleCancel}>
              {options.cancelText || 'Cancel'}
            </button>
          )}
          <button
            type="button"
            className={`dialog-btn dialog-btn-${options.variant || 'primary'}`}
            onClick={handleConfirm}
          >
            {options.confirmText || (type === 'alert' ? 'OK' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const closeDialog = (value) => {
    const resolver = resolveRef.current;
    resolveRef.current = null;
    setDialog(null);
    if (resolver) resolver(value);
  };

  const openDialog = (type, options) =>
    new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ type, options });
    });

  const value = useMemo(
    () => ({
      confirm: (options = {}) => openDialog('confirm', { ...DEFAULT_CONFIRM, ...options }),
      prompt: (options = {}) => openDialog('prompt', { ...DEFAULT_PROMPT, ...options }),
      alert: (options = {}) =>
        openDialog('alert', {
          title: options.title || 'Message',
          message: options.message || '',
          confirmText: options.confirmText || 'OK',
          variant: options.variant || 'primary'
        })
    }),
    []
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <DialogModal dialog={dialog} onResolve={closeDialog} />
    </DialogContext.Provider>
  );
};
