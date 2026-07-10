// @ts-nocheck
import { memo, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Download,
  FileBarChart,
  Printer,
  ShieldCheck,
  StickyNote,
  Users,
  Wallet,
} from 'lucide-react';
import {
  formatCve,
  getStudentStatusForMonth,
  isPaymentInsideMonth,
  normalizeAmount,
  parseFlexibleDate,
} from '../lib/billing';
import {
  MONTH_OPTIONS,
  getBillingBadgeLabel,
  STUDENT_STATUS_HELPERS,
} from '../constants';

const isFutureMonth = (monthIndex: number, year: number, reference = new Date()) => {
  const currentYear = reference.getFullYear();
  const currentMonth = reference.getMonth();
  return year > currentYear || (year === currentYear && monthIndex > currentMonth);
};

const parseAdminDate = (value?: string | null) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const ptMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ptMatch) return new Date(Number(ptMatch[3]), Number(ptMatch[2]) - 1, Number(ptMatch[1]));

  const isoLike = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
  const date = new Date(isoLike);
  return Number.isNaN(date.getTime()) ? parseFlexibleDate(raw) : date;
};

const isSameDay = (left?: string | null, right = new Date()) => {
  const date = parseAdminDate(left);
  return Boolean(date && date.getFullYear() === right.getFullYear() && date.getMonth() === right.getMonth() && date.getDate() === right.getDate());
};

const isInsideMonth = (value: string | null | undefined, monthIndex: number, year: number) => {
  const date = parseAdminDate(value);
  return Boolean(date && date.getFullYear() === year && date.getMonth() === monthIndex);
};

