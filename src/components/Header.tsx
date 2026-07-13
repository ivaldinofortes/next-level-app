import React, { useEffect, useRef, useState } from 'react';
import {
  Layout, Users, FileBarChart, BookUser, Settings,
  RotateCw, Bell, Info, LogOut, Wallet,
  Activity, X, TrendingUp, CheckCircle2, Sun, Moon, Sparkles, Camera,
  ChevronLeft, ChevronRight, Dumbbell, Download, Layers,
} from 'lucide-react';
import { formatCve } from '../lib/billing';
import {
  getUserAvatar,
  persistUserAvatars,
  setUserAvatar,
  userInitials,
  type UserAvatarMap,
} from '../utils/userAvatar';

type AppTheme = 'light' | 'dark' | 'claude' | 'hybrid';

interface HeaderProps {
  nomeAcademia: string;
  COMPANY_NAME: string;
  COMPANY_WEBSITE: string;
  appLogo: string;
  APP_ICON_PATH: string;
  aba: string;
  setAba: (aba: string) => void;
  sessionUser: { id?: number; name: string; email: string; role: string } | null;
  onLogout: () => void;
  notificacoesNaoLidas: number;
  mostrarNotificacoes: boolean;
  setMostrarNotificacoes: (v: boolean) => void;
  sincronizando: boolean;
  onRefreshApp: () => void;
  relatorioMensalDisponivel: string;
  mostrarUserMenu: boolean;
  setMostrarUserMenu: (v: boolean) => void;
  setMostrarSobreDoc: (v: boolean) => void;
  onMatricular: () => void;
  /** Acção principal contextual (ex.: Exportar em Relatórios) */
  onExportarRelatorio?: () => void;
  setMostrarRelatorioMensal: (v: boolean) => void;
  mostrarDailyReport: boolean;
  setMostrarDailyReport: (v: boolean) => void;
  appTheme?: AppTheme;
  onCycleTheme?: () => void;
  listaStats?: {
    total: number;
    atrasados: number;
    recebido: number;
  };
  larguraListas?: number;
  utilizadorAvatares?: UserAvatarMap;
  setUtilizadorAvatares?: React.Dispatch<React.SetStateAction<UserAvatarMap>>;
}

const THEME_META: Record<AppTheme, { label: string; icon: typeof Sun }> = {
  light: { label: 'Tema claro', icon: Sun },
  dark: { label: 'Tema escuro', icon: Moon },
  claude: { label: 'Tema Claude', icon: Sparkles },
  hybrid: { label: 'Tema híbrido', icon: Layers },
};

/** 3 abas principais — cada uma com cor própria */
const NAV_TABS = [
  {
    id: 'home',
    label: 'Início',
    icon: Layout,
    // azul GNOME
    active: 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-xs)]',
    idle: 'text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]',
    dot: 'bg-[var(--color-primary)]',
    roles: ['admin', 'root', 'operador', 'staff', 'user'] as string[],
  },
  {
    id: 'gestao',
    label: 'Alunos',
    icon: Users,
    // verde
    active: 'bg-[var(--color-success)] text-white shadow-[var(--shadow-xs)]',
    idle: 'text-[var(--color-success)] hover:bg-[color-mix(in_srgb,var(--color-success)_12%,var(--bg-surface))]',
    dot: 'bg-[var(--color-success)]',
    roles: ['admin', 'root', 'operador', 'staff', 'user'] as string[],
  },
  {
    id: 'relatorios_detalhado',
    label: 'Relatórios',
    icon: FileBarChart,
    // laranja GNOME
    active: 'bg-[#c64600] text-white shadow-[var(--shadow-xs)]',
    idle: 'text-[#c64600] hover:bg-[color-mix(in_srgb,#c64600_12%,var(--bg-surface))]',
    dot: 'bg-[#c64600]',
    roles: ['admin', 'root'] as string[],
  },
];

