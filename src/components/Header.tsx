import React from 'react';
import {
  Layout, Users, ChevronLeft, FileBarChart, BookUser, Settings,
  Plus, Star, FileText, RotateCw, Bell, Info, LogOut,
} from 'lucide-react';

interface HeaderProps {
  nomeAcademia: string;
  COMPANY_NAME: string;
  COMPANY_WEBSITE: string;
  appLogo: string;
  APP_ICON_PATH: string;
  aba: string;
  setAba: (aba: any) => void;
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
  setMostrarRelatorioMensal,
}) => {
  return (
    <header className="h-[58px] grid grid-cols-[minmax(180px,260px)_1fr_minmax(300px,auto)] items-center gap-4 px-4 shrink-0 bg-[var(--bg-header)] border-b border-[var(--border)] z-[100] shadow-[var(--shadow-sm)]">
      {/* Left: Branding */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm" style={{ background: 'var(--color-primary-light)', border: '1px solid var(--border)' }}>
          <img src={appLogo} alt="Logo" className="w-4.5 h-4.5 object-contain" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] font-black tracking-tight nl-text uppercase leading-tight truncate">{nomeAcademia}</span>
          <span className="text-[9px] font-bold nl-text-muted uppercase tracking-[0.12em] opacity-55 truncate">{COMPANY_NAME}</span>
        </div>
      </div>

      {/* Center: Navigation */}
      <div className="flex items-center justify-center min-w-0">
        <nav className="flex items-center gap-0.5 p-0.5 rounded-[var(--radius-md)] bg-[var(--color-secondary-lighter)] border border-[var(--border-light)]">
          {[
            { id: 'home', label: 'Início', icon: <Layout size={14} /> },
            { id: 'gestao', label: 'Alunos', icon: <Users size={14} /> },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => setAba(nav.id as any)}
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-[var(--radius-sm)] text-[12px] font-bold transition-all duration-150 ${
                aba === nav.id
                  ? 'bg-[var(--bg-surface)] text-[var(--color-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[var(--border)]'
                  : 'nl-text-muted hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/40'
              }`}
            >
              {nav.icon}
              <span>{nav.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Context actions + Profile */}
      <div className="flex items-center justify-end gap-2 min-w-0">
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
          <div className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/35 p-0.5">
            <button onClick={onMatricular} className="nl-btn nl-btn-primary !h-8 !px-3 !text-[12px] shadow-sm">
              <Plus size={14} /> Matricular
            </button>
            <button
              onClick={() => setMostrarRelatorioMensal(true)}
              className={`nl-btn !h-8 !px-3 !text-[12px] flex items-center gap-2 transition-all ${
                relatorioMensalDisponivel
                  ? '!bg-emerald-600 !text-white shadow-lg shadow-emerald-600/20 ring-1 ring-emerald-400'
                  : 'nl-btn-secondary'
              }`}
              title="Relatório Mensal"
            >
              {relatorioMensalDisponivel ? <Star size={14} className="text-amber-300 fill-amber-300 animate-pulse-soft" /> : <FileText size={14} />}
              Relatório
            </button>
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
