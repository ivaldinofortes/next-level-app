import { AlertTriangle } from 'lucide-react';
import type { ConfirmDialogState } from '../types/app';
import AppModalShell from './AppModalShell';

export default function ConfirmDialogModal({
  dialog,
  onClose,
}: {
  dialog: ConfirmDialogState;
  onClose: () => void;
}) {
  if (!dialog.visible) return null;

  const isDanger = dialog.tone === 'danger';
  const isWarning = dialog.tone === 'warning';
  const accent = isDanger ? 'var(--color-error)' : isWarning ? 'var(--color-warning)' : 'var(--color-primary)';
  const btnClass = isDanger
    ? '!bg-red-600 hover:!bg-red-700 !border-red-700 !text-white'
    : isWarning
      ? '!bg-orange-500 hover:!bg-orange-600 !border-orange-600 !text-white'
      : 'nl-btn-primary';

  return (
    <AppModalShell
      title={dialog.title}
      subtitle="Confirmação necessária"
      onClose={onClose}
      maxWidth="max-w-md"
      zIndex={9999}
      accent={accent}
      hideBrand
      footer={(
        <>
          <button type="button" onClick={onClose} className="nl-btn nl-btn-ghost !h-10 !px-5">
            Cancelar
          </button>
          <button
            type="button"
            onClick={async () => {
              const action = dialog.onConfirm;
              onClose();
              if (action) await action();
            }}
            className={`nl-btn !h-10 !px-6 ${btnClass}`}
          >
            {dialog.confirmLabel}
          </button>
        </>
      )}
    >
      <div className="space-y-4 px-6 py-5">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-white"
            style={{ background: accent }}
          >
            <AlertTriangle size={18} />
          </div>
          <p className="pt-1 text-[14px] leading-relaxed nl-text">{dialog.message}</p>
        </div>
      </div>
    </AppModalShell>
  );
}
