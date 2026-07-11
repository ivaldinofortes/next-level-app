import { memo, useEffect, useMemo, useState } from 'react';
import {
  Activity,
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
    default: 'border-[var(--border)] bg-[var(--bg-surface)]',
    green: 'border-[color-mix(in_srgb,var(--color-success)_38%,var(--border))] bg-[color-mix(in_srgb,var(--color-success)_8%,var(--bg-surface))]',
    red: 'border-[color-mix(in_srgb,var(--color-error)_38%,var(--border))] bg-[color-mix(in_srgb,var(--color-error)_8%,var(--bg-surface))]',
    blue: 'border-[color-mix(in_srgb,var(--color-primary)_38%,var(--border))] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--bg-surface))]',
    orange: 'border-[color-mix(in_srgb,#e66100_40%,var(--border))] bg-[color-mix(in_srgb,#e66100_8%,var(--bg-surface))]',
    teal: 'border-[color-mix(in_srgb,#0f766e_40%,var(--border))] bg-[color-mix(in_srgb,#14b8a6_9%,var(--bg-surface))]',
    violet: 'border-[color-mix(in_srgb,#6d28d9_38%,var(--border))] bg-[color-mix(in_srgb,#8b5cf6_9%,var(--bg-surface))]',
  };

  const openSpan = spanOpen || (expandMode === 'width' ? 'col-span-12' : spanClosed);
  const openH = heightOpen || (expandMode === 'width' ? 'min-h-[320px] max-h-[520px]' : 'min-h-[360px] max-h-[560px]');
  const sizeCls = isOpen
    ? `${openH} shadow-[var(--shadow-md)]`
    : `${heightClosed} shadow-[var(--shadow-xs)]`;

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
      <div className="flex h-full w-full items-center justify-center nl-bg-app">
        <div className="nl-card max-w-md text-center !p-8">
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
    <div className="flex h-full w-full flex-col overflow-hidden nl-bg-app animate-fade-in">
      {/* Barra única: esquerda | régua | direita + sub-abas na mesma linha */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-header)]">
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

      {/* Conteúdo — bento (como a Início) */}
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
        <div className="mx-auto flex flex-col gap-3" style={{ maxWidth: larguraListas }}>
          {mainTab === 'financeiro' ? (
            <>
              {/* KPIs fixos — faixa superior */}
              <section className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Receita do mês', value: formatCve(finance.receitaMes), sub: `${finance.count} pagamentos`, accent: 'text-[var(--color-success)]', icon: <TrendingUp size={15} /> },
                  { label: 'Média / pagamento', value: formatCve(finance.media), sub: 'neste período', accent: 'text-[var(--color-primary)]', icon: <Wallet size={15} /> },
                  { label: 'Por recuperar', value: formatCve(finance.pendente), sub: `${finance.atrasados.length} em atraso`, accent: finance.pendente > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-success)]', icon: <Users size={15} /> },
                  { label: 'Activos no mês', value: String(finance.operacionaisCount), sub: `${finance.inactivos.length} fora da conta`, accent: 'text-[var(--color-primary)]', icon: <CheckCircle2 size={15} /> },
                ].map((kpi) => (
                  <div key={kpi.label} className="nl-card !p-3 transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium nl-text-muted">{kpi.label}</span>
                      <span className={kpi.accent}>{kpi.icon}</span>
                    </div>
                    <p className={`mt-1 text-[19px] font-semibold tabular-nums leading-tight ${kpi.accent}`}>{kpi.value}</p>
                    <p className="mt-0.5 text-[10px] font-medium nl-text-muted">{kpi.sub}</p>
                  </div>
                ))}
              </section>

              {/* Grelha bento 12 cols */}
              <section className="grid grid-cols-12 gap-3 items-start">
                {/* Métodos — card largo, expande em largura */}
                <BentoPanel
                  isOpen={openPanels.metodos}
                  onToggle={() => togglePanel('metodos')}
                  tone="green"
                  expandMode="width"
                  spanClosed="col-span-12 md:col-span-7 xl:col-span-8"
                  spanOpen="col-span-12"
                  heightClosed="h-[240px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Wallet size={14} className="text-[var(--color-success)]" />
                        <h2 className="text-[14px] font-semibold nl-text">Formas de pagamento</h2>
                        <span className="badge badge-success tabular-nums">{finance.byMethod.length}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--color-success)]">
                        {formatCve(finance.receitaMes)} · distribuição do mês
                      </p>
                    </div>
                  )}
                  preview={(
                    <div className="grid h-full grid-cols-1 gap-2 sm:grid-cols-3 content-start">
                      {finance.byMethod.slice(0, 3).map((m) => {
                        const pct = finance.receitaMes > 0 ? Math.round((m.total / finance.receitaMes) * 100) : 0;
                        return (
                          <div key={m.method} className="rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--bg-surface)]/70 p-2.5" style={{ borderLeftColor: m.meta.color, borderLeftWidth: 3 }}>
                            <div className="flex items-center gap-1.5" style={{ color: m.meta.color }}>{m.meta.icon}<span className="text-[12px] font-semibold nl-text">{m.method}</span></div>
                            <p className="mt-1.5 text-[15px] font-semibold tabular-nums nl-text">{formatCve(m.total)}</p>
                            <p className="text-[10px] nl-text-muted">{m.count} pag. · {pct}%</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                >
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {finance.byMethod.map((m) => {
                      const pct = finance.receitaMes > 0 ? Math.round((m.total / finance.receitaMes) * 100) : 0;
                      const active = filtroMetodo === m.method;
                      return (
                        <button
                          key={m.method}
                          type="button"
                          onClick={() => setFiltroMetodo(active ? 'todos' : m.method)}
                          className={`rounded-[var(--radius-control)] border p-3 text-left transition-all ${
                            active ? 'border-[var(--color-primary)] ring-2 ring-[var(--shadow-primary-focus)]' : 'border-[var(--border)]'
                          }`}
                          style={{ background: m.meta.soft }}
                        >
                          <div className="flex items-center gap-2" style={{ color: m.meta.color }}>
                            {m.meta.icon}
                            <span className="text-[13px] font-semibold nl-text">{m.method}</span>
                          </div>
                          <p className="mt-2 text-[18px] font-semibold tabular-nums nl-text">{formatCve(m.total)}</p>
                          <p className="mt-0.5 text-[11px] font-medium nl-text-muted">{m.count} pag. · {pct}%</p>
                        </button>
                      );
                    })}
                  </div>
                  {filtroMetodo !== 'todos' && (
                    <button type="button" className="nl-btn nl-btn-ghost nl-btn-sm mt-2" onClick={() => setFiltroMetodo('todos')}>
                      Limpar filtro
                    </button>
                  )}
                </BentoPanel>

                {/* Mix donut — card estreito, expande em altura */}
                <BentoPanel
                  isOpen={openPanels.mix}
                  onToggle={() => togglePanel('mix')}
                  tone="blue"
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-5 xl:col-span-4"
                  spanOpen="col-span-12 md:col-span-5 xl:col-span-4"
                  heightClosed="h-[240px]"
                  heightOpen="min-h-[320px] max-h-[420px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={14} className="text-[var(--color-primary)]" />
                        <h2 className="text-[14px] font-semibold nl-text">Mix de métodos</h2>
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium nl-text-muted">Proporção visual da receita</p>
                    </div>
                  )}
                  preview={(
                    <div className="flex h-full flex-col items-center justify-center gap-1">
                      <Donut
                        size={108}
                        segments={finance.byMethod
                          .filter((m) => m.total > 0)
                          .map((m) => ({ label: m.method, value: m.total, color: m.meta.color }))}
                      />
                    </div>
                  )}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Donut
                      size={148}
                      segments={finance.byMethod
                        .filter((m) => m.total > 0)
                        .map((m) => ({ label: m.method, value: m.total, color: m.meta.color }))}
                    />
                    <ul className="w-full space-y-1.5">
                      {finance.byMethod.map((m) => {
                        const pct = finance.receitaMes > 0 ? Math.round((m.total / finance.receitaMes) * 100) : 0;
                        return (
                          <li key={m.method} className="flex items-center justify-between gap-2 text-[12px]">
                            <span className="flex items-center gap-1.5 font-medium nl-text" style={{ color: m.meta.color }}>
                              <span className="h-2 w-2 rounded-full" style={{ background: m.meta.color }} />
                              {m.method}
                            </span>
                            <span className="tabular-nums nl-text-muted">{pct}%</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </BentoPanel>

                {/* Evolução — laranja relatórios, expande em largura */}
                <BentoPanel
                  isOpen={openPanels.graficos}
                  onToggle={() => togglePanel('graficos')}
                  tone="orange"
                  expandMode="width"
                  spanClosed="col-span-12 md:col-span-8"
                  spanOpen="col-span-12"
                  heightClosed="h-[230px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-[#c64600]" />
                        <h2 className="text-[14px] font-semibold nl-text">Evolução</h2>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] font-medium capitalize text-[#c64600]">
                        {mesRelatorio} {anoRelatorio} · 6 meses
                      </p>
                    </div>
                  )}
                  preview={(
                    <MiniBar
                      height={140}
                      data={finance.receita6.map((r) => ({ label: r.label, value: r.value, color: r.color }))}
                    />
                  )}
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[12px] font-medium nl-text-muted">Entradas diárias</p>
                      <MiniBar data={finance.dailySeries} height={140} />
                    </div>
                    <div>
                      <p className="mb-2 text-[12px] font-medium nl-text-muted">Últimos 6 meses</p>
                      <MiniBar
                        data={finance.receita6.map((r) => ({ label: r.label, value: r.value, color: r.color }))}
                        height={140}
                      />
                      <div className="mt-2 flex flex-wrap gap-1">
                        {finance.receita6.map((r) => (
                          <button
                            key={`${r.mes}-${r.ano}`}
                            type="button"
                            onClick={() => {
                              setMesRelatorio(r.mes);
                              setAnoRelatorio(r.ano);
                              setSelectedDay(null);
                            }}
                            className="nl-chip"
                          >
                            {r.label} {String(r.ano).slice(2)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </BentoPanel>

                {/* Cobertura — card compacto */}
                <BentoPanel
                  isOpen={openPanels.cobertura}
                  onToggle={() => togglePanel('cobertura')}
                  tone={finance.atrasados.length > 0 ? 'red' : 'green'}
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-4"
                  spanOpen="col-span-12 md:col-span-4"
                  heightClosed="h-[230px]"
                  heightOpen="min-h-[280px] max-h-[360px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className={finance.atrasados.length > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-success)]'} />
                        <h2 className="text-[14px] font-semibold nl-text">Cobertura</h2>
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium nl-text-muted">Só activos na contabilidade</p>
                    </div>
                  )}
                  preview={(
                    <div className="flex h-full flex-col justify-center gap-3">
                      <div>
                        <p className="text-[11px] nl-text-muted">Em dia</p>
                        <p className="text-[28px] font-semibold tabular-nums text-[var(--color-success)]">{finance.pagos.length}</p>
                      </div>
                      <div>
                        <p className="text-[11px] nl-text-muted">Em atraso</p>
                        <p className="text-[22px] font-semibold tabular-nums text-[var(--color-error)]">{finance.atrasados.length}</p>
                      </div>
                    </div>
                  )}
                >
                  <div className="grid gap-2">
                    <div className="rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--bg-surface)]/70 p-3">
                      <p className="text-[11px] font-medium nl-text-muted">Alunos em dia</p>
                      <p className="mt-1 text-[24px] font-semibold text-[var(--color-success)]">{finance.pagos.length}</p>
                    </div>
                    <div className="rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--bg-surface)]/70 p-3">
                      <p className="text-[11px] font-medium nl-text-muted">Em atraso / vence hoje</p>
                      <p className="mt-1 text-[24px] font-semibold text-[var(--color-error)]">{finance.atrasados.length}</p>
                    </div>
                    <div className="rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--bg-surface)]/70 p-3">
                      <p className="text-[11px] font-medium nl-text-muted">Previsão (activos)</p>
                      <p className="mt-1 text-[20px] font-semibold text-[var(--color-primary)]">{formatCve(finance.previsao)}</p>
                    </div>
                  </div>
                </BentoPanel>

                {/* Movimentos — médio, expande em altura */}
                <BentoPanel
                  isOpen={openPanels.movimentos}
                  onToggle={() => togglePanel('movimentos')}
                  tone="default"
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-7"
                  spanOpen="col-span-12 md:col-span-7 xl:col-span-8"
                  heightClosed="h-[250px]"
                  heightOpen="min-h-[400px] max-h-[560px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-[var(--color-primary)]" />
                        <h2 className="text-[14px] font-semibold nl-text">Movimentos</h2>
                        <span className="badge badge-info tabular-nums">{finance.count}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium nl-text-muted">Dias e pagamentos do mês</p>
                    </div>
                  )}
                  preview={(
                    <div className="space-y-1">
                      {finance.dailySeries
                        .filter((d) => d.count > 0)
                        .slice()
                        .reverse()
                        .slice(0, 5)
                        .map((d) => (
                          <div key={d.key} className="flex items-center justify-between rounded-[var(--radius-compact)] px-1.5 py-1.5 hover:bg-[var(--color-secondary-light)]">
                            <span className="text-[12px] font-medium nl-text">{formatDayLabel(d.key)}</span>
                            <span className="text-[12px] font-semibold tabular-nums text-[var(--color-success)]">{formatCve(d.value)}</span>
                          </div>
                        ))}
                      {finance.dailySeries.filter((d) => d.count > 0).length === 0 && (
                        <p className="py-6 text-center text-[12px] nl-text-muted">Sem movimentos neste mês.</p>
                      )}
                    </div>
                  )}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--bg-surface)]/60">
                      <div className="border-b border-[var(--border-light)] px-3 py-2">
                        <p className="text-[12px] font-semibold nl-text">Dias com entradas</p>
                      </div>
                      <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                        {finance.dailySeries.filter((d) => d.count > 0).length === 0 ? (
                          <p className="px-4 py-8 text-center text-[13px] nl-text-muted">Sem pagamentos neste mês.</p>
                        ) : (
                          finance.dailySeries
                            .filter((d) => d.count > 0)
                            .slice()
                            .reverse()
                            .map((d) => (
                              <button
                                key={d.key}
                                type="button"
                                onClick={() => setSelectedDay(d.key === selectedDay ? null : d.key)}
                                className={`flex w-full items-center justify-between border-b border-[var(--border-light)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-secondary-light)] ${
                                  selectedDay === d.key ? 'bg-[var(--color-primary-light)]' : ''
                                }`}
                              >
                                <div>
                                  <p className="text-[13px] font-semibold nl-text">{formatDayLabel(d.key)}</p>
                                  <p className="text-[11px] nl-text-muted">{d.count} pagamento(s)</p>
                                </div>
                                <p className="text-[13px] font-semibold tabular-nums text-[var(--color-success)]">{formatCve(d.value)}</p>
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--bg-surface)]/60">
                      <div className="border-b border-[var(--border-light)] px-3 py-2">
                        <p className="text-[12px] font-semibold nl-text">
                          {dayDetail ? formatDayLabel(dayDetail.key) : 'Pagamentos do período'}
                        </p>
                        <p className="text-[11px] nl-text-muted">
                          {dayDetail
                            ? `${dayDetail.count} registo(s)`
                            : filtroMetodo === 'todos'
                              ? `${finance.pagamentosFiltrados.length} no mês`
                              : `${finance.pagamentosFiltrados.length} · ${filtroMetodo}`}
                        </p>
                      </div>
                      <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                        {(dayDetail ? dayDetail.items : finance.pagamentosFiltrados).length === 0 ? (
                          <p className="px-4 py-8 text-center text-[13px] nl-text-muted">Sem registos.</p>
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
                                  className="flex items-center gap-3 border-b border-[var(--border-light)] px-3 py-2"
                                >
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: meta.soft, color: meta.color }}>
                                    {meta.icon}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-semibold nl-text">
                                      {(p as any).nome || p.alunoId || p.aluno_id || 'Aluno'}
                                    </p>
                                    <p className="text-[11px] nl-text-muted">
                                      {p.data_pagamento} · {method}
                                    </p>
                                  </div>
                                  <p className="text-[13px] font-semibold tabular-nums text-[var(--color-success)]">{formatCve(p.valor)}</p>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                </BentoPanel>

                {/* Inactivos — violeta/teal, expande em altura */}
                <BentoPanel
                  isOpen={openPanels.inactivos}
                  onToggle={() => togglePanel('inactivos')}
                  tone="violet"
                  expandMode="height"
                  spanClosed="col-span-12 md:col-span-5"
                  spanOpen="col-span-12 md:col-span-5 xl:col-span-4"
                  heightClosed="h-[250px]"
                  heightOpen="min-h-[400px] max-h-[560px]"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <UserX size={14} className="text-[#6d28d9]" />
                        <h2 className="text-[14px] font-semibold nl-text">Fora da contabilidade</h2>
                        <span className="badge badge-quit tabular-nums">{finance.inactivos.length}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium text-[#6d28d9]">Pausa · férias · desistentes</p>
                    </div>
                  )}
                  preview={(
                    <div className="grid grid-cols-2 gap-1.5 content-start">
                      {[
                        { label: 'Pausa', count: finance.emPausa.length, tone: getManualStatusTone('pausado'), icon: <Pause size={12} /> },
                        { label: 'Férias', count: finance.ferias.length, tone: getManualStatusTone('ferias'), icon: <Palmtree size={12} /> },
                        { label: 'Desist.', count: finance.desistentes.length, tone: getManualStatusTone('desistente'), icon: <UserX size={12} /> },
                        { label: 'Bloq.', count: finance.bloqueados.length, tone: getManualStatusTone('bloqueado'), icon: <ShieldCheck size={12} /> },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[var(--radius-control)] border px-2 py-2"
                          style={{ borderColor: item.tone.border, background: item.tone.bg }}
                        >
                          <div className="flex items-center gap-1" style={{ color: item.tone.fg }}>
                            {item.icon}
                            <span className="text-[10px] font-semibold">{item.label}</span>
                          </div>
                          <p className="mt-0.5 text-[18px] font-semibold tabular-nums nl-text">{item.count}</p>
                        </div>
                      ))}
                    </div>
                  )}
                >
                  <div className="mb-2 grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Em pausa', count: finance.emPausa.length, icon: <Pause size={14} />, tone: getManualStatusTone('pausado') },
                      { label: 'Férias', count: finance.ferias.length, icon: <Palmtree size={14} />, tone: getManualStatusTone('ferias') },
                      { label: 'Desistentes', count: finance.desistentes.length, icon: <UserX size={14} />, tone: getManualStatusTone('desistente') },
                      { label: 'Bloqueados', count: finance.bloqueados.length, icon: <ShieldCheck size={14} />, tone: getManualStatusTone('bloqueado') },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 rounded-[var(--radius-control)] border px-2.5 py-2"
                        style={{ borderColor: item.tone.border, background: item.tone.bg }}
                      >
                        <span style={{ color: item.tone.fg }}>{item.icon}</span>
                        <div>
                          <p className="text-[10px] font-medium" style={{ color: item.tone.fg }}>{item.label}</p>
                          <p className="text-[15px] font-semibold tabular-nums nl-text">{item.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {finance.inactivos.length === 0 ? (
                    <p className="py-4 text-center text-[12px] nl-text-muted">Nenhum aluno fora da contabilidade.</p>
                  ) : (
                    <div className="space-y-0.5">
                      {finance.inactivos.map(({ aluno }) => {
                        const tone = getManualStatusTone(aluno.status);
                        return (
                          <div
                            key={aluno.id}
                            className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] px-2 py-1.5 hover:bg-[var(--bg-surface)]/80"
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
                  { label: 'Notas', value: String(activity.notesMes.length), accent: 'text-[var(--color-warning)]', icon: <StickyNote size={15} /> },
                  { label: 'Logs', value: String(activity.logsMes.length), accent: 'text-[var(--color-primary)]', icon: <BookUser size={15} /> },
                  { label: 'Utilizadores', value: String(activity.usersList.length), accent: 'text-[var(--color-success)]', icon: <Users size={15} /> },
                ].map((kpi) => (
                  <div key={kpi.label} className="nl-card !p-3 transition-all hover:-translate-y-0.5">
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
                                {isPay ? <Wallet size={13} /> : isNote ? <StickyNote size={13} /> : <Activity size={13} />}
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
