import { useCallback, useRef, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ message: '', visible: false });
  const timerRef = useRef<number | undefined>(undefined);
  const showToast = useCallback((message: string) => {
    window.clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = window.setTimeout(() => setToast({ message: '', visible: false }), 3000);
  }, []);
  return { toast, showToast };
}
