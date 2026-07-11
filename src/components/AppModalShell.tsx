/**
 * Shell de modal unificado — mesma vibe da matrícula:
 * header suave, bordas do sistema, rodapé opcional, fechar claro.
 */
import { X } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';

type AppModalShellProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Conteúdo extra à direita do título (ex.: botões no header) */
  headerExtra?: React.ReactNode;
  appLogo?: string;
  maxWidth?: string;
  /** Cor de acento opcional (borda/sombra) */
  accent?: string;
  /** z-index overlay */
  zIndex?: number;
  /** sem logo no header (mais compacto) */
  hideBrand?: boolean;
  /** classe extra no body (ex. padding zero) */
  bodyClassName?: string;
  /** classe extra no painel (ex. fundo post-it) */
  panelClassName?: string;
  panelStyle?: React.CSSProperties;
};

export default function AppModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  headerExtra,
  appLogo,
  maxWidth = 'max-w-[520px]',
  accent,
  zIndex = 100,
  hideBrand = false,
  bodyClassName = '',
  panelClassName = '',
  panelStyle,
}: AppModalShellProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200 nl-modal-overlay"
      style={{ zIndex }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-hidden={false}
    >
      <div
        className={`flex w-full ${maxWidth} flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] animate-scale-in ${panelClassName}`}
        style={{
          maxHeight: 'calc(100vh - 32px)',
          boxShadow: accent
            ? `0 0 0 1px color-mix(in srgb, ${accent} 22%, transparent), 0 24px 64px rgba(0,0,0,0.16)`
            : undefined,
          ...panelStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative flex shrink-0 items-center gap-3 border-b border-[var(--border-light)] px-4 py-3"
          style={{
            background: accent
              ? `linear-gradient(135deg, color-mix(in srgb, ${accent} 12%, var(--bg-surface)) 0%, var(--bg-surface) 75%)`
              : 'var(--color-secondary-lighter)',
          }}
        >
          {!hideBrand && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--bg-surface)] p-1 shadow-sm">
              <img src={appLogo || APP_ICON_PATH} alt="" className="h-full w-full object-contain" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[14px] font-bold tracking-tight nl-text">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-[11px] font-medium nl-text-muted">{subtitle}</p>}
          </div>
          {headerExtra}
          <button type="button" onClick={onClose} className="nl-icon-btn shrink-0" title="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto custom-scrollbar ${bodyClassName}`}>{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/45 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
