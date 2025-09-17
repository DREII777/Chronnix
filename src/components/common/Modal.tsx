import { PropsWithChildren, useEffect, useId, useRef } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
}

const Modal = ({ title, onClose, children }: PropsWithChildren<ModalProps>) => {
  const hasFocused = useRef(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;

    if (!hasFocused.current) {
      const scope = containerRef.current;
      const el =
        scope?.querySelector<HTMLElement>('[data-autofocus]') ??
        scope?.querySelector<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])');
      el?.focus();
      hasFocused.current = true;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      hasFocused.current = false;
      previousFocus.current?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} role="presentation" />
      <div
        ref={containerRef}
        className="relative bg-white rounded-2xl shadow-xl border w-full max-w-lg p-5"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 id={headingId} className="text-lg font-semibold">
            {title}
          </h3>
          <button className="text-gray-500" onClick={onClose} aria-label="Fermer" type="button">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
