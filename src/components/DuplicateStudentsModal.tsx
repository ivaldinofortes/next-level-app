// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { CheckCircle2, Trash2 } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';
import { getAlunoIniciais } from '../utils/formatting';
import AppModalShell from './AppModalShell';

export default function DuplicateStudentsModal({ model }: { model: unknown }) {
  const { duplicadosEncontrados, appLogo, electron, setMostrarModalDuplicados, setDuplicadosEncontrados, abrirPerfilAluno, abrirConfirmacao, carregarConfiguracoes, showToast } = model;
  return (
    <AppModalShell
      title={`Duplicados (${duplicadosEncontrados.length})`}
      subtitle="Contactos com nome ou telefone repetido"
      onClose={() => setMostrarModalDuplicados(false)}
      appLogo={appLogo || APP_ICON_PATH}
      maxWidth="max-w-[600px]"
      zIndex={160}
      accent="var(--color-primary)"
      footer={(
        <button type="button" onClick={() => setMostrarModalDuplicados(false)} className="nl-btn nl-btn-secondary !h-9">Fechar</button>
      )}
    >
          <div className="space-y-5 p-5">
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
    </AppModalShell>
  );
}
