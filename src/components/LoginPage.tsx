// @ts-nocheck -- Legacy authentication controller typing is isolated during App decomposition.
import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle, ChevronRight, Eye, EyeOff, Info, Sparkles, Wifi,
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

const AVATAR_RING = [
  '#2563EB', '#16A34A', '#D97706', '#7C3AED', '#0D9488', '#E11D48', '#0891B2',
];

const ringColor = (name = 'A') =>
  AVATAR_RING[(String(name).charCodeAt(0) || 65) % AVATAR_RING.length];

/**
 * Login — mesmo espírito visual da matrícula:
 * bolinhas de cor, hero suave, logo da academia em destaque, avatares para entrar rápido.
 */
export default function LoginPage({ model }: { model: unknown }) {
  const {
    agora,
    appLogo,
    nomeAcademia,
    bannerAcademia,
    loginForm,
    lembrarUtilizadores,
    utilizadoresRecentes,
    mostrarSenha,
    permitirGuardarSessao,
    guardarSessao,
    loginError,
    carregandoLogin,
    loginSlideshowUsers,
    electron,
    GlobalStyles,
    handleLogin,
    setLoginForm,
    setMostrarSenha,
    setGuardarSessao,
    setCarregandoLogin,
    setSessionUser,
    setIsLoggedIn,
    utilizadorAvatares = {},
  } = model;

  const [showDevInfo, setShowDevInfo] = useState(false);
  const passwordRef = useRef(null);
  const loginNow = agora;
  const loginHora = loginNow.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const loginData = loginNow.toLocaleDateString('pt-PT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const bannerSrc = bannerAcademia || DEFAULT_ACADEMY_BANNER;
  const accent = 'var(--color-primary)';
  const accentSolid = '#2563EB';

  const avatarUsers = (
    loginSlideshowUsers?.length
      ? loginSlideshowUsers
      : (lembrarUtilizadores ? utilizadoresRecentes : [])
  ).filter((u) => u && u.name !== 'root' && u.name !== 'Root Técnico');

  const selectUser = (u) => {
    setLoginForm((prev) => ({ ...prev, username: u.name, password: '' }));
    requestAnimationFrame(() => passwordRef.current?.focus?.());
  };

  useEffect(() => {
    if (loginForm.username) passwordRef.current?.focus?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tryQuickLogin = async (u) => {
    setCarregandoLogin(true);
    try {
      const res = await electron?.ipcRenderer.invoke('login:quick-access', u.id);
      if (res?.success) {
        const user = {
          id: Number(res.user.id),
          name: String(res.user.name),
          email: String(res.user.email),
          role: res.user.role === 'admin' ? 'admin' : 'operational',
        };
        localStorage.setItem(
          'nl_session_user',
          JSON.stringify({ ...user, loginTimestamp: Date.now() }),
        );
        setSessionUser(user);
        electron?.ipcRenderer.invoke('users:set-current', { name: user.name });
        setIsLoggedIn(true);
        setCarregandoLogin(false);
        return true;
      }
    } catch (e) {
      console.warn('Acesso rápido indisponível:', e);
    }
    setCarregandoLogin(false);
    return false;
  };

  const onAvatarClick = async (u) => {
    const ok = await tryQuickLogin(u);
    if (!ok) selectUser(u);
  };

  const inputClass =
    'block w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-input)] ' +
    'px-3.5 py-3 text-[15px] font-medium leading-normal tracking-normal text-[var(--text-primary)] ' +
    'outline-none transition-[border-color,box-shadow,background] ' +
    'placeholder:text-[var(--text-tertiary)] placeholder:font-normal ' +
    'focus:border-[var(--color-primary)] focus:bg-[var(--bg-surface)] focus:shadow-[0_0_0_3px_var(--shadow-primary-focus)]';

  return (
    <div className="relative flex h-screen w-screen overflow-hidden nl-font-ui" style={{ background: 'var(--bg-app)' }}>
      <GlobalStyles theme="light" />

      {/* Fundo com banner suave + bolinhas (estilo matrícula) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={bannerSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
          decoding="async"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, color-mix(in srgb, var(--color-primary) 10%, var(--bg-app)) 0%, var(--bg-app) 45%, color-mix(in srgb, var(--color-success) 6%, var(--bg-app)) 100%)',
          }}
        />
        <div
          className="absolute -right-16 -top-20 h-72 w-72 rounded-full opacity-40 blur-[2px]"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 28%, transparent)' }}
        />
        <div
          className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full opacity-35 blur-[2px]"
          style={{ background: 'color-mix(in srgb, var(--color-success) 22%, transparent)' }}
        />
        <div
          className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full opacity-25"
          style={{ background: 'color-mix(in srgb, #D97706 20%, transparent)' }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 h-24 w-24 rounded-full opacity-30"
          style={{ background: 'color-mix(in srgb, #7C3AED 18%, transparent)' }}
        />
      </div>

      {/* Hora + info */}
      <div className="absolute right-5 top-4 z-20 flex items-center gap-2 sm:right-8 sm:top-5">
        <div className="hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-surface)]/90 px-3 py-1.5 text-right shadow-sm backdrop-blur-sm sm:block">
          <p className="text-[16px] font-bold tabular-nums leading-none nl-text">{loginHora}</p>
          <p className="mt-0.5 text-[10px] capitalize nl-text-muted">{loginData}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowDevInfo(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-surface)]/90 text-[var(--text-secondary)] shadow-sm backdrop-blur-sm transition hover:text-[var(--color-primary)]"
          title="Sobre o desenvolvedor"
        >
          <Info size={16} />
        </button>
      </div>

      {/* Card centrado — layout matrícula */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-6">
        <div
          className="flex w-full max-w-[420px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]"
          style={{
            boxShadow: `0 0 0 1px color-mix(in srgb, ${accentSolid} 18%, transparent), 0 24px 64px rgba(0,0,0,0.12)`,
          }}
        >
          {/* Hero header (como matrícula) */}
          <div
            className="relative shrink-0 overflow-hidden border-b border-[var(--border-light)] px-6 pb-5 pt-6"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 14%, var(--bg-surface)) 0%, var(--bg-surface) 72%)`,
            }}
          >
            <div
              className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-35"
              style={{ background: accentSolid }}
            />
            <div
              className="pointer-events-none absolute -bottom-14 left-1/4 h-32 w-32 rounded-full opacity-20"
              style={{ background: '#16A34A' }}
            />

            <div className="relative flex flex-col items-center text-center">
              {/* Logo da academia em destaque */}
              <div
                className="mb-3 flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[18px] border border-white/70 bg-white p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
              >
                <img
                  src={appLogo || APP_ICON_PATH}
                  alt={nomeAcademia || 'Academia'}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Sparkles size={14} style={{ color: accentSolid }} />
                <h1 className="text-[18px] font-bold tracking-tight nl-text">
                  {nomeAcademia || 'Next Level Academia'}
                </h1>
              </div>
              <p className="mt-1 max-w-[280px] text-[12px] font-medium leading-snug nl-text-muted">
                Toque no seu perfil e entre com a palavra-passe
              </p>
            </div>
          </div>

          <div className="px-6 py-5 sm:px-7">
            {/* Avatares — bolinhas coloridas estilo chips de matrícula */}
            {avatarUsers.length > 0 && (
              <div className="mb-5">
                <p className="mb-2.5 text-center text-[10px] font-bold uppercase tracking-[0.14em] nl-text-muted">
                  Quem está a entrar?
                </p>
                <div className="flex flex-wrap items-start justify-center gap-3">
                  {avatarUsers.map((u) => {
                    const avatar = getUserAvatar(utilizadorAvatares, u);
                    const ring = ringColor(u.name);
                    const selected =
                      String(loginForm.username || '').toLowerCase() === String(u.name || '').toLowerCase();
                    return (
                      <button
                        key={u.id || u.name}
                        type="button"
                        disabled={carregandoLogin}
                        onClick={() => onAvatarClick(u)}
                        className="group flex w-[76px] flex-col items-center gap-1.5 transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                        title={`Entrar como ${u.name}`}
                      >
                        <div
                          className="relative flex h-[58px] w-[58px] items-center justify-center rounded-full p-[3px] transition-shadow"
                          style={{
                            background: selected
                              ? `linear-gradient(135deg, ${ring}, color-mix(in srgb, ${ring} 50%, #fff))`
                              : `color-mix(in srgb, ${ring} 35%, var(--border))`,
                            boxShadow: selected
                              ? `0 6px 16px color-mix(in srgb, ${ring} 40%, transparent)`
                              : undefined,
                          }}
                        >
                          <div
                            className="flex h-full w-full items-center justify-center overflow-hidden rounded-full text-[14px] font-bold text-white"
                            style={{
                              background: avatar
                                ? 'var(--bg-surface)'
                                : ring,
                            }}
                          >
                            {avatar
                              ? <img src={avatar} alt="" className="h-full w-full object-cover" />
                              : userInitials(u.name)}
                          </div>
                          {selected && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
                              style={{ background: ring }}
                            />
                          )}
                        </div>
                        <span
                          className="max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            color: selected ? ring : 'var(--text-secondary)',
                            background: selected
                              ? `color-mix(in srgb, ${ring} 12%, var(--bg-surface))`
                              : 'transparent',
                          }}
                        >
                          {String(u.name || '').split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-4 h-px bg-[var(--border-light)]" />

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label htmlFor="login-user" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
                  Utilizador
                </label>
                <input
                  id="login-user"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Nome de utilizador"
                  className={inputClass}
                  required
                  autoComplete="username"
                  spellCheck={false}
                />
              </div>

              <div>
                <label htmlFor="login-pass" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
                  Palavra-passe
                </label>
                <div className="relative">
                  <input
                    id="login-pass"
                    ref={passwordRef}
                    type={mostrarSenha ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Senha"
                    className={`${inputClass} pr-11`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--color-secondary-light)] hover:text-[var(--text-primary)]"
                    tabIndex={-1}
                    title={mostrarSenha ? 'Ocultar' : 'Mostrar'}
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {permitirGuardarSessao && (
                <label className="flex cursor-pointer select-none items-center gap-2 py-0.5">
                  <input
                    type="checkbox"
                    checked={guardarSessao}
                    onChange={(e) => setGuardarSessao(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border)] text-[var(--color-primary)]"
                  />
                  <span className="text-[13px] font-medium nl-text">Manter sessão iniciada</span>
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
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] text-[15px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${accentSolid} 0%, color-mix(in srgb, ${accentSolid} 75%, #0f172a) 100%)`,
                  boxShadow: `0 6px 18px color-mix(in srgb, ${accentSolid} 35%, transparent)`,
                }}
              >
                {carregandoLogin ? 'A autenticar…' : 'Entrar'}
                {!carregandoLogin && <ChevronRight size={18} />}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/35 px-5 py-2.5">
            <div className="flex items-center gap-1.5">
              <Wifi size={11} className="text-[var(--color-success)]" />
              <span className="text-[10px] font-medium nl-text-muted">Local · Offline-ready</span>
            </div>
            <span className="text-[10px] font-medium nl-text-muted">Next Level Academia</span>
          </div>
        </div>
      </div>

      {showDevInfo && (
        <AppModalShell
          title={COMPANY_NAME}
          subtitle="Desenvolvedor & suporte"
          onClose={() => setShowDevInfo(false)}
          maxWidth="max-w-[400px]"
          zIndex={2100}
          hideBrand
          accent="var(--color-primary)"
          footer={(
            <button type="button" onClick={() => setShowDevInfo(false)} className="nl-btn nl-btn-primary !h-9">
              Fechar
            </button>
          )}
        >
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-center gap-3">
              <img src={NEXT_LAB_ICON} alt="" className="h-12 w-12 object-contain opacity-90" />
              <div>
                <p className="text-[15px] font-semibold nl-text">{COMPANY_AUTHOR}</p>
                <p className="text-[12px] nl-text-muted">{COMPANY_NAME} · Cabo Verde</p>
              </div>
            </div>
            <div className="space-y-1.5 text-[13px] nl-text-sub">
              <p>{COMPANY_EMAIL}</p>
              <p>{COMPANY_PHONE}</p>
              <p className="text-[12px] nl-text-muted">{COMPANY_WEBSITE}</p>
            </div>
          </div>
        </AppModalShell>
      )}
    </div>
  );
}
