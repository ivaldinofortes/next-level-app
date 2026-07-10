import React, { useMemo } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileBarChart,
  FileSpreadsheet,
  ImagePlus,
  StickyNote,
  Users,
  Wallet,
} from 'lucide-react';
import {
  formatCve,
  formatPtDate,
  parseFlexibleDate,
} from '../lib/billing';
import { getAlunoIniciais, getAvatarColorByName } from '../utils/formatting';

const normalizeDateLabel = (value?: string) => {
  const date = parseFlexibleDate(value || '');
  if (!date) return 'Sem data';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  if (sameDay(date, today)) return 'Hoje';
  if (sameDay(date, yesterday)) return 'Ontem';
  return formatPtDate(date);
};

interface NotaRecente {
  id: number;
  aluno_id: string;
  nome?: string;
  texto: string;
  data_criacao: string;
}

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
  notasRecentes: NotaRecente[];
  onUploadBanner: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  novosInscritosRecentes,
  abrirPerfilAluno,
  notasRecentes,
  onUploadBanner,
}) => {
  const alunosEmDia = Math.max(alunosAtivos.length - alunosEmDivida.length, 0);
  const coberturaPercentual = alunosAtivos.length > 0 ? Math.round((alunosEmDia / alunosAtivos.length) * 100) : 100;
  const horaAtual = agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const dataAtual = agora.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' });
  const alunoPorId = useMemo(() => new Map(alunos.map((aluno) => [aluno.id, aluno])), [alunos]);

  const focoOperacional = alunosEmDivida.length > 0
    ? { title: 'Cobranças em atraso', body: `${alunosEmDivida.length} aluno(s), ${formatCve(previsaoRecuperacao)} por recuperar.`, label: 'Ver cobranças', action: () => { setAba('gestao'); setFiltroStatus('divida'); }, tone: 'text-red-700 bg-red-50 border-red-100', icon: <AlertCircle size={18} /> }
    : alunosImportados.length > 0
      ? { title: 'Importações por rever', body: `${alunosImportados.length} aluno(s) aguardam validação.`, label: 'Rever lista', action: () => { setAba('gestao'); setFiltroStatus('importados'); }, tone: 'text-blue-700 bg-blue-50 border-blue-100', icon: <FileSpreadsheet size={18} /> }
      : relatorioMensalDisponivel
        ? { title: 'Relatório disponível', body: `${relatorioMensalDisponivel} pronto para consulta.`, label: 'Abrir relatório', action: () => setAba('relatorios_detalhado'), tone: 'text-amber-700 bg-amber-50 border-amber-100', icon: <FileBarChart size={18} /> }
        : { title: 'Operação controlada', body: 'Sem pendências críticas neste momento.', label: 'Ver alunos', action: () => { setAba('gestao'); setFiltroStatus('todos'); }, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={18} /> };

  const indicadores = [
    { label: 'Alunos ativos', value: String(alunosAtivos.length), sub: `${alunos.length} no sistema`, icon: <Users size={16} />, tone: 'bg-sky-50 border-sky-100 text-sky-800' },
    { label: 'Em dia', value: `${coberturaPercentual}%`, sub: `${alunosEmDia}/${alunosAtivos.length || 0} cobertos`, icon: <CheckCircle2 size={16} />, tone: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
    { label: 'Recebido', value: formatCve(totalRecebidoPeriodo), sub: 'Período atual', icon: <Wallet size={16} />, tone: 'bg-indigo-50 border-indigo-100 text-indigo-800' },
    { label: 'A recuperar', value: formatCve(previsaoRecuperacao), sub: `${alunosEmDivida.length} pendência(s)`, icon: <AlertCircle size={16} />, tone: alunosEmDivida.length > 0 ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-slate-50 border-slate-100 text-slate-700' },
  ];

  const atalhos = [
    { label: 'Cobranças', icon: <Wallet size={20} />, action: () => { setAba('gestao'); setFiltroStatus('divida'); }, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { label: 'Ajustes', icon: <CalendarDays size={20} />, action: () => setAba('configuracoes'), tone: 'bg-slate-50 text-slate-700 border-slate-200' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar bg-[#F5F7FA]">
      <section className="relative min-h-[230px] w-full overflow-hidden border-b border-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
        <input
          id="home-banner-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onUploadBanner}
        />
        <img
          src={bannerAcademia || DEFAULT_ACADEMY_BANNER}
          alt="Banner da academia"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/18" />
        <button
          type="button"
          onClick={() => document.getElementById('home-banner-upload')?.click()}
          className="absolute right-5 top-5 z-10 inline-flex h-10 items-center gap-2 rounded-[var(--radius-surface)] border border-white/25 bg-white/28 px-3 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[0_10px_28px_rgba(15,23,42,0.18)] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/45"
          title="Alterar imagem do banner"
        >
          <ImagePlus size={15} strokeWidth={2.7} />
          Alterar imagem
        </button>

        <div className="relative mx-auto flex min-h-[230px] max-w-[1180px] items-center justify-between gap-5 px-5 py-7 lg:px-7">
          <div className="flex min-w-0 items-center gap-4 drop-shadow-[0_12px_18px_rgba(15,23,42,0.45)]">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-surface)] border border-white/35 bg-white/88 p-3 shadow-[0_14px_34px_rgba(0,0,0,0.20)]">
              <img src={appLogo || APP_ICON_PATH} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 text-white">
              <p className="text-[13px] font-black text-white/90">Seja bem vindo.</p>
              <h1 className="mt-1 truncate text-[34px] font-black leading-tight tracking-tight">{nomeAcademia}</h1>
              <p className="mt-1 max-w-[680px] truncate text-[13px] font-semibold text-white/75">{subtituloAcademia}</p>
            </div>
          </div>

          <div className="hidden shrink-0 text-right text-white drop-shadow-[0_12px_18px_rgba(15,23,42,0.45)] sm:block">
            <p className="text-[34px] font-black leading-none tabular-nums">{horaAtual}</p>
            <p className="mt-1 text-[12px] font-bold capitalize text-white/82">{dataAtual}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex min-h-[calc(100%-230px)] max-w-[1180px] flex-col gap-4 px-5 py-5 lg:px-7">
        <section className="grid gap-4 md:grid-cols-4">
          {indicadores.map((item) => (
            <div key={item.label} className={`rounded-[var(--radius-control)] border px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${item.tone}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="opacity-65">{item.icon}</span>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-55">{item.label}</p>
              </div>
              <p className="mt-2 truncate text-[22px] font-black leading-tight tabular-nums">{item.value}</p>
              <p className="mt-1 truncate text-[11px] font-semibold opacity-65">{item.sub}</p>
            </div>
          ))}
        </section>

        <section className="flex items-start gap-6 rounded-[var(--radius-control)] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
          <div className="flex gap-4">
            {atalhos.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="group flex w-[82px] flex-col items-center gap-2 text-center"
              >
                <span className={`flex h-14 w-14 items-center justify-center rounded-[var(--radius-surface)] border shadow-sm transition-transform group-hover:-translate-y-0.5 ${item.tone}`}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-2 grid gap-5 lg:grid-cols-3">
          <div className={`flex aspect-square flex-col overflow-hidden rounded-[var(--radius-control)] border p-5 shadow-[0_10px_26px_rgba(15,23,42,0.06)] ${focoOperacional.tone}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">Prioridade</p>
                <h2 className="mt-1 text-[19px] font-black tracking-tight">{focoOperacional.title}</h2>
              </div>
              {focoOperacional.icon}
            </div>
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <p className="text-[12px] font-semibold leading-relaxed opacity-75">{focoOperacional.body}</p>
            </div>
            <button
              type="button"
              onClick={focoOperacional.action}
              className="mt-4 inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-[var(--radius-compact)] bg-white/85 px-4 text-[11px] font-black uppercase tracking-[0.12em] shadow-sm transition-colors hover:bg-white"
            >
              {focoOperacional.label} <ChevronRight size={13} />
            </button>
          </div>

          <div className="flex aspect-square flex-col overflow-hidden rounded-[var(--radius-control)] border border-slate-200 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Movimento recente</p>
                <h2 className="mt-1 text-[19px] font-black tracking-tight text-slate-950">Novos alunos</h2>
              </div>
              <CalendarDays size={20} className="text-slate-300" />
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <div className="divide-y divide-slate-100">
                  {novosInscritosRecentes.map((aluno, index) => {
                    const dataMatricula = parseFlexibleDate(aluno.data_matricula);
                    return (
                      <button key={aluno.id || aluno.nome} type="button" onClick={() => abrirPerfilAluno(aluno)} className="flex w-full items-center gap-3 py-2.5 text-left first:pt-0 last:pb-0">
                        <div className="relative shrink-0">
                          <div className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-[11px] font-black text-white ${getAvatarColorByName(aluno.nome)}`}>
                            {aluno.foto_path ? <img src={`local-resource://${aluno.foto_path}`} className="h-full w-full object-cover" /> : getAlunoIniciais(aluno)}
                          </div>
                          {index === 0 && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-sm" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-black text-slate-900">{aluno.nome}</p>
                          <p className="truncate text-[10px] font-semibold text-slate-400">{dataMatricula ? formatPtDate(dataMatricula) : 'Sem data'}</p>
                        </div>
                      </button>
                    );
                  })}
                  {novosInscritosRecentes.length === 0 && <p className="py-6 text-[12px] font-semibold text-slate-400">Sem entradas recentes.</p>}
                </div>
            </div>
          </div>

          <div className="flex aspect-square rotate-[-0.25deg] flex-col overflow-hidden rounded-[var(--radius-control)] border border-amber-200 bg-[#FFF6B8] p-5 shadow-[0_12px_26px_rgba(180,83,9,0.12)]">
            <div className="flex shrink-0 items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700/60">Post-it</p>
                <h2 className="mt-1 text-[19px] font-black tracking-tight text-amber-950">Notas</h2>
              </div>
              <StickyNote size={21} className="text-amber-700/70" />
            </div>
            <div className="mt-4 min-h-0 flex-1 divide-y divide-amber-900/10 overflow-y-auto pr-1 custom-scrollbar">
                  {notasRecentes.map((nota, index) => {
                    const aluno = alunoPorId.get(nota.aluno_id);
                    return (
                      <button key={nota.id} type="button" onClick={() => aluno && abrirPerfilAluno(aluno)} className="relative w-full py-2.5 pl-4 text-left first:pt-0 last:pb-0">
                        {index === 0 && <span className="absolute left-0 top-3 h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]" />}
                        <p className="truncate text-[12px] font-black text-slate-900">{nota.nome || aluno?.nome || 'Aluno sem nome'}</p>
                        <p className="line-clamp-1 text-[11px] font-semibold text-slate-500">{nota.texto}</p>
                        <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-300">{normalizeDateLabel(nota.data_criacao)}</p>
                      </button>
                    );
                  })}
                  {notasRecentes.length === 0 && (
                    <div className="py-6 text-[12px] font-semibold text-amber-900/60">
                      Sem notas recentes.
                    </div>
                  )}
                </div>
          </div>
        </section>
      </div>
    </div>
  );
});

export default HomePage;
