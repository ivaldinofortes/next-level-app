import { useCallback, useState } from 'react';
import type { Pagamento } from '../types/app';

type ElectronBridge = { ipcRenderer?: { invoke: (channel: string, ...args: unknown[]) => Promise<Pagamento[]> } } | null;

export function usePaymentHistory(electron: ElectronBridge) {
  const [historicoPagamentos, setHistoricoPagamentos] = useState<Pagamento[]>([]);
  const carregarHistorico = useCallback(async (alunoId: string) => {
    if (!electron?.ipcRenderer) return;
    setHistoricoPagamentos(await electron.ipcRenderer.invoke('get-historico-pagamentos', alunoId));
  }, [electron]);
  return { historicoPagamentos, setHistoricoPagamentos, carregarHistorico };
}
