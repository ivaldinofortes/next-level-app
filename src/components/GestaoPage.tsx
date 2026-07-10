import { memo, useEffect, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, LayoutList, AlertCircle,
  CheckCircle2, FileSpreadsheet, ChevronDown, ArrowUpDown, Zap,
  Clock, Search, X, BookUser, Shield, Users, StickyNote, BarChart3,
} from 'lucide-react';
import { formatCve } from '../lib/billing';
import type { MonthlyBillingSummary } from '../lib/billing';
import {
  isFutureMonth,
  getTimelineMetricWidth,
  getTimelineMetricBarClass,
  getAlunoIniciais,
  getAlunoNomeSeguro,
} from '../utils/formatting';
import { MONTH_OPTIONS, STUDENT_STATUS_HELPERS } from '../constants';
import type { StudentSortMode, Student } from '../types';

interface HistoricoMensalItem {
  aluno: Student;
  resumo: MonthlyBillingSummary;
  dataMatricula: Date | null;
  entrouNesteMes: boolean;
  origem: string;
}

interface ResumoFinanceiroItem {
  aluno: Student;
  resumo: MonthlyBillingSummary;
}

export interface GestaoPageProps {
  larguraListas: number;
  mostrarFiltroListaAlunos: boolean;
  setMostrarFiltroListaAlunos: Dispatch<SetStateAction<boolean>>;
  mostrarCalendarioMeses: boolean;
  setMostrarCalendarioMeses: Dispatch<SetStateAction<boolean>>;
  periodoAtualSelecionado: boolean;
  periodoSelecionadoLabel: string;
  subtituloPeriodoSelecionado: string;
  historicoMensalFiltrado: HistoricoMensalItem[];
  alunosNovosNoPeriodo: HistoricoMensalItem[];
  anoFinanceiro: number;
  setAnoFinanceiro: Dispatch<SetStateAction<number>>;
  anoAtual: number;
  mesFinanceiro: string;
  setMesFinanceiro: (v: string) => void;
  hojeReferencia: Date;
  periodoSelecionadoKey: string;
  filtroStatus: 'todos' | 'divida' | 'cobertos' | 'importados';
  setFiltroStatus: (v: 'todos' | 'divida' | 'cobertos' | 'importados') => void;
  ordenacaoListaAlunos: StudentSortMode;
  setOrdenacaoListaAlunos: (v: StudentSortMode) => void;
  pesquisa: string;
  setPesquisa: (v: string) => void;
  alunosEmDivida: ResumoFinanceiroItem[];
  alunosImportados: Student[];
  totalRecebidoPeriodo: number;
  previsaoRecuperacao: number;
  progressoPeriodoPercentual: number;
  periodoSelecionadoPassado: boolean;
  diasNoPeriodoSelecionado: number;
  diaProgressoPeriodo: number;
  periodoSelecionadoFuturo: boolean;
  estiloTabelaAlunos: CSSProperties;
  setAlunoPerfil: (v: Student | null) => void;
  irParaMesAtualOperacional: (mostrarAviso?: boolean) => void;
  abrirEdicao: (aluno: Student) => void;
  abrirPerfilAluno: (aluno?: Student | null) => void;
  onEstadoPagamentoClick: (aluno: Student, resumo: MonthlyBillingSummary) => void;
  notasResumo: Record<string, { total: number }>;
  onNotasClick: (aluno: Student) => void;
  finalizarTodosImportados: () => void;
  setAba: (v: string) => void;
}

