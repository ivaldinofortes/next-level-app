// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { UserPlus } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';
import AppModalShell from './AppModalShell';

export default function CreateUserModal({ model }: { model: unknown }) {
  const {
    appLogo,
    novoUtilizadorForm,
    electron,
    setMostrarFormNovoUtilizador,
    setNovoUtilizadorForm,
    showToast,
    setListaUtilizadores,
  } = model;

  const fechar = () => setMostrarFormNovoUtilizador(false);

  const criar = async () => {
    if (!electron || !novoUtilizadorForm.name || !novoUtilizadorForm.email || novoUtilizadorForm.password.length < 6) {
      showToast('Preencha todos os campos e palavra-passe com mínimo de 6 caracteres.');
      return;
    }
    const res = await electron.ipcRenderer.invoke('users:create', novoUtilizadorForm);
    if (!res?.success) {
      showToast(res?.message || 'Erro ao criar utilizador.');
      return;
    }
    showToast('Utilizador criado com sucesso!');
    fechar();
    setNovoUtilizadorForm({ name: '', email: '', role: 'operational', password: '' });
    const listRes = await electron.ipcRenderer.invoke('users:list');
    if (listRes?.success) setListaUtilizadores(listRes.users || []);
  };

  return (
    <AppModalShell
      title="Novo utilizador"
      subtitle="Conta para aceder ao sistema"
      onClose={fechar}
      appLogo={appLogo || APP_ICON_PATH}
      maxWidth="max-w-[460px]"
      zIndex={1000}
      accent="var(--color-primary)"
      footer={(
        <>
          <button type="button" onClick={fechar} className="nl-btn nl-btn-secondary !h-9">
            Cancelar
          </button>
          <button type="button" onClick={criar} className="nl-btn nl-btn-primary !h-9">
            <UserPlus size={14} /> Criar conta
          </button>
        </>
      )}
    >
      <div className="space-y-3.5 px-5 py-5">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
            Nome completo
          </label>
          <input
            type="text"
            value={novoUtilizadorForm.name}
            onChange={(e) => setNovoUtilizadorForm({ ...novoUtilizadorForm, name: e.target.value })}
            className="nl-input h-10 w-full px-3 text-[13px]"
            placeholder="Ex: João Silva"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
            Email
          </label>
          <input
            type="email"
            value={novoUtilizadorForm.email}
            onChange={(e) => setNovoUtilizadorForm({ ...novoUtilizadorForm, email: e.target.value })}
            className="nl-input h-10 w-full px-3 text-[13px]"
            placeholder="contacto@exemplo.com"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
            Função
          </label>
          <select
            value={novoUtilizadorForm.role}
            onChange={(e) => setNovoUtilizadorForm({ ...novoUtilizadorForm, role: e.target.value })}
            className="nl-input h-10 w-full cursor-pointer px-3 text-[13px]"
          >
            <option value="operational">Operacional</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
            Palavra-passe
          </label>
          <input
            type="password"
            value={novoUtilizadorForm.password}
            onChange={(e) => setNovoUtilizadorForm({ ...novoUtilizadorForm, password: e.target.value })}
            className="nl-input h-10 w-full px-3 text-[13px]"
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>
      </div>
    </AppModalShell>
  );
}
