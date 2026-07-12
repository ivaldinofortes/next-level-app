import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownAZ,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { formatCve } from '../lib/billing';

export type ExportFormat = 'pdf' | 'excel';
export type ExportScope = 'todos' | 'pagos' | 'dividas' | 'pendentes';
/** Ordem da lista no relatório */
export type ExportSort = 'alfabetica' | 'pagos' | 'dividas';

export interface ExportReportStats {
  alunos: number;
  pagos: number;
  dividas: number;
  pendentes: number;
  receita: number;
  dividaValor: number;
}

export interface ExportReportOptions {
  format: ExportFormat;
  scope: ExportScope;
  sort: ExportSort;
}

interface ExportReportModalProps {
  mes: string;
  ano: number;
  stats: ExportReportStats;
  onClose: () => void;
  onExport: (opts: ExportReportOptions) => Promise<void>;
}

const SCOPES: { id: ExportScope; label: string; hint: string; icon: React.ReactNode }[] = [
  { id: 'todos', label: 'Todos os alunos', hint: 'Lista completa do período', icon: <Users size={15} /> },
  { id: 'pagos', label: 'Só em dia / pagos', hint: 'Com cobertura neste mês', icon: <CheckCircle2 size={15} /> },
  { id: 'dividas', label: 'Só em dívida', hint: 'Atrasados e vence hoje', icon: <AlertCircle size={15} /> },
  { id: 'pendentes', label: 'Por cobrar', hint: 'Activos ainda sem pagamento no mês', icon: <Wallet size={15} /> },
];

const SORTS: { id: ExportSort; label: string; hint: string; icon: React.ReactNode }[] = [
  { id: 'alfabetica', label: 'Alfabética', hint: 'A → Z pelo nome', icon: <ArrowDownAZ size={15} /> },
  { id: 'pagos', label: 'Pagos primeiro', hint: 'Em dia no topo, depois dívidas', icon: <CheckCircle2 size={15} /> },
  { id: 'dividas', label: 'Dívidas primeiro', hint: 'Atrasados no topo', icon: <AlertCircle size={15} /> },
];

export default function ExportReportModal({
  mes,
  ano,
  stats,
  onClose,
  onExport,
}: ExportReportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [scope, setScope] = useState<ExportScope>('todos');
  const [sort, setSort] = useState<ExportSort>('alfabetica');
  const [loading, setLoading] = useState(false);

  const previewCount = useMemo(() => {
    if (scope === 'pagos') return stats.pagos;
    if (scope === 'dividas') return stats.dividas;
    if (scope === 'pendentes') return stats.pendentes;
    return stats.alunos;
  }, [scope, stats]);

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport({ format, scope, sort });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[420] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.36)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Exportar relatório"
    >
      <div
        className="w-full max-w-[480px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start gap-3 border-b border-[var(--border-light)] px-4 py-3.5"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, #c64600 14%, var(--bg-surface)) 0%, var(--bg-surface) 70%)',
          }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,#c64600_16%,var(--bg-surface))] text-[#c64600]">
            <Download size={18} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c64600]">Gerar relatório</p>
            <h2 className="mt-0.5 text-[17px] font-semibold capitalize nl-text">
              {mes} <span className="tabular-nums nl-text-sub">{ano}</span>
            </h2>
            <p className="mt-0.5 text-[12px] font-medium nl-text-muted">
              Formato, recorte e ordem da lista.
            </p>
          </div>
          <button type="button" onClick={onClose} className="nl-icon-btn !h-8 !w-8" title="Fechar">
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto custom-scrollbar px-4 py-4">
          {/* Formato */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider nl-text-muted">Formato</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'pdf' as const, label: 'PDF', hint: 'Documento para imprimir', icon: <FileText size={18} /> },
                { id: 'excel' as const, label: 'Excel', hint: 'Folha editável (.xlsx)', icon: <FileSpreadsheet size={18} /> },
              ]).map((f) => {
                const active = format === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`flex items-center gap-2.5 rounded-[8px] border px-3 py-2.5 text-left transition-all ${
                      active
                        ? 'border-[#c64600] bg-[color-mix(in_srgb,#c64600_10%,var(--bg-surface))] ring-1 ring-[#c64600]/40'
                        : 'border-[var(--border)] hover:bg-[var(--color-secondary-light)]'
                    }`}
                  >
                    <span className={active ? 'text-[#c64600]' : 'nl-text-muted'}>{f.icon}</span>
                    <div>
                      <p className="text-[13px] font-semibold nl-text">{f.label}</p>
                      <p className="text-[10px] nl-text-muted">{f.hint}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recorte */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider nl-text-muted">Incluir</p>
            <div className="space-y-1.5">
              {SCOPES.map((s) => {
                const active = scope === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScope(s.id)}
                    className={`flex w-full items-center gap-2.5 rounded-[8px] border px-3 py-2 text-left transition-all ${
                      active
                        ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--bg-surface))]'
                        : 'border-[var(--border-light)] hover:bg-[var(--color-secondary-light)]'
                    }`}
                  >
                    <span className={active ? 'text-[var(--color-primary)]' : 'nl-text-muted'}>{s.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold nl-text">{s.label}</p>
                      <p className="text-[10px] nl-text-muted">{s.hint}</p>
                    </div>
                    <span
                      className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                        active ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-[var(--border)]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ordenação */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider nl-text-muted">Ordenar lista</p>
            <div className="grid grid-cols-3 gap-1.5">
              {SORTS.map((s) => {
                const active = sort === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSort(s.id)}
                    className={`flex flex-col items-start gap-1 rounded-[8px] border px-2.5 py-2 text-left transition-all ${
                      active
                        ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--bg-surface))]'
                        : 'border-[var(--border-light)] hover:bg-[var(--color-secondary-light)]'
                    }`}
                    title={s.hint}
                  >
                    <span className={active ? 'text-[var(--color-primary)]' : 'nl-text-muted'}>{s.icon}</span>
                    <span className="text-[11px] font-semibold leading-tight nl-text">{s.label}</span>
                  </button>
                );
              })}
            </div>
            {format === 'pdf' && (
              <p className="mt-2 text-[10px] font-medium nl-text-muted">
                No PDF: ● verde = pago · ● vermelho = em dívida (valores devidos em negativo).
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-[8px] border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 px-3 py-2.5 text-[12px]">
            <p className="font-medium nl-text-sub">
              Vai exportar <strong className="tabular-nums nl-text">{previewCount}</strong> registo(s)
              {' · '}
              Receita <strong className="tabular-nums text-[var(--color-success)]">{formatCve(stats.receita)}</strong>
              {stats.dividaValor > 0 && (
                <>
                  {' · '}
                  Dívida <strong className="tabular-nums text-[var(--color-error)]">{formatCve(stats.dividaValor)}</strong>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/30 px-4 py-3">
          <button type="button" onClick={onClose} className="nl-btn nl-btn-ghost !h-9" disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || previewCount === 0}
            className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #e36b2c 0%, #c64600 55%, #a33a00 100%)',
              boxShadow: '0 4px 14px rgba(198, 70, 0, 0.35)',
            }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {loading ? 'A gerar…' : `Exportar ${format === 'pdf' ? 'PDF' : 'Excel'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
