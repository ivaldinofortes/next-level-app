import { memo } from 'react';
import {
  Landmark, Users, Palette, Bell, Shield, Info, Sparkles,
  Plus, CheckCircle2, Zap, ChevronRight, CreditCard, UserPlus,
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
  appTheme: 'light' | 'dark' | 'claude';
  setAppTheme: (v: 'light' | 'dark' | 'claude') => void;
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
  setQuickAccessUsers: (v: any) => void;
  loginSlideshowUsers: any[];
  setLoginSlideshowUsers: (v: any) => void;
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
  setNotificacoes: (v: any) => void;
  diretorioBackup: string;
  setDiretorioBackup: (v: string) => void;
  resetSeguroForm: { password: string; confirmation: string };
  setResetSeguroForm: (v: any) => void;
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
  return (
    <div className="flex-1 overflow-hidden flex bg-[var(--bg-app)] animate-fade-in custom-scrollbar overflow-y-auto p-8">
      <div className="mx-auto flex w-full h-fit min-h-[600px] border border-[var(--border)] shadow-sm rounded-[4px]" style={{ maxWidth: `${larguraListas}px` }}>
        {/* Sidebar de Configurações */}
        <div className="w-[240px] border-r border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 p-6 flex flex-col gap-1 shrink-0">
          <div className="mb-4 px-2">
            <p className="text-[10px] font-black nl-text-muted uppercase tracking-[0.2em] mb-1">Painel de Controlo</p>
            <h2 className="text-[16px] font-black nl-text tracking-tight uppercase">Ajustes</h2>
          </div>

          {([
            { id: 'geral',          label: 'Academia',      icon: <Landmark size={16} />,    color: 'text-blue-600' },
            { id: 'utilizadores',   label: 'Utilizadores',  icon: <Users size={16} />,       color: 'text-emerald-600' },
            { id: 'tema',           label: 'Aparência',     icon: <Palette size={16} />,     color: 'text-purple-600' },
            { id: 'notificacoes',   label: 'Notificações',  icon: <Bell size={16} />,        color: 'text-rose-600' },
            { id: 'operacao',       label: 'Operação',      icon: <Shield size={16} />,      color: 'text-orange-600' },
            { id: 'ajuda',          label: 'Suporte',       icon: <Info size={16} />,        color: 'text-sky-600' },
            { id: 'sobre',          label: 'Licença',       icon: <Sparkles size={16} />,    color: 'text-amber-600' },
          ] as const).map(item => (
            <button
              key={item.id}
              onClick={() => setConfigAba(item.id as any)}
              className={`w-full text-left px-4 py-3 rounded-[3px] flex items-center gap-3 transition-all ${
                configAba === item.id
                  ? 'bg-[var(--bg-surface)] shadow-sm ring-1 ring-black/5 text-[var(--color-primary)] font-bold'
                  : 'nl-text-muted hover:bg-[var(--bg-surface)]/60 hover:text-[var(--text-primary)]'
              }`}
            >
              <div className={`shrink-0 ${configAba === item.id ? '' : item.color}`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] leading-tight">{item.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Conteúdo Dinâmico */}
        <div className="flex-1 bg-[var(--bg-surface)] p-10 lg:p-14 overflow-y-auto custom-scrollbar">
          {configAba === 'geral' && (
            <div className="animate-slide-up space-y-10">
              <div>
                <h3 className="text-[28px] font-black nl-text tracking-tighter uppercase">Instituição</h3>
                <p className="nl-text-muted font-medium mt-1">Gira as informações públicas e de contacto da sua academia.</p>
              </div>

              {/* Logo da academia */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider block">Logótipo da Academia</label>
                <div className="flex items-center gap-6 p-5 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)]">
                  <div className="w-20 h-20 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    <img src={appLogo || APP_ICON_PATH} className="w-14 h-14 object-contain" alt="Logo" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[13px] font-semibold nl-text">Imagem usada no sistema, PDFs e cabeçalhos</p>
                    <p className="text-[11px] nl-text-muted">Formatos: PNG, JPEG, SVG · Recomendado: fundo transparente</p>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="file"
                        id="logo-upload-geral"
                        className="hidden"
                        accept="image/svg+xml,image/png,image/jpeg"
                        onChange={(e) => {
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
                        }}
                      />
                      <button onClick={() => document.getElementById('logo-upload-geral')?.click()} className="nl-btn nl-btn-secondary h-9 px-4 text-[12px]">
                        Alterar Logo
                      </button>
                      <button onClick={() => { setAppLogo(APP_ICON_PATH); localStorage.removeItem('nl_app_logo'); guardarConfiguracao('app_logo', ''); }} className="text-[11px] font-semibold nl-text-muted hover:text-red-500 transition-colors">
                        Repor padrão
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Nome Comercial</label>
                  <input type="text" value={nomeAcademia} onChange={(e) => setNomeAcademia(e.target.value)} className="nl-input w-full h-12 px-4" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Telemóvel Suporte</label>
                    <input type="text" value={telefoneAcademia} onChange={(e) => setTelefoneAcademia(e.target.value)} className="nl-input w-full h-12 px-4" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Email de Contacto</label>
                    <input type="email" value={emailAcademia} onChange={(e) => setEmailAcademia(e.target.value)} className="nl-input w-full h-12 px-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Localização / Morada</label>
                  <input type="text" value={moradaAcademia} onChange={(e) => setMoradaAcademia(e.target.value)} className="nl-input w-full h-12 px-4" />
                </div>
              </div>

              {/* ── Segurança de Acesso ── */}
              <div className="space-y-4 pt-8 border-t border-[var(--border)]">
                <div>
                  <h3 className="text-[14px] font-bold nl-text">Segurança & Autenticação</h3>
                  <p className="text-[12px] nl-text-muted mt-0.5">Defina as políticas de privacidade e persistência de sessão para o ecrã de login.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Lembrar utilizadores */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${lembrarUtilizadores ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`}
                         onClick={() => setLembrarUtilizadores(!lembrarUtilizadores)}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${lembrarUtilizadores ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-[12px] nl-text-muted">Lembrar utilizadores anteriores (mostra lista no email do login)</span>
                  </label>

                  {/* Guardar sessão */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${permitirGuardarSessao ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`}
                         onClick={() => setPermitirGuardarSessao(!permitirGuardarSessao)}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${permitirGuardarSessao ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-[12px] nl-text-muted">Permitir guardar sessão (exibe a caixa "Manter sessão iniciada")</span>
                  </label>

                  {/* Exigir Senha para Operacionais */}
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${requireOperationalPassword ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`}
                         onClick={() => setRequireOperationalPassword(!requireOperationalPassword)}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${requireOperationalPassword ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-[12px] nl-text-muted">Exigir palavra-passe para utilizadores operacionais</span>
                  </label>
                </div>
              </div>

              {/* ── Slideshow de Login ── */}
              <div className="space-y-4 pt-8 border-t border-[var(--border)]">
                <div>
                  <h3 className="text-[14px] font-bold nl-text">Slideshow na Tela de Login</h3>
                  <p className="text-[12px] nl-text-muted mt-0.5">Até 5 imagens que passam automaticamente no painel direito do login. Quando o app estiver inativo, entra em modo apresentação.</p>
                </div>

                {/* Imagens do slideshow */}
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const img = slideshowImages[i];
                    return (
                      <div key={i} className="relative aspect-video rounded-[5px] overflow-hidden border border-[var(--border)] bg-[var(--color-secondary-lighter)] group">
                        {img ? (
                          <>
                            <img src={img} className="w-full h-full object-cover" alt={`Slide ${i + 1}`} />
                            <button
                              onClick={() => {
                                const next = slideshowImages.filter((_, idx) => idx !== i);
                                setSlideshowImages(next);
                                localStorage.setItem('nl_slideshow_images', JSON.stringify(next));
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >×</button>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer nl-text-muted opacity-60 hover:opacity-100 hover:bg-[var(--color-secondary-lighter)] transition-colors gap-1">
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

                <div className="flex items-center gap-6">
                  {/* Timer */}
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider whitespace-nowrap">Intervalo (seg)</label>
                    <input type="number" min={3} max={30} value={slideshowTimer}
                      onChange={e => { const v = Number(e.target.value); setSlideshowTimer(v); localStorage.setItem('nl_slideshow_timer', String(v)); }}
                      className="nl-input w-16 h-8 text-center text-[13px]" />
                  </div>
                  {/* Texto overlay */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${slideshowTextEnabled ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`}
                         onClick={() => { const v = !slideshowTextEnabled; setSlideshowTextEnabled(v); localStorage.setItem('nl_slideshow_text', v ? '1' : '0'); }}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${slideshowTextEnabled ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-[12px] nl-text-muted">Mostrar texto sobre as imagens</span>
                  </label>
                  {/* Limpar tudo */}
                  {slideshowImages.length > 0 && (
                    <button onClick={() => { setSlideshowImages([]); localStorage.removeItem('nl_slideshow_images'); }}
                      className="text-[11px] font-bold text-red-500 hover:underline">
                      Limpar Slideshow
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t flex justify-end">
                <button onClick={salvarDefinicoesGerais} className="nl-btn nl-btn-primary px-10 h-11 font-bold rounded-[3px]">Guardar Alterações</button>
              </div>
            </div>
          )}

          {configAba === 'tema' && (
            <div className="animate-slide-up space-y-10">
              <div>
                <h3 className="text-[28px] font-black nl-text tracking-tighter uppercase">Aparência & Branding</h3>
                <p className="nl-text-muted font-medium mt-1">Personalize o tema e a identidade visual do sistema NEXTLevel.</p>
              </div>

              <div className="space-y-8">

                {/* ── Selector de Tema ── */}
                <div className="space-y-4">
                  <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider block">Tema da Interface</label>
                  <div className="grid grid-cols-3 gap-4">
                    {([
                      {
                        id: 'light' as const,
                        label: 'Claro',
                        desc: 'Padrão profissional',
                        preview: { bg: '#F4F5F7', surface: '#FFFFFF', header: '#FFFFFF', accent: '#0065FF', text: '#172B4D', border: '#DFE1E6' },
                      },
                      {
                        id: 'dark' as const,
                        label: 'Escuro',
                        desc: 'Conforto nocturno',
                        preview: { bg: '#161A1D', surface: '#22272B', header: '#1D2125', accent: '#579DFF', text: '#F1F2F4', border: '#3D474F' },
                      },
                      {
                        id: 'claude' as const,
                        label: 'Claude',
                        desc: 'Quente & elegante',
                        preview: { bg: '#EDE7DF', surface: '#FAF7F3', header: '#F2EDE6', accent: '#CF7C5A', text: '#1E1612', border: '#DDD4C8' },
                      },
                    ] as const).map((tema) => {
                      const active = appTheme === tema.id;
                      return (
                        <button
                          key={tema.id}
                          onClick={() => { setAppTheme(tema.id); localStorage.setItem('nl_app_theme', tema.id); }}
                          className={`relative flex flex-col rounded-[8px] overflow-hidden border-2 transition-all text-left ${active ? 'border-[var(--color-primary)] shadow-[0_0_0_3px_var(--shadow-primary)]' : 'border-[var(--border)] hover:border-[var(--color-primary)]/40'}`}
                        >
                          {/* Mini preview */}
                          <div className="h-[80px] w-full relative overflow-hidden" style={{ background: tema.preview.bg }}>
                            {/* Mini header */}
                            <div className="absolute top-0 left-0 right-0 h-5 flex items-center px-2 gap-1.5" style={{ background: tema.preview.header, borderBottom: `1px solid ${tema.preview.border}` }}>
                              <div className="w-8 h-1.5 rounded-full" style={{ background: tema.preview.accent }} />
                              <div className="flex gap-1 ml-auto">
                                {[0,1,2].map(i => <div key={i} className="h-1.5 rounded-full" style={{ width: i === 0 ? 14 : i === 1 ? 10 : 10, background: tema.preview.border }} />)}
                              </div>
                            </div>
                            {/* Mini content */}
                            <div className="absolute top-6 left-2 right-2 bottom-2 rounded-[3px] p-2 flex flex-col gap-1" style={{ background: tema.preview.surface, border: `1px solid ${tema.preview.border}` }}>
                              <div className="h-1.5 rounded-full w-3/4" style={{ background: tema.preview.text, opacity: 0.7 }} />
                              <div className="h-1 rounded-full w-1/2" style={{ background: tema.preview.border }} />
                              <div className="h-4 rounded-[2px] w-16 mt-auto" style={{ background: tema.preview.accent }} />
                            </div>
                          </div>
                          {/* Label */}
                          <div className="px-3 py-2.5 bg-[var(--bg-surface)] border-t border-[var(--border)]">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[12px] font-bold nl-text">{tema.label}</p>
                                <p className="text-[10px] nl-text-muted">{tema.desc}</p>
                              </div>
                              {active && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]">
                                  <CheckCircle2 size={12} className="text-white" />
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] nl-text-muted">O tema aplica-se imediatamente em todo o sistema sem necessidade de reiniciar.</p>
                </div>

                <div className="border-t border-[var(--border)]" />

                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider block">Logotipo da Academia</label>
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
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider block">Banner de Login (50%)</label>
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

                <div className="p-5 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-[6px]">
                  <p className="text-[12px] font-bold nl-text mb-0.5">Dica de Design</p>
                  <p className="text-[11px] nl-text-muted leading-relaxed">Para o banner de login, recomenda-se imagens horizontais Full HD para garantir impacto visual premium na tela de entrada.</p>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                  <button onClick={salvarAparencia} className="nl-btn nl-btn-primary px-10 h-11 font-bold rounded-[3px]">Guardar Alterações</button>
                </div>
              </div>
            </div>
          )}

          {configAba === 'utilizadores' && (
            <div className="animate-slide-up space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[28px] font-black nl-text tracking-tighter uppercase">Utilizadores</h3>
                  <p className="nl-text-muted font-medium mt-1">{listaUtilizadores.length} conta(s) · clique para editar ou ver actividade</p>
                </div>
                <button onClick={() => setMostrarFormNovoUtilizador(true)} className="nl-btn nl-btn-primary px-6 h-11 flex items-center gap-2">
                  <Plus size={16} /> Novo Utilizador
                </button>
              </div>

              <div className="border border-[var(--border)] rounded-[6px] overflow-hidden bg-[var(--bg-surface)] shadow-sm divide-y divide-[var(--border-light)]">
                {listaUtilizadores.length === 0 && (
                  <p className="px-6 py-8 text-center text-[13px] nl-text-muted">Nenhum utilizador registado.</p>
                )}
                {listaUtilizadores.map(user => {
                  const avatar = utilizadorAvatares[String(user.id)];
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
                            : user.name.slice(0, 2).toUpperCase()}
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
            <div className="animate-slide-up space-y-10">
              <div>
                <h3 className="text-[28px] font-black nl-text tracking-tighter uppercase">Notificações</h3>
                <p className="nl-text-muted font-medium mt-1">Controle quais alertas e avisos recebe no sistema.</p>
              </div>

              {/* Notificações Desktop */}
              <div className="space-y-4">
                <p className="text-[11px] font-bold nl-text-muted uppercase tracking-wider border-b border-[var(--border-light)] pb-2">Sistema</p>
                <div className="space-y-3">
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
              </div>

              {/* Categorias de notificação */}
              <div className="space-y-4">
                <p className="text-[11px] font-bold nl-text-muted uppercase tracking-wider border-b border-[var(--border-light)] pb-2">Categorias</p>
                <div className="space-y-3">
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
              </div>

              {/* Relatório mensal disponível */}
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

              {/* Histórico de notificações */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-2">
                  <p className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Histórico</p>
                  {notificacoes.length > 0 && (
                    <button type="button" onClick={() => setNotificacoes([])} className="text-[11px] text-red-500 font-semibold hover:underline">Limpar tudo</button>
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
              </div>

              <div className="pt-6 border-t flex justify-end">
                <button onClick={salvarPreferenciasNotificacoes} className="nl-btn nl-btn-primary px-10 h-11 font-bold rounded-[3px]">Guardar Preferências</button>
              </div>
            </div>
          )}

          {configAba === 'operacao' && (
            <div className=" animate-slide-up space-y-10">
              <div>
                <h3 className="text-[28px] font-black nl-text tracking-tighter uppercase">Operação & Segurança</h3>
                <p className="nl-text-muted font-medium mt-1">Ferramentas de manutenção e cópias de segurança.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="p-8 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)] flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-[var(--bg-surface)] rounded-[6px] shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                        <Archive size={24} />
                      </div>
                      <div>
                        <p className="text-[16px] font-black nl-text">Backup Integral (ZIP)</p>
                        <p className="text-[12px] nl-text-muted">Exportar base de dados e ficheiros locais.</p>
                      </div>
                    </div>
                    <button onClick={gerarBackup} className="nl-btn nl-btn-primary px-8 h-12 shadow-blue-500/10 whitespace-nowrap">Exportar Agora</button>
                  </div>

                  <div className="flex items-center gap-4 bg-[var(--bg-surface)] p-4 rounded-md border border-[var(--border)] mt-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest nl-text-muted mb-1">Pasta de Backups (Opcional)</p>
                      <p className="text-[13px] font-medium nl-text truncate" title={diretorioBackup || 'Guardar e escolher na hora'}>
                        {diretorioBackup || 'O sistema perguntará onde guardar cada vez'}
                      </p>
                    </div>
                    <button onClick={selecionarDiretorioBackup} className="px-4 py-2 text-[11px] font-black uppercase tracking-widest nl-text-muted bg-[var(--color-secondary-lighter)] border border-[var(--border)] hover:bg-[var(--color-secondary-lighter)]/80 rounded-md transition-colors whitespace-nowrap">
                      Escolher Pasta
                    </button>
                    {diretorioBackup && (
                      <button onClick={async () => {
                        const electron = (window as any).electron || null;
                        setDiretorioBackup('');
                        await electron?.ipcRenderer.invoke('update-configuracao', 'diretorio_backup', '');
                      }} className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap">
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-8 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)] flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-[var(--bg-surface)] rounded-[6px] shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
                        <FileSpreadsheet size={24} />
                      </div>
                      <div>
                        <p className="text-[16px] font-black nl-text">Importação de Dados</p>
                        <p className="text-[12px] nl-text-muted">Importar alunos a partir de Excel com validação e prevenção de duplicados.</p>
                      </div>
                    </div>
                    <button onClick={() => setMostrarImportar(true)} className="nl-btn nl-btn-primary px-8 h-12 whitespace-nowrap">
                      Importar Excel
                    </button>
                  </div>
                  <div className="bg-[var(--bg-surface)] p-4 rounded-md border border-[var(--border)]">
                    <p className="text-[11px] nl-text-muted leading-relaxed">
                      Use esta opção apenas em operações de manutenção ou migração. Depois de importar, execute o gestor de duplicados para rever possíveis repetições.
                    </p>
                  </div>
                </div>

                <div className="p-8 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)] flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-[var(--bg-surface)] rounded-[6px] shadow-sm flex items-center justify-center text-amber-600 shrink-0">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <p className="text-[16px] font-black nl-text">Gestor de Duplicados</p>
                        <p className="text-[12px] nl-text-muted">Ver alunos repetidos por nome ou telefone e mover duplicados para a lixeira.</p>
                      </div>
                    </div>
                    <button onClick={buscarDuplicados} disabled={carregandoDuplicados} className="nl-btn nl-btn-secondary px-8 h-12 whitespace-nowrap">
                      {carregandoDuplicados ? 'A verificar...' : 'Verificar Duplicados'}
                    </button>
                  </div>
                  <div className="bg-[var(--bg-surface)] p-4 rounded-md border border-[var(--border)]">
                    <p className="text-[11px] nl-text-muted leading-relaxed">
                      Recomendado após importações em massa. A remoção é segura: o registo é enviado para a lixeira e pode ser auditado.
                    </p>
                  </div>
                </div>

                <div className="p-8 rounded-[6px] bg-red-50 border border-red-200 flex flex-col gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white rounded-[6px] shadow-sm flex items-center justify-center text-red-600 shrink-0">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-[16px] font-black text-red-900">Zona de Risco: Reset Operacional</p>
                      <p className="text-[12px] text-red-700">Remove alunos, pagamentos e notas. Mantém utilizadores, licença e configurações.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="password"
                      value={resetSeguroForm.password}
                      onChange={(e) => setResetSeguroForm((form: any) => ({ ...form, password: e.target.value }))}
                      placeholder="Senha do administrador"
                      className="nl-input h-11 md:col-span-1"
                    />
                    <input
                      type="text"
                      value={resetSeguroForm.confirmation}
                      onChange={(e) => setResetSeguroForm((form: any) => ({ ...form, confirmation: e.target.value }))}
                      placeholder="Escreva RESETAR"
                      className="nl-input h-11 md:col-span-1"
                    />
                    <button
                      onClick={() => abrirConfirmacao({
                        title: 'Resetar dados operacionais',
                        message: 'Esta ação remove alunos, pagamentos e notas da base de dados. Utilizadores e licença serão mantidos. Confirmas?',
                        confirmLabel: 'Resetar Dados',
                        tone: 'danger',
                        onConfirm: resetarBancoDeDados,
                      })}
                      disabled={resetSeguroLoading || sessionUser?.role !== 'admin'}
                      className="nl-btn h-11 px-6 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetSeguroLoading ? 'A resetar...' : 'Resetar Dados'}
                    </button>
                  </div>
                  {sessionUser?.role !== 'admin' && (
                    <p className="text-[11px] font-semibold text-red-700">Apenas administradores podem executar esta operação.</p>
                  )}
                </div>

                <div className="p-8 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)] flex items-center justify-between opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-[var(--bg-surface)] rounded-[6px] shadow-sm flex items-center justify-center nl-text-muted">
                      <Database size={24} />
                    </div>
                    <div>
                      <p className="text-[16px] font-black nl-text">Limpeza de Cache</p>
                      <p className="text-[12px] nl-text-muted">Otimizar base de dados interna.</p>
                    </div>
                  </div>
                  <button className="nl-btn nl-btn-secondary px-8 h-12" disabled>Otimizar</button>
                </div>
              </div>
            </div>
          )}

          {configAba === 'ajuda' && (
            <div className="animate-slide-up space-y-12">
              <div className="text-center space-y-5">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto text-white shadow-2xl relative group transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <HelpCircle size={48} className="relative z-10" />
                </div>
                <div>
                  <h3 className="text-[36px] font-black nl-text tracking-tighter uppercase leading-none">Centro de Ajuda</h3>
                  <p className="nl-text-muted font-medium max-w-sm mx-auto mt-4 leading-relaxed">Assistência técnica dedicada e esclarecimento de dúvidas sobre o ecossistema <span className="font-black nl-text">NEXTLevel</span>.</p>
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
            <div className="animate-slide-up">
              <div className="mx-auto max-w-[640px] bg-white py-14 px-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

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
                  <p className="text-[11px] text-slate-300">NEXTLevel · versão 1.0 Beta</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ConfiguracoesPage);
