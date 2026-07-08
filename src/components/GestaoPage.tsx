// @ts-nocheck
import { memo, type CSSProperties } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, LayoutList, AlertCircle,
  CheckCircle2, FileSpreadsheet, ChevronDown, ArrowUpDown, Zap,
  Clock, Search, X, BookUser, Shield, Users,
} from 'lucide-react';
import { formatCve } from '../lib/billing';
import type { MonthlyBillingSummary } from '../lib/billing';
import {
  isFutureMonth,
  getTimelineMetricWidth,
  getTimelineMetricBarClass,
} from '../utils/formatting';
import { MONTH_OPTIONS } from '../constants';
import type { StudentSortMode } from '../types';

interface Aluno {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  sexo?: string;
  data_nascimento?: string;
  morada?: string;
  alergias?: string;
  objetivos?: string;
  horario_preferido?: string;
  plano: string;
  vencimento: string;
  progresso: number;
  data_matricula?: string;
  status?: string;
  categoria?: string;
  modo_cobranca?: string;
  foto_path?: string;
  notas?: string;
}

interface HistoricoMensalItem {
  aluno: Aluno;
  resumo: MonthlyBillingSummary;
  dataMatricula: Date | null;
  entrouNesteMes: boolean;
  origem: string;
}

interface ResumoFinanceiroItem {
  aluno: Aluno;
  resumo: MonthlyBillingSummary;
}

export interface GestaoPageProps {
  larguraListas: number;
  mostrarFiltroListaAlunos: boolean;
  setMostrarFiltroListaAlunos: (v: boolean) => void;
  mostrarOrdenacaoListaAlunos: boolean;
  setMostrarOrdenacaoListaAlunos: (v: boolean) => void;
  mostrarCalendarioMeses: boolean;
  setMostrarCalendarioMeses: (v: boolean) => void;
  periodoAtualSelecionado: boolean;
  periodoSelecionadoLabel: string;
  subtituloPeriodoSelecionado: string;
  historicoMensalFiltrado: HistoricoMensalItem[];
  alunosNovosNoPeriodo: HistoricoMensalItem[];
  anoFinanceiro: number;
  setAnoFinanceiro: (v: number) => void;
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
  alunosImportados: Aluno[];
  totalRecebidoPeriodo: number;
  previsaoRecuperacao: number;
  progressoPeriodoPercentual: number;
  periodoSelecionadoPassado: boolean;
  diasNoPeriodoSelecionado: number;
  diaProgressoPeriodo: number;
  periodoSelecionadoFuturo: boolean;
  estiloTabelaAlunos: CSSProperties;
  setAlunoPerfil: (v: Aluno | null) => void;
  irParaMesAtualOperacional: (mostrarAviso?: boolean) => void;
  abrirEdicao: (aluno: Aluno) => void;
  abrirPerfilAluno: (aluno?: Aluno | null) => void;
  finalizarTodosImportados: () => void;
  setAba: (v: string) => void;
}

const isPausedStatus = (status?: string) => status === 'pausado' || status === 'suspenso';
const isBlockedStatus = (status?: string) => status === 'bloqueado';
const isImportedStatus = (status?: string) => status === 'importado';

