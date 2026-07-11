import React, { useMemo } from 'react';
import {
  Users, Search, ChevronLeft, ChevronRight,
  Smartphone, Mail, Edit, MoreVertical, Trash2, Pause, Ban, RotateCw, Shield,
  Phone, MapPin, Wallet, Tag, Calendar, Hash, Camera,
  CreditCard, Plus, MessageSquare, BookUser, CheckCircle2, AlertCircle, Clock,
  StickyNote, X, Palmtree, UserX,
} from 'lucide-react';
import {
  formatCve,
  getStudentStatusForMonth,
} from '../lib/billing';
import { MONTH_OPTIONS, STUDENT_STATUS_HELPERS, getManualStatusTone } from '../constants';
import {
  getAlunoIniciais, getAvatarColorByName, getAlunoNomeSeguro,
  getTimelineMetricWidth, getTimelineRingColor,
} from '../utils/formatting';
import type { Student, Payment, ContactNote, DirectoryFilterStatus } from '../types';
import TimeRuler from './TimeRuler';

interface TimelineMonth {
  id: string;
  monthIndex: number;
  label: string;
  shortLabel: string;
  future: boolean;
  active: boolean;
  isCurrent: boolean;
  count: number;
  newCount: number;
  debtCount: number;
  monthStart: Date;
  monthEnd: Date;
}

interface ContactosPageProps {
  alunoPerfil: Student | null;
  setAlunoPerfil: (aluno: Student) => void;
  pagamentos: Payment[];
  anoFinanceiro: number;
  setAnoFinanceiro: React.Dispatch<React.SetStateAction<number>>;
  mesFinanceiroIndex: number;
  setMesFinanceiro: (m: string) => void;
  hojeReferencia: Date;
  timelineMonths: TimelineMonth[];
  timelineFinanceiraMinimizada: boolean;
  setTimelineFinanceiraMinimizada: React.Dispatch<React.SetStateAction<boolean>>;
  larguraListas: number;
  larguraSidebarContactos: number;
  alunosDirectorio: Student[];
  pesquisaDirectorio: string;
  setPesquisaDirectorio: (s: string) => void;
  filtroDirectorioStatus: DirectoryFilterStatus;
  setFiltroDirectorioStatus: (s: DirectoryFilterStatus) => void;
  mostrarMenuAcoes: boolean;
  setMostrarMenuAcoes: (v: boolean) => void;
  menuAcoesRef: React.RefObject<HTMLDivElement | null>;
  novaNota: string;
  setNovaNota: (s: string) => void;
  notasContacto: ContactNote[];
  notasResumo: Record<string, { total?: number }>;
  carregarNotas: (alunoId: string) => void;
  handleUploadFoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  enviarMensagemWhatsApp: (aluno: Student) => void;
  abrirEdicao: (aluno: Student) => void;
  alterarStatus: (alunoId: string, novoStatus: string) => void;
  eliminarAluno: (id: string) => void;
  onEstadoPagamentoClick: (aluno: Student, resumo: any) => void;
  abrirResolverPendencias: (aluno: Student) => void;
  adicionarNota: () => void;
  eliminarNota: (notaId: number) => void;
  buscarDuplicados: () => void;
}

const POSTIT = '#FFF59D';
const POSTIT_BORDER = '#E6D36A';
const POSTIT_INK = '#3D3410';
const POSTIT_MUTED = '#6B5B24';

