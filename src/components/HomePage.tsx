import React from 'react';
import {
  CheckCircle2,
  UserPlus,
  Users,
  Wallet,
  FileSpreadsheet,
  FileBarChart,
  Settings,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  formatCve,
  formatPtDate,
  parseFlexibleDate,
} from '../lib/billing';

const getAlunoIniciais = (aluno?: { nome?: string } | null) => {
  const nome = String(aluno?.nome || '').trim();
  return (nome || 'Aluno sem nome').slice(0, 2).toUpperCase();
};

const getAvatarColorByName = (nome?: string) => {
  const avatarColors = [
    'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-indigo-500',
  ];
  return avatarColors[(String(nome || 'A').charCodeAt(0) || 65) % avatarColors.length];
};

const formatInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface HomePageProps {
  bannerAcademia: string;
  DEFAULT_ACADEMY_BANNER: string;
  appLogo: string;
  APP_ICON_PATH: string;
  nomeAcademia: string;
  subtituloAcademia: string;
  agora: Date;
  alunosAtivos: { aluno: any; resumo: any }[];
  alunosEmDivida: { aluno: any; resumo: any }[];
  totalRecebidoPeriodo: number;
  alunos: any[];
  previsaoRecuperacao: number;
  alunosImportados: any[];
  relatorioMensalDisponivel: string;
  setAba: (aba: string) => void;
  setFiltroStatus: (status: string) => void;
  setMostrarForm: (v: boolean) => void;
  setMostrarImportar: (v: boolean) => void;
  setNovoAluno: (aluno: any) => void;
  novoAlunoDefault: any;
  hojeReferencia: Date;
  prepararAcaoOperacionalNoMesAtual: () => void;
  novosInscritosRecentes: any[];
  abrirPerfilAluno: (aluno: any) => void;
}

