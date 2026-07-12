// @ts-nocheck -- Legacy setup controller typing is isolated during App decomposition.
import { useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileBarChart,
  Landmark,
  Mail,
  Phone,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { APP_ICON_PATH, COMPANY_AUTHOR, COMPANY_EMAIL, COMPANY_NAME, COMPANY_PHONE, COMPANY_WEBSITE } from '../constants';

const STEPS = [
  { id: 1, label: 'Bem-vindo', hint: 'O app em 30s' },
  { id: 2, label: 'NEXT Lab', hint: 'Quem faz' },
  { id: 3, label: 'Academia', hint: 'A sua marca' },
  { id: 4, label: 'Admin', hint: 'Acesso seguro' },
  { id: 5, label: 'Licença', hint: 'Activação' },
  { id: 6, label: 'Pronto', hint: 'Começar' },
];

const inputClass =
  'w-full h-11 px-3.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-input)] ' +
  'text-[14px] font-medium text-[var(--text-primary)] outline-none transition ' +
  'placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary)] focus:bg-[var(--bg-surface)] ' +
  'focus:shadow-[0_0_0_3px_var(--shadow-primary-focus)]';

function TipCard({ icon, title, text, color }: { icon: React.ReactNode; title: string; text: string; color: string }) {
  return (
    <div
      className="flex gap-3 rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--bg-surface)] p-3 text-left"
      style={{ boxShadow: `inset 3px 0 0 ${color}` }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: `color-mix(in srgb, ${color} 14%, var(--bg-surface))`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-bold nl-text">{title}</p>
        <p className="mt-0.5 text-[12px] font-medium leading-snug nl-text-muted">{text}</p>
      </div>
    </div>
  );
}

export default function InitialSetupPage({ model }: { model: unknown }) {
  const {
    appLogo,
    setupStep,
    setupData,
    setupLicenseInfo,
    setupError,
    electron,
    setAppLogo,
    setSetupData,
    setSetupStep,
    saltarSetupDesenvolvedor,
    proximoPassoSetup,
    finalizarSetupTotal,
  } = model;

  const logo = appLogo || APP_ICON_PATH;
  const stepMeta = STEPS.find((s) => s.id === setupStep) || STEPS[0];

  useEffect(() => {
    void electron?.ipcRenderer?.invoke?.('window:resize', 760, 680, false);
  }, [electron]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden p-3 sm:p-5" style={{ background: 'var(--bg-app)' }}>
      {/* Bolinhas de fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -right-24 -top-20 h-80 w-80 rounded-full opacity-40"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 28%, transparent)' }}
        />
        <div
          className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full opacity-35"
          style={{ background: 'color-mix(in srgb, var(--color-success) 22%, transparent)' }}
        />
        <div
          className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full opacity-25"
          style={{ background: 'color-mix(in srgb, #D97706 18%, transparent)' }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 h-28 w-28 rounded-full opacity-30"
          style={{ background: 'color-mix(in srgb, #7C3AED 16%, transparent)' }}
        />
      </div>

      <div
        className="relative flex h-full max-h-[640px] w-full max-w-[720px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] animate-scale-in"
        style={{ boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-primary) 14%, transparent), 0 24px 64px rgba(0,0,0,0.14)' }}
      >
        {/* Hero */}
        <div
          className="relative shrink-0 overflow-hidden border-b border-[var(--border-light)] px-5 py-4"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, var(--bg-surface)) 0%, var(--bg-surface) 70%)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full opacity-30"
            style={{ background: 'var(--color-primary)' }}
          />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-white/70 bg-white p-1.5 shadow-sm">
              <img src={logo} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-[var(--color-primary)]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                  Instalação · Next Level
                </p>
              </div>
              <h1 className="mt-0.5 text-[17px] font-bold tracking-tight nl-text">
                {stepMeta.label}
                <span className="ml-2 text-[12px] font-semibold nl-text-muted">· {stepMeta.hint}</span>
              </h1>
            </div>
            <p className="shrink-0 text-[12px] font-semibold tabular-nums nl-text-muted">
              {setupStep}/6
            </p>
          </div>

          {/* Progresso por passos */}
          <div className="relative mt-4 flex gap-1.5">
            {STEPS.map((s) => {
              const done = setupStep > s.id;
              const active = setupStep === s.id;
              return (
                <div key={s.id} className="min-w-0 flex-1">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      background: done || active
                        ? 'var(--color-primary)'
                        : 'var(--border)',
                      opacity: active ? 1 : done ? 0.7 : 1,
                    }}
                  />
                  <p
                    className={`mt-1 hidden truncate text-[9px] font-bold uppercase tracking-wider sm:block ${
                      active ? 'text-[var(--color-primary)]' : 'nl-text-muted'
                    }`}
                  >
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conteúdo do passo */}
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-5 py-5 sm:px-8">
          {setupStep === 1 && (
            <div className="flex h-full flex-col animate-slide-up">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[16px] border border-[var(--border)] bg-white p-2 shadow-sm">
                  <img src={logo} alt="" className="h-full w-full object-contain" />
                </div>
                <h2 className="text-[22px] font-bold tracking-tight nl-text">
                  Bem-vindo ao <span className="text-[var(--color-primary)]">Next Level</span>
                </h2>
                <p className="mx-auto mt-1.5 max-w-md text-[13px] font-medium leading-relaxed nl-text-muted">
                  Em poucos minutos configura a academia e fica a conhecer o essencial do sistema.
                </p>
              </div>
              <div className="space-y-2">
                <TipCard
                  icon={<Users size={16} />}
                  color="#2563EB"
                  title="Alunos"
                  text="Matricule, filtre por mês e acompanhe quem está em dia ou em atraso."
                />
                <TipCard
                  icon={<Wallet size={16} />}
                  color="#16A34A"
                  title="Cobrança"
                  text="Registe pagamentos em segundos. O motor de ciclos calcula a cobertura real."
                />
                <TipCard
                  icon={<FileBarChart size={16} />}
                  color="#c64600"
                  title="Relatórios"
                  text="No fim do mês, exporte PDF ou Excel com um clique na barra superior."
                />
              </div>
              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={saltarSetupDesenvolvedor}
                  className="mt-4 text-center text-[11px] font-bold uppercase tracking-widest nl-text-muted hover:text-[var(--text-primary)]"
                >
                  [ Ignorar setup — modo desenvolvedor ]
                </button>
              )}
            </div>
          )}

          {setupStep === 2 && (
            <div className="flex h-full flex-col items-stretch justify-center space-y-4 animate-slide-up">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[14px] bg-[var(--color-primary)] text-white shadow-md">
                  <Sparkles size={26} />
                </div>
                <h2 className="text-[20px] font-bold nl-text">Feito pela {COMPANY_NAME}</h2>
                <p className="mx-auto mt-1.5 max-w-sm text-[13px] font-medium leading-relaxed nl-text-muted">
                  Software para negócios em Cabo Verde — offline, rápido e pensado para o dia-a-dia da academia.
                </p>
                <p className="mt-2 text-[12px] font-semibold nl-text">{COMPANY_AUTHOR}</p>
              </div>
              <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--color-secondary-lighter)]/40 p-4">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-left hover:bg-[var(--bg-surface)]"
                  onClick={() => electron?.ipcRenderer.invoke('open-external', `mailto:${COMPANY_EMAIL}`)}
                >
                  <Mail size={16} className="text-[var(--color-primary)]" />
                  <span className="text-[13px] font-medium nl-text">{COMPANY_EMAIL}</span>
                </button>
                <div className="flex items-center gap-3 px-2 py-2">
                  <Phone size={16} className="text-[var(--color-primary)]" />
                  <span className="text-[13px] font-medium nl-text">{COMPANY_PHONE}</span>
                </div>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-left hover:bg-[var(--bg-surface)]"
                  onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)}
                >
                  <ExternalLink size={16} className="text-[var(--color-primary)]" />
                  <span className="text-[13px] font-medium nl-text">linktr.ee/next.lab</span>
                </button>
              </div>
              <TipCard
                icon={<Shield size={16} />}
                color="#0D9488"
                title="Os seus dados ficam no PC"
                text="Tudo é guardado localmente. Não precisa de internet para trabalhar."
              />
            </div>
          )}

          {setupStep === 3 && (
            <div className="space-y-4 animate-slide-up">
              <div>
                <h2 className="text-[18px] font-bold nl-text">A sua academia</h2>
                <p className="mt-1 text-[13px] font-medium nl-text-muted">
                  Estes dados aparecem no login, nos PDFs e no cabeçalho do sistema.
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--color-secondary-lighter)]/35 p-3.5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[var(--border)] bg-white p-1.5">
                  <img src={logo} className="h-full w-full object-contain" alt="Logo" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold nl-text">Logótipo (opcional)</p>
                  <p className="mt-0.5 text-[11px] nl-text-muted">PNG, JPEG ou SVG · fundo transparente</p>
                  <input
                    type="file"
                    id="setup-logo-upload"
                    className="hidden"
                    accept="image/svg+xml,image/png,image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string;
                        setAppLogo(result);
                        localStorage.setItem('nl_app_logo', result);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('setup-logo-upload')?.click()}
                    className="nl-btn nl-btn-secondary mt-2 !h-8 !px-3 !text-[11px]"
                  >
                    Carregar logo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">Nome da academia *</label>
                  <input
                    type="text"
                    value={setupData.nomeAcademia}
                    onChange={(e) => setSetupData({ ...setupData, nomeAcademia: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: Master Gym"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">Email institucional *</label>
                  <input
                    type="email"
                    value={setupData.email}
                    onChange={(e) => setSetupData({ ...setupData, email: e.target.value })}
                    className={inputClass}
                    placeholder="contacto@academia.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">Telefone *</label>
                  <input
                    type="text"
                    value={setupData.telefone}
                    onChange={(e) => setSetupData({ ...setupData, telefone: e.target.value })}
                    className={inputClass}
                    placeholder="+238 …"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">Morada (opcional)</label>
                  <input
                    type="text"
                    value={setupData.morada}
                    onChange={(e) => setSetupData({ ...setupData, morada: e.target.value })}
                    className={inputClass}
                    placeholder="Rua, bairro, cidade"
                  />
                </div>
              </div>
              <TipCard
                icon={<Landmark size={16} />}
                color="#2563EB"
                title="Dica"
                text="Pode alterar estes dados depois em Ajustes → Academia."
              />
            </div>
          )}

          {setupStep === 4 && (
            <div className="space-y-4 animate-slide-up">
              <div>
                <h2 className="text-[18px] font-bold nl-text">Conta de administrador</h2>
                <p className="mt-1 text-[13px] font-medium nl-text-muted">
                  Este utilizador gere alunos, cobranças, relatórios e backups. Guarde a senha em local seguro.
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">Email do admin *</label>
                  <input
                    type="email"
                    value={setupData.adminEmail}
                    onChange={(e) => setSetupData({ ...setupData, adminEmail: e.target.value })}
                    className={inputClass}
                    placeholder="admin@academia.com"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">Senha *</label>
                    <input
                      type="password"
                      value={setupData.adminSenha}
                      onChange={(e) => setSetupData({ ...setupData, adminSenha: e.target.value })}
                      className={inputClass}
                      placeholder="Mín. 6 caracteres"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">Confirmar senha *</label>
                    <input
                      type="password"
                      value={setupData.confirmarSenha}
                      onChange={(e) => setSetupData({ ...setupData, confirmarSenha: e.target.value })}
                      className={inputClass}
                      placeholder="Repetir senha"
                    />
                  </div>
                </div>
              </div>
              <TipCard
                icon={<Users size={16} />}
                color="#16A34A"
                title="Depois pode criar operadores"
                text="Em Ajustes → Utilizadores adiciona contas com menos permissões para a recepção."
              />
            </div>
          )}

          {setupStep === 5 && (
            <div className="space-y-4 animate-slide-up">
              <div>
                <h2 className="text-[18px] font-bold nl-text">Activar licença</h2>
                <p className="mt-1 text-[13px] font-medium leading-relaxed nl-text-muted">
                  Cole o código fornecido pela NEXT Lab. Sem licença válida o app não arranca em produção.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">Código de licença *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={setupData.licenca}
                    onChange={(e) => setSetupData({ ...setupData, licenca: e.target.value.toUpperCase() })}
                    className={`${inputClass} h-12 font-mono tracking-widest`}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                  />
                  {setupLicenseInfo && (
                    <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 size={16} />
                      <span className="text-[11px] font-bold uppercase">Válida</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[12px] nl-text-muted">
                Precisa de licença? Escreva para{' '}
                <button
                  type="button"
                  className="font-semibold text-[var(--color-primary)] hover:underline"
                  onClick={() => electron?.ipcRenderer.invoke('open-external', `mailto:${COMPANY_EMAIL}`)}
                >
                  {COMPANY_EMAIL}
                </button>
              </p>
            </div>
          )}

          {setupStep === 6 && (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center animate-slide-up">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h2 className="text-[22px] font-bold tracking-tight nl-text">Tudo pronto!</h2>
                <p className="mt-1 text-[14px] font-medium nl-text-muted">
                  Bem-vindo, <strong className="nl-text">{setupData.nomeAcademia || 'academia'}</strong>
                </p>
              </div>
              <div className="w-full space-y-2 text-left">
                <TipCard icon={<Users size={15} />} color="#2563EB" title="1. Matricular" text="Use o botão azul Matricular na barra superior." />
                <TipCard icon={<Wallet size={15} />} color="#16A34A" title="2. Cobrar" text="Na lista de alunos, toque no estado de pagamento." />
                <TipCard icon={<FileBarChart size={15} />} color="#c64600" title="3. Exportar" text="Em Relatórios, o botão laranja Exportar gera PDF ou Excel." />
                <TipCard icon={<Shield size={15} />} color="#0D9488" title="4. Backup" text="Em Ajustes → Dados & Backup, exporte um ZIP com regularidade." />
              </div>
              {(setupLicenseInfo?.tipo || setupLicenseInfo?.dataExpiracao) && (
                <p className="text-[11px] nl-text-muted">
                  Licença: <strong className="nl-text">{setupLicenseInfo?.tipo || '—'}</strong>
                  {setupLicenseInfo?.dataExpiracao ? ` · até ${setupLicenseInfo.dataExpiracao}` : ''}
                </p>
              )}
            </div>
          )}

          {setupError && (
            <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-control)] border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-700">
              <AlertTriangle size={15} className="shrink-0" />
              {setupError}
            </div>
          )}
        </div>

        {/* Rodapé de navegação */}
        <div className="flex shrink-0 items-center justify-between border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 px-5 py-3.5">
          <button
            type="button"
            onClick={() => setupStep > 1 && setSetupStep((prev) => prev - 1)}
            className={`inline-flex h-10 items-center gap-1 text-[13px] font-bold nl-text-muted transition hover:text-[var(--text-primary)] ${
              setupStep === 1 || setupStep === 6 ? 'invisible' : ''
            }`}
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          {setupStep < 6 ? (
            <button
              type="button"
              onClick={proximoPassoSetup}
              className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] px-6 text-[13px] font-bold text-white transition hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #3584e4 0%, #1c71d8 100%)',
                boxShadow: '0 6px 16px color-mix(in srgb, #3584e4 35%, transparent)',
              }}
            >
              {setupStep === 1 ? 'Começar' : 'Continuar'}
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={finalizarSetupTotal}
              className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] px-6 text-[13px] font-bold text-white transition hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                boxShadow: '0 6px 16px color-mix(in srgb, #16a34a 35%, transparent)',
              }}
            >
              Abrir a aplicação
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
