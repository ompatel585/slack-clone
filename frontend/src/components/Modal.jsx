import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import "../styles/modal.css";

/**
 * Accessible modal built on the native <dialog>: the browser traps focus, renders it in the
 * top layer and handles Escape. Mount it to open it; `onClose` should unmount it.
 */
const Modal = ({ title, description, onClose, children, footer, size = "md" }) => {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;

    dialog.showModal();
    // showModal() moves focus to the first focusable element (the close button), which would
    // override React's autoFocus, so focus the marked field explicitly afterwards
    dialog.querySelector("[data-autofocus]")?.focus();
  }, []);

  const handleCancel = (event) => {
    // Let React own the open state instead of the browser closing the dialog itself
    event.preventDefault();
    onClose();
  };

  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="modal__panel">
        <header className="modal__header">
          <div className="modal__heading">
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="modal__description">
                {description}
              </p>
            )}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </dialog>
  );
};

export default Modal;
