import React, { useEffect, useState } from 'react';
import {
  Layout, Users, ChevronLeft, FileBarChart, BookUser, Settings,
  Plus, Star, FileText, RotateCw, Bell, Info, LogOut, AlertCircle, Wallet,
  Activity, X, TrendingUp, CheckCircle2, Clock,
} from 'lucide-react';
import { formatCve } from '../lib/billing';

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
  setMostrarRelatorioMensal: (v: boolean) => void;
  mostrarDailyReport: boolean;
  setMostrarDailyReport: (v: boolean) => void;
  listaStats?: {
    total: number;
    atrasados: number;
    recebido: number;
  };
  larguraListas?: number;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Início', icon: <Layout size={18} strokeWidth={2.6} /> },
  { id: 'gestao', label: 'Alunos', icon: <Users size={18} strokeWidth={2.6} /> },
];

const Header: React.FC<HeaderProps> = React.memo(({
  nomeAcademia,
  COMPANY_NAME,
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
  mostrarDailyReport,
  setMostrarDailyReport,
  listaStats,
  larguraListas = 1120,
}) => {
  const [dailyData, setDailyData] = useState<any>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

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
  return (
    <header className="nl-glass relative h-[56px] flex shrink-0 items-center justify-between gap-2 px-4 z-[100]">
      {/* Stats overlay (gestao only) */}
      {aba === 'gestao' && listaStats && (
        <div
          className="absolute top-1/2 hidden -translate-y-1/2 flex-col items-start gap-1 xl:flex"
          style={{ left: `max(260px, calc((100vw - ${larguraListas}px) / 2))` }}
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] nl-text-sub leading-none">
            <Users size={12} strokeWidth={2.6} className="text-[var(--color-primary)]" />
            {listaStats.total} alunos
          </span>
          <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] leading-none ${listaStats.atrasados > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-success)]'}`}>
            <AlertCircle size={12} strokeWidth={2.6} />
            {listaStats.atrasados} atraso
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-success)] leading-none">
            <Wallet size={12} strokeWidth={2.6} />
            {formatCve(listaStats.recebido)}
          </span>
        </div>
      )}

      {/* Left: Branding */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="w-7 h-7 rounded-[var(--radius-compact)] flex items-center justify-center overflow-hidden shrink-0" style={{ background: 'var(--color-primary-light)' }}>
          <img src={appLogo} alt="Logo" className="w-4 h-4 object-contain" />
        </div>
        <div className="flex flex-col min-w-0 leading-tight">
          <span className="text-[11px] font-bold nl-text uppercase truncate">{nomeAcademia}</span>
          <span className="text-[8px] font-semibold nl-text-muted uppercase tracking-[0.12em] truncate">{COMPANY_NAME}</span>
        </div>
      </div>

      {/* Center: Navigation */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <nav className="flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-secondary-lighter)] p-0.5">
          {NAV_ITEMS.map((nav) => (
            <button
              key={nav.id}
              onClick={() => setAba(nav.id)}
              className={`flex h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-5 text-[13px] font-semibold tracking-tight transition-all duration-150 ${
                aba === nav.id
                  ? 'bg-[var(--bg-surface)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="[&>svg]:w-[17px] [&>svg]:h-[17px]">
                {nav.icon}
              </span>
              <span>{nav.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Actions + Profile */}
      <div className="ml-auto flex items-center justify-end gap-2">
        {/* Secondary page indicator */}
        {(aba === 'relatorios_detalhado' || aba === 'configuracoes' || aba === 'contactos') && (
          <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-light)]">
            <button
              onClick={() => setAba('home')}
              className="flex items-center gap-1 text-[10px] font-semibold nl-text-muted hover:text-[var(--color-primary)] transition-colors"
              title="Voltar ao Painel"
            >
              <ChevronLeft size={12} />
            </button>
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-compact)] text-[10px] font-bold ${
              aba === 'relatorios_detalhado'
                ? 'bg-amber-50 text-amber-700'
                : aba === 'contactos'
                ? 'bg-violet-50 text-violet-700'
                : 'bg-[var(--color-secondary-lighter)] nl-text-sub'
            }`}>
              {aba === 'relatorios_detalhado' ? <FileBarChart size={10} /> : aba === 'contactos' ? <BookUser size={10} /> : <Settings size={10} />}
              {aba === 'relatorios_detalhado' ? 'Relatório' : aba === 'contactos' ? 'Contactos' : 'Ajustes'}
            </span>
          </div>
        )}

        {/* Gestao toolbar */}
        {aba === 'gestao' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAba('contactos')}
              className="nl-icon-btn"
              title="Contactos"
            >
              <BookUser size={15} strokeWidth={2.2} />
            </button>
            <button onClick={onMatricular} className="nl-btn nl-btn-primary nl-btn-sm">
              <Plus size={13} /> Matricular
            </button>
            {(sessionUser?.role === 'admin' || sessionUser?.role === 'root') && (
              <button
                onClick={() => setAba('relatorios_detalhado')}
                className={`nl-btn nl-btn-sm ${
                  relatorioMensalDisponivel
                    ? '!bg-[var(--color-success)] !text-white'
                    : 'nl-btn-secondary'
                }`}
                title="Relatórios administrativos"
              >
                {relatorioMensalDisponivel ? <Star size={12} className="fill-current" /> : <FileText size={12} />}
                Relatório
              </button>
            )}
          </div>
        )}

        {/* Utility buttons */}
        <div className="flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-[var(--border-light)] p-0.5">
          <button onClick={onRefreshApp} className="nl-icon-btn nl-icon-btn-sm" title="Atualizar">
            <RotateCw size={13} className={sincronizando ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setMostrarDailyReport(!mostrarDailyReport)} className="nl-icon-btn nl-icon-btn-sm relative" title="Resumo diário">
            <Activity size={13} />
          </button>
          <button onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)} className="nl-icon-btn nl-icon-btn-sm relative" title="Notificações">
            <Bell size={13} />
            {notificacoesNaoLidas > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[var(--color-error)] rounded-full" />
            )}
          </button>
        </div>

        {/* Daily Report Popup */}
        {mostrarDailyReport && (
          <>
            <div className="fixed inset-0 z-[200]" onClick={() => setMostrarDailyReport(false)} />
            <div className="absolute right-36 top-full mt-2 w-[380px] nl-modal p-0 z-[210] animate-slide-up overflow-hidden shadow-[var(--shadow-xl)]">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-200">Resumo Diário</p>
                  <p className="text-[14px] font-black text-white mt-0.5">{new Date().toLocaleDateString('pt-PT')}</p>
                </div>
                <button onClick={() => setMostrarDailyReport(false)} className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"><X size={13} /></button>
              </div>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {dailyLoading ? (
                  <div className="py-8 text-center text-[11px] font-bold text-slate-400">A carregar resumo...</div>
                ) : dailyData ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-[var(--radius-control)] bg-emerald-50 border border-emerald-100 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp size={12} className="text-emerald-600" />
                          <span className="text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700">Receita</span>
                        </div>
                        <p className="text-[16px] font-black text-emerald-700 tabular-nums">{formatCve(dailyData.pagamentosHoje.reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0))}</p>
                      </div>
                      <div className="rounded-[var(--radius-control)] bg-blue-50 border border-blue-100 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle2 size={12} className="text-blue-600" />
                          <span className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-700">Pagamentos</span>
                        </div>
                        <p className="text-[16px] font-black text-blue-700 tabular-nums">{dailyData.pagamentosHoje.length}</p>
                      </div>
                    </div>

                    {dailyData.pagamentosHoje.length > 0 && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 mb-1.5">Pagamentos de hoje</p>
                        <div className="space-y-1">
                          {dailyData.pagamentosHoje.slice(0, 4).map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between rounded-[var(--radius-control)] bg-emerald-50/60 px-3 py-1.5">
                              <span className="text-[11px] font-bold text-slate-700 truncate">{p.nome || p.aluno_id}</span>
                              <span className="text-[11px] font-black text-emerald-700 tabular-nums">{formatCve(p.valor)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-[var(--radius-control)] bg-slate-50 border border-slate-200 p-2">
                        <p className="text-[16px] font-black text-slate-700 tabular-nums">{dailyData.logsHoje.length}</p>
                        <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-slate-400 mt-0.5">Ações</p>
                      </div>
                      <div className="rounded-[var(--radius-control)] bg-blue-50 border border-blue-100 p-2">
                        <p className="text-[16px] font-black text-blue-700 tabular-nums">{dailyData.loginsHoje.length}</p>
                        <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-blue-500 mt-0.5">Acessos</p>
                      </div>
                      <div className="rounded-[var(--radius-control)] bg-amber-50 border border-amber-100 p-2">
                        <p className="text-[16px] font-black text-amber-700 tabular-nums">{dailyData.matriculasHoje.length}</p>
                        <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-amber-500 mt-0.5">Matrículas</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-[11px] font-bold text-slate-400">Erro ao carregar resumo.</div>
                )}
              </div>
              <div className="border-t border-[var(--border-light)] px-4 py-2.5 flex justify-between items-center bg-[#FAFBFC]">
                <span className="text-[9px] text-slate-400 font-semibold">Atualizado automaticamente</span>
                <button onClick={() => { setMostrarDailyReport(false); setAba('relatorios_detalhado'); }} className="inline-flex h-7 items-center gap-1 rounded-[var(--radius-control)] bg-blue-600 px-3 text-[9px] font-black uppercase tracking-[0.12em] text-white hover:bg-blue-700 transition-colors">
                  Ver mais <ChevronLeft size={11} className="rotate-180" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setMostrarUserMenu(!mostrarUserMenu)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[12px] border-2 border-[var(--bg-app)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] transition-all ${
              aba === 'relatorios_detalhado' ? 'ring-2 ring-amber-400' :
              aba === 'configuracoes' ? 'ring-2 ring-slate-400' :
              aba === 'contactos' ? 'ring-2 ring-violet-400' :
              'ring-1 ring-[var(--border)]'
            }`}
            style={{ background: 'var(--color-primary)' }}
            title={aba === 'relatorios_detalhado' ? 'Relatório activo' : aba === 'configuracoes' ? 'Ajustes activos' : aba === 'contactos' ? 'Contactos activos' : 'Menu'}
          >
            {(sessionUser?.name || 'U').charAt(0).toUpperCase()}
          </button>

          {mostrarUserMenu && (
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setMostrarUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-[220px] nl-modal py-1.5 z-[110] animate-slide-up">
                <div className="px-3.5 py-2 border-b border-[var(--border-light)] mb-1">
                  <p className="text-[12px] font-bold nl-text leading-tight">{sessionUser?.name}</p>
                  <p className="text-[9px] font-semibold nl-text-muted uppercase tracking-widest mt-0.5">{sessionUser?.role === 'admin' ? 'Administrador' : 'Operador'}</p>
                </div>

                <div className="px-1 space-y-0.5">
                  {sessionUser?.role === 'admin' && (
                    <>
                      <p className="px-2.5 pt-1 pb-0.5 text-[8px] font-bold uppercase tracking-[0.18em] nl-text-muted">Ferramentas</p>
                      <button
                        onClick={() => { setAba('relatorios_detalhado'); setMostrarUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-amber-50 text-[12px] font-semibold text-amber-700 transition-colors"
                      >
                        <FileBarChart size={14} className="text-amber-500 shrink-0" />
                        <span className="flex-1 text-left">Relatório</span>
                        <kbd className="nl-kbd ml-auto">⌘R</kbd>
                      </button>
                      <button
                        onClick={() => { setAba('configuracoes'); setMostrarUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-secondary-light)] text-[12px] font-semibold nl-text transition-colors"
                      >
                        <Settings size={14} className="nl-text-muted shrink-0" />
                        <span className="flex-1 text-left">Ajustes</span>
                        <kbd className="nl-kbd ml-auto">⌘,</kbd>
                      </button>
                      <button
                        onClick={() => { setAba('contactos'); setMostrarUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-violet-50 text-[12px] font-semibold text-violet-700 transition-colors"
                      >
                        <BookUser size={14} className="text-violet-500 shrink-0" />
                        <span className="flex-1 text-left">Contactos</span>
                        <kbd className="nl-kbd ml-auto">⌘J</kbd>
                      </button>
                      <div className="nl-divider my-1 mx-2" />
                    </>
                  )}

                  <button
                    onClick={() => { setMostrarSobreDoc(true); setMostrarUserMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-secondary-light)] text-[12px] font-medium nl-text transition-colors"
                  >
                    <Info size={14} className="nl-text-muted" /> Sobre
                  </button>

                  <div className="nl-divider my-1 mx-2" />

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-red-50 text-[12px] font-medium text-[var(--color-error)] transition-colors"
                  >
                    <LogOut size={14} /> Terminar Sessão
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
});

export default Header;
