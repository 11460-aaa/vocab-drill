import type { ToastState } from '../hooks/useToast';
import { AlertIcon, CheckIcon, InfoIcon, XIcon } from './Icons';

interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

const TONE_STYLES = {
  success: 'border-moss-200 bg-moss-700 text-white',
  error: 'border-coral-500 bg-coral-600 text-white',
  info: 'border-ink-700 bg-ink-900 text-white',
};

const TONE_ICONS = {
  success: CheckIcon,
  error: AlertIcon,
  info: InfoIcon,
};

/** 固定在视口底部的短提示；不拦截页面其他操作。 */
export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null;
  const Icon = TONE_ICONS[toast.tone];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4 sm:bottom-8"
      aria-live="polite"
    >
      <div
        key={toast.id}
        role="status"
        className={`animate-pop-in pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lift ${TONE_STYLES[toast.tone]}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="leading-snug">{toast.message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-1 rounded-full p-0.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="关闭提示"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
