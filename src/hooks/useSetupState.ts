import { useState } from 'react';

export interface SetupData {
  nomeAcademia: string;
  email: string;
  telefone: string;
  morada: string;
  adminEmail: string;
  adminSenha: string;
  confirmarSenha: string;
  licenca: string;
}

export interface SetupLicenseInfo {
  dataExpiracao?: string;
  tipo?: string;
}

export function useSetupState() {
  const [setupStep, setSetupStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>({ nomeAcademia: '', email: '', telefone: '', morada: '', adminEmail: '', adminSenha: '', confirmarSenha: '', licenca: '' });
  const [setupLicenseInfo, setSetupLicenseInfo] = useState<SetupLicenseInfo | null>(null);
  const [setupError, setSetupError] = useState('');
  const [licencaAtiva, setLicencaAtiva] = useState(true);
  const [licencaDados, setLicencaDados] = useState({ chave: '', expiracao: '', tipo: '' });
  const [configuracoes, setConfiguracoes] = useState<Record<string, string> | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [chaveReativacao, setChaveReativacao] = useState('');
  const [erroReativacao, setErroReativacao] = useState('');

  return { setupStep, setSetupStep, setupData, setSetupData, setupLicenseInfo, setSetupLicenseInfo, setupError, setSetupError, licencaAtiva, setLicencaAtiva, licencaDados, setLicencaDados, configuracoes, setConfiguracoes, loadingConfig, setLoadingConfig, chaveReativacao, setChaveReativacao, erroReativacao, setErroReativacao };
}