const Header: React.FC<HeaderProps> = React.memo(({
  nomeAcademia,
  appLogo,
  aba,
  setAba,
  sessionUser,
  onLogout,
  notificacoesNaoLidas,
  setMostrarNotificacoes,
  mostrarNotificacoes,
  sincronizando,
  onRefreshApp,
  relatorioMensalDisponivel,
  mostrarUserMenu,
  setMostrarUserMenu,
  setMostrarSobreDoc,
  onMatricular,
  onExportarRelatorio,
  mostrarDailyReport,
  setMostrarDailyReport,
  appTheme = 'light',
  onCycleTheme,
  utilizadorAvatares = {},
  setUtilizadorAvatares,
}) => {
  const [dailyData, setDailyData] = useState<any>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  /** Histórico tipo browser para ← → */
  const [navHistory, setNavHistory] = useState<string[]>([aba || 'home']);
  const [navIndex, setNavIndex] = useState(0);
  const navSkipRef = useRef(false);
  const role = sessionUser?.role || 'operador';
  const isAdmin = role === 'admin' || role === 'root';
  const themeMeta = THEME_META[appTheme] || THEME_META.light;
  const ThemeIcon = themeMeta.icon;
  const sessionAvatar = getUserAvatar(utilizadorAvatares, sessionUser);

  useEffect(() => {
    if (navSkipRef.current) {
      navSkipRef.current = false;
      return;
    }
    const current = navHistory[navIndex];
    if (aba && aba !== current) {
      setNavHistory((prev) => {
        const trimmed = prev.slice(0, navIndex + 1);
        trimmed.push(aba);
        const next = trimmed.slice(-40);
        setNavIndex(next.length - 1);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba]);

  const canGoBack = navIndex > 0;
  const canGoForward = navIndex < navHistory.length - 1;

  const goBack = () => {
    if (!canGoBack) return;
    const next = navIndex - 1;
    navSkipRef.current = true;
    setNavIndex(next);
    setAba(navHistory[next]);
  };

  const goForward = () => {
    if (!canGoForward) return;
    const next = navIndex + 1;
    navSkipRef.current = true;
    setNavIndex(next);
    setAba(navHistory[next]);
  };

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionUser || !setUtilizadorAvatares) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      setUtilizadorAvatares((prev) => {
        const next = setUserAvatar(prev, sessionUser, dataUrl);
        persistUserAvatars(next);
        return next;
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Relatórios só admin/root
  const visibleTabs = NAV_TABS.filter((t) => {
    if (t.id === 'relatorios_detalhado') return isAdmin;
    return true;
  });

  useEffect(() => {
    if (!mostrarDailyReport) return;
    let mounted = true;
    setDailyLoading(true);
    const load = async () => {
      try {
        const electron = (window as any).electron;
        if (!electron) return;
        const res = await electron.ipcRenderer.invoke('reports:daily-summary');
        if (mounted && res?.success) setDailyData(res);
      } finally {
        if (mounted) setDailyLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [mostrarDailyReport]);

  const activeTab = visibleTabs.find((t) => t.id === aba) || visibleTabs[0];

  return (
    <header className="nl-glass relative z-[100] flex h-14 shrink-0 items-center gap-3 px-4">
      {/* faixa de cor dinâmica da aba activa */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] opacity-90 transition-colors duration-300 ${
          activeTab?.id === 'gestao' || aba === 'contactos'
            ? 'bg-[var(--color-success)]'
            : activeTab?.id === 'relatorios_detalhado'
              ? 'bg-[#c64600]'
              : 'bg-[var(--color-primary)]'
        }`}
      />

      {/* ── Esquerda: marca + refresh + navegação browser ── */}
      <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-light)] shadow-[var(--shadow-xs)]"
          style={{ background: 'var(--color-primary-light)' }}
        >
          <img src={appLogo} alt="" className="h-5 w-5 object-contain" />
        </div>
        <div className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="max-w-[140px] truncate text-[13px] font-semibold nl-text">
            {nomeAcademia}
          </span>
          <span className="text-[10px] font-medium nl-text-muted">
            {activeTab?.label || 'Painel'}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefreshApp}
          className="nl-icon-btn ml-0.5"
          title="Atualizar"
          aria-label="Atualizar aplicação"
        >
          <RotateCw size={14} className={sincronizando ? 'animate-spin' : ''} />
        </button>

        <div className="ml-0.5 flex items-center gap-0.5 rounded-[var(--radius-control)] border border-[var(--chrome-border,var(--border))] bg-[var(--chrome-surface,var(--color-secondary-light))] p-0.5">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            className="nl-icon-btn nl-icon-btn-sm !h-7 !w-7 disabled:opacity-30"
            title="Voltar"
            aria-label="Navegação: voltar"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={goForward}
            disabled={!canGoForward}
            className="nl-icon-btn nl-icon-btn-sm !h-7 !w-7 disabled:opacity-30"
            title="Avançar"
            aria-label="Navegação: avançar"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Centro: 3 abas coloridas ── */}
      <nav
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-[var(--radius-control)] border border-[var(--chrome-border,var(--border))] bg-[var(--chrome-surface,var(--color-secondary-light))] p-1 shadow-[var(--shadow-xs)]"
        aria-label="Navegação principal"
      >
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = aba === tab.id || (tab.id === 'gestao' && (aba === 'contactos'));
          const softActive = tab.id === 'gestao' && aba === 'contactos';
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAba(tab.id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3.5 text-[13px] font-semibold transition-all duration-200 ${
                active && !softActive
                  ? tab.active
                  : softActive
                    ? 'bg-[color-mix(in_srgb,var(--color-success)_18%,var(--bg-surface))] text-[var(--color-success)]'
                    : tab.idle
              }`}
            >
              <Icon size={15} strokeWidth={2.2} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id === 'relatorios_detalhado' && relatorioMensalDisponivel && (
                <span
                  className={`h-1.5 w-1.5 animate-pulse rounded-full ${active && !softActive ? 'bg-white/90' : 'bg-[#c64600]'}`}
                  title={`Relatório de ${relatorioMensalDisponivel} pronto`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Direita: acções contextuais por página ── */}
      <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-2">
        {relatorioMensalDisponivel && aba !== 'relatorios_detalhado' && isAdmin && (
          <button
            type="button"
            onClick={() => setAba('relatorios_detalhado')}
            className="hidden items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,#c64600_35%,var(--border))] bg-[color-mix(in_srgb,#c64600_10%,var(--bg-surface))] px-2.5 py-1 text-[11px] font-semibold text-[#c64600] transition-colors hover:bg-[color-mix(in_srgb,#c64600_16%,var(--bg-surface))] lg:inline-flex"
            title={`Relatório de ${relatorioMensalDisponivel} disponível`}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c64600]" />
            Relatório pronto
          </button>
        )}

        {aba === 'gestao' && (
          <>
            <button type="button" onClick={() => setAba('contactos')} className="nl-icon-btn" title="Contactos">
              <BookUser size={15} />
            </button>
            <button
              type="button"
              onClick={onMatricular}
              className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-all hover:brightness-110 hover:shadow-[0_6px_18px_rgba(37,99,235,0.42)] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 48%, #1d4ed8 100%)',
              }}
              title="Matricular aluno"
            >
              <Dumbbell size={15} strokeWidth={2.2} />
              <span className="hidden md:inline">Matricular</span>
            </button>
          </>
        )}
        {aba === 'contactos' && (
          <button type="button" onClick={() => setAba('gestao')} className="nl-btn nl-btn-secondary nl-btn-sm !h-9">
            <Users size={14} /> Alunos
          </button>
        )}
        {aba === 'home' && (
          <button
            type="button"
            onClick={onMatricular}
            className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-all hover:brightness-110 hover:shadow-[0_6px_18px_rgba(37,99,235,0.42)] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 48%, #1d4ed8 100%)',
            }}
            title="Matricular aluno"
          >
            <Dumbbell size={15} strokeWidth={2.2} />
            <span className="hidden md:inline">Matricular</span>
          </button>
        )}
        {aba === 'relatorios_detalhado' && isAdmin && onExportarRelatorio && (
          <button
            type="button"
            onClick={onExportarRelatorio}
            className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #e36b2c 0%, #c64600 55%, #a33a00 100%)',
              boxShadow: '0 4px 14px rgba(198, 70, 0, 0.35)',
            }}
            title="Gerar / exportar relatório"
          >
            <Download size={15} strokeWidth={2.2} />
            <span className="hidden md:inline">Exportar</span>
          </button>
        )}

        <div className="mx-0.5 h-6 w-px bg-[var(--chrome-border,var(--border))]" />

        {/* Tema: claro → escuro → claude → híbrido */}
        <button
          type="button"
          onClick={onCycleTheme}
          className="nl-icon-btn relative"
          title={`${themeMeta.label} — clique para mudar`}
          aria-label={`Tema actual: ${themeMeta.label}. Clique para alternar.`}
        >
          <ThemeIcon size={15} className="transition-transform duration-300" />
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setMostrarDailyReport(!mostrarDailyReport)}
            className="nl-icon-btn relative"
            title="Resumo diário"
          >
            <Activity size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
          className="nl-icon-btn relative"
          title="Notificações"
        >
          <Bell size={14} />
          {notificacoesNaoLidas > 0 && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-error)]" />
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMostrarUserMenu(!mostrarUserMenu)}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-[13px] font-semibold text-white ring-2 ring-[var(--border-light)] transition-transform hover:scale-105"
            style={{ background: sessionAvatar ? 'transparent' : 'var(--color-primary)' }}
            title={sessionUser?.name || 'Menu'}
          >
            {sessionAvatar
              ? <img src={sessionAvatar} alt="" className="h-full w-full object-cover" />
              : userInitials(sessionUser?.name)}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />

          {mostrarUserMenu && (
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setMostrarUserMenu(false)} />
              <div className="absolute right-0 z-[110] mt-2 w-[240px] animate-slide-up nl-modal py-1.5">
                <div className="mb-1 flex items-center gap-2.5 border-b border-[var(--border-light)] px-3.5 py-2.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[12px] font-bold text-white"
                    style={{ background: sessionAvatar ? 'transparent' : 'var(--color-primary)' }}
                  >
                    {sessionAvatar
                      ? <img src={sessionAvatar} alt="" className="h-full w-full object-cover" />
                      : userInitials(sessionUser?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold leading-tight nl-text">{sessionUser?.name}</p>
                    <p className="mt-0.5 text-[11px] font-medium nl-text-muted">
                      {isAdmin ? 'Administrador' : 'Operador'}
                    </p>
                  </div>
                </div>
                <div className="space-y-0.5 px-1">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] font-medium nl-text transition-colors hover:bg-[var(--color-secondary-light)]"
                  >
                    <Camera size={14} className="nl-text-muted" /> Personalizar foto
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => { setAba('configuracoes'); setMostrarUserMenu(false); }}
                      className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] font-medium nl-text transition-colors hover:bg-[var(--color-secondary-light)]"
                    >
                      <Settings size={14} className="nl-text-muted" /> Ajustes
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setAba('contactos'); setMostrarUserMenu(false); }}
                    className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] font-medium nl-text transition-colors hover:bg-[var(--color-secondary-light)]"
                  >
                    <BookUser size={14} className="nl-text-muted" /> Contactos
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMostrarSobreDoc(true); setMostrarUserMenu(false); }}
                    className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] font-medium nl-text transition-colors hover:bg-[var(--color-secondary-light)]"
                  >
                    <Info size={14} className="nl-text-muted" /> Sobre
                  </button>
                  <div className="nl-divider my-1 mx-2" />
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-error)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-error)_10%,var(--bg-surface))]"
                  >
                    <LogOut size={14} /> Terminar sessão
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Daily report popover */}
        {mostrarDailyReport && (
          <>
            <div className="fixed inset-0 z-[200]" onClick={() => setMostrarDailyReport(false)} />
            <div className="absolute right-3 top-full z-[210] mt-2 w-[360px] overflow-hidden animate-slide-up nl-modal p-0">
              <div className="nl-modal-header !py-2.5">
                <div>
                  <p className="text-[11px] font-medium nl-text-muted">Resumo diário</p>
                  <p className="text-[14px] font-semibold nl-text">{new Date().toLocaleDateString('pt-PT')}</p>
                </div>
                <button type="button" onClick={() => setMostrarDailyReport(false)} className="nl-icon-btn nl-icon-btn-sm" aria-label="Fechar">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-[360px] space-y-3 overflow-y-auto p-3 custom-scrollbar">
                {dailyLoading ? (
                  <p className="py-6 text-center text-[12px] nl-text-muted">A carregar…</p>
                ) : dailyData ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--color-secondary-light)] p-2.5">
                        <div className="mb-1 flex items-center gap-1 text-[var(--color-success)]">
                          <TrendingUp size={12} />
                          <span className="text-[11px] font-medium">Receita</span>
                        </div>
                        <p className="text-[15px] font-semibold tabular-nums text-[var(--color-success)]">
                          {formatCve(dailyData.pagamentosHoje.reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0))}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--color-primary-light)] p-2.5">
                        <div className="mb-1 flex items-center gap-1 text-[var(--color-primary)]">
                          <CheckCircle2 size={12} />
                          <span className="text-[11px] font-medium">Pagamentos</span>
                        </div>
                        <p className="text-[15px] font-semibold tabular-nums text-[var(--color-primary)]">
                          {dailyData.pagamentosHoje.length}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="rounded-[var(--radius-compact)] border border-[var(--border)] p-2">
                        <p className="text-[15px] font-semibold tabular-nums">{dailyData.logsHoje.length}</p>
                        <p className="text-[10px] nl-text-muted">Ações</p>
                      </div>
                      <div className="rounded-[var(--radius-compact)] border border-[var(--border)] p-2">
                        <p className="text-[15px] font-semibold tabular-nums">{dailyData.loginsHoje.length}</p>
                        <p className="text-[10px] nl-text-muted">Acessos</p>
                      </div>
                      <div className="rounded-[var(--radius-compact)] border border-[var(--border)] p-2">
                        <p className="text-[15px] font-semibold tabular-nums">{dailyData.matriculasHoje.length}</p>
                        <p className="text-[10px] nl-text-muted">Matrículas</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="py-6 text-center text-[12px] nl-text-muted">Erro ao carregar.</p>
                )}
              </div>
              {isAdmin && (
                <div className="nl-modal-footer !justify-end">
                  <button
                    type="button"
                    onClick={() => { setMostrarDailyReport(false); setAba('relatorios_detalhado'); }}
                    className="nl-btn nl-btn-primary nl-btn-sm"
                  >
                    <Wallet size={13} /> Abrir relatórios
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
});

export default Header;
