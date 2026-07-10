import { memo, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, BarChart2, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Clock, Database, Download, FileBarChart, Printer, Search, ShieldCheck,
  StickyNote, TrendingUp, UserCheck, Users, Wallet, XCircle, Activity,
  BookUser, Smartphone, Edit, LogIn, CreditCard, Ban,
} from 'lucide-react';
import {
  formatCve, getStudentStatusForMonth, isPaymentInsideMonth, normalizeAmount, parseFlexibleDate,
} from '../lib/billing';
import {
  MONTH_OPTIONS, getBillingBadgeLabel, STUDENT_STATUS_HELPERS,
} from '../constants';
import { isFutureMonth } from '../utils/formatting';
import type { Student, Payment } from '../types';

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

type DailySummary = {
  pagamentosHoje: any[];
  matriculasHoje: any[];
  logsHoje: any[];
  loginsHoje: any[];
  notasHoje: any[];
  totalAlunos: number;
  ativos: number;
  pausados: number;
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'Matrícula': <BookUser size={13} />,
  'Pagamento': <Wallet size={13} />,
  'Login': <LogIn size={13} />,
  'Edição': <Edit size={13} />,
  'Status Alterado': <Ban size={13} />,
  'Eliminação (Soft)': <XCircle size={13} />,
  'Importação': <Database size={13} />,
};

const ACTION_COLORS: Record<string, string> = {
  'Matrícula': 'bg-blue-50 text-blue-700 border-blue-100',
  'Pagamento': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Login': 'bg-slate-50 text-slate-600 border-slate-200',
  'Edição': 'bg-amber-50 text-amber-700 border-amber-100',
  'Status Alterado': 'bg-rose-50 text-rose-700 border-rose-100',
  'Eliminação (Soft)': 'bg-red-50 text-red-700 border-red-100',
  'Importação': 'bg-violet-50 text-violet-700 border-violet-100',
};

