// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { Activity, Archive, Camera, CreditCard, Edit, LogOut, Save, ShieldOff, Trash2, UserPlus, X } from 'lucide-react';
import { getUserAvatar, persistUserAvatars, removeUserAvatar, setUserAvatar, userInitials } from '../utils/userAvatar';

export default function EditUserModal({ model }: { model: unknown }) {
  const { utilizadorEmEdicao, utilizadorAvatares, utilizadorEdicaoForm, electron, logs, setUtilizadorEmEdicao, setUtilizadorAvatares, setUtilizadorEdicaoForm, showToast, setListaUtilizadores } = model;
  const avatarSrc = getUserAvatar(utilizadorAvatares, utilizadorEmEdicao);
  return (
        <div className="fixed inset-0 nl-modal-overlay flex items-center justify-center z-[1000] p-4 animate-fade-in" onClick={() => setUtilizadorEmEdicao(null)}>
          <div className="bg-[var(--bg-surface)] w-full max-w-[720px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
            <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
              <div className="flex-1 flex items-center gap-2.5 px-4">
                <div className="h-6 w-6 rounded-md overflow-hidden flex items-center justify-center font-bold text-[9px] border border-white/40 shadow-sm"
                     style={{ background: avatarSrc ? 'transparent' : `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 88%)`, color: `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 35%)` }}>
                  {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" alt="" /> : userInitials(utilizadorEmEdicao.name)}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{utilizadorEmEdicao.name}</span>
              </div>
              <div className="flex-1 text-center whitespace-nowrap">
                <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Editar Utilizador</h2>
              </div>
              <div className="flex-1 flex justify-end px-3">
                <button onClick={() => setUtilizadorEmEdicao(null)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
              <div className="w-[300px] shrink-0 border-r border-[var(--border)] p-5 space-y-4 overflow-y-auto custom-scrollbar">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Perfil</p>

                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="w-14 h-14 rounded-[var(--radius-control)] overflow-hidden flex items-center justify-center font-bold text-[16px] border border-[var(--border)]"
                         style={{ background: avatarSrc ? 'transparent' : `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 88%)`, color: `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 35%)` }}>
                      {avatarSrc
                        ? <img src={avatarSrc} className="w-full h-full object-cover" alt="" />
                        : userInitials(utilizadorEmEdicao.name)}
                    </div>
                    <label className="absolute inset-0 bg-black/50 rounded-[var(--radius-control)] flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                      <Camera size={14} className="text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result as string;
                          const userRef = {
                            id: utilizadorEmEdicao.id,
                            name: utilizadorEdicaoForm.name || utilizadorEmEdicao.name,
                            email: utilizadorEmEdicao.email,
                          };
                          const updated = setUserAvatar(utilizadorAvatares, userRef, result);
                          setUtilizadorAvatares(updated);
                          persistUserAvatars(updated);
                        };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                  </div>
                  <div className="text-[10px] nl-text-muted leading-relaxed">
                    <p className="font-bold nl-text mb-0.5">Foto de perfil</p>
                    <p>Passe o rato para alterar · aparece no login e na barra</p>
                    {avatarSrc && (
                      <button type="button" onClick={() => {
                        const userRef = {
                          id: utilizadorEmEdicao.id,
                          name: utilizadorEdicaoForm.name || utilizadorEmEdicao.name,
                          email: utilizadorEmEdicao.email,
                        };
                        const updated = removeUserAvatar(utilizadorAvatares, userRef);
                        setUtilizadorAvatares(updated);
                        persistUserAvatars(updated);
                      }} className="text-red-500 hover:underline mt-1 block text-[10px]">Remover foto</button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Nome</label>
                  <input type="text" value={utilizadorEdicaoForm.name} onChange={e => setUtilizadorEdicaoForm(f => ({...f, name: e.target.value}))} className="nl-input w-full h-10 px-3 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Função</label>
                  <select value={utilizadorEdicaoForm.role} onChange={e => setUtilizadorEdicaoForm(f => ({...f, role: e.target.value}))} className="nl-input w-full h-10 px-3 text-[13px] cursor-pointer">
                    <option value="operational">Operacional</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border-light)]">
                  <div>
                    <p className="text-[11px] font-bold nl-text">Conta activa</p>
                    <p className="text-[9px] nl-text-muted">Acesso ao sistema</p>
                  </div>
                  <button type="button" onClick={() => setUtilizadorEdicaoForm(f => ({...f, isActive: !f.isActive}))}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${utilizadorEdicaoForm.isActive ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${utilizadorEdicaoForm.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                <button type="button" onClick={async () => {
                  if (!electron || !utilizadorEdicaoForm.name.trim()) return;
                  const res = await electron.ipcRenderer.invoke('users:update', {
                    id: utilizadorEmEdicao.id,
                    name: utilizadorEdicaoForm.name,
                    role: utilizadorEdicaoForm.role,
                    isActive: utilizadorEdicaoForm.isActive,
                  });
                  if (!res?.success) return showToast('Erro: ' + (res?.message || ''));
                  showToast('Dados guardados.');
                  const listRes = await electron.ipcRenderer.invoke('users:list');
                  if (listRes?.success) setListaUtilizadores(listRes.users || []);
                  setUtilizadorEmEdicao({ ...utilizadorEmEdicao, name: utilizadorEdicaoForm.name, role: utilizadorEdicaoForm.role, is_active: utilizadorEdicaoForm.isActive ? 1 : 0 });
                }} className="nl-btn nl-btn-primary w-full h-10 text-[12px] font-bold"><Save size={14} /> Guardar alterações</button>

                <div className="border-t border-[var(--border-light)] pt-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Palavra-passe</p>
                  <input type="password" value={utilizadorEdicaoForm.novaSenha} onChange={e => setUtilizadorEdicaoForm(f => ({...f, novaSenha: e.target.value}))} placeholder="Nova palavra-passe..." className="nl-input w-full h-10 px-3 text-[13px]" />
                  <button type="button" onClick={async () => {
                    if (!electron || utilizadorEdicaoForm.novaSenha.length < 6) return showToast('Mínimo 6 caracteres.');
                    const res = await electron.ipcRenderer.invoke('users:set-password', { id: utilizadorEmEdicao.id, password: utilizadorEdicaoForm.novaSenha });
                    if (!res?.success) return showToast('Erro: ' + (res?.message || ''));
                    showToast('Palavra-passe alterada.');
                    setUtilizadorEdicaoForm(f => ({...f, novaSenha: ''}));
                  }} className="nl-btn nl-btn-secondary w-full h-9 text-[11px] font-bold">Alterar palavra-passe</button>
                </div>
              </div>

              {/* Right: Activity log */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--color-secondary-lighter)]/30 flex items-center justify-between shrink-0">
                  <p className="text-[10px] font-bold nl-text-muted uppercase tracking-wider">Histórico de Actividade</p>
                  <span className="text-[9px] nl-text-muted">{logs.filter(l => l.user_name === utilizadorEmEdicao.name).length} acções</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1.5">
                  {(() => {
                    const userLogs = logs.filter(l => l.user_name === utilizadorEmEdicao.name);
                    if (userLogs.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                          <Activity size={24} />
                          <p className="text-[12px] font-semibold nl-text">Sem actividade registada</p>
                          <p className="text-[11px] nl-text-muted text-center">As acções futuras deste utilizador aparecerão aqui</p>
                        </div>
                      );
                    }
                    const iconePorAcao = (acao: string) => {
                      if (acao.includes('Matrícula') || acao.includes('Novo')) return { icon: <UserPlus size={11} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
                      if (acao.includes('Pagamento')) return { icon: <CreditCard size={11} />, color: 'text-blue-600 bg-blue-50 border-blue-200' };
                      if (acao.includes('Eliminação') || acao.includes('Remov')) return { icon: <Trash2 size={11} />, color: 'text-red-600 bg-red-50 border-red-200' };
                      if (acao.includes('Status') || acao.includes('Bloqueio') || acao.includes('Pausa')) return { icon: <ShieldOff size={11} />, color: 'text-amber-600 bg-amber-50 border-amber-200' };
                      if (acao.includes('Edição') || acao.includes('Atualiz')) return { icon: <Edit size={11} />, color: 'text-violet-600 bg-violet-50 border-violet-200' };
                      if (acao.includes('Login') || acao.includes('Acesso')) return { icon: <LogOut size={11} />, color: 'text-slate-600 bg-slate-50 border-slate-200' };
                      if (acao.includes('Backup') || acao.includes('Export')) return { icon: <Archive size={11} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
                      return { icon: <Activity size={11} />, color: 'text-slate-500 bg-slate-50 border-slate-200' };
                    };
                    return userLogs.map(log => {
                      const { icon, color } = iconePorAcao(log.acao);
                      return (
                        <div key={log.id} className="flex items-start gap-2.5 p-2.5 rounded-[5px] hover:bg-[var(--color-secondary-lighter)]/30 transition-colors">
                          <div className={`w-6 h-6 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold nl-text">{log.acao}</p>
                            {log.detalhes && <p className="text-[10px] nl-text-muted mt-0.5 line-clamp-2">{log.detalhes}</p>}
                          </div>
                          <span className="text-[9px] nl-text-muted shrink-0 tabular-nums whitespace-nowrap">{log.data_hora}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}
