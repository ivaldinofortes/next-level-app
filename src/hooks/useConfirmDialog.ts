import { useCallback, useState } from 'react';
import type { ConfirmDialogState } from '../types/app';

export function useConfirmDialog() {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ visible: false, title: '', message: '', confirmLabel: 'Confirmar' });
  const abrirConfirmacao = useCallback((config: Omit<ConfirmDialogState, 'visible'>) => setConfirmDialog({ visible: true, ...config }), []);
  const fecharConfirmacao = useCallback(() => setConfirmDialog((previous) => ({ ...previous, visible: false })), []);
  return { confirmDialog, setConfirmDialog, abrirConfirmacao, fecharConfirmacao };
}