/** Post-it real: cor sólida, sombra suave, chama atenção */
function PostItCard({
  title,
  subtitle,
  date,
  onDelete,
}: {
  title?: string;
  subtitle: string;
  date?: string;
  onDelete?: () => void;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-[var(--radius-control)] border p-3.5 transition-all hover:-translate-y-0.5"
      style={{
        background: POSTIT,
        borderColor: POSTIT_BORDER,
        boxShadow: '0 6px 18px rgba(90,70,10,0.10)',
      }}
    >
      {title && (
        <p className="text-[15px] font-semibold leading-snug tracking-tight" style={{ color: POSTIT_INK }}>
          {title}
        </p>
      )}
      <p className={`text-[12px] font-medium leading-relaxed ${title ? 'mt-1.5' : ''}`} style={{ color: POSTIT_MUTED }}>
        {subtitle}
      </p>
      {date && (
        <p className="mt-2 text-[10px] font-medium tabular-nums" style={{ color: POSTIT_MUTED }}>
          {date}
        </p>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100"
          style={{ color: 'var(--color-error)' }}
          title="Eliminar nota"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

function AvatarRing({
  aluno,
  size = 36,
  resumo,
}: {
  aluno: Student;
  size?: number;
  resumo: ReturnType<typeof getStudentStatusForMonth>;
}) {
  const progresso = getTimelineMetricWidth(resumo, aluno.status);
  const ringColor = getTimelineRingColor(resumo.status, aluno.status);
  const RING_C = 2 * Math.PI * 15.5;
  const ringPct = Math.max(0, Math.min(100, progresso)) / 100;
  const ringDash = `${(ringPct * RING_C).toFixed(2)} ${RING_C.toFixed(2)}`;
  const outer = size + 8;
  const iniciais = getAlunoIniciais(aluno);
  const avatarColor = getAvatarColorByName(aluno.nome);

  return (
    <div className="relative shrink-0" style={{ width: outer, height: outer }}>
      <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="2.4" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={ringColor}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray={ringDash}
          className="transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <div
        className={`absolute inset-[4px] flex items-center justify-center overflow-hidden rounded-full text-white font-semibold ${avatarColor}`}
        style={{ fontSize: size * 0.32 }}
      >
        {aluno.foto_path
          ? <img src={`local-resource://${aluno.foto_path}`} className="h-full w-full object-cover" alt="" />
          : iniciais}
      </div>
    </div>
  );
}

function ContactosPageComponent({
  alunoPerfil,
  setAlunoPerfil,
  pagamentos,
  anoFinanceiro,
  setAnoFinanceiro,
  mesFinanceiroIndex,
  setMesFinanceiro,
  hojeReferencia,
  timelineMonths,
  larguraListas,
  larguraSidebarContactos,
  alunosDirectorio,
  pesquisaDirectorio,
  setPesquisaDirectorio,
  filtroDirectorioStatus,
  setFiltroDirectorioStatus,
  mostrarMenuAcoes,
  setMostrarMenuAcoes,
  menuAcoesRef,
  novaNota,
  setNovaNota,
  notasContacto,
  notasResumo,
  carregarNotas,
  handleUploadFoto,
  enviarMensagemWhatsApp,
  abrirEdicao,
  alterarStatus,
  eliminarAluno,
  onEstadoPagamentoClick,
  abrirResolverPendencias,
  adicionarNota,
  eliminarNota,
  buscarDuplicados,
}: ContactosPageProps) {
  const resumoContacto = alunoPerfil
    ? getStudentStatusForMonth(alunoPerfil, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia)
    : null;
  const pagamentosAluno = alunoPerfil
    ? pagamentos
        .filter((p) => (p.alunoId || p.aluno_id) === alunoPerfil.id)
        .sort((a, b) => (b.id || 0) - (a.id || 0))
    : [];

  const rulerMarks = useMemo(
    () =>
      timelineMonths.map((m) => ({
        index: m.monthIndex,
        weight: Math.min(1, (m.count || 0) / Math.max(...timelineMonths.map((x) => x.count || 1), 1)),
      })),
    [timelineMonths],
  );

  const filtros: { id: DirectoryFilterStatus; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'ativos', label: 'Ativos' },
    { id: 'pausados', label: 'Pausados' },
    { id: 'bloqueados', label: 'Bloq.' },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden nl-bg-app animate-fade-in">
      {/* ── Barra única: ano | TimeRuler | pesquisa ── */}
      <div className="sticky top-0 z-20 shrink-0 border-b border-[var(--border)] bg-[var(--bg-header)]">
        <div className="flex h-12 items-center gap-2 px-3">
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setAnoFinanceiro((y) => y - 1)}
              className="nl-icon-btn nl-icon-btn-sm"
              title="Ano anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="rounded-[var(--radius-compact)] border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-[12px] font-semibold tabular-nums nl-text">
              {anoFinanceiro}
            </span>
            <button
              type="button"
              onClick={() => setAnoFinanceiro((y) => Math.min(y + 1, hojeReferencia.getFullYear()))}
              disabled={anoFinanceiro >= hojeReferencia.getFullYear()}
              className="nl-icon-btn nl-icon-btn-sm"
              title="Próximo ano"
            >
              <ChevronRight size={14} />
            </button>
            <span className="ml-1 hidden text-[12px] font-semibold text-[var(--color-primary)] lg:inline">Contactos</span>
          </div>

          <div className="min-w-0 flex-1">
            <TimeRuler
              year={anoFinanceiro}
              selectedIndex={Math.max(0, mesFinanceiroIndex)}
              referenceDate={hojeReferencia}
              accent="home"
              maxWidth={420}
              marks={rulerMarks}
              onSelect={(_i, mes) => setMesFinanceiro(mes)}
              onYearChange={setAnoFinanceiro}
              onGoToCurrent={() => {
                setAnoFinanceiro(hojeReferencia.getFullYear());
                setMesFinanceiro(MONTH_OPTIONS[hojeReferencia.getMonth()]);
              }}
            />
          </div>

          <div className="relative w-[min(220px,26vw)] shrink-0">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-[var(--color-primary)]" />
            <input
              type="text"
              placeholder="Pesquisar contacto…"
              value={pesquisaDirectorio}
              onChange={(e) => setPesquisaDirectorio(e.target.value)}
              className="h-9 w-full rounded-[var(--radius-control)] border-2 border-[var(--color-primary)] bg-[var(--bg-surface)] pl-8 pr-8 text-[12px] font-medium nl-text outline-none shadow-[0_0_0_3px_var(--shadow-primary-focus)] placeholder:text-[var(--text-tertiary)]"
            />
            {pesquisaDirectorio ? (
              <button
                type="button"
                onClick={() => setPesquisaDirectorio('')}
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full nl-text-muted hover:bg-[var(--color-secondary-light)]"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Corpo ── */}
      <div className="flex min-h-0 flex-1 justify-center overflow-hidden px-3 py-3">
        <div
          className="flex h-full w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]"
          style={{ maxWidth: larguraListas }}
        >
          {/* Sidebar lista */}
          <aside
            className="flex shrink-0 flex-col border-r border-[var(--border)]"
            style={{ width: larguraSidebarContactos }}
          >
            <div className="border-b border-[var(--border-light)] px-3 py-3">
              <div className="mb-2.5 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold nl-text">Directório</h2>
                  <p className="text-[11px] font-medium nl-text-muted">{alunosDirectorio.length} contactos</p>
                </div>
                <button
                  type="button"
                  onClick={buscarDuplicados}
                  title="Verificar duplicados"
                  className="nl-icon-btn nl-icon-btn-sm"
                >
                  <Users size={14} />
                </button>
              </div>
              <div className="flex gap-1">
                {filtros.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroDirectorioStatus(f.id)}
                    className={`flex-1 rounded-[var(--radius-compact)] py-1.5 text-[10px] font-semibold transition-all ${
                      filtroDirectorioStatus === f.id
                        ? 'bg-[var(--color-success)] text-white'
                        : 'bg-[var(--color-secondary-light)] nl-text-sub hover:bg-[var(--color-secondary-lighter)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
              {alunosDirectorio.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 opacity-50">
                  <Users size={22} className="nl-text-muted" />
                  <p className="text-[12px] font-medium nl-text-muted">Sem resultados</p>
                </div>
              ) : (
                alunosDirectorio.map((aluno) => {
                  const resumoItem = getStudentStatusForMonth(
                    aluno,
                    pagamentos,
                    anoFinanceiro,
                    mesFinanceiroIndex,
                    hojeReferencia,
                  );
                  const isSelected = alunoPerfil?.id === aluno.id;
                  const totalNotas = Number(notasResumo?.[aluno.id]?.total || 0);
                  const isAtrasado = resumoItem.status === 'atrasado' || resumoItem.status === 'hoje';
                  const isPago = resumoItem.status === 'pago';
                  const manualTone =
                    STUDENT_STATUS_HELPERS.isExcludedFromBilling(aluno.status) && !STUDENT_STATUS_HELPERS.isImported(aluno.status)
                      ? getManualStatusTone(aluno.status)
                      : null;

                  return (
                    <button
                      key={aluno.id}
                      type="button"
                      onClick={() => {
                        setAlunoPerfil(aluno);
                        carregarNotas(aluno.id);
                      }}
                      className={`flex w-full items-center gap-2.5 border-b border-[var(--border-light)] px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-[color-mix(in_srgb,var(--color-success)_10%,var(--bg-surface))]'
                          : 'hover:bg-[var(--color-secondary-light)]'
                      }`}
                      style={manualTone && !isSelected ? { boxShadow: `inset 3px 0 0 ${manualTone.fg}` } : undefined}
                    >
                      <div className="relative">
                        <AvatarRing aluno={aluno} resumo={resumoItem} size={36} />
                        {totalNotas > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-warning)] px-1 text-[9px] font-bold text-white">
                            {totalNotas > 99 ? '99+' : totalNotas}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[13px] font-semibold leading-tight ${isSelected ? 'text-[var(--color-success)]' : 'nl-text'}`}>
                          {getAlunoNomeSeguro(aluno)}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-medium nl-text-muted">
                          {aluno.telefone || aluno.categoria || '—'}
                        </p>
                      </div>
                      {manualTone ? (
                        <span className={`badge ${manualTone.badge} shrink-0 !text-[10px] !py-0.5`}>
                          {manualTone.label}
                        </span>
                      ) : (
                        <span
                          className={`shrink-0 rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-semibold ${
                            isAtrasado
                              ? 'bg-[color-mix(in_srgb,var(--color-error)_12%,var(--bg-surface))] text-[var(--color-error)]'
                              : isPago
                                ? 'bg-[color-mix(in_srgb,var(--color-success)_12%,var(--bg-surface))] text-[var(--color-success)]'
                                : 'bg-[var(--color-secondary-light)] nl-text-sub'
                          }`}
                        >
                          {resumoItem.statusLabel || resumoItem.status}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Detalhe */}
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {alunoPerfil && resumoContacto ? (
              <>
                {/* Header perfil */}
                <div className="flex shrink-0 items-center gap-4 border-b border-[var(--border-light)] bg-[var(--bg-header)] px-5 py-3.5">
                  <div className="relative group shrink-0">
                    <AvatarRing aluno={alunoPerfil} resumo={resumoContacto} size={52} />
                    <label className="absolute inset-[4px] flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="text-white" size={14} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleUploadFoto} />
                    </label>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[20px] font-semibold tracking-tight nl-text">
                        {getAlunoNomeSeguro(alunoPerfil)}
                      </h2>
                      {(() => {
                        const manual = alunoPerfil.status;
                        if (STUDENT_STATUS_HELPERS.isQuit(manual) || STUDENT_STATUS_HELPERS.isOnLeave(manual) || STUDENT_STATUS_HELPERS.isPaused(manual) || STUDENT_STATUS_HELPERS.isBlocked(manual)) {
                          const t = getManualStatusTone(manual);
                          return <span className={`badge ${t.badge}`}>{t.label}</span>;
                        }
                        return (
                          <span
                            className={`badge ${
                              resumoContacto.status === 'atrasado' || resumoContacto.status === 'hoje'
                                ? 'badge-error'
                                : resumoContacto.status === 'pago'
                                  ? 'badge-success'
                                  : 'badge-info'
                            }`}
                          >
                            {resumoContacto.statusLabel}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-medium nl-text-muted">
                      <span className="inline-flex items-center gap-1"><Phone size={12} />{alunoPerfil.telefone || '—'}</span>
                      {alunoPerfil.email && (
                        <span className="inline-flex items-center gap-1"><Mail size={12} />{alunoPerfil.email}</span>
                      )}
                      <span className="inline-flex items-center gap-1"><Tag size={12} />{alunoPerfil.categoria || 'Geral'}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => enviarMensagemWhatsApp(alunoPerfil)}
                      className="nl-btn nl-btn-sm !border-[var(--color-success)] !bg-[color-mix(in_srgb,var(--color-success)_12%,var(--bg-surface))] !text-[var(--color-success)]"
                    >
                      <Smartphone size={13} /> WhatsApp
                    </button>
                    <button type="button" onClick={() => abrirEdicao(alunoPerfil)} className="nl-btn nl-btn-secondary nl-btn-sm">
                      <Edit size={13} /> Editar
                    </button>
                    <div className="relative" ref={menuAcoesRef}>
                      <button
                        type="button"
                        onClick={() => setMostrarMenuAcoes(!mostrarMenuAcoes)}
                        className="nl-icon-btn"
                        title="Mais opções"
                      >
                        <MoreVertical size={15} />
                      </button>
                      {mostrarMenuAcoes && (
                        <div className="absolute right-0 top-full z-[110] mt-1 w-48 overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-surface)] py-1 shadow-[var(--shadow-lg)]">
                          {STUDENT_STATUS_HELPERS.isExcludedFromBilling(alunoPerfil.status)
                            && !STUDENT_STATUS_HELPERS.isImported(alunoPerfil.status) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMostrarMenuAcoes(false);
                                alterarStatus(alunoPerfil.id, 'ativo');
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium nl-text hover:bg-[var(--color-secondary-light)]"
                            >
                              <RotateCw size={13} /> Reativar aluno
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setMostrarMenuAcoes(false);
                                  alterarStatus(alunoPerfil.id, 'pausado');
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium nl-text hover:bg-[var(--color-secondary-light)]"
                              >
                                <Pause size={13} /> Pausar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMostrarMenuAcoes(false);
                                  alterarStatus(alunoPerfil.id, 'ferias');
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium nl-text hover:bg-[var(--color-secondary-light)]"
                              >
                                <Palmtree size={13} /> Férias
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMostrarMenuAcoes(false);
                                  alterarStatus(alunoPerfil.id, 'desistente');
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium nl-text hover:bg-[var(--color-secondary-light)]"
                              >
                                <UserX size={13} /> Desistência
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMostrarMenuAcoes(false);
                                  alterarStatus(alunoPerfil.id, 'bloqueado');
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium nl-text hover:bg-[var(--color-secondary-light)]"
                              >
                                <Ban size={13} /> Bloquear
                              </button>
                            </>
                          )}
                          <div className="nl-divider my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setMostrarMenuAcoes(false);
                              eliminarAluno(alunoPerfil.id);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-[var(--color-error)] hover:bg-red-50"
                          >
                            <Trash2 size={13} /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Corpo: dados + post-its + pagamentos */}
                <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="grid min-h-full gap-0 lg:grid-cols-[minmax(280px,360px)_1fr]">
                    {/* Coluna dados + notas */}
                    <div className="flex flex-col gap-4 border-r border-[var(--border-light)] bg-[var(--color-secondary-light)]/40 p-4">
                      <div className="nl-card !p-3.5">
                        <p className="mb-2 text-[12px] font-semibold nl-text-muted">Contacto</p>
                        <div className="space-y-2.5">
                          {[
                            { icon: <Phone size={13} />, label: 'Telemóvel', value: alunoPerfil.telefone || '—' },
                            { icon: <Mail size={13} />, label: 'E-mail', value: alunoPerfil.email || '—' },
                            { icon: <MapPin size={13} />, label: 'Morada', value: alunoPerfil.morada || '—' },
                          ].map((row) => (
                            <div key={row.label} className="flex items-start gap-2.5">
                              <span className="mt-0.5 nl-text-muted">{row.icon}</span>
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium nl-text-muted">{row.label}</p>
                                <p className="text-[13px] font-semibold leading-snug nl-text break-words">{row.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="nl-card !p-3.5">
                        <p className="mb-2 text-[12px] font-semibold nl-text-muted">Plano</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { icon: <Wallet size={13} />, label: 'Mensalidade', value: formatCve(alunoPerfil.plano) },
                            { icon: <Tag size={13} />, label: 'Categoria', value: alunoPerfil.categoria || 'Geral' },
                            { icon: <Calendar size={13} />, label: 'Inscrito', value: alunoPerfil.data_matricula || '—' },
                            { icon: <Hash size={13} />, label: 'Ref.', value: `#${String(alunoPerfil.id).slice(-6)}` },
                          ].map((row) => (
                            <div key={row.label} className="rounded-[var(--radius-compact)] border border-[var(--border-light)] bg-[var(--bg-surface)] px-2.5 py-2">
                              <p className="flex items-center gap-1 text-[10px] font-medium nl-text-muted">
                                {row.icon} {row.label}
                              </p>
                              <p className="mt-0.5 truncate text-[12px] font-semibold nl-text">{row.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Post-its — cor sólida, chama atenção */}
                      <div
                        className="flex min-h-[260px] flex-1 flex-col overflow-hidden rounded-[var(--radius-lg)] border p-3"
                        style={{
                          background: POSTIT,
                          borderColor: POSTIT_BORDER,
                          boxShadow: '0 10px 28px rgba(90,70,10,0.10)',
                        }}
                      >
                        <div className="mb-2.5 flex shrink-0 items-center justify-between px-0.5">
                          <div className="flex items-center gap-2">
                            <StickyNote size={16} style={{ color: '#EAB308' }} />
                            <div>
                              <p className="text-[15px] font-semibold leading-none" style={{ color: POSTIT_INK }}>Notas</p>
                              <p className="mt-0.5 text-[11px] font-medium" style={{ color: POSTIT_MUTED }}>
                                {notasContacto.length} registo(s)
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-2.5 flex shrink-0 gap-2">
                          <input
                            type="text"
                            placeholder="Escrever nota…"
                            value={novaNota}
                            onChange={(e) => setNovaNota(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && adicionarNota()}
                            className="h-9 flex-1 rounded-full border px-3 text-[12px] font-medium outline-none"
                            style={{
                              borderColor: POSTIT_BORDER,
                              background: 'rgba(255,255,255,0.7)',
                              color: POSTIT_INK,
                            }}
                          />
                          <button
                            type="button"
                            onClick={adicionarNota}
                            className="flex h-9 items-center gap-1 rounded-full px-3 text-[12px] font-semibold text-white"
                            style={{ background: 'var(--color-success)' }}
                            title="Adicionar"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto custom-scrollbar pr-0.5">
                          {notasContacto.length === 0 ? (
                            <p className="py-8 text-center text-[12px] font-medium" style={{ color: POSTIT_MUTED }}>
                              Sem notas ainda. Escreva a primeira.
                            </p>
                          ) : (
                            notasContacto.map((nota) => (
                              <PostItCard
                                key={nota.id}
                                subtitle={nota.texto}
                                date={nota.data_criacao}
                                onDelete={() => eliminarNota(nota.id)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coluna cobrança + histórico */}
                    <div className="flex flex-col overflow-hidden">
                      <div className="shrink-0 border-b border-[var(--border-light)] p-4">
                        {(() => {
                          const emDia = resumoContacto.status === 'pago';
                          const critico = resumoContacto.status === 'atrasado' || resumoContacto.status === 'hoje';
                          const tone = emDia ? 'nl-alert-success' : critico ? 'nl-alert-error' : 'nl-alert-info';
                          const icon = emDia ? <CheckCircle2 size={18} /> : critico ? <AlertCircle size={18} /> : <Clock size={18} />;
                          const title = emDia
                            ? 'Pagamento em dia'
                            : resumoContacto.status === 'hoje'
                              ? 'Vence hoje'
                              : critico
                                ? 'Em atraso'
                                : 'Acompanhar cobrança';
                          const desc = emDia
                            ? `Próxima cobrança: ${resumoContacto.nextChargeDate || alunoPerfil.vencimento || '—'}`
                            : critico
                              ? resumoContacto.status === 'hoje'
                                ? 'Registe o pagamento hoje.'
                                : `${resumoContacto.overdueDays || 0} dia(s) em atraso.`
                              : `${Math.max(resumoContacto.daysUntilCharge || 0, 0)} dia(s) até à próxima cobrança.`;
                          return (
                            <div className={`rounded-[var(--radius-control)] border px-3.5 py-3 ${tone}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-2.5">
                                  <span className="mt-0.5 shrink-0">{icon}</span>
                                  <div className="min-w-0">
                                    <p className="text-[14px] font-semibold leading-tight">{title}</p>
                                    <p className="mt-1 text-[12px] font-medium opacity-85">{desc}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onEstadoPagamentoClick(alunoPerfil, resumoContacto)}
                                  className="nl-btn nl-btn-sm shrink-0 !border-[var(--color-success)] !bg-[var(--color-success)] !text-white"
                                >
                                  <Wallet size={13} /> Cobrar
                                </button>
                              </div>
                              {critico && resumoContacto.monthsInDebt?.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => abrirResolverPendencias(alunoPerfil)}
                                  className="mt-2 text-[11px] font-semibold underline opacity-90"
                                >
                                  Resolver {resumoContacto.monthsInDebt.length} meses em dívida
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-[var(--border-light)] p-4 sm:grid-cols-4">
                        {[
                          { label: 'Estado', value: resumoContacto.statusLabel },
                          { label: 'Mensalidade', value: formatCve(alunoPerfil.plano) },
                          { label: 'Próx. cobrança', value: resumoContacto.nextChargeDate || '—' },
                          { label: 'Cobertura até', value: resumoContacto.coverageEnd || '—' },
                        ].map((card) => (
                          <div key={card.label} className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
                            <p className="text-[11px] font-medium nl-text-muted">{card.label}</p>
                            <p className="mt-0.5 truncate text-[13px] font-semibold nl-text">{card.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="sticky top-0 z-[1] border-b border-[var(--border-light)] bg-[var(--bg-header)] px-4 py-2">
                          <p className="text-[12px] font-semibold nl-text">Histórico de pagamentos</p>
                        </div>
                        {pagamentosAluno.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-12 opacity-50">
                            <CreditCard size={22} className="nl-text-muted" />
                            <p className="text-[12px] font-medium nl-text-muted">Sem pagamentos</p>
                          </div>
                        ) : (
                          pagamentosAluno.map((p, i) => (
                            <div
                              key={`${p.id}-${i}`}
                              className="flex items-center justify-between border-b border-[var(--border-light)] px-4 py-2.5 transition-colors hover:bg-[var(--color-secondary-light)]"
                            >
                              <div>
                                <p className="text-[13px] font-semibold nl-text">{p?.data_pagamento || '—'}</p>
                                <p className="text-[11px] font-medium nl-text-muted">{p?.metodo_pagamento || '—'}{p?.mes_referencia ? ` · ${p.mes_referencia}` : ''}</p>
                              </div>
                              <span className="text-[13px] font-semibold tabular-nums text-[var(--color-success)]">
                                {formatCve(p?.valor)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 opacity-50">
                <BookUser size={36} className="nl-text-muted" />
                <div className="text-center">
                  <p className="text-[15px] font-semibold nl-text">Selecione um contacto</p>
                  <p className="mt-1 text-[12px] font-medium nl-text-muted">
                    Escolha alguém na lista para ver o perfil e as notas
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const ContactosPage = React.memo(ContactosPageComponent);

export default ContactosPage;
