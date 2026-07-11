// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { Edit, Pause, Palmtree, RotateCcw, UserX, Trash2, Shield } from 'lucide-react';
import { STUDENT_STATUS_HELPERS } from '../constants';

export default function StudentContextMenu({ model }: { model: unknown }) {
  const { contextMenu, contextMenuRef, alunos, setContextMenu, abrirEdicao, alterarStatus, eliminarAluno } = model;
  const aluno = alunos.find((al) => al.id === contextMenu.alunoId);
  const status = aluno?.status;
  const isInactive = STUDENT_STATUS_HELPERS.isExcludedFromBilling(status) && !STUDENT_STATUS_HELPERS.isImported(status);

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

      <button
        type="button"
        onClick={() => {
          if (aluno) abrirEdicao(aluno);
          setContextMenu(null);
        }}
        className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 text-[14px] font-medium transition-all group nl-text"
      >
        <Edit size={14} className="nl-text-muted group-hover:text-[var(--color-primary)]" /> Editar Perfil
      </button>

      {isInactive ? (
        <button
          type="button"
          onClick={() => {
            alterarStatus(contextMenu.alunoId, 'ativo');
            setContextMenu(null);
          }}
          className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 text-[14px] font-medium transition-all group nl-text"
        >
          <RotateCcw size={14} className="nl-text-muted group-hover:text-[var(--color-success)]" /> Reativar aluno
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              alterarStatus(contextMenu.alunoId, 'pausado');
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 text-[14px] font-medium transition-all group nl-text"
          >
            <Pause size={14} className="nl-text-muted group-hover:text-[var(--color-warning)]" /> Colocar em pausa
          </button>
          <button
            type="button"
            onClick={() => {
              alterarStatus(contextMenu.alunoId, 'ferias');
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 text-[14px] font-medium transition-all group nl-text"
          >
            <Palmtree size={14} className="nl-text-muted group-hover:text-[var(--color-primary)]" /> Marcar férias
          </button>
          <button
            type="button"
            onClick={() => {
              alterarStatus(contextMenu.alunoId, 'desistente');
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 text-[14px] font-medium transition-all group nl-text"
          >
            <UserX size={14} className="nl-text-muted group-hover:text-[var(--color-error)]" /> Marcar desistência
          </button>
        </>
      )}

      <div className="h-px bg-[var(--border-light)] my-1.5 mx-2" />

      <button
        type="button"
        onClick={() => {
          eliminarAluno(contextMenu.alunoId);
          setContextMenu(null);
        }}
        className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-[14px] font-bold text-red-600 transition-all"
      >
        <Trash2 size={14} /> Eliminar Registo
      </button>
    </div>
  );
}
