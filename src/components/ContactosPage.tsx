import React from 'react';
import {
  Users, Search, Sparkles, ChevronLeft, ChevronRight, ChevronDown,
  Smartphone, Mail, Edit, MoreVertical, Trash2, Pause, Ban, RotateCw, Shield,
  Phone, MapPin, Wallet, Tag, Calendar, Hash, Camera,
  CreditCard, Plus, MessageSquare, BookUser, CheckCircle2, AlertCircle, Clock,
} from 'lucide-react';
import {
  formatCve,
  getStudentStatusForMonth,
} from '../lib/billing';
import { STUDENT_STATUS_HELPERS } from '../constants';
import {
  getAlunoIniciais, getAvatarColorByName, getAlunoNomeSeguro,
} from '../utils/formatting';
import type { Student, Payment, ContactNote, DirectoryFilterStatus } from '../types';

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
  timelineFinanceiraMinimizada,
  setTimelineFinanceiraMinimizada,
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
  const resumoContacto = alunoPerfil ? getStudentStatusForMonth(alunoPerfil, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia) : null;
  const pagamentosAluno = alunoPerfil ? pagamentos.filter(p => (p.alunoId || p.aluno_id) === alunoPerfil.id).sort((a, b) => (b.id || 0) - (a.id || 0)) : [];

  return (
    <div className="flex flex-col h-full animate-slide-up w-full overflow-hidden bg-[var(--bg-surface)]">

      {/* ── Barra de navegação por mês ── */}
      <div className="sticky top-0 z-20 overflow-hidden border-b border-[#D7DCE3] bg-[#F0F3F7]/95 shadow-[0_7px_22px_rgba(15,23,42,0.08)] supports-[backdrop-filter]:backdrop-blur-md shrink-0">
        <div className="overflow-x-auto transition-all py-2">
          <div className="flex min-w-[1180px] items-center gap-4 px-6">
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-700 whitespace-nowrap">Ferramentas dos contactos</span>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setAnoFinanceiro((prev) => prev - 1)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-surface)] bg-white/60 text-[var(--text-secondary)] ring-1 ring-slate-200/70 transition-colors hover:bg-blue-50/80 hover:text-[var(--color-primary)]" title="Ano anterior"><ChevronLeft size={14} /></button>
                <div className="rounded-[var(--radius-surface)] bg-blue-50/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 ring-1 ring-blue-100/80">{anoFinanceiro}</div>
                <button onClick={() => setAnoFinanceiro((prev) => prev + 1)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-surface)] bg-white/60 text-[var(--text-secondary)] ring-1 ring-slate-200/70 transition-colors hover:bg-blue-50/80 hover:text-[var(--color-primary)]" title="Próximo ano"><ChevronRight size={14} /></button>
              </div>
            </div>
            <div className="relative flex-1 min-w-[520px]">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-blue-100/80" />
              <div className="relative flex items-center justify-between gap-1">
                {timelineMonths.map((month) => (
                  <button key={month.id} onClick={() => setMesFinanceiro(month.label)}
                    className={`group flex min-w-[76px] flex-col items-center rounded-[5px] px-1.5 transition-all ${timelineFinanceiraMinimizada ? 'gap-0 py-0.5' : 'gap-0.5 py-1'}`}
                    title={`${month.label} ${anoFinanceiro} • ${month.count} aluno(s)`}>
                    <span className={`h-3 w-3 rounded-full border transition-all ${month.active ? 'border-blue-200 bg-blue-300 shadow-[0_0_0_4px_rgba(191,219,254,0.55)]' : month.isCurrent ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white/80 group-hover:border-blue-200 group-hover:bg-blue-50'}`} />
                    <div className={`transition-all ${timelineFinanceiraMinimizada ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-[0.12em] ${month.active ? 'text-blue-700' : 'text-[var(--text-secondary)]'}`}>{month.shortLabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => setTimelineFinanceiraMinimizada((prev) => !prev)}
                className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-surface)] bg-white/60 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-secondary)] ring-1 ring-slate-200/70 transition-colors hover:bg-blue-50/70 hover:text-blue-700"
                title={timelineFinanceiraMinimizada ? 'Expandir linha do tempo' : 'Minimizar linha do tempo'}>
                <ChevronDown size={13} className={`transition-transform ${timelineFinanceiraMinimizada ? '-rotate-90' : 'rotate-0'}`} />
                {timelineFinanceiraMinimizada ? 'Expandir' : 'Minimizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden justify-center">
        <div className="flex h-full w-full overflow-hidden" style={{ maxWidth: `${larguraListas}px` }}>

          {/* ── Coluna esquerda: lista de contactos ── */}
          <div className="flex flex-col border-r border-[var(--border)] bg-white shrink-0" style={{ width: `${larguraSidebarContactos}px` }}>

            {/* Cabeçalho da lista */}
            <div className="px-4 pt-5 pb-3 border-b border-[var(--border-light)]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[15px] font-bold nl-text tracking-tight">Contactos</h2>
                  <p className="text-[11px] nl-text-muted mt-0.5">{alunosDirectorio.length} parceiros</p>
                </div>
                <button onClick={buscarDuplicados} title="Verificar duplicados" className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all">
                  <Sparkles size={13} />
                </button>
              </div>

              {/* Pesquisa */}
              <div className="relative mb-3">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={pesquisaDirectorio}
                  onChange={(e) => setPesquisaDirectorio(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-[12px] rounded-[6px] border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 outline-none focus:border-[var(--color-primary)]/50 focus:bg-white transition-all placeholder:text-slate-400 nl-text"
                />
              </div>

              {/* Filtros de status */}
              <div className="flex gap-1">
                {[
                  { id: 'todos',      label: 'Todos' },
                  { id: 'ativos',     label: 'Ativos' },
                  { id: 'pausados',   label: 'Paus.' },
                  { id: 'bloqueados', label: 'Bloq.' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFiltroDirectorioStatus(item.id as DirectoryFilterStatus)}
                    className={`flex-1 py-1 rounded-[4px] text-[9px] font-bold uppercase tracking-wide transition-all ${
                      filtroDirectorioStatus === item.id
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >{item.label}</button>
                ))}
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {alunosDirectorio.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                  <Users size={22} className="nl-text-muted" />
                  <p className="text-[11px] font-semibold nl-text-muted">Sem resultados</p>
                </div>
              ) : alunosDirectorio.map((aluno) => {
                const isSelected = alunoPerfil?.id === aluno.id;
                const resumoItem = getStudentStatusForMonth(aluno, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia);
                const estadoItem = (() => {
                  if (resumoItem.status === 'atrasado' || resumoItem.status === 'hoje') {
                    return { dot: 'bg-red-500', label: resumoItem.status === 'hoje' ? 'Hoje' : `${resumoItem.overdueDays || 0}d`, tone: 'text-red-700 bg-red-50 border-red-100' };
                  }
                  if (resumoItem.status === 'pago') return { dot: 'bg-emerald-500', label: 'Em dia', tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
                  if (STUDENT_STATUS_HELPERS.isImported(aluno.status)) return { dot: 'bg-amber-400', label: 'Rever', tone: 'text-amber-700 bg-amber-50 border-amber-100' };
                  if (STUDENT_STATUS_HELPERS.isPaused(aluno.status)) return { dot: 'bg-slate-400', label: 'Pausa', tone: 'text-slate-600 bg-slate-50 border-slate-100' };
                  if (STUDENT_STATUS_HELPERS.isBlocked(aluno.status)) return { dot: 'bg-red-800', label: 'Bloq.', tone: 'text-red-800 bg-red-50 border-red-100' };
                  return { dot: 'bg-blue-400', label: `${Math.max(resumoItem.daysUntilCharge || 0, 0)}d`, tone: 'text-blue-700 bg-blue-50 border-blue-100' };
                })();

                const iniciais = getAlunoIniciais(aluno);
                const avatarColor = getAvatarColorByName(aluno.nome);
                const totalNotasAluno = Number(notasResumo?.[aluno.id]?.total || 0);
                const notasBadgeLabel = totalNotasAluno > 99 ? '99+' : String(totalNotasAluno);

                return (
                  <button
                    key={aluno.id}
                      onClick={() => { setAlunoPerfil({ ...aluno, nome: getAlunoNomeSeguro(aluno) } as Student); carregarNotas(aluno.id); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-[var(--border-light)]/60 ${
                      isSelected
                        ? 'bg-[var(--color-primary-light)] border-l-2 border-l-[var(--color-primary)]'
                        : 'hover:bg-slate-50 border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Avatar circular */}
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white overflow-hidden ${isSelected ? 'bg-[var(--color-primary)]' : avatarColor}`}>
                        {aluno.foto_path
                          ? <img src={`local-resource://${aluno.foto_path}`} className="w-full h-full object-cover" />
                          : iniciais}
                      </div>
                      {totalNotasAluno > 0 && (
                        <span
                          className="absolute -right-1 -top-1 flex min-w-[17px] h-[17px] items-center justify-center rounded-full border-2 border-white bg-amber-400 px-1 text-[8px] font-black leading-none text-amber-950 shadow-[0_2px_6px_rgba(180,83,9,0.28)]"
                          title={`${totalNotasAluno} nota(s)`}
                        >
                          {notasBadgeLabel}
                        </span>
                      )}
                    </div>

                    {/* Nome + telefone */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-bold truncate leading-tight ${isSelected ? 'text-[var(--color-primary)]' : 'nl-text'}`}>
                        {aluno.nome}
                      </p>
                      <p className="text-[12px] nl-text-muted truncate leading-tight mt-0.5">
                        {aluno.telefone || '—'}
                      </p>
                    </div>

                    {/* Indicador de estado */}
                    <span className={`inline-flex max-w-[68px] items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold ${estadoItem.tone}`}>
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${estadoItem.dot}`} />
                      <span className="truncate">{estadoItem.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Coluna direita: detalhe do contacto ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {alunoPerfil && resumoContacto ? (() => {
              const emAtraso = resumoContacto.status === 'atrasado';
              const statusColor = emAtraso || resumoContacto.status === 'hoje'
                ? 'text-red-600 bg-red-50 border-red-200'
                : resumoContacto.status === 'pago'
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  : STUDENT_STATUS_HELPERS.isImported(alunoPerfil.status)
                    ? 'text-amber-600 bg-amber-50 border-amber-200'
                    : 'text-blue-600 bg-blue-50 border-blue-200';

              const iniciais = getAlunoIniciais(alunoPerfil);
              const avatarColor = getAvatarColorByName(alunoPerfil.nome);
              const pagamentoEmDia = resumoContacto.status === 'pago';
              const pagamentoCritico = resumoContacto.status === 'atrasado' || resumoContacto.status === 'hoje';
              const pagamentoPanel = pagamentoEmDia
                ? {
                    icon: <CheckCircle2 size={18} />,
                    title: 'Pagamento em dia',
                    desc: `Próxima cobrança: ${resumoContacto.nextChargeDate || alunoPerfil.vencimento || 'sem data'}`,
                    action: 'Rever e corrigir',
                    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
                    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                  }
                : pagamentoCritico
                  ? {
                      icon: <AlertCircle size={18} />,
                      title: resumoContacto.status === 'hoje' ? 'Vence hoje' : 'Pagamento em atraso',
                      desc: resumoContacto.status === 'hoje' ? 'Abrir cobrança para registar pagamento.' : `${resumoContacto.overdueDays || 0} dia(s) em atraso.`,
                      action: 'Cobrar agora',
                      className: 'border-red-200 bg-red-50 text-red-800',
                      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
                    }
                  : {
                      icon: <Clock size={18} />,
                      title: 'Acompanhar cobrança',
                      desc: `${Math.max(resumoContacto.daysUntilCharge || 0, 0)} dia(s) até à próxima cobrança.`,
                      action: 'Ajustar',
                      className: 'border-blue-200 bg-blue-50 text-blue-800',
                      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
                    };

              return (
                <>
                  {/* ── Header do perfil ── */}
                  <div className="px-8 py-4 border-b border-[var(--border-light)] bg-white flex items-center gap-5 shrink-0">
                    {/* Avatar grande com upload */}
                    <div className="relative group shrink-0">
                      <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-[18px] font-bold text-white ${avatarColor}`}>
                        {alunoPerfil.foto_path
                          ? <img src={`local-resource://${alunoPerfil.foto_path}`} className="w-full h-full object-cover" />
                          : iniciais}
                      </div>
                      <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                        <Camera className="text-white" size={14} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleUploadFoto} />
                      </label>
                    </div>

                    {/* Nome + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h2 className="text-[22px] font-black nl-text tracking-tight leading-none truncate">{alunoPerfil.nome}</h2>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider shrink-0 ${statusColor}`}>
                          {resumoContacto.statusLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] nl-text-muted">
                        <span className="flex items-center gap-1"><Phone size={11} className="opacity-50" />{alunoPerfil.telefone || '—'}</span>
                        {alunoPerfil.email && <><span className="opacity-30">·</span><span className="flex items-center gap-1"><Mail size={11} className="opacity-50" />{alunoPerfil.email}</span></>}
                        <span className="opacity-30">·</span>
                        <span className="flex items-center gap-1"><Tag size={11} className="opacity-50" />{alunoPerfil.categoria || 'Geral'}</span>
                      </div>
                      {emAtraso && resumoContacto.monthsInDebt.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[9px] font-bold text-red-600 uppercase tracking-wide">Em dívida:</span>
                          {resumoContacto.monthsInDebt.map(m => (
                            <span key={m} className="text-[8px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase">{m}</span>
                          ))}
                          {resumoContacto.monthsInDebt.length > 1 && (
                            <button onClick={() => abrirResolverPendencias(alunoPerfil)} className="text-[8px] font-bold text-white bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded uppercase transition-colors">Resolver tudo</button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acções */}
                    <div className="flex items-center gap-2 shrink-0 rounded-[var(--radius-control)] border border-slate-100 bg-slate-50 px-2.5 py-2">
                      <button onClick={() => enviarMensagemWhatsApp(alunoPerfil)} title="Enviar WhatsApp" className="h-9 px-3 rounded-[6px] flex items-center gap-2 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-100 transition-all"><Smartphone size={14} /> WhatsApp</button>
                      <button onClick={() => window.open(`mailto:${alunoPerfil.email}`)} title="Enviar email" className="h-9 px-3 rounded-[6px] flex items-center gap-2 text-[11px] font-bold nl-text bg-white hover:bg-slate-100 border border-slate-100 transition-all"><Mail size={14} /> Email</button>
                      <button onClick={() => abrirEdicao(alunoPerfil)} className="h-9 px-3 rounded-[6px] text-[11px] font-bold nl-text border border-slate-100 bg-white hover:bg-slate-100 transition-colors flex items-center gap-2"><Edit size={13} /> Editar</button>
                      <div className="relative" ref={menuAcoesRef}>
                        <button onClick={() => setMostrarMenuAcoes(!mostrarMenuAcoes)} title="Mais opções" className={`w-9 h-9 rounded-[6px] flex items-center justify-center nl-text-muted bg-white hover:bg-slate-100 border border-slate-100 transition-all ${mostrarMenuAcoes ? 'bg-slate-100' : ''}`}><MoreVertical size={14} /></button>
                        {mostrarMenuAcoes && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--border)] rounded-[var(--radius-control)] shadow-lg z-[110] overflow-hidden py-1">
                            <button onClick={() => { setMostrarMenuAcoes(false); alterarStatus(alunoPerfil.id, STUDENT_STATUS_HELPERS.isPaused(alunoPerfil.status) ? 'ativo' : 'pausado'); }} className="w-full px-4 py-2.5 text-left text-[12px] font-medium nl-text hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                              {STUDENT_STATUS_HELPERS.isPaused(alunoPerfil.status) ? <><RotateCw size={13} className="text-blue-500" /> Retomar</> : <><Pause size={13} className="text-amber-500" /> Pausar</>}
                            </button>
                            <button onClick={() => { setMostrarMenuAcoes(false); alterarStatus(alunoPerfil.id, STUDENT_STATUS_HELPERS.isBlocked(alunoPerfil.status) ? 'ativo' : 'bloqueado'); }} className="w-full px-4 py-2.5 text-left text-[12px] font-medium nl-text hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                              {STUDENT_STATUS_HELPERS.isBlocked(alunoPerfil.status) ? <><Shield size={13} className="text-blue-500" /> Desbloquear</> : <><Ban size={13} className="text-red-500" /> Bloquear</>}
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button onClick={() => { setMostrarMenuAcoes(false); eliminarAluno(alunoPerfil.id); }} className="w-full px-4 py-2.5 text-left text-[12px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                              <Trash2 size={13} /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Corpo: info + pagamentos ── */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-[380px_1fr] gap-0 h-full divide-x divide-[var(--border-light)]">

                      {/* Coluna A: Dados pessoais + notas */}
                      <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-slate-50/70">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Contacto</p>
                          <div className="space-y-0 divide-y divide-[var(--border-light)]">
                            {[
                              { icon: <Phone size={14} />, label: 'Telemóvel', value: alunoPerfil.telefone || '—' },
                              { icon: <Mail size={14} />, label: 'E-mail', value: alunoPerfil.email || '—' },
                              { icon: <MapPin size={14} />, label: 'Morada', value: alunoPerfil.morada || '—' },
                            ].map(row => (
                              <div key={row.label} className="flex items-start gap-3 py-3">
                                <span className="text-slate-400 mt-0.5 shrink-0">{row.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none mb-1.5">{row.label}</p>
                                  <p className="text-[15px] font-semibold nl-text leading-tight break-words">{row.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Plano & Inscrição</p>
                          <div className="space-y-0 divide-y divide-[var(--border-light)]">
                            {[
                              { icon: <Wallet size={14} />, label: 'Mensalidade', value: formatCve(alunoPerfil.plano) },
                              { icon: <Tag size={14} />, label: 'Categoria', value: alunoPerfil.categoria || 'Geral' },
                              { icon: <Calendar size={14} />, label: 'Inscrito em', value: alunoPerfil.data_matricula || '—' },
                              { icon: <Hash size={14} />, label: 'Referência', value: `#${String(alunoPerfil.id).slice(-6)}` },
                            ].map(row => (
                              <div key={row.label} className="flex items-start gap-3 py-3">
                                <span className="text-slate-400 mt-0.5 shrink-0">{row.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none mb-1.5">{row.label}</p>
                                  <p className="text-[15px] font-semibold nl-text leading-tight">{row.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {(alunoPerfil.objetivos || alunoPerfil.alergias) && (
                          <div className="space-y-2">
                            {alunoPerfil.objetivos && (
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Objectivos</p>
                                <p className="text-[15px] nl-text leading-relaxed">{alunoPerfil.objetivos}</p>
                              </div>
                            )}
                            {alunoPerfil.alergias && (
                              <div className="mt-3 px-3 py-2.5 rounded-[6px] bg-amber-50 border border-amber-200">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-1">Alergias</p>
                                <p className="text-[14px] text-amber-900 leading-tight">{alunoPerfil.alergias}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-auto flex max-h-[340px] shrink-0 flex-col overflow-hidden rounded-[4px] border border-amber-200 bg-[#FFF7C7] shadow-[0_10px_22px_rgba(146,64,14,0.10)]">
                          <div className="flex shrink-0 items-center justify-between border-b border-amber-200/70 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare size={15} className="text-amber-700" />
                              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-800">Notas do aluno</p>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700">{notasContacto.length}</span>
                          </div>
                          <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
                            <div className="flex shrink-0 gap-2">
                              <input
                                type="text"
                                placeholder="Escrever uma nota rápida..."
                                value={novaNota}
                                onChange={(e) => setNovaNota(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && adicionarNota()}
                                className="flex-1 h-9 px-3 text-[13px] rounded-[4px] border border-amber-200 bg-white/70 outline-none focus:border-amber-400 placeholder:text-amber-700/45 text-amber-950"
                              />
                              <button onClick={adicionarNota} className="w-9 h-9 rounded-[4px] bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors shrink-0">
                                <Plus size={15} />
                              </button>
                            </div>
                            <div className="mt-3 min-h-0 flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                              {notasContacto.length === 0 ? (
                                <p className="py-6 text-center text-[12px] font-semibold text-amber-700/60">Sem notas ainda.</p>
                              ) : notasContacto.map((nota) => (
                                <div key={nota.id} className="group relative rounded-[4px] border border-amber-200/70 bg-white/45 p-3">
                                  <p className="pr-6 text-[13px] leading-relaxed text-amber-950">{nota.texto}</p>
                                  <p className="mt-2 text-[10px] font-semibold text-amber-700/65">{nota.data_criacao}</p>
                                  <button onClick={() => eliminarNota(nota.id)} className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-amber-700/35 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Coluna B: Pagamentos e histórico */}
                      <div className="flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--border-light)] shrink-0">
                          <div className={`rounded-[var(--radius-surface)] border px-4 py-3 ${pagamentoPanel.className}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="mt-0.5 shrink-0">{pagamentoPanel.icon}</div>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-black leading-tight">{pagamentoPanel.title}</p>
                                  <p className="mt-1 truncate text-[11px] font-semibold opacity-80">{pagamentoPanel.desc}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => onEstadoPagamentoClick(alunoPerfil, resumoContacto)}
                                className={`shrink-0 rounded-[6px] px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-[0.98] ${pagamentoPanel.buttonClass}`}
                              >
                                {pagamentoPanel.action}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Resumo de billing */}
                        <div className="px-6 py-4 grid grid-cols-2 gap-3 border-b border-[var(--border-light)] shrink-0">
                          {[
                            { label: 'Estado', value: resumoContacto.statusLabel },
                            { label: 'Mensalidade', value: formatCve(alunoPerfil.plano) },
                            { label: 'Próx. cobrança', value: resumoContacto.nextChargeDate || '—' },
                            { label: 'Cobertura até', value: resumoContacto.coverageEnd || '—' },
                          ].map(card => (
                            <div key={card.label}>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{card.label}</p>
                              <p className="text-[13px] font-bold nl-text leading-tight">{card.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Lista de pagamentos */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                          {pagamentosAluno.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-40">
                              <CreditCard size={20} className="nl-text-muted" />
                              <p className="text-[11px] font-semibold nl-text-muted">Sem pagamentos</p>
                            </div>
                          ) : pagamentosAluno.map((p, i) => (
                            <div key={`${p.id}-${i}`} className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-light)] hover:bg-slate-50 transition-colors">
                              <div>
                                <p className="text-[12px] font-semibold nl-text leading-tight">{p?.data_pagamento || '—'}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{p?.metodo_pagamento || '—'}</p>
                              </div>
                              <span className="text-[13px] font-bold text-emerald-700">{formatCve(p?.valor)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </>
              );
            })() : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
                <BookUser size={32} className="nl-text-muted" />
                <div className="text-center">
                  <p className="text-[14px] font-semibold nl-text">Selecione um contacto</p>
                  <p className="text-[12px] nl-text-muted mt-1">Escolha um parceiro na lista para ver o perfil</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const ContactosPage = React.memo(ContactosPageComponent);

export default ContactosPage;
