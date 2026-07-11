import { LocateFixed } from 'lucide-react';
import { MONTH_OPTIONS } from '../constants';
import { isFutureMonth } from '../utils/formatting';

export type TimeRulerMark = {
  /** 0–11 */
  index: number;
  /** 0–1 relative weight for tick height (e.g. revenue intensity) */
  weight?: number;
};

type TimeRulerProps = {
  year: number;
  selectedIndex: number;
  referenceDate?: Date;
  onSelect: (monthIndex: number, monthName: string) => void;
  /**
   * Volta ao mês/ano actual (hoje). Preferido quando o ano também muda.
   * Se omitido, usa `onYearChange` + `onSelect` com a data de referência.
   */
  onGoToCurrent?: () => void;
  /** Usado no fallback de “ir para hoje” quando o ano da régua ≠ ano actual */
  onYearChange?: (year: number) => void;
  /** Optional activity weights per month (0–1) for dynamic tick sizes */
  marks?: TimeRulerMark[];
  /** Visual accent when selected (page theme) */
  accent?: 'home' | 'alunos' | 'relatorios' | 'neutral';
  className?: string;
  /** Compact width — always centered by parent */
  maxWidth?: number;
};

const ACCENT: Record<string, { pill: string; tick: string; line: string; go: string }> = {
  home: {
    pill: 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]',
    tick: 'bg-[var(--color-primary)]',
    line: 'bg-[color-mix(in_srgb,var(--color-primary)_35%,var(--border))]',
    go: 'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-surface))]',
  },
  alunos: {
    pill: 'bg-[var(--color-success)] text-white border-[var(--color-success)]',
    tick: 'bg-[var(--color-success)]',
    line: 'bg-[color-mix(in_srgb,var(--color-success)_35%,var(--border))]',
    go: 'border-[var(--color-success)] text-[var(--color-success)] hover:bg-[color-mix(in_srgb,var(--color-success)_12%,var(--bg-surface))]',
  },
  relatorios: {
    pill: 'bg-[#c64600] text-white border-[#c64600]',
    tick: 'bg-[#e66100]',
    line: 'bg-[color-mix(in_srgb,#e66100_35%,var(--border))]',
    go: 'border-[#c64600] text-[#c64600] hover:bg-[color-mix(in_srgb,#e66100_12%,var(--bg-surface))]',
  },
  neutral: {
    pill: 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]',
    tick: 'bg-[var(--color-primary)]',
    line: 'bg-[var(--border)]',
    go: 'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-surface))]',
  },
};

/**
 * Régua de tempo unificada — traços verticais,
 * mês activo em pílula, e botão para voltar ao mês actual.
 */
export default function TimeRuler({
  year,
  selectedIndex,
  referenceDate = new Date(),
  onSelect,
  onGoToCurrent,
  onYearChange,
  marks = [],
  accent = 'neutral',
  className = '',
  maxWidth = 440,
}: TimeRulerProps) {
  const theme = ACCENT[accent] || ACCENT.neutral;
  const weightMap = new Map(marks.map((m) => [m.index, m.weight ?? 0]));
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const currentMonth = refYear === year ? refMonth : -1;
  const atCurrent = year === refYear && selectedIndex === refMonth;
  const currentMonthName = MONTH_OPTIONS[refMonth] || '';

  const handleGoToCurrent = () => {
    if (atCurrent) return;
    if (onGoToCurrent) {
      onGoToCurrent();
      return;
    }
    if (year !== refYear) {
      onYearChange?.(refYear);
    }
    onSelect(refMonth, currentMonthName);
  };

  return (
    <div
      className={`relative mx-auto flex h-9 w-full items-center gap-1.5 px-1 ${className}`}
      style={{ maxWidth: maxWidth + 36 }}
      role="navigation"
      aria-label={`Régua de meses ${year}`}
    >
      <div className="relative min-w-0 flex-1">
        {/* Linha base da régua */}
        <div className={`pointer-events-none absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 ${theme.line}`} />

        <div className="relative flex w-full items-center justify-between">
          {MONTH_OPTIONS.map((mes, index) => {
            const future = isFutureMonth(index, year, referenceDate);
            const active = selectedIndex === index && !future;
            const isCurrent = currentMonth === index;
            const weight = weightMap.get(index) ?? 0;

            const major = index % 3 === 0;
            let tickH = major ? 14 : 9;
            if (weight > 0) tickH = Math.round(9 + weight * 10);
            if (active) tickH = Math.max(tickH, 16);

            return (
              <button
                key={mes}
                type="button"
                disabled={future}
                onClick={() => {
                  if (future) return;
                  onSelect(index, mes);
                }}
                className="group relative flex h-9 min-w-0 flex-1 flex-col items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
                title={`${mes} ${year}${future ? ' (futuro)' : isCurrent ? ' · mês actual' : ''}`}
              >
                <span
                  className={`w-[2px] rounded-full transition-all ${
                    active
                      ? theme.tick
                      : isCurrent
                        ? 'bg-[var(--color-primary)]'
                        : weight > 0.4
                          ? 'bg-[var(--text-secondary)]'
                          : 'bg-[var(--border)] group-hover:bg-[var(--text-secondary)]'
                  }`}
                  style={{ height: tickH }}
                />

                {active ? (
                  <span
                    className={`absolute -bottom-0.5 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-pill)] border px-2 py-px text-[9px] font-semibold capitalize leading-tight shadow-[var(--shadow-xs)] ${theme.pill}`}
                  >
                    {mes}
                  </span>
                ) : isCurrent ? (
                  <span className="absolute -bottom-0.5 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-pill)] border border-[var(--color-primary)] bg-[var(--bg-surface)] px-2 py-px text-[9px] font-semibold capitalize leading-tight text-[var(--color-primary)]">
                    {mes}
                  </span>
                ) : major && !future ? (
                  <span className="pointer-events-none absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-medium capitalize nl-text-muted opacity-0 transition-opacity group-hover:opacity-100">
                    {mes}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Voltar ao mês actual — evita perder-se no calendário */}
      <button
        type="button"
        onClick={handleGoToCurrent}
        disabled={atCurrent}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-[var(--bg-surface)] transition-all disabled:cursor-default disabled:opacity-35 ${theme.go}`}
        title={
          atCurrent
            ? `Já está em ${currentMonthName} ${refYear}`
            : `Ir para o mês actual (${currentMonthName} ${refYear})`
        }
        aria-label={`Ir para o mês actual: ${currentMonthName} ${refYear}`}
      >
        <LocateFixed size={14} strokeWidth={2.25} />
      </button>
    </div>
  );
}
