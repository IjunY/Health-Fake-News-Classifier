import { useEffect, useRef } from "react";

export default function ErrorModal({ message, onClose }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!message) return;

    previouslyFocusedRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    document.body.classList.add("modal-open");

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      // Keep focus inside the dialog while it is open
      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
      previouslyFocusedRef.current?.focus?.();
    };
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-message"
        ref={dialogRef}
      >
        <span className="modal-icon" aria-hidden="true" />
        <h2 id="error-modal-title" className="modal-title bold">
          發生錯誤
        </h2>
        <p id="error-modal-message" className="modal-message">
          {message}
        </p>
        <button
          type="button"
          ref={closeButtonRef}
          className="modal-button bold"
          onClick={onClose}
        >
          我知道了
        </button>
      </div>
    </div>
  );
}
