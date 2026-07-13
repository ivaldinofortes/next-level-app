import { memo, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Landmark, Users, Palette, Bell, Shield, Info, Sparkles,
  Plus, CheckCircle2, Zap, ChevronRight, CreditCard, UserPlus, Activity,
  FileBarChart, FileSpreadsheet, Archive, AlertTriangle, Database,
  HelpCircle, Globe, Phone, Mail,
} from 'lucide-react';
import {
  APP_ICON_PATH,
  DEFAULT_ACADEMY_BANNER,
  COMPANY_EMAIL,
  COMPANY_PHONE,
  COMPANY_WEBSITE,
  NEXT_LAB_ICON,
} from '../constants';
import { getUserAvatar, userInitials } from '../utils/userAvatar';

/** Cabeçalho de página de ajustes — mesmo tom visual, hierarquia clara */
function SettingsHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-light)] pb-5">
      <div className="min-w-0">
        <h3 className="text-[22px] font-black tracking-tight nl-text">{title}</h3>
        <p className="mt-1 text-[13px] font-medium nl-text-muted">{subtitle}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Bloco temático com título + descrição + conteúdo */
function SettingsSection({
  title,
  description,
  children,
  danger = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={`rounded-[6px] border p-5 ${
        danger
          ? 'border-red-200 bg-red-50/50'
          : 'border-[var(--border)] bg-[var(--color-secondary-lighter)]/25'
      }`}
    >
      <div className="mb-4">
        <h4 className={`text-[13px] font-bold ${danger ? 'text-red-900' : 'nl-text'}`}>{title}</h4>
        {description ? (
          <p className={`mt-0.5 text-[12px] font-medium ${danger ? 'text-red-700/80' : 'nl-text-muted'}`}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Linha de acção compacta (backup, importar, etc.) */
function SettingsActionRow({
  icon,
  title,
  description,
  action,
  tone = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
  tone?: 'default' | 'danger' | 'muted';
}) {
  const tones = {
    default: 'border-[var(--border)] bg-[var(--bg-surface)]',
    danger: 'border-red-200 bg-white',
    muted: 'border-[var(--border)] bg-[var(--bg-surface)] opacity-55',
  };
  return (
    <div className={`flex flex-col gap-3 rounded-[6px] border p-4 sm:flex-row sm:items-center sm:justify-between ${tones[tone]}`}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/50">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold nl-text">{title}</p>
          <p className="mt-0.5 text-[11px] font-medium leading-snug nl-text-muted">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{action}</div>
    </div>
  );
}

/** Toggle reutilizável no estilo actual */
function SettingsToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
        on ? 'bg-[var(--color-primary)]' : 'bg-slate-300'
      }`}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export interface ConfiguracoesPageProps {
  aba: string;
  configAba: 'geral' | 'operacao' | 'notificacoes' | 'tema' | 'utilizadores' | 'lixeira' | 'ajuda' | 'sobre';
  setConfigAba: (v: any) => void;
  sessionUser: { id: number; name: string; email: string; role: 'admin' | 'operational' | 'root' } | null;
  larguraListas: number;
  appLogo: string;
  setAppLogo: (v: string) => void;
  nomeAcademia: string;
  setNomeAcademia: (v: string) => void;
  telefoneAcademia: string;
  setTelefoneAcademia: (v: string) => void;
  emailAcademia: string;
  setEmailAcademia: (v: string) => void;
  moradaAcademia: string;
  setMoradaAcademia: (v: string) => void;
  lembrarUtilizadores: boolean;
  setLembrarUtilizadores: (v: boolean) => void;
  permitirGuardarSessao: boolean;
  setPermitirGuardarSessao: (v: boolean) => void;
  requireOperationalPassword: boolean;
  setRequireOperationalPassword: (v: boolean) => void;
  slideshowImages: string[];
  setSlideshowImages: (v: string[]) => void;
  slideshowTimer: number;
  setSlideshowTimer: (v: number) => void;
  slideshowTextEnabled: boolean;
  setSlideshowTextEnabled: (v: boolean) => void;
  appTheme: 'light' | 'dark' | 'claude' | 'hybrid';
  setAppTheme: (v: 'light' | 'dark' | 'claude' | 'hybrid') => void;
  bannerAcademia: string;
  setBannerAcademia: (v: string) => void;
  listaUtilizadores: any[];
  utilizadorAvatares: Record<string, string>;
  logs: any[];
  mostrarFormNovoUtilizador: boolean;
  setMostrarFormNovoUtilizador: (v: boolean) => void;
  utilizadorEmEdicao: any;
  setUtilizadorEmEdicao: (v: any) => void;
  utilizadorEdicaoForm: { name: string; role: string; isActive: boolean; novaSenha: string };
  setUtilizadorEdicaoForm: (v: any) => void;
  quickAccessUsers: number[];
  setQuickAccessUsers: Dispatch<SetStateAction<number[]>>;
  loginSlideshowUsers: any[];
  setLoginSlideshowUsers: Dispatch<SetStateAction<any[]>>;
  desktopNotificationsEnabled: boolean;
  setDesktopNotificationsEnabled: (v: boolean) => void;
  notifSistema: boolean;
  setNotifSistema: (v: boolean) => void;
  notifPagamentos: boolean;
  setNotifPagamentos: (v: boolean) => void;
  notifMatriculas: boolean;
  setNotifMatriculas: (v: boolean) => void;
  notifRelatorios: boolean;
  setNotifRelatorios: (v: boolean) => void;
  relatorioMensalDisponivel: string;
  notificacoes: any[];
  setNotificacoes: Dispatch<SetStateAction<any[]>>;
  diretorioBackup: string;
  setDiretorioBackup: (v: string) => void;
  resetSeguroForm: { password: string; confirmation: string };
  setResetSeguroForm: Dispatch<SetStateAction<{ password: string; confirmation: string }>>;
  resetSeguroLoading: boolean;
  carregandoDuplicados: boolean;
  mostrarImportar: boolean;
  setMostrarImportar: (v: boolean) => void;
  licencaDados: { chave: string; expiracao: string; tipo: string };
  guardarConfiguracao: (chave: string, valor: string) => Promise<void>;
  salvarDefinicoesGerais: () => Promise<void>;
  salvarAparencia: () => Promise<void>;
  carregarLogs: () => Promise<void>;
  gerarBackup: () => Promise<void>;
  selecionarDiretorioBackup: () => Promise<void>;
  buscarDuplicados: () => Promise<void>;
  abrirConfirmacao: (config: any) => void;
  resetarBancoDeDados: () => Promise<void>;
  salvarPreferenciasNotificacoes: () => Promise<void>;
  setAba: (v: string) => void;
  setMostrarModalExport: (v: boolean) => void;
}

function ConfiguracoesPage({
  aba,
  configAba,
  setConfigAba,
  sessionUser,
  larguraListas,
  appLogo,
  setAppLogo,
  nomeAcademia,
  setNomeAcademia,
  telefoneAcademia,
  setTelefoneAcademia,
  emailAcademia,
  setEmailAcademia,
  moradaAcademia,
  setMoradaAcademia,
  lembrarUtilizadores,
  setLembrarUtilizadores,
  permitirGuardarSessao,
  setPermitirGuardarSessao,
  requireOperationalPassword,
  setRequireOperationalPassword,
  slideshowImages,
  setSlideshowImages,
  slideshowTimer,
  setSlideshowTimer,
  slideshowTextEnabled,
  setSlideshowTextEnabled,
  appTheme,
  setAppTheme,
  bannerAcademia,
  setBannerAcademia,
  listaUtilizadores,
  utilizadorAvatares,
  logs,
  mostrarFormNovoUtilizador,
  setMostrarFormNovoUtilizador,
  utilizadorEmEdicao,
  setUtilizadorEmEdicao,
  utilizadorEdicaoForm,
  setUtilizadorEdicaoForm,
  quickAccessUsers,
  setQuickAccessUsers,
  loginSlideshowUsers,
  setLoginSlideshowUsers,
  desktopNotificationsEnabled,
  setDesktopNotificationsEnabled,
  notifSistema,
  setNotifSistema,
  notifPagamentos,
  setNotifPagamentos,
  notifMatriculas,
  setNotifMatriculas,
  notifRelatorios,
  setNotifRelatorios,
  relatorioMensalDisponivel,
  notificacoes,
  setNotificacoes,
  diretorioBackup,
  setDiretorioBackup,
  resetSeguroForm,
  setResetSeguroForm,
  resetSeguroLoading,
  carregandoDuplicados,
  mostrarImportar,
  setMostrarImportar,
  licencaDados,
  guardarConfiguracao,
  salvarDefinicoesGerais,
  salvarAparencia,
  carregarLogs,
  gerarBackup,
  selecionarDiretorioBackup,
  buscarDuplicados,
  abrirConfirmacao,
  resetarBancoDeDados,
  salvarPreferenciasNotificacoes,
  setAba,
  setMostrarModalExport,
}: ConfiguracoesPageProps) {
  const navGroups = [
    {
      label: 'Instituição',
      items: [
        { id: 'geral' as const, label: 'Academia', hint: 'Dados e login', icon: <Landmark size={15} />, color: 'text-blue-600' },
        { id: 'tema' as const, label: 'Aparência', hint: 'Tema e banner', icon: <Palette size={15} />, color: 'text-purple-600' },
      ],
    },
    {
      label: 'Equipa',
      items: [
        { id: 'utilizadores' as const, label: 'Utilizadores', hint: 'Contas e acessos', icon: <Users size={15} />, color: 'text-emerald-600' },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { id: 'notificacoes' as const, label: 'Notificações', hint: 'Alertas e avisos', icon: <Bell size={15} />, color: 'text-rose-600' },
        { id: 'operacao' as const, label: 'Dados & Backup', hint: 'Importar e segurança', icon: <Shield size={15} />, color: 'text-orange-600' },
      ],
    },
    {
      label: 'Sobre',
      items: [
        { id: 'ajuda' as const, label: 'Suporte', hint: 'Contactos', icon: <Info size={15} />, color: 'text-sky-600' },
        { id: 'sobre' as const, label: 'Licença', hint: 'Termos e versão', icon: <Sparkles size={15} />, color: 'text-amber-600' },
      ],
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-[var(--bg-app)] animate-fade-in p-5 lg:p-6">
      <div
        className="mx-auto flex h-full min-h-0 w-full overflow-hidden rounded-[4px] border border-[var(--border)] shadow-sm"
        style={{ maxWidth: `${larguraListas}px` }}
      >
        <aside className="flex w-[232px] shrink-0 flex-col border-r border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40">
          <div className="border-b border-[var(--border-light)] px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] nl-text-muted">Painel de controlo</p>
            <h2 className="mt-0.5 text-[15px] font-black tracking-tight nl-text">Ajustes</h2>
          </div>
          <nav className="flex-1 space-y-4 overflow-y-auto custom-scrollbar px-3 py-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-2 text-[9px] font-black uppercase tracking-[0.16em] nl-text-muted">{group.label}</p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = configAba === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setConfigAba(item.id)}
                        className={`flex w-full items-center gap-2.5 rounded-[3px] px-2.5 py-2 text-left transition-all ${
                          active
                            ? 'bg-[var(--bg-surface)] font-bold text-[var(--color-primary)] shadow-sm ring-1 ring-black/5'
                            : 'nl-text-muted hover:bg-[var(--bg-surface)]/60 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span className={`shrink-0 ${active ? '' : item.color}`}>{item.icon}</span>
                        <span className="min-w-0">
                          <span className="block text-[12px] leading-tight">{item.label}</span>
                          <span className={`block text-[10px] font-medium leading-tight ${active ? 'text-[var(--color-primary)]/70' : 'opacity-70'}`}>
                            {item.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-surface)]">
          <div className="mx-auto max-w-[820px] space-y-5 p-6 lg:p-8">
          {configAba === 'geral' && (
            <div className="animate-slide-up space-y-5">
              <SettingsHeader
                title="Academia"
                subtitle="Identidade, contactos e comportamento do ecrã de login."
                action={(
                  <button type="button" onClick={salvarDefinicoesGerais} className="nl-btn nl-btn-primary h-10 px-5 text-[12px] font-bold">
                    Guardar
                  </button>
                )}
              />

              <SettingsSection title="Identidade" description="Logótipo e nome usados no sistema, PDFs e cabeçalhos.">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
                    <img src={appLogo || APP_ICON_PATH} className="h-11 w-11 object-contain" alt="Logo" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider nl-text-muted">Nome comercial</label>
                      <input type="text" value={nomeAcademia} onChange={(e) => setNomeAcademia(e.target.value)} className="nl-input h-10 w-full px-3" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="file" id="logo-upload-geral" className="hidden" accept="image/svg+xml,image/png,image/jpeg" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const result = ev.target?.result as string;
                            setAppLogo(result);
                            localStorage.setItem('nl_app_logo', result);
                            guardarConfiguracao('app_logo', result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                      <button type="button" onClick={() => document.getElementById('logo-upload-geral')?.click()} className="nl-btn nl-btn-secondary h-8 px-3 text-[11px]">Alterar logo</button>
                      <button type="button" onClick={() => { setAppLogo(APP_ICON_PATH); localStorage.removeItem('nl_app_logo'); guardarConfiguracao('app_logo', ''); }} className="text-[11px] font-semibold nl-text-muted transition-colors hover:text-red-500">Repor padrão</button>
                      <span className="text-[10px] nl-text-muted">PNG, JPEG ou SVG</span>
                    </div>
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection title="Contactos" description="Dados de suporte e localização da academia.">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider nl-text-muted">Telemóvel</label>
                    <input type="text" value={telefoneAcademia} onChange={(e) => setTelefoneAcademia(e.target.value)} className="nl-input h-10 w-full px-3" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider nl-text-muted">Email</label>
                    <input type="email" value={emailAcademia} onChange={(e) => setEmailAcademia(e.target.value)} className="nl-input h-10 w-full px-3" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider nl-text-muted">Morada</label>
                    <input type="text" value={moradaAcademia} onChange={(e) => setMoradaAcademia(e.target.value)} className="nl-input h-10 w-full px-3" />
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection title="Acesso e sessão" description="Políticas do ecrã de login e autenticação.">
                <div className="space-y-2.5">
                  {[
                    { label: 'Lembrar utilizadores anteriores', sub: 'Mostra a lista de emails no login', val: lembrarUtilizadores, set: () => setLembrarUtilizadores(!lembrarUtilizadores) },
                    { label: 'Permitir guardar sessão', sub: 'Exibe a opção “Manter sessão iniciada”', val: permitirGuardarSessao, set: () => setPermitirGuardarSessao(!permitirGuardarSessao) },
                    { label: 'Exigir palavra-passe a operacionais', sub: 'Operadores precisam de senha para entrar', val: requireOperationalPassword, set: () => setRequireOperationalPassword(!requireOperationalPassword) },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 rounded-[5px] border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold nl-text">{row.label}</p>
                        <p className="text-[11px] nl-text-muted">{row.sub}</p>
                      </div>
                      <SettingsToggle on={row.val} onToggle={row.set} />
                    </div>
                  ))}
                </div>
              </SettingsSection>

              <SettingsSection title="Slideshow do login" description="Até 5 imagens no painel direito do login (modo apresentação quando inactivo).">
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const img = slideshowImages[i];
                    return (
                      <div key={i} className="group relative aspect-video overflow-hidden rounded-[5px] border border-[var(--border)] bg-[var(--bg-surface)]">
                        {img ? (
                          <>
                            <img src={img} className="h-full w-full object-cover" alt={`Slide ${i + 1}`} />
                            <button type="button" onClick={() => {
                              const next = slideshowImages.filter((_, idx) => idx !== i);
                              setSlideshowImages(next);
                              localStorage.setItem('nl_slideshow_images', JSON.stringify(next));
                            }} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">×</button>
                          </>
                        ) : (
                          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-0.5 nl-text-muted opacity-60 transition-colors hover:bg-[var(--color-secondary-lighter)] hover:opacity-100">
                            <Plus size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">{i + 1}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0]; if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const b64 = ev.target?.result as string;
                                const next = [...slideshowImages]; next[i] = b64;
                                const filtered = next.filter(Boolean);
                                setSlideshowImages(filtered);
                                localStorage.setItem('nl_slideshow_images', JSON.stringify(filtered));
                              };
                              reader.readAsDataURL(file);
                            }} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider nl-text-muted">Intervalo (seg)</label>
                    <input type="number" min={3} max={30} value={slideshowTimer}
                      onChange={(e) => { const v = Number(e.target.value); setSlideshowTimer(v); localStorage.setItem('nl_slideshow_timer', String(v)); }}
                      className="nl-input h-8 w-16 text-center text-[13px]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <SettingsToggle on={slideshowTextEnabled} onToggle={() => {
                      const v = !slideshowTextEnabled;
                      setSlideshowTextEnabled(v);
                      localStorage.setItem('nl_slideshow_text', v ? '1' : '0');
                    }} />
                    <span className="text-[12px] nl-text-muted">Texto sobre as imagens</span>
                  </div>
                  {slideshowImages.length > 0 && (
                    <button type="button" onClick={() => { setSlideshowImages([]); localStorage.removeItem('nl_slideshow_images'); }} className="text-[11px] font-bold text-red-500 hover:underline">Limpar slideshow</button>
                  )}
                </div>
              </SettingsSection>

              <div className="flex justify-end border-t border-[var(--border-light)] pt-4">
                <button type="button" onClick={salvarDefinicoesGerais} className="nl-btn nl-btn-primary h-10 px-8 text-[12px] font-bold">Guardar alterações</button>
              </div>
            </div>
          )}

          {configAba === 'tema' && (
            <div className="animate-slide-up space-y-5">
              <SettingsHeader
                title="Aparência"
                subtitle="Tema da interface e imagens de branding do login."
                action={(
                  <button type="button" onClick={salvarAparencia} className="nl-btn nl-btn-primary h-10 px-5 text-[12px] font-bold">Guardar</button>
                )}
              />

              <SettingsSection title="Tema da interface" description="Aplica-se de imediato em todo o sistema. A página Relatórios usa sempre o tema escuro.">
                <div className="space-y-4">
                  <label className="sr-only">Tema da Interface</label>
                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    {([
                      {
                        id: 'light' as const,
                        label: 'Claro',
                        desc: 'Padrão profissional',
                        preview: { bg: '#F4F5F7', surface: '#FFFFFF', header: '#FFFFFF', accent: '#0065FF', text: '#172B4D', border: '#DFE1E6', footer: '#FFFFFF' },
                      },
                      {
                        id: 'dark' as const,
                        label: 'Escuro',
                        desc: 'Conforto nocturno',
                        preview: { bg: '#161A1D', surface: '#22272B', header: '#1D2125', accent: '#579DFF', text: '#F1F2F4', border: '#3D474F', footer: '#1D2125' },
                      },
                      {
                        id: 'claude' as const,
                        label: 'Claude',
                        desc: 'Quente & elegante',
                        preview: { bg: '#EDE7DF', surface: '#FAF7F3', header: '#F2EDE6', accent: '#CF7C5A', text: '#1E1612', border: '#DDD4C8', footer: '#F2EDE6' },
                      },
                      {
                        id: 'hybrid' as const,
                        label: 'Híbrido',
                        desc: 'Chrome escuro · corpo claro',
                        preview: { bg: '#F0EEF2', surface: '#FFFFFF', header: '#241F31', accent: '#3584E4', text: '#241F31', border: '#deddda', footer: '#241F31' },
                      },
                    ] as const).map((tema) => {
                      const active = appTheme === tema.id;
                      return (
                        <button
                          key={tema.id}
                          type="button"
                          onClick={() => { setAppTheme(tema.id); localStorage.setItem('nl_app_theme', tema.id); }}
                          className={`relative flex flex-col rounded-[8px] overflow-hidden border-2 transition-all text-left ${active ? 'border-[var(--color-primary)] shadow-[0_0_0_3px_var(--shadow-primary)]' : 'border-[var(--border)] hover:border-[var(--color-primary)]/40'}`}
                        >
                          {/* Mini preview */}
                          <div className="h-[88px] w-full relative overflow-hidden" style={{ background: tema.preview.bg }}>
                            {/* Mini header (chrome) */}
                            <div className="absolute top-0 left-0 right-0 h-5 flex items-center px-2 gap-1.5" style={{ background: tema.preview.header, borderBottom: `1px solid ${tema.id === 'hybrid' ? 'rgba(255,255,255,0.12)' : tema.preview.border}` }}>
                              <div className="w-8 h-1.5 rounded-full" style={{ background: tema.preview.accent }} />
                              <div className="flex gap-1 ml-auto">
                                {[0,1,2].map(i => (
                                  <div
                                    key={i}
                                    className="h-1.5 rounded-full"
                                    style={{
                                      width: i === 0 ? 14 : 10,
                                      background: tema.id === 'hybrid' || tema.id === 'dark' ? 'rgba(255,255,255,0.25)' : tema.preview.border,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                            {/* Mini content (corpo) */}
                            <div className="absolute top-6 left-2 right-2 bottom-4 rounded-[3px] p-2 flex flex-col gap-1" style={{ background: tema.preview.surface, border: `1px solid ${tema.preview.border}` }}>
                              <div className="h-1.5 rounded-full w-3/4" style={{ background: tema.preview.text, opacity: 0.7 }} />
                              <div className="h-1 rounded-full w-1/2" style={{ background: tema.preview.border }} />
                              <div className="h-4 rounded-[2px] w-16 mt-auto" style={{ background: tema.preview.accent }} />
                            </div>
                            {/* Mini status bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-2.5" style={{ background: tema.preview.footer }} />
                          </div>
                          {/* Label */}
                          <div className="px-3 py-2.5 bg-[var(--bg-surface)] border-t border-[var(--border)]">
                            <div className="flex items-center justify-between gap-1">
                              <div className="min-w-0">
                                <p className="text-[12px] font-bold nl-text">{tema.label}</p>
                                <p className="text-[10px] nl-text-muted leading-snug">{tema.desc}</p>
                              </div>
                              {active && (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]">
                                  <CheckCircle2 size={12} className="text-white" />
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] nl-text-muted">
                    O tema aplica-se imediatamente. No <strong className="nl-text">Híbrido</strong>, o cabeçalho e a barra de estado ficam escuros e o conteúdo claro.
                    A página <strong className="nl-text">Relatórios</strong> permanece sempre em tema escuro.
                  </p>
                </div>
              </SettingsSection>

              <SettingsSection title="Branding visual" description="Logótipo no sistema e banner do ecrã de login.">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider nl-text-muted block">Logotipo</label>
                    <div className="flex items-center gap-5">
                      <div className="w-24 h-24 rounded-[6px] bg-[var(--color-secondary-lighter)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
                        <img src={appLogo || APP_ICON_PATH} className="w-16 h-16 object-contain" alt="Logo" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <input type="file" id="logo-upload" className="hidden" accept="image/svg+xml,image/png,image/jpeg"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { setAppLogo(ev.target?.result as string); }; reader.readAsDataURL(file); } }}
                        />
                        <button onClick={() => document.getElementById('logo-upload')?.click()} className="nl-btn nl-btn-secondary h-10 px-4 text-[12px]">Alterar Logo</button>
                        <button onClick={() => { setAppLogo(APP_ICON_PATH); localStorage.removeItem('nl_app_logo'); }} className="text-[10px] font-bold text-red-500 hover:underline">Reset Padrão</button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider nl-text-muted block">Banner de login</label>
                    <div className="flex items-center gap-5">
                      <div className="w-32 h-20 rounded-[6px] bg-[var(--color-secondary-lighter)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
                        <img src={bannerAcademia || DEFAULT_ACADEMY_BANNER} className="w-full h-full object-cover" alt="Banner" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <input type="file" id="banner-upload" className="hidden" accept="image/*"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { setBannerAcademia(ev.target?.result as string); }; reader.readAsDataURL(file); } }}
                        />
                        <button onClick={() => document.getElementById('banner-upload')?.click()} className="nl-btn nl-btn-secondary h-10 px-4 text-[12px]">Upload Imagem</button>
                        <button onClick={() => { setBannerAcademia(DEFAULT_ACADEMY_BANNER); localStorage.removeItem('nl_banner_academia'); }} className="text-[10px] font-bold text-red-500 hover:underline">Reset Padrão</button>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[11px] nl-text-muted">Dica: use imagens horizontais Full HD no banner para melhor impacto no login.</p>
              </SettingsSection>

              <div className="flex justify-end border-t border-[var(--border-light)] pt-4">
                <button type="button" onClick={salvarAparencia} className="nl-btn nl-btn-primary h-10 px-8 text-[12px] font-bold">Guardar alterações</button>
              </div>
            </div>
          )}

          {configAba === 'utilizadores' && (
            <div className="animate-slide-up space-y-5">
              <SettingsHeader
                title="Utilizadores"
                subtitle={`${listaUtilizadores.length} conta(s) · clique para editar ou ver actividade`}
                action={(
                  <button type="button" onClick={() => setMostrarFormNovoUtilizador(true)} className="nl-btn nl-btn-primary h-10 px-4 text-[12px] font-bold flex items-center gap-1.5">
                    <Plus size={14} /> Novo
                  </button>
                )}
              />

              <div className="border border-[var(--border)] rounded-[6px] overflow-hidden bg-[var(--bg-surface)] shadow-sm divide-y divide-[var(--border-light)]">
                {listaUtilizadores.length === 0 && (
                  <p className="px-6 py-8 text-center text-[13px] nl-text-muted">Nenhum utilizador registado.</p>
                )}
                {listaUtilizadores.map(user => {
                  const avatar = getUserAvatar(utilizadorAvatares, user);
                  const isCurrent = sessionUser?.email === user.email;
                  const activityCount = logs.filter(l => l.user_name === user.name).length;
                  return (
                    <div
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setUtilizadorEmEdicao(user);
                        setUtilizadorEdicaoForm({ name: user.name, role: user.role, isActive: user.is_active !== 0, novaSenha: '' });
                        carregarLogs();
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        setUtilizadorEmEdicao(user);
                        setUtilizadorEdicaoForm({ name: user.name, role: user.role, isActive: user.is_active !== 0, novaSenha: '' });
                        carregarLogs();
                      }}
                      className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[var(--color-secondary-lighter)]/40 transition-colors group"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-[8px] overflow-hidden flex items-center justify-center font-bold text-[14px] border-2 ${user.is_active === 0 ? 'opacity-40 grayscale' : ''} ${isCurrent ? 'border-[var(--color-primary)]' : 'border-transparent'}`}
                             style={{ background: avatar ? 'transparent' : `hsl(${(user.name.charCodeAt(0) * 37) % 360}, 60%, 88%)`, color: `hsl(${(user.name.charCodeAt(0) * 37) % 360}, 60%, 35%)` }}>
                          {avatar
                            ? <img src={avatar} className="w-full h-full object-cover" alt={user.name} />
                            : userInitials(user.name)}
                        </div>
                        {isCurrent && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold nl-text truncate">{user.name}</p>
                          {isCurrent && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Eu</span>}
                          {user.is_active === 0 && <span className="text-[9px] font-bold nl-text-muted bg-[var(--color-secondary-lighter)] border border-[var(--border)] px-1.5 py-0.5 rounded-full">Inactivo</span>}
                        </div>
                        <p className="text-[12px] nl-text-muted truncate">{user.email}</p>
                      </div>
                      {/* Role + Quick Access + stats */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle Quick Access */}
                        {user.is_active !== 0 && (
                          <button
                            type="button"
                            title={quickAccessUsers.includes(user.id) ? 'Remover acesso rápido' : 'Ativar acesso rápido (sem senha)'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickAccessUsers(prev => {
                                const next = prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id];
                                localStorage.setItem('nl_quick_access_users', JSON.stringify(next));
                                setLoginSlideshowUsers(listaUtilizadores.filter(u => next.includes(u.id) && u.is_active !== 0));
                                return next;
                              });
                            }}
                            className={`flex items-center gap-1 h-6 px-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${quickAccessUsers.includes(user.id) ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'}`}
                          >
                            <Zap size={9} /> Quick
                          </button>
                        )}
                        {activityCount > 0 && (
                          <span className="text-[11px] nl-text-muted">{activityCount} acção{activityCount !== 1 ? 'ões' : ''}</span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {user.role === 'admin' ? 'Admin' : 'Operador'}
                        </span>
                        <ChevronRight size={14} className="nl-text-muted group-hover:text-[var(--color-primary)] transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {configAba === 'notificacoes' && (
            <div className="animate-slide-up space-y-5">
              <SettingsHeader
                title="Notificações"
                subtitle="Controle alertas do sistema, categorias e histórico."
                action={(
                  <button type="button" onClick={salvarPreferenciasNotificacoes} className="nl-btn nl-btn-primary h-10 px-5 text-[12px] font-bold">Guardar</button>
                )}
              />

              <SettingsSection title="Sistema" description="Canais de alerta gerais do aplicativo.">
                <div className="space-y-2.5">
                  {([
                    { label: 'Notificações de sistema (desktop)', sub: 'Alertas via notificação nativa do sistema operativo', val: desktopNotificationsEnabled, set: setDesktopNotificationsEnabled },
                    { label: 'Alertas do sistema', sub: 'Avisos de backup, actualizações e manutenção', val: notifSistema, set: setNotifSistema },
                  ] as const).map(row => (
                    <div key={row.label} className="flex items-center justify-between p-4 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)]">
                      <div>
                        <p className="text-[13px] font-semibold nl-text">{row.label}</p>
                        <p className="text-[11px] nl-text-muted mt-0.5">{row.sub}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => row.set(!row.val)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${row.val ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${row.val ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </SettingsSection>

              <SettingsSection title="Categorias" description="Escolha que tipos de eventos geram avisos.">
                <div className="space-y-2.5">
                  {([
                    { label: 'Pagamentos', sub: 'Confirmação de pagamentos registados e cobranças pendentes', icon: <CreditCard size={16} className="text-emerald-600" />, val: notifPagamentos, set: setNotifPagamentos },
                    { label: 'Matrículas', sub: 'Novos alunos inscritos e alterações de estado', icon: <UserPlus size={16} className="text-blue-600" />, val: notifMatriculas, set: setNotifMatriculas },
                    { label: 'Relatórios mensais', sub: 'Aviso quando o relatório do mês está disponível para exportar', icon: <FileBarChart size={16} className="text-amber-600" />, val: notifRelatorios, set: setNotifRelatorios },
                  ] as const).map(row => (
                    <div key={row.label} className="flex items-center justify-between p-4 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[5px] bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-sm">
                          {row.icon}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold nl-text">{row.label}</p>
                          <p className="text-[11px] nl-text-muted mt-0.5">{row.sub}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => row.set(!row.val)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${row.val ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${row.val ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </SettingsSection>

              {relatorioMensalDisponivel && (
                <div className="nl-alert nl-alert-info">
                  <div className="nl-alert-icon"><FileBarChart size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="nl-alert-title">Relatório de {relatorioMensalDisponivel} disponível</p>
                    <p className="nl-alert-body">Aceda ao dossier de desempenho para exportar em PDF ou Excel.</p>
                  </div>
                  <button type="button" onClick={() => { setAba('gestao'); setMostrarModalExport(true); }}
                    className="shrink-0 text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 px-2.5 py-1 rounded-[4px] transition-colors self-start">
                    Exportar →
                  </button>
                </div>
              )}

              <SettingsSection title="Relatório diário" description="Resumo automático no horário definido.">
                <DailyReportSchedule />
              </SettingsSection>

              <SettingsSection title="Histórico" description="Notificações recentes do sistema.">
                <div className="mb-2 flex items-center justify-end">
                  {notificacoes.length > 0 && (
                    <button type="button" onClick={() => setNotificacoes([])} className="text-[11px] font-semibold text-red-500 hover:underline">Limpar tudo</button>
                  )}
                </div>
                {notificacoes.length === 0 ? (
                  <p className="text-[13px] nl-text-muted text-center py-6">Sem notificações.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {notificacoes.slice().reverse().map(n => (
                      <div key={n.id} className={`flex items-start gap-3 p-3 rounded-[5px] border ${n.lida ? 'bg-[var(--color-secondary-lighter)] border-[var(--border)]' : 'bg-blue-50 border-blue-100'}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.tipo === 'sucesso' ? 'bg-emerald-500' : n.tipo === 'alerta' ? 'bg-amber-500' : n.tipo === 'erro' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold nl-text">{n.titulo}</p>
                          <p className="text-[11px] nl-text-muted mt-0.5 line-clamp-2">{n.mensagem}</p>
                          <p className="text-[10px] nl-text-muted mt-1">{n.data}</p>
                        </div>
                        {!n.lida && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />}
                      </div>
                    ))}
                  </div>
                )}
              </SettingsSection>

              <div className="flex justify-end border-t border-[var(--border-light)] pt-4">
                <button type="button" onClick={salvarPreferenciasNotificacoes} className="nl-btn nl-btn-primary h-10 px-8 text-[12px] font-bold">Guardar preferências</button>
              </div>
            </div>
          )}

          {configAba === 'operacao' && (
            <div className="animate-slide-up space-y-5">
              <SettingsHeader
                title="Dados & Backup"
                subtitle="Cópias de segurança, importação e manutenção da base de dados."
              />

              <SettingsSection title="Cópia de segurança" description="Exportar base de dados e ficheiros locais para um ZIP.">
                <SettingsActionRow
                  icon={<Archive size={18} className="text-blue-600" />}
                  title="Backup integral (ZIP)"
                  description={diretorioBackup ? `Pasta: ${diretorioBackup}` : 'O sistema pergunta onde guardar em cada exportação.'}
                  action={(
                    <>
                      <button type="button" onClick={selecionarDiretorioBackup} className="nl-btn nl-btn-secondary h-9 px-3 text-[11px]">Pasta</button>
                      {diretorioBackup && (
                        <button type="button" onClick={async () => {
                          const electron = (window as any).electron || null;
                          setDiretorioBackup('');
                          await electron?.ipcRenderer.invoke('update-configuracao', 'diretorio_backup', '');
                        }} className="text-[11px] font-bold text-red-500 hover:underline">Limpar</button>
                      )}
                      <button type="button" onClick={gerarBackup} className="nl-btn nl-btn-primary h-9 px-4 text-[11px]">Exportar agora</button>
                    </>
                  )}
                />
              </SettingsSection>

              <SettingsSection title="Dados" description="Importar alunos e rever registos duplicados.">
                <div className="space-y-2.5">
                  <SettingsActionRow
                    icon={<FileSpreadsheet size={18} className="text-emerald-600" />}
                    title="Importar Excel"
                    description="Importação com validação e prevenção de duplicados. Ideal para migração."
                    action={<button type="button" onClick={() => setMostrarImportar(true)} className="nl-btn nl-btn-primary h-9 px-4 text-[11px]">Importar</button>}
                  />
                  <SettingsActionRow
                    icon={<Sparkles size={18} className="text-amber-600" />}
                    title="Gestor de duplicados"
                    description="Deteta alunos repetidos por nome ou telefone. Recomendado após importações."
                    action={(
                      <button type="button" onClick={buscarDuplicados} disabled={carregandoDuplicados} className="nl-btn nl-btn-secondary h-9 px-4 text-[11px]">
                        {carregandoDuplicados ? 'A verificar…' : 'Verificar'}
                      </button>
                    )}
                  />
                  <SettingsActionRow
                    icon={<Database size={18} className="nl-text-muted" />}
                    title="Limpeza de cache"
                    description="Otimização da base de dados interna (em breve)."
                    tone="muted"
                    action={<button type="button" className="nl-btn nl-btn-secondary h-9 px-4 text-[11px]" disabled>Otimizar</button>}
                  />
                </div>
              </SettingsSection>

              <SettingsSection
                title="Zona de risco"
                description="Remove alunos, pagamentos e notas. Mantém utilizadores, licença e configurações."
                danger
              >
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <input
                    type="password"
                    value={resetSeguroForm.password}
                    onChange={(e) => setResetSeguroForm((form: any) => ({ ...form, password: e.target.value }))}
                    placeholder="Senha do administrador"
                    className="nl-input h-10"
                  />
                  <input
                    type="text"
                    value={resetSeguroForm.confirmation}
                    onChange={(e) => setResetSeguroForm((form: any) => ({ ...form, confirmation: e.target.value }))}
                    placeholder="Escreva RESETAR"
                    className="nl-input h-10"
                  />
                  <button
                    type="button"
                    onClick={() => abrirConfirmacao({
                      title: 'Resetar dados operacionais',
                      message: 'Esta ação remove alunos, pagamentos e notas da base de dados. Utilizadores e licença serão mantidos. Confirmas?',
                      confirmLabel: 'Resetar Dados',
                      tone: 'danger',
                      onConfirm: resetarBancoDeDados,
                    })}
                    disabled={resetSeguroLoading || sessionUser?.role !== 'admin'}
                    className="nl-btn h-10 bg-red-600 px-4 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resetSeguroLoading ? 'A resetar…' : 'Resetar dados'}
                  </button>
                </div>
                {sessionUser?.role !== 'admin' && (
                  <p className="mt-2 text-[11px] font-semibold text-red-700">Apenas administradores podem executar esta operação.</p>
                )}
              </SettingsSection>
            </div>
          )}

          {configAba === 'ajuda' && (
            <div className="animate-slide-up space-y-5">
              <SettingsHeader
                title="Suporte"
                subtitle="Assistência técnica e contactos da NEXT Lab para o NEXTLevel."
              />
              <div className="flex items-center gap-4 rounded-[6px] border border-[var(--border)] bg-[var(--color-secondary-lighter)]/30 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[8px] text-white" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
                  <HelpCircle size={24} />
                </div>
                <div>
                  <p className="text-[14px] font-bold nl-text">Centro de ajuda</p>
                  <p className="text-[12px] nl-text-muted">Esclareça dúvidas e peça suporte ao ecossistema NEXTLevel.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => { const electron = (window as any).electron || null; electron?.ipcRenderer.invoke('open-external', `mailto:${COMPANY_EMAIL}`); }} className="group p-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-light)] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-6 text-blue-600">
                    <Mail size={24} />
                  </div>
                  <p className="text-[18px] font-black nl-text mb-1">Suporte via E-mail</p>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em]">Resposta prioritária 24h</p>
                </button>

                <button onClick={() => { const electron = (window as any).electron || null; electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE); }} className="group p-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-secondary-lighter)] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-secondary-lighter)] flex items-center justify-center mb-6 nl-text-muted">
                    <Globe size={24} />
                  </div>
                  <p className="text-[18px] font-black nl-text mb-1">Portal do Cliente</p>
                  <p className="text-[11px] font-bold nl-text-muted uppercase tracking-[0.2em]">nextlab.com/suporte</p>
                </button>
              </div>

              <div className="relative p-10 rounded-2xl overflow-hidden shadow-2xl group transition-all duration-500 hover:shadow-blue-900/20" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center relative shadow-inner">
                      <Phone size={28} className="text-blue-400" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0F172A] rounded-full animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-[18px] font-black text-white">Suporte Directo</p>
                        <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">Online</span>
                      </div>
                      <p className="text-white/60 text-[14px] mt-1 font-medium tracking-wide">{COMPANY_PHONE}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Atendimento Comercial</p>
                    <p className="text-white/40 text-[11px] font-medium italic">Disponível em dias úteis, 09h — 18h</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {configAba === 'sobre' && (
            <div className="animate-slide-up space-y-5">
              <SettingsHeader
                title="Licença"
                subtitle="Acordo de utilização, propriedade e dados da instalação."
              />
              <div className="mx-auto max-w-[640px] rounded-[6px] border border-[var(--border)] bg-white py-10 px-8 sm:px-12 shadow-sm" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

                {/* Logos */}
                <div className="flex items-center justify-between mb-14">
                  <div className="flex items-center gap-3">
                    <img src={appLogo || APP_ICON_PATH} className="w-9 h-9 object-contain" alt="NEXTLevel" />
                    <div>
                      <p className="text-[15px] font-bold text-slate-900 leading-none tracking-tight">NEXTLevel</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Sistema de Gestão de Academias</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <img src={NEXT_LAB_ICON} className="w-7 h-7 object-contain opacity-70" alt="NEXT Lab" />
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-slate-700 leading-none">NEXT Lab</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Creative Studio · desde 1995</p>
                    </div>
                  </div>
                </div>

                {/* Título */}
                <div className="mb-10">
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.25em] mb-2">Acordo de Licença de Utilização</p>
                  <h1 className="text-[26px] font-bold text-slate-900 leading-tight tracking-tight">
                    NEXTLevel — Licença de Uso de Software
                  </h1>
                  <p className="text-[13px] text-slate-400 mt-2">
                    Emitido em {new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {licencaDados.chave && ` · Licença: ${licencaDados.tipo || 'Standard'} · Válida até ${licencaDados.expiracao || 'Vitalícia'}`}
                  </p>
                </div>

                {/* Corpo do texto */}
                <div className="space-y-8 text-[14px] text-slate-600 leading-[1.9]" style={{ textAlign: 'justify' }}>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">1. Propriedade Intelectual</p>
                    <p>O presente software, incluindo o seu código-fonte, design, arquitectura e documentação, é propriedade intelectual exclusiva de <strong className="text-slate-800 font-semibold">Ivaldino da Luz Fortes</strong>, CEO da <strong className="text-slate-800 font-semibold">NEXT Lab</strong>. Todos os direitos reservados nos termos da legislação vigente sobre direitos de autor e propriedade intelectual. Qualquer reprodução, distribuição ou utilização não autorizada constitui violação do presente acordo e poderá implicar responsabilidade civil e criminal.</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">2. Licença de Uso</p>
                    <p>A licença concedida é de carácter pessoal e intransferível, válida para uma única entidade — pessoa singular ou colectiva — identificada no momento da activação. Fica expressamente proibida a cedência, partilha ou sublicenciamento a terceiros; a instalação simultânea em múltiplos terminais sem autorização escrita do desenvolvedor; bem como a engenharia reversa, modificação ou redistribuição do software sob qualquer forma.</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">3. Dados e Privacidade</p>
                    <p>O NEXTLevel opera em modo totalmente offline. Todos os dados introduzidos — incluindo informações de alunos, pagamentos e configurações — são armazenados exclusivamente no dispositivo local do utilizador. A NEXT Lab não tem acesso, não armazena nem transmite qualquer dado pessoal ou operacional. O utilizador é o único responsável pela gestão, segurança e integridade das suas informações.</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">4. Cópias de Segurança</p>
                    <p>Recomenda-se vivamente a realização periódica de cópias de segurança através das ferramentas disponíveis no sistema — exportação ZIP completa e exportação de dossier operacional em Excel. Estas cópias devem ser conservadas em suporte externo independente. A NEXT Lab declina qualquer responsabilidade por perda de dados resultante de falha de hardware, eliminação acidental ou causas externas ao software.</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">5. Suporte Técnico</p>
                    <p>Para questões técnicas, esclarecimentos ou solicitação de actualizações, o utilizador deverá contactar directamente o desenvolvedor pelos meios indicados neste documento. O suporte técnico encontra-se garantido durante todo o período de vigência da licença, sem encargos adicionais para o utilizador licenciado.</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">6. Limitação de Responsabilidade</p>
                    <p>O software é fornecido no estado em que se encontra. A NEXT Lab não garante que o funcionamento seja ininterrupto ou isento de erros, nem se responsabiliza por danos directos ou indirectos decorrentes da utilização do software, incluindo perda de dados, lucros cessantes ou interrupção de actividade, mesmo que tenha sido advertida da possibilidade de tais danos.</p>
                  </div>
                </div>

                {/* Separador */}
                <div className="my-12 border-t border-slate-100" />

                {/* Assinatura */}
                <div className="flex items-end justify-between gap-8">
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-[0.15em] mb-2">Desenvolvedor & CEO</p>
                    <p className="text-[20px] text-slate-900 leading-none mb-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Ivaldino da Luz Fortes</p>
                    <p className="text-[12px] text-slate-400">NEXT Lab · Cabo Verde</p>
                    <div className="flex items-center gap-5 mt-3 text-[12px] text-slate-400">
                      <span>{COMPANY_EMAIL}</span>
                      <span>{COMPANY_PHONE}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <img src={NEXT_LAB_ICON} className="w-10 h-10 object-contain opacity-30 ml-auto" alt="NEXT Lab" />
                    <p className="text-[10px] text-slate-300 mt-2 uppercase tracking-widest">NEXT Lab</p>
                  </div>
                </div>

                {/* Rodapé da página */}
                <div className="mt-14 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[11px] text-slate-300">© {new Date().getFullYear()} NEXT Lab. Todos os direitos reservados.</p>
                  <p className="text-[11px] text-slate-300">NEXTLevel · versão 1.0.0</p>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyReportSchedule() {
  const [ativo, setAtivo] = useState(() => localStorage.getItem('nl_daily_report_notif') === '1');
  const [hora, setHora] = useState(() => localStorage.getItem('nl_daily_report_time') || '18:00');

  useEffect(() => {
    localStorage.setItem('nl_daily_report_notif', ativo ? '1' : '0');
  }, [ativo]);

  useEffect(() => {
    localStorage.setItem('nl_daily_report_time', hora);
  }, [hora]);

  return (
    <div className="rounded-[6px] border border-blue-100 bg-blue-50/60 p-3.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[5px] bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
              <Activity size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-blue-900">Resumo diário automático</p>
              <p className="text-[11px] font-medium text-blue-700/70">Recebe uma notificação com o resumo do dia no horário definido</p>
            </div>
          </div>
          <button onClick={() => setAtivo(!ativo)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${ativo ? 'bg-blue-600' : 'bg-slate-300'}`}>
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${ativo ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        {ativo && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-blue-800">Horário da notificação:</span>
            <input type="time" value={hora} onChange={e => setHora(e.target.value)}
              className="h-8 rounded-[var(--radius-control)] border border-blue-200 bg-white px-3 text-[12px] font-bold text-blue-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60" />
            <span className="text-[10px] text-blue-600/70 font-semibold">O sistema mostrará uma notificação neste horário com o resumo diário.</span>
          </div>
        )}
    </div>
  );
}

export default memo(ConfiguracoesPage);
