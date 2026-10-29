import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '../Icons';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  /** 阻止 Esc / 点击遮罩关闭（例如导入进行中） */
  dismissible?: boolean;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

/**
 * 原生实现的轻量弹窗：
 * - Portal 到 body，避免被卡片 overflow 裁切；
 * - 背景滚动锁定、Esc 关闭、焦点圈定；
 * - 关闭后把焦点还给触发元素。
 */
export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  dismissible = true,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // 用 ref 保存回调，避免父组件每次输入导致 effect 重跑和焦点丢失。
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const autoFocus = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]');
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
      );
      (autoFocus ?? firstFocusable ?? panelRef.current)?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && dismissibleRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);

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
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink-950/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && closeOnBackdrop && dismissible) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`animate-pop-in relative my-0 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-ink-900/10 bg-cream-50 shadow-lift outline-none sm:my-6 sm:max-h-[88vh] sm:rounded-3xl ${SIZE_CLASS[size]}`}
      >
        <div className="sticky top-0 z-10 flex items-start gap-4 border-b border-ink-900/[0.07] bg-cream-50/95 px-5 py-4 backdrop-blur sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-ink-900">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-ink-500">
                {description}
              </p>
            ) : null}
          </div>
          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="-mr-1 rounded-full p-2 text-ink-500 transition hover:bg-ink-900/[0.06] hover:text-ink-900 focus-visible:ring-4 focus-visible:ring-moss-500/20"
            >
              <XIcon className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-ink-900/[0.07] bg-cream-50/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
