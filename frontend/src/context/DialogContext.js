import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
// createPortal — renders modal outside the normal DOM hierarchy — directly in document.body
import { createPortal } from 'react-dom';
// dialog specific styles
import './DialogContext.css';

// create context — stores dialog functions (confirm, prompt, alert)
// null is default — throws error if used outside DialogProvider
const DialogContext = createContext(null);

/**
 * Default options for confirm dialog
 * Used when caller does not provide these values
 */
const DEFAULT_CONFIRM = {
  title: 'Confirmation',
  message: 'Are you sure?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger'        // red button — destructive action
};

/**
 * Default options for prompt dialog
 * Used when caller does not provide these values
 */
const DEFAULT_PROMPT = {
  title: 'Input Required',
  message: 'Please enter a value.',
  placeholder: 'Type here...',
  confirmText: 'Submit',
  cancelText: 'Cancel',
  variant: 'primary',
  initialValue: ''          // input starts empty
};

/**
 * useDialog — custom hook to access dialog functions
 * Must be used inside DialogProvider — throws error if used outside
 * Returns: { confirm, prompt, alert } functions
 */
export const useDialog = () => {
  const context = useContext(DialogContext);
  // if context is null — component is outside DialogProvider
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};

/**
 * DialogModal Component
 * Renders the actual dialog UI — title, message, input, buttons
 * Uses createPortal to render directly in document.body
 * Handles 3 dialog types: confirm, prompt, alert
 *
 * @param {object} dialog - Current dialog data { type, options }
 * @param {function} onResolve - Function to close dialog and return value
 */
const DialogModal = ({ dialog, onResolve }) => {

  // input value state — only used for prompt dialog
  // initialized with initialValue option or empty string
  const [inputValue, setInputValue] = useState(dialog?.options?.initialValue || '');

  // if no dialog — render nothing
  if (!dialog) return null;

  const { type, options } = dialog;

  // Cancel button clicked — resolve with false (confirm) or null (prompt)
  const handleCancel = () => onResolve(type === 'prompt' ? null : false);

  // Confirm button clicked
  const handleConfirm = () => {
    if (type === 'prompt') {
      // prompt — resolve with input value user typed
      onResolve(inputValue);
      return;
    }
    // confirm/alert — resolve with true
    onResolve(true);
  };

  // Overlay (dark background) clicked
  const handleOverlayClick = () => {
    if (type === 'alert') {
      // alert has no cancel — treat overlay click as confirm
      onResolve(true);
      return;
    }
    // confirm/prompt — treat overlay click as cancel
    handleCancel();
  };

  // createPortal renders modal directly in document.body
  // avoids CSS stacking issues from parent components
  return createPortal(
    // overlay — dark background, clicking closes dialog
    <div className="dialog-overlay" onClick={handleOverlayClick}>

      {/* dialog box — stopPropagation prevents overlay click when clicking inside */}
      <div className="dialog-modal" onClick={(e) => e.stopPropagation()}>

        {/* dialog title */}
        <h3 className="dialog-title">{options.title}</h3>

        {/* dialog message */}
        <p className="dialog-message">{options.message}</p>

        {/* input field — only shown for prompt type
            autoFocus automatically focuses input when dialog opens */}
        {type === 'prompt' && (
          <input
            className="dialog-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={options.placeholder}
            autoFocus
          />
        )}

        {/* action buttons */}
        <div className="dialog-actions">

          {/* cancel button — hidden for alert type
              alert only has one button (OK) */}
          {type !== 'alert' && (
            <button
              type="button"
              className="dialog-btn dialog-btn-cancel"
              onClick={handleCancel}
            >
              {options.cancelText || 'Cancel'}
            </button>
          )}

          {/* confirm button — variant controls color
              alert → 'OK', others → 'Confirm' */}
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
    // render inside document.body — outside React app tree
    document.body
  );
};

/**
 * DialogProvider Component
 * Wraps the app and provides dialog functions to all child components
 * Manages dialog state and promise resolution
 *
 * @param {ReactNode} children - App components wrapped inside provider
 */
export const DialogProvider = ({ children }) => {

  // dialog state — stores current dialog data { type, options }
  // null means no dialog is open
  const [dialog, setDialog] = useState(null);

  // ref stores the resolve function of the current promise
  // ref used instead of state — changing ref does not cause re-render
  const resolveRef = useRef(null);

  /**
   * closeDialog — closes dialog and resolves the promise with a value
   * Called when user clicks confirm, cancel, or overlay
   *
   * @param {any} value - Value to resolve promise with
   * confirm → true/false
   * prompt  → string/null
   * alert   → true
   */
  const closeDialog = (value) => {
    const resolver = resolveRef.current;
    // clear ref — prevent calling resolver twice
    resolveRef.current = null;
    // hide dialog
    setDialog(null);
    // resolve the promise — caller gets the value
    if (resolver) resolver(value);
  };

  /**
   * openDialog — opens a dialog and returns a promise
   * Promise resolves when user closes the dialog
   *
   * @param {string} type - Dialog type: 'confirm' | 'prompt' | 'alert'
   * @param {object} options - Dialog options (title, message, etc.)
   * @returns {Promise} - Resolves with user's response
   */
  const openDialog = (type, options) =>
    new Promise((resolve) => {
      // store resolve function in ref — called when dialog closes
      resolveRef.current = resolve;
      // show dialog with type and options
      setDialog({ type, options });
    });

  /**
   * value — dialog functions exposed to all child components via context
   * useMemo prevents recreating these functions on every render
   * empty dependency array — functions never change
   */
  const value = useMemo(
    () => ({
      // confirm — shows confirm dialog with danger button
      // returns Promise<true | false>
      confirm: (options = {}) =>
        openDialog('confirm', { ...DEFAULT_CONFIRM, ...options }),

      // prompt — shows input dialog
      // returns Promise<string | null>
      // null if cancelled, string if confirmed
      prompt: (options = {}) =>
        openDialog('prompt', { ...DEFAULT_PROMPT, ...options }),

      // alert — shows simple message dialog with OK button only
      // returns Promise<true>
      alert: (options = {}) =>
        openDialog('alert', {
          title: options.title || 'Message',
          message: options.message || '',
          confirmText: options.confirmText || 'OK',
          variant: options.variant || 'primary'
        })
    }),
    [] // empty array — value never changes
  );

  return (
    // provide dialog functions to all children
    <DialogContext.Provider value={value}>
      {/* render app content */}
      {children}
      {/* render dialog modal — shown when dialog state is not null */}
      <DialogModal dialog={dialog} onResolve={closeDialog} />
    </DialogContext.Provider>
  );
};