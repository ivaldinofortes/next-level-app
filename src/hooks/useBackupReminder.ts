import { useEffect } from 'react';
import type { Notificacao } from '../types/app';

type Notify = (titulo: string, mensagem: string, tipo: Notificacao['tipo']) => void;

export function useBackupReminder({
  enabled,
  lastBackupMonth,
  academyName,
  notify,
  notifySystem,
}: {
  enabled: boolean;
  lastBackupMonth: string;
  academyName: string;
  notify: Notify;
  notifySystem: (title: string, message: string) => void;
}) {
  useEffect(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const reminderKey = `nl_backup_alert_${monthKey}`;
    if (!enabled || lastBackupMonth === monthKey || localStorage.getItem(reminderKey)) return;

    notify('Lembrete de Backup Mensal', 'Recomendado exportar o dossier operacional em Excel e gerar um backup ZIP antes de fechar o mês.', 'alerta');
    notifySystem(academyName, 'Faça o backup mensal: exporte o dossier em Excel e gere o backup ZIP do sistema.');
    localStorage.setItem(reminderKey, '1');
  }, [enabled, lastBackupMonth, academyName, notify, notifySystem]);
}
