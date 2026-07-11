import { useEffect } from 'react';

export function useAutoSlideshow(disabled: boolean, imageCount: number, intervalSeconds: number, next: () => void) {
  useEffect(() => {
    if (disabled || imageCount === 0) return;
    const interval = window.setInterval(next, intervalSeconds * 1000);
    return () => window.clearInterval(interval);
  }, [disabled, imageCount, intervalSeconds, next]);
}
