// @ts-nocheck -- Legacy authentication controller typing is isolated during App decomposition.
import { AlertCircle, ChevronDown, ChevronRight, ChevronUp, Eye, EyeOff, Globe, MapPin, Phone, Shield, User, Wifi } from 'lucide-react';
import { COMPANY_NAME, COMPANY_PHONE, COMPANY_WEBSITE, DEFAULT_ACADEMY_BANNER, NEXT_LAB_ICON } from '../constants';

export default function LoginPage({ model }: { model: unknown }) {
  const { agora, appLogo, nomeAcademia, moradaAcademia, telefoneAcademia, loginForm, mostrarDropdownRecentes, lembrarUtilizadores, utilizadoresRecentes, mostrarSenha, permitirGuardarSessao, guardarSessao, loginError, carregandoLogin, loginSlideshowUsers, quickAccessExpanded, slideshowImages, currentSlide, slideshowTextEnabled, electron, GlobalStyles, handleLogin, setLoginForm, setMostrarDropdownRecentes, setMostrarSenha, setGuardarSessao, setQuickAccessExpanded, setCarregandoLogin, setSessionUser, setIsLoggedIn, setCurrentSlide } = model;
    // Mini Calendar state (scoped to login)
    const loginNow = agora;
    const loginHora = loginNow.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const loginData = loginNow.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
      <div className="flex h-screen w-screen overflow-hidden nl-font-ui bg-white" style={{ animation: 'fadeIn 0.4s ease both' }}>
        <GlobalStyles theme="light" />

        {/* ── LADO ESQUERDO: Identidade + Formulário ── */}
        <div className="w-[480px] shrink-0 h-full flex flex-col relative bg-white border-r border-slate-100">
          {/* Barra de acento lateral */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--color-primary)]" />

          {/* Topo: Branding da Academia */}
          <div className="px-12 pt-12 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[6px] flex items-center justify-center bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 shadow-sm shrink-0">
                <img src={appLogo} alt="Logo" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h1 className="text-[18px] font-black nl-text tracking-tight uppercase leading-none">{nomeAcademia}</h1>
                <p className="text-[10px] font-bold nl-text-muted uppercase tracking-[0.2em] mt-0.5">Sistema de Gestão</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Local', value: moradaAcademia.split(',')[0] || 'Academia', icon: <MapPin size={11} /> },
                { label: 'Contacto', value: telefoneAcademia || '—', icon: <Phone size={11} /> },
                { label: 'Sistema', value: 'Ativo', icon: <Wifi size={11} /> },
              ].map(item => (
                <div key={item.label} className="rounded-[4px] border border-slate-100 bg-slate-50 px-2.5 py-2">
                  <div className="flex items-center gap-1 nl-text-muted mb-1">{item.icon}<span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span></div>
                  <p className="text-[11px] font-semibold nl-text truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Centro: Formulário de login */}
          <div className="flex-1 flex flex-col justify-center px-12 py-8">
            <div className="mb-7">
              <h2 className="text-[26px] font-black nl-text tracking-tight leading-tight mb-1.5">Bem-vindo de volta.</h2>
              <p className="text-[13px] text-slate-500">Introduza as suas credenciais para aceder ao painel.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-wider">Nome de Utilizador</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    onFocus={() => setMostrarDropdownRecentes(true)}
                    onBlur={() => setTimeout(() => setMostrarDropdownRecentes(false), 200)}
                    placeholder="O teu nome..."
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-[6px] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] outline-none transition-all text-[13px]"
                    required
                  />
                  {mostrarDropdownRecentes && lembrarUtilizadores && utilizadoresRecentes.filter(u => u.name !== 'root' && u.name !== 'Root Técnico').length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-[6px] shadow-lg z-50 max-h-48 overflow-y-auto">
                      <div className="p-1.5 space-y-0.5">
                        {utilizadoresRecentes.filter(u => u.name !== 'root' && u.name !== 'Root Técnico').map((u) => (
                          <button
                            key={u.name}
                            type="button"
                            onMouseDown={() => {
                              setLoginForm(prev => ({ ...prev, username: u.name }));
                              setMostrarDropdownRecentes(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-left text-[12px] hover:bg-slate-50 rounded-[4px] transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-slate-700 leading-none">{u.name}</p>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-[3px] border ${
                              u.role === 'admin' 
                                ? 'bg-red-50 border-red-100 text-red-600'
                                : 'bg-blue-50 border-blue-100 text-blue-600'
                            }`}>
                              {u.role === 'admin' ? 'Admin' : 'Operador'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-wider">Palavra-passe</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    placeholder="••••••••••"
                    className="w-full h-11 pl-10 pr-11 bg-slate-50 border border-slate-200 rounded-[6px] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] outline-none transition-all text-[13px]"
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {permitirGuardarSessao && (
                <div className="space-y-1 py-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={guardarSessao}
                      onChange={(e) => setGuardarSessao(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                    />
                    <span className="text-[12px] font-medium text-slate-600">Manter sessão iniciada</span>
                  </label>
                  {guardarSessao && (() => {
                    const isTypedAdmin = loginForm.username.toLowerCase().includes('admin') || 
                                         loginForm.username.toLowerCase() === 'root' ||
                                         utilizadoresRecentes.some(u => u.name.toLowerCase() === loginForm.username.toLowerCase() && (u.role === 'admin' || u.role === 'root'));
                    if (isTypedAdmin) {
                      return (
                        <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 leading-normal pl-6">
                          ⚠️ Atenção Administrador: Não recomendado em computadores partilhados.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-[5px] flex items-center gap-2.5 text-red-600 text-[12px] font-medium">
                  <AlertCircle size={15} className="shrink-0" /> {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={carregandoLogin}
                className="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-[6px] font-bold text-[13px] shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
              >
                {carregandoLogin ? 'A autenticar...' : 'Entrar no Sistema'}
                {!carregandoLogin && <ChevronRight size={16} />}
              </button>
            </form>
          </div>

          {/* Quick Access — Utilizadores sem senha */}
          {loginSlideshowUsers.length > 0 && (
            <div className="px-12 pb-3">
              <button
                type="button"
                onClick={() => setQuickAccessExpanded(!quickAccessExpanded)}
                className="w-full flex items-center justify-between py-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Acesso Rápido — clique para entrar
                </span>
                {quickAccessExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {quickAccessExpanded && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {loginSlideshowUsers.map((u: any) => {
                    const hue = (u.name?.charCodeAt(0) || 0) * 37 % 360;
                    return (
                      <button
                        key={u.id}
                        onClick={async () => {
                          setCarregandoLogin(true);
                          try {
                            const res = await electron?.ipcRenderer.invoke('login:quick-access', u.id);
                            if (res?.success) {
                              const user = { id: Number(res.user.id), name: String(res.user.name), email: String(res.user.email), role: (res.user.role === 'admin' ? 'admin' : 'operational') as any };
                              localStorage.setItem('nl_session_user', JSON.stringify({ ...user, loginTimestamp: Date.now() }));
                              setSessionUser(user);
                              electron?.ipcRenderer.invoke('users:set-current', { name: user.name });
                              setIsLoggedIn(true);
                            }
                          } catch (e) {
                            console.warn('Falha no acesso rápido:', e);
                          }
                          setCarregandoLogin(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-[6px] border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all"
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
                             style={{ background: `hsl(${hue},60%,88%)`, color: `hsl(${hue},60%,35%)` }}>
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="text-[12px] font-bold text-slate-700 leading-none">{u.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">{u.role === 'admin' ? 'Admin' : 'Operador'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Rodapé */}
          <div className="px-12 pb-6">
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Desenvolvido por <span className="font-bold">{COMPANY_NAME}</span> · v1.0 Beta · {new Date().getFullYear()}
            </p>
            <p className="text-[9px] text-slate-300 text-center mt-1 tracking-wide">
              NEXT-Lab Creative · desde 1995 · Ivaldino da Luz Fortes, CEO
            </p>
          </div>
        </div>

        {/* ── LADO DIREITO: Slideshow / Banner ── */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-900">
          {/* Fundo — slideshow ou banner estático */}
          {slideshowImages.length > 0 ? (
            slideshowImages.map((img, i) => (
              <img key={i} src={img}
                className="absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-1000"
                style={{ opacity: i === currentSlide ? 0.55 : 0 }}
                alt="" />
            ))
          ) : (
            <img src={DEFAULT_ACADEMY_BANNER}
              className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105"
              alt="Banner" />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.75) 100%)' }} />

          <div className="relative h-full flex flex-col justify-between p-12 z-10">
            {/* Topo: Relógio + Status */}
            <div className="flex items-start justify-between">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[6px] px-4 py-2.5 flex items-center gap-2">
                <Wifi size={13} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest leading-none mb-0.5">Servidor Local</p>
                  <p className="text-[12px] font-bold text-white">Operacional</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[44px] font-black text-white leading-none tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{loginHora.slice(0, 5)}</p>
                <p className="text-white/50 text-[11px] font-medium mt-1 capitalize">{loginData}</p>
              </div>
            </div>

            {/* Meio: Tagline (só se texto habilitado) */}
            {slideshowTextEnabled && (
              <div className="max-w-[460px]">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-3">Next Level · Gym Management</p>
                <h3 className="text-white text-[36px] font-black leading-[1.08] tracking-tight mb-4">
                  Gestão que eleva o nível da sua academia.
                </h3>
                <p className="text-white/60 text-[14px] leading-relaxed">
                  Matrículas, mensalidades e acompanhamento de alunos num só painel.
                </p>
              </div>
            )}

            {/* Indicadores do slideshow */}
            {slideshowImages.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 absolute bottom-24 left-1/2 -translate-x-1/2">
                {slideshowImages.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)}
                    className="transition-all rounded-full"
                    style={{ width: i === currentSlide ? 20 : 6, height: 6, background: i === currentSlide ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }} />
                ))}
              </div>
            )}

            {/* Rodapé: Info NEXT Lab */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[5px] overflow-hidden bg-white/10 border border-white/15 flex items-center justify-center">
                    <img src={NEXT_LAB_ICON} alt="NEXT Lab" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-white leading-tight">{COMPANY_NAME}</p>
                    <p className="text-[10px] text-white/40 font-medium">Creative Studio · desde 1995 · Cabo Verde</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[11px] text-white/50 flex items-center gap-1.5 justify-end"><Phone size={10} /> {COMPANY_PHONE}</p>
                  <p className="text-[11px] text-white/50 flex items-center gap-1.5 justify-end cursor-pointer hover:text-white/70 transition-colors" onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)}>
                    <Globe size={10} /> linktr.ee/next.lab
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>
    );
}