function GestaoPage({
  larguraListas,
  mostrarFiltroListaAlunos,
  setMostrarFiltroListaAlunos,
  mostrarCalendarioMeses,
  setMostrarCalendarioMeses,
  periodoAtualSelecionado,
  periodoSelecionadoLabel,
  subtituloPeriodoSelecionado,
  historicoMensalFiltrado,
  alunosNovosNoPeriodo,
  anoFinanceiro,
  setAnoFinanceiro,
  anoAtual,
  mesFinanceiro,
  setMesFinanceiro,
  hojeReferencia,
  periodoSelecionadoKey,
  filtroStatus,
  setFiltroStatus,
  ordenacaoListaAlunos,
  setOrdenacaoListaAlunos,
  pesquisa,
  setPesquisa,
  alunosEmDivida,
  alunosImportados,
  totalRecebidoPeriodo,
  previsaoRecuperacao,
  progressoPeriodoPercentual,
  periodoSelecionadoPassado,
  diasNoPeriodoSelecionado,
  diaProgressoPeriodo,
  periodoSelecionadoFuturo,
  estiloTabelaAlunos,
  irParaMesAtualOperacional,
  abrirEdicao,
  abrirPerfilAluno,
  onEstadoPagamentoClick,
  notasResumo,
  onNotasClick,
  finalizarTodosImportados,
}: GestaoPageProps) {

  const [pesquisaAberta, setPesquisaAberta] = useState(Boolean(pesquisa));
  const [reguaFerramentasMinimizada, setReguaFerramentasMinimizada] = useState(false);
  const [mostrarResumoMensal, setMostrarResumoMensal] = useState(false);
  const filtroAtual = filtroStatus === 'todos' ? 'Todos' : filtroStatus === 'divida' ? 'Em dívida' : filtroStatus === 'cobertos' ? 'Cobertos' : 'Importados';
  const ordenacaoAtual = ordenacaoListaAlunos === 'inteligente'
    ? 'Inteligente'
    : ordenacaoListaAlunos === 'alfabetica'
      ? 'A-Z'
      : ordenacaoListaAlunos === 'inscricao_recente'
      ? 'Último inscrito'
      : 'Primeiro inscrito';

  useEffect(() => {
    if (!mostrarFiltroListaAlunos) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMostrarFiltroListaAlunos(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mostrarFiltroListaAlunos, setMostrarFiltroListaAlunos]);
  const resumoMensalFinanceiro = (() => {
    const pagos = historicoMensalFiltrado.filter(({ resumo }) => resumo.status === 'pago');
    const devidos = historicoMensalFiltrado.filter(({ resumo }) => resumo.status === 'atrasado' || resumo.status === 'hoje');
    const outros = Math.max(0, historicoMensalFiltrado.length - pagos.length - devidos.length);
    const previsto = historicoMensalFiltrado.reduce((acc, { aluno }) => acc + Number(String(aluno.plano || '0').replace(/[^\d.-]/g, '') || 0), 0);
    const totalValores = Math.max(1, totalRecebidoPeriodo + previsaoRecuperacao);
    const totalAlunos = Math.max(1, historicoMensalFiltrado.length);

    return {
      pagos,
      devidos,
      outros,
      previsto,
      recebido: totalRecebidoPeriodo,
      devido: previsaoRecuperacao,
      pctPagoAlunos: Math.round((pagos.length / totalAlunos) * 100),
      pctDevidoAlunos: Math.round((devidos.length / totalAlunos) * 100),
      pctOutrosAlunos: Math.round((outros / totalAlunos) * 100),
      pctRecebidoValor: Math.round((totalRecebidoPeriodo / totalValores) * 100),
      pctDevidoValor: Math.round((previsaoRecuperacao / totalValores) * 100),
    };
  })();

  return (
    <div className="animate-slide-up h-full flex flex-col w-full overflow-hidden bg-[#F8FAFC]">
      <div className="sticky top-0 z-20 overflow-visible border-b border-[#D7DCE3] bg-[#F0F3F7]/95 shadow-[0_7px_22px_rgba(15,23,42,0.08)] supports-[backdrop-filter]:backdrop-blur-md">
        {reguaFerramentasMinimizada ? (
          <div className="flex h-10 items-center justify-between px-5">
            <button
              type="button"
              onClick={() => setReguaFerramentasMinimizada(false)}
              className="inline-flex h-7 items-center gap-2 rounded-full bg-white/65 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 ring-1 ring-slate-200/70 hover:bg-blue-50/80 hover:text-blue-700"
              title="Mostrar ferramentas da lista"
            >
              <LayoutList size={13} />
              Ferramentas
              <ChevronDown size={12} className="-rotate-90" />
            </button>
            <span className="hidden text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 sm:block">
              {periodoSelecionadoLabel} · {historicoMensalFiltrado.length} alunos
            </span>
          </div>
        ) : (
        <div className="overflow-visible py-2">
          <div className="flex min-h-[44px] w-full min-w-[1180px] items-center gap-3 px-5">
            <div className="relative z-30 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMostrarFiltroListaAlunos(false);
                  setMostrarCalendarioMeses((prev) => !prev);
                }}
                className={`flex h-10 min-w-[170px] items-center gap-2.5 rounded-[var(--radius-surface)] px-3 text-left transition-colors ${
                  periodoAtualSelecionado ? 'bg-blue-50/80 text-blue-700 ring-1 ring-blue-100/80 hover:bg-blue-50' : 'bg-rose-50/80 text-rose-700 ring-1 ring-rose-100/80 hover:bg-rose-50'
                }`}
                title="Escolher mês e ano"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] ${
                  periodoAtualSelecionado ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <Calendar size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-black capitalize leading-none">{periodoSelecionadoLabel}</span>
                  <span className="mt-0.5 block truncate text-[8px] font-black uppercase tracking-[0.12em] text-current/50">{anoFinanceiro}</span>
                </span>
                <ChevronDown size={13} className={`shrink-0 transition-transform ${mostrarCalendarioMeses ? 'rotate-180' : ''}`} />
              </button>

              {mostrarCalendarioMeses && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setMostrarCalendarioMeses(false)} />
                  <div className="fixed left-5 top-[126px] z-[80] w-[330px] overflow-hidden rounded-[10px] border border-blue-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2.5">
                      <button type="button" onClick={() => setAnoFinanceiro((prev) => prev - 1)} className="flex h-8 w-8 items-center justify-center rounded-[6px] text-slate-500 hover:bg-white hover:text-blue-700" title="Ano anterior">
                        <ChevronLeft size={16} />
                      </button>
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Ano</p>
                        <span className="text-[15px] font-black text-slate-800">{anoFinanceiro}</span>
                      </div>
                      <button type="button" onClick={() => setAnoFinanceiro((prev) => Math.min(prev + 1, anoAtual))} disabled={anoFinanceiro >= anoAtual} className="flex h-8 w-8 items-center justify-center rounded-[6px] text-slate-500 hover:bg-white hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-35" title="Próximo ano">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3">
                      {MONTH_OPTIONS.map((mes, index) => {
                        const future = isFutureMonth(index, anoFinanceiro, hojeReferencia);
                        const active = mesFinanceiro === mes && !future;
                        const current = anoFinanceiro === anoAtual && index === hojeReferencia.getMonth();
                        return (
                          <button
                            key={mes}
                            type="button"
                            onClick={() => {
                              if (future) return;
                              setMesFinanceiro(mes);
                              setMostrarCalendarioMeses(false);
                            }}
                            disabled={future}
                            className={`min-h-[48px] rounded-[var(--radius-compact)] border px-2 py-2 text-left transition-colors ${
                              active
                                ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                                : current
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                            } disabled:cursor-not-allowed disabled:opacity-35`}
                          >
                            <span className="block text-[10px] font-black uppercase tracking-[0.12em]">{mes.slice(0, 3)}</span>
                            <span className={`mt-1 block text-[8px] font-bold uppercase tracking-[0.08em] ${active ? 'text-white/75' : 'text-current/45'}`}>
                              {current ? 'Atual' : future ? 'Futuro' : 'Aberto'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {!periodoAtualSelecionado && (
                      <button type="button" onClick={() => { irParaMesAtualOperacional(); setMostrarCalendarioMeses(false); }} className="mx-3 mb-3 h-9 w-[calc(100%-24px)] rounded-[var(--radius-compact)] bg-blue-600 text-[11px] font-black uppercase tracking-[0.12em] text-white hover:bg-blue-700">
                        Ir para mês atual
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="relative min-w-[690px] flex-1">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-blue-100/80" />
              <div className="relative grid grid-cols-12 gap-1.5">
                {MONTH_OPTIONS.map((mes, index) => {
                  const future = isFutureMonth(index, anoFinanceiro, hojeReferencia);
                  const active = mesFinanceiro === mes && !future;
                  const current = anoFinanceiro === anoAtual && index === hojeReferencia.getMonth();
                  return (
                    <button
                      key={mes}
                      type="button"
                      onClick={() => {
                        if (future) return;
                        setMostrarCalendarioMeses(false);
                        setMesFinanceiro(mes);
                      }}
                      disabled={future}
                      className={`group flex h-8 min-w-[62px] flex-col items-center justify-center rounded-[7px] border border-transparent px-1.5 transition-all ${
                        active
                          ? 'bg-blue-100/90 text-blue-700 ring-1 ring-blue-200/80'
                          : current
                            ? 'bg-sky-50/80 text-blue-700 ring-1 ring-sky-100/80'
                          : 'bg-transparent text-slate-500 hover:bg-white/55 hover:text-blue-700'
                      } disabled:cursor-not-allowed disabled:opacity-35`}
                      title={`${mes} ${anoFinanceiro}${future ? ' • futuro' : ''}`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-[0.12em]">{mes.slice(0, 3)}</span>
                      <span className="mt-0.5 text-[7px] font-black uppercase tracking-[0.08em] text-current/45">
                        {active ? 'Ativo' : current ? 'Atual' : future ? 'Futuro' : 'Aberto'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
          <div className={`relative ${mostrarFiltroListaAlunos ? 'z-[90]' : 'z-30'}`}>
            <button
              type="button"
              onClick={() => {
                setMostrarCalendarioMeses(false);
                setMostrarFiltroListaAlunos((prev) => !prev);
              }}
              className="flex h-9 min-w-[198px] items-center justify-between rounded-[var(--radius-surface)] bg-emerald-50/70 px-3 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-800 ring-1 ring-emerald-200/80 hover:bg-emerald-50 hover:text-emerald-900"
              title="Visualização da lista"
            >
              <span className="flex min-w-0 items-center gap-2">
                <LayoutList size={14} />
                <span className="truncate">Visualização</span>
                <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[8px] text-emerald-600 ring-1 ring-emerald-100/70">
                  {filtroAtual} · {ordenacaoAtual}
                </span>
              </span>
              <ChevronDown size={13} className={`transition-transform ${mostrarFiltroListaAlunos ? 'rotate-180' : ''}`} />
            </button>

            {mostrarFiltroListaAlunos && (
              <>
                <div className="fixed inset-0 z-[70]" onClick={() => setMostrarFiltroListaAlunos(false)} />
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-[90] w-[360px] rounded-[10px] border border-emerald-200/80 bg-[#EFF6F2] shadow-[0_18px_50px_rgba(15,23,42,0.18)] ring-1 ring-white/70"
                >
                  <div className="absolute -top-[6px] right-8 h-3 w-3 rotate-45 border-l border-t border-emerald-200/80 bg-[#E6F1EA]" />
                  <div className="border-b border-emerald-100 bg-[#E6F1EA] px-3 py-2.5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">Visualização da lista</p>
                  </div>
                  <div className="p-3">
                    <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Mostrar</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'todos', label: 'Todos', detail: `${historicoMensalFiltrado.length} resultados`, icon: <LayoutList size={14} /> },
                        { id: 'divida', label: 'Em dívida', detail: `${alunosEmDivida.length} em atraso`, icon: <AlertCircle size={14} className="text-red-600" /> },
                        { id: 'cobertos', label: 'Cobertos', detail: 'Pagos ou em dia', icon: <CheckCircle2 size={14} className="text-emerald-600" /> },
                        { id: 'importados', label: 'Importados', detail: `${alunosImportados.length} por rever`, icon: <FileSpreadsheet size={14} className="text-amber-600" /> },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFiltroStatus(item.id as 'todos' | 'divida' | 'cobertos' | 'importados');
                            setMostrarFiltroListaAlunos(false);
                          }}
                          className={`flex min-h-[58px] items-center gap-2 rounded-[var(--radius-compact)] border px-2.5 text-left transition-colors ${
                            filtroStatus === item.id ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800' : 'border-emerald-100/70 bg-white/55 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-white/80 shadow-sm">{item.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12px] font-black">{item.label}</span>
                            <span className="block truncate text-[10px] font-bold text-slate-400">{item.detail}</span>
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="my-3 h-px bg-[var(--border-light)]" />
                    <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Organizar por</p>
                    <div className="space-y-1">
                      {[
                        { id: 'inteligente', label: 'Inteligente', detail: 'Prioriza cobrança e urgência', icon: <Zap size={14} className="text-blue-600" /> },
                        { id: 'alfabetica', label: 'Ordem alfabética', detail: 'A-Z pelo nome do aluno', icon: <ArrowUpDown size={14} /> },
                        { id: 'inscricao_recente', label: 'Último inscrito', detail: 'Mais recentes primeiro', icon: <Clock size={14} className="text-emerald-600" /> },
                        { id: 'inscricao_antiga', label: 'Primeiro inscrito', detail: 'Mais antigos primeiro', icon: <ArrowUpDown size={14} className="text-slate-600" /> },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setOrdenacaoListaAlunos(item.id as StudentSortMode);
                            setMostrarFiltroListaAlunos(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-[var(--radius-compact)] px-3 py-2 text-left transition-colors ${
                            ordenacaoListaAlunos === item.id ? 'bg-emerald-50/95 text-emerald-800' : 'text-slate-600 hover:bg-white/75'
                          }`}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-white/70">{item.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12px] font-black">{item.label}</span>
                            <span className="block truncate text-[10px] font-bold text-slate-400">{item.detail}</span>
                          </span>
                          {ordenacaoListaAlunos === item.id && <CheckCircle2 size={13} className="text-emerald-600" />}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setMostrarFiltroListaAlunos(false)}
                      className="mt-3 h-9 w-full rounded-[var(--radius-compact)] bg-emerald-600 text-[11px] font-black uppercase tracking-[0.14em] text-white hover:bg-emerald-700"
                    >
                      Aplicar visualização
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={`relative flex h-9 items-center justify-end transition-all ${pesquisaAberta || pesquisa ? 'w-[240px]' : 'w-9'}`}>
            {pesquisaAberta || pesquisa ? (
              <div className="relative w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar aluno..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  className="nl-input h-9 w-full !rounded-[var(--radius-surface)] !pl-9 !pr-9 !border-blue-100 !bg-white/75 text-[12px] shadow-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (pesquisa) setPesquisa('');
                    else setPesquisaAberta(false);
                  }}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-slate-100 hover:text-[var(--color-primary)]"
                  title={pesquisa ? 'Limpar pesquisa' : 'Fechar pesquisa'}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMostrarFiltroListaAlunos(false);
                  setMostrarCalendarioMeses(false);
                  setPesquisaAberta(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-surface)] bg-white/60 text-slate-500 ring-1 ring-slate-200/70 hover:bg-blue-50/80 hover:text-blue-700"
                title="Pesquisar"
              >
                <Search size={15} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setReguaFerramentasMinimizada(true)}
            className="flex h-9 items-center gap-2 rounded-[var(--radius-surface)] bg-slate-100/60 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 ring-1 ring-slate-200/60 hover:bg-white/70 hover:text-slate-800"
            title="Recolher ferramentas"
          >
            <ChevronDown size={13} className="rotate-180" />
            Recolher
          </button>

          </div>
        </div>
        </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden px-6 py-6">
        <div className="mx-auto h-full w-full" style={{ maxWidth: `${larguraListas}px` }}>
          <div className="nl-card flex h-full overflow-hidden flex-col !rounded-[var(--radius-md)] !p-0 border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]">
            {/* Tabela */}
            <div className="overflow-y-auto flex-1 custom-scrollbar nl-font-list" style={estiloTabelaAlunos}>
            {/* Banner: dados importados aguardando revisão */}
            {alunosImportados.length > 0 && filtroStatus !== 'importados' && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 shrink-0">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <p className="text-[11px] font-bold text-amber-800 flex-1">
                  {alunosImportados.length} {alunosImportados.length === 1 ? 'aluno importado aguarda' : 'alunos importados aguardam'} revisão
                </p>
                <button
                  type="button"
                  onClick={() => setFiltroStatus('importados')}
                  className="text-[10px] font-black uppercase tracking-wider text-amber-700 hover:text-amber-900 px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 transition-colors border border-amber-300"
                >
                  Ver
                </button>
                <button
                  type="button"
                  onClick={finalizarTodosImportados}
                  className="text-[10px] font-black uppercase tracking-wider text-white bg-amber-500 hover:bg-amber-600 px-2 py-1 rounded transition-colors border border-amber-600 shadow-sm"
                >
                  Finalizar todos
                </button>
              </div>
            )}

              {periodoSelecionadoFuturo ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50">
                  <Calendar size={28} />
                  <div className="text-center">
                    <p className="text-[13px] font-semibold nl-text">Período ainda não iniciado</p>
                    <p className="text-[11px] nl-text-muted mt-1">Os alunos serão migrados automaticamente quando {mesFinanceiro} {anoFinanceiro} chegar.</p>
                  </div>
                </div>
              ) : historicoMensalFiltrado.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 opacity-40">
                  <Users size={28} />
                  <div className="text-center">
                    <p className="text-[13px] font-semibold nl-text">Nenhum aluno encontrado</p>
                    <p className="text-[11px] nl-text-muted mt-1">Tente outro filtro ou período.</p>
                  </div>
                </div>
              ) : (
                <table className="w-full table-fixed text-left border-separate border-spacing-0">
                  <thead className="bg-[var(--color-secondary-lighter)] text-[9px] font-black nl-text-muted uppercase tracking-[0.11em] sticky top-0 z-10 border-b border-[var(--border-light)]">
                    <tr>
                      <th style={{ padding: '10px var(--list-row-px)', width: '4%', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '10px var(--list-row-px)', width: '27%' }}>Aluno</th>
                      <th style={{ padding: '10px var(--list-row-px)', width: '5%', textAlign: 'center' }}>Notas</th>
                      <th style={{ padding: '10px var(--list-row-px)', width: '12%' }}>Telefone</th>
                      <th style={{ padding: '10px var(--list-row-px)', width: '12%', textAlign: 'right' }}>Mensalidade</th>
                      <th style={{ padding: '10px var(--list-row-px)', width: '13%', textAlign: 'center' }}>Próx. cobrança</th>
                      <th style={{ padding: '10px var(--list-row-px)', width: '25%' }}>Estado</th>
                      <th style={{ padding: '10px var(--list-row-px)', width: '4%', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoMensalFiltrado.map(({ aluno, resumo, entrouNesteMes }, index) => {
                      const isImported = STUDENT_STATUS_HELPERS.isImported(aluno.status);
                      const progressoDias = getTimelineMetricWidth(resumo, aluno.status);
                      const paused = STUDENT_STATUS_HELPERS.isPaused(aluno.status);
                      const blocked = STUDENT_STATUS_HELPERS.isBlocked(aluno.status);
                      const isAtrasado = resumo.status === 'atrasado' || resumo.status === 'hoje';
                      const isPago = resumo.status === 'pago';
                      const isDentroDoPrazo = !isAtrasado && !isPago;

                      const estadoCor = (() => {
                        if (isImported)    return { dot: '#D97706', label: 'Importado', metric: 'Rever', action: 'Confirmar dados', text: '#92400E', bg: '#FFFBEB', barBg: '#FDE68A', border: '#FDE68A' };
                        if (blocked)       return { dot: '#B91C1C', label: 'Bloqueado', metric: 'Parado', action: 'Resolver acesso', text: '#991B1B', bg: '#FEF2F2', barBg: '#FECACA', border: '#FECACA' };
                        if (paused)        return { dot: '#B45309', label: 'Pausado', metric: 'Pausa', action: 'Acompanhar retorno', text: '#78350F', bg: '#FFF7ED', barBg: '#FED7AA', border: '#FED7AA' };
                        if (isAtrasado)    return { dot: '#DC2626', label: resumo.status === 'hoje' ? 'Vence hoje' : 'Atrasado', metric: resumo.status === 'hoje' ? 'Hoje' : `${resumo.overdueDays || 0}d`, action: 'Priorizar cobrança', text: '#B91C1C', bg: '#FEF2F2', barBg: '#FECACA', border: '#FECACA' };
                        if (isPago)        return { dot: '#16A34A', label: 'Em dia', metric: 'OK', action: resumo.coverageEnd ? `Coberto até ${resumo.coverageEnd}` : 'Cobertura ativa', text: '#15803D', bg: '#F0FDF4', barBg: '#BBF7D0', border: '#BBF7D0' };
                        if (isDentroDoPrazo) return { dot: '#2563EB', label: 'No prazo', metric: `${Math.max(resumo.daysUntilCharge || 0, 0)}d`, action: 'Acompanhar vencimento', text: '#1D4ED8', bg: '#EFF6FF', barBg: '#BFDBFE', border: '#BFDBFE' };
                        return             { dot: '#64748b', label: 'Regular', metric: 'Ativo', action: 'Sem pendência', text: '#475569', bg: '#F8FAFC', barBg: '#E2E8F0', border: '#E2E8F0' };
                      })();
                      const rowAccent = isImported ? '#D97706' : estadoCor.dot;
                      const showTimeline = !paused && !blocked && !isImported;
                      const totalNotas = notasResumo?.[aluno.id]?.total || 0;
                      const temNotas = totalNotas > 0;

                      return (
                        <tr
                          key={`${periodoSelecionadoKey}-${aluno.id}`}
                          className={`group transition-colors cursor-pointer ${isImported ? 'bg-amber-50 hover:bg-amber-100' : `rp-${index % 6}`}`}
                          style={{ boxShadow: `inset 3px 0 0 ${rowAccent}, inset 0 -1px 0 var(--border-light)` }}
                          onClick={() => {
                            if (isImported) {
                              abrirEdicao(aluno);
                              return;
                            }
                            if (isPago) {
                              onEstadoPagamentoClick(aluno, resumo);
                              return;
                            }
                            abrirPerfilAluno(aluno);
                          }}
                          title={
                            isImported
                              ? 'Clique para editar e confirmar dados'
                              : isPago
                                ? 'Pagamento em dia. Clique para ver cobertura e próxima cobrança.'
                                : 'Clique para ver o perfil completo do aluno'
                          }
                        >
                          {/* Nº */}
                          <td className="align-middle text-center" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/70 px-1.5 text-[10px] font-black nl-text-muted tabular-nums shadow-sm ring-1 ring-black/[0.04]">{index + 1}</span>
                          </td>
                          {/* Aluno */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="rounded-full bg-white flex items-center justify-center font-black nl-text-muted border border-white/80 overflow-hidden shrink-0 shadow-sm ring-1 ring-black/[0.05]" style={{ width: 'var(--list-avatar-size)', height: 'var(--list-avatar-size)', fontSize: 'var(--list-font-secondary)' }}>
                                {aluno.foto_path ? <img src={`local-resource://${aluno.foto_path}`} className="w-full h-full object-cover" /> : getAlunoIniciais(aluno)}
                              </div>
                              <div className="flex min-w-0 flex-col">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (isPago) {
                                        onEstadoPagamentoClick(aluno, resumo);
                                      } else if (isImported) {
                                        abrirEdicao(aluno);
                                      } else {
                                        abrirPerfilAluno(aluno);
                                      }
                                    }}
                                    className="min-w-0 text-left font-bold nl-text group-hover:text-[var(--color-primary)] transition-colors truncate leading-tight focus:outline-none focus:text-[var(--color-primary)]"
                                    style={{ fontSize: 'var(--list-font-primary)' }}
                                    title={isPago ? 'Pagamento em dia. Ver próxima cobrança.' : 'Abrir aluno'}
                                  >
                                    {aluno.nome}
                                  </button>
                                  {isImported && <span className="text-[8px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-[3px] shrink-0">importado</span>}
                                  {!isImported && entrouNesteMes && <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary-light)] px-1.5 py-0.5 rounded-[3px] shrink-0">novo</span>}
                                </div>
                                <span className="mt-0.5 truncate text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 leading-none">
                                  {aluno.categoria || 'Geral'} · {aluno.modo_cobranca === 'mensalidade_movel' ? 'Mensalidade móvel' : 'Ciclo mensal'}
                                </span>
                              </div>
                            </div>
                          </td>
                          {/* Notas */}
                          <td className="align-middle text-center" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }} onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onNotasClick(aluno)}
                              className={`relative inline-flex h-8 w-8 items-center justify-center rounded-[5px] border transition-all hover:-translate-y-[1px] hover:shadow-sm ${
                                temNotas
                                  ? 'border-amber-300 bg-amber-300 text-amber-950 shadow-[0_5px_12px_rgba(217,119,6,0.18)]'
                                  : 'border-slate-200 bg-slate-100 text-slate-400 opacity-65 hover:opacity-100'
                              }`}
                              title={temNotas ? `${totalNotas} nota(s). Clique para ver.` : 'Adicionar nota'}
                            >
                              <StickyNote size={15} />
                              {temNotas && (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[8px] font-black text-white">
                                  {totalNotas}
                                </span>
                              )}
                            </button>
                          </td>
                          {/* Telefone */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span className="block truncate font-normal tabular-nums nl-text-muted" style={{ fontSize: 'var(--list-font-primary)' }}>{aluno.telefone || '—'}</span>
                          </td>
                          {/* Mensalidade — escudo */}
                          <td className="align-middle text-right" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <div className="inline-flex items-center justify-end gap-1.5 px-2.5 py-1 rounded-[5px] border border-white/70 bg-white/65 shadow-sm">
                              <Shield size={10} className="nl-text-muted shrink-0 opacity-60" />
                              <span className="font-bold nl-text whitespace-nowrap tabular-nums" style={{ fontSize: 'var(--list-font-secondary)' }}>{formatCve(aluno.plano)}</span>
                            </div>
                          </td>
                          {/* Próxima cobrança */}
                          <td className="align-middle text-center" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span className="inline-flex min-w-[86px] justify-center rounded-[5px] bg-white/55 px-2 py-0.5 font-medium tabular-nums nl-text-muted ring-1 ring-black/[0.04]" style={{ fontSize: 'var(--list-font-secondary)' }}>{resumo.nextChargeDate || '—'}</span>
                          </td>
                          {/* Estado — painel temporal inteligente */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onEstadoPagamentoClick(aluno, resumo);
                              }}
                              className="group/pay min-w-0 w-full rounded-[var(--radius-compact)] px-2.5 py-1 text-left shadow-sm ring-1 ring-white/70 transition-all hover:-translate-y-[1px] hover:brightness-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                              style={{ background: estadoCor.bg, border: `1px solid ${estadoCor.border}` }}
                              title={
                                isPago
                                  ? `Pagamento ativo. Clique para rever cobertura e próximo pagamento: ${resumo.nextChargeDate || 'sem data'}.`
                                  : isAtrasado
                                    ? 'Mensalidade em atraso. Clique para registar pagamento agora.'
                                    : 'Clique para abrir a cobrança e ajustar o pagamento deste aluno.'
                              }
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="flex min-w-[72px] items-center gap-1.5 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: estadoCor.text }}>
                                  <span className="h-2 w-2 rounded-full shrink-0 transition-transform group-hover/pay:scale-125" style={{ background: estadoCor.dot }} />
                                  {estadoCor.label}
                                </span>
                                <span className="ml-auto shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] tabular-nums" style={{ color: estadoCor.text }}>
                                  {estadoCor.metric}
                                </span>
                              </div>
                              <div className="mt-1 flex min-w-0 items-center gap-2">
                                {showTimeline ? (
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: estadoCor.barBg }}>
                                    <div className={`h-full rounded-full transition-all duration-700 ${getTimelineMetricBarClass(resumo.status)}`} style={{ width: `${progressoDias}%` }} />
                                  </div>
                                ) : (
                                  <div className="h-1.5 flex-1 rounded-full" style={{ background: estadoCor.barBg }} />
                                )}
                                <p className="max-w-[52%] truncate text-[9px] font-medium leading-none" style={{ color: estadoCor.text }}>
                                  {estadoCor.action}
                                </p>
                              </div>
                            </button>
                          </td>
                          {/* Acções */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); abrirPerfilAluno(aluno); }}
                                className="nl-icon-btn !w-6 !h-6 !rounded-[4px] hover:!bg-[var(--color-primary-light)] hover:!text-[var(--color-primary)] hover:!border-[var(--color-primary)]/20"
                                title="Ver perfil em Contactos">
                                <BookUser size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Barra de resumo financeiro — colada na base da lista */}
            {!periodoSelecionadoFuturo && historicoMensalFiltrado.length > 0 && (() => {
              const totalPago   = resumoMensalFinanceiro.recebido;
              const totalDivida = resumoMensalFinanceiro.devido;
              const pctPago     = resumoMensalFinanceiro.pctRecebidoValor;
              const pctDivida   = resumoMensalFinanceiro.pctDevidoValor;
              return (
                <button
                  type="button"
                  onClick={() => setMostrarResumoMensal(true)}
                  className="group flex w-full shrink-0 items-center gap-4 border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/30 px-4 py-2 text-left transition-colors hover:bg-blue-50/55"
                  title="Abrir resumo detalhado do mês"
                >
                  {/* Barra segmentada */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--border-light)] flex">
                      <div className="h-full bg-emerald-500 transition-all duration-700 rounded-l-full" style={{ width: `${pctPago}%` }} />
                      <div className="h-full bg-red-400 transition-all duration-700 rounded-r-full" style={{ width: `${pctDivida}%` }} />
                    </div>
                  </div>
                  {/* Valores */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden items-center gap-1.5 rounded-full bg-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-blue-700 ring-1 ring-blue-100 group-hover:bg-white lg:flex">
                      <BarChart3 size={12} />
                      Detalhes
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[10px] nl-text-muted">Pagos</span>
                      <span className="text-[10px] font-semibold text-emerald-700">{resumoMensalFinanceiro.pagos.length}</span>
                      <span className="text-[10px] font-semibold text-emerald-700">{formatCve(totalPago)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                      <span className="text-[10px] nl-text-muted">Devidos</span>
                      <span className="text-[10px] font-semibold text-red-600">{resumoMensalFinanceiro.devidos.length}</span>
                      <span className="text-[10px] font-semibold text-red-600">{formatCve(totalDivida)}</span>
                    </div>
                    <div className="h-3 w-px bg-[var(--border)]" />
                    <span className="text-[10px] nl-text-muted">{historicoMensalFiltrado.length} alunos · {mesFinanceiro} {anoFinanceiro}</span>
                  </div>
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {mostrarResumoMensal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/35 px-5 py-6 backdrop-blur-sm" onClick={() => setMostrarResumoMensal(false)}>
          <div className="w-full max-w-[760px] overflow-hidden rounded-[var(--radius-md)] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-surface)] bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                  <BarChart3 size={19} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Resumo mensal</p>
                  <h2 className="text-[20px] font-black tracking-tight text-slate-950 capitalize">{mesFinanceiro} {anoFinanceiro}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarResumoMensal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-surface)] text-slate-400 transition-colors hover:bg-white hover:text-slate-800"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div className="rounded-[var(--radius-control)] border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-65">Alunos pagos</p>
                <p className="mt-2 text-[28px] font-black leading-none">{resumoMensalFinanceiro.pagos.length}</p>
                <p className="mt-1 text-[12px] font-bold opacity-70">{formatCve(resumoMensalFinanceiro.recebido)}</p>
              </div>
              <div className="rounded-[var(--radius-control)] border border-rose-100 bg-rose-50 px-4 py-3 text-rose-800">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-65">Alunos devidos</p>
                <p className="mt-2 text-[28px] font-black leading-none">{resumoMensalFinanceiro.devidos.length}</p>
                <p className="mt-1 text-[12px] font-bold opacity-70">{formatCve(resumoMensalFinanceiro.devido)}</p>
              </div>
              <div className="rounded-[var(--radius-control)] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-65">Total no mês</p>
                <p className="mt-2 text-[28px] font-black leading-none">{historicoMensalFiltrado.length}</p>
                <p className="mt-1 text-[12px] font-bold opacity-70">Previsto {formatCve(resumoMensalFinanceiro.previsto)}</p>
              </div>
            </div>

            <div className="space-y-5 px-5 pb-5">
              <div className="rounded-[var(--radius-control)] border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Distribuição por alunos</p>
                  <span className="text-[11px] font-bold text-slate-400">{historicoMensalFiltrado.length} alunos</span>
                </div>
                <div className="h-5 overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full">
                    <div className="bg-emerald-500" style={{ width: `${resumoMensalFinanceiro.pctPagoAlunos}%` }} />
                    <div className="bg-rose-400" style={{ width: `${resumoMensalFinanceiro.pctDevidoAlunos}%` }} />
                    <div className="bg-slate-300" style={{ width: `${resumoMensalFinanceiro.pctOutrosAlunos}%` }} />
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-[11px] font-bold text-slate-500 sm:grid-cols-3">
                  <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />Pagos: {resumoMensalFinanceiro.pagos.length}</span>
                  <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-rose-400" />Devidos: {resumoMensalFinanceiro.devidos.length}</span>
                  <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-slate-300" />Outros: {resumoMensalFinanceiro.outros}</span>
                </div>
              </div>

              <div className="rounded-[var(--radius-control)] border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Valores do mês</p>
                  <span className="text-[11px] font-bold text-slate-400">Recebido vs devido</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Recebido', value: resumoMensalFinanceiro.recebido, pct: resumoMensalFinanceiro.pctRecebidoValor, color: 'bg-emerald-500', text: 'text-emerald-700' },
                    { label: 'Em dívida', value: resumoMensalFinanceiro.devido, pct: resumoMensalFinanceiro.pctDevidoValor, color: 'bg-rose-400', text: 'text-rose-700' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between text-[12px] font-black">
                        <span className={item.text}>{item.label}</span>
                        <span className="text-slate-700">{formatCve(item.value)} · {item.pct}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(GestaoPage);
