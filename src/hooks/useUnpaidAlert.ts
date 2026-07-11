import { useEffect } from 'react';
import type { Notificacao } from '../types/app';

export function useUnpaidAlert(studentCount: number, debtCount: number, month: string, notify: (title: string, message: string, type: Notificacao['tipo']) => void) {
  useEffect(() => {
    const key = `nl_checked_unpaid_${month}`;
    if (!studentCount || !debtCount || localStorage.getItem(key)) return;
    notify('Alerta de Pagamentos', `Existem ${debtCount} alunos com cobrança vencida neste momento.`, 'alerta');
    localStorage.setItem(key, 'true');
  }, [studentCount, debtCount, month, notify]);
}
