import { memo, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Banknote,
  BookUser,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Landmark,
  LogIn,
  Maximize2,
  Minimize2,
  Palmtree,
  Pause,
  Printer,
  ShieldCheck,
  StickyNote,
  TrendingUp,
  UserX,
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
import { MONTH_OPTIONS, PAYMENT_METHOD_OPTIONS, STUDENT_STATUS_HELPERS, getStudentStatusLabel, getManualStatusTone } from '../constants';
import { isFutureMonth } from '../utils/formatting';
import type { Payment, Student } from '../types';
import TimeRuler from './TimeRuler';

type BentoTone = 'default' | 'green' | 'red' | 'blue' | 'orange' | 'teal' | 'violet';

/**
 * Card bento (mesmo espírito da Início):
 * - tamanhos assimétricos via spanClosed/spanOpen (grelha 12)
 * - expandMode width = cresce na linha | height = cresce para baixo
 * - cores do sistema por tone
 */
function BentoPanel({
  isOpen,
  onToggle,
  header,
  preview,
  children,
  tone = 'default',
  expandMode = 'height',
  spanClosed = 'col-span-12 md:col-span-4',
  spanOpen,
  heightClosed = 'h-[220px]',
  heightOpen,
}: {
  isOpen: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  /** Conteúdo compacto quando fechado (opcional; senão usa children) */
  preview?: React.ReactNode;
  children: React.ReactNode;
  tone?: BentoTone;
  expandMode?: 'width' | 'height';
  spanClosed?: string;
  spanOpen?: string;
  heightClosed?: string;
  heightOpen?: string;
}) {
  const toneCls: Record<BentoTone, string> = {
    // Superfície elevada sobre canvas cinza da página
    default: 'border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]',
    green: 'border-[color-mix(in_srgb,var(--color-success)_38%,var(--border))] bg-[color-mix(in_srgb,var(--color-success)_8%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
    red: 'border-[color-mix(in_srgb,var(--color-error)_38%,var(--border))] bg-[color-mix(in_srgb,var(--color-error)_8%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
    blue: 'border-[color-mix(in_srgb,var(--color-primary)_38%,var(--border))] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
    orange: 'border-[color-mix(in_srgb,#e66100_40%,var(--border))] bg-[color-mix(in_srgb,#e66100_8%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
    teal: 'border-[color-mix(in_srgb,#0f766e_40%,var(--border))] bg-[color-mix(in_srgb,#14b8a6_9%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
    violet: 'border-[color-mix(in_srgb,#6d28d9_38%,var(--border))] bg-[color-mix(in_srgb,#8b5cf6_9%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
  };

  const openSpan = spanOpen || (expandMode === 'width' ? 'col-span-12' : spanClosed);
  const openH = heightOpen || (expandMode === 'width' ? 'min-h-[320px] max-h-[520px]' : 'min-h-[360px] max-h-[560px]');
  const sizeCls = isOpen
    ? `${openH} shadow-[var(--shadow-md)]`
    : `${heightClosed}`;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[var(--radius-lg)] border transition-all duration-300 ease-out ${toneCls[tone]} ${sizeCls} ${
        isOpen ? openSpan : spanClosed
      }`}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--border-light)] px-3.5 py-2.5">
        <div className="min-w-0 flex-1">{header}</div>
        <button
          type="button"
          onClick={onToggle}
          className="nl-icon-btn nl-icon-btn-sm shrink-0"
          title={isOpen ? 'Recolher' : 'Expandir'}
        >
          {isOpen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-3 py-2.5">
        {isOpen ? children : (preview ?? children)}
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────

const parseAdminDate = (value?: string | null) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const pt = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (pt) return new Date(Number(pt[3]), Number(pt[2]) - 1, Number(pt[1]));
  const d = new Date(raw.includes(' ') ? raw.replace(' ', 'T') : raw);
  return Number.isNaN(d.getTime()) ? parseFlexibleDate(raw) : d;
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatDayLabel = (isoKey: string) => {
  const [y, m, d] = isoKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' });
};

const normalizeMethod = (method?: string) => {
  const m = String(method || '').trim().toLowerCase();
  if (m.includes('multi') || m.includes('pos') || m.includes('cart')) return 'Multicaixa';
  if (m.includes('transf') || m.includes('bank') || m.includes('dep')) return 'Transferência';
  if (m.includes('din') || m.includes('cash')) return 'Dinheiro';
  return method?.trim() || 'Outro';
};

const METHOD_META: Record<string, { icon: React.ReactNode; color: string; soft: string }> = {
  Dinheiro: {
    icon: <Banknote size={16} />,
    color: 'var(--color-success)',
    soft: 'color-mix(in srgb, var(--color-success) 12%, var(--bg-surface))',
  },
  Multicaixa: {
    icon: <CreditCard size={16} />,
    color: 'var(--color-primary)',
    soft: 'color-mix(in srgb, var(--color-primary) 12%, var(--bg-surface))',
  },
  Transferência: {
    icon: <Landmark size={16} />,
    color: '#9141ac',
    soft: 'color-mix(in srgb, #9141ac 12%, var(--bg-surface))',
  },
  Outro: {
    icon: <Wallet size={16} />,
    color: 'var(--text-secondary)',
    soft: 'var(--color-secondary-light)',
  },
};

function MiniBar({ data, height = 110 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
          <span className="mb-0.5 text-[9px] font-semibold tabular-nums nl-text-muted">
            {item.value > 0 ? (item.value >= 1000 ? `${Math.round(item.value / 1000)}k` : item.value) : ''}
          </span>
          <div
            className="w-full max-w-[28px] rounded-t-[4px] transition-all"
            style={{
              height: `${Math.max(4, (item.value / max) * 100)}%`,
              background: item.color || 'var(--color-primary)',
              opacity: item.value > 0 ? 1 : 0.25,
            }}
            title={`${item.label}: ${formatCve(item.value)}`}
          />
          <span className="mt-1 w-full truncate text-center text-[9px] font-medium nl-text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ segments, size = 132 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size * 0.36;
  const sw = size * 0.14;
  const circ = 2 * Math.PI * r;
  const arcs = segments.reduce<{ dash: number; offset: number; color: string; i: number }[]>((acc, seg, i) => {
    const dash = (seg.value / total) * circ;
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    acc.push({ dash, offset, color: seg.color, i });
    return acc;
  }, []);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc) => (
          <circle
            key={arc.i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={sw}
            strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
        <circle cx={size / 2} cy={size / 2} r={r * 0.62} fill="var(--bg-surface)" />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-medium nl-text-muted">Total</span>
        <span className="text-[13px] font-semibold tabular-nums nl-text">{formatCve(total)}</span>
      </div>
    </div>
  );
}

// ── types ─────────────────────────────────────────────────────────────────

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

type MainTab = 'financeiro' | 'atividade';

// ── page ──────────────────────────────────────────────────────────────────

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
  nomeAcademia,
  sessionUser,
  onExportarExcel,
  onExportarPdf,
}: RelatoriosPageProps) {
  const isAdmin = sessionUser?.role === 'admin' || sessionUser?.role === 'root';
  const mesIdx = MONTH_OPTIONS.indexOf(mesRelatorio);
  const [mainTab, setMainTab] = useState<MainTab>('financeiro');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [filtroMetodo, setFiltroMetodo] = useState<string>('todos');
  const [filtroUser, setFiltroUser] = useState<string>('todos');
  /** Painéis bento — cada um expande sozinho (como na Início) */
  const [openPanels, setOpenPanels] = useState({
    metodos: false,
    mix: false,
    graficos: false,
    cobertura: false,
    movimentos: false,
    inactivos: false,
    equipa: true,
    timeline: false,
  });
  const [adminData, setAdminData] = useState<{ users: any[]; logs: any[]; notes: any[] }>({
    users: [],
    logs: [],
    notes: [],
  });
  const [adminLoading, setAdminLoading] = useState(false);

  const togglePanel = (id: keyof typeof openPanels) => {
    setOpenPanels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Carregar atividade (logs, notas, users) — ligado ao backend
  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    const load = async () => {
      setAdminLoading(true);
      try {
        const electron = (window as any).electron;
        if (!electron) return;
        const res = await electron.ipcRenderer.invoke('reports:admin-data');
        if (mounted && res?.success) {
          setAdminData({
            users: res.users || [],
            logs: res.logs || [],
            notes: res.notes || [],
          });
        }
      } catch (e) {
        console.error('Erro reports:admin-data', e);
      } finally {
        if (mounted) setAdminLoading(false);
      }
    };
    load();
    const t = setInterval(load, 90000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [isAdmin, mesRelatorio, anoRelatorio]);

  // ── Financeiro do período ──────────────────────────────────────────────
  const finance = useMemo(() => {
    const pagamentosMes = pagamentos.filter((p) => isPaymentInsideMonth(p, mesRelatorio, anoRelatorio));
    const receitaMes = pagamentosMes.reduce((s, p) => s + normalizeAmount(p.valor), 0);

    // Por método
    const byMethodMap = new Map<string, { count: number; total: number }>();
    for (const p of pagamentosMes) {
      const key = normalizeMethod(p.metodo_pagamento);
      const cur = byMethodMap.get(key) || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += normalizeAmount(p.valor);
      byMethodMap.set(key, cur);
    }
    // Garantir os 3 métodos principais
    for (const m of PAYMENT_METHOD_OPTIONS.map((x) => x.label)) {
      if (!byMethodMap.has(m)) byMethodMap.set(m, { count: 0, total: 0 });
    }
    const byMethod = Array.from(byMethodMap.entries())
      .map(([method, v]) => ({ method, ...v, meta: METHOD_META[method] || METHOD_META.Outro }))
      .sort((a, b) => b.total - a.total);

    // Entradas diárias do mês
    const daysInMonth = new Date(anoRelatorio, mesIdx + 1, 0).getDate();
    const dailyMap = new Map<string, { total: number; count: number; items: Payment[] }>();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${anoRelatorio}-${String(mesIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dailyMap.set(key, { total: 0, count: 0, items: [] });
    }
    for (const p of pagamentosMes) {
      const date = parseAdminDate(p.data_pagamento);
      if (!date) continue;
      const key = dayKey(date);
      const bucket = dailyMap.get(key);
      if (!bucket) continue;
      bucket.total += normalizeAmount(p.valor);
      bucket.count += 1;
      bucket.items.push(p);
    }
    const dailySeries = Array.from(dailyMap.entries()).map(([key, v]) => ({
      key,
      label: String(Number(key.slice(-2))),
      value: v.total,
      count: v.count,
      items: v.items,
      color: v.total > 0 ? 'var(--color-success)' : 'var(--border)',
    }));

    // 6 meses receita
    const receita6 = Array.from({ length: 6 }, (_, i) => {
      const base = new Date(hojeReferencia.getFullYear(), hojeReferencia.getMonth() - 5 + i, 1);
      const m = MONTH_OPTIONS[base.getMonth()];
      const y = base.getFullYear();
      const total = pagamentos
        .filter((p) => isPaymentInsideMonth(p, m, y))
        .reduce((s, p) => s + normalizeAmount(p.valor), 0);
      return {
        label: m.slice(0, 3),
        value: total,
        color: m === mesRelatorio && y === anoRelatorio ? 'var(--color-primary)' : 'var(--color-secondary)',
        mes: m,
        ano: y,
      };
    });

    // Cobertura alunos
    const ref = new Date(anoRelatorio, mesIdx + 1, 0);
    const alunosPeriodo = alunos.filter((a) => {
      const entrada = parseFlexibleDate(a.data_matricula);
      return entrada ? entrada.getTime() <= ref.getTime() : true;
    });
    const resumos = alunosPeriodo.map((aluno) => ({
      aluno,
      resumo: getStudentStatusForMonth(aluno, pagamentos, anoRelatorio, mesIdx, hojeReferencia),
    }));
    const operacionais = resumos.filter((r) => STUDENT_STATUS_HELPERS.isOperational(r.aluno.status));
    const atrasados = operacionais.filter((r) => r.resumo.status === 'atrasado' || r.resumo.status === 'hoje');
    const pagos = operacionais.filter((r) => r.resumo.status === 'pago');
    const inactivos = resumos.filter((r) => {
      const s = r.aluno.status;
      return (
        STUDENT_STATUS_HELPERS.isPaused(s)
        || STUDENT_STATUS_HELPERS.isQuit(s)
        || STUDENT_STATUS_HELPERS.isBlocked(s)
      );
    });
    const desistentes = inactivos.filter((r) => STUDENT_STATUS_HELPERS.isQuit(r.aluno.status));
    const emPausa = inactivos.filter((r) => STUDENT_STATUS_HELPERS.isPaused(r.aluno.status) && !STUDENT_STATUS_HELPERS.isOnLeave(r.aluno.status));
    const ferias = inactivos.filter((r) => STUDENT_STATUS_HELPERS.isOnLeave(r.aluno.status));
    const bloqueados = inactivos.filter((r) => STUDENT_STATUS_HELPERS.isBlocked(r.aluno.status));

    const previsao = operacionais.reduce((s, { aluno }) => s + normalizeAmount(aluno.plano), 0);
    const dividaValor = atrasados.reduce((s, { aluno }) => s + normalizeAmount(aluno.plano), 0);

    const pagamentosFiltrados =
      filtroMetodo === 'todos'
        ? pagamentosMes
        : pagamentosMes.filter((p) => normalizeMethod(p.metodo_pagamento) === filtroMetodo);

    return {
      pagamentosMes,
      pagamentosFiltrados,
      receitaMes,
      byMethod,
      dailySeries,
      receita6,
      atrasados,
      pagos,
      previsao,
      dividaValor,
      pendente: Math.max(0, previsao - receitaMes),
      media: pagamentosMes.length ? Math.round(receitaMes / pagamentosMes.length) : 0,
      count: pagamentosMes.length,
      operacionaisCount: operacionais.length,
      inactivos,
      desistentes,
      emPausa,
      ferias,
      bloqueados,
    };
  }, [pagamentos, alunos, mesRelatorio, anoRelatorio, mesIdx, hojeReferencia, filtroMetodo]);

  // ── Atividade no período ───────────────────────────────────────────────
  const activity = useMemo(() => {
    const logs = adminData.logs || [];
    const notes = adminData.notes || [];

    const inPeriod = (value?: string) => {
      const d = parseAdminDate(value);
      return Boolean(d && d.getFullYear() === anoRelatorio && d.getMonth() === mesIdx);
    };

    const logsMes = logs.filter((l) => inPeriod(l.data_hora));
    const notesMes = notes.filter((n) => inPeriod(n.data_criacao));
    const pagamentosMes = pagamentos.filter((p) => isPaymentInsideMonth(p, mesRelatorio, anoRelatorio));

    // Timeline unificada (pagamentos + logs + notas)
    type Event = { id: string; at: Date; type: string; title: string; detail: string; user?: string; amount?: number };
    const events: Event[] = [];

    for (const p of pagamentosMes) {
      const at = parseAdminDate(p.data_pagamento);
      if (!at) continue;
      events.push({
        id: `pay-${p.id}`,
        at,
        type: 'pagamento',
        title: 'Pagamento registado',
        detail: `${(p as any).nome || p.alunoId || p.aluno_id || 'Aluno'} · ${normalizeMethod(p.metodo_pagamento)}`,
        amount: normalizeAmount(p.valor),
        user: (p as any).user_name || 'Sistema',
      });
    }
    for (const l of logsMes) {
      const at = parseAdminDate(l.data_hora);
      if (!at) continue;
      events.push({
        id: `log-${l.id}`,
        at,
        type: String(l.acao || 'ação'),
        title: String(l.acao || 'Ação'),
        detail: String(l.detalhes || ''),
        user: l.user_name || 'Sistema',
      });
    }
    for (const n of notesMes) {
      const at = parseAdminDate(n.data_criacao);
      if (!at) continue;
      events.push({
        id: `note-${n.id}`,
        at,
        type: 'nota',
        title: 'Nota adicionada',
        detail: `${n.nome || 'Aluno'}: ${String(n.texto || '').slice(0, 80)}`,
        user: n.user_name || 'Operador',
      });
    }

    events.sort((a, b) => b.at.getTime() - a.at.getTime());

    const filtered =
      filtroUser === 'todos' ? events : events.filter((e) => (e.user || 'Sistema') === filtroUser);

    // Por utilizador
    const byUser = new Map<string, { pagamentos: number; notas: number; acoes: number; logins: number }>();
    const bump = (user: string, field: 'pagamentos' | 'notas' | 'acoes' | 'logins') => {
      const cur = byUser.get(user) || { pagamentos: 0, notas: 0, acoes: 0, logins: 0 };
      cur[field] += 1;
      byUser.set(user, cur);
    };
    for (const e of events) {
      const u = e.user || 'Sistema';
      if (e.type === 'pagamento') bump(u, 'pagamentos');
      else if (e.type === 'nota') bump(u, 'notas');
      else if (String(e.type).toLowerCase().includes('login')) bump(u, 'logins');
      else bump(u, 'acoes');
    }

    const usersList = Array.from(byUser.entries())
      .map(([name, stats]) => ({ name, ...stats, total: stats.pagamentos + stats.notas + stats.acoes + stats.logins }))
      .sort((a, b) => b.total - a.total);

    const userNames = ['todos', ...usersList.map((u) => u.name)];

    return { events: filtered, usersList, userNames, logsMes, notesMes, totalEvents: events.length };
  }, [adminData, pagamentos, mesRelatorio, anoRelatorio, mesIdx, filtroUser]);

  // Timeline de meses
  const timelineMonths = MONTH_OPTIONS.map((mes, index) => {
    if (isFutureMonth(index, anoRelatorio, hojeReferencia)) return null;
    const total = pagamentos
      .filter((p) => isPaymentInsideMonth(p, mes, anoRelatorio))
      .reduce((s, p) => s + normalizeAmount(p.valor), 0);
    const count = pagamentos.filter((p) => isPaymentInsideMonth(p, mes, anoRelatorio)).length;
    return {
      mes,
      short: mes.slice(0, 3),
      index,
      active: mes === mesRelatorio,
      current: anoRelatorio === hojeReferencia.getFullYear() && index === hojeReferencia.getMonth(),
      total,
      count,
    };
  }).filter(Boolean) as {
    mes: string;
    short: string;
    index: number;
    active: boolean;
    current: boolean;
    total: number;
    count: number;
  }[];

  const dayDetail = selectedDay
    ? finance.dailySeries.find((d) => d.key === selectedDay)
    : null;

  // Último dia do mês → aviso visual de relatório mensal
  const isMonthEndWindow = useMemo(() => {
    const last = new Date(hojeReferencia.getFullYear(), hojeReferencia.getMonth() + 1, 0).getDate();
    const day = hojeReferencia.getDate();
    return day >= last - 2;
  }, [hojeReferencia]);

  if (!isAdmin) {
    return (
      <div className="nl-reports-page flex h-full w-full items-center justify-center animate-fade-in">
        <div className="nl-card max-w-md text-center !p-8 shadow-[var(--shadow-md)]">
          <ShieldCheck size={32} className="mx-auto text-[var(--color-error)]" />
          <h2 className="mt-3 text-[17px] font-semibold nl-text">Acesso reservado</h2>
          <p className="mt-2 text-[13px] nl-text-sub">
            Relatórios financeiros e atividade só estão disponíveis para administradores.
          </p>
        </div>
      </div>
    );
  }

  const rulerMarks = timelineMonths.map((m) => {
    const max = Math.max(...timelineMonths.map((x) => x.total), 1);
    return { index: m.index, weight: Math.min(1, m.total / max) };
  });

  return (
    <div className="nl-reports-page flex h-full w-full flex-col overflow-hidden animate-fade-in">
      {/* Barra de ferramentas — superfície elevada sobre o canvas cinza */}
      <div className="nl-reports-toolbar shrink-0">
        <div className="flex h-11 items-center gap-2 px-3">
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => setAnoRelatorio((y) => y - 1)} className="nl-icon-btn nl-icon-btn-sm" title="Ano anterior">
              <ChevronLeft size={14} />
            </button>
            <span className="rounded-[var(--radius-compact)] border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1 text-[12px] font-semibold tabular-nums nl-text">
              {anoRelatorio}
            </span>
            <button
              type="button"
              onClick={() => setAnoRelatorio((y) => Math.min(y + 1, hojeReferencia.getFullYear()))}
              className="nl-icon-btn nl-icon-btn-sm"
              title="Próximo ano"
              disabled={anoRelatorio >= hojeReferencia.getFullYear()}
            >
              <ChevronRight size={14} />
            </button>
            <div className="ml-1 nl-view-switcher !p-0.5">
              <button type="button" className={`nl-view-switcher-btn !h-7 !px-2.5 !text-[11px] ${mainTab === 'financeiro' ? 'is-active' : ''}`} onClick={() => setMainTab('financeiro')}>
                <Wallet size={12} /> Finanças
              </button>
              <button type="button" className={`nl-view-switcher-btn !h-7 !px-2.5 !text-[11px] ${mainTab === 'atividade' ? 'is-active' : ''}`} onClick={() => setMainTab('atividade')}>
                <Activity size={12} /> Atividade
              </button>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <TimeRuler
              year={anoRelatorio}
              selectedIndex={mesIdx >= 0 ? mesIdx : 0}
              referenceDate={hojeReferencia}
              accent="relatorios"
              maxWidth={420}
              marks={rulerMarks}
              onSelect={(_i, mes) => {
                setMesRelatorio(mes);
                setSelectedDay(null);
              }}
              onYearChange={setAnoRelatorio}
              onGoToCurrent={() => {
                setAnoRelatorio(hojeReferencia.getFullYear());
                setMesRelatorio(MONTH_OPTIONS[hojeReferencia.getMonth()]);
                setSelectedDay(null);
              }}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="hidden text-[11px] font-medium capitalize nl-text-muted xl:inline">
              {mesRelatorio} {anoRelatorio}
            </span>
            <button type="button" onClick={onExportarPdf} className="nl-btn nl-btn-secondary nl-btn-sm !h-8">
              <Printer size={13} /> PDF
            </button>
            <button type="button" onClick={onExportarExcel} className="nl-btn nl-btn-secondary nl-btn-sm !h-8">
              <Download size={13} /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* Aviso fim de mês */}
      {isMonthEndWindow && (
        <div className="shrink-0 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--bg-surface))] px-4 py-2">
          <div className="mx-auto flex items-center gap-2 text-[12px] font-medium" style={{ maxWidth: larguraListas }}>
            <CalendarDays size={14} className="text-[var(--color-warning)]" />
            <span className="nl-text">
              Janela de fecho mensal — reveja o relatório de <strong className="capitalize">{mesRelatorio}</strong> e exporte se necessário.
            </span>
          </div>
        </div>
      )}

      {/* Conteúdo — canvas cinza; cards em superfície elevada */}
      <div className="nl-reports-scroll min-h-0 flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
        <div className="mx-auto flex flex-col gap-3" style={{ maxWidth: larguraListas }}>
          {mainTab === 'financeiro' ? (
            <>
              {/* Cabeçalho — só texto + ícones, sem fundo/borda/card */}
              <section className="px-0.5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                  {/* Esquerda — título + mês */}
                  <div className="min-w-0 shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] nl-text-muted">
                      Relatório financeiro
                    </p>
                    <h1 className="mt-1 text-[22px] font-semibold leading-tight nl-text capitalize">
                      {mesRelatorio}{' '}
                      <span className="font-medium tabular-nums nl-text-sub">{anoRelatorio}</span>
                    </h1>
                    <p className="mt-1 text-[12px] font-medium nl-text-muted">
                      {finance.count} pagamento{finance.count === 1 ? '' : 's'} registado{finance.count === 1 ? '' : 's'}
                      {finance.inactivos.length > 0 ? ` · ${finance.inactivos.length} fora da conta` : ''}
                    </p>
                  </div>

                  {/* Direita — métricas soltas (ícone + texto) */}
                  <div className="flex min-w-0 flex-1 flex-wrap items-start justify-start gap-x-6 gap-y-3 lg:justify-end">
                    {[
                      {
                        label: 'Alunos',
                        value: String(finance.operacionaisCount),
                        icon: <Users size={15} strokeWidth={2.2} />,
                        color: 'var(--color-primary)',
                      },
                      {
                        label: 'Pagos',
                        value: formatCve(finance.receitaMes),
                        icon: <CheckCircle2 size={15} strokeWidth={2.2} />,
                        color: 'var(--color-success)',
                      },
                      {
                        label: 'Por cobrar',
                        value: formatCve(finance.pendente),
                        icon: <Wallet size={15} strokeWidth={2.2} />,
                        color: finance.pendente > 0 ? 'var(--color-warning)' : 'var(--color-success)',
                      },
                      {
                        label: 'Total esperado',
                        value: formatCve(finance.previsao),
                        icon: <TrendingUp size={15} strokeWidth={2.2} />,
                        color: 'var(--text-primary)',
                      },
                      {
                        label: 'Em dívida',
                        value: formatCve(finance.dividaValor),
                        icon: <AlertCircle size={15} strokeWidth={2.2} />,
                        color: finance.atrasados.length > 0 ? 'var(--color-error)' : 'var(--color-success)',
                        sub: finance.atrasados.length > 0 ? `${finance.atrasados.length} aluno(s)` : '0 alunos',
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex min-w-[6.5rem] items-start gap-1.5">
                        <span className="mt-0.5 shrink-0" style={{ color: item.color }}>
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] nl-text-muted">
                            {item.label}
                          </p>
                          <p
                            className="mt-0.5 text-[15px] font-semibold tabular-nums leading-none"
                            style={{ color: item.color }}
                          >
                            {item.value}
                          </p>
                          {'sub' in item && item.sub ? (
                            <p className="mt-0.5 text-[10px] font-medium nl-text-muted">{item.sub}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Linha de totais — texto puro sob o fundo */}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                  <span className="font-semibold nl-text-muted">Soma do mês</span>
                  <span className="text-[var(--border)]">·</span>
                  <span className="font-medium nl-text-sub">
                    <strong className="tabular-nums nl-text">{finance.operacionaisCount}</strong> alunos
                  </span>
                  <span className="text-[var(--border)]">·</span>
                  <span className="font-medium text-[var(--color-success)]">
                    Pagos <strong className="tabular-nums">{formatCve(finance.receitaMes)}</strong>
                  </span>
                  <span className="text-[var(--border)]">·</span>
                  <span className="font-medium" style={{ color: finance.pendente > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    Por cobrar <strong className="tabular-nums">{formatCve(finance.pendente)}</strong>
                  </span>
                  <span className="text-[var(--border)]">·</span>
                  <span className="font-medium text-[var(--color-error)]">
                    Dívida <strong className="tabular-nums">{formatCve(finance.dividaValor)}</strong>
                  </span>
                  <span className="text-[var(--border)]">·</span>
                  <span className="ml-auto font-semibold nl-text">
                    Total esperado{' '}
                    <strong className="tabular-nums text-[var(--color-primary)]">{formatCve(finance.previsao)}</strong>
                  </span>
                </div>
              </section>

              {/* Grelha 3 colunas — cards compactos e funcionais */}
              <section className="mt-[60px] grid grid-cols-12 gap-2.5 items-start">
                {/* 1 · Métodos (filtro clicável) */}
                <BentoPanel
                  isOpen={openPanels.metodos}
                  onToggle={() => togglePanel('metodos')}
                  tone="green"
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-4"
                  spanOpen="col-span-12 md:col-span-4"
                  heightClosed="h-[196px]"
                  heightOpen="min-h-[300px] max-h-[420px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Wallet size={13} className="text-[var(--color-success)]" />
                        <h2 className="text-[13px] font-semibold nl-text">Métodos</h2>
                        {filtroMetodo !== 'todos' && (
                          <span className="badge badge-success !text-[9px]">{filtroMetodo}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium text-[var(--color-success)]">
                        Clique para filtrar · {formatCve(finance.receitaMes)}
                      </p>
                    </div>
                  )}
                  preview={(
                    <div className="space-y-1.5">
                      {finance.byMethod.map((m) => {
                        const pct = finance.receitaMes > 0 ? Math.round((m.total / finance.receitaMes) * 100) : 0;
                        const active = filtroMetodo === m.method;
                        return (
                          <button
                            key={m.method}
                            type="button"
                            onClick={() => setFiltroMetodo(active ? 'todos' : m.method)}
                            className={`flex w-full items-center gap-2 rounded-[6px] px-1.5 py-1 text-left transition-colors ${
                              active ? 'bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)]' : 'hover:bg-[var(--color-secondary-light)]'
                            }`}
                          >
                            <span className="shrink-0" style={{ color: m.meta.color }}>{m.meta.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate text-[11px] font-semibold nl-text">{m.method}</span>
                                <span className="text-[11px] font-semibold tabular-nums nl-text">{formatCve(m.total)}</span>
                              </div>
                              <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-[var(--border-light)]">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.meta.color }} />
                              </div>
                            </div>
                            <span className="w-7 shrink-0 text-right text-[10px] tabular-nums nl-text-muted">{pct}%</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                >
                  <div className="space-y-1.5">
                    {finance.byMethod.map((m) => {
                      const pct = finance.receitaMes > 0 ? Math.round((m.total / finance.receitaMes) * 100) : 0;
                      const active = filtroMetodo === m.method;
                      return (
                        <button
                          key={m.method}
                          type="button"
                          onClick={() => setFiltroMetodo(active ? 'todos' : m.method)}
                          className={`flex w-full items-center gap-2.5 rounded-[8px] border px-2.5 py-2 text-left transition-all ${
                            active ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--border-light)]'
                          }`}
                          style={{ background: m.meta.soft }}
                        >
                          <span style={{ color: m.meta.color }}>{m.meta.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold nl-text">{m.method}</p>
                            <p className="text-[10px] nl-text-muted">{m.count} pag. · {pct}%</p>
                          </div>
                          <p className="text-[13px] font-semibold tabular-nums nl-text">{formatCve(m.total)}</p>
                        </button>
                      );
                    })}
                    {filtroMetodo !== 'todos' && (
                      <button type="button" className="nl-btn nl-btn-ghost nl-btn-sm w-full" onClick={() => setFiltroMetodo('todos')}>
                        Limpar filtro · ver todos
                      </button>
                    )}
                  </div>
                </BentoPanel>

                {/* 2 · Mix + cobertura rápida */}
                <BentoPanel
                  isOpen={openPanels.mix}
                  onToggle={() => togglePanel('mix')}
                  tone="blue"
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-4"
                  spanOpen="col-span-12 md:col-span-4"
                  heightClosed="h-[196px]"
                  heightOpen="min-h-[300px] max-h-[420px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={13} className="text-[var(--color-primary)]" />
                        <h2 className="text-[13px] font-semibold nl-text">Mix & cobertura</h2>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium nl-text-muted">Receita + estado dos activos</p>
                    </div>
                  )}
                  preview={(
                    <div className="flex h-full items-center gap-3">
                      <Donut
                        size={92}
                        segments={finance.byMethod
                          .filter((m) => m.total > 0)
                          .map((m) => ({ label: m.method, value: m.total, color: m.meta.color }))}
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div>
                          <p className="text-[10px] nl-text-muted">Em dia</p>
                          <p className="text-[18px] font-semibold tabular-nums text-[var(--color-success)]">{finance.pagos.length}</p>
                        </div>
                        <div>
                          <p className="text-[10px] nl-text-muted">Em atraso</p>
                          <p className="text-[16px] font-semibold tabular-nums text-[var(--color-error)]">{finance.atrasados.length}</p>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border-light)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-success)]"
                            style={{
                              width: `${finance.operacionaisCount > 0 ? Math.round((finance.pagos.length / finance.operacionaisCount) * 100) : 0}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] nl-text-muted">
                          {finance.operacionaisCount > 0
                            ? `${Math.round((finance.pagos.length / finance.operacionaisCount) * 100)}% cobertos`
                            : '—'}
                        </p>
                      </div>
                    </div>
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Donut
                        size={120}
                        segments={finance.byMethod
                          .filter((m) => m.total > 0)
                          .map((m) => ({ label: m.method, value: m.total, color: m.meta.color }))}
                      />
                      <ul className="min-w-0 flex-1 space-y-1">
                        {finance.byMethod.map((m) => {
                          const pct = finance.receitaMes > 0 ? Math.round((m.total / finance.receitaMes) * 100) : 0;
                          return (
                            <li key={m.method} className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="flex items-center gap-1.5 font-medium" style={{ color: m.meta.color }}>
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.meta.color }} />
                                {m.method}
                              </span>
                              <span className="tabular-nums nl-text-muted">{pct}%</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="rounded-[6px] border border-[var(--border-light)] px-2 py-1.5 text-center">
                        <p className="text-[9px] nl-text-muted">Em dia</p>
                        <p className="text-[15px] font-semibold text-[var(--color-success)]">{finance.pagos.length}</p>
                      </div>
                      <div className="rounded-[6px] border border-[var(--border-light)] px-2 py-1.5 text-center">
                        <p className="text-[9px] nl-text-muted">Atraso</p>
                        <p className="text-[15px] font-semibold text-[var(--color-error)]">{finance.atrasados.length}</p>
                      </div>
                      <div className="rounded-[6px] border border-[var(--border-light)] px-2 py-1.5 text-center">
                        <p className="text-[9px] nl-text-muted">Activos</p>
                        <p className="text-[15px] font-semibold nl-text">{finance.operacionaisCount}</p>
                      </div>
                    </div>
                  </div>
                </BentoPanel>

                {/* 3 · Evolução 6 meses (clique muda o mês) */}
                <BentoPanel
                  isOpen={openPanels.graficos}
                  onToggle={() => togglePanel('graficos')}
                  tone="orange"
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-4"
                  spanOpen="col-span-12 md:col-span-4"
                  heightClosed="h-[196px]"
                  heightOpen="min-h-[320px] max-h-[440px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-[#c64600]" />
                        <h2 className="text-[13px] font-semibold nl-text">Evolução</h2>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium capitalize text-[#c64600]">
                        6 meses · clique num mês
                      </p>
                    </div>
                  )}
                  preview={(
                    <div className="flex h-full flex-col">
                      <MiniBar
                        height={108}
                        data={finance.receita6.map((r) => ({
                          label: r.label,
                          value: r.value,
                          color: r.mes === mesRelatorio && r.ano === anoRelatorio ? 'var(--color-primary)' : r.color,
                        }))}
                      />
                      <div className="mt-1 flex flex-wrap gap-1">
                        {finance.receita6.map((r) => {
                          const active = r.mes === mesRelatorio && r.ano === anoRelatorio;
                          return (
                            <button
                              key={`${r.mes}-${r.ano}`}
                              type="button"
                              onClick={() => {
                                setMesRelatorio(r.mes);
                                setAnoRelatorio(r.ano);
                                setSelectedDay(null);
                              }}
                              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold transition-colors ${
                                active
                                  ? 'bg-[var(--color-primary)] text-white'
                                  : 'bg-[var(--color-secondary-light)] nl-text-sub hover:bg-[var(--color-secondary)]'
                              }`}
                            >
                              {r.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                >
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1.5 text-[11px] font-medium nl-text-muted">Últimos 6 meses</p>
                      <MiniBar
                        height={120}
                        data={finance.receita6.map((r) => ({
                          label: r.label,
                          value: r.value,
                          color: r.mes === mesRelatorio && r.ano === anoRelatorio ? 'var(--color-primary)' : r.color,
                        }))}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] font-medium nl-text-muted">Entradas diárias · {mesRelatorio}</p>
                      <MiniBar data={finance.dailySeries} height={100} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {finance.receita6.map((r) => (
                        <button
                          key={`${r.mes}-${r.ano}-x`}
                          type="button"
                          onClick={() => {
                            setMesRelatorio(r.mes);
                            setAnoRelatorio(r.ano);
                            setSelectedDay(null);
                          }}
                          className="nl-chip !text-[10px]"
                        >
                          {r.label} {String(r.ano).slice(2)} · {formatCve(r.value)}
                        </button>
                      ))}
                    </div>
                  </div>
                </BentoPanel>

                {/* 4 · Movimentos (dias + filtro) */}
                <BentoPanel
                  isOpen={openPanels.movimentos}
                  onToggle={() => togglePanel('movimentos')}
                  tone="default"
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-4"
                  spanOpen="col-span-12 md:col-span-4"
                  heightClosed="h-[196px]"
                  heightOpen="min-h-[360px] max-h-[520px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-[var(--color-primary)]" />
                        <h2 className="text-[13px] font-semibold nl-text">Movimentos</h2>
                        <span className="badge badge-info !text-[9px] tabular-nums">{finance.count}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium nl-text-muted">
                        {selectedDay ? formatDayLabel(selectedDay) : 'Dias com entradas'}
                      </p>
                    </div>
                  )}
                  preview={(
                    <div className="space-y-0.5">
                      {finance.dailySeries
                        .filter((d) => d.count > 0)
                        .slice()
                        .reverse()
                        .slice(0, 5)
                        .map((d) => (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => setSelectedDay(d.key === selectedDay ? null : d.key)}
                            className={`flex w-full items-center justify-between rounded-[6px] px-1.5 py-1 text-left transition-colors ${
                              selectedDay === d.key
                                ? 'bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]'
                                : 'hover:bg-[var(--color-secondary-light)]'
                            }`}
                          >
                            <span className="text-[11px] font-medium nl-text">{formatDayLabel(d.key)}</span>
                            <span className="text-[11px] font-semibold tabular-nums text-[var(--color-success)]">
                              {formatCve(d.value)}
                            </span>
                          </button>
                        ))}
                      {finance.dailySeries.filter((d) => d.count > 0).length === 0 && (
                        <p className="py-6 text-center text-[11px] nl-text-muted">Sem movimentos.</p>
                      )}
                    </div>
                  )}
                >
                  <div className="space-y-2">
                    <div className="max-h-[120px] space-y-0.5 overflow-y-auto custom-scrollbar">
                      {finance.dailySeries
                        .filter((d) => d.count > 0)
                        .slice()
                        .reverse()
                        .map((d) => (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => setSelectedDay(d.key === selectedDay ? null : d.key)}
                            className={`flex w-full items-center justify-between rounded-[6px] border px-2 py-1.5 text-left ${
                              selectedDay === d.key
                                ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--bg-surface))]'
                                : 'border-[var(--border-light)]'
                            }`}
                          >
                            <div>
                              <p className="text-[12px] font-semibold nl-text">{formatDayLabel(d.key)}</p>
                              <p className="text-[10px] nl-text-muted">{d.count} pag.</p>
                            </div>
                            <p className="text-[12px] font-semibold tabular-nums text-[var(--color-success)]">{formatCve(d.value)}</p>
                          </button>
                        ))}
                    </div>
                    <div className="border-t border-[var(--border-light)] pt-2">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide nl-text-muted">
                        {dayDetail ? formatDayLabel(dayDetail.key) : filtroMetodo === 'todos' ? 'Pagamentos do mês' : filtroMetodo}
                      </p>
                      <div className="max-h-[200px] space-y-0.5 overflow-y-auto custom-scrollbar">
                        {(dayDetail ? dayDetail.items : finance.pagamentosFiltrados).length === 0 ? (
                          <p className="py-4 text-center text-[11px] nl-text-muted">Sem registos.</p>
                        ) : (
                          (dayDetail ? dayDetail.items : finance.pagamentosFiltrados)
                            .slice()
                            .sort((a, b) => (b.id || 0) - (a.id || 0))
                            .map((p) => {
                              const method = normalizeMethod(p.metodo_pagamento);
                              const meta = METHOD_META[method] || METHOD_META.Outro;
                              return (
                                <div
                                  key={p.id || `${p.alunoId}-${p.data_pagamento}-${p.valor}`}
                                  className="flex items-center gap-2 rounded-[6px] px-1.5 py-1.5 hover:bg-[var(--color-secondary-light)]"
                                >
                                  <span className="shrink-0" style={{ color: meta.color }}>{meta.icon}</span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-semibold nl-text">
                                      {(p as any).nome || p.alunoId || p.aluno_id || 'Aluno'}
                                    </p>
                                    <p className="text-[9px] nl-text-muted">{p.data_pagamento} · {method}</p>
                                  </div>
                                  <p className="text-[11px] font-semibold tabular-nums text-[var(--color-success)]">{formatCve(p.valor)}</p>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                </BentoPanel>

                {/* 5 · Cobertura / dívida */}
                <BentoPanel
                  isOpen={openPanels.cobertura}
                  onToggle={() => togglePanel('cobertura')}
                  tone={finance.atrasados.length > 0 ? 'red' : 'green'}
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-4"
                  spanOpen="col-span-12 md:col-span-4"
                  heightClosed="h-[196px]"
                  heightOpen="min-h-[320px] max-h-[460px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          size={13}
                          className={finance.atrasados.length > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-success)]'}
                        />
                        <h2 className="text-[13px] font-semibold nl-text">Cobertura</h2>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium nl-text-muted">
                        Média {formatCve(finance.media)} / pag.
                      </p>
                    </div>
                  )}
                  preview={(
                    <div className="flex h-full flex-col justify-between gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] nl-text-muted">Em dia</p>
                          <p className="text-[22px] font-semibold tabular-nums text-[var(--color-success)]">{finance.pagos.length}</p>
                        </div>
                        <div>
                          <p className="text-[10px] nl-text-muted">Atraso</p>
                          <p className="text-[22px] font-semibold tabular-nums text-[var(--color-error)]">{finance.atrasados.length}</p>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-[10px]">
                          <span className="nl-text-muted">Taxa de cobertura</span>
                          <span className="font-semibold tabular-nums nl-text">
                            {finance.operacionaisCount > 0
                              ? `${Math.round((finance.pagos.length / finance.operacionaisCount) * 100)}%`
                              : '—'}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--border-light)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-success)]"
                            style={{
                              width: `${finance.operacionaisCount > 0 ? Math.round((finance.pagos.length / finance.operacionaisCount) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="nl-text-muted">Dívida</span>
                        <span className="font-semibold tabular-nums text-[var(--color-error)]">{formatCve(finance.dividaValor)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="nl-text-muted">Previsão</span>
                        <span className="font-semibold tabular-nums text-[var(--color-primary)]">{formatCve(finance.previsao)}</span>
                      </div>
                    </div>
                  )}
                >
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-[6px] border border-[var(--border-light)] px-2.5 py-2">
                        <p className="text-[10px] nl-text-muted">Em dia</p>
                        <p className="text-[20px] font-semibold text-[var(--color-success)]">{finance.pagos.length}</p>
                      </div>
                      <div className="rounded-[6px] border border-[var(--border-light)] px-2.5 py-2">
                        <p className="text-[10px] nl-text-muted">Em atraso</p>
                        <p className="text-[20px] font-semibold text-[var(--color-error)]">{finance.atrasados.length}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide nl-text-muted">Alunos em atraso</p>
                    <div className="max-h-[220px] space-y-0.5 overflow-y-auto custom-scrollbar">
                      {finance.atrasados.length === 0 ? (
                        <p className="py-3 text-center text-[11px] nl-text-muted">Ninguém em atraso.</p>
                      ) : (
                        finance.atrasados.map(({ aluno, resumo }) => (
                          <div
                            key={aluno.id}
                            className="flex items-center justify-between gap-2 rounded-[6px] px-1.5 py-1.5 hover:bg-[var(--color-secondary-light)]"
                            style={{ boxShadow: 'inset 3px 0 0 var(--color-error)' }}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-semibold nl-text">{aluno.nome}</p>
                              <p className="text-[9px] nl-text-muted">{resumo.statusLabel || resumo.status}</p>
                            </div>
                            <p className="text-[11px] font-semibold tabular-nums text-[var(--color-error)]">
                              {formatCve(aluno.plano)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </BentoPanel>

                {/* 6 · Fora da contabilidade */}
                <BentoPanel
                  isOpen={openPanels.inactivos}
                  onToggle={() => togglePanel('inactivos')}
                  tone="violet"
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-4"
                  spanOpen="col-span-12 md:col-span-4"
                  heightClosed="h-[196px]"
                  heightOpen="min-h-[360px] max-h-[520px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <UserX size={13} className="text-[#6d28d9]" />
                        <h2 className="text-[13px] font-semibold nl-text">Fora da conta</h2>
                        <span className="badge badge-quit !text-[9px] tabular-nums">{finance.inactivos.length}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium text-[#6d28d9]">Pausa · férias · desist.</p>
                    </div>
                  )}
                  preview={(
                    <div className="flex h-full flex-col gap-1.5">
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: 'Pausa', count: finance.emPausa.length, tone: getManualStatusTone('pausado'), icon: <Pause size={11} /> },
                          { label: 'Férias', count: finance.ferias.length, tone: getManualStatusTone('ferias'), icon: <Palmtree size={11} /> },
                          { label: 'Desist.', count: finance.desistentes.length, tone: getManualStatusTone('desistente'), icon: <UserX size={11} /> },
                          { label: 'Bloq.', count: finance.bloqueados.length, tone: getManualStatusTone('bloqueado'), icon: <ShieldCheck size={11} /> },
                        ].map((item) => (
                          <div key={item.label} className="rounded-[6px] px-1 py-1.5 text-center" style={{ background: item.tone.bg }}>
                            <div className="flex justify-center" style={{ color: item.tone.fg }}>{item.icon}</div>
                            <p className="mt-0.5 text-[14px] font-semibold tabular-nums nl-text">{item.count}</p>
                            <p className="text-[8px] font-semibold" style={{ color: item.tone.fg }}>{item.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
                        {finance.inactivos.slice(0, 3).map(({ aluno }) => {
                          const tone = getManualStatusTone(aluno.status);
                          return (
                            <div key={aluno.id} className="flex items-center justify-between gap-1 px-0.5">
                              <p className="truncate text-[11px] font-medium nl-text">{aluno.nome}</p>
                              <span className={`badge ${tone.badge} shrink-0 !text-[8px] !py-0`}>{tone.label}</span>
                            </div>
                          );
                        })}
                        {finance.inactivos.length > 3 && (
                          <p className="text-center text-[10px] nl-text-muted">+{finance.inactivos.length - 3} mais · expandir</p>
                        )}
                      </div>
                    </div>
                  )}
                >
                  <div className="mb-2 grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Em pausa', count: finance.emPausa.length, icon: <Pause size={13} />, tone: getManualStatusTone('pausado') },
                      { label: 'Férias', count: finance.ferias.length, icon: <Palmtree size={13} />, tone: getManualStatusTone('ferias') },
                      { label: 'Desistentes', count: finance.desistentes.length, icon: <UserX size={13} />, tone: getManualStatusTone('desistente') },
                      { label: 'Bloqueados', count: finance.bloqueados.length, icon: <ShieldCheck size={13} />, tone: getManualStatusTone('bloqueado') },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 rounded-[6px] border px-2 py-1.5"
                        style={{ borderColor: item.tone.border, background: item.tone.bg }}
                      >
                        <span style={{ color: item.tone.fg }}>{item.icon}</span>
                        <div>
                          <p className="text-[9px] font-medium" style={{ color: item.tone.fg }}>{item.label}</p>
                          <p className="text-[14px] font-semibold tabular-nums nl-text">{item.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {finance.inactivos.length === 0 ? (
                    <p className="py-4 text-center text-[11px] nl-text-muted">Nenhum aluno fora da contabilidade.</p>
                  ) : (
                    <div className="max-h-[280px] space-y-0.5 overflow-y-auto custom-scrollbar">
                      {finance.inactivos.map(({ aluno }) => {
                        const tone = getManualStatusTone(aluno.status);
                        return (
                          <div
                            key={aluno.id}
                            className="flex items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 hover:bg-[var(--bg-surface)]/80"
                            style={{ boxShadow: `inset 3px 0 0 ${tone.fg}` }}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-semibold nl-text">{aluno.nome}</p>
                              <p className="text-[10px] nl-text-muted">{formatCve(aluno.plano)}</p>
                            </div>
                            <span className={`badge ${tone.badge} shrink-0 !text-[9px]`}>
                              {tone.label || getStudentStatusLabel(aluno.status)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </BentoPanel>
              </section>
            </>
          ) : (
            /* ── ATIVIDADE (bento) ── */
            <>
              <section className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Eventos no mês', value: String(activity.totalEvents), accent: 'text-[var(--color-primary)]', icon: <Activity size={15} /> },
                  { label: 'Notas', value: String(activity.notesMes.length), accent: 'text-[var(--color-warning)]', icon: <StickyNote size={15} style={{ color: '#EAB308' }} /> },
                  { label: 'Logs', value: String(activity.logsMes.length), accent: 'text-[var(--color-primary)]', icon: <BookUser size={15} /> },
                  { label: 'Utilizadores', value: String(activity.usersList.length), accent: 'text-[var(--color-success)]', icon: <Users size={15} /> },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="nl-card nl-reports-kpi !p-3 transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium nl-text-muted">{kpi.label}</span>
                      <span className={kpi.accent}>{kpi.icon}</span>
                    </div>
                    <p className={`mt-1 text-[19px] font-semibold tabular-nums ${kpi.accent}`}>{kpi.value}</p>
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-12 gap-3 items-start">
                <BentoPanel
                  isOpen={openPanels.equipa}
                  onToggle={() => togglePanel('equipa')}
                  tone="blue"
                  expandMode="width"
                  spanClosed="col-span-12 md:col-span-7 xl:col-span-8"
                  spanOpen="col-span-12"
                  heightClosed="h-[260px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-[var(--color-primary)]" />
                        <h2 className="text-[14px] font-semibold nl-text">Equipa</h2>
                        <span className="badge badge-info tabular-nums">{activity.usersList.length}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium nl-text-muted">Actividade por utilizador no mês</p>
                    </div>
                  )}
                  preview={(
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 content-start">
                      {activity.usersList.slice(0, 4).map((u) => (
                        <div key={u.name} className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--bg-surface)]/70 px-2 py-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] font-semibold text-white">
                            {u.name.slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold nl-text">{u.name}</p>
                            <p className="text-[10px] nl-text-muted">{u.total} eventos</p>
                          </div>
                        </div>
                      ))}
                      {activity.usersList.length === 0 && (
                        <p className="col-span-full py-6 text-center text-[12px] nl-text-muted">Sem actividade neste mês.</p>
                      )}
                    </div>
                  )}
                >
                  <div className="mb-3">
                    <select
                      className="nl-input !h-9 !w-auto min-w-[160px]"
                      value={filtroUser}
                      onChange={(e) => setFiltroUser(e.target.value)}
                    >
                      {activity.userNames.map((u) => (
                        <option key={u} value={u}>
                          {u === 'todos' ? 'Todos os utilizadores' : u}
                        </option>
                      ))}
                    </select>
                  </div>
                  {adminLoading && <p className="text-[12px] nl-text-muted">A carregar…</p>}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {activity.usersList.map((u) => (
                      <button
                        key={u.name}
                        type="button"
                        onClick={() => setFiltroUser(u.name)}
                        className={`rounded-[var(--radius-control)] border p-3 text-left transition-all ${
                          filtroUser === u.name
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                            : 'border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--color-secondary-light)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[12px] font-semibold text-white">
                            {u.name.slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold nl-text">{u.name}</p>
                            <p className="text-[11px] nl-text-muted">{u.total} eventos</p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                          <div>
                            <p className="text-[14px] font-semibold text-[var(--color-success)]">{u.pagamentos}</p>
                            <p className="text-[9px] nl-text-muted">Pag.</p>
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-[var(--color-warning)]">{u.notas}</p>
                            <p className="text-[9px] nl-text-muted">Notas</p>
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-[var(--color-primary)]">{u.acoes + u.logins}</p>
                            <p className="text-[9px] nl-text-muted">Ações</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {adminData.users.length > 0 && (
                    <div className="mt-4 border-t border-[var(--border-light)] pt-3">
                      <p className="mb-2 text-[12px] font-medium nl-text-muted">Contas no sistema</p>
                      <div className="flex flex-wrap gap-2">
                        {adminData.users.map((u) => (
                          <span
                            key={u.id}
                            className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-1 text-[11px] font-medium ${
                              u.is_active ? 'border-[var(--border)] nl-text' : 'border-[var(--border)] opacity-50'
                            }`}
                          >
                            <LogIn size={11} />
                            {u.name}
                            <span className="nl-text-muted">· {u.role}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </BentoPanel>

                <BentoPanel
                  isOpen={openPanels.timeline}
                  onToggle={() => togglePanel('timeline')}
                  tone="default"
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-5 xl:col-span-4"
                  spanOpen="col-span-12"
                  heightClosed="h-[260px]"
                  heightOpen="min-h-[420px] max-h-[560px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Activity size={14} className="nl-text-muted" />
                        <h2 className="text-[14px] font-semibold nl-text">Linha do tempo</h2>
                        <span className="badge badge-neutral tabular-nums">{activity.events.length}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] font-medium nl-text-muted">
                        {filtroUser !== 'todos' ? filtroUser : 'Todos os eventos'}
                      </p>
                    </div>
                  )}
                  preview={(
                    <div className="space-y-1">
                      {activity.events.slice(0, 4).map((e) => (
                        <div key={e.id} className="flex items-start gap-2 rounded-[var(--radius-compact)] px-1 py-1">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold nl-text">{e.title}</p>
                            <p className="truncate text-[10px] nl-text-muted">{e.detail}</p>
                          </div>
                        </div>
                      ))}
                      {activity.events.length === 0 && (
                        <p className="py-6 text-center text-[12px] nl-text-muted">Sem eventos.</p>
                      )}
                    </div>
                  )}
                >
                  <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                    {activity.events.length === 0 ? (
                      <p className="py-8 text-center text-[13px] nl-text-muted">Sem eventos neste filtro.</p>
                    ) : (
                      <ul className="relative space-y-0">
                        {activity.events.slice(0, 120).map((e, idx) => {
                          const isPay = e.type === 'pagamento';
                          const isNote = e.type === 'nota';
                          return (
                            <li key={e.id} className="relative flex gap-3 py-2.5">
                              {idx < Math.min(activity.events.length, 120) - 1 && (
                                <span className="absolute left-[15px] top-10 bottom-0 w-px bg-[var(--border-light)]" />
                              )}
                              <span
                                className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                                  isPay
                                    ? 'border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_14%,var(--bg-surface))] text-[var(--color-success)]'
                                    : isNote
                                      ? 'border-[var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_14%,var(--bg-surface))] text-[var(--color-warning)]'
                                      : 'border-[var(--border)] bg-[var(--color-secondary-light)] nl-text-sub'
                                }`}
                              >
                                {isPay ? <Wallet size={13} /> : isNote ? <StickyNote size={13} style={{ color: '#EAB308' }} /> : <Activity size={13} />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                  <p className="text-[13px] font-semibold nl-text">{e.title}</p>
                                  <p className="text-[11px] tabular-nums nl-text-muted">
                                    {e.at.toLocaleString('pt-PT', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                <p className="mt-0.5 text-[12px] nl-text-sub">{e.detail}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className="badge badge-neutral">{e.user || 'Sistema'}</span>
                                  {typeof e.amount === 'number' && (
                                    <span className="text-[12px] font-semibold text-[var(--color-success)]">
                                      {formatCve(e.amount)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </BentoPanel>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default RelatoriosPage;
