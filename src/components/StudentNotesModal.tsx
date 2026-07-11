import { BookUser, StickyNote, Trash2, X } from 'lucide-react';
import type { Aluno, Nota } from '../types/app';
import { getAlunoNomeSeguro } from '../utils/formatting';

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

export default function StudentNotesModal({ aluno, notas, novaNota, onNovaNotaChange, onAdd, onDelete, onOpenContact, onClose }: StudentNotesModalProps) {
  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-[220] p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-[440px] overflow-hidden rounded-[4px] border border-amber-300 bg-[#FFF7C7] shadow-[0_24px_70px_rgba(0,0,0,0.28)] animate-scale-in" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-amber-300/70 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-amber-300 text-amber-950 shadow-sm"><StickyNote size={20} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Notas do aluno</p>
              <h3 className="truncate text-[18px] font-black leading-tight text-amber-950">{getAlunoNomeSeguro(aluno)}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-amber-800/60 transition-colors hover:bg-amber-200 hover:text-amber-950" title="Fechar"><X size={16} /></button>
        </div>

        <div className="px-5 py-4">
          <div className="flex gap-2">
            <input type="text" value={novaNota} onChange={(event) => onNovaNotaChange(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && onAdd()} placeholder="Escrever nota rápida..." className="h-10 flex-1 rounded-[4px] border border-amber-300 bg-white/70 px-3 text-[13px] text-amber-950 outline-none placeholder:text-amber-700/45 focus:border-amber-500" />
            <button type="button" onClick={onAdd} className="h-10 rounded-[4px] bg-amber-500 px-4 text-[11px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-amber-600">Adicionar</button>
          </div>

          <div className="mt-4 max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {notas.length === 0 ? (
              <div className="rounded-[4px] border border-dashed border-amber-300 bg-white/30 px-4 py-8 text-center"><p className="text-[13px] font-bold text-amber-800/65">Este aluno ainda não tem notas.</p></div>
            ) : notas.map((nota) => (
              <div key={nota.id} className="group relative rounded-[4px] border border-amber-300/70 bg-white/45 p-3">
                <p className="pr-7 text-[13px] leading-relaxed text-amber-950">{nota.texto}</p>
                <p className="mt-2 text-[10px] font-semibold text-amber-700/65">{nota.data_criacao}</p>
                <button type="button" onClick={() => onDelete(nota.id)} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded text-amber-700/35 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" title="Apagar nota"><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-amber-300/70 bg-amber-100/55 px-5 py-4">
          <span className="text-[11px] font-bold text-amber-800">{notas.length} nota(s) neste post-it</span>
          <button type="button" onClick={onOpenContact} className="inline-flex h-9 items-center gap-2 rounded-[4px] bg-amber-900 px-4 text-[11px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-amber-950"><BookUser size={14} /> Ver Contacto</button>
        </div>
      </div>
    </div>
  );
}