function BarChart({ data, height = 160 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(20, Math.min(40, (600 / data.length) - 4));
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((item, i) => {
        const pct = (item.value / max) * 100;
        const color = item.color || '#3B82F6';
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end h-full">
            <span className="text-[7px] font-bold text-slate-400 mb-0.5 tabular-nums">{item.value}</span>
            <div className="w-full rounded-[3px] transition-all hover:opacity-80" style={{ height: `${Math.max(pct, 3)}%`, backgroundColor: color, minWidth: barW }} title={`${item.label}: ${item.value}`} />
            <span className="text-[7px] font-bold text-slate-400 mt-0.5 truncate w-full text-center">{item.label.slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ segments, size = 120 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const sw = size * 0.15;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const dashoffset = -offset;
        offset += dash;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={sw} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={dashoffset} transform={`rotate(-90 ${cx} ${cy})`} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.65} fill="var(--bg-surface, #fff)" />
    </svg>
  );
}

function ActivityIcon({ acao }: { acao: string }) {
  const key = Object.keys(ACTION_ICONS).find(k => acao.toLowerCase().includes(k.toLowerCase()));
  const icon = key ? ACTION_ICONS[key] : <Activity size={13} />;
  const colors = key ? ACTION_COLORS[key] : 'bg-slate-50 text-slate-600 border-slate-200';
  return <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${colors}`}>{icon}</span>;
}

export interface RelatoriosPageProps {
  mesRelatorio: string;
  setMesRelatorio: React.Dispatch<React.SetStateAction<string>>;
  anoRelatorio: number;
  setAnoRelatorio: React.Dispatch<React.SetStateAction<number>>;
  timelineFinanceiraMinimizada: boolean;
  setTimelineFinanceiraMinimizada: React.Dispatch<React.SetStateAction<boolean>>;
  alunos: Student[];
  pagamentos: Payment[];
  hojeReferencia: Date;
  larguraListas: number;
  appLogo: string;
  nomeAcademia: string;
  sessionUser: { role?: string; name?: string } | null;
  onExportarExcel: () => void;
  onExportarPdf: () => void;
}

const RelatoriosPage = memo(function RelatoriosPage({
  mesRelatorio, setMesRelatorio, anoRelatorio, setAnoRelatorio,
  timelineFinanceiraMinimizada, setTimelineFinanceiraMinimizada,
  alunos, pagamentos, hojeReferencia, larguraListas,
  appLogo, nomeAcademia, sessionUser,
  onExportarExcel, onExportarPdf,
}: RelatoriosPageProps) {
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [abaAtividade, setAbaAtividade] = useState<'hoje' | 'timeline'>('hoje');
  const [filtroUser, setFiltroUser] = useState<string>('todos');

  const isAdmin = sessionUser?.role === 'admin' || sessionUser?.role === 'root';
  const mesIdxRel = MONTH_OPTIONS.indexOf(mesRelatorio);
  const refRelatorio = useMemo(() => new Date(anoRelatorio, mesIdxRel + 1, 0), [anoRelatorio, mesIdxRel]);
  const hoje = useMemo(() => new Date(), []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setDailyLoading(true);
      try {
        const electron = (window as any).electron;
        if (!electron) return;
        const res = await electron.ipcRenderer.invoke('reports:daily-summary');
        if (mounted && res?.success) setDaily(res);
      } finally {
        if (mounted) setDailyLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const alunosFiltrados = useMemo(() => {
    if (!pesquisa.trim()) return alunos;
    const q = pesquisa.trim().toLowerCase();
    return alunos.filter(a => a.nome.toLowerCase().includes(q) || a.telefone?.includes(q));
  }, [alunos, pesquisa]);

  const relatorio = useMemo(() => {
    const alunosPeriodo = alunosFiltrados
      .filter((aluno) => {
        const entrada = parseFlexibleDate(aluno.data_matricula);
        return entrada ? entrada.getTime() <= refRelatorio.getTime() : true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));

    const resumos = alunosPeriodo.map((aluno) => ({
      aluno,
      resumo: getStudentStatusForMonth(aluno, pagamentos, anoRelatorio, mesIdxRel, hojeReferencia),
    }));

    const pagamentosMes = pagamentos.filter((p) => isPaymentInsideMonth(p, mesRelatorio, anoRelatorio));
    const receitaMes = pagamentosMes.reduce((sum, p) => sum + normalizeAmount(p.valor), 0);
    const previsaoMes = alunosPeriodo.filter((a) => STUDENT_STATUS_HELPERS.isOperational(a.status)).reduce((sum, a) => sum + normalizeAmount(a.plano), 0);
    const atrasados = resumos.filter(({ resumo }) => resumo.status === 'atrasado' || resumo.status === 'hoje');
    const pagos = resumos.filter(({ resumo }) => resumo.status === 'pago');
    const pendentes = resumos.filter(({ resumo }) => ['pendente', 'critico', 'alerta'].includes(resumo.status));

    const receita12Meses = Array.from({ length: 12 }, (_, i) => {
      const m = (hoje.getMonth() - 11 + i + 12) % 12;
      const a = hoje.getFullYear() - (hoje.getMonth() - 11 + i < 0 ? 1 : 0);
      const mesLabel = MONTH_OPTIONS[m];
      const total = pagamentos.filter((p) => isPaymentInsideMonth(p, mesLabel, a)).reduce((s, p) => s + normalizeAmount(p.valor), 0);
      return { label: mesLabel, value: total, color: m === hoje.getMonth() ? '#059669' : '#94A3B8' };
    });

    const statusSegments = [
      { label: 'Pago', value: pagos.length, color: '#16A34A' },
      { label: 'Pendente', value: pendentes.length, color: '#D97706' },
      { label: 'Atrasado', value: atrasados.length, color: '#DC2626' },
    ];

    return {
      alunosPeriodo, resumos, pagamentosMes, receitaMes, previsaoMes,
      pendenteMes: Math.max(0, previsaoMes - receitaMes),
      atrasados, pagos, pendentes, receita12Meses, statusSegments,
    };
  }, [alunosFiltrados, pagamentos, mesRelatorio, anoRelatorio, mesIdxRel, hojeReferencia, refRelatorio, hoje]);

  const logsHojeAgrupados = useMemo(() => {
    if (!daily?.logsHoje) return [];
    const userMap = new Map<string, typeof daily.logsHoje>();
    daily.logsHoje.forEach(log => {
      const userName = log.user_name || 'Sistema';
      if (filtroUser !== 'todos' && userName !== filtroUser) return;
      if (!userMap.has(userName)) userMap.set(userName, []);
      userMap.get(userName)!.push(log);
    });
    return Array.from(userMap.entries());
  }, [daily?.logsHoje, filtroUser]);

  const usersDisponiveis = useMemo(() => {
    if (!daily?.logsHoje) return [];
    return [...new Set(daily.logsHoje.map(l => l.user_name || 'Sistema'))];
  }, [daily?.logsHoje]);

  const timelineMonths = MONTH_OPTIONS.map((mes, index) => {
    if (isFutureMonth(index, anoRelatorio, hojeReferencia)) return null;
    const payments = pagamentos.filter((p) => isPaymentInsideMonth(p, mes, anoRelatorio)).length;
    return { mes, short: mes.slice(0, 3), index, active: mes === mesRelatorio, current: anoRelatorio === hoje.getFullYear() && index === hoje.getMonth(), total: payments };
  }).filter((m): m is { mes: string; short: string; index: number; active: boolean; current: boolean; total: number } => m !== null);

  if (!isAdmin) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC]">
        <div className="max-w-[420px] rounded-[10px] border border-red-100 bg-white p-8 text-center shadow-[var(--shadow-md)]">
          <ShieldCheck size={36} className="mx-auto text-red-500" />
          <h2 className="mt-3 text-[18px] font-black text-slate-800">Acesso reservado ao administrador</h2>
          <p className="mt-2 text-[13px] font-semibold text-slate-500">Relatórios, logs e dados administrativos só podem ser vistos por uma conta admin.</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Receita Hoje', value: formatCve(daily ? daily.pagamentosHoje.reduce((s: number, p: any) => s + normalizeAmount(p.valor), 0) : 0), icon: <TrendingUp size={16} />, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Pagaram Hoje', value: String(daily?.pagamentosHoje.length || 0), icon: <CheckCircle2 size={16} />, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { label: 'Alunos Ativos', value: String(daily?.ativos || 0), icon: <Users size={16} />, color: 'text-violet-700 bg-violet-50 border-violet-200' },
    { label: 'Ações Hoje', value: String(daily?.logsHoje.length || 0), icon: <Activity size={16} />, color: 'text-slate-700 bg-slate-50 border-slate-200' },
  ];

  return (
    <div className="animate-slide-up flex h-full w-full flex-col overflow-hidden bg-[#F8FAFC]">
      <div className="sticky top-0 z-20 shrink-0 border-b border-[#D7DCE3] bg-[#F0F3F7]/95 shadow-[0_7px_22px_rgba(15,23,42,0.08)] supports-[backdrop-filter]:backdrop-blur-md">
        <div className={`overflow-x-auto transition-all ${timelineFinanceiraMinimizada ? 'py-1' : 'py-2'}`}>
          <div className="flex min-w-[1120px] items-center gap-4 px-6">
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-700">Relatórios</span>
              <button onClick={() => setAnoRelatorio((prev) => prev - 1)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-surface)] bg-white/60 text-[var(--text-secondary)] ring-1 ring-slate-200/70 hover:bg-blue-50/80 hover:text-[var(--color-primary)]" title="Ano anterior"><ChevronLeft size={14} /></button>
              <div className="rounded-[var(--radius-surface)] bg-blue-50/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 ring-1 ring-blue-100/80">{anoRelatorio}</div>
              <button onClick={() => setAnoRelatorio((prev) => prev + 1)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-surface)] bg-white/60 text-[var(--text-secondary)] ring-1 ring-slate-200/70 hover:bg-blue-50/80 hover:text-[var(--color-primary)]" title="Próximo ano"><ChevronRight size={14} /></button>
            </div>

            <div className="relative min-w-[480px] flex-1">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-blue-100/80" />
              <div className="relative flex items-center justify-between gap-1">
                {timelineMonths.map((month) => (
                  <button key={month.mes} onClick={() => setMesRelatorio(month.mes)}
                    className={`group flex min-w-[64px] flex-col items-center rounded-[5px] px-1 transition-all ${timelineFinanceiraMinimizada ? 'gap-0 py-0.5' : 'gap-0.5 py-1'}`}
                    title={`${month.mes} ${anoRelatorio}`}>
                    <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all ${month.active ? 'border-blue-200 bg-blue-300 shadow-[0_0_0_4px_rgba(191,219,254,0.55)]' : month.current ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white/80 group-hover:border-blue-200 group-hover:bg-blue-50'}`} />
                    <div className={`transition-all ${timelineFinanceiraMinimizada ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
                      <p className={`text-[9px] font-black uppercase tracking-[0.12em] ${month.active ? 'text-blue-700' : 'text-[var(--text-secondary)]'}`}>{month.short}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button onClick={onExportarPdf} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-surface)] bg-blue-50/80 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700 ring-1 ring-blue-100/80 hover:bg-blue-100/70"><Printer size={12} /> PDF</button>
              <button onClick={onExportarExcel} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-surface)] bg-emerald-50/80 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100/80 hover:bg-emerald-100/70"><Download size={12} /> Excel</button>
              <button type="button" onClick={() => setTimelineFinanceiraMinimizada((prev) => !prev)}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-surface)] bg-white/60 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-secondary)] ring-1 ring-slate-200/70 hover:bg-blue-50/70 hover:text-blue-700">
                <ChevronDown size={13} className={`transition-transform ${timelineFinanceiraMinimizada ? '-rotate-90' : 'rotate-0'}`} />
                {timelineFinanceiraMinimizada ? 'Expandir' : 'Minimizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content: fixed header sections + scrollable bottom */}
      <div className="flex-1 flex flex-col overflow-hidden px-6 py-4">
        <div className="mx-auto w-full space-y-4 overflow-y-auto custom-scrollbar" style={{ maxWidth: `${larguraListas}px` }}>

          {/* Search + Header & KPI Cards (shrink-wrapped) */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={pesquisa} onChange={e => setPesquisa(e.target.value)} placeholder="Pesquisar aluno..." className="h-9 w-full rounded-[var(--radius-surface)] border border-slate-200 bg-white pl-9 pr-3 text-[12px] font-semibold text-slate-700 placeholder:text-slate-400 outline-none ring-blue-200/0 transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-200/60" />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 shrink-0">
              <ShieldCheck size={13} />
              Admin: {sessionUser?.name || 'Administrador'}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4 shrink-0">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`rounded-[var(--radius-surface)] border px-4 py-3 ${kpi.color}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] opacity-70">{kpi.label}</span>
                  {kpi.icon}
                </div>
                <p className="text-[24px] font-black leading-none tabular-nums">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Row (shrink-wrapped) */}
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr] shrink-0">
            <div className="rounded-[12px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Receita</p>
                  <h2 className="mt-0.5 text-[15px] font-black text-slate-800">Evolução Mensal</h2>
                </div>
                <BarChart2 size={18} className="text-blue-600" />
              </div>
              <BarChart data={relatorio.receita12Meses} height={120} />
            </div>

            <div className="rounded-[12px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Situação</p>
                  <h2 className="mt-0.5 text-[15px] font-black text-slate-800">Pagamentos do Mês</h2>
                </div>
                <FileBarChart size={18} className="text-blue-600" />
              </div>
              <div className="flex items-center gap-6">
                <DonutChart segments={relatorio.statusSegments} size={100} />
                <div className="space-y-1.5">
                  {relatorio.statusSegments.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-[10px] font-bold text-slate-600">{seg.label}</span>
                      <span className="text-[10px] font-black text-slate-800 ml-auto tabular-nums">{seg.value}</span>
                    </div>
                  ))}
                  <div className="pt-1.5 border-t border-slate-100 mt-1.5">
                    <span className="text-[9px] font-semibold text-slate-400">Prev: {formatCve(relatorio.previsaoMes)}</span>
                    <span className="text-[9px] font-black text-emerald-700 ml-2">Rec: {formatCve(relatorio.receitaMes)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable bottom sections */}
          <div className="space-y-4 min-h-0">
            {/* Today's Activity + Payment Columns */}
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[12px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Pagamentos Hoje</p>
                    <h2 className="mt-0.5 text-[15px] font-black text-slate-800">Quem pagou</h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">{daily?.pagamentosHoje.length || 0} registos</span>
                </div>
                <div className="max-h-[180px] space-y-1 overflow-y-auto custom-scrollbar pr-1">
                  {dailyLoading ? (
                    <div className="py-6 text-center text-[12px] font-semibold text-slate-400">A carregar...</div>
                  ) : daily?.pagamentosHoje.length === 0 ? (
                    <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] py-6 text-center text-[12px] font-semibold text-slate-400">Nenhum pagamento hoje.</div>
                  ) : daily?.pagamentosHoje.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                      <div className="min-w-0 flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <div>
                          <p className="truncate text-[12px] font-black text-emerald-900">{p.nome || p.aluno_id}</p>
                          <p className="text-[9px] font-semibold text-emerald-700/60">{p.metodo_pagamento || '—'}</p>
                        </div>
                      </div>
                      <p className="shrink-0 text-[12px] font-black text-emerald-700">{formatCve(p.valor)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[12px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{mesRelatorio}</p>
                    <h2 className="mt-0.5 text-[15px] font-black text-slate-800">Situação dos Alunos</h2>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-[var(--radius-control)] border border-red-100 bg-red-50/50 p-2.5">
                    <div className="flex items-center gap-1 mb-1.5">
                      <XCircle size={11} className="text-red-600" />
                      <span className="text-[8px] font-black uppercase tracking-[0.1em] text-red-700">Atrasado</span>
                    </div>
                    <p className="text-[18px] font-black text-red-700 tabular-nums">{relatorio.atrasados.length}</p>
                    <div className="mt-1.5 max-h-[80px] overflow-y-auto space-y-0.5 custom-scrollbar">
                      {relatorio.atrasados.slice(0, 6).map(({ aluno }) => (
                        <p key={aluno.id} className="truncate text-[9px] font-bold text-red-800">{aluno.nome}</p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-control)] border border-amber-100 bg-amber-50/50 p-2.5">
                    <div className="flex items-center gap-1 mb-1.5">
                      <AlertCircle size={11} className="text-amber-600" />
                      <span className="text-[8px] font-black uppercase tracking-[0.1em] text-amber-700">Pendente</span>
                    </div>
                    <p className="text-[18px] font-black text-amber-700 tabular-nums">{relatorio.pendentes.length}</p>
                    <div className="mt-1.5 max-h-[80px] overflow-y-auto space-y-0.5 custom-scrollbar">
                      {relatorio.pendentes.slice(0, 6).map(({ aluno }) => (
                        <p key={aluno.id} className="truncate text-[9px] font-bold text-amber-800">{aluno.nome}</p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-control)] border border-emerald-100 bg-emerald-50/50 p-2.5">
                    <div className="flex items-center gap-1 mb-1.5">
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      <span className="text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">Pago</span>
                    </div>
                    <p className="text-[18px] font-black text-emerald-700 tabular-nums">{relatorio.pagos.length}</p>
                    <div className="mt-1.5 max-h-[80px] overflow-y-auto space-y-0.5 custom-scrollbar">
                      {relatorio.pagos.slice(0, 6).map(({ aluno }) => (
                        <p key={aluno.id} className="truncate text-[9px] font-bold text-emerald-800">{aluno.nome}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="rounded-[12px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-3 border-b border-[var(--border-light)] bg-[#F8FAFC] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {(['hoje', 'timeline'] as const).map((aba) => (
                    <button key={aba} onClick={() => setAbaAtividade(aba)}
                      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[9px] font-black uppercase tracking-[0.12em] transition-colors ${abaAtividade === aba ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white'}`}>
                      {aba === 'hoje' ? <Clock size={11} /> : <Activity size={11} />}
                      {aba === 'hoje' ? 'Atividade Hoje' : 'Lista do Mês'}
                    </button>
                  ))}
                </div>
                {abaAtividade === 'hoje' && usersDisponiveis.length > 1 && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[8px] font-bold uppercase text-slate-400">User:</span>
                    <select value={filtroUser} onChange={e => setFiltroUser(e.target.value)}
                      className="h-6 rounded-[var(--radius-control)] border border-slate-200 bg-white px-1.5 text-[9px] font-bold text-slate-600 outline-none">
                      <option value="todos">Todos</option>
                      {usersDisponiveis.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                )}
                {dailyLoading && <span className="ml-auto text-[9px] font-bold text-slate-400">A carregar...</span>}
              </div>

              {abaAtividade === 'hoje' ? (
                <div className="p-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                  {logsHojeAgrupados.length === 0 ? (
                    <div className="py-6 text-center text-[11px] font-semibold text-slate-400">Nenhuma atividade registada hoje.</div>
                  ) : (
                    <div className="space-y-3">
                      {logsHojeAgrupados.map(([userName, logs]) => (
                        <div key={userName}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-700">{userName.slice(0, 2).toUpperCase()}</div>
                            <span className="text-[10px] font-black text-slate-700">{userName}</span>
                            <span className="text-[8px] font-bold text-slate-400">({logs.length})</span>
                          </div>
                          <div className="space-y-0.5 ml-6">
                            {logs.slice(0, 6).map((log: any) => (
                              <div key={log.id} className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--border-light)] bg-white px-2.5 py-1.5">
                                <ActivityIcon acao={log.acao} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-slate-700">{log.acao}</p>
                                  <p className="text-[9px] text-slate-500 truncate">{log.detalhes || '—'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5">Aluno</th>
                          <th className="px-4 py-2.5">Plano</th>
                          <th className="px-4 py-2.5">Estado</th>
                          <th className="px-4 py-2.5">Próx. cobrança</th>
                          <th className="px-4 py-2.5">Último pagamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.resumos.map(({ aluno, resumo }, index) => (
                          <tr key={aluno.id} className={index % 2 === 0 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                            <td className="px-4 py-2">
                              <p className="text-[11px] font-black text-slate-800">{aluno.nome}</p>
                              <p className="text-[9px] font-semibold text-slate-400">{aluno.telefone || 'sem telefone'} · {aluno.categoria || 'Geral'}</p>
                            </td>
                            <td className="px-4 py-2 text-[11px] font-black text-slate-700">{formatCve(aluno.plano)}</td>
                            <td className="px-4 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-600">{getBillingBadgeLabel(resumo.status)}</span></td>
                            <td className="px-4 py-2 text-[10px] font-semibold text-slate-500">{resumo.nextChargeDate || '—'}</td>
                            <td className="px-4 py-2 text-[10px] font-semibold text-slate-500">{resumo.lastPaymentDate || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Today's Logins & Matriculas Summary */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[12px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Acessos Hoje</p>
                    <h2 className="mt-0.5 text-[15px] font-black text-slate-800">Utilizadores que acederam</h2>
                  </div>
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-[9px] font-black text-slate-600">{daily?.loginsHoje.length || 0}</span>
                </div>
                <div className="max-h-[160px] space-y-1 overflow-y-auto custom-scrollbar">
                  {daily?.loginsHoje.length === 0 ? (
                    <div className="py-4 text-center text-[11px] font-semibold text-slate-400">Nenhum acesso hoje.</div>
                  ) : daily?.loginsHoje.map((u: any) => (
                    <div key={u.id} className="flex items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--border-light)] bg-white px-3 py-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-black text-blue-700 shrink-0">{u.name?.slice(0, 2).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-slate-800">{u.name}</p>
                        <p className="text-[8px] font-semibold text-slate-400">{u.role === 'admin' ? 'Admin' : 'Operador'}</p>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400">{u.last_login_at || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[12px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Registos Hoje</p>
                    <h2 className="mt-0.5 text-[15px] font-black text-slate-800">Novas Matrículas & Notas</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[var(--radius-control)] border border-blue-100 bg-blue-50/60 p-2.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.1em] text-blue-700">Matrículas</p>
                    <p className="mt-1 text-[20px] font-black text-blue-700 tabular-nums">{daily?.matriculasHoje.length || 0}</p>
                    <div className="mt-1.5 space-y-0.5 max-h-[60px] overflow-y-auto custom-scrollbar">
                      {daily?.matriculasHoje.map((m: any) => (
                        <p key={m.id} className="truncate text-[9px] font-bold text-blue-800">{m.nome}</p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-control)] border border-amber-100 bg-amber-50/60 p-2.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.1em] text-amber-700">Notas</p>
                    <p className="mt-1 text-[20px] font-black text-amber-700 tabular-nums">{daily?.notasHoje.length || 0}</p>
                    <div className="mt-1.5 space-y-0.5 max-h-[60px] overflow-y-auto custom-scrollbar">
                      {daily?.notasHoje.map((n: any) => (
                        <p key={n.id} className="truncate text-[9px] font-bold text-amber-800">{n.nome || n.aluno_id}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

export default RelatoriosPage;