const HomePage: React.FC<HomePageProps> = React.memo(({
  bannerAcademia,
  DEFAULT_ACADEMY_BANNER,
  appLogo,
  APP_ICON_PATH,
  nomeAcademia,
  subtituloAcademia,
  agora,
  alunosAtivos,
  alunosEmDivida,
  totalRecebidoPeriodo,
  alunos,
  previsaoRecuperacao,
  alunosImportados,
  relatorioMensalDisponivel,
  setAba,
  setFiltroStatus,
  setMostrarForm,
  setMostrarImportar,
  setNovoAluno,
  novoAlunoDefault,
  hojeReferencia,
  prepararAcaoOperacionalNoMesAtual,
  novosInscritosRecentes,
  abrirPerfilAluno,
}) => {
  return (
    <div className="animate-slide-up h-full w-full overflow-y-auto custom-scrollbar">
      <div className="mx-auto flex min-h-full max-w-[1220px] flex-col justify-center px-6 py-7 gap-5">

        {/* ═══════ BANNER ═══════ */}
        <div className="relative rounded-[var(--radius-lg)] overflow-hidden">
          <img src={bannerAcademia || DEFAULT_ACADEMY_BANNER} alt="Banner" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />

          <div className="relative z-10 p-6 pb-5" style={{ minHeight: '220px' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-white/15 backdrop-blur-md border border-white/20 p-2.5">
                  <img src={appLogo || APP_ICON_PATH} alt="Logo" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.28em] text-white/45">Início · Gestão local</p>
                  <h1 className="mt-1.5 truncate text-[30px] font-black leading-none tracking-tight text-white">{nomeAcademia}</h1>
                  <p className="mt-2 max-w-[600px] truncate text-[13px] font-semibold text-white/65">{subtituloAcademia}</p>
                </div>
              </div>

              <div className="text-right text-white shrink-0 hidden sm:block">
                <p className="text-[30px] font-black leading-none tabular-nums">
                  {agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
                  {agora.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Ativos', value: alunosAtivos.length, icon: <Users size={13} />, tone: 'text-white' },
                  { label: 'Em atraso', value: alunosEmDivida.length, icon: <AlertCircle size={13} />, tone: alunosEmDivida.length > 0 ? 'text-red-300' : 'text-emerald-300' },
                  { label: 'Recebido', value: formatCve(totalRecebidoPeriodo), icon: <Wallet size={13} />, tone: 'text-emerald-300' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[var(--radius-sm)] border border-white/15 bg-black/25 backdrop-blur-md px-3.5 py-2.5 min-w-[130px]">
                    <div className="flex items-center gap-1.5 text-white/45 mb-1">
                      {item.icon}
                      <span className="text-[8px] font-black uppercase tracking-[0.16em]">{item.label}</span>
                    </div>
                    <p className={`text-[20px] font-black leading-none tabular-nums ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[var(--radius-sm)] border border-white/15 bg-white/10 backdrop-blur-md px-3.5 py-2.5 text-right">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/45">Estado</p>
                <p className="mt-0.5 text-[12px] font-black text-white flex items-center gap-1.5 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Pronto para operar
                </p>
                <p className="text-[9px] font-semibold text-white/50">Dados guardados localmente</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ AÇÕES RÁPIDAS ═══════ */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Ações rápidas</p>
              <h2 className="mt-1 text-[20px] font-black tracking-tight nl-text">O que deseja fazer?</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
              <CheckCircle2 size={12} />
              Sistema ativo
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              { label: 'Matricular', hint: 'Novo aluno', icon: <UserPlus size={18} />, color: 'bg-blue-50 text-blue-700 border-blue-200', iconBg: 'bg-blue-600 text-white', action: () => { prepararAcaoOperacionalNoMesAtual(); setNovoAluno({ ...novoAlunoDefault, data_matricula: formatInputDate(hojeReferencia) }); setMostrarForm(true); } },
              { label: 'Alunos', hint: `${alunos.length} registos`, icon: <Users size={18} />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', iconBg: 'bg-indigo-600 text-white', action: () => { setAba('gestao'); setFiltroStatus('todos'); } },
              { label: 'Cobranças', hint: alunosEmDivida.length > 0 ? `${alunosEmDivida.length} em atraso` : 'Sem atraso', icon: <Wallet size={18} />, color: alunosEmDivida.length > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200', iconBg: alunosEmDivida.length > 0 ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white', action: () => { setAba('gestao'); setFiltroStatus('divida'); } },
              { label: 'Importar', hint: 'Excel limpo', icon: <FileSpreadsheet size={18} />, color: 'bg-teal-50 text-teal-700 border-teal-200', iconBg: 'bg-teal-600 text-white', action: () => setMostrarImportar(true) },
              { label: 'Relatório', hint: relatorioMensalDisponivel ? 'Disponível' : 'Mensal', icon: <FileBarChart size={18} />, color: 'bg-amber-50 text-amber-700 border-amber-200', iconBg: 'bg-amber-600 text-white', action: () => setAba('relatorios_detalhado') },
              { label: 'Ajustes', hint: 'Sistema', icon: <Settings size={18} />, color: 'bg-slate-50 text-slate-700 border-slate-200', iconBg: 'bg-slate-700 text-white', action: () => setAba('configuracoes') },
            ].map((item) => (
              <button key={item.label} type="button" onClick={item.action} className={`group flex min-h-[96px] flex-col justify-between rounded-[var(--radius-md)] border-2 p-3.5 text-left transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-md)] active:translate-y-0 ${item.color}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md ${item.iconBg}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[12px] font-black">{item.label}</p>
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] opacity-55">{item.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ═══════ ALERTAS + ÚLTIMA ENTRADA ═══════ */}
        <div className="grid gap-4 md:grid-cols-[1fr_300px]">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Atenção hoje</p>
            <div className="mt-3 space-y-2.5">
              {[
                relatorioMensalDisponivel ? {
                  icon: <FileBarChart size={15} />,
                  title: `Relatório de ${relatorioMensalDisponivel} disponível`,
                  body: 'Dossier pronto para exportar.',
                  action: () => setAba('relatorios_detalhado'),
                  label: 'Ver',
                  accent: 'border-l-2 border-l-amber-400',
                } : null,
                alunosImportados.length > 0 ? {
                  icon: <FileSpreadsheet size={15} />,
                  title: `${alunosImportados.length} aluno(s) importado(s) aguardam revisão`,
                  body: 'Confirme os dados antes de ativar cobranças.',
                  action: () => { setAba('gestao'); setFiltroStatus('importados'); },
                  label: 'Rever',
                  accent: 'border-l-2 border-l-blue-400',
                } : null,
                alunosEmDivida.length > 0 ? {
                  icon: <AlertCircle size={15} />,
                  title: `${alunosEmDivida.length} aluno(s) em atraso`,
                  body: `${formatCve(previsaoRecuperacao)} por recuperar.`,
                  action: () => { setAba('gestao'); setFiltroStatus('divida'); },
                  label: 'Cobrar',
                  accent: 'border-l-2 border-l-red-400',
                } : null,
              ].filter(Boolean).slice(0, 3).map((item: any) => (
                <button key={item.title} type="button" onClick={item.action} className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/30 px-4 py-3 text-left hover:bg-[var(--color-secondary-lighter)]/60 transition-all ${item.accent}`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-white text-[var(--color-primary)] shadow-sm">{item.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-black nl-text">{item.title}</p>
                    <p className="truncate text-[10px] font-semibold nl-text-muted">{item.body}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--color-primary)] shrink-0">{item.label}</span>
                </button>
              ))}
              {!relatorioMensalDisponivel && alunosImportados.length === 0 && alunosEmDivida.length === 0 && (
                <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                  <CheckCircle2 size={16} />
                  <div>
                    <p className="text-[12px] font-black">Tudo controlado</p>
                    <p className="text-[10px] font-semibold opacity-75">Sem alertas operacionais neste momento.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Última entrada</p>
            {novosInscritosRecentes[0] ? (() => {
              const aluno = novosInscritosRecentes[0];
              const dataMatricula = parseFlexibleDate(aluno.data_matricula);
              const avatarBg = getAvatarColorByName(aluno.nome);
              return (
                <button type="button" onClick={() => abrirPerfilAluno(aluno)} className="mt-3 flex w-full items-center gap-3.5 rounded-[var(--radius-sm)] border-2 border-[var(--border-light)] px-4 py-4 text-left hover:bg-[var(--color-secondary-lighter)]/30 hover:border-[var(--color-primary)]/30 transition-all group">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-[14px] font-black text-white shadow-md ring-2 ring-white/60 ${avatarBg}`}>
                    {aluno.foto_path ? <img src={`local-resource://${aluno.foto_path}`} className="h-full w-full object-cover" /> : getAlunoIniciais(aluno)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black nl-text group-hover:text-[var(--color-primary)] transition-colors">{aluno.nome}</p>
                    <p className="text-[10px] font-semibold nl-text-muted">{dataMatricula ? formatPtDate(dataMatricula) : 'Sem data'} <span className="mx-1">·</span> {aluno.categoria || 'Geral'}</p>
                  </div>
                  <ChevronRight size={14} className="nl-text-muted shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              );
            })() : (
              <div className="mt-3 flex flex-col items-center justify-center py-8 text-center">
                <Users size={28} className="nl-text-muted mb-2 opacity-40" />
                <p className="text-[12px] font-semibold nl-text-muted">Ainda sem alunos registados.</p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAba('relatorios_detalhado')} className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.12em] nl-text-muted hover:bg-[var(--color-secondary-lighter)] transition-colors">
                <FileBarChart size={13} className="inline mr-1.5 -mt-0.5" />
                Relatório
              </button>
              <button type="button" onClick={() => setAba('configuracoes')} className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.12em] nl-text-muted hover:bg-[var(--color-secondary-lighter)] transition-colors">
                <Settings size={13} className="inline mr-1.5 -mt-0.5" />
                Ajustes
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

export default HomePage;
