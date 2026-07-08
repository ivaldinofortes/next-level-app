// @ts-nocheck
import React from 'react';
import {
  Users, Search, Sparkles, ChevronLeft, ChevronRight, ChevronDown,
  Smartphone, Mail, Edit, MoreVertical, Trash2, Pause, Ban, RotateCw, Shield,
  Phone, MapPin, Wallet, Tag, Calendar, Hash, Camera,
  CreditCard, Plus, MessageSquare, BookUser,
} from 'lucide-react';
import {
  formatCve,
  getStudentStatusForMonth,
} from '../lib/billing';

const isPausedStatus = (status?: string) => status === 'pausado' || status === 'suspenso';
const isBlockedStatus = (status?: string) => status === 'bloqueado';
const isImportedStatus = (status?: string) => status === 'importado';

const getAlunoIniciais = (aluno?: { nome?: string } | null) => {
  const nome = String(aluno?.nome || '').trim();
  return (nome || '?').slice(0, 2).toUpperCase();
};

const getAvatarColorByName = (nome?: string) => {
  const avatarColors = [
    'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-indigo-500',
  ];
  return avatarColors[(String(nome || 'A').charCodeAt(0) || 65) % avatarColors.length];
};

const getAlunoNomeSeguro = (aluno?: Partial<{ nome?: string }> | null) => {
  return String(aluno?.nome || '').trim() || 'Aluno sem nome';
};

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

interface Nota {
  id: number;
  aluno_id: string;
  texto: string;
  data_criacao: string;
}

interface Pagamento {
  id?: number;
  alunoId: string;
  aluno_id?: string;
  nome?: string;
  valor: string;
  status: 'pago' | 'pendente';
  data_pagamento?: string;
  metodo_pagamento?: string;
  mes_referencia?: string;
  referencia_inicio?: string;
  referencia_fim?: string;
}