interface Aluno {
  id: string;
  nome: string;
  telefone: string;
  plano: string;
  vencimento: string;
  data_matricula?: string;
  status?: string;
  categoria?: string;
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

type AdminUser = {
  id: number | string;
  name?: string;
  email?: string;
  role?: string;
  is_active?: number;
  created_at?: string;
  last_login_at?: string;
};

type AdminLog = {
  id: number | string;
  acao?: string;
  detalhes?: string;
  user_name?: string;
  data_hora?: string;
};

type AdminTechnicalLog = {
  id: number | string;
  tipo?: string;
  contexto?: string;
  mensagem?: string;
  utilizador?: string;
  criado_em?: string;
  data_hora?: string;
};

type AdminNote = {
  id: number | string;
  aluno_id?: string;
  nome?: string;
  texto?: string;
  data_criacao?: string;
};

type AdminData = {
  users: AdminUser[];
  logs: AdminLog[];
  technicalLogs: AdminTechnicalLog[];
  notes: AdminNote[];
};

type ReportView = 'resumo' | 'atividade' | 'utilizadores' | 'notas';

export interface RelatoriosPageProps {
  mesRelatorio: string;
  setMesRelatorio: React.Dispatch<React.SetStateAction<string>>;
  anoRelatorio: number;
  setAnoRelatorio: React.Dispatch<React.SetStateAction<number>>;
  timelineFinanceiraMinimizada: boolean;
  setTimelineFinanceiraMinimizada: React.Dispatch<React.SetStateAction<boolean>>;
  alunos: Aluno[];
  pagamentos: Pagamento[];
  hojeReferencia: Date;
  larguraListas: number;
  appLogo: string;
  nomeAcademia: string;
  sessionUser: { role?: string; name?: string } | null;
  onExportarExcel: () => void;
  onExportarPdf: () => void;
}

const RelatoriosPage = memo(function RelatoriosPage({
  mesRelatorio,
  setMesRelatorio,
  anoRelatorio,
  setAnoRelatorio,
  timelineFinanceiraMinimizada,
  setTimelineFinanceiraMinimizada,
  alunos,
  pagamentos,
  hojeReferencia,
  larguraListas,
  appLogo,
  nomeAcademia,
  sessionUser,
  onExportarExcel,
  onExportarPdf,
}: RelatoriosPageProps) {
  const [adminData, setAdminData] = useState<AdminData>({ users: [], logs: [], technicalLogs: [], notes: [] });
  const [adminLoading, setAdminLoading] = useState(true);
  const [vista, setVista] = useState<ReportView>('resumo');

  const isAdmin = sessionUser?.role === 'admin' || sessionUser?.role === 'root';
  const mesIdxRel = MONTH_OPTIONS.indexOf(mesRelatorio);
  const refRelatorio = useMemo(() => new Date(anoRelatorio, mesIdxRel + 1, 0), [anoRelatorio, mesIdxRel]);
  const hoje = useMemo(() => new Date(), []);

  useEffect(() => {
    let mounted = true;
    const loadAdminData = async () => {
      setAdminLoading(true);
      try {
        const electron = window.electron;
        if (!electron || !isAdmin) return;
        const result = await electron.ipcRenderer.invoke('reports:admin-data');
        if (mounted && result?.success) {
          setAdminData({
            users: result.users || [],
            logs: result.logs || [],
            technicalLogs: result.technicalLogs || [],
            notes: result.notes || [],
          });
        }
      } finally {
        if (mounted) setAdminLoading(false);
      }
    };
    loadAdminData();
    return () => { mounted = false; };
  }, [isAdmin]);

  const relatorio = useMemo(() => {
    const alunosPeriodo = [...alunos]
      .filter((aluno) => {
        const entrada = parseFlexibleDate(aluno.data_matricula);
        return entrada ? entrada.getTime() <= refRelatorio.getTime() : true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));

    const resumos = alunosPeriodo.map((aluno) => ({
      aluno,
      resumo: getStudentStatusForMonth(aluno, pagamentos, anoRelatorio, mesIdxRel, hojeReferencia),
    }));

    const pagamentosMes = pagamentos.filter((pagamento) => isPaymentInsideMonth(pagamento, mesRelatorio, anoRelatorio));
    const pagamentosHoje = pagamentos.filter((pagamento) => isSameDay(pagamento.data_pagamento, hoje));
    const receitaMes = pagamentosMes.reduce((sum, pagamento) => sum + normalizeAmount(pagamento.valor), 0);
    const previsaoMes = alunosPeriodo.filter((aluno) => STUDENT_STATUS_HELPERS.isOperational(aluno.status)).reduce((sum, aluno) => sum + normalizeAmount(aluno.plano), 0);
    const atrasados = resumos.filter(({ resumo }) => resumo.status === 'atrasado' || resumo.status === 'hoje');
    const pagos = resumos.filter(({ resumo }) => resumo.status === 'pago');
    const emDia = resumos.filter(({ resumo }) => ['pago', 'alerta', 'pendente', 'critico'].includes(resumo.status));
    const logsMes = adminData.logs.filter((log) => isInsideMonth(log.data_hora, mesIdxRel, anoRelatorio));
    const notasMes = adminData.notes.filter((nota) => isInsideMonth(nota.data_criacao, mesIdxRel, anoRelatorio));
    const tecnicoMes = adminData.technicalLogs.filter((log) => isInsideMonth(log.criado_em || log.data_hora, mesIdxRel, anoRelatorio));
    const loginsMes = adminData.users.filter((user) => isInsideMonth(user.last_login_at, mesIdxRel, anoRelatorio));

    return {
      alunosPeriodo,
      resumos,
      pagamentosMes,
      pagamentosHoje,
      receitaMes,
      previsaoMes,
      pendenteMes: Math.max(0, previsaoMes - receitaMes),
      atrasados,
      pagos,
      emDia,
      logsMes,
      notasMes,
      tecnicoMes,
      loginsMes,
    };
  }, [alunos, pagamentos, adminData, anoRelatorio, mesIdxRel, mesRelatorio, hojeReferencia, refRelatorio, hoje]);

  const timelineMonths = MONTH_OPTIONS.map((mes, index) => {
    if (isFutureMonth(index, anoRelatorio, hojeReferencia)) return null;
    const payments = pagamentos.filter((pagamento) => isPaymentInsideMonth(pagamento, mes, anoRelatorio)).length;
    const logs = adminData.logs.filter((log) => isInsideMonth(log.data_hora, index, anoRelatorio)).length;
    const notes = adminData.notes.filter((nota) => isInsideMonth(nota.data_criacao, index, anoRelatorio)).length;
    return { mes, short: mes.slice(0, 3), index, active: mes === mesRelatorio, current: anoRelatorio === hojeReferencia.getFullYear() && index === hojeReferencia.getMonth(), total: payments + logs + notes };
  }).filter(Boolean);

  if (!isAdmin) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC]">
        <div className="max-w-[420px] rounded-[10px] border border-red-100 bg-white p-8 text-center shadow-[var(--shadow-md)]">
          <ShieldCheck size={36} className="mx-auto text-red-500" />
          <h2 className="mt-3 text-[18px] font-black text-slate-800">Acesso reservado ao administrador</h2>
          <p className="mt-2 text-[13px] font-semibold text-slate-500">Relatórios, logs, utilizadores e exportações administrativas só podem ser vistos por uma conta admin.</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Recebido no mês', value: formatCve(relatorio.receitaMes), icon: <Wallet size={17} />, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { label: 'Pagaram hoje', value: String(relatorio.pagamentosHoje.length), icon: <CheckCircle2 size={17} />, tone: 'text-blue-700 bg-blue-50 border-blue-100' },
    { label: 'Em atraso', value: String(relatorio.atrasados.length), icon: <AlertCircle size={17} />, tone: relatorio.atrasados.length > 0 ? 'text-red-700 bg-red-50 border-red-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { label: 'Ações no mês', value: String(relatorio.logsMes.length), icon: <Database size={17} />, tone: 'text-slate-700 bg-slate-50 border-slate-200' },
  ];

  return (
    <div className="animate-slide-up flex h-full w-full flex-col overflow-hidden bg-[#F8FAFC]">
      <div className="sticky top-0 z-20 shrink-0 border-b border-[#D7DCE3] bg-[#F0F3F7]/95 shadow-[0_7px_22px_rgba(15,23,42,0.08)] supports-[backdrop-filter]:backdrop-blur-md">
        <div className={`overflow-x-auto transition-all ${timelineFinanceiraMinimizada ? 'py-1' : 'py-2'}`}>
          <div className="flex min-w-[1120px] items-center gap-4 px-6">
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-700">Ferramentas do relatório</span>
              <button onClick={() => setAnoRelatorio((prev) => prev - 1)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-surface)] bg-white/60 text-[var(--text-secondary)] ring-1 ring-slate-200/70 hover:bg-blue-50/80 hover:text-[var(--color-primary)]" title="Ano anterior"><ChevronLeft size={14} /></button>
              <div className="rounded-[var(--radius-surface)] bg-blue-50/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 ring-1 ring-blue-100/80">{anoRelatorio}</div>
              <button onClick={() => setAnoRelatorio((prev) => prev + 1)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-surface)] bg-white/60 text-[var(--text-secondary)] ring-1 ring-slate-200/70 hover:bg-blue-50/80 hover:text-[var(--color-primary)]" title="Próximo ano"><ChevronRight size={14} /></button>
            </div>

