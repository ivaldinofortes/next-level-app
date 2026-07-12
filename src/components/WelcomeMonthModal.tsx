import { CalendarDays, FileBarChart, Sparkles, X } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';

interface WelcomeMonthModalProps {
  mes: string;
  ano: number;
  mesAnteriorLabel?: string;
  appLogo?: string;
  nomeAcademia?: string;
  onClose: () => void;
  onOpenReports: () => void;
}

/**
 * Boas-vindas ao mês novo — mesmo espírito da matrícula (modal celebrativo).
 */
export default function WelcomeMonthModal({
  mes,
  ano,
  mesAnteriorLabel,
  appLogo,
  nomeAcademia,
  onClose,
  onOpenReports,
}: WelcomeMonthModalProps) {
  return (
    <div
      className="fixed inset-0 z-[410] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.38)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[440px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative px-5 pb-5 pt-6 text-white"
          style={{
            background: 'linear-gradient(145deg, #1e3a5f 0%, #2563eb 45%, #c64600 120%)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/20"
            title="Fechar"
          >
            <X size={15} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[10px] border border-white/20 bg-white/10 p-1.5">
              <img src={appLogo || APP_ICON_PATH} alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
                <Sparkles size={12} /> Novo período
              </p>
              <h2 className="mt-0.5 text-[22px] font-semibold capitalize leading-tight">
                Bem-vindo a {mes}
              </h2>
              <p className="text-[13px] font-medium tabular-nums text-white/80">{ano}</p>
            </div>
          </div>
          <p className="mt-4 text-[13px] font-medium leading-relaxed text-white/85">
            {nomeAcademia || 'A academia'} arranca um novo mês operacional. A régua de tempo preserva os meses
            anteriores tal como fecharam — os dados passados ficam protegidos por defeito.
          </p>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="flex gap-3 rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 p-3">
            <CalendarDays size={18} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
            <div>
              <p className="text-[13px] font-semibold nl-text">Operação do mês actual</p>
              <p className="mt-0.5 text-[12px] font-medium nl-text-muted">
                Matrículas, cobranças e notas aplicam-se a <strong className="capitalize nl-text">{mes} {ano}</strong>.
              </p>
            </div>
          </div>

          {mesAnteriorLabel && (
            <div className="flex gap-3 rounded-[var(--radius-control)] border border-[color-mix(in_srgb,#c64600_28%,var(--border))] bg-[color-mix(in_srgb,#c64600_8%,var(--bg-surface))] p-3">
              <FileBarChart size={18} className="mt-0.5 shrink-0 text-[#c64600]" />
              <div>
                <p className="text-[13px] font-semibold nl-text">Relatório de {mesAnteriorLabel}</p>
                <p className="mt-0.5 text-[12px] font-medium nl-text-muted">
                  O mês anterior está fechado e o relatório pode ser exportado em Relatórios (PDF ou Excel).
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-light)] px-5 py-3">
          <button type="button" onClick={onClose} className="nl-btn nl-btn-ghost !h-9">
            Continuar
          </button>
          {mesAnteriorLabel && (
            <button
              type="button"
              onClick={onOpenReports}
              className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #e36b2c 0%, #c64600 55%, #a33a00 100%)',
                boxShadow: '0 4px 14px rgba(198, 70, 0, 0.32)',
              }}
            >
              <FileBarChart size={14} />
              Ver relatório anterior
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
