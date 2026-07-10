import React from 'react';
import {
  Layout, Users, ChevronLeft, FileBarChart, BookUser, Settings,
  Plus, Star, FileText, RotateCw, Bell, Info, LogOut, AlertCircle, Wallet,
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
  listaStats?: {
    total: number;
    atrasados: number;
    recebido: number;
  };
  larguraListas?: number;
}

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
  listaStats,
  larguraListas = 1120,
}) => {
  return (
    <header className="relative h-[68px] flex shrink-0 items-center justify-between gap-4 border-b border-[#D7DCE3] bg-[#F5F6F8] px-5 shadow-[0_10px_26px_rgba(15,23,42,0.10),0_1px_0_rgba(255,255,255,0.75)_inset] z-[100]">
      {aba === 'gestao' && listaStats && (
        <div
          className="absolute top-1/2 hidden -translate-y-1/2 flex-col items-start gap-1 xl:flex"
          style={{ left: `max(280px, calc((100vw - ${larguraListas}px) / 2))` }}
        >
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-slate-700 leading-none">
            <Users size={14} strokeWidth={2.8} className="text-blue-600" />
            {listaStats.total} alunos
          </span>
          <span className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.08em] leading-none ${listaStats.atrasados > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            <AlertCircle size={14} strokeWidth={2.8} />
            {listaStats.atrasados} atraso
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-700 leading-none">
            <Wallet size={14} strokeWidth={2.8} />
            {formatCve(listaStats.recebido)}
          </span>
        </div>
      )}
      {/* Left: Branding */}
      <div className="relative z-[2] flex min-w-0 items-center gap-3">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm" style={{ background: 'var(--color-primary-light)', border: '1px solid var(--border)' }}>
          <img src={appLogo} alt="Logo" className="w-4.5 h-4.5 object-contain" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] font-black tracking-tight nl-text uppercase leading-tight truncate">{nomeAcademia}</span>
          <span className="text-[9px] font-bold nl-text-muted uppercase tracking-[0.12em] opacity-55 truncate">{COMPANY_NAME}</span>
        </div>
      </div>

      {/* Center: Navigation */}
      <div className="absolute left-1/2 top-1/2 z-[4] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <nav className="flex items-center gap-1.5 rounded-[12px] border border-[#D7DDE7] bg-[#E9EDF3] p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06),0_1px_0_rgba(255,255,255,0.7)]">
          {[
            { id: 'home', label: 'Início', icon: <Layout size={18} strokeWidth={2.9} /> },
            { id: 'gestao', label: 'Alunos', icon: <Users size={18} strokeWidth={2.9} /> },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => setAba(nav.id)}
              className={`flex h-11 min-w-[150px] items-center justify-center gap-3 rounded-[var(--radius-surface)] px-7 text-[16px] font-black tracking-tight transition-all duration-150 ${
                aba === nav.id
                  ? 'border border-white bg-white text-[var(--color-primary)] shadow-[0_8px_20px_rgba(15,23,42,0.10)]'
                  : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
              }`}
            >
              <span className={`${aba === nav.id ? 'text-[var(--color-primary)]' : 'text-slate-500'} [&>svg]:h-[20px] [&>svg]:w-[20px]`}>
                {nav.icon}
              </span>
              <span>{nav.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Context actions + Profile */}
      <div className="relative z-[2] ml-auto flex min-w-0 items-center justify-end gap-2">
        {/* Page chip for secondary pages */}
        {(aba === 'relatorios_detalhado' || aba === 'configuracoes' || aba === 'contactos') && (
          <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-light)]">
            <button
              onClick={() => setAba('home')}
              className="flex items-center gap-1 text-[11px] font-semibold nl-text-muted hover:text-[var(--color-primary)] transition-colors"
              title="Voltar ao Painel"
            >
              <ChevronLeft size={13} />
            </button>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
              aba === 'relatorios_detalhado'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : aba === 'contactos'
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              {aba === 'relatorios_detalhado' ? <FileBarChart size={11} /> : aba === 'contactos' ? <BookUser size={11} /> : <Settings size={11} />}
              {aba === 'relatorios_detalhado' ? 'Relatório' : aba === 'contactos' ? 'Contactos' : 'Ajustes'}
            </span>
          </div>
        )}
        {aba === 'gestao' && (
          <div className="flex items-center gap-1.5 rounded-[12px] border border-[#D7DDE7] bg-[#E9EDF3] p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06),0_1px_0_rgba(255,255,255,0.7)]">
            <button
              onClick={() => setAba('contactos')}
              className="nl-icon-btn !h-10 !w-10 !rounded-[var(--radius-surface)] bg-white/80 hover:!bg-violet-50 hover:!text-violet-700"
              title="Contactos"
            >
              <BookUser size={16} strokeWidth={2.7} />
            </button>
            <button onClick={onMatricular} className="nl-btn nl-btn-primary !h-10 !px-5 !text-[14px] shadow-sm">
              <Plus size={14} /> Matricular
            </button>
            {(sessionUser?.role === 'admin' || sessionUser?.role === 'root') && (
            <button
              onClick={() => setAba('relatorios_detalhado')}
              className={`nl-btn !h-10 !px-5 !text-[14px] flex items-center gap-2 transition-all ${
                relatorioMensalDisponivel
                  ? '!bg-emerald-600 !text-white shadow-lg shadow-emerald-600/20 ring-1 ring-emerald-400'
                  : 'nl-btn-secondary'
              }`}
              title="Relatórios administrativos"
            >
              {relatorioMensalDisponivel ? <Star size={14} className="text-amber-300 fill-amber-300 animate-pulse-soft" /> : <FileText size={14} />}
              Relatório
            </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-0.5 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--bg-surface)] p-0.5 shadow-sm">
          <button onClick={onRefreshApp} className="nl-icon-btn !w-8 !h-8 !rounded-[var(--radius-sm)] hover:bg-[var(--color-secondary-lighter)] transition-colors" title="Atualizar">
            <RotateCw size={15} className={sincronizando ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)} className="nl-icon-btn !w-8 !h-8 !rounded-[var(--radius-sm)] relative hover:bg-[var(--color-secondary-lighter)] transition-colors" title="Notificações">
            <Bell size={15} />
            {notificacoesNaoLidas > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-error)] rounded-full border-2 border-[var(--bg-header)]" />
            )}
          </button>
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMostrarUserMenu(!mostrarUserMenu)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-[13px] border-2 border-[var(--bg-app)] shadow-sm hover:shadow-md hover:scale-105 transition-all ${
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
              <div className="absolute right-0 mt-2 w-[240px] bg-[var(--bg-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-xl)] border border-[var(--border)] py-2 z-[110] animate-slide-up">
                <div className="px-4 py-2.5 border-b border-[var(--border-light)] mb-1">
                  <p className="text-[13px] font-bold nl-text leading-tight">{sessionUser?.name}</p>
                  <p className="text-[10px] font-bold nl-text-muted uppercase tracking-widest mt-0.5">{sessionUser?.role === 'admin' ? 'Administrador' : 'Operador'}</p>
                </div>

                <div className="px-1.5 space-y-0.5">
                  {sessionUser?.role === 'admin' && (
                    <>
                      <p className="px-3 pt-1.5 pb-0.5 text-[9px] font-black uppercase tracking-[0.18em] nl-text-muted">Ferramentas</p>
                      <button
                        onClick={() => { setAba('relatorios_detalhado'); setMostrarUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-amber-50 text-[13px] font-semibold text-amber-700 transition-colors group"
                      >
                        <FileBarChart size={15} className="text-amber-500 shrink-0" />
                        <span className="flex-1 text-left">Relatório</span>
                        <kbd className="text-[9px] font-mono text-slate-300 bg-[var(--color-secondary-lighter)] px-1.5 py-0.5 rounded border border-[var(--border-light)] group-hover:bg-amber-100 group-hover:text-amber-500 group-hover:border-amber-200 transition-colors">⌘R</kbd>
                      </button>
                      <button
                        onClick={() => { setAba('configuracoes'); setMostrarUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-secondary-light)] text-[13px] font-semibold nl-text transition-colors group"
                      >
                        <Settings size={15} className="text-slate-400 shrink-0" />
                        <span className="flex-1 text-left">Ajustes do Sistema</span>
                        <kbd className="text-[9px] font-mono text-slate-300 bg-[var(--color-secondary-lighter)] px-1.5 py-0.5 rounded border border-[var(--border-light)] group-hover:bg-slate-200 group-hover:text-slate-500 transition-colors">⌘,</kbd>
                      </button>
                      <button
                        onClick={() => { setAba('contactos'); setMostrarUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-violet-50 text-[13px] font-semibold text-violet-700 transition-colors group"
                      >
                        <BookUser size={15} className="text-violet-500 shrink-0" />
                        <span className="flex-1 text-left">Contactos (CRM)</span>
                        <kbd className="text-[9px] font-mono text-slate-300 bg-[var(--color-secondary-lighter)] px-1.5 py-0.5 rounded border border-[var(--border-light)] group-hover:bg-violet-100 group-hover:text-violet-500 group-hover:border-violet-200 transition-colors">⌘J</kbd>
                      </button>
                      <div className="h-px bg-[var(--border-light)] my-1 mx-2" />
                    </>
                  )}

                  <button
                    onClick={() => { setMostrarSobreDoc(true); setMostrarUserMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-secondary-light)] text-[13px] font-medium nl-text transition-colors"
                  >
                    <Info size={15} className="text-slate-400" /> Sobre o NEXTLevel
                  </button>

                  <div className="h-px bg-[var(--border-light)] my-1 mx-2" />

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-red-50 text-[13px] font-medium text-red-600 transition-colors"
                  >
                    <LogOut size={15} /> Terminar Sessão
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
