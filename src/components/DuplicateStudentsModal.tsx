// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { CheckCircle2, Trash2, X } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';
import { getAlunoIniciais } from '../utils/formatting';

export default function DuplicateStudentsModal({ model }: { model: unknown }) {
  const { duplicadosEncontrados, appLogo, electron, setMostrarModalDuplicados, setDuplicadosEncontrados, abrirPerfilAluno, abrirConfirmacao, carregarConfiguracoes, showToast } = model;
  return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[160] p-4 animate-fade-in" onClick={() => setMostrarModalDuplicados(false)}>
        <div className="bg-[var(--bg-surface)] w-full max-w-[600px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
          <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Duplicados ({duplicadosEncontrados.length})</h2>
            </div>
            <div className="flex-1 flex justify-end px-3">
              <button onClick={() => setMostrarModalDuplicados(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
            {duplicadosEncontrados.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <p className="text-[16px] font-black nl-text">Tudo limpo!</p>
                <p className="text-[12px] nl-text-muted">Não foram encontrados contactos com nomes ou telefones repetidos.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-[11px] nl-text-muted">Os grupos abaixo partilham o mesmo <b>nome</b> ou <b>número de telemóvel</b>.</p>
                
                {duplicadosEncontrados.map((grupo, idx) => (
                  <div key={idx} className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
                    <div className="px-4 py-2 bg-[var(--color-secondary-lighter)]/50 border-b border-[var(--border-light)] flex items-center justify-between">
                      <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Grupo #{idx + 1}</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase">{grupo.length} ocorrências</span>
                    </div>
                    <div className="divide-y divide-[var(--border-light)]">
                      {grupo.map(aluno => (
                        <div key={aluno.id} className="p-3 hover:bg-[var(--color-secondary-lighter)]/30 transition-colors flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--color-secondary-lighter)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-[12px] shrink-0 overflow-hidden border border-[var(--border)]">
                            {aluno.foto_path ? <img src={`local-resource://${aluno.foto_path}`} className="w-full h-full object-cover" /> : getAlunoIniciais(aluno)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold nl-text truncate">{aluno.nome}</p>
                            <p className="text-[11px] nl-text-muted">{aluno.telefone || 'Sem telefone'}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Inscrito em: {aluno.data_matricula || '—'}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => {
                                setMostrarModalDuplicados(false);
                                abrirPerfilAluno(aluno);
                              }}
                              className="nl-btn !h-8 !px-3 !text-[10px] font-bold uppercase"
                            >
                              Ver
                            </button>
                            <button 
                              onClick={() => {
                                abrirConfirmacao({
                                  title: 'Eliminar Duplicado',
                                  message: `Tens a certeza que queres mover o registo de ${aluno.nome} para a lixeira?`,
                                  confirmLabel: 'Eliminar',
                                  tone: 'danger',
                                  onConfirm: async () => {
                                    if (electron) {
                                      const res = await electron.ipcRenderer.invoke('db:delete-duplicate', { alunoId: aluno.id });
                                      if (!res?.success) throw new Error(res?.message || 'Falha ao remover duplicado.');
                                      const novosGrupos = (res.groups || []).map((group: any) => group.alunos || []);
                                      setDuplicadosEncontrados(novosGrupos);
                                      await carregarConfiguracoes();
                                      showToast('✅ Duplicado movido para a lixeira.');
                                      if (novosGrupos.length === 0) setMostrarModalDuplicados(false);
                                    }
                                  }
                                });
                              }}
                              className="nl-btn !h-8 !w-8 !p-0 !bg-red-50 !text-red-500 hover:!bg-red-500 hover:!text-white !border-red-100 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-center shrink-0">
            <button onClick={() => setMostrarModalDuplicados(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Fechar</button>
          </div>
        </div>
      </div>
  );
}
