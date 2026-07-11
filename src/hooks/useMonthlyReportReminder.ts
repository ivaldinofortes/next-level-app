import { useEffect } from 'react';
import type { Notificacao } from '../types/app';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function useMonthlyReportReminder({ enabled, loggedIn, setAvailable, notify }: {
  enabled: boolean;
  loggedIn: boolean;
  setAvailable: (label: string) => void;
  notify: (title: string, message: string, type: Notificacao['tipo']) => void;
}) {
  useEffect(() => {
    if (!enabled || !loggedIn) return;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const day = now.getDate();
    const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const key = `nl_relatorio_notif_${previousYear}-${String(previousMonth).padStart(2, '0')}`;
    if ((day < daysInMonth - 1 && day > 3) || localStorage.getItem(key)) return;

    const month = day >= daysInMonth - 1 ? MONTHS[now.getMonth()] : MONTHS[previousMonth - 1];
    const label = `${month} ${day >= daysInMonth - 1 ? now.getFullYear() : previousYear}`;
    setAvailable(label);
    notify(
      'Relatório mensal disponível',
      `O relatório de ${label} está pronto. Abra Relatórios (barra superior) para rever finanças, métodos de pagamento e atividade da equipa — e exportar PDF/Excel.`,
      'info',
    );
    localStorage.setItem(key, '1');
  }, [enabled, loggedIn, setAvailable, notify]);
}
