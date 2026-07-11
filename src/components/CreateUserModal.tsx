// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { UserPlus, X } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';

export default function CreateUserModal({ model }: { model: unknown }) {
  const { appLogo, novoUtilizadorForm, electron, setMostrarFormNovoUtilizador, setNovoUtilizadorForm, showToast, setListaUtilizadores } = model;
  return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-fade-in" onClick={() => setMostrarFormNovoUtilizador(false)}>
           <div className="bg-[var(--bg-surface)] w-full max-w-[460px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                    <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
                </div>
                <div className="flex-1 text-center whitespace-nowrap">
                  <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Novo Utilizador</h2>
                </div>
                <div className="flex-1 flex justify-end px-3">
                  <button onClick={() => setMostrarFormNovoUtilizador(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Nome Completo</label>
                    <input type="text" value={novoUtilizadorForm.name} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, name: e.target.value})} className="nl-input w-full h-10 px-3 text-[13px]" placeholder="Ex: João Silva" required />
                 </div>
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Email</label>
                    <input type="email" value={novoUtilizadorForm.email} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, email: e.target.value})} className="nl-input w-full h-10 px-3 text-[13px]" placeholder="contacto@exemplo.com" required />
                 </div>
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Função</label>
                    <select value={novoUtilizadorForm.role} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, role: e.target.value})} className="nl-input w-full h-10 px-3 text-[13px] cursor-pointer">
                       <option value="operational">Operacional (Sem Ajustes)</option>
                       <option value="admin">Administrador (Total)</option>
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Palavra-passe</label>
                    <input type="password" value={novoUtilizadorForm.password} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, password: e.target.value})} className="nl-input w-full h-10 px-3 text-[13px]" placeholder="Mínimo 6 caracteres" required />
                 </div>
              </div>
              <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                 <button onClick={() => setMostrarFormNovoUtilizador(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Cancelar</button>
                 <button onClick={async () => {
                    if (!electron || !novoUtilizadorForm.name || !novoUtilizadorForm.email || novoUtilizadorForm.password.length < 6) return alert('Preencha todos os campos e palavra-passe com mínimo de 6 caracteres.');
                    const res = await electron.ipcRenderer.invoke('users:create', novoUtilizadorForm);
                    if (!res?.success) return alert(res?.message || 'Erro ao criar utilizador.');
                    showToast('Utilizador criado com sucesso!');
                    setMostrarFormNovoUtilizador(false);
                    setNovoUtilizadorForm({ name: '', email: '', role: 'operational', password: '' });
                    const listRes = await electron.ipcRenderer.invoke('users:list');
                    if (listRes?.success) setListaUtilizadores(listRes.users || []);
                 }} className="nl-btn !h-9 !px-6 !text-[11px] font-bold nl-btn-primary">
                    <UserPlus size={14} /> Criar Conta
                 </button>
              </div>
           </div>
        </div>
  );
}
