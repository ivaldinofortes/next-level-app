import { memo, useEffect, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, LayoutList, AlertCircle,
  CheckCircle2, FileSpreadsheet, ChevronDown, ArrowUpDown, Zap,
  Clock, Search, X, BookUser, Shield, Users, StickyNote, BarChart3, Wallet, Lock,
} from 'lucide-react';
import { formatCve } from '../lib/billing';
import type { MonthlyBillingSummary } from '../lib/billing';
import {
  isFutureMonth,
  getTimelineMetricWidth,
  getTimelineRingColor,
  getAlunoIniciais,
  getAlunoNomeSeguro,
  isNewStudent,
} from '../utils/formatting';
import { MONTH_OPTIONS, STUDENT_STATUS_HELPERS, getManualStatusTone } from '../constants';
import type { StudentSortMode, Student } from '../types';
import TimeRuler from './TimeRuler';

const POSTIT_YELLOW = '#EAB308';
const POSTIT_FILL = '#FDE047';

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
  obterTomPastel: (index: number) => { bg: string; border: string; rowBg: string; rowHover: string };
  setAlunoPerfil: (v: Student | null) => void;
  irParaMesAtualOperacional: (mostrarAviso?: boolean) => void;
  abrirEdicao: (aluno: Student) => void;
  abrirPerfilAluno: (aluno?: Student | null) => void;
  onEstadoPagamentoClick: (aluno: Student, resumo: MonthlyBillingSummary) => void;
  notasResumo: Record<string, { total: number }>;
  onNotasClick: (aluno: Student) => void;
  finalizarTodosImportados: () => void;
  setAba: (v: string) => void;
  /** Mês passado em modo leitura */
  periodoBloqueado?: boolean;
  onPermitirEdicaoMes?: () => void;
  onExportarRelatorio?: () => void;
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
  obterTomPastel,
  irParaMesAtualOperacional,
  abrirEdicao,
  abrirPerfilAluno,
  onEstadoPagamentoClick,
  notasResumo,
  onNotasClick,
  finalizarTodosImportados,
  periodoBloqueado = false,
  onPermitirEdicaoMes,
  onExportarRelatorio,
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

  const mesIdxFinanceiro = Math.max(0, MONTH_OPTIONS.indexOf(mesFinanceiro));
  const rulerMarks = MONTH_OPTIONS.map((mes, index) => {
    // peso leve: mais alunos “activos” no mês ≈ traço um pouco mais alto (heurística simples)
    const w = historicoMensalFiltrado.length > 0 && index === mesIdxFinanceiro ? 0.85 : index % 3 === 0 ? 0.35 : 0.15;
    return { index, weight: w };
  });

  return (
    <div className="animate-slide-up flex h-full w-full flex-col overflow-hidden nl-bg-app">
      {/* Barra única: esquerda | régua centrada | direita */}
      <div className="sticky top-0 z-20 shrink-0 border-b border-[var(--border)] bg-[var(--bg-header)]">
        <div className="flex h-12 w-full items-center gap-2 px-3">
            {/* Esquerda — período / ano */}
            <div className="relative z-30 flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setAnoFinanceiro((prev) => prev - 1)}
                className="nl-icon-btn nl-icon-btn-sm"
                title="Ano anterior"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarFiltroListaAlunos(false);
                  setMostrarCalendarioMeses((prev) => !prev);
                }}
                className={`inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 text-[12px] font-semibold capitalize ${
                  periodoAtualSelecionado
                    ? 'border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--bg-surface))] text-[var(--color-success)]'
                    : 'border-[var(--border)] bg-[var(--bg-surface)] nl-text'
                }`}
                title="Escolher mês e ano"
              >
                <Calendar size={13} />
                <span className="max-w-[110px] truncate">{periodoSelecionadoLabel}</span>
                <ChevronDown size={12} className={mostrarCalendarioMeses ? 'rotate-180' : ''} />
              </button>
              <button
                type="button"
                onClick={() => setAnoFinanceiro((prev) => Math.min(prev + 1, anoAtual))}
                disabled={anoFinanceiro >= anoAtual}
                className="nl-icon-btn nl-icon-btn-sm"
                title="Próximo ano"
              >
                <ChevronRight size={14} />
              </button>
              {!periodoAtualSelecionado && (
                <button type="button" onClick={() => irParaMesAtualOperacional()} className="nl-btn nl-btn-ghost nl-btn-sm !h-9 hidden lg:inline-flex">
                  Hoje
                </button>
              )}

              {mostrarCalendarioMeses && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setMostrarCalendarioMeses(false)} />
                  <div className="absolute left-0 top-[calc(100%+6px)] z-[80] w-[300px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
                    <div className="grid grid-cols-3 gap-1.5 p-2.5">
                      {MONTH_OPTIONS.map((mes, index) => {
                        const future = isFutureMonth(index, anoFinanceiro, hojeReferencia);
                        const active = mesFinanceiro === mes && !future;
                        return (
                          <button
                            key={mes}
                            type="button"
                            disabled={future}
                            onClick={() => {
                              if (future) return;
                              setMesFinanceiro(mes);
                              setMostrarCalendarioMeses(false);
                            }}
                            className={`rounded-[var(--radius-compact)] border px-2 py-2 text-[11px] font-semibold capitalize ${
                              active
                                ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                                : 'border-[var(--border)] nl-text hover:bg-[var(--color-secondary-light)]'
                            } disabled:opacity-35`}
                          >
                            {mes.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Centro — régua de tempo (sempre centrada, compacta) */}
            <div className="min-w-0 flex-1">
              <TimeRuler
                year={anoFinanceiro}
                selectedIndex={mesIdxFinanceiro}
                referenceDate={hojeReferencia}
                accent="alunos"
                maxWidth={420}
                marks={rulerMarks}
                onSelect={(_idx, mes) => {
                  setMostrarCalendarioMeses(false);
                  setMesFinanceiro(mes);
                }}
                onGoToCurrent={() => {
                  setMostrarCalendarioMeses(false);
                  irParaMesAtualOperacional();
                }}
              />
            </div>

            {/* Depois da régua: pesquisa em destaque + filtros */}
            <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">
          {/* Pesquisa sempre visível, logo após a régua */}
          <div className="relative w-[min(220px,28vw)] shrink-0">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-[var(--color-primary)]" />
            <input
              type="text"
              placeholder="Pesquisar aluno…"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              onFocus={() => {
                setPesquisaAberta(true);
                setMostrarFiltroListaAlunos(false);
                setMostrarCalendarioMeses(false);
              }}
              className="h-9 w-full rounded-[var(--radius-control)] border-2 border-[var(--color-primary)] bg-[var(--bg-surface)] pl-8 pr-8 text-[12px] font-medium nl-text outline-none shadow-[0_0_0_3px_var(--shadow-primary-focus)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-hover)]"
            />
            {pesquisa ? (
              <button
                type="button"
                onClick={() => setPesquisa('')}
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full nl-text-muted hover:bg-[var(--color-secondary-light)]"
                title="Limpar"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>

          <div className={`relative ${mostrarFiltroListaAlunos ? 'z-[90]' : 'z-30'}`}>
            <button
              type="button"
              onClick={() => {
                setMostrarCalendarioMeses(false);
                setMostrarFiltroListaAlunos((prev) => !prev);
              }}
              className="inline-flex h-9 max-w-[180px] items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 text-[11px] font-semibold nl-text hover:bg-[var(--color-secondary-light)]"
              title="Visualização da lista"
            >
              <LayoutList size={13} />
              <span className="truncate">{filtroAtual}</span>
              <ChevronDown size={12} className={mostrarFiltroListaAlunos ? 'rotate-180' : ''} />
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

          </div>
        </div>
      </div>

      {periodoBloqueado && (
        <div className="shrink-0 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--bg-surface))] px-4 py-2">
          <div className="mx-auto flex flex-wrap items-center gap-2 text-[12px] font-medium" style={{ maxWidth: `${larguraListas}px` }}>
            <Lock size={14} className="text-[var(--color-warning)]" />
            <span className="nl-text">
              <strong className="capitalize">{periodoSelecionadoLabel}</strong> está fechado — cobranças e edições bloqueadas.
              A régua preserva o histórico; pode avançar para o mês actual a qualquer momento.
            </span>
            {onExportarRelatorio && (
              <button type="button" onClick={onExportarRelatorio} className="nl-btn nl-btn-sm !h-7 !border-[#c64600] !bg-[#c64600] !text-white !text-[11px]">
                Exportar relatório
              </button>
            )}
            {onPermitirEdicaoMes && (
              <button type="button" onClick={onPermitirEdicaoMes} className="nl-btn nl-btn-secondary nl-btn-sm !h-7 !text-[11px]">
                Permitir edição (admin)
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden px-4 py-4">
        <div className="mx-auto h-full w-full" style={{ maxWidth: `${larguraListas}px` }}>
          <div className="nl-card nl-student-list flex h-full overflow-hidden flex-col !rounded-[var(--radius-md)] !p-0 border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]">
            {/* Tabela — mesmo layout em claro/escuro; pastéis adaptados pelo tema */}
            <div className="overflow-y-auto flex-1 custom-scrollbar nl-font-list" style={estiloTabelaAlunos}>
            {/* Banner: dados importados aguardando revisão */}
            {alunosImportados.length > 0 && filtroStatus !== 'importados' && (
              <div className="flex items-center gap-3 px-4 py-2.5 shrink-0 border-b border-[color-mix(in_srgb,var(--color-warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--color-warning)_14%,var(--bg-surface))]">
                <div className="w-2 h-2 rounded-full bg-[var(--color-warning)] animate-pulse shrink-0" />
                <p className="text-[11px] font-bold flex-1" style={{ color: 'color-mix(in srgb, var(--color-warning) 75%, var(--text-primary))' }}>
                  {alunosImportados.length} {alunosImportados.length === 1 ? 'aluno importado aguarda' : 'alunos importados aguardam'} revisão
                </p>
                <button
                  type="button"
                  onClick={() => setFiltroStatus('importados')}
                  className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border transition-colors"
                  style={{
                    color: 'color-mix(in srgb, var(--color-warning) 80%, var(--text-primary))',
                    background: 'color-mix(in srgb, var(--color-warning) 18%, var(--bg-surface))',
                    borderColor: 'color-mix(in srgb, var(--color-warning) 40%, var(--border))',
                  }}
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
                  <thead className="text-[9px] font-black nl-text-muted uppercase tracking-[0.11em] sticky top-0 z-10 border-b border-[var(--border-light)] backdrop-blur-sm" style={{ background: 'var(--list-thead-bg, var(--color-secondary-lighter))' }}>
                    <tr style={{ height: 'calc(var(--list-avatar-size) + 14px + (2 * var(--list-row-py)))' }}>
                      <th className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '3.5%', textAlign: 'center' }}>#</th>
                      <th className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '28%' }}>Aluno</th>
                      <th className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '5%', textAlign: 'center' }}>Notas</th>
                      <th className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '12.5%' }}>Telefone</th>
                      <th className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '12.5%', textAlign: 'right' }}>Mensalidade</th>
                      <th className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '12.5%', textAlign: 'center' }}>Próx. cobrança</th>
                      <th className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '22%' }}>Estado</th>
                      <th className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '4%', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoMensalFiltrado.map(({ aluno, resumo, entrouNesteMes }, index) => {
                      const isImported = STUDENT_STATUS_HELPERS.isImported(aluno.status);
                      const progressoDias = getTimelineMetricWidth(resumo, aluno.status);
                      const paused = STUDENT_STATUS_HELPERS.isPaused(aluno.status);
                      const blocked = STUDENT_STATUS_HELPERS.isBlocked(aluno.status);
                      const isQuit = STUDENT_STATUS_HELPERS.isQuit(aluno.status);
                      const isOnLeave = STUDENT_STATUS_HELPERS.isOnLeave(aluno.status);
                      const isAtrasado = resumo.status === 'atrasado' || resumo.status === 'hoje';
                      const isPago = resumo.status === 'pago';
                      const isDentroDoPrazo = !isAtrasado && !isPago;
                      const tom = obterTomPastel(index);

                      // Cores GNOME / Adwaita — legíveis e consistentes com o tema
                      const estadoCor = (() => {
                        if (isImported) return {
                          label: 'Importado', metric: 'Rever', hint: 'Confirmar dados',
                          fg: 'var(--color-warning)', bg: 'color-mix(in srgb, var(--color-warning) 12%, var(--bg-surface))',
                          barTrack: 'color-mix(in srgb, var(--color-warning) 28%, transparent)', barFill: 'var(--color-warning)',
                          border: 'color-mix(in srgb, var(--color-warning) 35%, var(--border))',
                        };
                        if (isQuit) {
                          const t = getManualStatusTone('desistente');
                          return {
                            label: t.label, metric: 'Saiu', hint: 'Fora da contabilidade',
                            fg: t.fg, bg: t.bg, barTrack: t.barTrack, barFill: t.barFill, border: t.border,
                          };
                        }
                        if (blocked) {
                          const t = getManualStatusTone('bloqueado');
                          return {
                            label: t.label, metric: '—', hint: 'Sem acesso',
                            fg: t.fg, bg: t.bg, barTrack: t.barTrack, barFill: t.barFill, border: t.border,
                          };
                        }
                        if (isOnLeave) {
                          const t = getManualStatusTone('ferias');
                          return {
                            label: t.label, metric: 'Aus.', hint: 'Fora da contabilidade',
                            fg: t.fg, bg: t.bg, barTrack: t.barTrack, barFill: t.barFill, border: t.border,
                          };
                        }
                        if (paused) {
                          const t = getManualStatusTone('pausado');
                          return {
                            label: t.label, metric: 'Pausa', hint: 'Fora da contabilidade',
                            fg: t.fg, bg: t.bg, barTrack: t.barTrack, barFill: t.barFill, border: t.border,
                          };
                        }
                        if (isAtrasado) return {
                          label: resumo.status === 'hoje' ? 'Vence hoje' : 'Em atraso',
                          metric: resumo.status === 'hoje' ? 'Hoje' : `${resumo.overdueDays || 0}d`,
                          hint: resumo.coverageEnd ? `Até ${resumo.coverageEnd}` : 'Em cobrança',
                          fg: 'var(--color-error)', bg: 'color-mix(in srgb, var(--color-error) 10%, var(--bg-surface))',
                          barTrack: 'color-mix(in srgb, var(--color-error) 22%, transparent)', barFill: 'var(--color-error)',
                          border: 'color-mix(in srgb, var(--color-error) 32%, var(--border))',
                        };
                        if (isPago) return {
                          label: 'Em dia', metric: 'OK',
                          hint: resumo.coverageEnd ? `Até ${resumo.coverageEnd}` : 'Coberto',
                          fg: 'var(--color-success)', bg: 'color-mix(in srgb, var(--color-success) 10%, var(--bg-surface))',
                          barTrack: 'color-mix(in srgb, var(--color-success) 22%, transparent)', barFill: 'var(--color-success)',
                          border: 'color-mix(in srgb, var(--color-success) 32%, var(--border))',
                        };
                        if (isDentroDoPrazo) return {
                          label: 'No prazo', metric: `${Math.max(resumo.daysUntilCharge || 0, 0)}d`,
                          hint: resumo.nextChargeDate ? `Próx. ${resumo.nextChargeDate}` : 'Dentro do prazo',
                          fg: 'var(--color-primary)', bg: 'color-mix(in srgb, var(--color-primary) 10%, var(--bg-surface))',
                          barTrack: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', barFill: 'var(--color-primary)',
                          border: 'color-mix(in srgb, var(--color-primary) 28%, var(--border))',
                        };
                        return {
                          label: 'Regular', metric: '—', hint: 'Ver estado',
                          fg: 'var(--text-secondary)', bg: 'var(--color-secondary-light)',
                          barTrack: 'var(--border)', barFill: 'var(--text-tertiary)',
                          border: 'var(--border)',
                        };
                      })();
                      const showTimeline = !paused && !blocked && !isImported && !isQuit;
                      const totalNotas = notasResumo?.[aluno.id]?.total || 0;
                      const temNotas = totalNotas > 0;
                      const podeCobrar = !blocked && !paused && !isQuit;
                      // Anel SVG: circunferência r=15.5 em viewBox 36 → ~97.4
                      const RING_C = 2 * Math.PI * 15.5;
                      const ringPct = showTimeline ? Math.max(0, Math.min(100, progressoDias)) / 100 : (paused || blocked || isImported ? 0.35 : 0);
                      const ringColor = getTimelineRingColor(resumo.status, aluno.status);
                      const ringDash = `${(ringPct * RING_C).toFixed(2)} ${RING_C.toFixed(2)}`;
                      const rowBg = isImported
                        ? 'color-mix(in srgb, var(--color-warning) 8%, var(--bg-surface))'
                        : tom.rowBg;

                      return (
                        <tr
                          key={`${periodoSelecionadoKey}-${aluno.id}`}
                          className="group transition-colors"
                          style={{
                            background: rowBg,
                            boxShadow: `inset 3px 0 0 ${estadoCor.fg}, inset 0 -1px 0 var(--list-row-divider, var(--border-light))`,
                          }}
                          onMouseEnter={(e) => {
                            if (!isImported) e.currentTarget.style.background = tom.rowHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = rowBg;
                          }}
                        >
                          {/* Nº */}
                          <td className="align-middle text-center" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span className="text-[11px] font-medium tabular-nums nl-text-muted">{index + 1}</span>
                          </td>
                          {/* Aluno + avatar com anel de timeline */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div
                                className="relative shrink-0"
                                style={{ width: 'calc(var(--list-avatar-size) + 7px)', height: 'calc(var(--list-avatar-size) + 7px)' }}
                                title={
                                  showTimeline
                                    ? `Timeline: ${Math.round(ringPct * 100)}% · ${estadoCor.label}`
                                    : estadoCor.label
                                }
                              >
                                <svg
                                  className="pointer-events-none absolute inset-0 -rotate-90"
                                  viewBox="0 0 36 36"
                                  aria-hidden
                                >
                                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="2.2" />
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="15.5"
                                    fill="none"
                                    stroke={ringColor}
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    strokeDasharray={ringDash}
                                    className="transition-[stroke-dasharray] duration-500 ease-out"
                                    style={{ opacity: showTimeline || paused || blocked || isImported ? 1 : 0.45 }}
                                  />
                                </svg>
                                <div
                                  className="absolute inset-[3.5px] flex items-center justify-center overflow-hidden rounded-full bg-[var(--bg-surface)] font-semibold nl-text-muted"
                                  style={{ fontSize: 'var(--list-font-secondary)' }}
                                >
                                  {aluno.foto_path
                                    ? <img src={`local-resource://${aluno.foto_path}`} className="h-full w-full object-cover" alt="" />
                                    : getAlunoIniciais(aluno)}
                                </div>
                              </div>
                              <div className="flex min-w-0 flex-col justify-center gap-0.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isImported) abrirEdicao(aluno);
                                      else abrirPerfilAluno(aluno);
                                    }}
                                    className="min-w-0 text-left font-semibold nl-text hover:text-[var(--color-primary)] transition-colors truncate leading-none focus:outline-none focus:text-[var(--color-primary)]"
                                    style={{ fontSize: 'var(--list-font-primary)' }}
                                    title={isImported ? 'Editar importado' : 'Ver perfil (sem cobrança)'}
                                  >
                                    {aluno.nome}
                                  </button>
                                  {isImported && <span className="badge badge-warning !text-[9px] !py-0 shrink-0">importado</span>}
                                  {isOnLeave && <span className="badge badge-leave !text-[9px] !py-0 shrink-0">férias</span>}
                                  {isQuit && <span className="badge badge-quit !text-[9px] !py-0 shrink-0">desistente</span>}
                                  {paused && !isOnLeave && !isQuit && <span className="badge badge-warning !text-[9px] !py-0 shrink-0">pausa</span>}
                                  {!isImported && isNewStudent(aluno, hojeReferencia, 7) && (
                                    <span className="badge badge-warning !text-[9px] !py-0 shrink-0">★ novo</span>
                                  )}
                                  {!isImported && !isNewStudent(aluno, hojeReferencia, 7) && entrouNesteMes && (
                                    <span className="badge badge-info !text-[9px] !py-0 shrink-0">este mês</span>
                                  )}
                                </div>
                                <span className="truncate font-medium nl-text-muted leading-none" style={{ fontSize: 'var(--list-font-secondary)' }}>
                                  {aluno.categoria || 'Geral'}
                                </span>
                              </div>
                            </div>
                          </td>
                          {/* Notas — amarelo só com notas; monocrómatico se vazio; ícone cru */}
                          <td className="align-middle text-center" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <button
                              type="button"
                              onClick={() => onNotasClick(aluno)}
                              className="relative inline-flex items-center justify-center p-0.5 transition-opacity hover:opacity-80"
                              style={{ background: 'none', border: 'none', boxShadow: 'none' }}
                              title={temNotas ? `${totalNotas} nota(s)` : 'Adicionar nota'}
                            >
                              <StickyNote
                                size={21}
                                strokeWidth={2}
                                color={temNotas ? POSTIT_YELLOW : 'var(--text-tertiary, #9CA3AF)'}
                                fill={temNotas ? POSTIT_FILL : 'none'}
                                aria-hidden
                              />
                              {temNotas && (
                                <span
                                  className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                                  style={{ backgroundColor: POSTIT_YELLOW }}
                                >
                                  {totalNotas}
                                </span>
                              )}
                            </button>
                          </td>
                          {/* Telefone */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span className="block truncate font-medium tabular-nums nl-text-sub leading-none" style={{ fontSize: 'var(--list-font-primary)' }}>{aluno.telefone || '—'}</span>
                          </td>
                          {/* Mensalidade */}
                          <td className="align-middle text-right" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span
                              className="inline-flex items-center gap-1 rounded-[var(--radius-compact)] border px-2 py-0.5 font-semibold tabular-nums nl-text leading-none"
                              style={{
                                fontSize: 'var(--list-font-secondary)',
                                background: 'var(--list-chip-bg, var(--bg-surface))',
                                borderColor: 'var(--list-chip-border, var(--border-light))',
                              }}
                            >
                              <Shield size={10} className="nl-text-muted opacity-70" />
                              {formatCve(aluno.plano)}
                            </span>
                          </td>
                          {/* Próxima cobrança */}
                          <td className="align-middle text-center" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span
                              className="inline-flex min-w-[86px] justify-center rounded-[var(--radius-compact)] border px-2 py-0.5 font-medium tabular-nums nl-text-sub leading-none"
                              style={{
                                fontSize: 'var(--list-font-secondary)',
                                background: 'var(--list-chip-bg, var(--bg-surface))',
                                borderColor: 'var(--list-chip-border, var(--border-light))',
                              }}
                            >
                              {resumo.nextChargeDate || '—'}
                            </span>
                          </td>
                          {/* Estado — cobrança simples e forte */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <button
                              type="button"
                              disabled={!podeCobrar && !isImported}
                              onClick={() => {
                                if (isImported) {
                                  abrirEdicao(aluno);
                                  return;
                                }
                                if (!podeCobrar) return;
                                onEstadoPagamentoClick(aluno, resumo);
                              }}
                              className="group/pay flex min-h-[36px] w-full items-center gap-2 rounded-[var(--radius-control)] px-2.5 py-2 text-left transition-colors hover:brightness-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-55 disabled:cursor-not-allowed"
                              style={{
                                background: estadoCor.bg,
                                border: `1px solid ${estadoCor.border}`,
                                boxShadow: `inset 3px 0 0 ${estadoCor.fg}`,
                              }}
                              title={
                                isImported
                                  ? 'Confirmar dados do importado'
                                  : podeCobrar
                                    ? `${estadoCor.label} · ${estadoCor.hint}`
                                    : estadoCor.label
                              }
                            >
                              <Wallet
                                size={15}
                                strokeWidth={2.2}
                                className="shrink-0"
                                style={{ color: estadoCor.fg }}
                                aria-hidden
                              />
                              <span
                                className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-none"
                                style={{ color: estadoCor.fg }}
                              >
                                {estadoCor.label}
                              </span>
                              <span
                                className="shrink-0 text-[12px] font-bold tabular-nums leading-none"
                                style={{ color: estadoCor.fg }}
                              >
                                {estadoCor.metric}
                              </span>
                            </button>
                          </td>
                          {/* Acções */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => abrirPerfilAluno(aluno)}
                                className="nl-icon-btn !w-7 !h-7"
                                title="Ver perfil"
                              >
                                <BookUser size={13} />
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
                  className="group flex w-full shrink-0 items-center gap-4 border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/30 px-4 py-2 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--bg-surface))]"
                  title="Abrir resumo detalhado do mês"
                >
                  {/* Barra segmentada */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--border-light)] flex">
                      <div className="h-full bg-[var(--color-success)] transition-all duration-700 rounded-l-full" style={{ width: `${pctPago}%` }} />
                      <div className="h-full bg-[var(--color-error)] transition-all duration-700 rounded-r-full" style={{ width: `${pctDivida}%` }} />
                    </div>
                  </div>
                  {/* Valores */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden items-center gap-1.5 rounded-full border border-[var(--border-light)] bg-[var(--list-chip-bg,var(--bg-surface))] px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)] lg:flex">
                      <BarChart3 size={12} />
                      Detalhes
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-success)] shrink-0" />
                      <span className="text-[10px] nl-text-muted">Pagos</span>
                      <span className="text-[10px] font-semibold text-[var(--color-success)]">{resumoMensalFinanceiro.pagos.length}</span>
                      <span className="text-[10px] font-semibold text-[var(--color-success)]">{formatCve(totalPago)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-error)] shrink-0" />
                      <span className="text-[10px] nl-text-muted">Devidos</span>
                      <span className="text-[10px] font-semibold text-[var(--color-error)]">{resumoMensalFinanceiro.devidos.length}</span>
                      <span className="text-[10px] font-semibold text-[var(--color-error)]">{formatCve(totalDivida)}</span>
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
        <div className="fixed inset-0 z-[160] flex items-center justify-center nl-modal-overlay px-5 py-6" onClick={() => setMostrarResumoMensal(false)}>
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
