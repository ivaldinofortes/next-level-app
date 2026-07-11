import type { Pagamento } from '../types/app';

type ElectronBridge = { ipcRenderer?: { invoke: (channel: string, payload: unknown) => Promise<{ success?: boolean; message?: string }> } } | null;

export async function registerPaymentAtomically(electron: ElectronBridge, payment: Pagamento, nextChargeDate?: string, updateStudentDue = true) {
  if (!electron?.ipcRenderer) throw new Error('Electron IPC indisponível.');
  const result = await electron.ipcRenderer.invoke('billing:register-payment', { pagamento: payment, nextChargeDate, updateStudentDue });
  if (!result?.success) throw new Error(result?.message || 'Erro ao registar pagamento.');
  return result;
}
