import { useEffect } from 'react';
import { APP_ICON_PATH, COMPANY_EMAIL } from '../constants';
import type { useSetupState } from './useSetupState';

type SetupState = ReturnType<typeof useSetupState>;

interface SetupControllerOptions {
  electron: { ipcRenderer: { invoke: (channel: string, ...args: unknown[]) => Promise<Record<string, unknown>> } } | null;
  appLogo: string;
  setup: Pick<SetupState, 'setupStep' | 'setSetupStep' | 'setupData' | 'setupLicenseInfo' | 'setSetupLicenseInfo' | 'setSetupError' | 'configuracoes'>;
  guardarConfiguracao: (key: string, value: string) => Promise<void>;
  carregarConfiguracoes: () => Promise<void>;
}

export function useSetupController({ electron, appLogo, setup, guardarConfiguracao, carregarConfiguracoes }: SetupControllerOptions) {
  const { setupStep, setSetupStep, setupData, setupLicenseInfo, setSetupLicenseInfo, setSetupError, configuracoes } = setup;

  useEffect(() => {
    if (configuracoes?.setup_completed === '0') void electron?.ipcRenderer.invoke('window:resize', 600, 500, false);
  }, [configuracoes?.setup_completed, electron]);

  const validarPassoSetup = async () => {
    setSetupError('');
    if (setupStep === 3 && (!setupData.nomeAcademia || !setupData.email || !setupData.telefone)) {
      setSetupError('Preencha os campos obrigatórios (*).');
      return false;
    }
    if (setupStep === 3 && !setupData.email.includes('@')) {
      setSetupError('O email deve conter "@".');
      return false;
    }
    if (setupStep === 4 && (!setupData.adminEmail || !setupData.adminSenha)) {
      setSetupError('Preencha os dados do administrador.');
      return false;
    }
    if (setupStep === 4 && setupData.adminSenha.length < 6) {
      setSetupError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    if (setupStep === 4 && setupData.adminSenha !== setupData.confirmarSenha) {
      setSetupError('As senhas não coincidem.');
      return false;
    }
    if (setupStep === 5) {
      if (!setupData.licenca) {
        setSetupError('Insira o código de licença.');
        return false;
      }
      const result = await electron?.ipcRenderer.invoke('license:validate-external', setupData.licenca);
      if (result?.success) {
        setSetupLicenseInfo((result.license || null) as SetupState['setupLicenseInfo']);
        return true;
      }
      setSetupError(String(result?.message || 'Licença inválida.'));
      return false;
    }
    return true;
  };

  const proximoPassoSetup = async () => {
    if (await validarPassoSetup()) setSetupStep(previous => previous + 1);
  };

  const saltarSetupDesenvolvedor = async () => {
    if (!confirm('Atenção Desenvolvedor: Deseja ignorar o setup e entrar no app? (Isto criará dados padrão)')) return;
    await electron?.ipcRenderer.invoke('users:create', { name: 'Desenvolvedor', email: 'admin@nextlab.com', password: 'adminadmin', role: 'admin' });
    await electron?.ipcRenderer.invoke('setup:save-data', { nomeAcademia: 'Desenvolvimento NEXT Lab', email: COMPANY_EMAIL, telefone: '9597220', morada: 'Modo Dev', licenca: 'NEXTLEVEL-VITALICIO-2026', dataExpiracao: 'Vitalícia', tipoLicenca: 'vitalicio' });
    await carregarConfiguracoes();
    await electron?.ipcRenderer.invoke('window:resize', 1280, 850, true);
  };

  const finalizarSetupTotal = async () => {
    try {
      const userResult = await electron?.ipcRenderer.invoke('users:create', { name: 'Administrador', email: setupData.adminEmail, password: setupData.adminSenha, role: 'admin' });
      if (!userResult?.success) return setSetupError(String(userResult?.message || 'Erro ao criar administrador.'));
      const setupResult = await electron?.ipcRenderer.invoke('setup:save-data', { nomeAcademia: setupData.nomeAcademia, email: setupData.email, telefone: setupData.telefone, morada: setupData.morada, licenca: setupData.licenca, dataExpiracao: setupLicenseInfo?.dataExpiracao, tipoLicenca: setupLicenseInfo?.tipo });
      if (!setupResult?.success) return setSetupError(String(setupResult?.message || 'Erro ao guardar configuração.'));
      if (appLogo && appLogo !== APP_ICON_PATH) await guardarConfiguracao('app_logo', appLogo);
      await carregarConfiguracoes();
      await electron?.ipcRenderer.invoke('window:resize', 1280, 850, true);
    } catch {
      setSetupError('Erro ao finalizar o setup.');
    }
  };

  return { proximoPassoSetup, saltarSetupDesenvolvedor, finalizarSetupTotal };
}
