import { useCallback } from 'react';

type ElectronBridge = { ipcRenderer?: { invoke: (channel: string, payload: unknown) => Promise<unknown> } } | null;

export function useSystemNotification(electron: ElectronBridge, enabled: boolean) {
  return useCallback(async (title: string, body: string) => {
    if (!electron?.ipcRenderer || !enabled) return;
    await electron.ipcRenderer.invoke('notify-system', { title, body });
  }, [electron, enabled]);
}