            <div className="relative min-w-[520px] flex-1">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-blue-100/80" />
              <div className="relative flex items-center justify-between gap-1">
                {timelineMonths.map((month) => (
                  <button key={month.mes} onClick={() => setMesRelatorio(month.mes)}
                    className={`group flex min-w-[72px] flex-col items-center rounded-[5px] px-1.5 transition-all ${timelineFinanceiraMinimizada ? 'gap-0 py-0.5' : 'gap-0.5 py-1'}`}
                    title={`${month.mes} ${anoRelatorio} · ${month.total} registo(s)`}>
                    <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all ${month.active ? 'border-blue-200 bg-blue-300 shadow-[0_0_0_4px_rgba(191,219,254,0.55)]' : month.current ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white/80 group-hover:border-blue-200 group-hover:bg-blue-50'}`} />
                    <div className={`transition-all ${timelineFinanceiraMinimizada ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
                      <p className={`text-[9px] font-black uppercase tracking-[0.12em] ${month.active ? 'text-blue-700' : 'text-[var(--text-secondary)]'}`}>{month.short}</p>
                      <p className="text-[8px] font-bold text-slate-400">{month.total}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button onClick={onExportarPdf} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-surface)] bg-blue-50/80 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700 ring-1 ring-blue-100/80 hover:bg-blue-100/70"><Printer size={12} /> PDF</button>
              <button onClick={onExportarExcel} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-surface)] bg-emerald-50/80 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100/80 hover:bg-emerald-100/70"><Download size={12} /> Excel</button>
              <button type="button" onClick={() => setTimelineFinanceiraMinimizada((prev) => !prev)}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-surface)] bg-white/60 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-secondary)] ring-1 ring-slate-200/70 hover:bg-blue-50/70 hover:text-blue-700"
                title={timelineFinanceiraMinimizada ? 'Expandir' : 'Minimizar'}>
                <ChevronDown size={13} className={`transition-transform ${timelineFinanceiraMinimizada ? '-rotate-90' : 'rotate-0'}`} />
                {timelineFinanceiraMinimizada ? 'Expandir' : 'Minimizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
        <div className="mx-auto space-y-4" style={{ maxWidth: `${larguraListas}px` }}>
          <section className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <img src={appLogo} alt="" className="h-10 w-10 rounded-[var(--radius-compact)] border border-[var(--border-light)] bg-white object-contain p-1 shadow-sm" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Relatórios Admin</p>
                  <h1 className="mt-1 text-[26px] font-black tracking-tight text-slate-900 capitalize">{mesRelatorio} {anoRelatorio}</h1>
                  <p className="mt-1 text-[12px] font-semibold text-slate-500">Visão financeira, logs, notas, utilizadores e actividade operacional de {nomeAcademia}.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                <ShieldCheck size={13} />
                Admin: {sessionUser?.name || 'Administrador'}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.label} className={`rounded-[var(--radius-surface)] border px-4 py-3 ${kpi.tone}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.16em] opacity-70">{kpi.label}</span>
                    {kpi.icon}
                  </div>
                  <p className="text-[24px] font-black leading-none tabular-nums">{kpi.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Pagamentos</p>
                  <h2 className="mt-1 text-[18px] font-black text-slate-900">Quem pagou hoje</h2>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">{relatorio.pagamentosHoje.length} hoje</span>
              </div>
              <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto custom-scrollbar pr-1">
                {relatorio.pagamentosHoje.length === 0 ? (
                  <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] py-8 text-center text-[12px] font-semibold text-slate-400">Nenhum pagamento registado hoje.</div>
                ) : relatorio.pagamentosHoje.map((pagamento) => (
                  <div key={pagamento.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-black text-emerald-900">{pagamento.nome || pagamento.aluno_id}</p>
                      <p className="text-[10px] font-semibold text-emerald-700/70">{pagamento.metodo_pagamento || 'Método não definido'} · {pagamento.data_pagamento || 'sem data'}</p>
                    </div>
                    <p className="shrink-0 text-[13px] font-black text-emerald-700">{formatCve(pagamento.valor)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Financeiro</p>
                  <h2 className="mt-1 text-[18px] font-black text-slate-900">Resumo do mês</h2>
                </div>
                <FileBarChart size={18} className="text-blue-600" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ['Previsto', formatCve(relatorio.previsaoMes), 'text-blue-700 bg-blue-50'],
                  ['Recebido', formatCve(relatorio.receitaMes), 'text-emerald-700 bg-emerald-50'],
                  ['Por cobrar', formatCve(relatorio.pendenteMes), relatorio.pendenteMes > 0 ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'],
                ].map(([label, value, tone]) => (
                  <div key={label} className={`rounded-[var(--radius-control)] px-3 py-3 text-center ${tone}`}>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] opacity-70">{label}</p>
                    <p className="mt-1 truncate text-[15px] font-black">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${relatorio.previsaoMes > 0 ? Math.min(100, (relatorio.receitaMes / relatorio.previsaoMes) * 100) : 0}%` }} />
              </div>
              <p className="mt-2 text-[10px] font-semibold text-slate-500">{relatorio.previsaoMes > 0 ? Math.round((relatorio.receitaMes / relatorio.previsaoMes) * 100) : 0}% da previsão mensal cobrada.</p>
            </div>
          </section>

          <section className="rounded-[12px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-light)] bg-[#F8FAFC] px-4 py-3">
              {[
                { id: 'resumo' as ReportView, label: 'Alunos', icon: <Users size={14} /> },
                { id: 'atividade' as ReportView, label: 'Atividade', icon: <Clock size={14} /> },
                { id: 'utilizadores' as ReportView, label: 'Utilizadores', icon: <ShieldCheck size={14} /> },
                { id: 'notas' as ReportView, label: 'Notas', icon: <StickyNote size={14} /> },
              ].map((item) => (
                <button key={item.id} onClick={() => setVista(item.id)} className={`inline-flex h-8 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.12em] transition-colors ${vista === item.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white'}`}>
                  {item.icon}
                  {item.label}
                </button>
              ))}
              {adminLoading && <span className="ml-auto text-[10px] font-bold text-slate-400">A carregar dados admin...</span>}
            </div>

            {vista === 'resumo' && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-white text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Aluno</th>
                      <th className="px-4 py-3">Plano</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Próx. cobrança</th>
                      <th className="px-4 py-3">Último pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.resumos.map(({ aluno, resumo }, index) => (
                      <tr key={aluno.id} className={index % 2 === 0 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-black text-slate-800">{aluno.nome}</p>
                          <p className="text-[10px] font-semibold text-slate-400">{aluno.telefone || 'sem telefone'} · {aluno.categoria || 'Geral'}</p>
                        </td>
                        <td className="px-4 py-3 text-[12px] font-black text-slate-700">{formatCve(aluno.plano)}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{getBillingBadgeLabel(resumo.status)}</span></td>
                        <td className="px-4 py-3 text-[11px] font-semibold text-slate-500">{resumo.nextChargeDate || '—'}</td>
                        <td className="px-4 py-3 text-[11px] font-semibold text-slate-500">{resumo.lastPaymentDate || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {vista === 'atividade' && (
              <div className="grid gap-4 p-4 lg:grid-cols-2">
                <ActivityList title="Logs do mês" icon={<Database size={15} />} items={relatorio.logsMes} empty="Sem ações registadas neste mês." render={(log) => (
                  <>
                    <p className="text-[12px] font-black text-slate-800">{log.acao}</p>
                    <p className="text-[10px] font-semibold text-slate-500">{log.detalhes || 'Sem detalhe'}</p>
                    <p className="mt-1 text-[9px] font-bold text-slate-400">{log.user_name || 'Sistema'} · {log.data_hora}</p>
                  </>
                )} />
                <ActivityList title="Logs técnicos" icon={<BookOpenText size={15} />} items={relatorio.tecnicoMes} empty="Sem logs técnicos neste mês." render={(log) => (
                  <>
                    <p className="text-[12px] font-black text-slate-800">{log.tipo || 'Registo técnico'} · {log.contexto || 'Sistema'}</p>
                    <p className="text-[10px] font-semibold text-slate-500">{log.mensagem || 'Sem mensagem'}</p>
                    <p className="mt-1 text-[9px] font-bold text-slate-400">{log.utilizador || 'Sistema'} · {log.criado_em || log.data_hora}</p>
                  </>
                )} />
              </div>
            )}

            {vista === 'utilizadores' && (
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {adminData.users.map((user) => (
                  <div key={user.id} className="rounded-[var(--radius-surface)] border border-[var(--border-light)] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-black text-slate-800">{user.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{user.email}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${user.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{user.role}</span>
                    </div>
                    <div className="mt-3 space-y-1 text-[10px] font-semibold text-slate-500">
                      <p>Estado: <span className={user.is_active === 1 ? 'text-emerald-700' : 'text-red-700'}>{user.is_active === 1 ? 'Ativo' : 'Bloqueado'}</span></p>
                      <p>Último login: {user.last_login_at || 'Sem registo'}</p>
                      <p>Criado em: {user.created_at || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {vista === 'notas' && (
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {relatorio.notasMes.length === 0 ? (
                  <div className="col-span-full rounded-[var(--radius-control)] border border-dashed border-[var(--border)] py-10 text-center text-[12px] font-semibold text-slate-400">Sem notas criadas neste mês.</div>
                ) : relatorio.notasMes.map((nota) => (
                  <div key={nota.id} className="rounded-[var(--radius-control)] border border-amber-200 bg-[#FFF7C7] p-4">
                    <p className="text-[13px] font-black text-amber-950">{nota.nome || nota.aluno_id}</p>
                    <p className="mt-2 text-[12px] leading-relaxed text-amber-900">{nota.texto}</p>
                    <p className="mt-3 text-[10px] font-bold text-amber-700/70">{nota.data_criacao}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
});

function ActivityList<T extends { id: number | string }>({
  title,
  icon,
  items,
  empty,
  render,
}: {
  title: string;
  icon: React.ReactNode;
  items: T[];
  empty: string;
  render: (item: T) => React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-surface)] border border-[var(--border-light)]">
      <div className="flex items-center gap-2 border-b border-[var(--border-light)] bg-[#F8FAFC] px-4 py-3">
        {icon}
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">{title}</p>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-slate-400">{items.length}</span>
      </div>
      <div className="max-h-[360px] overflow-y-auto custom-scrollbar p-3">
        {items.length === 0 ? (
          <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] py-8 text-center text-[12px] font-semibold text-slate-400">{empty}</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-[var(--radius-control)] border border-[var(--border-light)] bg-white px-3 py-2.5">
                {render(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RelatoriosPage;