function GestaoPage({
  larguraListas,
  mostrarFiltroListaAlunos,
  setMostrarFiltroListaAlunos,
  mostrarOrdenacaoListaAlunos,
  setMostrarOrdenacaoListaAlunos,
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
  setAlunoPerfil,
  irParaMesAtualOperacional,
  abrirEdicao,
  abrirPerfilAluno,
  finalizarTodosImportados,
  setAba,
}: GestaoPageProps) {
  const getAlunoNomeSeguro = (aluno?: Partial<Aluno> | null) => {
    const nome = String(aluno?.nome || '').trim();
    return nome || 'Aluno sem nome';
  };

  const getAlunoIniciais = (aluno?: Partial<Aluno> | null) =>
    getAlunoNomeSeguro(aluno).slice(0, 2).toUpperCase();

  return (
    <div className="animate-slide-up h-full flex flex-col w-full overflow-hidden bg-[#F8FAFC]">
      <div className="sticky top-0 z-20 overflow-visible border-b border-[var(--border)] bg-white/95 px-6 py-2.5 backdrop-blur-md">
        <div className="mx-auto flex min-h-[48px] w-full items-center gap-5" style={{ maxWidth: `${larguraListas}px` }}>
          <div className="flex min-w-[210px] items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMostrarFiltroListaAlunos(false);
                setMostrarOrdenacaoListaAlunos(false);
                setMostrarCalendarioMeses((prev) => !prev);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-[7px] border bg-white shadow-sm transition-colors ${
                periodoAtualSelecionado ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-red-200 text-red-700 hover:bg-red-50'
              }`}
              title="Escolher mês"
            >
              <Calendar size={16} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={`truncate text-[18px] font-black leading-none capitalize ${periodoAtualSelecionado ? 'text-emerald-700' : 'text-red-700'}`}>
                  {periodoSelecionadoLabel}
                </p>
                <span className={`hidden rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] md:inline-flex ${
                  periodoAtualSelecionado ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {subtituloPeriodoSelecionado}
                </span>
              </div>
              <p className="mt-1 truncate text-[10px] font-bold text-slate-500">
                {historicoMensalFiltrado.length} alunos · {alunosNovosNoPeriodo.length} entradas
              </p>
            </div>

            {mostrarCalendarioMeses && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMostrarCalendarioMeses(false)} />
                <div className="absolute left-6 top-14 z-30 w-[310px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-lg)]">
                  <div className="flex items-center justify-between mb-3">
                    <button type="button" onClick={() => setAnoFinanceiro((prev) => prev - 1)} className="flex h-8 w-8 items-center justify-center rounded-[5px] text-slate-500 hover:bg-slate-100 hover:text-blue-700" title="Ano anterior">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-600">{anoFinanceiro}</span>
                    <button type="button" onClick={() => setAnoFinanceiro((prev) => Math.min(prev + 1, anoAtual))} disabled={anoFinanceiro >= anoAtual} className="flex h-8 w-8 items-center justify-center rounded-[5px] text-slate-500 hover:bg-slate-100 hover:text-blue-700 disabled:opacity-35 disabled:cursor-not-allowed" title="Próximo ano">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
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
                          className={`rounded-[6px] border px-2 py-2 text-[11px] font-black capitalize transition-all ${
                            active && current
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
                              : active
                                ? 'border-red-300 bg-red-50 text-red-700 shadow-sm'
                                : current
                                  ? 'border-emerald-200 bg-white text-emerald-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                          } disabled:cursor-not-allowed disabled:opacity-35`}
                        >
                          {mes.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => { irParaMesAtualOperacional(); setMostrarCalendarioMeses(false); }} className="mt-3 w-full rounded-[6px] bg-emerald-600 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white hover:bg-emerald-700">
                    Ir para mês atual
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="min-w-[440px] flex-1">
            <div className="relative h-9 rounded-[8px] border border-slate-200 bg-slate-50 px-3">
              <div className="absolute left-3 right-3 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full rounded-full ${periodoAtualSelecionado ? 'bg-emerald-500' : periodoSelecionadoPassado ? 'bg-slate-400' : 'bg-red-400'}`} style={{ width: `${progressoPeriodoPercentual}%` }} />
              </div>
              <div className="relative flex h-full items-center justify-between">
                {Array.from({ length: diasNoPeriodoSelecionado }, (_, index) => {
                  const day = index + 1;
                  const major = day === 1 || day === diasNoPeriodoSelecionado || day % 5 === 0;
                  const passed = day <= diaProgressoPeriodo;
                  return (
                    <span key={day} className="flex h-full flex-col items-center justify-center" title={`Dia ${day}`}>
                      <span className={`w-px ${major ? 'h-5' : 'h-3'} ${passed ? (periodoAtualSelecionado ? 'bg-emerald-600' : 'bg-slate-500') : 'bg-slate-300'}`} />
                      {major && <span className="mt-0.5 text-[7px] font-black tabular-nums text-slate-400">{day}</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex min-w-[180px] items-center justify-end gap-2">
            {!periodoAtualSelecionado && (
              <button type="button" onClick={() => irParaMesAtualOperacional()} className="h-8 rounded-[6px] bg-emerald-600 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-emerald-700">
                Mês atual
              </button>
            )}
            <span className="hidden text-right text-[10px] font-bold text-slate-500 lg:block">
              {Math.round(progressoPeriodoPercentual)}% do mês
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 py-6">
        <div className="mx-auto h-full w-full" style={{ maxWidth: `${larguraListas}px` }}>
          <div className="nl-card flex h-full overflow-hidden flex-col !rounded-[var(--radius-md)] !p-0 border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]">
            {/* Tabela — toolbar lives INSIDE the scroll container so backdrop-blur sees content scroll behind it */}
            <div className="overflow-y-auto flex-1 custom-scrollbar nl-font-list" style={estiloTabelaAlunos}>
            <div className="border-b border-[var(--border-light)] px-4 py-3 sticky top-0 z-20" style={{ background: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}>
              <div className="grid grid-cols-[240px_220px_1fr_320px] items-center gap-3 whitespace-nowrap">
                <div className="relative z-30">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarOrdenacaoListaAlunos(false);
                      setMostrarCalendarioMeses(false);
                      setMostrarFiltroListaAlunos((prev) => !prev);
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-[7px] border border-[var(--border-light)] bg-white px-3 text-[11px] font-black uppercase tracking-[0.1em] text-slate-600 shadow-sm hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      {filtroStatus === 'todos' && <LayoutList size={14} />}
                      {filtroStatus === 'divida' && <AlertCircle size={14} className="text-red-600" />}
                      {filtroStatus === 'cobertos' && <CheckCircle2 size={14} className="text-emerald-600" />}
                      {filtroStatus === 'importados' && <FileSpreadsheet size={14} className="text-amber-600" />}
                      {filtroStatus === 'todos' ? 'Todos' : filtroStatus === 'divida' ? 'Em dívida' : filtroStatus === 'cobertos' ? 'Cobertos' : 'Importados'}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${mostrarFiltroListaAlunos ? 'rotate-180' : ''}`} />
                  </button>

                  {mostrarFiltroListaAlunos && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setMostrarFiltroListaAlunos(false)} />
                      <div className="absolute left-0 top-11 z-30 w-[240px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] py-1 shadow-[var(--shadow-lg)]">
                        {[
                          { id: 'todos', label: 'Todos', detail: `${historicoMensalFiltrado.length} resultados`, icon: <LayoutList size={14} /> },
                          { id: 'divida', label: 'Em dívida', detail: `${alunosEmDivida.length} em atraso`, icon: <AlertCircle size={14} className="text-red-600" /> },
                          { id: 'cobertos', label: 'Cobertos', detail: 'Pagos ou em dia', icon: <CheckCircle2 size={14} className="text-emerald-600" /> },
                          { id: 'importados', label: 'Importados', detail: `${alunosImportados.length} por rever`, icon: <FileSpreadsheet size={14} className="text-amber-600" /> },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => { setFiltroStatus(item.id as 'todos' | 'divida' | 'cobertos' | 'importados'); setMostrarFiltroListaAlunos(false); }}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              filtroStatus === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-slate-100">{item.icon}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[12px] font-black">{item.label}</span>
                              <span className="block truncate text-[10px] font-bold text-slate-400">{item.detail}</span>
                            </span>
                            {filtroStatus === item.id && <CheckCircle2 size={13} />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="relative z-30">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFiltroListaAlunos(false);
                      setMostrarCalendarioMeses(false);
                      setMostrarOrdenacaoListaAlunos((prev) => !prev);
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-[7px] border border-[var(--border-light)] bg-white px-3 text-[11px] font-black uppercase tracking-[0.1em] text-slate-600 shadow-sm hover:bg-slate-50"
                    title="Organizar lista"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowUpDown size={14} />
                      {ordenacaoListaAlunos === 'inteligente'
                        ? 'Inteligente'
                        : ordenacaoListaAlunos === 'alfabetica'
                          ? 'A-Z'
                          : ordenacaoListaAlunos === 'inscricao_recente'
                            ? 'Último inscrito'
                            : 'Primeiro inscrito'}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${mostrarOrdenacaoListaAlunos ? 'rotate-180' : ''}`} />
                  </button>

                  {mostrarOrdenacaoListaAlunos && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setMostrarOrdenacaoListaAlunos(false)} />
                      <div className="absolute left-0 top-11 z-30 w-[240px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] py-1 shadow-[var(--shadow-lg)]">
                        {[
                          { id: 'inteligente', label: 'Inteligente', detail: 'Prioriza cobrança e urgência', icon: <Zap size={14} className="text-blue-600" /> },
                          { id: 'alfabetica', label: 'Ordem alfabética', detail: 'A-Z pelo nome do aluno', icon: <ArrowUpDown size={14} /> },
                          { id: 'inscricao_recente', label: 'Último inscrito', detail: 'Mais recentes primeiro', icon: <Clock size={14} className="text-emerald-600" /> },
                          { id: 'inscricao_antiga', label: 'Primeiro inscrito', detail: 'Mais antigos primeiro', icon: <ArrowUpDown size={14} className="text-slate-600" /> },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => { setOrdenacaoListaAlunos(item.id as StudentSortMode); setMostrarOrdenacaoListaAlunos(false); }}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              ordenacaoListaAlunos === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-slate-100">{item.icon}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[12px] font-black">{item.label}</span>
                              <span className="block truncate text-[10px] font-bold text-slate-400">{item.detail}</span>
                            </span>
                            {ordenacaoListaAlunos === item.id && <CheckCircle2 size={13} />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-center">
                <div className="relative w-full max-w-[520px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Buscar aluno, telefone ou referência..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    className="nl-input h-10 w-full !rounded-[7px] !pl-9 !pr-9 !bg-white !border-[var(--border-light)] text-[12px] shadow-sm"
                  />
                  {pesquisa && (
                    <button
                      type="button"
                      onClick={() => setPesquisa('')}
                      className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-slate-100 hover:text-[var(--color-primary)]"
                      title="Limpar pesquisa"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <span className="hidden text-right text-[11px] font-bold text-slate-500 lg:inline">
                    {historicoMensalFiltrado.length} resultados · {alunosEmDivida.length} em atraso · {formatCve(totalRecebidoPeriodo)} recebido
                  </span>
                  <button
                    type="button"
                    onClick={() => { setAba('contactos'); setAlunoPerfil(null); }}
                    className="flex h-9 items-center gap-2 rounded-[7px] border border-[var(--border-light)] bg-white px-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 hover:bg-slate-50"
                    title="Abrir vista de contactos"
                  >
                    <BookUser size={13} />
                    Contactos
                  </button>
                </div>
              </div>
            </div>

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
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--color-secondary-lighter)] text-[10px] font-semibold nl-text-muted uppercase tracking-[0.06em] sticky top-[56px] z-10 border-b border-[var(--border-light)]">
                    <tr>
                      <th style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '3%', textAlign: 'center' }}>#</th>
                      <th style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '20%' }}>Aluno</th>
                      <th style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '11%' }}>Telefone</th>
                      <th style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '10%' }}>Mensalidade</th>
                      <th style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '10%' }}>Próx. cobrança</th>
                      <th style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '27%' }}>Estado</th>
                      <th style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '10%' }}>Categoria</th>
                      <th style={{ padding: 'var(--list-row-py) var(--list-row-px)', width: '9%', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoMensalFiltrado.map(({ aluno, resumo, entrouNesteMes }, index) => {
                      const isImported = isImportedStatus(aluno.status);
                      const progressoDias = getTimelineMetricWidth(resumo, aluno.status);
                      const paused = isPausedStatus(aluno.status);
                      const blocked = isBlockedStatus(aluno.status);
                      const isAtrasado = resumo.status === 'atrasado' || resumo.status === 'hoje';
                      const isPago = resumo.status === 'pago';
                      const isDentroDoPrazo = !isAtrasado && !isPago;

                      const estadoCor = (() => {
                        if (isImported)    return { dot: '#D97706', label: 'Importado', text: '#92400E', bg: '#FFFBEB', border: '#FDE68A' };
                        if (blocked)       return { dot: '#B91C1C', label: 'Bloqueado', text: '#991B1B', bg: '#FEF2F2', border: '#FECACA' };
                        if (paused)        return { dot: '#78350F', label: 'Pausado',   text: '#78350F', bg: '#FFF7ED', border: '#FED7AA' };
                        if (isAtrasado)    return { dot: '#DC2626', label: resumo.status === 'hoje' ? 'Vence hoje' : 'Atrasado', text: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' };
                        if (isPago)        return { dot: '#16A34A', label: 'Em dia',    text: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' };
                        if (isDentroDoPrazo) return { dot: '#2563EB', label: 'No prazo',  text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
                        return             { dot: '#64748b', label: 'Regular',   text: '#475569', bg: '#F8FAFC', border: '#E2E8F0' };
                      })();

                      return (
                        <tr
                          key={`${periodoSelecionadoKey}-${aluno.id}`}
                          className={`group border-b border-[var(--border-light)] transition-colors cursor-pointer ${isImported ? 'bg-amber-50 hover:bg-amber-100' : `rp-${index % 6}`}`}
                          onClick={() => isImported ? abrirEdicao(aluno) : abrirPerfilAluno(aluno)}
                          title={isImported ? 'Clique para editar e confirmar dados' : 'Clique para ver o perfil completo do aluno'}
                        >
                          {/* Nº */}
                          <td className="align-middle text-center" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span className="text-[10px] font-medium nl-text-muted tabular-nums">{index + 1}</span>
                          </td>
                          {/* Aluno */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-[var(--color-secondary-lighter)] flex items-center justify-center font-semibold nl-text-muted border border-[var(--border)] overflow-hidden shrink-0" style={{ width: 'var(--list-avatar-size)', height: 'var(--list-avatar-size)', fontSize: 'var(--list-font-secondary)' }}>
                                {aluno.foto_path ? <img src={`local-resource://${aluno.foto_path}`} className="w-full h-full object-cover" /> : getAlunoIniciais(aluno)}
                              </div>
                              <div className="flex min-w-0 flex-col">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-medium nl-text group-hover:text-[var(--color-primary)] transition-colors truncate" style={{ fontSize: 'var(--list-font-primary)' }}>{aluno.nome}</p>
                                  {isImported && <span className="text-[8px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-[3px] shrink-0">importado</span>}
                                  {!isImported && entrouNesteMes && <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary-light)] px-1.5 py-0.5 rounded-[3px] shrink-0">novo</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* Telefone */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span className="nl-text-muted" style={{ fontSize: 'var(--list-font-secondary)' }}>{aluno.telefone || '—'}</span>
                          </td>
                          {/* Mensalidade — escudo */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] border border-[var(--border)] bg-[var(--color-secondary-lighter)]/50">
                              <Shield size={10} className="nl-text-muted shrink-0 opacity-60" />
                              <span className="font-semibold nl-text whitespace-nowrap" style={{ fontSize: 'var(--list-font-secondary)' }}>{formatCve(aluno.plano)}</span>
                            </div>
                          </td>
                          {/* Próxima cobrança */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span className="nl-text-muted" style={{ fontSize: 'var(--list-font-secondary)' }}>{resumo.nextChargeDate || '—'}</span>
                          </td>
                          {/* Estado — pill badge + barra */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                                style={{ background: estadoCor.bg, color: estadoCor.text, border: `1px solid ${estadoCor.border}` }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: estadoCor.dot }} />
                                {estadoCor.label}
                              </span>
                              {!paused && !blocked && !isImported && (
                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                  <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-secondary-lighter)]">
                                    <div className={`h-full rounded-full transition-all duration-500 ${getTimelineMetricBarClass(resumo.status)}`} style={{ width: `${progressoDias}%` }} />
                                  </div>
                                  <p className="nl-text-muted truncate leading-none" style={{ fontSize: '9px' }}>{resumo.statusLabel}</p>
                                </div>
                              )}
                            </div>
                          </td>
                          {/* Categoria */}
                          <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                            <span className="nl-text-muted truncate" style={{ fontSize: 'var(--list-font-secondary)' }}>{aluno.categoria || '—'}</span>
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
              const totalPago   = totalRecebidoPeriodo;
              const totalDivida = previsaoRecuperacao;
              const totalGeral  = Math.max(1, totalPago + totalDivida);
              const pctPago     = Math.round((totalPago   / totalGeral) * 100);
              const pctDivida   = Math.round((totalDivida / totalGeral) * 100);
              return (
                <div className="shrink-0 border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/30 px-4 py-2 flex items-center gap-4">
                  {/* Barra segmentada */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--border-light)] flex">
                      <div className="h-full bg-emerald-500 transition-all duration-700 rounded-l-full" style={{ width: `${pctPago}%` }} />
                      <div className="h-full bg-red-400 transition-all duration-700 rounded-r-full" style={{ width: `${pctDivida}%` }} />
                    </div>
                  </div>
                  {/* Valores */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[10px] nl-text-muted">Recebido</span>
                      <span className="text-[10px] font-semibold text-emerald-700">{formatCve(totalPago)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                      <span className="text-[10px] nl-text-muted">Em dívida</span>
                      <span className="text-[10px] font-semibold text-red-600">{formatCve(totalDivida)}</span>
                    </div>
                    <div className="h-3 w-px bg-[var(--border)]" />
                    <span className="text-[10px] nl-text-muted">{historicoMensalFiltrado.length} alunos · {mesFinanceiro} {anoFinanceiro}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(GestaoPage);
