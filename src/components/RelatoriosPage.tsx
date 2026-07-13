import { memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BookUser,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Landmark,
  LogIn,
  Maximize2,
  Minimize2,
  Palmtree,
  Pause,
  Percent,
  Phone,
  Lock,
  ShieldCheck,
  StickyNote,
  TrendingUp,
  UserX,
  Users,
  Wallet,
  BarChart3,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  formatCve,
  getStudentStatusForMonth,
  isPaymentInsideMonth,
  normalizeAmount,
  parseFlexibleDate,
} from '../lib/billing';
import { MONTH_OPTIONS, PAYMENT_METHOD_OPTIONS, STUDENT_STATUS_HELPERS, getStudentStatusLabel, getManualStatusTone } from '../constants';
import { isFutureMonth, getAlunoIniciais, getAvatarColorByName } from '../utils/formatting';
import type { Payment, Student } from '../types';
import TimeRuler from './TimeRuler';

// ── Bento primitives ──────────────────────────────────────────────────────

type BentoTone = 'default' | 'green' | 'red' | 'blue' | 'orange' | 'teal' | 'violet';
/** Tamanhos tipo mosaico: encaixam na grelha 12 */
type BentoSize = '1x1' | '2x1' | '1x2' | '2x2' | '3x1';

const BENTO_SIZE: Record<
  BentoSize,
  { closed: string; open: string; hClosed: string; hOpen: string }
> = {
  '1x1': {
    closed: 'col-span-12 sm:col-span-6 xl:col-span-3',
    open: 'col-span-12 sm:col-span-6 xl:col-span-6',
    hClosed: 'h-[200px]',
    hOpen: 'min-h-[340px] max-h-[480px]',
  },
  '2x1': {
    closed: 'col-span-12 sm:col-span-6 xl:col-span-6',
    open: 'col-span-12',
    hClosed: 'h-[200px]',
    hOpen: 'min-h-[360px] max-h-[520px]',
  },
  '1x2': {
    closed: 'col-span-12 sm:col-span-6 xl:col-span-3 xl:row-span-2',
    open: 'col-span-12 sm:col-span-6 xl:col-span-6 xl:row-span-2',
    hClosed: 'min-h-[200px] xl:h-full xl:min-h-[416px]',
    hOpen: 'min-h-[420px] max-h-[640px] xl:h-full',
  },
  '2x2': {
    closed: 'col-span-12 sm:col-span-6 xl:col-span-6 xl:row-span-2',
    open: 'col-span-12 xl:row-span-2',
    hClosed: 'min-h-[200px] xl:h-full xl:min-h-[416px]',
    hOpen: 'min-h-[480px] max-h-[720px]',
  },
  '3x1': {
    closed: 'col-span-12 xl:col-span-9',
    open: 'col-span-12',
    hClosed: 'h-[220px]',
    hOpen: 'min-h-[380px] max-h-[560px]',
  },
};

const TONE_CLS: Record<BentoTone, string> = {
  default: 'border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]',
  green: 'border-[color-mix(in_srgb,var(--color-success)_38%,var(--border))] bg-[color-mix(in_srgb,var(--color-success)_8%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
  red: 'border-[color-mix(in_srgb,var(--color-error)_38%,var(--border))] bg-[color-mix(in_srgb,var(--color-error)_8%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
  blue: 'border-[color-mix(in_srgb,var(--color-primary)_38%,var(--border))] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
  orange: 'border-[color-mix(in_srgb,#e66100_40%,var(--border))] bg-[color-mix(in_srgb,#e66100_8%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
  teal: 'border-[color-mix(in_srgb,#0f766e_40%,var(--border))] bg-[color-mix(in_srgb,#14b8a6_9%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
  violet: 'border-[color-mix(in_srgb,#6d28d9_38%,var(--border))] bg-[color-mix(in_srgb,#8b5cf6_9%,var(--bg-surface))] shadow-[var(--shadow-sm)]',
};

/**
 * Card bento (mesmo espírito da Início):
 * - tamanhos 1×1 · 2×1 · 1×2 · 2×2 · 3×1
 * - expandir mostra mais recursos (preview vs children)
 * - footer para atalhos (ex.: abrir Gestão)
 */
