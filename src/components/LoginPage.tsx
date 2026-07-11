// @ts-nocheck -- Legacy authentication controller typing is isolated during App decomposition.
import { useState } from 'react';
import {
  AlertCircle, ChevronDown, ChevronRight, ChevronUp, Eye, EyeOff,
  Info, Shield, User, Wifi,
} from 'lucide-react';
import {
  APP_ICON_PATH,
  COMPANY_AUTHOR,
  COMPANY_EMAIL,
  COMPANY_NAME,
  COMPANY_PHONE,
  COMPANY_WEBSITE,
  DEFAULT_ACADEMY_BANNER,
  NEXT_LAB_ICON,
} from '../constants';
import { getUserAvatar, userInitials } from '../utils/userAvatar';
import AppModalShell from './AppModalShell';

/**
 * Login simples e rápido:
 * - Banner da academia (mesmo da Início)
 * - Card de formulário centrado
 * - Detalhes do desenvolvedor num ícone → popup
 */
export default function LoginPage({ model }: { model: unknown }) {
  const {
    agora,
    appLogo,
    nomeAcademia,
    bannerAcademia,
    loginForm,
    mostrarDropdownRecentes,
    lembrarUtilizadores,
    utilizadoresRecentes,
    mostrarSenha,
    permitirGuardarSessao,
    guardarSessao,
    loginError,
    carregandoLogin,
    loginSlideshowUsers,
    quickAccessExpanded,
    electron,
    GlobalStyles,
    handleLogin,
    setLoginForm,
    setMostrarDropdownRecentes,
    setMostrarSenha,
    setGuardarSessao,
    setQuickAccessExpanded,
    setCarregandoLogin,
    setSessionUser,
    setIsLoggedIn,
    utilizadorAvatares = {},
  } = model;

  const [showDevInfo, setShowDevInfo] = useState(false);
  const loginNow = agora;
  const loginHora = loginNow.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const loginData = loginNow.toLocaleDateString('pt-PT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  // Mesma imagem do banner da Início — uma única imagem, sem slideshow pesado
  const bannerSrc = bannerAcademia || DEFAULT_ACADEMY_BANNER;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden nl-font-ui">
      <GlobalStyles theme="light" />

      {/* Fundo: banner da academia (leve) */}
      <div className="absolute inset-0">
        <img
          src={bannerSrc}
          alt=""
          className="h-full w-full object-cover"
          decoding="async"
          fetchPriority="high"
        />
        {/* Overlay suave — simula “pré-visão” da app sem carregar o painel */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.45) 48%, rgba(15,23,42,0.72) 100%)',
          }}
        />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Topo: marca + hora */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/20 bg-white/15 p-1.5 backdrop-blur-sm">
            <img src={appLogo || APP_ICON_PATH} alt="" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-[14px] font-semibold leading-none text-white">{nomeAcademia || 'Academia'}</p>
            <p className="mt-0.5 text-[11px] font-medium text-white/55">Gestão · Next Level</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-[var(--radius-control)] border border-white/15 bg-white/10 px-3 py-1.5 text-right backdrop-blur-sm sm:block">
            <p className="text-[18px] font-bold tabular-nums leading-none text-white">{loginHora}</p>
            <p className="mt-0.5 text-[10px] capitalize text-white/50">{loginData}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDevInfo(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
            title="Sobre o desenvolvedor"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Card de login centrado */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[400px] overflow-hidden rounded-[var(--radius-lg)] border border-white/20 bg-[var(--bg-surface)] shadow-[0_24px_64px_rgba(0,0,0,0.28)]">
          {/* Faixa de acento */}
          <div className="h-1 w-full bg-[var(--color-primary)]" />

          <div className="px-6 pb-6 pt-6 sm:px-8">
            <div className="mb-6">
              <h1 className="text-[26px] font-bold tracking-tight nl-text">Entrar</h1>
              <p className="mt-1.5 text-[15px] leading-snug nl-text-sub">
                Aceda ao painel de gestão da academia.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[12px] font-bold uppercase tracking-wider nl-text">
                  Utilizador
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    onFocus={() => setMostrarDropdownRecentes(true)}
                    onBlur={() => setTimeout(() => setMostrarDropdownRecentes(false), 200)}
                    placeholder="O teu nome…"
                    className="nl-input h-13 w-full !h-[52px] pl-11 pr-3 !text-[17px] !font-medium !text-[var(--text-primary)] placeholder:!text-[var(--text-tertiary)]"
                    required
                    autoFocus
                    autoComplete="username"
                  />
                  {mostrarDropdownRecentes
                    && lembrarUtilizadores
                    && utilizadoresRecentes.filter((u) => u.name !== 'root' && u.name !== 'Root Técnico').length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]">
                      <div className="space-y-0.5 p-1.5">
                        {utilizadoresRecentes
                          .filter((u) => u.name !== 'root' && u.name !== 'Root Técnico')
                          .map((u) => {
                            const avatar = getUserAvatar(utilizadorAvatares, u);
                            return (
                            <button
                              key={u.name}
                              type="button"
                              onMouseDown={() => {
                                setLoginForm((prev) => ({ ...prev, username: u.name }));
                                setMostrarDropdownRecentes(false);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-[var(--radius-compact)] px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--color-secondary-light)]"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] text-[12px] font-bold text-white">
                                {avatar
                                  ? <img src={avatar} alt="" className="h-full w-full object-cover" />
                                  : userInitials(u.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-semibold nl-text">{u.name}</p>
                                <p className="text-[12px] nl-text-muted">{u.role === 'admin' ? 'Administrador' : 'Operador'}</p>
                              </div>
                            </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[12px] font-bold uppercase tracking-wider nl-text">
                  Palavra-passe
                </label>
                <div className="relative">
                  <Shield className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="nl-input w-full !h-[52px] pl-11 pr-12 !text-[17px] !font-medium !text-[var(--text-primary)] placeholder:!text-[var(--text-tertiary)] tracking-wide"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {permitirGuardarSessao && (
                <label className="flex cursor-pointer select-none items-center gap-2.5 py-1">
                  <input
                    type="checkbox"
                    checked={guardarSessao}
                    onChange={(e) => setGuardarSessao(e.target.checked)}
                    className="h-4.5 w-4.5 h-[18px] w-[18px] rounded border-[var(--border)] text-[var(--color-primary)]"
                  />
                  <span className="text-[14px] font-medium nl-text">Manter sessão iniciada</span>
                </label>
              )}

              {loginError && (
                <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] font-medium text-red-600">
                  <AlertCircle size={14} className="shrink-0" />
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={carregandoLogin}
                className="nl-btn nl-btn-primary flex !h-[52px] w-full items-center justify-center gap-2 !text-[16px] font-bold disabled:opacity-60"
              >
                {carregandoLogin ? 'A autenticar…' : 'Entrar'}
                {!carregandoLogin && <ChevronRight size={18} />}
              </button>
            </form>

            {/* Acesso rápido compacto */}
            {loginSlideshowUsers.length > 0 && (
              <div className="mt-5 border-t border-[var(--border-light)] pt-3">
                <button
                  type="button"
                  onClick={() => setQuickAccessExpanded(!quickAccessExpanded)}
                  className="flex w-full items-center justify-between py-1 text-[13px] font-semibold nl-text-muted hover:nl-text"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Acesso rápido
                  </span>
                  {quickAccessExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {quickAccessExpanded && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {loginSlideshowUsers.map((u) => {
                      const avatar = getUserAvatar(utilizadorAvatares, u);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={async () => {
                            setCarregandoLogin(true);
                            try {
                              const res = await electron?.ipcRenderer.invoke('login:quick-access', u.id);
                              if (res?.success) {
                                const user = {
                                  id: Number(res.user.id),
                                  name: String(res.user.name),
                                  email: String(res.user.email),
                                  role: (res.user.role === 'admin' ? 'admin' : 'operational'),
                                };
                                localStorage.setItem(
                                  'nl_session_user',
                                  JSON.stringify({ ...user, loginTimestamp: Date.now() }),
                                );
                                setSessionUser(user);
                                electron?.ipcRenderer.invoke('users:set-current', { name: user.name });
                                setIsLoggedIn(true);
                              }
                            } catch (e) {
                              console.warn('Falha no acesso rápido:', e);
                            }
                            setCarregandoLogin(false);
                          }}
                          className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--color-secondary-light)] px-2.5 py-2 transition hover:border-[var(--color-primary)]"
                        >
                          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] text-[11px] font-bold text-white">
                            {avatar
                              ? <img src={avatar} alt="" className="h-full w-full object-cover" />
                              : userInitials(u.name)}
                          </div>
                          <span className="text-[14px] font-semibold nl-text">{u.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 px-5 py-2.5">
            <div className="flex items-center gap-1.5">
              <Wifi size={11} className="text-[var(--color-success)]" />
              <span className="text-[10px] font-medium nl-text-muted">Local · Offline-ready</span>
            </div>
            <span className="text-[10px] font-medium nl-text-muted">v1.0</span>
          </div>
        </div>
      </div>

      {/* Popup desenvolvedor */}
      {showDevInfo && (
        <AppModalShell
          title="Sobre o sistema"
          subtitle="NEXTLevel · NEXT Lab"
          onClose={() => setShowDevInfo(false)}
          appLogo={appLogo}
          maxWidth="max-w-[420px]"
          zIndex={2100}
          accent="var(--color-primary)"
          footer={(
            <>
              <button type="button" onClick={() => setShowDevInfo(false)} className="nl-btn nl-btn-secondary !h-9">
                Fechar
              </button>
              <button
                type="button"
                onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)}
                className="nl-btn nl-btn-primary !h-9"
              >
                Website
              </button>
            </>
          )}
        >
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-center gap-3">
              <img src={NEXT_LAB_ICON} alt="" className="h-10 w-10 object-contain opacity-80" />
              <div>
                <p className="text-[15px] font-bold nl-text">{COMPANY_NAME}</p>
                <p className="text-[12px] nl-text-muted">Creative Studio · desde 1995 · Cabo Verde</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Autor', value: COMPANY_AUTHOR },
                { label: 'Email', value: COMPANY_EMAIL },
                { label: 'Telefone', value: COMPANY_PHONE },
                { label: 'Produto', value: 'NEXTLevel Academia · v1.0' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 px-3 py-2"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider nl-text-muted">{row.label}</span>
                  <span className="text-right text-[12px] font-semibold nl-text">{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] nl-text-muted">
              © {new Date().getFullYear()} {COMPANY_NAME}. Todos os direitos reservados.
            </p>
          </div>
        </AppModalShell>
      )}
    </div>
  );
}
