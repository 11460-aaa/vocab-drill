import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

/** 轻量顶部 / 底部提示，自动消失。 */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      clearTimer();
      setToast({ id: Date.now(), message, tone });
      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, 3200);
    },
    [clearTimer],
  );

  const dismissToast = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { toast, showToast, dismissToast };
}