function BentoPanel({
  isOpen,
  onToggle,
  header,
  preview,
  children,
  footer,
  tone = 'default',
  size = '1x1',
  expandMode = 'height',
  className = '',
}: {
  isOpen: boolean;
  onToggle: () => void;
  header: ReactNode;
  preview?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tone?: BentoTone;
  size?: BentoSize;
  expandMode?: 'width' | 'height' | 'both';
  className?: string;
}) {
  const preset = BENTO_SIZE[size];
  const openSpan =
    expandMode === 'width' || expandMode === 'both'
      ? size === '1x1'
        ? 'col-span-12 sm:col-span-6 xl:col-span-6'
        : preset.open
      : preset.closed.includes('row-span')
        ? preset.open
        : preset.closed;
  const sizeCls = isOpen
    ? `${preset.hOpen} shadow-[var(--shadow-md)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]`
    : `${preset.hClosed}`;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[var(--radius-lg)] border transition-all duration-300 ease-out ${TONE_CLS[tone]} ${sizeCls} ${
        isOpen ? openSpan : preset.closed
      } ${className}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--border-light)] px-3.5 py-2.5">
        <div className="min-w-0 flex-1">{header}</div>
        <button
          type="button"
          onClick={onToggle}
          className="nl-icon-btn nl-icon-btn-sm shrink-0"
          title={isOpen ? 'Recolher' : 'Expandir — ver mais'}
        >
          {isOpen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-3 py-2.5">
        {isOpen ? children : (preview ?? children)}
      </div>
      {footer ? (
        <div className="shrink-0 border-t border-[var(--border-light)] px-2.5 py-2">{footer}</div>
      ) : null}
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

const METHOD_META: Record<string, { icon: ReactNode; color: string; soft: string }> = {
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

function MiniBar({ data, height = 110, onBarClick }: {
  data: { label: string; value: number; color?: string; key?: string }[];
  height?: number;
  onBarClick?: (item: { label: string; value: number; key?: string }) => void;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((item, i) => {
        const bar = (
          <div key={item.key || i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <span className="mb-0.5 text-[9px] font-semibold tabular-nums nl-text-muted">
              {item.value > 0 ? (item.value >= 1000 ? `${Math.round(item.value / 1000)}k` : item.value) : ''}
            </span>
            <div
              className={`w-full max-w-[28px] rounded-t-[4px] transition-all ${onBarClick ? 'cursor-pointer hover:opacity-80' : ''}`}
              style={{
                height: `${Math.max(4, (item.value / max) * 100)}%`,
                background: item.color || 'var(--color-primary)',
                opacity: item.value > 0 ? 1 : 0.25,
              }}
              title={`${item.label}: ${formatCve(item.value)}`}
              onClick={onBarClick ? () => onBarClick(item) : undefined}
              onKeyDown={onBarClick ? (e) => { if (e.key === 'Enter') onBarClick(item); } : undefined}
              role={onBarClick ? 'button' : undefined}
              tabIndex={onBarClick ? 0 : undefined}
            />
            <span className="mt-1 w-full truncate text-center text-[9px] font-medium nl-text-muted">{item.label}</span>
          </div>
        );
        return bar;
      })}
    </div>
  );
}

function Sparkline({ values, color = 'var(--color-primary)', height = 36 }: { values: number[]; color?: string; height?: number }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const w = 120;
  const pts = values.map((v, i) => {
    const x = values.length <= 1 ? w / 2 : (i / (values.length - 1)) * w;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={height} className="overflow-visible" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {values.length > 0 && (
        <circle
          cx={values.length <= 1 ? w / 2 : w}
          cy={height - 4 - ((values[values.length - 1] - min) / range) * (height - 8)}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
}

function Donut({ segments, size = 132, centerLabel = 'Total', centerValue }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
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
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        <span className="text-[10px] font-medium nl-text-muted">{centerLabel}</span>
        <span className="text-[12px] font-semibold tabular-nums leading-tight nl-text">
          {centerValue ?? formatCve(total)}
        </span>
      </div>
    </div>
  );
}

function HeatDay({
  intensity,
  label,
  active,
  onClick,
}: {
  intensity: number;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const bg =
    intensity <= 0
      ? 'var(--border-light)'
      : intensity < 0.33
        ? 'color-mix(in srgb, var(--color-success) 28%, var(--bg-surface))'
        : intensity < 0.66
          ? 'color-mix(in srgb, var(--color-success) 55%, var(--bg-surface))'
          : 'var(--color-success)';
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`h-4 w-4 rounded-[3px] transition-transform hover:scale-110 ${active ? 'ring-2 ring-[var(--color-primary)] ring-offset-1' : ''}`}
      style={{ background: bg }}
    />
  );
}

// ── types ─────────────────────────────────────────────────────────────────

export interface RelatoriosPageProps {
  mesRelatorio: string;
  setMesRelatorio: React.Dispatch<React.SetStateAction<string>>;
  anoRelatorio: number;
  setAnoRelatorio: React.Dispatch<React.SetStateAction<number>>;
  /** @deprecated mantido por compatibilidade com App — não usado no layout actual */
  timelineFinanceiraMinimizada?: boolean;
  setTimelineFinanceiraMinimizada?: React.Dispatch<React.SetStateAction<boolean>>;
  alunos: Student[];
  pagamentos: Payment[];
  hojeReferencia: Date;
  larguraListas: number;
  appLogo: string;
  nomeAcademia: string;
  sessionUser: { role?: string; name?: string } | null;
  periodoBloqueado?: boolean;
  onPermitirEdicaoMes?: () => void;
  /** Navegar para Gestão com filtro (liga aos KPIs da Início) */
  onNavigateGestao?: (filtro?: 'todos' | 'divida' | 'cobertos' | 'importados') => void;
  onOpenStudent?: (aluno: Student) => void;
  onCobrarAluno?: (alunoId: string) => void;
}

type MainTab = 'financeiro' | 'atividade';
type PanelKey =
  | 'hero'
  | 'prioridade'
  | 'metodos'
  | 'mix'
  | 'stats'
  | 'evolucao'
  | 'movimentos'
  | 'inactivos'
  | 'equipa'
  | 'timeline';

// ── page ──────────────────────────────────────────────────────────────────

const RelatoriosPage = memo(function RelatoriosPage({
  mesRelatorio,
  setMesRelatorio,
  anoRelatorio,
  setAnoRelatorio,
  alunos,
  pagamentos,
  hojeReferencia,
  larguraListas,
  nomeAcademia,
  sessionUser,
  periodoBloqueado = false,
  onPermitirEdicaoMes,
  onNavigateGestao,
  onOpenStudent,
  onCobrarAluno,
}: RelatoriosPageProps) {
  const isAdmin = sessionUser?.role === 'admin' || sessionUser?.role === 'root';
  const mesIdx = MONTH_OPTIONS.indexOf(mesRelatorio);
  const [mainTab, setMainTab] = useState<MainTab>('financeiro');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [filtroMetodo, setFiltroMetodo] = useState<string>('todos');
  const [filtroUser, setFiltroUser] = useState<string>('todos');
  const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>({
    hero: false,
    prioridade: false,
    metodos: false,
    mix: false,
    stats: false,
    evolucao: false,
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

  const togglePanel = (id: PanelKey) => {
    setOpenPanels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    let first = true;
    const load = async () => {
      if (first) setAdminLoading(true);
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
        if (mounted && first) {
          setAdminLoading(false);
          first = false;
        }
      }
    };
    load();
    const t = setInterval(load, 120_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [isAdmin, mesRelatorio, anoRelatorio]);

  // ── Financeiro do período ──────────────────────────────────────────────
  const finance = useMemo(() => {
    const pagamentosMes = pagamentos.filter((p) => isPaymentInsideMonth(p, mesRelatorio, anoRelatorio));
    const receitaMes = pagamentosMes.reduce((s, p) => s + normalizeAmount(p.valor), 0);

    // Mês anterior (MoM)
    const prevDate = new Date(anoRelatorio, mesIdx - 1, 1);
    const prevMes = MONTH_OPTIONS[prevDate.getMonth()];
    const prevAno = prevDate.getFullYear();
    const receitaPrev = pagamentos
      .filter((p) => isPaymentInsideMonth(p, prevMes, prevAno))
      .reduce((s, p) => s + normalizeAmount(p.valor), 0);
    const momDelta = receitaPrev > 0 ? ((receitaMes - receitaPrev) / receitaPrev) * 100 : receitaMes > 0 ? 100 : 0;

    const byMethodMap = new Map<string, { count: number; total: number }>();
    for (const p of pagamentosMes) {
      const key = normalizeMethod(p.metodo_pagamento);
      const cur = byMethodMap.get(key) || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += normalizeAmount(p.valor);
      byMethodMap.set(key, cur);
    }
    for (const m of PAYMENT_METHOD_OPTIONS.map((x) => x.label)) {
      if (!byMethodMap.has(m)) byMethodMap.set(m, { count: 0, total: 0 });
    }
    const byMethod = Array.from(byMethodMap.entries())
      .map(([method, v]) => ({ method, ...v, meta: METHOD_META[method] || METHOD_META.Outro }))
      .sort((a, b) => b.total - a.total);

    const cashTotal = byMethod.find((m) => m.method === 'Dinheiro')?.total || 0;
    const digitalTotal = receitaMes - cashTotal;

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
    const maxDayTotal = Math.max(...dailySeries.map((d) => d.value), 1);
    const bestDay = dailySeries.reduce((best, d) => (d.value > best.value ? d : best), dailySeries[0] || { key: '', value: 0, count: 0, label: '—' });
    const daysWithMovement = dailySeries.filter((d) => d.count > 0).length;

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
    const atrasados = operacionais
      .filter((r) => r.resumo.status === 'atrasado' || r.resumo.status === 'hoje')
      .sort((a, b) => normalizeAmount(b.aluno.plano) - normalizeAmount(a.aluno.plano));
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
    const coberturaPct = operacionais.length > 0 ? Math.round((pagos.length / operacionais.length) * 100) : 0;
    const realizacaoPct = previsao > 0 ? Math.round((receitaMes / previsao) * 100) : 0;

    const pagamentosFiltrados =
      filtroMetodo === 'todos'
        ? pagamentosMes
        : pagamentosMes.filter((p) => normalizeMethod(p.metodo_pagamento) === filtroMetodo);

    // Top alunos por valor pago no mês
    const byStudent = new Map<string, { nome: string; total: number; count: number; aluno?: Student }>();
    for (const p of pagamentosMes) {
      const id = String(p.alunoId || p.aluno_id || '');
      const nome = String((p as any).nome || id || 'Aluno');
      const cur = byStudent.get(id) || { nome, total: 0, count: 0 };
      cur.total += normalizeAmount(p.valor);
      cur.count += 1;
      if (!cur.aluno) cur.aluno = alunos.find((a) => String(a.id) === id);
      byStudent.set(id || nome, cur);
    }
    const topPagadores = Array.from(byStudent.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    return {
      pagamentosMes,
      pagamentosFiltrados,
      receitaMes,
      receitaPrev,
      momDelta,
      prevMes,
      prevAno,
      byMethod,
      cashTotal,
      digitalTotal,
      dailySeries,
      maxDayTotal,
      bestDay,
      daysWithMovement,
      receita6,
      atrasados,
      pagos,
      previsao,
      dividaValor,
      pendente: Math.max(0, previsao - receitaMes),
      media: pagamentosMes.length ? Math.round(receitaMes / pagamentosMes.length) : 0,
      count: pagamentosMes.length,
      operacionaisCount: operacionais.length,
      coberturaPct,
      realizacaoPct,
      inactivos,
      desistentes,
      emPausa,
      ferias,
      bloqueados,
      topPagadores,
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

  const momUp = finance.momDelta >= 0;
  const prioridadeTone: BentoTone = finance.atrasados.length > 0 ? 'red' : 'green';

  // KPIs alinhados com a Home (mesmos conceitos, período do relatório)
  const kpis = [
    {
      label: 'Alunos activos',
      value: String(finance.operacionaisCount),
      sub: `${alunos.length} no sistema`,
      icon: <Users size={16} />,
      accent: 'text-[var(--color-primary)]',
      action: () => onNavigateGestao?.('todos'),
    },
    {
      label: 'Em dia',
      value: `${finance.coberturaPct}%`,
      sub: `${finance.pagos.length}/${finance.operacionaisCount || 0} cobertos`,
      icon: <CheckCircle2 size={16} />,
      accent: 'text-[var(--color-success)]',
      action: () => onNavigateGestao?.('cobertos'),
    },
    {
      label: 'Recebido',
      value: formatCve(finance.receitaMes),
      sub: `${finance.count} pag. · ${mesRelatorio}`,
      icon: <Wallet size={16} />,
      accent: 'text-[var(--color-primary)]',
      action: () => {
        setMainTab('financeiro');
        setOpenPanels((p) => ({ ...p, hero: true, movimentos: true }));
      },
    },
    {
      label: 'A recuperar',
      value: formatCve(finance.dividaValor),
      sub: `${finance.atrasados.length} pendência(s)`,
      icon: <AlertCircle size={16} />,
      accent: finance.atrasados.length > 0 ? 'text-[var(--color-error)]' : 'text-[var(--text-secondary)]',
      action: () => {
        if (onNavigateGestao) onNavigateGestao('divida');
        else {
          setOpenPanels((p) => ({ ...p, prioridade: true }));
        }
      },
    },
  ];

  return (
    <div className="nl-reports-page flex h-full w-full flex-col overflow-hidden animate-fade-in">
      {/* Barra de ferramentas */}
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
          </div>
        </div>
      </div>

      {periodoBloqueado && (
        <div className="shrink-0 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--bg-surface))] px-4 py-2">
          <div className="mx-auto flex flex-wrap items-center gap-2 text-[12px] font-medium" style={{ maxWidth: larguraListas }}>
            <Lock size={14} className="text-[var(--color-warning)]" />
            <span className="nl-text">
              Mês fechado em <strong className="capitalize">{mesRelatorio} {anoRelatorio}</strong> — dados em leitura.
              Pode exportar o relatório; a edição está bloqueada por segurança.
            </span>
            {onPermitirEdicaoMes && (
              <button
                type="button"
                onClick={onPermitirEdicaoMes}
                className="ml-auto nl-btn nl-btn-secondary nl-btn-sm !h-7 !text-[11px]"
              >
                Permitir edição (admin)
              </button>
            )}
          </div>
        </div>
      )}

      {isMonthEndWindow && !periodoBloqueado && (
        <div className="shrink-0 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--bg-surface))] px-4 py-2">
          <div className="mx-auto flex flex-wrap items-center gap-2 text-[12px] font-medium" style={{ maxWidth: larguraListas }}>
            <CalendarDays size={14} className="text-[var(--color-warning)]" />
            <span className="nl-text">
              Janela de fecho mensal — o relatório de <strong className="capitalize">{mesRelatorio}</strong> está quase pronto.
              Use <strong className="text-[#c64600]">Exportar</strong> na barra superior.
            </span>
          </div>
        </div>
      )}

      <div className="nl-reports-scroll min-h-0 flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
        <div className="mx-auto flex flex-col gap-3.5" style={{ maxWidth: larguraListas }}>
          {mainTab === 'financeiro' ? (
            <>
              {/* Título + contexto */}
              <section className="px-0.5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] nl-text-muted">
                      Relatório · {nomeAcademia || 'Academia'}
                    </p>
                    <h1 className="mt-0.5 text-[22px] font-semibold leading-tight nl-text capitalize">
                      {mesRelatorio}{' '}
                      <span className="font-medium tabular-nums nl-text-sub">{anoRelatorio}</span>
                    </h1>
                  </div>
                  <p className="text-[12px] font-medium nl-text-muted">
                    {finance.count} pagamento{finance.count === 1 ? '' : 's'}
                    {finance.inactivos.length > 0 ? ` · ${finance.inactivos.length} fora da conta` : ''}
                    {' · '}
                    <span className={momUp ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}>
                      {momUp ? '+' : ''}{finance.momDelta.toFixed(0)}% vs {finance.prevMes.slice(0, 3)}
                    </span>
                  </p>
                </div>
              </section>

              {/* KPIs — mesmo padrão da Início, ligados à Gestão */}
              <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="nl-card nl-reports-kpi text-left !p-3.5 transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)] focus-visible:outline-none"
                    title="Clique para abrir detalhes ou Gestão"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={item.accent}>{item.icon}</span>
                      <p className="text-[11px] font-medium nl-text-muted">{item.label}</p>
                    </div>
                    <p className={`mt-1.5 truncate text-[20px] font-semibold leading-tight tabular-nums ${item.accent}`}>
                      {item.value}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-medium nl-text-muted">{item.sub}</p>
                  </button>
                ))}
              </section>

              {/* Grelha bento assimétrica */}
              <section
                className="grid grid-cols-12 items-stretch gap-2.5"
                style={{ gridAutoRows: 'minmax(0, auto)' }}
              >
                {/* ── HERO 2×1 — Visão financeira ── */}
                <BentoPanel
                  isOpen={openPanels.hero}
                  onToggle={() => togglePanel('hero')}
                  tone="teal"
                  size="2x1"
                  expandMode="both"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <BarChart3 size={14} className="text-[#0f766e]" />
                        <h2 className="text-[13px] font-semibold nl-text">Visão financeira</h2>
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                          momUp
                            ? 'bg-[color-mix(in_srgb,var(--color-success)_16%,transparent)] text-[var(--color-success)]'
                            : 'bg-[color-mix(in_srgb,var(--color-error)_16%,transparent)] text-[var(--color-error)]'
                        }`}
                        >
                          {momUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                          {Math.abs(finance.momDelta).toFixed(0)}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium nl-text-muted">
                        Receita do mês · vs {finance.prevMes} {finance.prevAno}
                      </p>
                    </div>
                  )}
                  preview={(
                    <div className="flex h-full flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide nl-text-muted">Recebido</p>
                          <p className="mt-0.5 text-[26px] font-semibold tabular-nums leading-none text-[var(--color-success)]">
                            {formatCve(finance.receitaMes)}
                          </p>
                          <p className="mt-1 text-[11px] nl-text-muted">
                            Previsto {formatCve(finance.previsao)} · {finance.realizacaoPct}% realizado
                          </p>
                        </div>
                        <Sparkline values={finance.receita6.map((r) => r.value)} color="#0f766e" height={40} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 border-t border-[var(--border-light)] pt-2">
                        <div>
                          <p className="text-[9px] nl-text-muted">Por cobrar</p>
                          <p className="text-[13px] font-semibold tabular-nums" style={{ color: finance.pendente > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                            {formatCve(finance.pendente)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] nl-text-muted">Ticket médio</p>
                          <p className="text-[13px] font-semibold tabular-nums nl-text">{formatCve(finance.media)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] nl-text-muted">Melhor dia</p>
                          <p className="text-[13px] font-semibold tabular-nums nl-text">
                            {finance.bestDay?.value ? formatCve(finance.bestDay.value) : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  footer={(
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="nl-btn nl-btn-ghost nl-btn-sm flex-1 !justify-between"
                        onClick={() => setOpenPanels((p) => ({ ...p, movimentos: true }))}
                      >
                        Ver movimentos
                        <ChevronRight size={13} />
                      </button>
                      {onNavigateGestao && (
                        <button type="button" className="nl-btn nl-btn-secondary nl-btn-sm" onClick={() => onNavigateGestao('todos')}>
                          Alunos
                        </button>
                      )}
                    </div>
                  )}
                >
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[8px] border border-[var(--border-light)] bg-[var(--bg-surface)]/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide nl-text-muted">Receita actual</p>
                        <p className="mt-1 text-[28px] font-semibold tabular-nums text-[var(--color-success)]">{formatCve(finance.receitaMes)}</p>
                        <p className="mt-1 text-[12px] nl-text-sub">
                          Mês anterior: <strong className="tabular-nums nl-text">{formatCve(finance.receitaPrev)}</strong>
                          {' '}({finance.prevMes.slice(0, 3)} {finance.prevAno})
                        </p>
                      </div>
                      <div className="rounded-[8px] border border-[var(--border-light)] p-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide nl-text-muted">Realização da previsão</p>
                        <div className="mb-1 flex justify-between text-[11px]">
                          <span className="nl-text-muted">Cobrado / esperado</span>
                          <span className="font-semibold tabular-nums nl-text">{finance.realizacaoPct}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[var(--border-light)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                            style={{ width: `${Math.min(100, finance.realizacaoPct)}%` }}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <p className="nl-text-muted">Esperado</p>
                            <p className="font-semibold tabular-nums nl-text">{formatCve(finance.previsao)}</p>
                          </div>
                          <div>
                            <p className="nl-text-muted">Pendente</p>
                            <p className="font-semibold tabular-nums text-[var(--color-warning)]">{formatCve(finance.pendente)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] font-medium nl-text-muted">Tendência 6 meses</p>
                      <MiniBar
                        height={100}
                        data={finance.receita6.map((r) => ({
                          label: r.label,
                          value: r.value,
                          color: r.mes === mesRelatorio && r.ano === anoRelatorio ? 'var(--color-primary)' : r.color,
                          key: `${r.mes}-${r.ano}`,
                        }))}
                        onBarClick={(item) => {
                          const found = finance.receita6.find((r) => r.label === item.label);
                          if (found) {
                            setMesRelatorio(found.mes);
                            setAnoRelatorio(found.ano);
                            setSelectedDay(null);
                          }
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: 'Pagamentos', value: String(finance.count), icon: <Wallet size={13} /> },
                        { label: 'Ticket médio', value: formatCve(finance.media), icon: <Target size={13} /> },
                        { label: 'Dias com mov.', value: String(finance.daysWithMovement), icon: <CalendarDays size={13} /> },
                        {
                          label: 'Melhor dia',
                          value: finance.bestDay?.key ? formatDayLabel(finance.bestDay.key) : '—',
                          icon: <Sparkles size={13} />,
                        },
                      ].map((s) => (
                        <div key={s.label} className="rounded-[6px] border border-[var(--border-light)] px-2.5 py-2">
                          <div className="flex items-center gap-1 nl-text-muted">{s.icon}<span className="text-[9px] font-medium">{s.label}</span></div>
                          <p className="mt-1 text-[13px] font-semibold tabular-nums nl-text">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </BentoPanel>

                {/* ── PRIORIDADE 1×2 — liga à Home ── */}
                <BentoPanel
                  isOpen={openPanels.prioridade}
                  onToggle={() => togglePanel('prioridade')}
                  tone={prioridadeTone}
                  size="1x2"
                  expandMode="both"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {finance.atrasados.length > 0
                          ? <AlertCircle size={14} className="text-[var(--color-error)]" />
                          : <CheckCircle2 size={14} className="text-[var(--color-success)]" />}
                        <h2 className="text-[13px] font-semibold nl-text">Prioridades</h2>
                        {finance.atrasados.length > 0 && (
                          <span className="badge badge-error tabular-nums !text-[9px]">{finance.atrasados.length}</span>
                        )}
                      </div>
                      <p className={`mt-0.5 truncate text-[10px] font-medium ${
                        finance.atrasados.length > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-success)]'
                      }`}
                      >
                        {finance.atrasados.length > 0
                          ? `${formatCve(finance.dividaValor)} a recuperar`
                          : 'Operação em dia'}
                      </p>
                    </div>
                  )}
                  preview={(
                    finance.atrasados.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-1 px-2 py-4 text-center">
                        <CheckCircle2 size={22} className="text-[var(--color-success)] opacity-80" />
                        <p className="text-[12px] font-semibold nl-text">Sem cobranças críticas</p>
                        <p className="text-[10px] nl-text-muted">{finance.pagos.length} alunos em dia</p>
                      </div>
                    ) : (
                      <ul className="space-y-0.5">
                        {finance.atrasados.slice(0, 6).map(({ aluno, resumo }) => (
                          <li key={aluno.id}>
                            <div className="flex items-center gap-1.5 rounded-[6px] px-1 py-1 hover:bg-[var(--color-secondary-light)]">
                              <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                onClick={() => onOpenStudent?.(aluno)}
                              >
                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[9px] font-semibold text-white ${getAvatarColorByName(aluno.nome)}`}>
                                  {aluno.foto_path
                                    ? <img src={`local-resource://${aluno.foto_path}`} className="h-full w-full object-cover" alt="" />
                                    : getAlunoIniciais(aluno)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[11px] font-semibold nl-text">{aluno.nome}</p>
                                  <p className="truncate text-[9px] nl-text-muted">{resumo.statusLabel || resumo.status}</p>
                                </div>
                              </button>
                              <span className="text-[11px] font-semibold tabular-nums text-[var(--color-error)]">
                                {formatCve(aluno.plano)}
                              </span>
                            </div>
                          </li>
                        ))}
                        {finance.atrasados.length > 6 && (
                          <p className="pt-1 text-center text-[10px] nl-text-muted">+{finance.atrasados.length - 6} · expandir</p>
                        )}
                      </ul>
                    )
                  )}
                  footer={(
                    <button
                      type="button"
                      className="nl-btn nl-btn-ghost nl-btn-sm w-full !justify-between"
                      onClick={() => onNavigateGestao?.('divida') || togglePanel('prioridade')}
                    >
                      {finance.atrasados.length > 0 ? 'Ver cobranças' : 'Ver alunos'}
                      <ChevronRight size={13} />
                    </button>
                  )}
                >
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-[6px] border border-[var(--border-light)] px-2 py-1.5 text-center">
                        <p className="text-[9px] nl-text-muted">Em dia</p>
                        <p className="text-[18px] font-semibold text-[var(--color-success)]">{finance.pagos.length}</p>
                      </div>
                      <div className="rounded-[6px] border border-[var(--border-light)] px-2 py-1.5 text-center">
                        <p className="text-[9px] nl-text-muted">Atraso</p>
                        <p className="text-[18px] font-semibold text-[var(--color-error)]">{finance.atrasados.length}</p>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border-light)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-success)]"
                        style={{ width: `${finance.coberturaPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] nl-text-muted">{finance.coberturaPct}% de cobertura · dívida {formatCve(finance.dividaValor)}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide nl-text-muted">Lista a cobrar</p>
                    <div className="max-h-[340px] space-y-0.5 overflow-y-auto custom-scrollbar">
                      {finance.atrasados.length === 0 ? (
                        <p className="py-4 text-center text-[11px] nl-text-muted">Ninguém em atraso.</p>
                      ) : (
                        finance.atrasados.map(({ aluno, resumo }) => (
                          <div
                            key={aluno.id}
                            className="group flex items-center gap-1.5 rounded-[6px] px-1.5 py-1.5 hover:bg-[var(--color-secondary-light)]"
                            style={{ boxShadow: 'inset 3px 0 0 var(--color-error)' }}
                          >
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              onClick={() => onOpenStudent?.(aluno)}
                            >
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold text-white ${getAvatarColorByName(aluno.nome)}`}>
                                {aluno.foto_path
                                  ? <img src={`local-resource://${aluno.foto_path}`} className="h-full w-full object-cover" alt="" />
                                  : getAlunoIniciais(aluno)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[12px] font-semibold nl-text">{aluno.nome}</p>
                                <p className="text-[10px] nl-text-muted">{resumo.statusLabel || resumo.status}</p>
                              </div>
                            </button>
                            <p className="text-[12px] font-semibold tabular-nums text-[var(--color-error)]">{formatCve(aluno.plano)}</p>
                            {onCobrarAluno && (
                              <button type="button" className="nl-icon-btn nl-icon-btn-sm opacity-70 group-hover:opacity-100" title="Registar pagamento" onClick={() => onCobrarAluno(String(aluno.id))}>
                                <Wallet size={13} className="text-[var(--color-success)]" />
                              </button>
                            )}
                            {aluno.telefone && (
                              <button
                                type="button"
                                className="nl-icon-btn nl-icon-btn-sm opacity-70 group-hover:opacity-100"
                                title="WhatsApp"
                                onClick={() => {
                                  const tel = String(aluno.telefone).replace(/\D/g, '');
                                  window.open(`https://wa.me/${tel}`, '_blank');
                                }}
                              >
                                <Phone size={13} className="text-[var(--color-primary)]" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </BentoPanel>

                {/* ── MÉTODOS 1×1 ── */}
                <BentoPanel
                  isOpen={openPanels.metodos}
                  onToggle={() => togglePanel('metodos')}
                  tone="green"
                  size="1x1"
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
                        Clique para filtrar
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
                    <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-[var(--border-light)] pt-2">
                      <div className="rounded-[6px] bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] px-2 py-1.5">
                        <p className="text-[9px] nl-text-muted">Numerário</p>
                        <p className="text-[12px] font-semibold tabular-nums text-[var(--color-success)]">{formatCve(finance.cashTotal)}</p>
                      </div>
                      <div className="rounded-[6px] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-2 py-1.5">
                        <p className="text-[9px] nl-text-muted">Digital</p>
                        <p className="text-[12px] font-semibold tabular-nums text-[var(--color-primary)]">{formatCve(finance.digitalTotal)}</p>
                      </div>
                    </div>
                    {filtroMetodo !== 'todos' && (
                      <button type="button" className="nl-btn nl-btn-ghost nl-btn-sm w-full" onClick={() => setFiltroMetodo('todos')}>
                        Limpar filtro · ver todos
                      </button>
                    )}
                  </div>
                </BentoPanel>

                {/* ── MIX 1×1 ── */}
                <BentoPanel
                  isOpen={openPanels.mix}
                  onToggle={() => togglePanel('mix')}
                  tone="blue"
                  size="1x1"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Percent size={13} className="text-[var(--color-primary)]" />
                        <h2 className="text-[13px] font-semibold nl-text">Cobertura</h2>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium nl-text-muted">Mix + estado dos activos</p>
                    </div>
                  )}
                  preview={(
                    <div className="flex h-full items-center gap-2.5">
                      <Donut
                        size={88}
                        centerLabel="Cob."
                        centerValue={`${finance.coberturaPct}%`}
                        segments={[
                          { label: 'Em dia', value: finance.pagos.length, color: 'var(--color-success)' },
                          { label: 'Atraso', value: finance.atrasados.length, color: 'var(--color-error)' },
                        ].filter((s) => s.value > 0)}
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="nl-text-muted">Em dia</span>
                          <span className="font-semibold text-[var(--color-success)]">{finance.pagos.length}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="nl-text-muted">Atraso</span>
                          <span className="font-semibold text-[var(--color-error)]">{finance.atrasados.length}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="nl-text-muted">Activos</span>
                          <span className="font-semibold nl-text">{finance.operacionaisCount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Donut
                        size={120}
                        centerLabel="Cob."
                        centerValue={`${finance.coberturaPct}%`}
                        segments={[
                          { label: 'Em dia', value: finance.pagos.length, color: 'var(--color-success)' },
                          { label: 'Atraso', value: Math.max(finance.atrasados.length, 0), color: 'var(--color-error)' },
                        ].filter((s) => s.value > 0)}
                      />
                      <ul className="min-w-0 flex-1 space-y-1.5">
                        {finance.byMethod.filter((m) => m.total > 0).map((m) => {
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
                    {onNavigateGestao && (
                      <button type="button" className="nl-btn nl-btn-ghost nl-btn-sm w-full !justify-between" onClick={() => onNavigateGestao('cobertos')}>
                        Ver cobertos na Gestão
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </BentoPanel>

                {/* ── STATS 1×1 ── */}
                <BentoPanel
                  isOpen={openPanels.stats}
                  onToggle={() => togglePanel('stats')}
                  tone="orange"
                  size="1x1"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-[#c64600]" />
                        <h2 className="text-[13px] font-semibold nl-text">Indicadores</h2>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium text-[#c64600]">Estatísticas do período</p>
                    </div>
                  )}
                  preview={(
                    <div className="grid h-full grid-cols-2 content-start gap-2">
                      {[
                        { label: 'Realização', value: `${finance.realizacaoPct}%`, color: 'var(--color-primary)' },
                        { label: 'Ticket méd.', value: formatCve(finance.media), color: 'var(--text-primary)' },
                        { label: 'Dias activos', value: String(finance.daysWithMovement), color: 'var(--color-success)' },
                        { label: 'Mês ant.', value: formatCve(finance.receitaPrev), color: 'var(--text-secondary)' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-[6px] border border-[var(--border-light)] px-2 py-1.5">
                          <p className="text-[9px] nl-text-muted">{s.label}</p>
                          <p className="mt-0.5 text-[13px] font-semibold tabular-nums truncate" style={{ color: s.color }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                >
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Receita', value: formatCve(finance.receitaMes), hint: `${finance.count} pagamentos` },
                        { label: 'Previsão', value: formatCve(finance.previsao), hint: `${finance.operacionaisCount} activos` },
                        { label: 'Dívida', value: formatCve(finance.dividaValor), hint: `${finance.atrasados.length} alunos` },
                        { label: 'Por cobrar', value: formatCve(finance.pendente), hint: 'previsão − recebido' },
                        { label: 'Ticket médio', value: formatCve(finance.media), hint: 'por pagamento' },
                        { label: 'vs mês ant.', value: `${momUp ? '+' : ''}${finance.momDelta.toFixed(1)}%`, hint: formatCve(finance.receitaPrev) },
                        { label: 'Numerário', value: formatCve(finance.cashTotal), hint: finance.receitaMes ? `${Math.round((finance.cashTotal / finance.receitaMes) * 100)}%` : '—' },
                        { label: 'Digital', value: formatCve(finance.digitalTotal), hint: finance.receitaMes ? `${Math.round((finance.digitalTotal / finance.receitaMes) * 100)}%` : '—' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-[6px] border border-[var(--border-light)] px-2.5 py-2">
                          <p className="text-[9px] font-medium uppercase tracking-wide nl-text-muted">{s.label}</p>
                          <p className="mt-0.5 text-[14px] font-semibold tabular-nums nl-text">{s.value}</p>
                          <p className="text-[9px] nl-text-muted">{s.hint}</p>
                        </div>
                      ))}
                    </div>
                    {finance.topPagadores.length > 0 && (
                      <>
                        <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide nl-text-muted">Top pagamentos no mês</p>
                        <ul className="space-y-0.5">
                          {finance.topPagadores.map((t, i) => (
                            <li key={`${t.nome}-${i}`} className="flex items-center justify-between gap-2 rounded-[6px] px-1.5 py-1 hover:bg-[var(--color-secondary-light)]">
                              <button
                                type="button"
                                className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold nl-text"
                                onClick={() => t.aluno && onOpenStudent?.(t.aluno)}
                              >
                                <span className="mr-1.5 tabular-nums nl-text-muted">{i + 1}.</span>
                                {t.nome}
                              </button>
                              <span className="text-[11px] font-semibold tabular-nums text-[var(--color-success)]">{formatCve(t.total)}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </BentoPanel>

                {/* ── EVOLUÇÃO 2×1 ── */}
                <BentoPanel
                  isOpen={openPanels.evolucao}
                  onToggle={() => togglePanel('evolucao')}
                  tone="default"
                  size="2x1"
                  expandMode="both"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-[var(--color-primary)]" />
                        <h2 className="text-[13px] font-semibold nl-text">Evolução</h2>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium capitalize nl-text-muted">
                        6 meses · clique num mês para navegar
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
                          key: `${r.mes}-${r.ano}`,
                        }))}
                        onBarClick={(item) => {
                          const found = finance.receita6.find((r) => r.label === item.label);
                          if (found) {
                            setMesRelatorio(found.mes);
                            setAnoRelatorio(found.ano);
                            setSelectedDay(null);
                          }
                        }}
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
                    <div className="flex flex-wrap gap-1.5">
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
                    <div>
                      <p className="mb-1.5 text-[11px] font-medium nl-text-muted">Mapa de calor · {mesRelatorio}</p>
                      <div className="flex flex-wrap gap-1">
                        {finance.dailySeries.map((d) => (
                          <HeatDay
                            key={d.key}
                            label={`${formatDayLabel(d.key)}: ${formatCve(d.value)}`}
                            intensity={d.value / finance.maxDayTotal}
                            active={selectedDay === d.key}
                            onClick={() => {
                              setSelectedDay(d.key === selectedDay ? null : d.key);
                              setOpenPanels((p) => ({ ...p, movimentos: true }));
                            }}
                          />
                        ))}
                      </div>
                      <p className="mt-1.5 text-[10px] nl-text-muted">
                        Clique num dia para ver movimentos · mais escuro = mais receita
                      </p>
                    </div>
                  </div>
                </BentoPanel>

                {/* ── FORA DA CONTA 1×1 ── */}
                <BentoPanel
                  isOpen={openPanels.inactivos}
                  onToggle={() => togglePanel('inactivos')}
                  tone="violet"
                  size="1x1"
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
                          <button
                            key={aluno.id}
                            type="button"
                            onClick={() => onOpenStudent?.(aluno)}
                            className="flex w-full items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-left hover:bg-[var(--bg-surface)]/80"
                            style={{ boxShadow: `inset 3px 0 0 ${tone.fg}` }}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-semibold nl-text">{aluno.nome}</p>
                              <p className="text-[10px] nl-text-muted">{formatCve(aluno.plano)}</p>
                            </div>
                            <span className={`badge ${tone.badge} shrink-0 !text-[9px]`}>
                              {tone.label || getStudentStatusLabel(aluno.status)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </BentoPanel>

                {/* ── MOVIMENTOS 3×1 ── */}
                <BentoPanel
                  isOpen={openPanels.movimentos}
                  onToggle={() => togglePanel('movimentos')}
                  tone="default"
                  size="3x1"
                  expandMode="both"
                  header={(
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-[var(--color-primary)]" />
                        <h2 className="text-[13px] font-semibold nl-text">Movimentos</h2>
                        <span className="badge badge-info !text-[9px] tabular-nums">{finance.count}</span>
                        {filtroMetodo !== 'todos' && (
                          <span className="badge badge-success !text-[9px]">{filtroMetodo}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium nl-text-muted">
                        {selectedDay ? formatDayLabel(selectedDay) : `Entradas diárias · ${mesRelatorio}`}
                      </p>
                    </div>
                  )}
                  preview={(
                    <div className="grid h-full gap-3 sm:grid-cols-[1fr_1.2fr]">
                      <div className="min-h-0 space-y-0.5 overflow-hidden">
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
                      <MiniBar data={finance.dailySeries} height={120} />
                    </div>
                  )}
                >
                  <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
                    <div className="max-h-[360px] space-y-0.5 overflow-y-auto custom-scrollbar">
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
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide nl-text-muted">
                        {dayDetail ? formatDayLabel(dayDetail.key) : filtroMetodo === 'todos' ? 'Pagamentos do mês' : filtroMetodo}
                      </p>
                      <div className="max-h-[360px] space-y-0.5 overflow-y-auto custom-scrollbar">
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

              <section className="grid grid-cols-12 items-start gap-2.5">
                <BentoPanel
                  isOpen={openPanels.equipa}
                  onToggle={() => togglePanel('equipa')}
                  tone="blue"
                  size="2x1"
                  expandMode="both"
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
                    <div className="grid grid-cols-1 gap-1.5 content-start sm:grid-cols-2">
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
                  size="2x1"
                  expandMode="both"
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
