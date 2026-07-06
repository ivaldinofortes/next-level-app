import type { FC } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface MsgProps {
  ok: boolean;
  texto: string;
}

export const Msg: FC<MsgProps> = ({ ok, texto }) => {
  return (
    <div
      className="p-3 rounded-[5px] flex items-start gap-2 text-[12px]"
      style={{
        background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
        color: ok ? '#6ee7b7' : '#fca5a5',
      }}
    >
      {ok ? (
        <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
      ) : (
        <AlertCircle size={13} className="shrink-0 mt-0.5" />
      )}
      <span>{texto}</span>
    </div>
  );
};

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  tone = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!visible) return null;

  const getToneStyles = () => {
    switch (tone) {
      case 'danger':
        return {
          bg: 'linear-gradient(135deg,#7f0000,#b91c1c)',
          border: '1px solid rgba(185,28,28,0.5)',
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg,#92400e,#b45309)',
          border: '1px solid rgba(180,83,9,0.5)',
        };
      default:
        return {
          bg: 'linear-gradient(135deg,#0665ff,#0052cc)',
          border: '1px solid rgba(6,101,255,0.5)',
        };
    }
  };

  const toneStyles = getToneStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-[420px] rounded-[8px] overflow-hidden shadow-2xl p-6 space-y-4"
        style={{ background: '#FFFFFF', border: '1px solid #EBECF0' }}
      >
        <div>
          <h2 className="text-[16px] font-bold text-[#172B4D] mb-1">{title}</h2>
          <p className="text-[13px] text-[#626F86]">{message}</p>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-10 rounded-[5px] text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{ background: '#EBECF0', color: '#172B4D' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-10 rounded-[5px] text-[13px] font-bold transition-all disabled:opacity-50 text-white"
            style={{ background: toneStyles.bg, border: toneStyles.border }}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
