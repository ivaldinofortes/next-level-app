// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { Edit, Pause, Shield, Trash2 } from 'lucide-react';

export default function StudentContextMenu({ model }: { model: unknown }) {
  const { contextMenu, contextMenuRef, alunos, setContextMenu, abrirEdicao, alterarStatus, eliminarAluno } = model;
  return (
        <div 
          ref={contextMenuRef}
          className="fixed bg-[var(--bg-surface)] shadow-2xl border border-[var(--border)] rounded-[3px] py-2 z-[200] min-w-[240px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-4 py-2 text-[11px] font-bold nl-text-muted uppercase tracking-widest border-b border-[var(--border-light)] mb-1 flex items-center justify-between">
            Ações Rápidas
            <Shield size={10} className="text-[var(--color-primary)]" />
          </div>
          
          <div className="h-px bg-[var(--border-light)] my-1.5 mx-2"></div>

          <button onClick={() => {
            const a = alunos.find(al => al.id === contextMenu.alunoId);
            if (a) abrirEdicao(a);
            setContextMenu(null);
          }} className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 text-[14px] font-medium transition-all group nl-text">
            <Edit size={14} className="nl-text-muted group-hover:text-[var(--color-primary)]" /> Editar Perfil
          </button>
          
          <button onClick={() => {
            alterarStatus(contextMenu.alunoId, 'pausado');
            setContextMenu(null);
          }} className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 text-[14px] font-medium transition-all group nl-text">
            <Pause size={14} className="nl-text-muted group-hover:text-[var(--color-warning)]" /> Colocar em Pausa
          </button>
          
          <div className="h-px bg-[var(--border-light)] my-1.5 mx-2"></div>
          
          <button onClick={() => {
            eliminarAluno(contextMenu.alunoId);
            setContextMenu(null);
          }} className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-[14px] font-bold text-red-600 transition-all">
            <Trash2 size={14} /> Eliminar Registo
          </button>
        </div>
  );
}
