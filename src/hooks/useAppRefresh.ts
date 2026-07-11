import { useCallback } from 'react';

export function useAppRefresh({ electron, reloadData, showToast, setSyncing }: {
  electron: { ipcRenderer?: { invoke: (channel: string) => Promise<{ success?: boolean; message?: string }> } } | null;
  reloadData: () => Promise<void>;
  showToast: (message: string) => void;
  setSyncing: (value: boolean) => void;
}) {
  return useCallback(async () => {
    setSyncing(true);
    try {
      if (electron?.ipcRenderer) {
        const result = await electron.ipcRenderer.invoke('refresh-app');
        if (result?.success === false) throw new Error(result.message || 'Falha ao atualizar a aplicação.');
        return;
      }
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao atualizar a aplicação:', error);
      await reloadData();
      setSyncing(false);
      showToast(error?.message || 'Não foi possível atualizar a aplicação.');
    }
  }, [electron, reloadData, showToast, setSyncing]);
}
