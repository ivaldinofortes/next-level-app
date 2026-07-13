// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { Star } from 'lucide-react';

export default function AppStatusBar({ model }: { model: unknown }) {
  const { online, totalAlunos, mensalidadesPendentes, zoomLista, relatorioMensalDisponivel, setZoomLista, setAba } = model;
  return (
    <footer className="nl-status-bar h-8 shrink-0 flex items-center justify-between gap-4 px-4 text-[12px] font-medium nl-text-sub">
      <div className="flex items-center gap-5 min-w-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${online ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'}`} />
          <span className="nl-text-muted">{online ? 'Online' : 'Modo local'}</span>
        </div>
        <div className="w-px h-3 bg-[var(--chrome-border,var(--border))]" />
        <div className="flex items-center gap-1.5">
          <span className="nl-text-muted">Alunos</span>
          <span className="nl-text tabular-nums">{totalAlunos}</span>
        </div>
        <div className="w-px h-3 bg-[var(--chrome-border,var(--border))]" />
        <div className="flex items-center gap-1.5">
          <span className="nl-text-muted">Atrasados</span>
          <span className={`tabular-nums ${mensalidadesPendentes > 0 ? 'text-[var(--color-error)] font-semibold' : 'nl-text'}`}>
            {mensalidadesPendentes}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5 shrink-0">
        <div className="flex items-center gap-2" title="Zoom da Início e da lista de Alunos">
          <span className="nl-text-muted">Vista</span>
          <input
            type="range"
            min="60"
            max="100"
            value={zoomLista}
            onChange={(e) => setZoomLista(parseInt(e.target.value, 10))}
            className="w-24 h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--chrome-border,var(--border))] accent-[var(--color-primary)]"
            aria-label="Zoom da vista (Início e Alunos)"
          />
          <span className="w-8 text-right tabular-nums nl-text">{zoomLista}%</span>
        </div>
        {relatorioMensalDisponivel && (
          <button
            type="button"
            onClick={() => setAba('relatorios_detalhado')}
            className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[var(--radius-pill)] border border-[var(--chrome-border,var(--border))] bg-[var(--chrome-surface,var(--bg-surface))] hover:opacity-90 transition-colors"
          >
            <Star size={11} className="text-[var(--color-warning)] fill-[var(--color-warning)]" />
            <span className="text-[11px] font-medium nl-text">Relatório de {relatorioMensalDisponivel}</span>
          </button>
        )}
        <span className="nl-text-muted tabular-nums">{new Date().toLocaleDateString('pt-PT')}</span>
        <span className="text-[11px] font-semibold nl-text-muted tracking-wide">Next Level</span>
      </div>
    </footer>
  );
}
