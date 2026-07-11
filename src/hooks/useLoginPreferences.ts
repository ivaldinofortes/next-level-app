import { useState } from 'react';

const readJson = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
};

export function useLoginPreferences() {
  const [quickAccessUsers, setQuickAccessUsers] = useState<number[]>(() => readJson('nl_quick_access_users', []));
  const [slideshowImages, setSlideshowImages] = useState<string[]>(() => readJson('nl_slideshow_images', []));
  const [slideshowTimer, setSlideshowTimer] = useState(() => Number(localStorage.getItem('nl_slideshow_timer') || '6'));
  const [slideshowTextEnabled, setSlideshowTextEnabled] = useState(() => localStorage.getItem('nl_slideshow_text') !== '0');
  const [loginSlideshowUsers, setLoginSlideshowUsers] = useState<any[]>([]);
  return { quickAccessUsers, setQuickAccessUsers, slideshowImages, setSlideshowImages, slideshowTimer, setSlideshowTimer, slideshowTextEnabled, setSlideshowTextEnabled, loginSlideshowUsers, setLoginSlideshowUsers };
}
