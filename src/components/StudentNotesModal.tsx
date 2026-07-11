import { useEffect, useRef } from 'react';
import { Plus, StickyNote, Trash2, X } from 'lucide-react';
import type { Aluno, Nota } from '../types/app';
import { getAlunoNomeSeguro } from '../utils/formatting';

const POSTIT = '#FFF59D';
const POSTIT_BORDER = '#E6D36A';
const POSTIT_INK = '#3D3410';
const POSTIT_MUTED = '#6B5B24';
const POSTIT_YELLOW = '#EAB308';
const POSTIT_FILL = '#FDE047';

interface StudentNotesModalProps {
  aluno: Aluno;
  notas: Nota[];
  novaNota: string;
  onNovaNotaChange: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
  onOpenContact?: () => void;
  onClose: () => void;
}

/**
 * Post-it simples e leve — um único cartão amarelo, sem shell pesado.
 */
export default function StudentNotesModal({
  aluno,
  notas,
  novaNota,
  onNovaNotaChange,
  onAdd,
  onDelete,
  onClose,
}: StudentNotesModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nome = getAlunoNomeSeguro(aluno);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [aluno.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tryAdd = () => {
    if (!novaNota.trim()) return;
    onAdd();
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.28)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Notas de ${nome}`}
    >
      <div
        className="flex w-full max-w-[380px] flex-col overflow-hidden rounded-[4px]"
        style={{
          background: POSTIT,
          border: `1px solid ${POSTIT_BORDER}`,
          boxShadow:
            '0 18px 48px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.55) inset, 2px 2px 0 rgba(0,0,0,0.04)',
          maxHeight: 'min(520px, calc(100vh - 48px))',
          transform: 'rotate(-0.4deg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho minimal */}
        <div
          className="flex shrink-0 items-start gap-2 border-b px-3.5 py-3"
          style={{ borderColor: POSTIT_BORDER }}
        >
          <StickyNote
            size={20}
            color={POSTIT_YELLOW}
            fill={POSTIT_FILL}
            strokeWidth={2}
            className="mt-0.5 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight" style={{ color: POSTIT_INK }}>
              {nome}
            </p>
            <p className="mt-0.5 text-[11px] font-medium" style={{ color: POSTIT_MUTED }}>
              {notas.length === 0 ? 'Sem notas' : `${notas.length} nota${notas.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            style={{ color: POSTIT_MUTED }}
            title="Fechar"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Escrever */}
        <div className="shrink-0 px-3.5 pt-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={novaNota}
              onChange={(e) => onNovaNotaChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') tryAdd();
              }}
              placeholder="Escrever nota…"
              className="h-10 flex-1 rounded-md border px-3 text-[13px] font-medium outline-none"
              style={{
                borderColor: POSTIT_BORDER,
                background: 'rgba(255,255,255,0.75)',
                color: POSTIT_INK,
              }}
            />
            <button
              type="button"
              onClick={tryAdd}
              disabled={!novaNota.trim()}
              className="inline-flex h-10 items-center gap-1 rounded-md px-3 text-[12px] font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: '#16a34a' }}
              title="Adicionar"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto custom-scrollbar px-3.5 py-3">
          {notas.length === 0 ? (
            <p className="py-8 text-center text-[12px] font-medium" style={{ color: POSTIT_MUTED }}>
              Nenhuma nota ainda.
            </p>
          ) : (
            notas.map((nota) => (
              <div
                key={nota.id}
                className="group relative rounded-md border px-3 py-2"
                style={{
                  background: 'rgba(255,255,255,0.55)',
                  borderColor: POSTIT_BORDER,
                }}
              >
                <p className="pr-7 text-[13px] font-semibold leading-snug" style={{ color: POSTIT_INK }}>
                  {nota.texto}
                </p>
                <p className="mt-1 text-[10px] font-medium tabular-nums" style={{ color: POSTIT_MUTED }}>
                  {nota.data_criacao}
                </p>
                <button
                  type="button"
                  onClick={() => onDelete(nota.id)}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
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
    </div>
  );
}