type DirectoryFilterStatus = 'todos' | 'ativos' | 'pausados' | 'bloqueados';

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
  alunoPerfil: Aluno | null;
  setAlunoPerfil: (aluno: Aluno) => void;
  pagamentos: Pagamento[];
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
  alunosDirectorio: Aluno[];
  pesquisaDirectorio: string;
  setPesquisaDirectorio: (s: string) => void;
  filtroDirectorioStatus: DirectoryFilterStatus;
  setFiltroDirectorioStatus: (s: DirectoryFilterStatus) => void;
  mostrarMenuAcoes: boolean;
  setMostrarMenuAcoes: (v: boolean) => void;
  menuAcoesRef: React.RefObject<HTMLDivElement | null>;
  novaNota: string;
  setNovaNota: (s: string) => void;
  notasContacto: Nota[];
  carregarNotas: (alunoId: string) => void;
  handleUploadFoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  enviarMensagemWhatsApp: (aluno: Aluno) => void;
  abrirEdicao: (aluno: Aluno) => void;
  alterarStatus: (alunoId: string, novoStatus: string) => void;
  eliminarAluno: (id: string) => void;
  abrirResolverPendencias: (aluno: Aluno) => void;
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
  carregarNotas,
  handleUploadFoto,
  enviarMensagemWhatsApp,
  abrirEdicao,
  alterarStatus,
  eliminarAluno,
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
      <div className="sticky top-0 z-20 overflow-hidden border-b border-blue-100 bg-[#EEF4FF] shrink-0">
        <div className="overflow-x-auto transition-all py-1.5">
          <div className="flex min-w-[1180px] items-center gap-4 px-6">
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-extrabold nl-text tracking-tight whitespace-nowrap">Arquivo por mês</span>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setAnoFinanceiro((prev) => prev - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]" title="Ano anterior"><ChevronLeft size={14} /></button>
                <div className="rounded-full border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">{anoFinanceiro}</div>
                <button onClick={() => setAnoFinanceiro((prev) => prev + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]" title="Próximo ano"><ChevronRight size={14} /></button>
              </div>
            </div>
            <div className="relative flex-1 min-w-[520px]">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#D9E2F2]" />
              <div className="relative flex items-center justify-between gap-1">
                {timelineMonths.map((month) => (
                  <button key={month.id} onClick={() => setMesFinanceiro(month.label)}
                    className={`group flex min-w-[76px] flex-col items-center rounded-[5px] px-1.5 transition-all ${timelineFinanceiraMinimizada ? 'gap-0 py-0.5' : 'gap-0.5 py-1'}`}
                    title={`${month.label} ${anoFinanceiro} • ${month.count} aluno(s)`}>
                    <span className={`h-3 w-3 rounded-full border transition-all ${month.active ? 'border-[var(--color-primary)] bg-[var(--color-primary)] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]' : month.isCurrent ? 'border-[#2563EB] bg-white' : 'border-[var(--border)] bg-[var(--bg-surface)] group-hover:border-[var(--color-primary)]/45'}`} />
                    <div className={`transition-all ${timelineFinanceiraMinimizada ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-[0.12em] ${month.active ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)]'}`}>{month.shortLabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => setTimelineFinanceiraMinimizada((prev) => !prev)}
                className="inline-flex h-7 items-center gap-2 rounded-full border border-[var(--border-light)] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-secondary-lighter)]/45"
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
                const dotColor = resumoItem.status === 'atrasado' || resumoItem.status === 'hoje'
                  ? 'bg-red-500'
                  : resumoItem.status === 'pago'
                    ? 'bg-emerald-500'
                    : isImportedStatus(aluno.status)
                      ? 'bg-amber-400'
                      : isPausedStatus(aluno.status)
                        ? 'bg-slate-400'
                        : isBlockedStatus(aluno.status)
                          ? 'bg-red-800'
                          : 'bg-blue-400';

                const iniciais = getAlunoIniciais(aluno);
                const avatarColor = getAvatarColorByName(aluno.nome);

                return (
                  <button
                    key={aluno.id}
                    onClick={() => { setAlunoPerfil({ ...aluno, nome: getAlunoNomeSeguro(aluno) } as Aluno); carregarNotas(aluno.id); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[var(--border-light)]/60 ${
                      isSelected
                        ? 'bg-[var(--color-primary-light)] border-l-2 border-l-[var(--color-primary)]'
                        : 'hover:bg-slate-50 border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Avatar circular */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden ${isSelected ? 'bg-[var(--color-primary)]' : avatarColor}`}>
                      {aluno.foto_path
                        ? <img src={`local-resource://${aluno.foto_path}`} className="w-full h-full object-cover" />
                        : iniciais}
                    </div>

                    {/* Nome + telefone */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate leading-tight ${isSelected ? 'text-[var(--color-primary)]' : 'nl-text'}`}>
                        {aluno.nome}
                      </p>
                      <p className="text-[11px] nl-text-muted truncate leading-tight mt-0.5">
                        {aluno.telefone || '—'}
                      </p>
                    </div>

                    {/* Indicador de estado */}
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
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
                  : isImportedStatus(alunoPerfil.status)
                    ? 'text-amber-600 bg-amber-50 border-amber-200'
                    : 'text-blue-600 bg-blue-50 border-blue-200';

              const iniciais = getAlunoIniciais(alunoPerfil);
              const avatarColor = getAvatarColorByName(alunoPerfil.nome);

              return (
                <>
                  {/* ── Header do perfil ── */}
                  <div className="px-8 py-5 border-b border-[var(--border-light)] bg-white flex items-center gap-5 shrink-0">
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
                        <h2 className="text-[18px] font-bold nl-text tracking-tight leading-none truncate">{alunoPerfil.nome}</h2>
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => enviarMensagemWhatsApp(alunoPerfil)} title="WhatsApp" className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all"><Smartphone size={14} /></button>
                      <button onClick={() => window.open(`mailto:${alunoPerfil.email}`)} title="E-mail" className="w-8 h-8 rounded-full flex items-center justify-center nl-text-muted hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"><Mail size={14} /></button>
                      <div className="w-px h-5 bg-slate-200 mx-1" />
                      <button onClick={() => abrirEdicao(alunoPerfil)} className="h-8 px-3 rounded-[6px] text-[11px] font-semibold nl-text border border-[var(--border)] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"><Edit size={12} /> Editar</button>
                      <div className="relative" ref={menuAcoesRef}>
                        <button onClick={() => setMostrarMenuAcoes(!mostrarMenuAcoes)} title="Mais opções" className={`w-8 h-8 rounded-full flex items-center justify-center nl-text-muted hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all ${mostrarMenuAcoes ? 'bg-slate-100' : ''}`}><MoreVertical size={14} /></button>
                        {mostrarMenuAcoes && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--border)] rounded-[8px] shadow-lg z-[110] overflow-hidden py-1">
                            <button onClick={() => { setMostrarMenuAcoes(false); alterarStatus(alunoPerfil.id, isPausedStatus(alunoPerfil.status) ? 'ativo' : 'pausado'); }} className="w-full px-4 py-2.5 text-left text-[12px] font-medium nl-text hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                              {isPausedStatus(alunoPerfil.status) ? <><RotateCw size={13} className="text-blue-500" /> Retomar</> : <><Pause size={13} className="text-amber-500" /> Pausar</>}
                            </button>
                            <button onClick={() => { setMostrarMenuAcoes(false); alterarStatus(alunoPerfil.id, isBlockedStatus(alunoPerfil.status) ? 'ativo' : 'bloqueado'); }} className="w-full px-4 py-2.5 text-left text-[12px] font-medium nl-text hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                              {isBlockedStatus(alunoPerfil.status) ? <><Shield size={13} className="text-blue-500" /> Desbloquear</> : <><Ban size={13} className="text-red-500" /> Bloquear</>}
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

                  {/* ── Corpo: info + finanças + notas ── */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-[280px_1fr_260px] gap-0 h-full divide-x divide-[var(--border-light)]">

                      {/* Coluna A: Dados pessoais */}
                      <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Contacto</p>
                          <div className="space-y-0 divide-y divide-[var(--border-light)]">
                            {[
                              { icon: <Phone size={12} />, label: 'Telemóvel', value: alunoPerfil.telefone || '—' },
                              { icon: <Mail size={12} />, label: 'E-mail', value: alunoPerfil.email || '—' },
                              { icon: <MapPin size={12} />, label: 'Morada', value: alunoPerfil.morada || '—' },
                            ].map(row => (
                              <div key={row.label} className="flex items-start gap-3 py-2.5">
                                <span className="text-slate-400 mt-0.5 shrink-0">{row.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">{row.label}</p>
                                  <p className="text-[12px] nl-text leading-tight break-words">{row.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Plano & Inscrição</p>
                          <div className="space-y-0 divide-y divide-[var(--border-light)]">
                            {[
                              { icon: <Wallet size={12} />, label: 'Mensalidade', value: formatCve(alunoPerfil.plano) },
                              { icon: <Tag size={12} />, label: 'Categoria', value: alunoPerfil.categoria || 'Geral' },
                              { icon: <Calendar size={12} />, label: 'Inscrito em', value: alunoPerfil.data_matricula || '—' },
                              { icon: <Hash size={12} />, label: 'Referência', value: `#${String(alunoPerfil.id).slice(-6)}` },
                            ].map(row => (
                              <div key={row.label} className="flex items-start gap-3 py-2.5">
                                <span className="text-slate-400 mt-0.5 shrink-0">{row.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">{row.label}</p>
                                  <p className="text-[12px] nl-text leading-tight">{row.value}</p>
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
                                <p className="text-[12px] nl-text leading-relaxed">{alunoPerfil.objetivos}</p>
                              </div>
                            )}
                            {alunoPerfil.alergias && (
                              <div className="mt-3 px-3 py-2.5 rounded-[6px] bg-amber-50 border border-amber-200">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-1">Alergias</p>
                                <p className="text-[12px] text-amber-900 leading-tight">{alunoPerfil.alergias}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Coluna B: Histórico financeiro */}
                      <div className="flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--border-light)] flex items-center justify-between shrink-0">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Cobranças</p>
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

                      {/* Coluna C: Notas */}
                      <div className="flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--border-light)] shrink-0">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Notas</p>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Adicionar nota..."
                              value={novaNota}
                              onChange={(e) => setNovaNota(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && adicionarNota()}
                              className="flex-1 h-8 px-3 text-[11px] rounded-[6px] border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 outline-none focus:border-[var(--color-primary)]/50 focus:bg-white transition-all placeholder:text-slate-400 nl-text"
                            />
                            <button onClick={adicionarNota} className="w-8 h-8 rounded-[6px] bg-[var(--color-primary)] text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0">
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-2">
                          {notasContacto.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-40">
                              <MessageSquare size={18} className="nl-text-muted" />
                              <p className="text-[11px] font-semibold nl-text-muted">Nenhuma nota</p>
                            </div>
                          ) : notasContacto.map((nota, i) => (
                            <div key={nota.id} className="group relative rounded-[6px] border border-[var(--border-light)] bg-white p-3 hover:shadow-sm transition-shadow">
                              <p className="text-[12px] nl-text leading-relaxed pr-5">{nota.texto}</p>
                              <p className="text-[9px] text-slate-400 mt-2">{nota.data_criacao}</p>
                              <button onClick={() => eliminarNota(nota.id)} className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={10} />
                              </button>
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
