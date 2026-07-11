import { BookUser, Plus, StickyNote, Trash2 } from 'lucide-react';
import type { Aluno, Nota } from '../types/app';
import { getAlunoNomeSeguro } from '../utils/formatting';
import AppModalShell from './AppModalShell';

/** Amarelo post-it real, sólido */
const POSTIT = '#FFF59D';
const POSTIT_BORDER = '#E6D36A';
const POSTIT_INK = '#3D3410';
const POSTIT_MUTED = '#6B5B24';

interface StudentNotesModalProps {
  aluno: Aluno;
  notas: Nota[];
  novaNota: string;
  onNovaNotaChange: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
  onOpenContact: () => void;
  onClose: () => void;
}

export default function StudentNotesModal({
  aluno,
  notas,
  novaNota,
  onNovaNotaChange,
  onAdd,
  onDelete,
  onOpenContact,
  onClose,
}: StudentNotesModalProps) {
  return (
    <AppModalShell
      title={getAlunoNomeSeguro(aluno)}
      subtitle="Post-it · notas rápidas"
      onClose={onClose}
      maxWidth="max-w-[420px]"
      zIndex={220}
      hideBrand
      accent="#ca8a04"
      panelStyle={{
        background: POSTIT,
        borderColor: POSTIT_BORDER,
        boxShadow: '0 16px 48px rgba(0,0,0,0.22), 0 2px 0 rgba(255,255,255,0.4) inset',
      }}
      bodyClassName="!overflow-hidden flex flex-col"
      footer={(
        <>
          <span className="mr-auto text-[12px] font-semibold" style={{ color: POSTIT_MUTED }}>
            {notas.length} nota(s)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-full border px-3.5 text-[12px] font-semibold"
            style={{ borderColor: POSTIT_BORDER, color: POSTIT_INK, background: 'rgba(255,255,255,0.6)' }}
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={onOpenContact}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <BookUser size={13} /> Contacto
          </button>
        </>
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-4 pt-3.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={novaNota}
              onChange={(e) => onNovaNotaChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAdd()}
              placeholder="Escrever nota rápida…"
              className="h-10 flex-1 rounded-full border px-4 text-[13px] font-medium outline-none"
              style={{
                borderColor: POSTIT_BORDER,
                background: 'rgba(255,255,255,0.72)',
                color: POSTIT_INK,
              }}
            />
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-success)' }}
            >
              <Plus size={15} /> Adicionar
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto custom-scrollbar px-4 py-3">
          {notas.length === 0 ? (
            <div
              className="rounded-[var(--radius-control)] border border-dashed px-4 py-10 text-center"
              style={{ borderColor: POSTIT_BORDER }}
            >
              <StickyNote size={22} className="mx-auto mb-2 opacity-50" style={{ color: POSTIT_MUTED }} />
              <p className="text-[13px] font-semibold" style={{ color: POSTIT_MUTED }}>
                Ainda não há notas neste post-it.
              </p>
              <p className="mt-1 text-[12px] font-medium" style={{ color: POSTIT_MUTED, opacity: 0.8 }}>
                Use-o para lembrar cobranças, conversas e follow-ups.
              </p>
            </div>
          ) : (
            notas.map((nota) => (
              <div
                key={nota.id}
                className="group relative rounded-[var(--radius-control)] border p-3"
                style={{
                  background: 'rgba(255,255,255,0.55)',
                  borderColor: POSTIT_BORDER,
                  boxShadow: '0 2px 8px rgba(90,70,10,0.06)',
                }}
              >
                <p className="pr-8 text-[15px] font-semibold leading-snug" style={{ color: POSTIT_INK }}>
                  {nota.texto}
                </p>
                <p className="mt-1.5 text-[11px] font-medium tabular-nums" style={{ color: POSTIT_MUTED }}>
                  {nota.data_criacao}
                </p>
                <button
                  type="button"
                  onClick={() => onDelete(nota.id)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100"
                  style={{ color: 'var(--color-error)' }}
                  title="Apagar"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </AppModalShell>
  );
}
