// @ts-nocheck
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import RootPanel from './RootPanel';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Users, CreditCard, Smartphone, Plus, RefreshCw, FileText,
  Search, Eye, EyeOff, Trash2, Edit, Pause, Ban,
  Settings, Shield, Palette, Layers, Cloud,
  CheckCircle2, AlertTriangle, LogOut, ChevronRight, ChevronLeft,
  MoreVertical, Calendar, Phone, Mail, MapPin,
  Camera, Save, Tag, MessageSquare, ExternalLink,
  User, Layout, Download, FileSpreadsheet, Filter,
  ArrowUpDown, Wifi, WifiOff, CloudUpload, RotateCw, X,
  RotateCcw, FileUp, FileDown, XCircle, AlertCircle, TrendingUp,
  BarChart2, BookUser, PieChart, UserPlus, Info, Bell, Sun, Moon, Sparkles,
  Archive, Database, HelpCircle, Globe,
  Menu, ChevronDown, ChevronUp, Clock, ShieldOff, UserCheck, Wallet, Landmark, LayoutList,
  Star, FileBarChart, Zap, Activity, Printer, ArrowLeft
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  buildCoverageWindow,
  formatCve,
  formatPtDate,
  isPaymentInsideMonth,
  normalizeAmount,
  parseFlexibleDate,
  summarizeStudentBilling,
} from './lib/billing';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  tipo: 'info' | 'sucesso' | 'alerta' | 'erro';
  categoria?: 'prioritaria' | 'relatorio' | 'app';
  alunoId?: string;
}

interface ConfirmDialogState {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'warning' | 'primary';
  onConfirm?: () => void | Promise<void>;
}

type FinanceQuickFilter = 'todos' | 'atrasados' | 'vence_hoje' | '7_dias' | 'cobertos';
type StudentSortMode = 'inteligente' | 'alfabetica' | 'inscricao_recente' | 'inscricao_antiga';
type DirectoryFilterStatus = 'todos' | 'ativos' | 'pausados' | 'bloqueados';

interface PaymentFormState {
  valor: string;
  dataPagamento: string;
  metodo: string;
  mesReferencia?: string;
}

const DEFAULT_PAYMENT_METHOD = 'Dinheiro';
const APP_ICON_PATH = new URL('./next-level-v01-2026.svg', document.baseURI).toString();
const NEXT_LAB_ICON = new URL('./next.svg', document.baseURI).toString();
const COMPANY_NAME = 'NEXT Lab';
const COMPANY_WEBSITE = 'https://linktr.ee/next.lab';
const COMPANY_AUTHOR = 'Ivaldino da Luz Fortes';
const COMPANY_EMAIL = 'ivaldinofortes@gmail.com';
const COMPANY_PHONE = '+238 9597220';
const DEFAULT_ACADEMY_BANNER = '/next-oficial%20wallpapers.jpg';
const MONTH_OPTIONS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const isPausedStatus = (status?: string) => status === 'pausado' || status === 'suspenso';
const isBlockedStatus = (status?: string) => status === 'bloqueado';
const isOperationallyActive = (status?: string) => !isPausedStatus(status) && !isBlockedStatus(status);

const getStudentStatusLabel = (status?: string) => {
  if (isPausedStatus(status)) return 'pausado';
  if (status === 'bloqueado') return 'bloqueado';
  return status || 'ativo';
};

const getBillingBadgeLabel = (status?: string) => {
  switch (status) {
    case 'atrasado':
      return 'Mensalidade em Atraso';
    case 'hoje':
      return 'Vence hoje';
    case 'critico':
      return 'Crítico';
    case 'pendente':
      return 'Pendente';
    case 'alerta':
      return 'Em dia';
    case 'pago':
      return 'Pago';
    case 'pausado':
      return 'Pausado';
    case 'suspenso':
      return 'Suspenso';
    case 'bloqueado':
      return 'Bloqueado';
    default:
      return 'Ativo';
  }
};

const getGenderBucket = (sexo?: string) => {
  const value = (sexo || '').trim().toLowerCase();
  if (value.startsWith('m')) return 'masculino';
  if (value.startsWith('f')) return 'feminino';
  return 'nao_definido';
};

const PAYMENT_METHOD_OPTIONS = [
  {
    value: 'Dinheiro',
    label: 'Dinheiro',
    shortLabel: 'Cash',
    description: 'Recebido diretamente na receção.',
    accent: 'from-[#0f172a] via-[#1d4ed8] to-[#3b82f6]',
  },
  {
    value: 'Multicaixa',
    label: 'Multicaixa',
    shortLabel: 'POS',
    description: 'Pagamento no terminal ou cartão.',
    accent: 'from-[#0b3b2e] via-[#0f766e] to-[#14b8a6]',
  },
  {
    value: 'Transferência',
    label: 'Transferência',
    shortLabel: 'Bank',
    description: 'Recebido por transferência bancária.',
    accent: 'from-[#3b0764] via-[#7c3aed] to-[#a855f7]',
  },
];

const formatInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const LEGACY_HOME_SUBTITLE = 'Operação diária, mensalidades e acompanhamento num só painel.';
const DEFAULT_HOME_SUBTITLE = 'Gestão diária num só painel.';

const getMonthKey = (monthName: string, year: number) => `${monthName}-${year}`;

const isFutureMonth = (monthIndex: number, year: number, reference = new Date()) => {
  const currentYear = reference.getFullYear();
  const currentMonth = reference.getMonth();
  return year > currentYear || (year === currentYear && monthIndex > currentMonth);
};

const isSameMonthAndYear = (date: Date | null, monthIndex: number, year: number) =>
  !!date && date.getMonth() === monthIndex && date.getFullYear() === year;

const getPaymentMethodMeta = (method?: string) =>
  PAYMENT_METHOD_OPTIONS.find((item) => item.value === method) || PAYMENT_METHOD_OPTIONS[0];

const formatPaymentRecordId = (payment?: { id?: number }) =>
  payment?.id ? `PAY-${String(payment.id).padStart(6, '0')}` : 'PAY-PREVIEW';

const buildPaymentCardNumber = (studentId?: string, paymentId?: number) => {
  const studentDigits = String(studentId || '0000').replace(/\D/g, '').slice(-4).padStart(4, '0');
  const paymentDigits = String(paymentId || 0).replace(/\D/g, '').slice(-4).padStart(4, '0');
  const checksum = String((Number(studentDigits) + Number(paymentDigits) + 1701) % 10000).padStart(4, '0');
  return `${studentDigits} ${paymentDigits} ${checksum}`;
};

const getBillingTone = (status?: string) => {
  switch (status) {
    case 'atrasado':
      return {
        badge: 'badge-error',
        surface: 'border-red-200 bg-red-50/80',
        accent: 'text-red-700',
        subtle: 'text-red-700/70',
        button: 'bg-red-600 hover:bg-red-700 text-white',
        color: '#DC2626',
      };
    case 'pago':
      return {
        badge: 'badge-success',
        surface: 'border-emerald-200 bg-emerald-50/80',
        accent: 'text-emerald-700',
        subtle: 'text-emerald-700/70',
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        color: '#16A34A',
      };
    case 'hoje':
    case 'critico':
    case 'pendente':
    case 'alerta':
    default:
      return {
        badge: 'badge-info',
        surface: 'border-blue-200 bg-blue-50/80',
        accent: 'text-blue-700',
        subtle: 'text-blue-700/70',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        color: '#2563EB',
      };
  }
};

const getTimelineMetricLabel = (summary: { status?: string; daysUntilCharge?: number; overdueDays?: number }, status?: string) => {
  if (isPausedStatus(status)) return 'Em pausa';
  if (isBlockedStatus(status)) return 'Bloqueado';
  if (summary.status === 'atrasado') return `${summary.overdueDays || 0}d atraso`;
  if (summary.status === 'hoje') return 'vence hoje';
  return `${Math.max(summary.daysUntilCharge || 0, 0)}d restantes`;
};

const getTimelineMetricWidth = (summary: { status?: string; daysUntilCharge?: number }, status?: string) => {
  if (isPausedStatus(status) || isBlockedStatus(status)) return 0;
  if (summary.status === 'atrasado' || summary.status === 'hoje') return 100;
  return Math.max(8, Math.min(100, (Math.max(summary.daysUntilCharge || 0, 0) / 30) * 100));
};

const getTimelineMetricBarClass = (summaryStatus?: string) => {
  if (summaryStatus === 'atrasado' || summaryStatus === 'hoje') return 'bg-red-500';
  if (summaryStatus === 'pago') return 'bg-emerald-500';
  // "Dentro do prazo" -> Azul
  return 'bg-blue-600';
};

const prioridadeResumoAlunos = {
  atrasado: 0,
  hoje: 1,
  critico: 2,
  pendente: 3,
  alerta: 4,
  pago: 5,
  pausado: 6,
  suspenso: 6,
  bloqueado: 7,
};

// ─── Design System — Light / Dark / Claude ────────────────────────
const themeVars = {
  light: {
    '--color-primary':           '#0065FF',
    '--color-primary-hover':     '#0052CC',
    '--color-primary-light':     '#DEEBFF',
    '--color-secondary':         '#626F86',
    '--color-secondary-light':   '#F4F5F7',
    '--color-secondary-lighter': '#EBECF0',
    '--color-success':           '#61BD4F',
    '--color-error':             '#EB5A46',
    '--color-warning':           '#FF9F1A',
    '--color-info':              '#0065FF',
    '--color-bg-primary':        '#FFFFFF',
    '--color-bg-secondary':      '#F4F5F7',
    '--color-bg-tertiary':       '#EBECF0',
    '--color-text-primary':      '#172B4D',
    '--color-text-secondary':    '#626F86',
    '--color-text-tertiary':     '#738496',
    '--color-border':            '#DFE1E6',
    '--color-border-light':      '#EBECF0',
    '--bg-app':                  '#F4F5F7',
    '--bg-surface':              '#FFFFFF',
    '--bg-header':               '#FFFFFF',
    '--bg-input':                '#FFFFFF',
    '--text-primary':            '#172B4D',
    '--text-secondary':          '#626F86',
    '--text-tertiary':           '#738496',
    '--border':                  '#DFE1E6',
    '--border-light':            '#EBECF0',
    '--shadow-sm':               '0 1px 0 rgba(9,30,66,0.25)',
    '--shadow-md':               '0 2px 4px rgba(9,30,66,0.13)',
    '--shadow-lg':               '0 4px 8px rgba(9,30,66,0.12)',
    '--shadow-xl':               '0 8px 16px rgba(9,30,66,0.25)',
    '--shadow-primary':          'rgba(0,101,255,0.24)',
    '--shadow-primary-focus':    'rgba(0,101,255,0.12)',
    '--radius-lg':               '3px',
    '--radius-md':               '3px',
    '--radius-sm':               '3px',
    '--font-size-xs':            '11px',
    '--font-size-sm':            '12px',
    '--font-size-base':          '14px',
    '--font-size-lg':            '16px',
    '--font-size-xl':            '18px',
    '--font-size-2xl':           '20px',
    '--font-size-3xl':           '24px',
    '--spacing-xs':              '4px',
    '--spacing-sm':              '8px',
    '--spacing-md':              '12px',
    '--spacing-lg':              '16px',
    '--spacing-xl':              '20px',
    '--spacing-2xl':             '24px',
  },
  dark: {
    '--color-primary':           '#579DFF',
    '--color-primary-hover':     '#85B8FF',
    '--color-primary-light':     '#1D3A6A',
    '--color-secondary':         '#9FADBC',
    '--color-secondary-light':   '#1D2125',
    '--color-secondary-lighter': '#282E33',
    '--color-success':           '#61BD4F',
    '--color-error':             '#F87171',
    '--color-warning':           '#FBBF24',
    '--color-info':              '#60A5FA',
    '--color-bg-primary':        '#22272B',
    '--color-bg-secondary':      '#1D2125',
    '--color-bg-tertiary':       '#282E33',
    '--color-text-primary':      '#F1F2F4',
    '--color-text-secondary':    '#9FADBC',
    '--color-text-tertiary':     '#8696A7',
    '--color-border':            '#3D474F',
    '--color-border-light':      '#2C333A',
    '--bg-app':                  '#161A1D',
    '--bg-surface':              '#22272B',
    '--bg-header':               '#1D2125',
    '--bg-input':                '#282E33',
    '--text-primary':            '#F1F2F4',
    '--text-secondary':          '#9FADBC',
    '--text-tertiary':           '#8696A7',
    '--border':                  '#3D474F',
    '--border-light':            '#2C333A',
    '--shadow-sm':               '0 1px 2px rgba(0,0,0,0.5)',
    '--shadow-md':               '0 4px 8px rgba(0,0,0,0.5)',
    '--shadow-lg':               '0 8px 16px rgba(0,0,0,0.5)',
    '--shadow-xl':               '0 12px 24px rgba(0,0,0,0.6)',
    '--shadow-primary':          'rgba(87,157,255,0.28)',
    '--shadow-primary-focus':    'rgba(87,157,255,0.14)',
    '--radius-lg':               '3px',
    '--radius-md':               '3px',
    '--radius-sm':               '3px',
    '--font-size-xs':            '11px',
    '--font-size-sm':            '12px',
    '--font-size-base':          '14px',
    '--font-size-lg':            '16px',
    '--font-size-xl':            '18px',
    '--font-size-2xl':           '20px',
    '--font-size-3xl':           '24px',
    '--spacing-xs':              '4px',
    '--spacing-sm':              '8px',
    '--spacing-md':              '12px',
    '--spacing-lg':              '16px',
    '--spacing-xl':              '20px',
    '--spacing-2xl':             '24px',
  },

  // ── Tema Claude — inspirado no design do claude.ai ───────────────
  claude: {
    '--color-primary':           '#CF7C5A',  // terracota quente (acento Claude)
    '--color-primary-hover':     '#B86A48',
    '--color-primary-light':     '#FAEEE7',  // terracota muito suave
    '--color-secondary':         '#7D6B5C',  // castanho médio
    '--color-secondary-light':   '#F2EDE6',  // creme
    '--color-secondary-lighter': '#EAE2D9',  // bege claro
    '--color-success':           '#2E7D52',  // verde floresta
    '--color-error':             '#C84B4B',  // vermelho quente
    '--color-warning':           '#A85A00',  // âmbar escuro
    '--color-info':              '#3B6FA8',  // azul muted
    '--color-bg-primary':        '#FAF7F3',  // creme quase branco
    '--color-bg-secondary':      '#F2EDE6',  // creme
    '--color-bg-tertiary':       '#EAE2D9',  // bege
    '--color-text-primary':      '#1E1612',  // castanho quase preto
    '--color-text-secondary':    '#6B5F52',  // castanho médio
    '--color-text-tertiary':     '#9C8A7A',  // castanho claro
    '--color-border':            '#DDD4C8',  // bege border
    '--color-border-light':      '#EAE2D9',  // bege muito claro
    '--bg-app':                  '#EDE7DF',  // pergaminho de fundo
    '--bg-surface':              '#FAF7F3',  // superfície creme
    '--bg-header':               '#F2EDE6',  // header bege
    '--bg-input':                '#FAF7F3',  // input creme
    '--text-primary':            '#1E1612',
    '--text-secondary':          '#6B5F52',
    '--text-tertiary':           '#9C8A7A',
    '--border':                  '#DDD4C8',
    '--border-light':            '#EAE2D9',
    '--shadow-sm':               '0 1px 2px rgba(60,30,10,0.07)',
    '--shadow-md':               '0 2px 6px rgba(60,30,10,0.09)',
    '--shadow-lg':               '0 4px 12px rgba(60,30,10,0.10)',
    '--shadow-xl':               '0 8px 20px rgba(60,30,10,0.14)',
    '--shadow-primary':          'rgba(207,124,90,0.26)',
    '--shadow-primary-focus':    'rgba(207,124,90,0.14)',
    '--radius-lg':               '10px',
    '--radius-md':               '8px',
    '--radius-sm':               '6px',
    '--font-size-xs':            '11px',
    '--font-size-sm':            '12px',
    '--font-size-base':          '14px',
    '--font-size-lg':            '16px',
    '--font-size-xl':            '18px',
    '--font-size-2xl':           '20px',
    '--font-size-3xl':           '24px',
    '--spacing-xs':              '4px',
    '--spacing-sm':              '8px',
    '--spacing-md':              '12px',
    '--spacing-lg':              '16px',
    '--spacing-xl':              '20px',
    '--spacing-2xl':             '24px',
  },
};

const GlobalStyles = ({ theme }: { theme: 'light' | 'dark' | 'claude' }) => {
  const vars = themeVars[theme] || themeVars.light;
  const cssVars = Object.entries(vars).map(([k,v]) => `${k}:${v};`).join('');

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

      :root {
        --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
        --font-list: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
        font-family: var(--font-ui);
        ${cssVars}
        --accent-primary: var(--color-primary);
        --accent-light: var(--color-primary-light);
        --header-bg: var(--bg-header);
        --transition-fast: 130ms cubic-bezier(0.4,0,0.2,1);
        --transition-base: 200ms cubic-bezier(0.4,0,0.2,1);
        --transition-slow: 300ms cubic-bezier(0.4,0,0.2,1);
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.97); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pulseSoft {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.55; }
      }

      .animate-slide-up  { animation: slideUp  0.22s var(--transition-base) both; }
      .animate-fade-in   { animation: fadeIn   0.18s var(--transition-fast) both; }
      .animate-scale-in  { animation: scaleIn  0.18s var(--transition-base) both; }
      .animate-spin      { animation: spin 0.7s linear infinite; }
      .animate-pulse-soft{ animation: pulseSoft 1.8s ease-in-out infinite; }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { height: 100%; }

      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: var(--bg-app);
        color: var(--text-primary);
        line-height: 1.5;
        font-size: var(--font-size-base);
        overflow: hidden;
        letter-spacing: -0.005em;
      }

      button, input, select, textarea { font: inherit; }

      /* ── Card ── */
      .nl-card {
        background: var(--bg-surface);
        border-radius: 6px;
        box-shadow: 0 1px 2px rgba(9,30,66,0.06), 0 0 0 1px rgba(9,30,66,0.05);
        padding: var(--spacing-lg);
        transition: box-shadow var(--transition-base), background-color var(--transition-base);
        border: 1px solid var(--border-light);
      }
      .nl-card:hover {
        box-shadow: 0 2px 8px rgba(9,30,66,0.09), 0 0 0 1px rgba(9,30,66,0.06);
      }

      /* ── Buttons ── */
      .nl-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 5px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color var(--transition-fast), box-shadow var(--transition-fast),
                    transform var(--transition-fast), border-color var(--transition-fast);
        border: 1px solid transparent;
        outline: none;
        white-space: nowrap;
        letter-spacing: 0.005em;
      }
      .nl-btn:active { transform: scale(0.97); }

      .nl-btn-primary {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
        box-shadow: 0 1px 3px rgba(0,101,255,0.24);
      }
      .nl-btn-primary:hover {
        background: var(--color-primary-hover);
        box-shadow: 0 3px 8px rgba(0,101,255,0.32);
      }

      .nl-btn-secondary {
        background: var(--color-secondary-lighter);
        color: var(--text-primary);
        border: 1px solid var(--border);
      }
      .nl-btn-secondary:hover {
        background: var(--color-secondary-light);
        border-color: var(--color-secondary);
      }

      .nl-btn-ghost {
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid transparent;
      }
      .nl-btn-ghost:hover {
        background: var(--color-secondary-lighter);
        color: var(--text-primary);
      }

      /* ── Inputs ── */
      .nl-input {
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: 5px;
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 400;
        color: var(--text-primary);
        transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
        width: 100%;
        outline: none;
      }
      .nl-input:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(0,101,255,0.10);
        background: var(--bg-surface);
      }
      .nl-input::placeholder { color: var(--text-tertiary); opacity: 0.75; }

      /* ── Badges ── */
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      .badge-success { background: #DFFCF0; color: #216E4E; border: 1px solid #B3EED4; }
      .badge-error   { background: #FFECEB; color: #AE2A19; border: 1px solid #FFD5D2; }
      .badge-warning { background: #FFF7D6; color: #974F0C; border: 1px solid #FFE380; }
      .badge-info    { background: #DEEBFF; color: #0052CC; border: 1px solid #B3D4FF; }
      .badge-neutral { background: var(--color-secondary-lighter); color: var(--text-secondary); border: 1px solid var(--border); }

      /* ── Status pill (compact) ── */
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 7px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .status-pill::before {
        content: '';
        display: inline-block;
        width: 5px; height: 5px;
        border-radius: 50%;
        background: currentColor;
      }

      /* ── Scrollbar ── */
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: var(--color-secondary); }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--border); }

      /* ── Utility ── */
      .nl-text       { color: var(--text-primary); }
      .nl-text-sub   { color: var(--text-secondary); }
      .nl-text-muted { color: var(--text-tertiary); }
      .nl-font-ui    { font-family: var(--font-ui); }
      .nl-font-list  { font-family: var(--font-list); }
      .nl-border     { border-color: var(--border); }
      .nl-bg-surface { background-color: var(--bg-surface); }
      .nl-bg-app     { background-color: var(--bg-app); }
      .nl-bg-input   { background-color: var(--bg-input); }

      .nl-glass {
        background: var(--bg-header);
        border-bottom: 1px solid var(--border);
        box-shadow: 0 1px 3px rgba(9,30,66,0.06);
      }

      .nl-modal-overlay {
        background: rgba(9, 30, 66, 0.48);
        backdrop-filter: blur(3px);
      }
      .nl-modal {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: 0 16px 48px rgba(9,30,66,0.18);
      }

      .nl-table thead { background: var(--color-secondary-lighter); }
      .nl-table tbody tr { transition: background-color var(--transition-fast); }
      .nl-table tbody tr:hover { background: color-mix(in srgb, var(--color-secondary-lighter) 72%, transparent); }

      /* ── Divider chip (timeline month) ── */
      .nl-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.10em;
        text-transform: uppercase;
        border: 1px solid var(--border-light);
        background: var(--bg-surface);
        color: var(--text-secondary);
        transition: all var(--transition-fast);
      }
      .nl-chip-active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(0,101,255,0.14);
      }

      /* ── Action icon buttons ── */
      .nl-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px; height: 34px;
        border-radius: 6px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition-fast);
        flex-shrink: 0;
      }
      .nl-icon-btn:hover {
        background: var(--color-secondary-lighter);
        color: var(--text-primary);
        border-color: var(--border);
      }
      .nl-icon-btn:active { transform: scale(0.93); }

      /* ── Section label ── */
      .nl-section-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-tertiary);
      }

      /* ── Row hover ── */
      .nl-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        border-radius: 6px;
        transition: background-color var(--transition-fast);
        cursor: pointer;
      }
      .nl-row:hover { background: color-mix(in srgb, var(--color-secondary-lighter) 60%, transparent); }

      /* ── Pastel accent blocks ── */
      .pastel-blue   { background: #EBF4FF; color: #1D4ED8; border: 1px solid #C7DEFF; }
      .pastel-green  { background: #ECFDF5; color: #15803D; border: 1px solid #BBF7D0; }
      .pastel-amber  { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
      .pastel-red    { background: #FFF1F2; color: #B91C1C; border: 1px solid #FECDD3; }
      .pastel-purple { background: #F5F3FF; color: #7C3AED; border: 1px solid #DDD6FE; }
    ` }} />
  );
};

// Acesso ao Electron (apenas se estivermos a correr no Electron)
const electron = (window as any).require ? (window as any).require('electron') : null;

// Tema Padrão
const DEFAULT_THEME = '#217346';

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

function App() {
  const [aba, setAba] = useState('home');
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [expandirExtras, setExpandirExtras] = useState(false);
  const [mostrarFormEdicao, setMostrarFormEdicao] = useState(false);
  const [alunoEdicao, setAlunoEdicao] = useState<Aluno | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'divida' | 'cobertos'>('todos');
  const [menuAlunoAberto, setMenuAlunoAberto] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState('');
  const [pesquisaDirectorio, setPesquisaDirectorio] = useState('');
  const [ordenacaoDirectorio, setOrdenacaoDirectorio] = useState<StudentSortMode>('alfabetica');
  const [filtroDirectorioStatus, setFiltroDirectorioStatus] = useState<DirectoryFilterStatus>('todos');
  const [bannerAcademia, setBannerAcademia] = useState(localStorage.getItem('nl_banner_academia') || DEFAULT_ACADEMY_BANNER);
  const [appLogo, setAppLogo] = useState(localStorage.getItem('nl_app_logo') || APP_ICON_PATH);
  
  // Estados para Configurações
  const [mostrarSettings, setMostrarSettings] = useState(false);
  const [nomeAcademia, setNomeAcademia] = useState(localStorage.getItem('nl_nome_academia') || 'NEXTLevel');
  const [subtituloAcademia, setSubtituloAcademia] = useState(() => {
    const saved = localStorage.getItem('nl_subtitulo_academia');
    if (!saved || saved === LEGACY_HOME_SUBTITLE) return DEFAULT_HOME_SUBTITLE;
    return saved;
  });
  const [moradaAcademia, setMoradaAcademia] = useState(localStorage.getItem('nl_morada_academia') || 'Avenida Principal, Mindelo');
  const [emailAcademia, setEmailAcademia] = useState(localStorage.getItem('nl_email_academia') || 'contacto@nextlevel.cv');
  const [telefoneAcademia, setTelefoneAcademia] = useState(localStorage.getItem('nl_telefone_academia') || '+238 000 00 00');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [novaCategoria, setNovaCategoria] = useState('');

  // Estados para Controle Financeiro
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  const [mostrarHistoricoModal, setMostrarHistoricoModal] = useState(false);
  const [pagamentoSucesso, setPagamentoSucesso] = useState(false);
  const [ultimoPagamentoInfo, setUltimoPagamentoInfo] = useState(null);
  const [pagamentoForm, setPagamentoForm] = useState<PaymentFormState>({
    valor: '',
    dataPagamento: formatInputDate(),
    metodo: DEFAULT_PAYMENT_METHOD,
  });
  const [historicoPagamentos, setHistoricoPagamentos] = useState<Pagamento[]>([]);
  const [alunoParaPagamento, setAlunoParaPagamento] = useState<Aluno | null>(null);
  const [timelineFinanceiraMinimizada, setTimelineFinanceiraMinimizada] = useState(false);

  // Estados para Central de Contactos Profissional
  const [alunoPerfil, setAlunoPerfil] = useState<Aluno | null>(null);
  const [notasContacto, setNotasContacto] = useState<Nota[]>([]);
  const [novaNota, setNovaNota] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [contactosAbaDetalhe, setContactosAbaDetalhe] = useState<'perfil' | 'historico' | 'financeiro' | 'notas'>('perfil');
  // contactosTimeline now shares mesFinanceiro / anoFinanceiro
  const [timelineContactosMinimizada, setTimelineContactosMinimizada] = useState(false);
  const [contactosDesconto, setContactosDesconto] = useState('');
  const [contactosMostrarDesconto, setContactosMostrarDesconto] = useState(false);
  const [modoListaContactos, setModoListaContactos] = useState<'normal' | 'compacto'>('normal');

  // Estados para gestão de utilizadores
  const [listaUtilizadores, setListaUtilizadores] = useState<any[]>([]);
  const [novoUtilizadorForm, setNovoUtilizadorForm] = useState({ name: '', email: '', role: 'operational', password: '' });
  const [mostrarFormNovoUtilizador, setMostrarFormNovoUtilizador] = useState(false);
  const [utilizadorEmEdicao, setUtilizadorEmEdicao] = useState<any | null>(null);
  const [utilizadorEdicaoForm, setUtilizadorEdicaoForm] = useState({ name: '', role: 'operational', isActive: true, novaSenha: '' });
  const [utilizadorAvatares, setUtilizadorAvatares] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('nl_user_avatares') || '{}'); } catch { return {}; }
  });

  // Estados para Exportação Avançada
  const [mostrarModalExport, setMostrarModalExport] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    tipo: 'excel' as 'excel' | 'pdf',
    dataInicio: '',
    dataFim: '',
    incluirCabecalho: true,
    colunas: ['nome', 'telefone', 'plano', 'vencimento', 'status']
  });

  // Estados para Auditoria e Segurança
  const [logs, setLogs] = useState<any[]>([]);

  // Sessão / utilizadores
  type UserRole = 'admin' | 'operational' | 'root';
  type SessionUser = { id: number; name: string; email: string; role: UserRole };
  const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias — sessão persistente
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem('nl_session_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.email || !parsed?.role) return null;
      const loginTime = parsed?.loginTimestamp || 0;
      if (Date.now() - loginTime > SESSION_EXPIRY_MS) {
        localStorage.removeItem('nl_session_user');
        return null;
      }
      return parsed as SessionUser;
    } catch (e) {
      return null;
    }
  });

  // Novos Estados Profissionais
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionUser);
  const [loginForm, setLoginForm] = useState({ email: localStorage.getItem('nl_last_user_email') || '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [appTheme, setAppTheme] = useState<'light' | 'dark' | 'claude'>(() => {
    const saved = localStorage.getItem('nl_app_theme') || localStorage.getItem('nl_gnome_theme');
    return (saved === 'light' || saved === 'dark' || saved === 'claude') ? saved : 'light';
  });
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, alunoId: string } | null>(null);
  const [configAba, setConfigAba] = useState<'geral' | 'operacao' | 'notificacoes' | 'tema' | 'utilizadores' | 'lixeira' | 'ajuda' | 'sobre'>('geral');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [sincronizando, setSincronizando] = useState(false);
  const [zoomLista, setZoomLista] = useState(Number(localStorage.getItem('nl_zoom_lista')) || 90); 
  const [fontSizeLista, setFontSizeLista] = useState(Number(localStorage.getItem('nl_font_size_lista')) || 13);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(true);
  const [notifPagamentos, setNotifPagamentos] = useState(true);
  const [notifMatriculas, setNotifMatriculas] = useState(true);
  const [notifSistema, setNotifSistema] = useState(true);
  const [notifRelatorios, setNotifRelatorios] = useState(true);
  const [relatorioMensalDisponivel, setRelatorioMensalDisponivel] = useState('');
  const [backupReminderEnabled, setBackupReminderEnabled] = useState(true);
  const [whatsappTemplate, setWhatsappTemplate] = useState('Olá, {nome}. A sua mensalidade da academia está pendente. Quando puder, regularize por favor.');
  const [ultimaExportacaoOperacional, setUltimaExportacaoOperacional] = useState('');
  const [ultimoBackupMes, setUltimoBackupMes] = useState('');
  const [diretorioBackup, setDiretorioBackup] = useState('');
  
  // Estados de Licenciamento e Setup (Fase 3)
  const [setupStep, setSetupStep] = useState(1);
  const [setupData, setSetupData] = useState({
    nomeAcademia: '',
    email: '',
    telefone: '',
    morada: '',
    adminEmail: '',
    adminSenha: '',
    confirmarSenha: '',
    licenca: '',
  });
  const [setupLicenseInfo, setSetupLicenseInfo] = useState<any>(null);
  const [setupError, setSetupError] = useState('');
  const [licencaAtiva, setLicencaAtiva] = useState<boolean>(true);
  const [licencaDados, setLicencaDados] = useState({ chave: '', expiracao: '', tipo: '' });
  const [configuracoes, setConfiguracoes] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [chaveReativacao, setChaveReativacao] = useState('');
  const [erroReativacao, setErroReativacao] = useState('');
  const [mostrarUserMenu, setMostrarUserMenu] = useState(false);
  const [mostrarConfigModal, setMostrarConfigModal] = useState(false);
  const [mostrarSobreDoc, setMostrarSobreDoc] = useState(false);
  const [mesFinanceiro, setMesFinanceiro] = useState(new Date().toLocaleString('pt-PT', { month: 'long' }).toLowerCase());
  const [anoFinanceiro, setAnoFinanceiro] = useState(new Date().getFullYear());
  const [mostrarRelatorioMensal, setMostrarRelatorioMensal] = useState(false);
  const [mesRelatorio, setMesRelatorio] = useState(new Date().toLocaleString('pt-PT', { month: 'long' }).toLowerCase());
  const [anoRelatorio, setAnoRelatorio] = useState(new Date().getFullYear());
  const [mostrarListaMatriculas, setMostrarListaMatriculas] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(JSON.parse(localStorage.getItem('nl_notificacoes') || '[]'));
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [mostrarResolverPendencias, setMostrarResolverPendencias] = useState(false);
  const [alunoParaResolver, setAlunoParaResolver] = useState<any>(null);
  const [mesesParaResolver, setMesesParaResolver] = useState<string[]>([]);
  // Boas-vindas pós-matrícula
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);
  const [alunoBoasVindas, setAlunoBoasVindas] = useState<Aluno | null>(null);
  const [msgBoasVindas, setMsgBoasVindas] = useState('');

  // Quick Access — login sem senha
  const [quickAccessUsers, setQuickAccessUsers] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('nl_quick_access_users') || '[]'); } catch { return []; }
  });
  const [quickAccessExpanded, setQuickAccessExpanded] = useState(false);

  // Slideshow de login
  const [slideshowImages, setSlideshowImages] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('nl_slideshow_images') || '[]'); } catch { return []; }
  });
  const [slideshowTimer, setSlideshowTimer] = useState(() => Number(localStorage.getItem('nl_slideshow_timer') || '6'));
  const [slideshowTextEnabled, setSlideshowTextEnabled] = useState(() => localStorage.getItem('nl_slideshow_text') !== '0');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loginSlideshowUsers, setLoginSlideshowUsers] = useState<any[]>([]);
  const [mostrarSobreApp, setMostrarSobreApp] = useState(false);
  const [agora, setAgora] = useState(new Date());
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    visible: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
  });
  const zoomListaNormalizado = Math.max(60, Math.min(100, zoomLista));
  const larguraListas = Math.round(1120 + ((zoomListaNormalizado - 60) / 40) * 360);
  const larguraSidebarContactos = Math.round(280 + ((zoomListaNormalizado - 60) / 40) * 80);
  const densidadeLista = (zoomListaNormalizado - 60) / 40;
  const paddingLinhaY = `${((6.2 + densidadeLista * 4.8) * 0.8).toFixed(1)}px`;
  const paddingLinhaX = `${(10 + densidadeLista * 6).toFixed(1)}px`;
  const tamanhoAvatarLista = `${Math.round((29 + densidadeLista * 7) * 0.8)}px`;
  const tamanhoFonteLista = `${(12 + densidadeLista * 1.5).toFixed(1)}px`;
  const tamanhoFonteSecundariaLista = `${(10 + densidadeLista * 1.2).toFixed(1)}px`;
  const estiloTabelaAlunos = {
    '--list-row-py': paddingLinhaY,
    '--list-row-px': paddingLinhaX,
    '--list-avatar-size': tamanhoAvatarLista,
    '--list-font-primary': tamanhoFonteLista,
    '--list-font-secondary': tamanhoFonteSecundariaLista,
  } as CSSProperties;
  const timelineAnnouncementRef = useRef('');

  // Efeito para salvar notificações sempre que mudarem
  useEffect(() => {
    localStorage.setItem('nl_notificacoes', JSON.stringify(notificacoes));
  }, [notificacoes]);

  useEffect(() => {
    localStorage.setItem('nl_zoom_lista', String(zoomListaNormalizado));
  }, [zoomListaNormalizado]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const adicionarNotificacao = (titulo: string, mensagem: string, tipo: Notificacao['tipo'] = 'info', alunoId?: string) => {
    // Auto-categorizar por tipo de evento
    const tituloBaixo = titulo.toLowerCase();
    let categoria: Notificacao['categoria'] = 'app';
    if (
      tituloBaixo.includes('matr') ||
      tituloBaixo.includes('atraso') ||
      tituloBaixo.includes('pagamento') ||
      tituloBaixo.includes('status') ||
      tituloBaixo.includes('cancelamento') ||
      tipo === 'alerta' || tipo === 'erro'
    ) {
      categoria = 'prioritaria';
    } else if (
      tituloBaixo.includes('relat') ||
      tituloBaixo.includes('export') ||
      tituloBaixo.includes('dossier') ||
      tituloBaixo.includes('mensal') ||
      tituloBaixo.includes('receita') ||
      tituloBaixo.includes('taxa')
    ) {
      categoria = 'relatorio';
    }
    const nova: Notificacao = {
      id: Date.now().toString(),
      titulo,
      mensagem,
      data: new Date().toLocaleString('pt-PT'),
      lida: false,
      tipo,
      categoria,
      alunoId,
    };
    setNotificacoes(prev => [nova, ...prev]);
  };

  const marcarComoLida = (id: string) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const limparNotificacoes = () => {
    setNotificacoes([]);
  };

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;



  // GNOME Adwaita: Toast Notifications System
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const guardarConfiguracao = async (chave: string, valor: string) => {
    if (!electron) return;
    await electron.ipcRenderer.invoke('update-configuracao', chave, valor);
  };

  const notificarSistema = async (title: string, body: string) => {
    if (!electron || !desktopNotificationsEnabled) return;
    await electron.ipcRenderer.invoke('notify-system', { title, body });
  };

  const abrirConfirmacao = (config: Omit<ConfirmDialogState, 'visible'>) => {
    setConfirmDialog({ visible: true, ...config });
  };

  const fecharConfirmacao = () => {
    setConfirmDialog((prev) => ({ ...prev, visible: false }));
  };

  // Função para calcular progresso, status e cores inteligentes (Inteligência Termométrica)
  const calcularStatusVencimento = (vencimentoStr: string) => {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const [dia, mes, ano] = vencimentoStr.split('/').map(Number);
      const dataVencimento = new Date(ano, mes - 1, dia);
      dataVencimento.setHours(0, 0, 0, 0);

      const diffTime = dataVencimento.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status = 'pago';
      let color = 'text-emerald-600';
      let bgColor = 'bg-emerald-50';
      let borderColor = 'border-emerald-100';
      let barColor = 'bg-emerald-500';

      if (diffDays < 0) {
        status = 'atrasado';
        color = 'text-red-600';
        bgColor = 'bg-red-50';
        borderColor = 'border-red-100';
        barColor = 'bg-red-600';
      } else if (diffDays === 0) {
        status = 'hoje';
        color = 'text-red-500';
        bgColor = 'bg-red-50';
        borderColor = 'border-red-200';
        barColor = 'bg-red-500';
      } else if (diffDays <= 3) {
        status = 'critico';
        color = 'text-orange-600';
        bgColor = 'bg-orange-50';
        borderColor = 'border-orange-100';
        barColor = 'bg-orange-500';
      } else if (diffDays <= 7) {
        status = 'pendente';
        color = 'text-amber-600';
        bgColor = 'bg-amber-50';
        borderColor = 'border-amber-100';
        barColor = 'bg-amber-500';
      } else if (diffDays <= 15) {
        status = 'alerta';
        color = 'text-yellow-600';
        bgColor = 'bg-yellow-50';
        borderColor = 'border-yellow-100';
        barColor = 'bg-yellow-400';
      }

      // Ciclo termométrico: quanto menos tempo falta, mais "quente" fica
      const progresso = Math.max(0, Math.min(100, (diffDays / 30) * 100));

      return { progresso, status, diffDays, color, bgColor, borderColor, barColor };
    } catch (e) {
      return { progresso: 100, status: 'pago', diffDays: 30, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100', barColor: 'bg-emerald-500' };
    }
  };

  const parseDate = (dateStr?: string) => parseFlexibleDate(dateStr) || new Date();

  const calcularVencimentoInteligente = (
    dataMatriculaStr: string,
    _diaPagamento: 1 | 'ultimo',
    pagoAgora: boolean
  ): string => {
    const dataMatricula = parseFlexibleDate(dataMatriculaStr) || new Date();

    if (!pagoAgora) {
      return formatPtDate(dataMatricula);
    }

    return buildCoverageWindow(formatPtDate(dataMatricula)).nextChargeDate;
  };

  
  // Estado para o formulário de novo aluno
  const novoAlunoDefault = {
    nome: '', telefone: '', email: '', sexo: '',
    data_nascimento: '', morada: '', alergias: '',
    objetivos: '', horario_preferido: '',
    plano: '', vencimento: '', data_matricula: new Date().toISOString().split('T')[0],
    categoria: '',
    modo_cobranca: 'mensalidade_movel',
    // Novos campos de lógica de pagamento
    modo_inscricao: 'matricula' as 'matricula' | 'matricula_pago',
    dia_pagamento: 1 as 1 | 'ultimo',
  };
  const [novoAluno, setNovoAluno] = useState(novoAlunoDefault);
  const [previewVencimento, setPreviewVencimento] = useState('');

  // Recalcula preview quando dados da matrícula mudam
  useEffect(() => {
    if (!novoAluno.data_matricula) return;
    const prev = calcularVencimentoInteligente(
      novoAluno.data_matricula,
      novoAluno.dia_pagamento,
      novoAluno.modo_inscricao === 'matricula_pago'
    );
    setPreviewVencimento(prev);
  }, [novoAluno.data_matricula, novoAluno.dia_pagamento, novoAluno.modo_inscricao]);

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  const mesFinanceiroIndex = MONTH_OPTIONS.indexOf(mesFinanceiro);
  const hojeReferencia = new Date();
  const periodoSelecionadoKey = getMonthKey(mesFinanceiro, anoFinanceiro);
  const periodoSelecionadoFuturo = isFutureMonth(mesFinanceiroIndex, anoFinanceiro, hojeReferencia);
  const inicioPeriodoSelecionado = mesFinanceiroIndex >= 0
    ? new Date(anoFinanceiro, mesFinanceiroIndex, 1)
    : new Date(anoFinanceiro, hojeReferencia.getMonth(), 1);
  const referenciaFinanceira = (() => {
    const fallback = new Date(anoFinanceiro, hojeReferencia.getMonth(), hojeReferencia.getDate());
    if (mesFinanceiroIndex < 0) return fallback;

    const isCurrentPeriod =
      anoFinanceiro === hojeReferencia.getFullYear() &&
      mesFinanceiroIndex === hojeReferencia.getMonth();

    if (isCurrentPeriod) {
      return new Date(hojeReferencia.getFullYear(), hojeReferencia.getMonth(), hojeReferencia.getDate());
    }

    return new Date(anoFinanceiro, mesFinanceiroIndex + 1, 0);
  })();

  const resumosFinanceiros = alunos.map((aluno) => {
    const resumo = summarizeStudentBilling(aluno, pagamentos, referenciaFinanceira);
    return { aluno, resumo };
  });

  const timelineMonths = MONTH_OPTIONS.map((mes, index) => {
    const future = isFutureMonth(index, anoFinanceiro, hojeReferencia);
    const monthStart = new Date(anoFinanceiro, index, 1);
    const monthEnd = future
      ? new Date(anoFinanceiro, index, 1)
      : new Date(anoFinanceiro, index + 1, 0);

    const students = future
      ? []
      : alunos.filter((aluno) => {
          const enrollment = parseFlexibleDate(aluno.data_matricula);
          return enrollment ? enrollment.getTime() <= monthEnd.getTime() : true;
        });

    const fresh = future
      ? []
      : students.filter((aluno) => isSameMonthAndYear(parseFlexibleDate(aluno.data_matricula), index, anoFinanceiro));

    const debtCount = future
      ? 0
      : students.filter((aluno) => {
          const summary = summarizeStudentBilling(aluno, pagamentos, monthEnd);
          return summary.status === 'atrasado' || summary.status === 'hoje';
        }).length;

    return {
      id: mes,
      monthIndex: index,
      label: mes,
      shortLabel: mes.slice(0, 3),
      future,
      active: mesFinanceiro === mes,
      isCurrent: anoFinanceiro === hojeReferencia.getFullYear() && index === hojeReferencia.getMonth(),
      count: students.length,
      newCount: fresh.length,
      debtCount,
      monthStart,
      monthEnd,
    };
  }).filter((month) => !month.future);

  const alunosNoPeriodo = periodoSelecionadoFuturo
    ? []
    : alunos.filter((aluno) => {
        const enrollment = parseFlexibleDate(aluno.data_matricula);
        return enrollment ? enrollment.getTime() <= referenciaFinanceira.getTime() : true;
      });

  const resumosHistoricoMensal = alunosNoPeriodo.map((aluno) => {
    const resumo = summarizeStudentBilling(aluno, pagamentos, referenciaFinanceira);
    const dataMatricula = parseFlexibleDate(aluno.data_matricula);
    const entrouNesteMes = isSameMonthAndYear(dataMatricula, mesFinanceiroIndex, anoFinanceiro);
    const origem = entrouNesteMes
      ? `Novo em ${mesFinanceiro}`
      : `Migrado de ${MONTH_OPTIONS[(mesFinanceiroIndex + 11) % 12]}`;

    return {
      aluno,
      resumo,
      dataMatricula,
      entrouNesteMes,
      origem,
    };
  });

  const alunosPausados = resumosFinanceiros.filter(({ aluno }) => isPausedStatus(aluno.status));
  const alunosBloqueados = resumosFinanceiros.filter(({ aluno }) => isBlockedStatus(aluno.status));
  const alunosAtivos = resumosFinanceiros.filter(({ aluno }) => isOperationallyActive(aluno.status));
  const alunosEmDivida = alunosAtivos.filter(({ resumo }) => resumo.status === 'atrasado' || resumo.status === 'hoje');
  const alunosComPagamentoEmDia = alunosAtivos.filter(({ resumo }) => ['pago', 'alerta', 'pendente', 'critico'].includes(resumo.status));
  const pagamentosDoPeriodo = pagamentos.filter((pagamento) => isPaymentInsideMonth(pagamento, mesFinanceiro, anoFinanceiro));
  const totalRecebidoPeriodo = pagamentosDoPeriodo.reduce((acc, pagamento) => acc + normalizeAmount(pagamento.valor), 0);
  const previsaoRecuperacao = alunosEmDivida.reduce((acc, { aluno }) => acc + normalizeAmount(aluno.plano), 0);
  const cobrancasParaHoje = alunosAtivos.filter(({ resumo }) => resumo.status === 'hoje').length;
  const alunosInscritosHoje = alunos.filter((aluno) => {
    const enrollment = parseFlexibleDate(aluno.data_matricula);
    if (!enrollment) return false;
    return formatPtDate(enrollment) === formatPtDate(hojeReferencia);
  }).length;
  const cobrancasCriticas = alunosAtivos.filter(({ resumo }) => ['hoje', 'critico'].includes(resumo.status)).length;
  const mesAtualOperacional = `${hojeReferencia.getFullYear()}-${String(hojeReferencia.getMonth() + 1).padStart(2, '0')}`;
  const backupMensalPendente = backupReminderEnabled && ultimoBackupMes !== mesAtualOperacional;
  const homeAlerts = [
    {
      id: 'vence-hoje',
      label: 'Vencem hoje',
      value: cobrancasParaHoje,
      detail: cobrancasParaHoje > 0 ? 'pedem acção agora' : 'sem urgências hoje',
      tone: cobrancasParaHoje > 0 ? 'border-[#F6D3CF] bg-[#FFF1F0] text-[#B91C1C]' : 'border-[var(--border)] bg-[var(--color-secondary-lighter)]/35 text-[var(--text-secondary)]',
      action: () => {
        setAba('gestao');
        setFiltroStatus('divida');
      },
    },
    {
      id: 'inscritos-hoje',
      label: 'Inscritos hoje',
      value: alunosInscritosHoje,
      detail: alunosInscritosHoje > 0 ? 'novas entradas no sistema' : 'sem novas matrículas hoje',
      tone: alunosInscritosHoje > 0 ? 'border-[#D7E6FF] bg-[#F2F7FF] text-[#1D4ED8]' : 'border-[var(--border)] bg-[var(--color-secondary-lighter)]/35 text-[var(--text-secondary)]',
      action: () => setAba('gestao'),
    },
    {
      id: 'atrasados',
      label: 'Em atraso',
      value: alunosEmDivida.length,
      detail: alunosEmDivida.length > 0 ? 'alunos com cobrança vencida' : 'nenhum aluno em atraso',
      tone: alunosEmDivida.length > 0 ? 'border-[#F6D3CF] bg-[#FFF1F0] text-[#B91C1C]' : 'border-[var(--border)] bg-[var(--color-secondary-lighter)]/35 text-[var(--text-secondary)]',
      action: () => {
        setAba('gestao');
        setFiltroStatus('divida');
      },
    },
    {
      id: 'backup',
      label: 'Backup mensal',
      value: backupMensalPendente ? 1 : 0,
      detail: backupMensalPendente ? 'dossier deste mês ainda por exportar' : 'rotina mensal em dia',
      tone: backupMensalPendente ? 'border-[#F3DFC1] bg-[#FFF7E8] text-[#B45309]' : 'border-[var(--border)] bg-[var(--color-secondary-lighter)]/35 text-[var(--text-secondary)]',
      action: () => {
        setAba('configuracoes');
        setConfigAba('operacao');
      },
    },
  ];
  const novosInscritosRecentes = [...alunos]
    .sort((left, right) => {
      const leftDate = parseFlexibleDate(left.data_matricula)?.getTime() || 0;
      const rightDate = parseFlexibleDate(right.data_matricula)?.getTime() || 0;
      return rightDate - leftDate;
    })
    .slice(0, 6);
  const generoStats = alunos.reduce(
    (acc, aluno) => {
      const bucket = getGenderBucket(aluno.sexo);
      acc[bucket] += 1;
      return acc;
    },
    { masculino: 0, feminino: 0, nao_definido: 0 }
  );
  const totalGenero = generoStats.masculino + generoStats.feminino + generoStats.nao_definido;

  const pagamentosPorAlunoNoPeriodo = alunosAtivos
    .map(({ aluno }) => {
      const total = pagamentosDoPeriodo
        .filter((pagamento) => (pagamento.aluno_id || pagamento.alunoId) === aluno.id)
        .reduce((acc, pagamento) => acc + normalizeAmount(pagamento.valor), 0);

      return { aluno, total };
    })
    .filter((item) => item.total > 0)
    .sort((left, right) => right.total - left.total);

  const historicoPagamentosOrdenado = [...historicoPagamentos].sort((left, right) => (right.id || 0) - (left.id || 0));

  const abrirResolverPendencias = (aluno: any) => {
    const summary = summarizeStudentBilling(aluno, pagamentos);
    setAlunoParaResolver(aluno);
    setMesesParaResolver(summary.monthsInDebt);
    setMostrarResolverPendencias(true);
  };

  const resolverPendencias = async () => {
    if (!alunoParaResolver || !mesesParaResolver.length) return;
    
    setCarregando(true);
    try {
      let currentDueDate = parseFlexibleDate(alunoParaResolver.vencimento) || new Date();
      
      for (const mes of mesesParaResolver) {
        const dataPagamento = formatPtDate(new Date());
        const janela = buildCoverageWindow(dataPagamento, formatPtDate(currentDueDate));
        
        const novoPagamento = {
          alunoId: alunoParaResolver.id,
          valor: String(normalizeAmount(alunoParaResolver.plano)),
          status: 'pago',
          data_pagamento: dataPagamento,
          metodo_pagamento: 'Dinheiro',
          mes_referencia: mes,
          referencia_inicio: janela.coverageStart,
          referencia_fim: janela.coverageEnd
        };

        if (window.electron) {
          await window.electron.ipcRenderer.invoke('add-pagamento', novoPagamento);
        }
        
        // Projetar próximo vencimento para o próximo loop ou para o estado final
        currentDueDate = parseFlexibleDate(janela.nextChargeDate) || new Date();
      }
      
      // Atualizar vencimento final do aluno
      if (window.electron) {
        const alunoAtualizado = {
          ...alunoParaResolver,
          vencimento: formatPtDate(currentDueDate)
        };
        await window.electron.ipcRenderer.invoke('update-aluno-dados', alunoAtualizado);
      }
      
      await carregarDados();
      setMostrarResolverPendencias(false);
      abrirNotificacao('sucesso', 'Regularização concluída', `Foram regularizados ${mesesParaResolver.length} meses para ${alunoParaResolver.nome}.`);
    } catch (err) {
      console.error(err);
      abrirNotificacao('erro', 'Falha ao resolver', 'Ocorreu um erro ao processar os pagamentos.');
    } finally {
      setCarregando(false);
    }
  };

  const resumoAlunoSelecionado = alunoSelecionado ? summarizeStudentBilling(alunoSelecionado, pagamentos) : null;
  const resumoAlunoParaPagamento = alunoParaPagamento ? summarizeStudentBilling(alunoParaPagamento, pagamentos) : null;
  const previewPagamento = alunoParaPagamento
    ? buildCoverageWindow(
        formatPtDate(parseDate(pagamentoForm.dataPagamento)),
        alunoParaPagamento.vencimento
      )
    : null;

  // Sistema Inteligente de Verificação de Inadimplência (Movido para após definições de estado)
  useEffect(() => {
    if (alunos.length > 0 && !localStorage.getItem(`nl_checked_unpaid_${mesFinanceiro}`)) {
       if (alunosEmDivida.length > 0) {
          adicionarNotificacao(
            'Alerta de Pagamentos', 
            `Existem ${alunosEmDivida.length} alunos com cobrança vencida neste momento.`, 
            'alerta'
          );
          localStorage.setItem(`nl_checked_unpaid_${mesFinanceiro}`, 'true');
       }
    }
  }, [alunos.length, alunosEmDivida.length, mesFinanceiro]);

  const historicoMensalFiltrado = resumosHistoricoMensal
    .filter(({ aluno, resumo }) => {
      const statusMatch = filtroStatus === 'todos'
        || (filtroStatus === 'divida' && (resumo.status === 'atrasado' || resumo.status === 'hoje'))
        || (filtroStatus === 'cobertos' && (resumo.status === 'pago' || resumo.status === 'em_dia' || resumo.status === 'vence_em_breve'));
      const termo = pesquisa.trim().toLowerCase();
      const pesquisaMatch =
        !termo ||
        aluno.nome.toLowerCase().includes(termo) ||
        aluno.id.toLowerCase().includes(termo) ||
        (aluno.telefone || '').toLowerCase().includes(termo) ||
        (aluno.email || '').toLowerCase().includes(termo) ||
        resumo.statusLabel.toLowerCase().includes(termo);

      return statusMatch && pesquisaMatch;
    })
    .sort((left, right) => {
      const prioridadeLeft = prioridadeResumoAlunos[left.resumo.status as keyof typeof prioridadeResumoAlunos] ?? 99;
      const prioridadeRight = prioridadeResumoAlunos[right.resumo.status as keyof typeof prioridadeResumoAlunos] ?? 99;
      if (prioridadeLeft !== prioridadeRight) return prioridadeLeft - prioridadeRight;
      if (left.entrouNesteMes !== right.entrouNesteMes) return left.entrouNesteMes ? -1 : 1;
      if (left.resumo.daysUntilCharge !== right.resumo.daysUntilCharge) {
        return left.resumo.daysUntilCharge - right.resumo.daysUntilCharge;
      }
      return left.aluno.nome.localeCompare(right.aluno.nome, 'pt-PT');
    });

  const alunosNovosNoPeriodo = resumosHistoricoMensal.filter((item) => item.entrouNesteMes);
  const alunosMigradosNoPeriodo = resumosHistoricoMensal.filter((item) => !item.entrouNesteMes);
  const alunosComCobrancaNoPeriodo = resumosHistoricoMensal.filter(({ resumo }) => resumo.status === 'atrasado' || resumo.status === 'hoje');

  useEffect(() => {
    if (!isLoggedIn) return;
    if (timelineAnnouncementRef.current === periodoSelecionadoKey) return;

    timelineAnnouncementRef.current = periodoSelecionadoKey;

    if (periodoSelecionadoFuturo) {
      showToast(`Historico de ${mesFinanceiro} ${anoFinanceiro} pronto para receber novas matriculas quando o mes chegar.`);
      return;
    }

    const baseMessage = `${resumosHistoricoMensal.length} aluno(s), ${alunosNovosNoPeriodo.length} novos e ${alunosComCobrancaNoPeriodo.length} em cobranca em ${mesFinanceiro} ${anoFinanceiro}.`;
    showToast(baseMessage);

    if (alunosComCobrancaNoPeriodo.length > 0) {
      adicionarNotificacao(
        'Linha do tempo atualizada',
        `${mesFinanceiro.toUpperCase()} ${anoFinanceiro}: ${alunosComCobrancaNoPeriodo.length} aluno(s) exigem acompanhamento financeiro.`,
        'alerta'
      );
      notificarSistema(nomeAcademia, baseMessage);
    }
  }, [
    isLoggedIn,
    periodoSelecionadoKey,
    periodoSelecionadoFuturo,
    mesFinanceiro,
    anoFinanceiro,
    resumosHistoricoMensal.length,
    alunosNovosNoPeriodo.length,
    alunosComCobrancaNoPeriodo.length,
    nomeAcademia,
  ]);

  const [alunosDeletados, setAlunosDeletados] = useState<Aluno[]>([]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\d+$/.test(phone.replace(/[\s\-\(\)\+]/g, ''));

  const carregarConfiguracoes = async () => {
    if (electron) {
      try {
        const lista = await electron.ipcRenderer.invoke('get-alunos', false);
        setAlunos(lista);
        
        const deletados = await electron.ipcRenderer.invoke('get-alunos', true);
        setAlunosDeletados(deletados.filter((a: any) => a.deleted === 1));

        const listaPagamentos = await electron.ipcRenderer.invoke('get-pagamentos');
        setPagamentos(listaPagamentos);
        
        const configs = await electron.ipcRenderer.invoke('get-configuracoes');
        setConfiguracoes(configs);
        
        if (configs.nome_academia) setNomeAcademia(configs.nome_academia);
        if (configs.morada_academia) setMoradaAcademia(configs.morada_academia);
        if (configs.email_academia) setEmailAcademia(configs.email_academia);
        if (configs.telefone_academia) setTelefoneAcademia(configs.telefone_academia);
        if (configs.categorias) setCategorias(JSON.parse(configs.categorias));
        if (configs.theme_color) setThemeColor(configs.theme_color);
        if (configs.app_theme && ['light','dark','claude'].includes(configs.app_theme)) setAppTheme(configs.app_theme as 'light' | 'dark' | 'claude');
        if (configs.banner_academia) setBannerAcademia(configs.banner_academia);
        setDesktopNotificationsEnabled(configs.desktop_notifications !== '0');
        setNotifPagamentos(configs.notif_pagamentos !== '0');
        setNotifMatriculas(configs.notif_matriculas !== '0');
        setNotifSistema(configs.notif_sistema !== '0');
        setNotifRelatorios(configs.notif_relatorios !== '0');
        if (configs.relatorio_mensal_disponivel) setRelatorioMensalDisponivel(configs.relatorio_mensal_disponivel);
        setBackupReminderEnabled(configs.backup_reminder_enabled !== '0');
        if (configs.whatsapp_template) setWhatsappTemplate(configs.whatsapp_template);
        if (configs.ultima_exportacao_operacional) setUltimaExportacaoOperacional(configs.ultima_exportacao_operacional);
        if (configs.ultimo_backup_mes) setUltimoBackupMes(configs.ultimo_backup_mes);
        if (configs.diretorio_backup) setDiretorioBackup(configs.diretorio_backup);

        const setupOk = configs.setup_completed === '1';
        
        if (setupOk) {
          const key = configs.license_key || '';
          const expiry = configs.license_expiry || '';
          setLicencaDados({ chave: key, expiracao: expiry, tipo: configs.tipo_licenca || '' });

          if (!key || !expiry) {
            setLicencaAtiva(false);
          } else {
            // Se tiver expiracao, validar data
            if (expiry.includes('/')) {
              const [d, m, y] = expiry.split('/').map(Number);
              const dataExp = new Date(y, m - 1, d);
              if (dataExp < new Date()) setLicencaAtiva(false);
              else setLicencaAtiva(true);
            } else {
              setLicencaAtiva(true); // Vitalicio ou formato diferente
            }
          }
        } else {
          setLicencaAtiva(true); 
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        // Simular um pequeno delay para o Splash Screen ser visível (estética)
        setTimeout(() => setLoadingConfig(false), 1200);
      }
    }
  };

  const atualizarAplicacao = async () => {
    setSincronizando(true);

    try {
      if (electron) {
        const resultado = await electron.ipcRenderer.invoke('refresh-app');
        if (resultado?.success === false) {
          throw new Error(resultado.message || 'Falha ao atualizar a aplicação.');
        }
        return;
      }

      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao atualizar a aplicação:', error);
      await carregarConfiguracoes();
      setSincronizando(false);
      showToast(error?.message || 'Não foi possível atualizar a aplicação.');
    }
  };


  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listener Global para tecla ESC
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAlunoSelecionado(null);
        setMostrarForm(false);
        setMostrarFormEdicao(false);
        setMostrarSettings(false);
        setMostrarModalPagamento(false);
        setAlunoPerfil(null);
        setMostrarModalExport(false);
        fecharConfirmacao();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Recarregar dados apenas quando a ligação é restaurada (não no arranque)
  const isFirstOnlineRef = useRef(true);
  useEffect(() => {
    if (isFirstOnlineRef.current) {
      isFirstOnlineRef.current = false;
      return;
    }
    if (online && isLoggedIn) {
      carregarConfiguracoes();
    }
  }, [online]);

  useEffect(() => {
    const agora = new Date();
    const monthKey = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
    const lembreteJaMostrado = localStorage.getItem(`nl_backup_alert_${monthKey}`);

    if (!backupReminderEnabled || ultimoBackupMes === monthKey || lembreteJaMostrado) return;

    adicionarNotificacao(
      'Lembrete de Backup Mensal',
      'Recomendado exportar o dossier operacional em Excel e gerar um backup ZIP antes de fechar o mês.',
      'alerta'
    );
    notificarSistema(
      nomeAcademia,
      'Faça o backup mensal: exporte o dossier em Excel e gere o backup ZIP do sistema.'
    );
    localStorage.setItem(`nl_backup_alert_${monthKey}`, '1');
  }, [backupReminderEnabled, ultimoBackupMes, nomeAcademia]);

  // ─── Verificação de relatório mensal disponível ──────────────────────────
  useEffect(() => {
    if (!notifRelatorios || !isLoggedIn) return;
    const agora = new Date();
    const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
    const diaAtual = agora.getDate();
    const mesAnterior = agora.getMonth() === 0 ? 12 : agora.getMonth();
    const anoAnterior = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear();
    const mesesPt = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const chaveRelatorio = `nl_relatorio_notif_${anoAnterior}-${String(mesAnterior).padStart(2,'0')}`;

    if ((diaAtual >= diasNoMes - 1 || diaAtual <= 3) && !localStorage.getItem(chaveRelatorio)) {
      const mesBadge = diaAtual >= diasNoMes - 1
        ? mesesPt[agora.getMonth()]
        : mesesPt[mesAnterior - 1];
      const label = `${mesBadge} ${diaAtual >= diasNoMes - 1 ? agora.getFullYear() : anoAnterior}`;
      setRelatorioMensalDisponivel(label);
      adicionarNotificacao(
        'Relatório Mensal Disponível',
        `O relatório de ${label} está pronto para exportar. Aceda a Alunos e exporte em PDF ou Excel.`,
        'info'
      );
      localStorage.setItem(chaveRelatorio, '1');
    }
  }, [isLoggedIn, notifRelatorios]);

  const salvarConfig = async (chave: string, valor: string) => {
    await guardarConfiguracao(chave, valor);
  };

  const adicionarCategoria = () => {
    if (!novaCategoria.trim()) return;
    const novas = [...categorias, novaCategoria.trim()];
    setCategorias(novas);
    salvarConfig('categorias', JSON.stringify(novas));
    setNovaCategoria('');
  };

  const removerCategoria = (cat: string) => {
    const novas = categorias.filter(c => c !== cat);
    setCategorias(novas);
    salvarConfig('categorias', JSON.stringify(novas));
  };

  const carregarHistorico = async (alunoId: string) => {
    if (electron) {
      const hist = await electron.ipcRenderer.invoke('get-historico-pagamentos', alunoId);
      setHistoricoPagamentos(hist);
    }
  };


  // Auto-carregar utilizadores quando a tab de utilizadores fica visível
  useEffect(() => {
    if (aba !== 'configuracoes' || configAba !== 'utilizadores' || !electron) return;
    electron.ipcRenderer.invoke('users:list').then((res) => {
      if (res?.success) setListaUtilizadores(res.users || []);
    });
  }, [aba, configAba]);

  const resetarBancoDeDados = async () => {
    if (!electron) return;
    try {
      const res = await electron.ipcRenderer.invoke('db:reset');
      if (res.success) {
        showToast('✅ Dados de teste removidos com sucesso.');
        adicionarNotificacao('Limpeza de Sistema', 'Todos os dados de alunos e pagamentos foram removidos.', 'info');
        // Resetar também flag de setup para permitir novo wizard se necessário
        await guardarConfiguracao('setup_completed', '0');
        await carregarConfiguracoes();
        window.location.reload();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      console.error('Erro no reset:', err);
      showToast('❌ Erro ao limpar base de dados.');
    }
  };

  const validarFormatoLicenca = (key: string) => {
    // Formato: NLA-2026-ACADEMIA-001-ABCD1234
    const regex = /^NLA-2026-[A-Z0-9]+-\d{3}-[A-Z0-9]{8}$/;
    return regex.test(key);
  };

  const finalizarSetup = async () => {
    if (!electron) return;

    try {
      // 1. Guardar dados da empresa
      await electron.ipcRenderer.invoke('update-configuracao', 'nome_academia', setupEmpresa.nome);
      await electron.ipcRenderer.invoke('update-configuracao', 'email_academia', setupEmpresa.email);
      await electron.ipcRenderer.invoke('update-configuracao', 'telefone_academia', setupEmpresa.telefone);
      
      // 2. Criar conta admin real (ou atualizar)
      await electron.ipcRenderer.invoke('users:create', {
        name: setupAdmin.name,
        email: setupAdmin.email,
        password: setupAdmin.password,
        role: 'admin'
      });

      // 3. Guardar Licença (Simular 1 ano de validade)
      const dataExp = new Date();
      dataExp.setFullYear(dataExp.getFullYear() + 1);
      const expiryStr = formatPtDate(dataExp);
      
      await electron.ipcRenderer.invoke('update-configuracao', 'license_key', setupLicencaKey);
      await electron.ipcRenderer.invoke('update-configuracao', 'license_expiry', expiryStr);
      
      // 4. Marcar setup como concluído
      await electron.ipcRenderer.invoke('update-configuracao', 'setup_completed', '1');

      adicionarNotificacao('Sistema Configurado', 'A configuração inicial foi concluída com sucesso.', 'sucesso');
      setSetupPasso(5); // Ir para tela de confirmação
    } catch (error: any) {
      console.error('Erro ao finalizar setup:', error);
      showToast(`❌ Falha no setup: ${error.message}`);
    }
  };

  // Auto-carregar logs quando a tab de auditoria (operacao) fica visível
  useEffect(() => {
    if (aba !== 'configuracoes' || configAba !== 'operacao') return;
    carregarLogs();
  }, [aba, configAba]);

  const registrarPagamento = async () => {
    if (!alunoParaPagamento) return;

    // Validações
    if (!pagamentoForm.valor || normalizeAmount(pagamentoForm.valor) <= 0) {
      showToast('❌ Valor inválido. Insira um valor maior que zero.');
      return;
    }
    if (!pagamentoForm.dataPagamento) {
      showToast('❌ Data de pagamento é obrigatória.');
      return;
    }

    try {
      const dataPagamento = formatPtDate(parseDate(pagamentoForm.dataPagamento));
      const janelaCobranca = buildCoverageWindow(dataPagamento, alunoParaPagamento.vencimento);
      const valorPagamento = String(
        normalizeAmount(pagamentoForm.valor) || normalizeAmount(alunoParaPagamento.plano) || 1000
      );
      
      const novoPagamento: Pagamento = {
        alunoId: alunoParaPagamento.id,
        valor: valorPagamento,
        status: 'pago',
        data_pagamento: dataPagamento,
        metodo_pagamento: pagamentoForm.metodo,
        mes_referencia: janelaCobranca.monthReference,
        referencia_inicio: janelaCobranca.coverageStart,
        referencia_fim: janelaCobranca.coverageEnd,
      };

      if (electron) {
        // Atualizar pagamento
        await electron.ipcRenderer.invoke('add-pagamento', novoPagamento);
        
        // Atualizar vencimento do aluno para a próxima cobrança do ciclo real.
        const alunoAtualizado = {
          ...alunoParaPagamento,
          vencimento: janelaCobranca.nextChargeDate,
          modo_cobranca: 'mensalidade_movel',
        };
        await electron.ipcRenderer.invoke('update-aluno-dados', alunoAtualizado);
        adicionarNotificacao('Pagamento Registado', `Pagamento de ${alunoParaPagamento.nome} (${novoPagamento.mes_referencia}) foi registado com sucesso.`, 'sucesso');
        await notificarSistema(nomeAcademia, `Pagamento de ${alunoParaPagamento.nome} registado com sucesso.`);

        setUltimoPagamentoInfo({ valor: valorPagamento, mes: janelaCobranca.monthReference });
        setPagamentoSucesso(true);
        if (alunoSelecionado?.id === alunoParaPagamento.id) {
          carregarHistorico(alunoParaPagamento.id);
        }
        await carregarConfiguracoes(); // Sincronização garantida
      }
    } catch (error) {
      console.error('Erro ao registar pagamento:', error);
      showToast('❌ Erro ao registar pagamento no sistema.');
    }
  };

  const gerarRecibo = (p: Pagamento, alunoNome: string) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150] // Tamanho personalizado para recibo
    });

    doc.setFontSize(14);
    doc.text(nomeAcademia, 50, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('RECIBO DE PAGAMENTO', 50, 22, { align: 'center' });
    
    doc.line(10, 25, 90, 25);
    
    doc.text(`Nº Recibo: #00${p.id || '---'}`, 10, 35);
    doc.text(`Data: ${p.data_pagamento}`, 10, 42);
    doc.text(`Aluno: ${alunoNome}`, 10, 52);
    doc.text(`Referente a: ${p.mes_referencia}`, 10, 59);
    doc.text(`Método: ${p.metodo_pagamento}`, 10, 66);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`VALOR: ${p.valor}`, 10, 80);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Obrigado pela preferência!', 50, 100, { align: 'center' });
    doc.text('Next Level System', 50, 105, { align: 'center' });

    doc.save(`recibo-${alunoNome}-${p.mes_referencia}.pdf`);
  };

  const carregarLogs = async () => {
    if (electron) {
      const listaLogs = await electron.ipcRenderer.invoke('get-logs');
      setLogs(listaLogs);
    }
  };

  const selecionarDiretorioBackup = async () => {
    if (electron) {
      const res = await electron.ipcRenderer.invoke('select-directory');
      if (res.success) {
        setDiretorioBackup(res.path);
        await electron.ipcRenderer.invoke('update-configuracao', 'diretorio_backup', res.path);
        showToast('Diretório de backups atualizado com sucesso.');
      }
    }
  };

  const gerarBackup = async () => {
    if (electron) {
      const res = await electron.ipcRenderer.invoke('export-database', diretorioBackup);
      if (res.success) {
        showToast('Backup ZIP exportado com sucesso.');
        adicionarNotificacao('Backup concluído', `Backup exportado para ${res.path}`, 'sucesso');
        await notificarSistema(nomeAcademia, 'Backup ZIP exportado com sucesso.');
        carregarLogs();
      }
    }
  };

  const exportarDossierOperacional = async () => {
    if (!electron) return;

    const res = await electron.ipcRenderer.invoke('export-operational-report', diretorioBackup);
    if (res?.success) {
      setUltimaExportacaoOperacional(res.path);
      setUltimoBackupMes(res.monthKey);
      showToast('Dossier operacional exportado para Excel.');
      adicionarNotificacao('Exportação mensal pronta', `Ficheiro Excel guardado em ${res.path}`, 'sucesso');
      await notificarSistema(nomeAcademia, 'Dossier operacional mensal exportado para Excel.');
      await carregarConfiguracoes();
      return;
    }

    if (!res?.canceled) {
      showToast(res?.message || 'Não foi possível exportar o dossier operacional.');
    }
  };

  const abrirPastaDoUltimoDossier = async () => {
    if (!electron || !ultimaExportacaoOperacional) return;
    await electron.ipcRenderer.invoke('show-item-in-folder', ultimaExportacaoOperacional);
  };

  const salvarAparencia = async () => {
    await Promise.all([
      guardarConfiguracao('app_logo', appLogo),
      guardarConfiguracao('banner_academia', bannerAcademia),
      guardarConfiguracao('app_theme', appTheme),
    ]);

    localStorage.setItem('nl_app_logo', appLogo);
    localStorage.setItem('nl_banner_academia', bannerAcademia);
    localStorage.setItem('nl_app_theme', appTheme);

    showToast('Aparência guardada com sucesso.');
    adicionarNotificacao('Identidade visual atualizada', 'O logotipo, o banner e o tema foram guardados.', 'sucesso');
  };

  const salvarDefinicoesGerais = async () => {
    await Promise.all([
      guardarConfiguracao('nome_academia', nomeAcademia),
      guardarConfiguracao('subtitulo_academia', subtituloAcademia),
      guardarConfiguracao('morada_academia', moradaAcademia),
      guardarConfiguracao('email_academia', emailAcademia),
      guardarConfiguracao('telefone_academia', telefoneAcademia),
    ]);

    localStorage.setItem('nl_nome_academia', nomeAcademia);
    localStorage.setItem('nl_subtitulo_academia', subtituloAcademia);
    localStorage.setItem('nl_morada_academia', moradaAcademia);
    localStorage.setItem('nl_email_academia', emailAcademia);
    localStorage.setItem('nl_telefone_academia', telefoneAcademia);

    showToast('Definições gerais guardadas.');
    adicionarNotificacao('Definições atualizadas', 'Os dados institucionais foram guardados no sistema.', 'sucesso');
  };

  const salvarPreferenciasNotificacoes = async () => {
    await Promise.all([
      guardarConfiguracao('desktop_notifications', desktopNotificationsEnabled ? '1' : '0'),
      guardarConfiguracao('notif_pagamentos', notifPagamentos ? '1' : '0'),
      guardarConfiguracao('notif_matriculas', notifMatriculas ? '1' : '0'),
      guardarConfiguracao('notif_sistema', notifSistema ? '1' : '0'),
      guardarConfiguracao('notif_relatorios', notifRelatorios ? '1' : '0'),
    ]);
    showToast('Preferências de notificações guardadas.');
    adicionarNotificacao('Notificações', 'Preferências de notificações actualizadas.', 'sucesso');
  };

  const salvarPreferenciasOperacionais = async () => {
    await Promise.all([
      guardarConfiguracao('desktop_notifications', desktopNotificationsEnabled ? '1' : '0'),
      guardarConfiguracao('backup_reminder_enabled', backupReminderEnabled ? '1' : '0'),
      guardarConfiguracao('whatsapp_template', whatsappTemplate),
    ]);

    showToast('Preferências operacionais guardadas.');
    adicionarNotificacao('Preferências guardadas', 'As preferências de notificações e comunicação foram atualizadas.', 'sucesso');
    if (desktopNotificationsEnabled) {
      await electron?.ipcRenderer.invoke('notify-system', {
        title: nomeAcademia,
        body: 'As preferências operacionais foram atualizadas.',
      });
    }
  };

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  useEffect(() => { if (isLoggedIn) carregarConfiguracoes(); }, [isLoggedIn]);

  // Slideshow na tela de login — avança automaticamente
  useEffect(() => {
    if (isLoggedIn || slideshowImages.length === 0) return;
    const interval = setInterval(() => setCurrentSlide(p => (p + 1) % slideshowImages.length), slideshowTimer * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, slideshowImages, slideshowTimer]);

  // Carregar lista de utilizadores para quick access na tela de login
  useEffect(() => {
    if (isLoggedIn || !electron) return;
    const qaIds: number[] = (() => { try { return JSON.parse(localStorage.getItem('nl_quick_access_users') || '[]'); } catch { return []; } })();
    if (qaIds.length === 0) { setLoginSlideshowUsers([]); return; }
    electron.ipcRenderer.invoke('users:list').then((res: any) => {
      if (res?.success) setLoginSlideshowUsers((res.users || []).filter((u: any) => qaIds.includes(u.id) && u.is_active !== 0));
    }).catch(() => {});
  }, [isLoggedIn]);

  // ─── Matricular aluno com lógica inteligente de pagamentos ──────────────
  const salvarAluno = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!novoAluno.nome.trim()) {
      showToast('❌ Nome do aluno é obrigatório.');
      return;
    }
    if (!validatePhone(novoAluno.telefone)) {
      showToast('❌ Telefone inválido. Use apenas números.');
      return;
    }
    if (novoAluno.email && !validateEmail(novoAluno.email)) {
      showToast('❌ Email inválido.');
      return;
    }
    if (!novoAluno.plano || normalizeAmount(novoAluno.plano) <= 0) {
      showToast('❌ Valor do plano inválido.');
      return;
    }

    try {
      const id = `NL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

      const pagouAgora = novoAluno.modo_inscricao === 'matricula_pago';
      const vencimentoBase = calcularVencimentoInteligente(
        novoAluno.data_matricula,
        novoAluno.dia_pagamento,
        pagouAgora
      );
      const janelaPrimeiroPagamento = pagouAgora
        ? buildCoverageWindow(formatPtDate(parseDate(novoAluno.data_matricula)))
        : null;

      const alunoParaSalvar = {
        ...novoAluno,
        id,
        vencimento: pagouAgora ? janelaPrimeiroPagamento?.nextChargeDate : vencimentoBase,
        progresso: 100,
        status: 'ativo',
        modo_cobranca: 'mensalidade_movel',
      };

      if (electron) {
        await electron.ipcRenderer.invoke('add-aluno', alunoParaSalvar);

        // Se pagou na inscrição → registar pagamento imediato
        if (pagouAgora) {
          await electron.ipcRenderer.invoke('add-pagamento', {
            alunoId: id,
            valor: String(normalizeAmount(novoAluno.plano)),
            status: 'pago',
            data_pagamento: formatPtDate(parseDate(novoAluno.data_matricula)),
            metodo_pagamento: DEFAULT_PAYMENT_METHOD,
            mes_referencia: janelaPrimeiroPagamento?.monthReference,
            referencia_inicio: janelaPrimeiroPagamento?.coverageStart,
            referencia_fim: janelaPrimeiroPagamento?.coverageEnd,
          });
          showToast(`✅ ${novoAluno.nome} matriculado e pagamento registado!`);
          adicionarNotificacao('Nova Matrícula', `${novoAluno.nome} foi matriculado e efetuou o primeiro pagamento.`, 'sucesso');
        } else {
          showToast(`✅ ${novoAluno.nome} matriculado com sucesso!`);
          adicionarNotificacao('Nova Matrícula', `${novoAluno.nome} foi matriculado com sucesso.`, 'sucesso');
        }

        setMostrarForm(false);
        setNovoAluno(novoAlunoDefault);
        setExpandirExtras(false);
        await carregarConfiguracoes();
        // Mostrar modal de boas-vindas
        const alunoBoasVindasObj = { ...alunoParaSalvar } as Aluno;
        const msgDefault = `Olá ${novoAluno.nome.split(' ')[0]}! 🎉\n\nBem-vindo à ${nomeAcademia}!\n\nEstamos felizes por te ter connosco. O teu plano está ativo e pronto para usar.\n\nQualquer dúvida, estamos aqui para ajudar!\n\nAbraços,\nEquipa da ${nomeAcademia}`;
        setMsgBoasVindas(msgDefault);
        setAlunoBoasVindas(alunoBoasVindasObj);
        setMostrarBoasVindas(true);
      }
    } catch (error) {
      console.error('Erro ao salvar aluno:', error);
      showToast('❌ Erro ao salvar matrícula no sistema.');
    }
  };

  // Função para abrir edição
  const abrirEdicao = (aluno: Aluno) => {
    setAlunoEdicao(aluno);
    setNovoAluno({
      nome: aluno.nome,
      telefone: aluno.telefone,
      email: aluno.email || '',
      sexo: aluno.sexo || '',
      data_nascimento: aluno.data_nascimento || '',
      morada: aluno.morada || '',
      alergias: aluno.alergias || '',
      objetivos: aluno.objetivos || '',
      horario_preferido: aluno.horario_preferido || '',
      plano: aluno.plano,
      vencimento: aluno.vencimento,
      data_matricula: aluno.data_matricula || new Date().toISOString().split('T')[0],
      categoria: aluno.categoria || '',
      modo_cobranca: aluno.modo_cobranca || 'mensalidade_movel'
    });
    setMostrarFormEdicao(true);
    setMostrarForm(false);
    setAlunoSelecionado(null);
    setMenuAlunoAberto(null);
  };

  // Função para salvar edição
  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoEdicao) return;

    // Validações
    if (!novoAluno.nome.trim()) {
      showToast('❌ Nome do aluno é obrigatório.');
      return;
    }
    if (!validatePhone(novoAluno.telefone)) {
      showToast('❌ Telefone inválido. Use apenas números.');
      return;
    }
    if (novoAluno.email && !validateEmail(novoAluno.email)) {
      showToast('❌ Email inválido.');
      return;
    }
    if (!novoAluno.plano || normalizeAmount(novoAluno.plano) <= 0) {
      showToast('❌ Valor do plano inválido.');
      return;
    }
    
    try {
      const alunoAtualizado = {
        ...alunoEdicao,
        ...novoAluno
      };

      if (electron) {
        await electron.ipcRenderer.invoke('update-aluno-dados', alunoAtualizado);
        showToast('✅ Dados do aluno atualizados com sucesso!');
        setMostrarFormEdicao(false);
        setAlunoEdicao(null);
        setNovoAluno(novoAlunoDefault);
        await carregarConfiguracoes();
      }
    } catch (error) {
      console.error('Erro ao editar aluno:', error);
      showToast('❌ Erro ao guardar as alterações.');
    }
  };

  // Funções da Central de Contactos
  const carregarNotas = async (alunoId: string) => {
    if (electron) {
      const notas = await electron.ipcRenderer.invoke('get-notas', alunoId);
      setNotasContacto(notas);
    }
  };

  const enviarMensagemWhatsApp = (aluno: Aluno) => {
    const telefone = (aluno.telefone || '').replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      whatsappTemplate
        .replace(/\{nome\}/gi, aluno.nome || '')
        .replace(/\{plano\}/gi, aluno.plano || '')
        .replace(/\{vencimento\}/gi, aluno.vencimento || '')
        .replace(/\{academia\}/gi, nomeAcademia)
    );
    window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
  };

  const adicionarNota = async () => {
    if (!alunoPerfil || !novaNota.trim()) return;
    if (electron) {
      await electron.ipcRenderer.invoke('add-nota', { alunoId: alunoPerfil.id, texto: novaNota });
      setNovaNota('');
      carregarNotas(alunoPerfil.id);
    }
  };

  const eliminarNota = async (notaId: number) => {
    if (electron) {
      await electron.ipcRenderer.invoke('delete-nota', notaId);
      if (alunoPerfil) carregarNotas(alunoPerfil.id);
    }
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !alunoPerfil) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (electron) {
        const result = await electron.ipcRenderer.invoke('upload-foto', { 
          alunoId: alunoPerfil.id, 
          base64Data 
        });
        if (result.success) {
          const alunoAtualizado = { ...alunoPerfil, foto_path: result.path };
          setAlunoPerfil(alunoAtualizado);
          carregarConfiguracoes();
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (!base64Data) return;

      setBannerAcademia(base64Data);
      localStorage.setItem('nl_banner_academia', base64Data);
      await guardarConfiguracao('banner_academia', base64Data);
      showToast('Banner da academia atualizado.');
      adicionarNotificacao('Banner atualizado', 'A imagem principal da home foi atualizada.', 'sucesso');
    };
    reader.readAsDataURL(file);
  };

  // Função para eliminar aluno
  const eliminarAluno = async (id: string) => {
    const aluno = alunos.find(a => a.id === id);
    abrirConfirmacao({
      title: 'Remover registo do aluno',
      message: `Tens a certeza que desejas remover o aluno ${aluno?.nome}? Os dados ficarão arquivados no sistema.`,
      confirmLabel: 'Remover registo',
      tone: 'danger',
      onConfirm: async () => {
        if (electron) {
          try {
            const res = await electron.ipcRenderer.invoke('delete-aluno', id);
            if (res.success) {
              showToast('✅ Aluno movido para os registos (Lixeira).');
              setMenuAlunoAberto(null);
              if (alunoPerfil?.id === id) setAlunoPerfil(null);
              if (alunoSelecionado?.id === id) setAlunoSelecionado(null);
              await carregarConfiguracoes();
            }
          } catch (error) {
            showToast('❌ Erro ao remover aluno.');
          }
        }
      },
    });
  };

  // Função para alterar status
  const alterarStatus = async (alunoId: string, novoStatus: string) => {
    if (electron) {
      try {
        await electron.ipcRenderer.invoke('update-aluno-status', alunoId, novoStatus);
        const aluno = alunos.find(a => a.id === alunoId);
        if (aluno) {
          const statusLabel = getStudentStatusLabel(novoStatus).toUpperCase();
          adicionarNotificacao('Alteração de Status', `O aluno ${aluno.nome} agora está ${statusLabel}.`, isPausedStatus(novoStatus) ? 'alerta' : 'info');
          if (alunoPerfil?.id === alunoId) {
            setAlunoPerfil({ ...aluno, status: novoStatus });
          }
        }
        setMenuAlunoAberto(null);
        await carregarConfiguracoes();
        showToast(`Status atualizado para: ${novoStatus}`);
      } catch (error) {
        showToast('❌ Erro ao atualizar status.');
      }
    }
  };

  // Função unificada de ordenação inteligente (Termométrica)
  const ordenacaoInteligente = (a: any, b: any) => {
    const statusA = calcularStatusVencimento((a.vencimento || ''));
    const statusB = calcularStatusVencimento(b.vencimento);
    const prioridade = { 'atrasado': 0, 'hoje': 1, 'critico': 2, 'pendente': 3, 'alerta': 4, 'pago': 5, 'pausado': 6, 'suspenso': 6, 'bloqueado': 7 };
    const pA = (isBlockedStatus(a.status) || isPausedStatus(a.status)) ? prioridade[a.status as keyof typeof prioridade] : prioridade[statusA.status as keyof typeof prioridade];
    const pB = (isBlockedStatus(b.status) || isPausedStatus(b.status)) ? prioridade[b.status as keyof typeof prioridade] : prioridade[statusB.status as keyof typeof prioridade];
    if (pA !== pB) return (pA ?? 99) - (pB ?? 99);
    return statusA.diffDays - statusB.diffDays;
  };

  const ordenarAlunosPorModo = (lista: Aluno[], modo: StudentSortMode) => {
    const ordered = [...lista];

    if (modo === 'alfabetica') {
      return ordered.sort((left, right) => left.nome.localeCompare(right.nome, 'pt-PT'));
    }

    if (modo === 'inscricao_recente') {
      return ordered.sort((left, right) => {
        const leftDate = parseFlexibleDate(left.data_matricula)?.getTime() || 0;
        const rightDate = parseFlexibleDate(right.data_matricula)?.getTime() || 0;
        return rightDate - leftDate;
      });
    }

    if (modo === 'inscricao_antiga') {
      return ordered.sort((left, right) => {
        const leftDate = parseFlexibleDate(left.data_matricula)?.getTime() || 0;
        const rightDate = parseFlexibleDate(right.data_matricula)?.getTime() || 0;
        return leftDate - rightDate;
      });
    }

    return ordered.sort(ordenacaoInteligente);
  };

  // Cores pastéis leves para separação visual nas listas
  const coresPasteis = [
    { bg: 'bg-[#EEF4FF]', border: 'border-[#C7DEFF]' }, // azul-índigo suave
    { bg: 'bg-[#F0FDF5]', border: 'border-[#BBF7D0]' }, // menta fresca
    { bg: 'bg-[#FEF9EE]', border: 'border-[#FDE68A]' }, // âmbar mel
    { bg: 'bg-[#FDF4FF]', border: 'border-[#E9D5FF]' }, // lavanda leve
    { bg: 'bg-[#FFF1F2]', border: 'border-[#FECDD3]' }, // rosa pêssego
    { bg: 'bg-[#F0FDFA]', border: 'border-[#99F6E4]' }, // água turquesa
  ];
  const obterTomPastel = (index: number) => coresPasteis[index % coresPasteis.length];

  const alunosFiltradosOrdenados = resumosFinanceiros
    .filter(({ aluno, resumo }) => {
      const statusMatch = filtroStatus === 'todos'
        || (filtroStatus === 'divida' && (resumo.status === 'atrasado' || resumo.status === 'hoje'))
        || (filtroStatus === 'cobertos' && (resumo.status === 'pago' || resumo.status === 'em_dia' || resumo.status === 'vence_em_breve'));
      const termo = pesquisa.trim().toLowerCase();
      const pesquisaMatch =
        !termo ||
        aluno.nome.toLowerCase().includes(termo) ||
        aluno.id.toLowerCase().includes(termo) ||
        (aluno.telefone || '').toLowerCase().includes(termo) ||
        (aluno.email || '').toLowerCase().includes(termo);

      return statusMatch && pesquisaMatch;
    })
    .sort((left, right) => {
      const prioridadeLeft = prioridadeResumoAlunos[left.resumo.status as keyof typeof prioridadeResumoAlunos] ?? 99;
      const prioridadeRight = prioridadeResumoAlunos[right.resumo.status as keyof typeof prioridadeResumoAlunos] ?? 99;
      if (prioridadeLeft !== prioridadeRight) return prioridadeLeft - prioridadeRight;
      if (left.resumo.daysUntilCharge !== right.resumo.daysUntilCharge) {
        return left.resumo.daysUntilCharge - right.resumo.daysUntilCharge;
      }
      return left.aluno.nome.localeCompare(right.aluno.nome, 'pt-PT');
    });

  // alunosDirectorio uses the same period-filtered base as the Alunos page
  const alunosDirectorio = ordenarAlunosPorModo(
    alunosNoPeriodo.filter((aluno) => {
      const statusMatch =
        filtroDirectorioStatus === 'todos'
          ? !isBlockedStatus(aluno.status)
          : filtroDirectorioStatus === 'ativos'
            ? isOperationallyActive(aluno.status)
            : filtroDirectorioStatus === 'pausados'
              ? isPausedStatus(aluno.status)
              : isBlockedStatus(aluno.status);

      const termo = pesquisaDirectorio.trim().toLowerCase();
      const pesquisaMatch = !termo
        || aluno.nome.toLowerCase().includes(termo)
        || (aluno.telefone || '').toLowerCase().includes(termo)
        || (aluno.email || '').toLowerCase().includes(termo)
        || aluno.id.toLowerCase().includes(termo);

      return statusMatch && pesquisaMatch;
    }),
    ordenacaoDirectorio
  );

  // Cálculos das Métricas
  const totalAlunos = alunos.length;
  const mensalidadesPendentes = alunosEmDivida.length;
  
  const receitaPrevista = alunos.reduce((acc, a) => {
    if (!isOperationallyActive(a.status)) return acc;
    return acc + normalizeAmount(a.plano);
  }, 0);

  const marcarComoPago = (alunoId: string) => {
    const aluno = alunos.find(a => a.id === alunoId);
    if (aluno) {
      setAlunoParaPagamento(aluno);
      setPagamentoForm({
        valor: String(normalizeAmount(aluno.plano) || ''),
        dataPagamento: formatInputDate(),
        metodo: DEFAULT_PAYMENT_METHOD,
      });
      setAlunoSelecionado(null);
      setMostrarModalPagamento(true);
    }
  };



  const exportarPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const dataHoje = new Date().toLocaleDateString('pt-PT');

    // ── Cabeçalho da academia ────────────────────────────────────────────
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 42, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text((nomeAcademia || 'Academia').toUpperCase(), 14, 16);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    if (moradaAcademia) doc.text(moradaAcademia, 14, 24);
    const contactoLinha = [telefoneAcademia && `T: ${telefoneAcademia}`, emailAcademia && `E: ${emailAcademia}`].filter(Boolean).join('  |  ');
    if (contactoLinha) doc.text(contactoLinha, 14, 30);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(`RELATÓRIO DE MENSALIDADES · Gerado em ${dataHoje}`, 14, 38);

    // ── Tabela ───────────────────────────────────────────────────────────
    autoTable(doc, {
      startY: 52,
      head: [['Aluno', 'Mês Ref.', 'Valor', 'Método', 'Estado', 'Data Pagamento']],
      body: pagamentos.map(p => [
        p.nome || 'N/A',
        p.mes_referencia || '—',
        formatCve(p.valor),
        p.metodo_pagamento || '—',
        (p.status || '').toUpperCase(),
        p.data_pagamento || '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [17, 24, 39], fontSize: 8, fontStyle: 'bold', textColor: [255,255,255] },
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: { 2: { halign: 'right' }, 4: { halign: 'center' } },
    });

    // ── Rodapé NEXT Lab ──────────────────────────────────────────────────
    const totalPags = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPags; i++) {
      doc.setPage(i);
      doc.setFillColor(249, 250, 251);
      doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado por NEXT Lab · ${COMPANY_WEBSITE} · ${COMPANY_EMAIL} · ${COMPANY_PHONE}`, 14, pageHeight - 5);
      doc.text(`Página ${i} de ${totalPags}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
    }

    doc.save(`relatorio-mensalidades-${dataHoje.replace(/\//g,'-')}.pdf`);
  };

  const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !electron) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      let importados = 0;
      let rejeitados = 0;

      for (const item of data) {
        const nome = item.Nome || item.nome || '';
        const telefone = String(item.Telefone || item.telefone || '');
        if (!nome.trim() || !telefone.trim()) { rejeitados++; continue; }

        const id = `IMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
        const aluno = {
          id,
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: item.Email || item.email || '',
          vencimento: item.Vencimento || item.vencimento || formatPtDate(new Date()),
          plano: item.Plano || item.plano || '1000',
          status: 'ativo',
          categoria: item.Categoria || item.categoria || 'Geral',
          data_matricula: item['Data de Matrícula'] || item.data_matricula || new Date().toISOString().split('T')[0],
          modo_cobranca: 'mensalidade_movel',
        };
        await electron.ipcRenderer.invoke('add-aluno', aluno);
        importados++;
      }
      const msg = rejeitados > 0
        ? `${importados} importados. ${rejeitados} rejeitados (nome ou telefone em falta).`
        : `${importados} contactos importados com sucesso!`;
      showToast(msg);
      adicionarNotificacao('Importação concluída', msg, rejeitados > 0 ? 'alerta' : 'sucesso');
      carregarConfiguracoes();
    };
    reader.readAsBinaryString(file);
  };

  const handleExportarExcelContactos = () => {
    const dataToExport = alunos.map(a => ({
      ID: a.id,
      Nome: a.nome,
      Telefone: a.telefone,
      Email: a.email || '',
      Plano: a.plano,
      Vencimento: (a.vencimento || ''),
      Categoria: a.categoria || 'Geral',
      Status: a.status.toUpperCase()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contactos_CRM");
    XLSX.writeFile(workbook, `CRM-Export-${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportarFinancasExcel = () => {
    const dadosExcel = alunosAtivos.map(({ aluno, resumo }) => {
      const pagamentoPeriodo = pagamentosDoPeriodo
        .filter((pagamento) => (pagamento.aluno_id || pagamento.alunoId) === aluno.id)
        .sort((left, right) => (right.id || 0) - (left.id || 0))[0];

      return {
        'ID Aluno': aluno.id,
        'Nome': aluno.nome,
        'Plano / Valor': formatCve(aluno.plano),
        'Estado Financeiro Atual': resumo.status.toUpperCase(),
        'Próxima Cobrança': resumo.nextChargeDate,
        'Cobertura Atual': resumo.coverageEnd ? `${resumo.coverageStart} até ${resumo.coverageEnd}` : 'Sem cobertura ativa',
        'Pago no Período': pagamentoPeriodo ? 'SIM' : 'NÃO',
        'Data do Pagamento no Período': pagamentoPeriodo?.data_pagamento || '-',
        'Valor Pago no Período': pagamentoPeriodo ? formatCve(pagamentoPeriodo.valor) : '-',
        'Período Financeiro': `${mesFinanceiro.toUpperCase()} ${anoFinanceiro}`
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financas');
    XLSX.writeFile(workbook, `Financas-${mesFinanceiro}-${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportarExcel = () => {
    const dataToExport = alunos.map(a => {
      const row: any = {};
      if (exportConfig.colunas.includes('nome')) row['Nome'] = a.nome;
      if (exportConfig.colunas.includes('telefone')) row['Telefone'] = a.telefone;
      if (exportConfig.colunas.includes('plano')) row['Plano'] = a.plano;
      if (exportConfig.colunas.includes('vencimento')) row['Vencimento'] = (a.vencimento || '');
      if (exportConfig.colunas.includes('status')) row['Status'] = a.status.toUpperCase();
      if (exportConfig.colunas.includes('categoria')) row['Categoria'] = a.categoria || 'Geral';
      if (exportConfig.colunas.includes('email')) row['Email'] = a.email || 'N/A';
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lista_Alunos");
    
    if (exportConfig.incluirCabecalho) {
      const headerRows = [
        [nomeAcademia.toUpperCase()],
        [`Morada: ${moradaAcademia}`],
        [`Telefone: ${telefoneAcademia} | Email: ${emailAcademia}`],
        [""] // Linha em branco
      ];
      XLSX.utils.sheet_add_aoa(worksheet, headerRows, { origin: "A1" });
    }

    XLSX.writeFile(workbook, `${nomeAcademia.replace(/\s+/g, '_')}_Export.xlsx`);
    setMostrarModalExport(false);
  };

  const exportarRelatorioExcel = () => {
    const mesIdx = MONTH_OPTIONS.indexOf(mesRelatorio);
    const refRel = new Date(anoRelatorio, mesIdx + 1, 0);
    const alunosRel = [...alunos]
      .filter(a => { const e = parseFlexibleDate(a.data_matricula); return e ? e.getTime() <= refRel.getTime() : true; })
      .sort((a, b) => a.nome.localeCompare(b.nome));

    const rows = alunosRel.map((a, idx) => {
      const resumo = summarizeStudentBilling(a, pagamentos, refRel);
      return {
        '#': idx + 1,
        'Nome': a.nome,
        'Telefone': a.telefone || '',
        'Plano (CVE)': normalizeAmount(a.plano),
        'Modalidade': a.modalidade || 'Musculação',
        'Estado': getBillingBadgeLabel(resumo.status),
        'Próx. Vencimento': resumo.nextChargeDate || '',
        'Cobertura até': resumo.coverageEnd || '',
        'Último Pagamento': resumo.lastPaymentDate || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${mesRelatorio}_${anoRelatorio}`);

    const receitaMesExp = pagamentos.filter(p => isPaymentInsideMonth(p, mesRelatorio, anoRelatorio)).reduce((s, p) => s + normalizeAmount(p.valor), 0);
    const resumoRows = [
      [],
      ['RESUMO FINANCEIRO', '', `${mesRelatorio.toUpperCase()} ${anoRelatorio}`],
      ['Total Inscritos', alunosRel.length],
      ['Receita Cobrada (CVE)', receitaMesExp],
      ['Gerado em', new Date().toLocaleString('pt-PT')],
    ];
    XLSX.utils.sheet_add_aoa(worksheet, resumoRows, { origin: -1 });

    XLSX.writeFile(workbook, `Relatorio_${nomeAcademia.replace(/\s+/g,'_')}_${mesRelatorio}_${anoRelatorio}.xlsx`);
    showToast(`Relatório ${mesRelatorio} ${anoRelatorio} exportado.`);
  };

  const exportarPDFPersonalizado = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Cabeçalho Profissional Integrado
    if (exportConfig.incluirCabecalho) {
       doc.setFillColor(17, 24, 39); // Gray-900
       doc.rect(0, 0, pageWidth, 45, 'F');
       
       doc.setTextColor(255, 255, 255);
       doc.setFontSize(22);
       doc.text(nomeAcademia.toUpperCase(), 14, 20);
       
       doc.setFontSize(9);
       doc.setTextColor(156, 163, 175); // Gray-400
       doc.text(`${moradaAcademia}`, 14, 28);
       doc.text(`T: ${telefoneAcademia} | E: ${emailAcademia}`, 14, 34);
       
       doc.setTextColor(255, 255, 255);
       doc.setFontSize(7);
       doc.text(`RELATÓRIO ADMINISTRATIVO - ${new Date().toLocaleDateString()}`, 14, 40);
    } else {
       doc.setFontSize(14);
       doc.text(`Lista de Alunos - ${nomeAcademia}`, 14, 15);
    }

    const colunasSelecionadas = exportConfig.colunas;
    const headers = colunasSelecionadas.map(c => c.toUpperCase());
    
    const body = alunos.map(a => colunasSelecionadas.map(col => {
      if (col === 'status') return a.status.toUpperCase();
      return (a as any)[col] || 'N/A';
    }));

    autoTable(doc, {
      startY: exportConfig.incluirCabecalho ? 55 : 25,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [17, 24, 39], fontSize: 8, fontStyle: 'bold', textColor: [255,255,255] },
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });

    // ── Rodapé NEXT Lab ──────────────────────────────────────────────────
    const pgTotal = (doc as any).internal.getNumberOfPages();
    const pgH = doc.internal.pageSize.getHeight();
    const pgW = doc.internal.pageSize.getWidth();
    for (let i = 1; i <= pgTotal; i++) {
      doc.setPage(i);
      doc.setFillColor(249, 250, 251);
      doc.rect(0, pgH - 14, pgW, 14, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado por NEXT Lab · ${COMPANY_WEBSITE} · ${COMPANY_EMAIL} · ${COMPANY_PHONE}`, 14, pgH - 5);
      doc.text(`Página ${i} de ${pgTotal}`, pgW - 14, pgH - 5, { align: 'right' });
    }

    doc.save(`${nomeAcademia.replace(/\s+/g, '_')}_Documento.pdf`);
    setMostrarModalExport(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregandoLogin(true);
    setLoginError('');

    if (!electron) {
      setLoginError('Erro: Electron não detetado. Estás a usar o navegador em vez do app nativo?');
      setCarregandoLogin(false);
      return;
    }

    // Pequeno delay para feedback visual de loading
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const res = await electron.ipcRenderer.invoke('check-auth', { 
        email: loginForm.email, 
        password: loginForm.password 
      });
      
      if (res.success) {
        localStorage.setItem('nl_last_user_email', loginForm.email);
        if (res.user?.email) {
          const role: UserRole = res.user.role === 'root' ? 'root' : (res.user.role === 'admin' ? 'admin' : 'operational');
          const user: SessionUser = {
            id: Number(res.user.id),
            name: String(res.user.name || 'Utilizador'),
            email: String(res.user.email),
            role,
          };
          localStorage.setItem('nl_session_user', JSON.stringify({ ...user, loginTimestamp: Date.now() }));
          setSessionUser(user);
          if (role !== 'root') {
            electron?.ipcRenderer.invoke('users:set-current', { name: user.name });
          }
        }
        setIsLoggedIn(true);
        setLoginError('');
        setAba('home');
      } else {
        setLoginError(res.message);
      }
    } catch (err: any) {
      console.error('Erro de comunicação IPC:', err);
      setLoginError(`Falha Crítica de Conexão: ${err.message || 'Erro desconhecido'}`);
    }
    
    setCarregandoLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('nl_session_user');
    setSessionUser(null);
    setIsLoggedIn(false);
    setAba('home');
  };

  // ── Setup Wizard Logic (Fase 3) ──────────────────────────────────
  useEffect(() => {
    if (configuracoes?.setup_completed === '0') {
      electron?.ipcRenderer.invoke('window:resize', 600, 500, false);
    }
  }, [configuracoes?.setup_completed]);

  const validarPassoSetup = async () => {
    setSetupError('');
    if (setupStep === 3) {
      if (!setupData.nomeAcademia || !setupData.email || !setupData.telefone) {
        setSetupError('Preencha os campos obrigatórios (*).');
        return false;
      }
      if (!setupData.email.includes('@')) {
        setSetupError('O email deve conter "@".');
        return false;
      }
    }
    if (setupStep === 4) {
      if (!setupData.adminEmail || !setupData.adminSenha) {
        setSetupError('Preencha os dados do administrador.');
        return false;
      }
      if (setupData.adminSenha.length < 6) {
        setSetupError('A senha deve ter pelo menos 6 caracteres.');
        return false;
      }
      if (setupData.adminSenha !== setupData.confirmarSenha) {
        setSetupError('As senhas não coincidem.');
        return false;
      }
    }
    if (setupStep === 5) {
      if (!setupData.licenca) {
        setSetupError('Insira o código de licença.');
        return false;
      }
      const res = await electron?.ipcRenderer.invoke('license:validate-external', setupData.licenca);
      if (res.success) {
        setSetupLicenseInfo(res.license);
        return true;
      } else {
        setSetupError(res.message || 'Licença inválida.');
        return false;
      }
    }
    return true;
  };

  const proximoPassoSetup = async () => {
    const ok = await validarPassoSetup();
    if (ok) setSetupStep(prev => prev + 1);
  };

  const saltarSetupDesenvolvedor = async () => {
    if (confirm('Atenção Desenvolvedor: Deseja ignorar o setup e entrar no app? (Isto criará dados padrão)')) {
       // Criar admin padrão rápido
       await electron?.ipcRenderer.invoke('users:create', {
         name: 'Desenvolvedor',
         email: 'admin@nextlab.com',
         password: 'adminadmin',
         role: 'admin'
       });
       
       const payload = {
         nomeAcademia: 'Desenvolvimento NEXT Lab',
         email: COMPANY_EMAIL,
         telefone: '9597220',
         morada: 'Modo Dev',
         licenca: 'DEV-MASTER-NEXTLAB-2026',
         dataExpiracao: 'Vitalícia',
         tipoLicenca: 'vitalicio'
       };

       await electron?.ipcRenderer.invoke('setup:save-data', payload);
       await carregarConfiguracoes();
       electron?.ipcRenderer.invoke('window:resize', 1280, 850, true);
    }
  };

  const finalizarSetupTotal = async () => {
    try {
      const userRes = await electron?.ipcRenderer.invoke('users:create', {
        name: 'Administrador',
        email: setupData.adminEmail,
        password: setupData.adminSenha,
        role: 'admin'
      });

      if (!userRes.success) {
        setSetupError(userRes.message);
        return;
      }

      const payload = {
        nomeAcademia: setupData.nomeAcademia,
        email: setupData.email,
        telefone: setupData.telefone,
        morada: setupData.morada,
        licenca: setupData.licenca,
        dataExpiracao: setupLicenseInfo?.dataExpiracao,
        tipoLicenca: setupLicenseInfo?.tipo
      };

      const setupRes = await electron?.ipcRenderer.invoke('setup:save-data', payload);
      if (setupRes.success) {
        if (appLogo && appLogo !== APP_ICON_PATH) {
          await guardarConfiguracao('app_logo', appLogo);
        }
        await carregarConfiguracoes();
        electron?.ipcRenderer.invoke('window:resize', 1280, 850, true);
      } else {
        setSetupError(setupRes.message);
      }
    } catch (err) {
      setSetupError('Erro ao finalizar o setup.');
    }
  };

  // ── Splash Screen (Fase 3 - Entrada Premium) ────────────────────
  if (loadingConfig) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-[2000] text-white">
         <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
            {/* App Logo Glow */}
            <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full animate-pulse" />
            <img src={appLogo} alt="App Logo" className="w-full h-full object-contain relative z-10 animate-in zoom-in duration-700" />
         </div>
         
         <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
               <h1 className="text-3xl font-black tracking-tighter uppercase">NEXT<span className="font-light normal-case">Level</span></h1>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Sistema de gerenciamento de Academias</p>
            </div>

            <div className="w-40 h-0.5 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 animate-progress-loading" />
            </div>

            <div className="flex items-center gap-2 mt-8 opacity-40 hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by</span>
               <img src={NEXT_LAB_ICON} alt="NEXT Lab" className="h-4 object-contain" />
            </div>
         </div>
         
         <style>{`
            @keyframes progress-loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .animate-progress-loading {
               width: 100%;
               animation: progress-loading 1.5s ease-in-out infinite;
            }
         `}</style>
      </div>
    );
  }

  if (configuracoes?.setup_completed === '0') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[1000] p-4">
        <div className="bg-[var(--bg-surface)] w-full max-w-[600px] h-[500px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in">
          
          <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Configuração Inicial</h2>
            </div>
            <div className="flex-1 flex justify-end px-3">
            </div>
          </div>

          <div className="h-1 w-full bg-slate-200 flex shrink-0">
             {[1,2,3,4,5,6].map(s => (
               <div key={s} className={`h-full flex-1 transition-all duration-500 ${setupStep >= s ? 'bg-blue-600' : ''}`} />
             ))}
          </div>

          <div className="flex-1 overflow-y-auto p-10 flex flex-col bg-white">
            {setupStep === 1 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-blue-50 rounded-[6px] flex items-center justify-center p-4">
                  <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">NEXT<span className="font-light normal-case">Level</span></h1>
                  <p className="text-slate-500 font-medium mt-1">Sistema de gerenciamento de Academias</p>
                </div>
                <p className="text-slate-600 max-w-sm text-[15px] leading-relaxed">
                  Sistema de gestão profissional focado em alta performance operacional.
                </p>
                
                {/* Developer Shortcut */}
                <button 
                  onClick={saltarSetupDesenvolvedor}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors mt-4"
                >
                  [ Ignorar (Modo Desenvolvedor) ]
                </button>
              </div>
            )}

            {setupStep === 2 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                 <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={32} />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-slate-900">Sobre NEXT Lab</h2>
                   <p className="text-slate-500 mt-2 leading-relaxed max-w-md mx-auto text-[14px]">
                     Desenvolvemos aplicações profissionais para gestão de negócios modernos.
                   </p>
                 </div>
                 <div className="bg-slate-50 w-full p-6 rounded-xl border border-slate-100 text-left space-y-3">
                   <div className="flex items-center gap-3 text-slate-700">
                      <Mail size={16} className="text-blue-600" />
                      <span className="text-[14px] font-medium">{COMPANY_EMAIL}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-700">
                      <Phone size={16} className="text-blue-600" />
                      <span className="text-[14px] font-medium">{COMPANY_PHONE}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-700">
                      <ExternalLink size={16} className="text-blue-600" />
                      <span className="text-[14px] font-medium cursor-pointer hover:underline" onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)}>
                         linktr.ee/next.lab
                      </span>
                   </div>
                 </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="space-y-5 animate-slide-up">
                <h2 className="text-xl font-bold text-slate-900">Dados da Sua Empresa</h2>
                {/* Logo upload */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-16 h-16 rounded-[8px] bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={appLogo || APP_ICON_PATH} className="w-12 h-12 object-contain" alt="Logo" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-slate-700 mb-1">Logótipo da Academia (opcional)</p>
                    <p className="text-[11px] text-slate-400 mb-2">PNG, JPEG ou SVG · fundo transparente recomendado</p>
                    <input
                      type="file"
                      id="setup-logo-upload"
                      className="hidden"
                      accept="image/svg+xml,image/png,image/jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const result = ev.target?.result as string;
                            setAppLogo(result);
                            localStorage.setItem('nl_app_logo', result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button onClick={() => document.getElementById('setup-logo-upload')?.click()} className="px-4 h-8 text-[12px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-700">
                      Carregar Logo
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nome da Academia *</label>
                      <input type="text" value={setupData.nomeAcademia} onChange={e => setSetupData({...setupData, nomeAcademia: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="Ex: Master Gym" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Institucional *</label>
                      <input type="email" value={setupData.email} onChange={e => setSetupData({...setupData, email: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="contacto@academia.com" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Telefone *</label>
                    <input type="text" value={setupData.telefone} onChange={e => setSetupData({...setupData, telefone: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="+238 000 000 000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Morada (Opcional)</label>
                    <input type="text" value={setupData.morada} onChange={e => setSetupData({...setupData, morada: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="Rua, Bairro, Cidade" />
                  </div>
                </div>
              </div>
            )}

            {setupStep === 4 && (
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-xl font-bold text-slate-900">Criar Conta de Administrador</h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email do Admin *</label>
                    <input type="email" value={setupData.adminEmail} onChange={e => setSetupData({...setupData, adminEmail: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="admin@academia.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Senha *</label>
                      <input type="password" value={setupData.adminSenha} onChange={e => setSetupData({...setupData, adminSenha: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="••••••••" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirmar Senha *</label>
                      <input type="password" value={setupData.confirmarSenha} onChange={e => setSetupData({...setupData, confirmarSenha: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="••••••••" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 5 && (
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-xl font-bold text-slate-900">Ativar Licença</h2>
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  Insira o código de licença fornecido. Se não tem licença, solicite em: <span className="font-bold text-blue-600">{COMPANY_EMAIL}</span>
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Código de Licença *</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={setupData.licenca} 
                        onChange={e => setSetupData({...setupData, licenca: e.target.value.toUpperCase()})} 
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[15px] font-mono tracking-widest"
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                      />
                      {setupLicenseInfo && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-2">
                           <CheckCircle2 size={18} />
                           <span className="text-[12px] font-bold uppercase tracking-wider">✓ Válida</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 6 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-slide-up">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Instalação Concluída!</h2>
                  <p className="text-slate-600 mt-2">Bem-vindo, <span className="font-bold">{setupData.nomeAcademia}</span>!</p>
                </div>
                <div className="bg-slate-50 w-full p-6 rounded-xl border border-slate-100 text-left">
                  <p className="text-[13px] text-slate-500 uppercase font-bold tracking-widest mb-3">Resumo da Licença</p>
                  <div className="grid grid-cols-2 gap-y-2 text-[14px]">
                     <span className="text-slate-600">Tipo:</span>
                     <span className="font-bold text-slate-900 capitalize">{setupLicenseInfo?.tipo}</span>
                     <span className="text-slate-600">Válida até:</span>
                     <span className="font-bold text-slate-900">{setupLicenseInfo?.dataExpiracao || 'Vitalício'}</span>
                  </div>
                </div>
              </div>
            )}

            {setupError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 text-[13px] animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={16} />
                {setupError}
              </div>
            )}
          </div>

          <div className="px-10 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
             <button 
               onClick={() => setupStep > 1 && setSetupStep(prev => prev - 1)}
               className={`text-[14px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors ${setupStep === 1 || setupStep === 6 ? 'invisible' : ''}`}
             >
                <ChevronLeft size={16} /> Anterior
             </button>
             
             {setupStep < 6 ? (
               <button 
                 onClick={proximoPassoSetup}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 rounded-lg font-bold text-[14px] shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
               >
                 Próximo <ChevronRight size={16} />
               </button>
             ) : (
               <button 
                 onClick={finalizarSetupTotal}
                 className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 h-11 rounded-lg font-bold text-[14px] shadow-lg shadow-emerald-600/20 transition-all"
               >
                 Iniciar Aplicação
               </button>
             )}
          </div>
        </div>
      </div>
    );
  }

  // ── License Block Screen ──────────────────────────────────────────
  if (!licencaAtiva) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#172B4D] nl-font-ui p-6">
        <GlobalStyles theme="dark" />
        <div className="nl-card w-full max-w-[480px] text-center space-y-8 animate-slide-up bg-white p-12">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
            <ShieldOff size={48} className="text-red-500" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-[#172B4D] tracking-tight">Licença Expirada</h1>
            <p className="text-[#626F86] text-base leading-relaxed">
              O seu período de licença para o <strong>NEXTLevel</strong> terminou ou a chave é inválida. 
            </p>
          </div>
          
          <div className="bg-[#F4F5F7] p-6 rounded-xl space-y-4 border border-[#DFE1E6]">
             <p className="text-[11px] text-[#172B4D] font-bold uppercase tracking-widest">Renovar Licença</p>
             <div className="space-y-3">
               <input 
                 type="text" 
                 placeholder="Cole aqui a nova chave de licença..." 
                 value={chaveReativacao}
                 onChange={(e) => { setChaveReativacao(e.target.value); setErroReativacao(''); }}
                 className="w-full h-11 px-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-[14px] text-center font-mono"
               />
               {erroReativacao && <p className="text-[12px] text-red-600 font-bold">{erroReativacao}</p>}
               <button 
                 onClick={async () => {
                   if (!chaveReativacao) return;
                   const res = await electron?.ipcRenderer.invoke('license:validate-external', chaveReativacao);
                   if (res.success && res.ativa) {
                     await electron?.ipcRenderer.invoke('update-configuracao', 'license_key', chaveReativacao);
                     await electron?.ipcRenderer.invoke('update-configuracao', 'license_expiry', res.expiracao);
                     await carregarConfiguracoes();
                     setLicencaAtiva(true);
                     showToast('Sistema reativado com sucesso!');
                   } else {
                     setErroReativacao('Chave inválida ou expirada.');
                   }
                 }}
                 className="w-full h-11 bg-[#0052CC] text-white font-bold rounded-lg hover:bg-[#0747A6] transition-colors shadow-lg"
               >
                 Ativar Agora
               </button>
             </div>
          </div>

          <div className="pt-2">
             <p className="text-[13px] text-[#172B4D] font-bold uppercase tracking-widest mb-3">Suporte NEXT LAB</p>
             <div className="flex justify-center gap-6">
                <p className="text-[14px] text-[#626F86] flex items-center gap-2">
                  <Mail size={16} className="text-[#0052CC]" /> {COMPANY_EMAIL}
                </p>
                <p className="text-[14px] text-[#626F86] flex items-center gap-2">
                  <Phone size={16} className="text-[#0052CC]" /> {COMPANY_PHONE}
                </p>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button onClick={() => window.location.reload()} className="nl-btn nl-btn-secondary h-12 flex-1 font-bold">Verificar Novamente</button>
            <button onClick={gerarBackup} className="nl-btn nl-btn-primary h-12 flex-1 font-bold">Exportar Meus Dados</button>
          </div>
          
          <p className="text-[11px] text-[#8993A4] font-medium tracking-tight">
            NEXTLevel v1.0.0 • Desenvolvido com ❤️ por NEXT LAB
          </p>
        </div>
      </div>
    );
  }

  // ── Split-Screen Premium Login ────────────────────────────────────
  if (!isLoggedIn) {
    // Mini Calendar state (scoped to login)
    const loginNow = agora;
    const loginYear = loginNow.getFullYear();
    const loginMonth = loginNow.getMonth();
    const loginDay = loginNow.getDate();
    const loginHora = loginNow.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const loginData = loginNow.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
      <div className="flex h-screen w-screen overflow-hidden nl-font-ui bg-white" style={{ animation: 'fadeIn 0.4s ease both' }}>
        <GlobalStyles theme="light" />

        {/* ── LADO ESQUERDO: Identidade + Formulário ── */}
        <div className="w-[480px] shrink-0 h-full flex flex-col relative bg-white border-r border-slate-100">
          {/* Barra de acento lateral */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--color-primary)]" />

          {/* Topo: Branding da Academia */}
          <div className="px-12 pt-12 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[6px] flex items-center justify-center bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 shadow-sm shrink-0">
                <img src={appLogo} alt="Logo" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h1 className="text-[18px] font-black nl-text tracking-tight uppercase leading-none">{nomeAcademia}</h1>
                <p className="text-[10px] font-bold nl-text-muted uppercase tracking-[0.2em] mt-0.5">Sistema de Gestão</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Local', value: moradaAcademia.split(',')[0] || 'Academia', icon: <MapPin size={11} /> },
                { label: 'Contacto', value: telefoneAcademia || '—', icon: <Phone size={11} /> },
                { label: 'Sistema', value: 'Ativo', icon: <Wifi size={11} /> },
              ].map(item => (
                <div key={item.label} className="rounded-[4px] border border-slate-100 bg-slate-50 px-2.5 py-2">
                  <div className="flex items-center gap-1 nl-text-muted mb-1">{item.icon}<span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span></div>
                  <p className="text-[11px] font-semibold nl-text truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Centro: Formulário de login */}
          <div className="flex-1 flex flex-col justify-center px-12 py-8">
            <div className="mb-7">
              <h2 className="text-[26px] font-black nl-text tracking-tight leading-tight mb-1.5">Bem-vindo de volta.</h2>
              <p className="text-[13px] text-slate-500">Introduza as suas credenciais para aceder ao painel.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    placeholder="email@academia.cv"
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-[6px] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] outline-none transition-all text-[13px]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-wider">Palavra-passe</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    placeholder="••••••••••"
                    className="w-full h-11 pl-10 pr-11 bg-slate-50 border border-slate-200 rounded-[6px] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] outline-none transition-all text-[13px]"
                    required
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-[5px] flex items-center gap-2.5 text-red-600 text-[12px] font-medium">
                  <AlertCircle size={15} className="shrink-0" /> {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={carregandoLogin}
                className="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-[6px] font-bold text-[13px] shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
              >
                {carregandoLogin ? 'A autenticar...' : 'Entrar no Sistema'}
                {!carregandoLogin && <ChevronRight size={16} />}
              </button>
            </form>
          </div>

          {/* Quick Access — Utilizadores sem senha */}
          {loginSlideshowUsers.length > 0 && (
            <div className="px-12 pb-3">
              <button
                type="button"
                onClick={() => setQuickAccessExpanded(!quickAccessExpanded)}
                className="w-full flex items-center justify-between py-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Acesso Rápido — clique para entrar
                </span>
                {quickAccessExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {quickAccessExpanded && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {loginSlideshowUsers.map((u: any) => {
                    const hue = (u.name?.charCodeAt(0) || 0) * 37 % 360;
                    return (
                      <button
                        key={u.id}
                        onClick={async () => {
                          setCarregandoLogin(true);
                          try {
                            const res = await electron?.ipcRenderer.invoke('login:quick-access', u.id);
                            if (res?.success) {
                              const user = { id: Number(res.user.id), name: String(res.user.name), email: String(res.user.email), role: (res.user.role === 'admin' ? 'admin' : 'operational') as any };
                              localStorage.setItem('nl_session_user', JSON.stringify({ ...user, loginTimestamp: Date.now() }));
                              setSessionUser(user);
                              electron?.ipcRenderer.invoke('users:set-current', { name: user.name });
                              setIsLoggedIn(true);
                            }
                          } catch(e) {}
                          setCarregandoLogin(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-[6px] border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all"
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
                             style={{ background: `hsl(${hue},60%,88%)`, color: `hsl(${hue},60%,35%)` }}>
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="text-[12px] font-bold text-slate-700 leading-none">{u.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">{u.role === 'admin' ? 'Admin' : 'Operador'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Rodapé */}
          <div className="px-12 pb-6">
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Desenvolvido por <span className="font-bold">{COMPANY_NAME}</span> · v1.0 Beta · {new Date().getFullYear()}
            </p>
            <p className="text-[9px] text-slate-300 text-center mt-1 tracking-wide">
              NEXT-Lab Creative · desde 1995 · Ivaldino da Luz Fortes, CEO
            </p>
          </div>
        </div>

        {/* ── LADO DIREITO: Slideshow / Banner ── */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-900">
          {/* Fundo — slideshow ou banner estático */}
          {slideshowImages.length > 0 ? (
            slideshowImages.map((img, i) => (
              <img key={i} src={img}
                className="absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-1000"
                style={{ opacity: i === currentSlide ? 0.55 : 0 }}
                alt="" />
            ))
          ) : (
            <img src={DEFAULT_ACADEMY_BANNER}
              className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105"
              alt="Banner" />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.75) 100%)' }} />

          <div className="relative h-full flex flex-col justify-between p-12 z-10">
            {/* Topo: Relógio + Status */}
            <div className="flex items-start justify-between">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[6px] px-4 py-2.5 flex items-center gap-2">
                <Wifi size={13} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest leading-none mb-0.5">Servidor Local</p>
                  <p className="text-[12px] font-bold text-white">Operacional</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[44px] font-black text-white leading-none tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{loginHora.slice(0, 5)}</p>
                <p className="text-white/50 text-[11px] font-medium mt-1 capitalize">{loginData}</p>
              </div>
            </div>

            {/* Meio: Tagline (só se texto habilitado) */}
            {slideshowTextEnabled && (
              <div className="max-w-[460px]">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-3">Next Level · Gym Management</p>
                <h3 className="text-white text-[36px] font-black leading-[1.08] tracking-tight mb-4">
                  Gestão que eleva o nível da sua academia.
                </h3>
                <p className="text-white/60 text-[14px] leading-relaxed">
                  Matrículas, mensalidades e acompanhamento de alunos num só painel.
                </p>
              </div>
            )}

            {/* Indicadores do slideshow */}
            {slideshowImages.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 absolute bottom-24 left-1/2 -translate-x-1/2">
                {slideshowImages.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)}
                    className="transition-all rounded-full"
                    style={{ width: i === currentSlide ? 20 : 6, height: 6, background: i === currentSlide ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }} />
                ))}
              </div>
            )}

            {/* Rodapé: Info NEXT Lab */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[5px] overflow-hidden bg-white/10 border border-white/15 flex items-center justify-center">
                    <img src={NEXT_LAB_ICON} alt="NEXT Lab" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-white leading-tight">{COMPANY_NAME}</p>
                    <p className="text-[10px] text-white/40 font-medium">Creative Studio · desde 1995 · Cabo Verde</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[11px] text-white/50 flex items-center gap-1.5 justify-end"><Phone size={10} /> {COMPANY_PHONE}</p>
                  <p className="text-[11px] text-white/50 flex items-center gap-1.5 justify-end cursor-pointer hover:text-white/70 transition-colors" onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)}>
                    <Globe size={10} /> linktr.ee/next.lab
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  // Painel Root Técnico (acesso exclusivo root@nextlab.com)
  if (sessionUser?.role === 'root') {
    return (
      <RootPanel
        onLogout={() => {
          localStorage.removeItem('nl_session_user');
          setSessionUser(null);
          setIsLoggedIn(false);
        }}
      />
    );
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden antialiased nl-text"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      <GlobalStyles theme={appTheme} />
      
      {/* Header */}
      <header className="h-[56px] flex items-center justify-between px-5 shrink-0 bg-[var(--bg-header)] border-b border-[var(--border)] z-[100]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {/* Left: Branding */}
        <div className="flex items-center gap-3 w-[220px] shrink-0">
          <div className="w-7 h-7 rounded-[5px] flex items-center justify-center overflow-hidden shrink-0" style={{ background: 'var(--color-primary-light)', border: '1px solid var(--border)' }}>
            <img src={appLogo} alt="Logo" className="w-4.5 h-4.5 object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold tracking-tight nl-text uppercase leading-tight truncate">{nomeAcademia}</span>
            <span className="text-[9px] font-medium nl-text-muted uppercase tracking-[0.1em] opacity-50">{COMPANY_NAME}</span>
          </div>
        </div>

        {/* Center: Navigation */}
        <div className="flex-1 flex items-center justify-center">
          <nav className="flex items-center gap-1.5 p-1 rounded-[5px] bg-[var(--color-secondary-lighter)] border border-[var(--border-light)] w-[660px]">
            {[
              { id: 'home',                 label: 'Painel',     icon: <Layout size={15} /> },
              { id: 'gestao',               label: 'Alunos',     icon: <Users size={15} /> },
              { id: 'contactos',            label: 'Contactos',  icon: <BookUser size={15} /> },
              ...(sessionUser?.role === 'admin' ? [
                { id: 'relatorios_detalhado', label: 'Relatório', icon: <FileBarChart size={15} /> },
                { id: 'configuracoes',        label: 'Ajustes',   icon: <Settings size={15} /> },
              ] : [])
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => setAba(nav.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-[4px] text-[12px] font-semibold transition-all ${
                  aba === nav.id
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'nl-text-muted hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                }`}
              >
                {nav.icon}
                <span>{nav.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Context actions + Profile */}
        <div className="flex items-center gap-1.5 min-w-[220px] justify-end">
          {aba === 'gestao' && (
            <div className="flex items-center gap-1.5 mr-1">
              <button 
                onClick={() => setMostrarRelatorioMensal(true)} 
                className={`nl-btn !h-8 !px-3 !text-[12px] flex items-center gap-2 transition-all ${
                  relatorioMensalDisponivel 
                    ? '!bg-emerald-600 !text-white shadow-lg shadow-emerald-600/20 ring-1 ring-emerald-400' 
                    : 'nl-btn-secondary'
                }`} 
                title="Relatório Mensal"
              >
                {relatorioMensalDisponivel ? <Star size={14} className="text-amber-300 fill-amber-300 animate-pulse" /> : <FileText size={14} />}
                Relatório
              </button>
              <button onClick={() => { setNovoAluno(novoAlunoDefault); setMostrarForm(true); }} className="nl-btn nl-btn-primary !h-8 !px-3 !text-[12px]">
                <Plus size={14} /> Matricular
              </button>
            </div>
          )}
          {aba === 'contactos' && alunoPerfil && (
            <div className="flex items-center gap-1.5 mr-1">
              <button onClick={() => marcarComoPago(alunoPerfil.id)} className="nl-btn nl-btn-primary !h-8 !px-3 !text-[11px]">
                <Wallet size={13} /> Cobrar
              </button>
              <button onClick={() => abrirEdicao(alunoPerfil)} className="nl-btn nl-btn-secondary !h-8 !px-3 !text-[11px]">
                <Edit size={13} /> Editar
              </button>
            </div>
          )}

          <button onClick={atualizarAplicacao} className="nl-icon-btn" title="Atualizar">
            <RotateCw size={16} className={sincronizando ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)} className="nl-icon-btn relative" title="Notificações">
            <Bell size={16} />
            {notificacoesNaoLidas > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-error)] rounded-full border-2 border-[var(--bg-header)]" />
            )}
          </button>

          <div className="w-px h-5 bg-[var(--border)] mx-0.5" />

          {/* User Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMostrarUserMenu(!mostrarUserMenu)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-[13px] border-2 border-[var(--bg-app)] shadow-sm hover:scale-105 transition-all ring-1 ring-[var(--border)]"
              style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #0747A6 100%)' }}
            >
              {(sessionUser?.name || 'U').charAt(0).toUpperCase()}
            </button>

            {mostrarUserMenu && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setMostrarUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-[240px] bg-white rounded-[6px] shadow-[0_8px_32px_rgba(0,0,0,0.10)] border border-[#DFE1E6] py-2 z-[110] animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-[#F4F5F7] mb-1">
                    <p className="text-[13px] font-bold nl-text leading-tight">{sessionUser?.name}</p>
                    <p className="text-[10px] font-bold nl-text-muted uppercase tracking-widest mt-0.5">{sessionUser?.role === 'admin' ? 'Administrador' : 'Operador'}</p>
                  </div>

                  <div className="px-1.5 space-y-0.5">
                    {sessionUser?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => { setAba('configuracoes'); setMostrarUserMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] hover:bg-[#F4F5F7] text-[13px] font-medium nl-text transition-colors"
                        >
                          <Settings size={15} className="text-slate-400" /> Definições do Sistema
                        </button>
                        <button
                          onClick={() => { setAba('relatorios_detalhado'); setMostrarUserMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] hover:bg-emerald-50 text-[13px] font-bold text-emerald-700 transition-colors"
                        >
                          <FileBarChart size={15} className="text-emerald-500" /> Dossier de Desempenho
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => { setMostrarSobreDoc(true); setMostrarUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] hover:bg-[#F4F5F7] text-[13px] font-medium nl-text transition-colors"
                    >
                      <Info size={15} className="text-slate-400" /> Sobre o NEXTLevel
                    </button>

                    <div className="h-px bg-[#F4F5F7] my-1 mx-2" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] hover:bg-red-50 text-[13px] font-medium text-red-600 transition-colors"
                    >
                      <LogOut size={15} /> Terminar Sessão
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Container Principal */}
      <main className={`flex-1 overflow-hidden relative flex flex-col ${aba === 'gestao' || aba === 'contactos' || aba === 'configuracoes' ? 'px-0 pb-0 pt-0' : 'p-5 pt-3'}`}>
        {sessionUser?.role === 'operational' && aba === 'configuracoes' && (
          <div className="h-full w-full flex items-center justify-center opacity-70">
            <div className="text-center">
              <ShieldOff size={34} className="mx-auto mb-2" />
              <p className="text-[12px] font-extrabold uppercase tracking-widest nl-text">Acesso restrito</p>
              <p className="text-[12px] nl-text-muted mt-1">Esta área está disponível apenas para administradores.</p>
            </div>
          </div>
        )}
        {aba === 'home' && (
          <div className="animate-slide-up h-full w-full overflow-y-auto custom-scrollbar">
            <div className="mx-auto space-y-4 px-3 pt-4 pb-6" style={{ maxWidth: `${larguraListas}px` }}>

              {/* ── Banner ─────────────────────────────────────────────── */}
              <div className="relative overflow-hidden rounded-[6px] border border-[var(--border)] shadow-[0_4px_16px_rgba(15,23,42,0.08)]" style={{ minHeight: '180px' }}>
                <img src={bannerAcademia || DEFAULT_ACADEMY_BANNER} alt="Banner da academia" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(108deg, rgba(0,0,0,0.64) 0%, rgba(0,0,0,0.30) 46%, rgba(0,0,0,0.10) 70%)' }} />
                <div className="relative z-10 flex flex-col justify-center p-6" style={{ minHeight: '180px' }}>
                  
                  {/* Botão Alterar - Canto Superior Direito */}
                  <div className="absolute top-4 right-4">
                    <label className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold text-white/70 border border-white/10 cursor-pointer hover:bg-white/20 transition-all backdrop-blur-sm">
                      <Camera size={11} /> Alterar
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadBanner} />
                    </label>
                  </div>

                  {/* Conteúdo Principal (Centralizado Verticalmente) */}
                  <div className="flex items-center justify-between w-full">
                    
                    {/* Identidade (Lado Esquerdo) */}
                    <div className="flex items-center gap-4 animate-slide-up">
                      <div className="h-14 w-14 rounded-lg bg-white/10 backdrop-blur-md p-2.5 border border-white/20 shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                        <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-1 leading-none">Academia · Gestão Local</p>
                        <div className="flex items-baseline gap-2">
                          <h1 className="text-[32px] font-black text-white leading-tight tracking-tighter drop-shadow-lg truncate">{nomeAcademia}</h1>
                        </div>
                        <p className="text-[12px] font-medium text-white/50 truncate max-w-[400px]">{subtituloAcademia}</p>
                      </div>
                    </div>

                    {/* Relógio (Lado Direito) */}
                    <div className="text-right animate-slide-up pr-4">
                      <p className="text-[34px] font-black text-white leading-none tracking-tighter drop-shadow-md" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1.5">
                        {agora.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}
                      </p>
                    </div>
                  </div>

                  {/* Minicards (Stats) - Canto Inferior Direito (Translúcidos) */}
                  <div className="absolute bottom-4 right-4 flex gap-1.5">
                    {[
                      { icon: <Users size={11} />, text: `${alunosAtivos.length} Activos` },
                      { icon: <Clock size={11} />, text: `${cobrancasParaHoje} Hoje` },
                      { icon: <Landmark size={11} />, text: formatCve(receitaPrevista) },
                    ].map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 backdrop-blur-md px-2.5 py-1 text-[9px] font-black text-white/70 shadow-lg transition-all hover:bg-black/50">
                        <span className="text-white/40">{p.icon}</span>
                        <span className="uppercase tracking-widest">{p.text}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── 4 stat cards ────────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  {
                    title: 'Alunos activos', value: String(alunosAtivos.length), sub: 'em operação normal',
                    action: () => setAba('gestao'),
                    color: '#1B6ABF',
                    bgColor: '#F2F8FF',
                    borderColor: '#E1EFFF',
                    icon: <Users size={18} />,
                  },
                  {
                    title: 'Vencem hoje', value: String(cobrancasParaHoje), sub: cobrancasParaHoje > 0 ? 'ações imediatas' : 'sem urgências',
                    action: () => { setAba('gestao'); setFiltroStatus('divida'); },
                    color: '#C26B00',
                    bgColor: '#FFF9EB',
                    borderColor: '#FFEDC2',
                    icon: <Clock size={18} />,
                  },
                  {
                    title: 'Em cobrança', value: String(alunosEmDivida.length), sub: alunosEmDivida.length > 0 ? 'pedem atenção' : 'tudo regularizado',
                    action: () => { setAba('gestao'); setFiltroStatus('divida'); },
                    color: '#C0392B',
                    bgColor: '#FFF5F5',
                    borderColor: '#FFEBEB',
                    icon: <AlertCircle size={18} />,
                  },
                  {
                    title: 'Receita prevista', value: formatCve(receitaPrevista), sub: 'alunos operacionais',
                    action: () => setAba('gestao'),
                    color: '#1A7A48',
                    bgColor: '#F2FDF5',
                    borderColor: '#E1F7E9',
                    icon: <Wallet size={18} />,
                  },
                ].map(card => (
                  <button key={card.title} type="button" onClick={card.action}
                    style={{ backgroundColor: card.bgColor, borderColor: card.borderColor }}
                    className="group text-left rounded-[6px] border p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="shrink-0" style={{ color: card.color }}>
                        {card.icon}
                      </div>
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider leading-tight">{card.title}</p>
                    </div>
                    <p className="text-[20px] font-black nl-text leading-tight">{card.value}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">{card.sub}</p>
                  </button>
                ))}
              </div>

              {/* ── Radar + Inscrições recentes ─────────────────────────── */}
              <div className="grid gap-4 lg:grid-cols-2">

                {/* Centro de Operações */}
                <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[0_2px_8px_rgba(9,30,66,0.06)]">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]/50 mb-0.5">Acesso rápido</p>
                      <h3 className="text-[16px] font-bold nl-text">Centro de Operações</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-medium nl-text-muted">Sistema activo</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {([
                      {
                        id: 'alunos',
                        label: 'Alunos',
                        sublabel: `${alunosAtivos.length} activos`,
                        icon: <Users size={26} />,
                        gradient: 'from-blue-500 to-blue-600',
                        glow: 'rgba(59,130,246,0.18)',
                        badge: null as number | null,
                        action: () => setAba('gestao'),
                      },
                      {
                        id: 'cobrancas',
                        label: 'Cobranças',
                        sublabel: cobrancasParaHoje > 0 ? `${cobrancasParaHoje} hoje` : 'Em dia',
                        icon: <Wallet size={26} />,
                        gradient: cobrancasParaHoje > 0 ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-emerald-600',
                        glow: cobrancasParaHoje > 0 ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.18)',
                        badge: cobrancasParaHoje > 0 ? cobrancasParaHoje : null,
                        action: () => { setAba('gestao'); setFiltroStatus('divida'); },
                      },
                      {
                        id: 'contactos',
                        label: 'Contactos',
                        sublabel: `${alunos.length} parceiros`,
                        icon: <BookUser size={26} />,
                        gradient: 'from-indigo-500 to-violet-600',
                        glow: 'rgba(99,102,241,0.18)',
                        badge: null,
                        action: () => setAba('contactos'),
                      },
                      {
                        id: 'relatorio',
                        label: 'Relatório',
                        sublabel: relatorioMensalDisponivel ? 'Disponível' : 'Dossier Mensal',
                        icon: <FileBarChart size={26} />,
                        gradient: relatorioMensalDisponivel ? 'from-emerald-500 to-teal-600' : 'from-slate-500 to-slate-600',
                        glow: relatorioMensalDisponivel ? 'rgba(16,185,129,0.20)' : 'rgba(100,116,139,0.15)',
                        badge: relatorioMensalDisponivel ? '★' : null,
                        action: () => setAba('relatorios_detalhado'),
                      },
                      {
                        id: 'config',
                        label: 'Ajustes',
                        sublabel: 'Configurações',
                        icon: <Settings size={26} />,
                        gradient: 'from-slate-600 to-slate-700',
                        glow: 'rgba(71,85,105,0.15)',
                        badge: null,
                        action: () => setAba('config'),
                      },
                    ] as const).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        className="group flex flex-col items-center gap-3 py-5 px-2 rounded-[8px] transition-all active:scale-95 hover:bg-[var(--color-secondary-lighter)]/40"
                        style={{ '--glow': item.glow } as React.CSSProperties}
                      >
                        <div className="relative">
                          <div
                            className={`w-14 h-14 rounded-[12px] bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md transition-all group-hover:scale-110 group-hover:shadow-lg`}
                            style={{ boxShadow: `0 4px 14px var(--glow, rgba(0,0,0,0.12))` }}
                          >
                            {item.icon}
                          </div>
                          {item.badge !== null && (
                            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow border-2 border-[var(--bg-surface)]">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-[12px] font-semibold nl-text leading-tight">{item.label}</p>
                          <p className="text-[10px] nl-text-muted mt-0.5">{item.sublabel}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inscrições recentes */}
                <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[0_2px_8px_rgba(9,30,66,0.05)]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--text-secondary)] mb-1">Alunos recentes</p>
                      <h3 className="text-[14px] font-bold nl-text">Últimas inscrições</h3>
                    </div>
                    <button type="button" onClick={() => setAba('gestao')}
                      className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline underline-offset-2 transition-all">
                      Ver todos
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {novosInscritosRecentes.length === 0 ? (
                      <p className="text-center text-[12px] text-[var(--text-secondary)] py-8 font-medium">Sem alunos registados</p>
                    ) : novosInscritosRecentes.slice(0, 5).map((aluno, idx) => (
                      <button key={aluno.id} type="button"
                        onClick={() => { setAlunoPerfil(aluno); carregarNotas(aluno.id); setAba('contactos'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[5px] transition-colors text-left border-b border-[var(--border-light)] last:border-0 ${idx === 0 ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-[var(--color-secondary-lighter)]/40'}`}>
                        <div className={`relative w-8 h-8 rounded-[4px] flex items-center justify-center text-[11px] font-black nl-text shrink-0 border ${idx === 0 ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-slate-100 border-slate-200'}`}>
                          {aluno.nome.charAt(0).toUpperCase()}
                          {idx === 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 shadow-sm">
                              <Star size={8} className="text-white fill-white" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12px] font-semibold nl-text truncate">{aluno.nome}</p>
                            {idx === 0 && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">Novo parceiro</span>}
                          </div>
                          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">{aluno.categoria || 'Geral'}</p>
                        </div>
                        <span className="text-[10px] font-medium nl-text-muted shrink-0 tabular-nums">
                          {(() => { const d = parseFlexibleDate(aluno.data_matricula); return d ? formatPtDate(d) : '—'; })()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {aba === 'relatorios_detalhado' && (() => {
          const mesIdxRel = MONTH_OPTIONS.indexOf(mesRelatorio);
          const refRelatorio = new Date(anoRelatorio, mesIdxRel + 1, 0);
          const geradoEm = new Date().toLocaleString('pt-PT');

          const alunosPeriodoRel = [...alunos]
            .filter(a => { const e = parseFlexibleDate(a.data_matricula); return e ? e.getTime() <= refRelatorio.getTime() : true; })
            .sort((a, b) => a.nome.localeCompare(b.nome));

          const resumosRel = alunosPeriodoRel.map(aluno => ({ aluno, resumo: summarizeStudentBilling(aluno, pagamentos, refRelatorio) }));

          const totalInscritos = alunosPeriodoRel.length;
          const pagosCount   = resumosRel.filter(r => r.resumo.status === 'pago').length;
          const emDiaCount   = resumosRel.filter(r => ['alerta','pendente','critico','hoje'].includes(r.resumo.status)).length;
          const atrasadosCount = resumosRel.filter(r => r.resumo.status === 'atrasado').length;
          const inativosCount  = resumosRel.filter(r => ['pausado','suspenso','bloqueado'].includes(r.resumo.status)).length;

          const receitaMes   = pagamentos.filter(p => isPaymentInsideMonth(p, mesRelatorio, anoRelatorio)).reduce((s, p) => s + normalizeAmount(p.valor), 0);
          const previsaoMes  = alunosPeriodoRel.filter(a => isOperationallyActive(a.status)).reduce((s, a) => s + normalizeAmount(a.plano), 0);
          const pendenteMes  = Math.max(0, previsaoMes - receitaMes);

          const dadosBarra = MONTH_OPTIONS
            .map((mes, idx) => { if (isFutureMonth(idx, anoRelatorio, new Date())) return null; const total = pagamentos.filter(p => isPaymentInsideMonth(p, mes, anoRelatorio)).reduce((s, p) => s + normalizeAmount(p.valor), 0); return { mes: mes.slice(0,3), total, ativo: mes === mesRelatorio }; })
            .filter(Boolean) as { mes: string; total: number; ativo: boolean }[];
          const maxBarra = Math.max(...dadosBarra.map(d => d.total), 1);

          const donutSegments = [
            { label: 'Em dia',   count: emDiaCount,    color: '#2563EB' },
            { label: 'Pago',     count: pagosCount,    color: '#16A34A' },
            { label: 'Atrasado', count: atrasadosCount, color: '#DC2626' },
            { label: 'Pausado',  count: inativosCount,  color: '#94A3B8' },
          ].filter(s => s.count > 0);
          const donutTotal = donutSegments.reduce((s, seg) => s + seg.count, 0);
          const donutR = 42; const donutCx = 65; const donutCy = 65;
          const donutC = 2 * Math.PI * donutR;
          let donutAngle = 0;
          const donutArcs = donutSegments.map(seg => { const pct = seg.count / donutTotal; const len = pct * donutC; const startAngle = donutAngle - 90; donutAngle += pct * 360; return { ...seg, len, startAngle }; });

          return (
            <div className="animate-slide-up h-full w-full flex flex-col overflow-hidden">
              {/* Timeline — idêntica às outras páginas */}
              <div className="shrink-0 border-b border-[var(--border)] bg-[var(--color-secondary-lighter)]/12">
                <div className="overflow-x-auto py-1.5">
                  <div className="flex min-w-[1100px] items-center gap-4 px-6">
                    <span className="text-[11px] font-extrabold nl-text tracking-tight whitespace-nowrap shrink-0">Período</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setAnoRelatorio(p => p - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] transition-colors"><ChevronLeft size={14} /></button>
                      <div className="rounded-full border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">{anoRelatorio}</div>
                      <button onClick={() => setAnoRelatorio(p => p + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] transition-colors"><ChevronRight size={14} /></button>
                    </div>
                    <div className="relative flex-1 min-w-[520px]">
                      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#D9E2F2]" />
                      <div className="relative flex items-center justify-between gap-1">
                        {MONTH_OPTIONS.map((mes, index) => {
                          if (isFutureMonth(index, anoRelatorio, new Date())) return null;
                          const ativo = mesRelatorio === mes;
                          const atual = anoRelatorio === new Date().getFullYear() && index === new Date().getMonth();
                          return (
                            <button key={mes} onClick={() => setMesRelatorio(mes)} className="group flex min-w-[70px] flex-col items-center gap-0.5 py-1 transition-all">
                              <span className={`h-3 w-3 rounded-full border transition-all ${ativo ? 'border-[var(--color-primary)] bg-[var(--color-primary)] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]' : atual ? 'border-[#2563EB] bg-white' : 'border-[var(--border)] bg-[var(--bg-surface)] group-hover:border-[var(--color-primary)]/45'}`} />
                              <div className={`text-[10px] font-bold uppercase tracking-[0.12em] transition-all ${ativo ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)]'}`}>{mes.slice(0,3)}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => window.print()} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--border-light)] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] hover:bg-[var(--color-secondary-lighter)]/45 transition-colors"><Printer size={12} /> Imprimir</button>
                      <button onClick={() => exportarRelatorioExcel()} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 hover:bg-emerald-100 transition-colors"><Download size={12} /> Excel</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corpo — folha de relatório */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-app)] px-8 py-8">
                <div className="mx-auto max-w-[860px]">
                  <div className="bg-white rounded-[3px] shadow-[0_6px_40px_rgba(15,23,42,0.13),0_1px_4px_rgba(15,23,42,0.07)]">

                    {/* Cabeçalho do documento */}
                    <div className="px-12 pt-10 pb-6 border-b-2 border-[#1E3A5F]">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <img src={appLogo} alt="" className="w-11 h-11 object-contain" />
                          <div>
                            <h1 className="text-[22px] font-black tracking-tight leading-tight uppercase" style={{ color: '#0F1F35' }}>{nomeAcademia}</h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#526070' }}>Sistema de Gestão · {COMPANY_NAME}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[12px] font-black uppercase tracking-[0.1em]" style={{ color: '#1E3A5F' }}>Dossier de Desempenho</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#526070' }}>Relatório Mensal de Mensalidades</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[#D9E2EF]">
                        <div><p className="text-[9px] font-black uppercase tracking-[0.16em] mb-1" style={{ color: '#1E3A5F' }}>Período</p><p className="text-[11px] font-semibold capitalize" style={{ color: '#0F1F35' }}>{mesRelatorio} {anoRelatorio}</p></div>
                        <div><p className="text-[9px] font-black uppercase tracking-[0.16em] mb-1" style={{ color: '#1E3A5F' }}>Gerado em</p><p className="text-[11px] font-semibold" style={{ color: '#0F1F35' }}>{geradoEm}</p></div>
                        <div><p className="text-[9px] font-black uppercase tracking-[0.16em] mb-1" style={{ color: '#1E3A5F' }}>Total no Período</p><p className="text-[11px] font-semibold" style={{ color: '#0F1F35' }}>{totalInscritos} aluno{totalInscritos !== 1 ? 's' : ''}</p></div>
                      </div>
                    </div>

                    {/* KPIs */}
                    <div className="px-12 py-6 border-b border-[#E2E8F0]" style={{ background: '#F8FAFD' }}>
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: 'Total Inscritos', value: String(totalInscritos), sub: 'no período', bg: '#EBF0F8', fg: '#1E3A5F' },
                          { label: 'Em dia / Pago', value: String(pagosCount + emDiaCount), sub: `${Math.round(((pagosCount + emDiaCount) / Math.max(totalInscritos, 1)) * 100)}% do total`, bg: '#DCFCE7', fg: '#166534' },
                          { label: 'Em Atraso', value: String(atrasadosCount), sub: atrasadosCount === 0 ? 'Tudo em dia ✓' : 'requerem atenção', bg: atrasadosCount > 0 ? '#FEE2E2' : '#DCFCE7', fg: atrasadosCount > 0 ? '#991B1B' : '#166534' },
                          { label: 'Receita Cobrada', value: formatCve(receitaMes), sub: `Previsão: ${formatCve(previsaoMes)}`, bg: '#D1FAE5', fg: '#065F46' },
                        ].map((kpi, i) => (
                          <div key={i} className="rounded-[4px] border border-[#E2E8F0] p-4" style={{ background: kpi.bg }}>
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] mb-2" style={{ color: '#526070' }}>{kpi.label}</p>
                            <p className="text-[20px] font-black leading-none truncate" style={{ color: kpi.fg }}>{kpi.value}</p>
                            <p className="text-[9px] mt-1.5" style={{ color: '#526070' }}>{kpi.sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gráficos */}
                    <div className="px-12 py-7 border-b border-[#E2E8F0]">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-5" style={{ color: '#526070' }}>Análise Gráfica</p>
                      <div className="grid grid-cols-2 gap-10">
                        {/* Donut */}
                        <div>
                          <p className="text-[10px] font-bold mb-4" style={{ color: '#1E3A5F' }}>Distribuição por Estado</p>
                          <div className="flex items-center gap-6">
                            <svg width="130" height="130" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
                              <circle cx={donutCx} cy={donutCy} r={donutR} fill="none" stroke="#E2E8F0" strokeWidth={13} />
                              {donutTotal > 0 && donutArcs.map((arc, i) => (
                                <circle key={i} cx={donutCx} cy={donutCy} r={donutR} fill="none" stroke={arc.color} strokeWidth={13}
                                  strokeDasharray={`${arc.len} ${donutC - arc.len}`} strokeDashoffset={0}
                                  transform={`rotate(${arc.startAngle} ${donutCx} ${donutCy})`} strokeLinecap="butt" />
                              ))}
                              <text x={donutCx} y={donutCy - 6} textAnchor="middle" style={{ fontSize: '20px', fontWeight: 800, fill: '#0F1F35', fontFamily: 'system-ui' }}>{totalInscritos}</text>
                              <text x={donutCx} y={donutCy + 11} textAnchor="middle" style={{ fontSize: '8px', fill: '#526070', fontWeight: 700, fontFamily: 'system-ui', letterSpacing: '0.08em' }}>ALUNOS</text>
                            </svg>
                            <div className="flex flex-col gap-3">
                              {donutSegments.map((seg, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: seg.color }} />
                                  <div>
                                    <p className="text-[11px] font-black leading-none" style={{ color: seg.color }}>{seg.count}</p>
                                    <p className="text-[9px] mt-0.5" style={{ color: '#526070' }}>{seg.label}</p>
                                  </div>
                                </div>
                              ))}
                              {donutTotal === 0 && <p className="text-[10px]" style={{ color: '#526070' }}>Sem dados</p>}
                            </div>
                          </div>
                        </div>
                        {/* Barras mensais */}
                        <div>
                          <p className="text-[10px] font-bold mb-4" style={{ color: '#1E3A5F' }}>Receita Mensal — {anoRelatorio}</p>
                          <div className="flex items-end gap-1 h-[88px]">
                            {dadosBarra.map((d, i) => {
                              const h = maxBarra > 0 ? Math.max(3, (d.total / maxBarra) * 76) : 3;
                              return (
                                <div key={i} className="flex flex-col items-center gap-0.5 flex-1" title={`${d.mes}: ${formatCve(d.total)}`}>
                                  <div className="w-full rounded-t-[2px] transition-all" style={{ height: `${h}px`, background: d.ativo ? '#1E3A5F' : '#93BBDC' }} />
                                  <p className="text-[7px] font-bold uppercase" style={{ color: d.ativo ? '#1E3A5F' : '#8A9BB0' }}>{d.mes}</p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between mt-2 text-[8px]" style={{ color: '#8A9BB0' }}>
                            <span>0</span>
                            <span className="font-bold">{formatCve(maxBarra)} máx.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tabela de alunos */}
                    <div className="px-12 py-7 border-b border-[#E2E8F0]">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-5" style={{ color: '#526070' }}>Detalhe por Aluno — <span style={{ color: '#1E3A5F' }}>{mesRelatorio} {anoRelatorio}</span></p>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr style={{ borderBottom: '2px solid #1E3A5F' }}>
                            {['#', 'Nome do Aluno', 'Plano', 'Modalidade', 'Estado', 'Vencimento', 'Cobertura'].map((h, i) => (
                              <th key={i} className="pb-2.5 text-[8px] font-black uppercase tracking-[0.14em]" style={{ color: '#1E3A5F', paddingRight: i < 6 ? '12px' : 0 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {resumosRel.length === 0 && (
                            <tr><td colSpan={7} className="py-10 text-center text-[11px]" style={{ color: '#526070' }}>Nenhum aluno inscrito neste período</td></tr>
                          )}
                          {resumosRel.map(({ aluno, resumo }, idx) => {
                            const tone = getBillingTone(resumo.status);
                            return (
                              <tr key={aluno.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFD', borderBottom: '1px solid #EDF0F5' }}>
                                <td className="py-2.5 pr-3 align-middle text-[10px] font-bold" style={{ color: '#8A9BB0' }}>{String(idx + 1).padStart(2,'0')}</td>
                                <td className="py-2.5 pr-4 align-middle" style={{ width: '30%' }}>
                                  <p className="text-[11px] font-bold leading-tight" style={{ color: '#0F1F35' }}>{aluno.nome}</p>
                                  <p className="text-[9px]" style={{ color: '#8A9BB0' }}>{aluno.telefone || '—'}</p>
                                </td>
                                <td className="py-2.5 pr-4 align-middle text-[10px] font-semibold" style={{ color: '#1E3A5F' }}>{formatCve(aluno.plano)}</td>
                                <td className="py-2.5 pr-4 align-middle">
                                  <span className="px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold uppercase tracking-wider" style={{ background: '#EBF0F8', color: '#1E3A5F' }}>{aluno.modalidade || 'Musc.'}</span>
                                </td>
                                <td className="py-2.5 pr-4 align-middle">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone.color }} />
                                    <span className="text-[10px] font-bold" style={{ color: tone.color }}>{getBillingBadgeLabel(resumo.status)}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 pr-4 align-middle text-[10px]" style={{ color: '#526070' }}>{resumo.nextChargeDate || '—'}</td>
                                <td className="py-2.5 align-middle">
                                  <div className="h-1.5 w-14 overflow-hidden rounded-full mb-0.5" style={{ background: '#E2E8F0' }}>
                                    <div className="h-full rounded-full" style={{ width: `${getTimelineMetricWidth(resumo, aluno.status)}%`, background: tone.color }} />
                                  </div>
                                  <p className="text-[8px]" style={{ color: '#8A9BB0' }}>{resumo.coverageEnd || '—'}</p>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="px-12 py-7 border-b border-[#E2E8F0]" style={{ background: '#F8FAFD' }}>
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-5" style={{ color: '#526070' }}>Resumo Financeiro — {mesRelatorio} {anoRelatorio}</p>
                      <div className="grid grid-cols-3 gap-6 mb-5">
                        <div className="text-center">
                          <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#526070' }}>Receita Prevista</p>
                          <p className="text-[20px] font-black" style={{ color: '#1E3A5F' }}>{formatCve(previsaoMes)}</p>
                          <p className="text-[9px] mt-1" style={{ color: '#8A9BB0' }}>Base: alunos activos</p>
                        </div>
                        <div className="text-center" style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                          <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#526070' }}>Receita Recebida</p>
                          <p className="text-[20px] font-black" style={{ color: '#166534' }}>{formatCve(receitaMes)}</p>
                          <p className="text-[9px] mt-1" style={{ color: '#8A9BB0' }}>{previsaoMes > 0 ? `${Math.round((receitaMes / previsaoMes) * 100)}% realizado` : '—'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#526070' }}>Por Cobrar</p>
                          <p className="text-[20px] font-black" style={{ color: pendenteMes > 0 ? '#991B1B' : '#166534' }}>{formatCve(pendenteMes)}</p>
                          <p className="text-[9px] mt-1" style={{ color: '#8A9BB0' }}>{pendenteMes === 0 ? '100% cobrado ✓' : `${atrasadosCount} em atraso`}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] mb-1.5" style={{ color: '#526070' }}>
                          <span>Progresso de cobrança do mês</span>
                          <span className="font-bold">{previsaoMes > 0 ? `${Math.round((receitaMes / previsaoMes) * 100)}%` : '—'}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${previsaoMes > 0 ? Math.min(100, (receitaMes / previsaoMes) * 100) : 0}%`, background: pendenteMes === 0 ? '#166534' : '#1E3A5F' }} />
                        </div>
                      </div>
                    </div>

                    {/* Rodapé do documento */}
                    <div className="px-12 py-5 flex items-center justify-between" style={{ borderTop: '1px solid #E2E8F0' }}>
                      <div className="flex items-center gap-2">
                        <img src={NEXT_LAB_ICON} alt="" className="w-4 h-4" style={{ opacity: 0.35 }} />
                        <p className="text-[9px]" style={{ color: '#8A9BB0' }}>{COMPANY_NAME} · {nomeAcademia}</p>
                      </div>
                      <p className="text-[9px] text-center" style={{ color: '#8A9BB0' }}>Gerado em {geradoEm} · Versão do momento da exportação</p>
                      <p className="text-[9px] font-bold" style={{ color: '#1E3A5F' }}>Pág. 1 / 1</p>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Module: Alunos */}
        {aba === 'gestao' && (
          <div className="animate-slide-up h-full flex flex-col w-full overflow-hidden">
            <div className="sticky top-0 z-20 overflow-hidden border-b border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="overflow-x-auto bg-[var(--color-secondary-lighter)]/12 transition-all py-1.5">
                <div className="flex min-w-[1180px] items-center gap-4 px-6">
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-extrabold nl-text tracking-tight whitespace-nowrap">
                      Arquivo por mês
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setAnoFinanceiro((prev) => prev - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]"
                        title="Ano anterior"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <div className="rounded-full border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                        {anoFinanceiro}
                      </div>
                      <button
                        onClick={() => setAnoFinanceiro((prev) => prev + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]"
                        title="Próximo ano"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="relative flex-1 min-w-[520px]">
                    <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#D9E2F2]" />
                    <div className="relative flex items-center justify-between gap-1">
                      {timelineMonths.map((month) => (
                        <button
                          key={month.id}
                          onClick={() => setMesFinanceiro(month.label)}
                          className={`group flex min-w-[76px] flex-col items-center rounded-[5px] px-1.5 transition-all ${
                            timelineFinanceiraMinimizada ? 'gap-0 py-0.5' : 'gap-0.5 py-1'
                          }`}
                          title={`${month.label} ${anoFinanceiro} • ${month.count} aluno(s)`}
                        >
                          <span
                            className={`h-3 w-3 rounded-full border transition-all ${
                              month.active
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'
                                : month.isCurrent
                                  ? 'border-[#2563EB] bg-white'
                                  : 'border-[var(--border)] bg-[var(--bg-surface)] group-hover:border-[var(--color-primary)]/45'
                            }`}
                          />
                          <div className={`transition-all ${timelineFinanceiraMinimizada ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
                            <p className={`text-[9px] font-bold uppercase tracking-[0.12em] ${month.active ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)]'}`}>
                              {month.shortLabel}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTimelineFinanceiraMinimizada((prev) => !prev)}
                      className="inline-flex h-7 items-center gap-2 rounded-full border border-[var(--border-light)] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-secondary-lighter)]/45"
                      title={timelineFinanceiraMinimizada ? 'Expandir linha do tempo' : 'Minimizar linha do tempo'}
                    >
                      <ChevronDown size={13} className={`transition-transform ${timelineFinanceiraMinimizada ? '-rotate-90' : 'rotate-0'}`} />
                      {timelineFinanceiraMinimizada ? 'Expandir' : 'Minimizar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden px-6 py-6">
              <div className="mx-auto h-full w-full" style={{ maxWidth: `${larguraListas}px` }}>
                <div className="nl-card flex h-full overflow-hidden flex-col !rounded-[5px] !p-0 border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_20px_38px_rgba(15,23,42,0.08)]">
                  <div className="border-b border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/18 px-4 py-2.5">
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <div className="flex items-center rounded-[3px] border border-[var(--border-light)] bg-[var(--bg-surface)] p-0.5 shrink-0">
                        {[
                          { id: 'todos',    label: 'Todos' },
                          { id: 'divida',   label: 'Em dívida' },
                          { id: 'cobertos', label: 'Cobertos' },
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFiltroStatus(f.id as any)}
                            className={`rounded-[2px] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${
                              filtroStatus === f.id
                                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                : 'text-[var(--text-secondary)] hover:bg-slate-100'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 flex justify-center px-4">
                        <div className="relative w-full max-w-[400px]">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                          <input
                            type="text"
                            placeholder="Buscar por nome ou telefone..."
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                            className="nl-input h-9 w-full !rounded-[3px] !pl-9 !pr-9 !bg-[var(--bg-surface)] !border-[var(--border-light)] text-[12px] shadow-sm"
                          />
                          {pesquisa && (
                            <button
                              type="button"
                              onClick={() => setPesquisa('')}
                              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--color-primary)]"
                              title="Limpar pesquisa"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {[
                          {
                            label: `${mesFinanceiro} ${anoFinanceiro}`,
                            tone: 'bg-[#F2F7FF] border-[#D7E6FF] text-[#1D4ED8]',
                          },
                          {
                            label: 'Alunos',
                            value: String(historicoMensalFiltrado.length),
                            tone: 'bg-[#F2FBF5] border-[#D5EEDC] text-[#15803D]',
                          },
                          {
                            label: 'Entradas',
                            value: String(alunosNovosNoPeriodo.length),
                            tone: 'bg-[#FFF7E8] border-[#F3DFC1] text-[#B45309]',
                          },
                        ].map((pill) => (
                          <span
                            key={pill.label}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${pill.tone}`}
                          >
                            <span className="opacity-80">{pill.label}</span>
                            {pill.value ? <span className="font-black tracking-tight normal-case">{pill.value}</span> : null}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tabela */}
                  <div className="overflow-y-auto flex-1 custom-scrollbar nl-font-list" style={estiloTabelaAlunos}>
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
                        <thead className="bg-[var(--color-secondary-lighter)]/60 text-[10px] font-semibold nl-text-muted uppercase tracking-[0.06em] sticky top-0 z-10 border-b border-[var(--border-light)]">
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
                            const progressoDias = getTimelineMetricWidth(resumo, aluno.status);
                            const paused = isPausedStatus(aluno.status);
                            const blocked = isBlockedStatus(aluno.status);
                            const isAtrasado = resumo.status === 'atrasado' || resumo.status === 'hoje';
                            const isPago = resumo.status === 'pago';
                            const isDentroDoPrazo = !isAtrasado && !isPago;

                            const estadoCor = (() => {
                              if (blocked)       return { dot: '#B91C1C', label: 'Bloqueado', text: '#B91C1C' };
                              if (paused)        return { dot: '#92400E', label: 'Pausado',   text: '#92400E' };
                              if (isAtrasado)    return { dot: '#DC2626', label: resumo.status === 'hoje' ? 'Vence hoje' : 'Atrasado', text: '#DC2626' };
                              if (isPago)        return { dot: '#16A34A', label: 'Em dia',    text: '#16A34A' };
                              if (isDentroDoPrazo) return { dot: '#2563EB', label: 'No prazo',  text: '#2563EB' };
                              return             { dot: '#64748b', label: 'Regular',   text: '#64748b' };
                            })();

                            return (
                              <tr
                                key={`${periodoSelecionadoKey}-${aluno.id}`}
                                className="group border-b border-[var(--border-light)] transition-colors hover:bg-[var(--color-secondary-lighter)]/40 cursor-pointer"
                                onClick={() => marcarComoPago(aluno.id)}
                                title="Clique para abrir painel de cobrança"
                              >
                                {/* Nº */}
                                <td className="align-middle text-center" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                                  <span className="text-[10px] font-medium nl-text-muted tabular-nums">{index + 1}</span>
                                </td>
                                {/* Aluno */}
                                <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-[5px] bg-[var(--color-secondary-lighter)] flex items-center justify-center font-semibold nl-text-muted border border-[var(--border)] overflow-hidden shrink-0" style={{ width: 'var(--list-avatar-size)', height: 'var(--list-avatar-size)', fontSize: 'var(--list-font-secondary)' }}>
                                      {aluno.foto_path ? <img src={`local-resource://${aluno.foto_path}`} className="w-full h-full object-cover" /> : aluno.nome.slice(0,2).toUpperCase()}
                                    </div>
                                    <div className="flex min-w-0 flex-col">
                                      <div className="flex items-center gap-1.5">
                                        <p className="font-medium nl-text group-hover:text-[var(--color-primary)] transition-colors truncate" style={{ fontSize: 'var(--list-font-primary)' }}>{aluno.nome}</p>
                                        {entrouNesteMes && <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary-light)] px-1.5 py-0.5 rounded-[3px] shrink-0">novo</span>}
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
                                {/* Estado — alinhado com dot + barra */}
                                <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="inline-flex items-center gap-1.5 shrink-0" style={{ minWidth: '76px' }}>
                                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: estadoCor.dot }} />
                                      <span className="text-[10px] font-medium" style={{ color: estadoCor.text }}>{estadoCor.label}</span>
                                    </span>
                                    {!paused && !blocked && (
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
                                    <button onClick={(e) => { e.stopPropagation(); marcarComoPago(aluno.id); }}
                                      className="nl-icon-btn !w-6 !h-6 !rounded-[4px] hover:!bg-[var(--color-primary)] hover:!text-white hover:!border-[var(--color-primary)]"
                                      title="Cobrar / Ver detalhes">
                                      <Wallet size={12} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setAlunoPerfil(aluno); setAba('contactos'); carregarNotas(aluno.id); }}
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
        )}

        {/* Module: Finanças — removido, integrado em Alunos */}
        {false && (
          <div className="animate-slide-up h-full flex flex-col w-full overflow-hidden">
            <div className="sticky top-0 z-20 overflow-hidden border-b border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="overflow-x-auto px-6 py-3">
                <div className="flex min-w-[1180px] items-center justify-between gap-8">
                  <div className="flex items-center gap-5 shrink-0">
                    <div className="min-w-0 shrink-0">
                      <h2 className="text-[18px] font-extrabold nl-text tracking-tight whitespace-nowrap">Finanças</h2>
                    </div>

                    <div className="flex items-center rounded-full border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/45 p-1">
                      {[
                        { id: 'todos', label: 'Todos' },
                        { id: 'atrasados', label: 'Em dívida' },
                        { id: 'cobertos', label: 'Cobertos' },
                      ].map((filtro) => (
                        <button
                          key={filtro.id}
                          type="button"
                          onClick={() => setFiltroFinanceiroRapido(filtro.id as FinanceQuickFilter)}
                          className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                            filtroFinanceiroRapido === filtro.id
                              ? 'bg-[var(--color-primary)] text-white shadow-sm'
                              : 'text-[var(--text-secondary)] hover:bg-white/70'
                          }`}
                        >
                          {filtro.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-1 justify-center">
                    <div className="relative min-w-[380px] w-full max-w-[540px]">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                      <input
                        type="text"
                        placeholder="Buscar aluno por nome ou telefone..."
                        value={pesquisaFinanceira}
                        onChange={(e) => setPesquisaFinanceira(e.target.value)}
                        className="nl-input h-10 !rounded-full !pl-10 !pr-10 !bg-[var(--bg-surface)] !border-[var(--border-light)]"
                      />
                      {pesquisaFinanceira && (
                        <button
                          type="button"
                          onClick={() => setPesquisaFinanceira('')}
                          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--color-primary)]"
                          title="Limpar pesquisa"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center shrink-0 gap-3">
                    <button
                      onClick={() => alunoFinanceiroSelecionado && marcarComoPago(alunoFinanceiroSelecionado.id)}
                      disabled={!alunoFinanceiroSelecionado}
                      className={`nl-btn h-9 px-3 whitespace-nowrap !shadow-none ${
                        alunoFinanceiroSelecionado
                          ? 'nl-btn-primary'
                          : 'nl-btn-secondary opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle2 size={16} /> Registar Pagamento
                    </button>
                  </div>
                </div>
              </div>
              <div className={`overflow-x-auto transition-all ${timelineFinanceiraMinimizada ? 'py-1' : 'py-2'}`}>
                <div className={`flex min-w-[1180px] items-center gap-3 ${timelineFinanceiraMinimizada ? 'min-h-[40px]' : 'min-h-[52px]'}`}>
                  <div className="flex items-center gap-2 shrink-0 pl-6">
                    <button onClick={() => setAnoFinanceiro(prev => prev - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]">
                      <ChevronLeft size={14} />
                    </button>
                    <div className="rounded-full border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/28 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      {anoFinanceiro}
                    </div>
                    <button onClick={() => setAnoFinanceiro(prev => prev + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]">
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="relative flex-1 min-w-[520px]">
                    <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#D9E2F2]" />
                    <div className="relative flex items-center justify-between gap-1">
                      {MONTH_OPTIONS.map((mes, index) => {
                        const isFuturo = isFutureMonth(index, anoFinanceiro, new Date());
                        const isMesAtual = anoFinanceiro === new Date().getFullYear() && index === new Date().getMonth();
                        const ativo = mesFinanceiro === mes;
                        if (isFuturo) return null;

                        return (
                          <button
                            key={mes}
                            onClick={() => setMesFinanceiro(mes)}
                            className={`group flex min-w-[70px] flex-col items-center transition-all ${timelineFinanceiraMinimizada ? 'gap-0 py-0.5' : 'gap-1 py-1'}`}
                          >
                            <span className={`h-3 w-3 rounded-full border transition-all ${
                              ativo
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'
                                : isMesAtual
                                  ? 'border-[#2563EB] bg-white'
                                  : 'border-[var(--border)] bg-[var(--bg-surface)] group-hover:border-[var(--color-primary)]/45'
                            }`} />
                            <div className={`${timelineFinanceiraMinimizada ? 'h-0 overflow-hidden opacity-0' : 'px-1 py-0.5 opacity-100'} text-[10px] font-bold uppercase tracking-[0.12em] transition-all ${
                              ativo ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)]'
                            }`}>
                              {mes.slice(0, 3)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pr-6">
                    <button
                      type="button"
                      onClick={() => setTimelineFinanceiraMinimizada((prev) => !prev)}
                      className="inline-flex h-7 items-center gap-2 rounded-full border border-[var(--border-light)] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-secondary-lighter)]/45"
                      title={timelineFinanceiraMinimizada ? 'Expandir régua temporal' : 'Minimizar régua temporal'}
                    >
                      <ChevronDown size={13} className={`transition-transform ${timelineFinanceiraMinimizada ? '-rotate-90' : 'rotate-0'}`} />
                      {timelineFinanceiraMinimizada ? 'Expandir' : 'Minimizar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden px-6 py-10">
              <div className="mx-auto h-full w-full" style={{ maxWidth: `${larguraListas}px` }}>
                <div className="nl-card flex h-full overflow-hidden flex-col !rounded-[5px] !p-0 border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_20px_38px_rgba(15,23,42,0.08)]">
                  <div className="border-b border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/18 px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] nl-text-muted">Lista financeira</p>
                        <h3 className="mt-1 text-[18px] font-extrabold nl-text capitalize tracking-tight">
                          {mesFinanceiro} <span className="text-[var(--color-primary)]">{anoFinanceiro}</span>
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-semibold text-[var(--text-secondary)]">
                        <span>{alunosFinanceirosFiltrados.length} aluno(s)</span>
                        <span>{formatCve(totalRecebidoPeriodo)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 custom-scrollbar" style={estiloTabelaAlunos}>
                      {alunosFinanceirosFiltrados.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50">
                          <CreditCard size={34} />
                          <div className="text-center">
                            <p className="text-[14px] font-bold nl-text uppercase tracking-widest">Nenhum aluno encontrado</p>
                            <p className="text-[12px] nl-text-muted mt-1">Tente outro filtro ou outro período financeiro.</p>
                          </div>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-[var(--color-secondary-lighter)] text-[10px] font-bold nl-text-muted uppercase tracking-[0.08em] sticky top-0 z-10 border-b border-[var(--border)]">
                            <tr>
                              <th className="w-[36%]" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>Aluno</th>
                              <th className="w-[14%]" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>Plano</th>
                              <th className="w-[18%]" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>Cobrança</th>
                              <th className="w-[14%]" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>Estado</th>
                              <th className="w-[12%]" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>Cobertura</th>
                              <th className="w-[6%] text-center" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {alunosFinanceirosFiltrados.map(({ aluno, resumo }, index) => {
                              const tone = getBillingTone(resumo.status);
                              const tom = obterTomPastel(index);
                              const selecionado = alunoFinanceiroSelecionado?.id === aluno.id;

                              return (
                                <tr
                                  key={aluno.id}
                                  className={`group border-b border-[var(--border-light)] transition-colors ${
                                    selecionado ? 'bg-[var(--color-primary-light)]' : `${tone.surface} hover:bg-slate-100`
                                  }`}
                                >
                                  <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className="rounded-[3px] bg-[var(--color-secondary-light)] flex items-center justify-center font-bold nl-text border border-[var(--border)] overflow-hidden"
                                        style={{ width: 'var(--list-avatar-size)', height: 'var(--list-avatar-size)', fontSize: 'var(--list-font-secondary)' }}
                                      >
                                        {aluno.foto_path ? <img src={`local-resource://${aluno.foto_path}`} className="w-full h-full object-cover" /> : aluno.nome.slice(0,2).toUpperCase()}
                                      </div>
                                      <div className="flex min-w-0 flex-col">
                                        <p className={`font-bold truncate transition-colors ${selecionado ? 'text-[var(--color-primary)]' : 'nl-text group-hover:text-[var(--color-primary)]'}`} style={{ fontSize: 'var(--list-font-primary)' }}>{aluno.nome}</p>
                                        <p className="nl-text-muted" style={{ fontSize: 'var(--list-font-secondary)' }}>{aluno.telefone || aluno.id}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                                    <span className="font-semibold nl-text" style={{ fontSize: 'var(--list-font-primary)' }}>{formatCve(aluno.plano)}</span>
                                  </td>
                                  <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                                    <div className="flex flex-col leading-tight">
                                      <span className="font-bold nl-text" style={{ fontSize: 'var(--list-font-primary)' }}>{resumo.nextChargeDate}</span>
                                      <span className={`${tone.accent} font-semibold`} style={{ fontSize: 'var(--list-font-secondary)' }}>{resumo.statusLabel}</span>
                                    </div>
                                  </td>
                                  <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                                    <span className={`badge ${tone.badge}`}>{getBillingBadgeLabel(resumo.status)}</span>
                                  </td>
                                  <td className="align-middle" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                                    <div className="flex flex-col leading-tight">
                                      <span className="font-semibold nl-text" style={{ fontSize: 'var(--list-font-secondary)' }}>
                                        {resumo.coverageEnd || 'Sem cobertura'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="align-middle text-center" style={{ padding: 'var(--list-row-py) var(--list-row-px)' }}>
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => selecionarAlunoFinanceiro(alunoFinanceiroSelecionado?.id === aluno.id ? null : aluno)}
                                        className="w-7 h-7 rounded-[3px] nl-btn-ghost flex items-center justify-center hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-all"
                                        title="Ver resumo"
                                      >
                                        <Eye size={15} />
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module: CRM / Contactos */}
        {aba === 'contactos' && (() => {
          // Uses shared mesFinanceiro/anoFinanceiro — same period as Alunos page
          // alunosDirectorio is already filtered by period (alunosNoPeriodo base)
          const novosNoMes = alunosDirectorio.filter(a =>
            isSameMonthAndYear(parseFlexibleDate(a.data_matricula), mesFinanceiroIndex, anoFinanceiro)
          );
          return (
          <div className="flex flex-col h-full animate-slide-up w-full overflow-hidden">
            {/* Timeline Bar — shared with Alunos */}
            <div className="sticky top-0 z-20 overflow-hidden border-b border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="overflow-x-auto bg-[var(--color-secondary-lighter)]/12 transition-all py-1.5">
                <div className="flex min-w-[1100px] items-center gap-4 px-6">

                  {/* Esquerda: Label + Ano */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-extrabold nl-text tracking-tight whitespace-nowrap">Directório</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setAnoFinanceiro(prev => prev - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]">
                        <ChevronLeft size={14} />
                      </button>
                      <div className="rounded-full border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                        {anoFinanceiro}
                      </div>
                      <button onClick={() => setAnoFinanceiro(prev => prev + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Centro: Timeline de meses (partilhada) */}
                  <div className="relative flex-1 min-w-[520px]">
                    <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#D9E2F2]" />
                    <div className="relative flex items-center justify-between gap-1">
                      {timelineMonths.map(month => (
                        <button
                          key={month.id}
                          onClick={() => setMesFinanceiro(month.label)}
                          className={`group flex min-w-[76px] flex-col items-center rounded-[5px] px-1.5 transition-all ${
                            timelineContactosMinimizada ? 'gap-0 py-0.5' : 'gap-0.5 py-1'
                          }`}
                          title={`${month.label} ${anoFinanceiro} · ${month.count} inscrito(s)`}
                        >
                          <span className={`h-3 w-3 rounded-full border transition-all ${
                            month.active
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'
                              : month.isCurrent
                                ? 'border-[var(--color-primary)] bg-white'
                                : 'border-[var(--border)] bg-[var(--bg-surface)] group-hover:border-[var(--color-primary)]/45'
                          }`} />
                          <div className={`transition-all ${timelineContactosMinimizada ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
                            <p className={`text-[9px] font-bold uppercase tracking-[0.12em] ${month.active ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)]'}`}>
                              {month.shortLabel}
                            </p>
                            {!month.future && month.count > 0 && (
                              <p className={`text-[8px] font-bold ${month.active ? 'text-[var(--color-primary)]' : 'nl-text-muted'}`}>{month.count}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direita: Stats + Toggle */}
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black nl-text leading-none">{alunosDirectorio.length}</span>
                        <span className="text-[9px] nl-text-muted uppercase tracking-tighter">parceiros</span>
                      </div>
                      {novosNoMes.length > 0 && (
                        <span className="text-[9px] font-bold text-emerald-600">+{novosNoMes.length} novos</span>
                      )}
                    </div>
                    {periodoSelecionadoFuturo && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">Mês futuro</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setTimelineContactosMinimizada(prev => !prev)}
                      className="inline-flex h-7 items-center gap-2 rounded-full border border-[var(--border-light)] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-secondary-lighter)]/45"
                    >
                      <ChevronDown size={13} className={`transition-transform ${timelineContactosMinimizada ? '-rotate-90' : 'rotate-0'}`} />
                      {timelineContactosMinimizada ? 'Expandir' : 'Minimizar'}
                    </button>
                  </div>

                </div>
              </div>
            </div>

            <div className="flex gap-5 flex-1 overflow-hidden px-6 py-4" style={{ maxWidth: `${larguraListas}px`, margin: '0 auto', width: '100%' }}>
            {/* Left: Directory Sidebar */}
            <div className="flex flex-col shrink-0 gap-3" style={{ width: `${larguraSidebarContactos}px` }}>
                {/* Header row */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="text-[16px] font-extrabold nl-text tracking-tight">Directório</h3>
                    <p className="text-[11px] nl-text-muted mt-0.5">
                      {periodoSelecionadoFuturo ? '—' : `${alunosDirectorio.length} ${alunosDirectorio.length === 1 ? 'parceiro' : 'parceiros'}`}
                      {!periodoSelecionadoFuturo && novosNoMes.length > 0 && <span className="text-emerald-600 font-semibold ml-1">· +{novosNoMes.length} novos</span>}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'todos',      label: 'Todos' },
                      { id: 'ativos',     label: 'Ativos' },
                      { id: 'pausados',   label: 'Pausados' },
                      { id: 'bloqueados', label: 'Bloq.' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setFiltroDirectorioStatus(item.id as DirectoryFilterStatus)}
                        className={`px-2 py-1 rounded-[5px] text-[10px] font-bold uppercase tracking-[0.1em] border transition-all ${
                          filtroDirectorioStatus === item.id
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                            : 'border-[var(--border)] bg-[var(--bg-surface)] nl-text-muted hover:border-[var(--color-primary)]/40'
                        }`}
                      >{item.label}</button>
                    ))}
                  </div>
                </div>

                {/* Stats + Modos de visualização */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-[5px] border border-[var(--border)] bg-[var(--bg-surface)]">
                    {(() => {
                      const masc = alunosDirectorio.filter(a => getGenderBucket(a.sexo) === 'masculino').length;
                      const fem  = alunosDirectorio.filter(a => getGenderBucket(a.sexo) === 'feminino').length;
                      const total = Math.max(1, masc + fem);
                      return (
                        <>
                          <span className="text-[11px] font-bold nl-text-muted">M <span className="nl-text font-black">{masc}</span></span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--color-secondary-lighter)]">
                            <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${Math.round((masc / total) * 100)}%` }} />
                          </div>
                          <span className="text-[11px] font-bold nl-text-muted">F <span className="nl-text font-black">{fem}</span></span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center border border-[var(--border)] rounded-[4px] overflow-hidden shrink-0">
                    <button onClick={() => setModoListaContactos('normal')} title="Vista normal"
                      className={`flex h-8 w-8 items-center justify-center transition-all ${modoListaContactos === 'normal' ? 'bg-[var(--color-primary)] text-white' : 'nl-text-muted hover:bg-[var(--color-secondary-lighter)]'}`}>
                      <Users size={13} />
                    </button>
                    <button onClick={() => setModoListaContactos('compacto')} title="Vista compacta"
                      className={`flex h-8 w-8 items-center justify-center transition-all border-l border-[var(--border)] ${modoListaContactos === 'compacto' ? 'bg-[var(--color-primary)] text-white' : 'nl-text-muted hover:bg-[var(--color-secondary-lighter)]'}`}>
                      <LayoutList size={13} />
                    </button>
                  </div>
                </div>

                {/* Pesquisa + Ordenação */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 nl-text-muted" />
                    <input
                      type="text"
                      placeholder="Pesquisar nome ou tel..."
                      value={pesquisaDirectorio}
                      onChange={(e) => setPesquisaDirectorio(e.target.value)}
                      className="nl-input !pl-8 !h-8 !text-[12px]"
                    />
                  </div>
                  <select value={ordenacaoDirectorio} onChange={(e) => setOrdenacaoDirectorio(e.target.value as StudentSortMode)} className="nl-input !w-auto !h-8 !text-[11px] shrink-0 pr-6">
                    <option value="alfabetica">A–Z</option>
                    <option value="inscricao_recente">Recente</option>
                    <option value="inscricao_antiga">Antigo</option>
                    <option value="inteligente">Smart</option>
                  </select>
                </div>

                {/* Lista de contactos */}
                <div className="nl-card !p-0 flex flex-col overflow-hidden flex-1 !rounded-[4px]" style={{ border: '1px solid var(--border)' }}>
                  <div className="overflow-y-auto flex-1 custom-scrollbar divide-y divide-[var(--border-light)]">
                    {periodoSelecionadoFuturo ? (
                      <div className="p-8 text-center space-y-2">
                        <Clock size={24} className="mx-auto nl-text-muted opacity-40" />
                        <p className="text-[12px] font-semibold nl-text-muted">{mesFinanceiro.charAt(0).toUpperCase() + mesFinanceiro.slice(1)} {anoFinanceiro}</p>
                        <p className="text-[11px] nl-text-muted opacity-60">Este mês ainda não chegou.<br/>O directório será populado quando o mês iniciar.</p>
                      </div>
                    ) : alunosDirectorio.length === 0 ? (
                      <div className="p-8 text-center nl-text-muted opacity-40">
                        <Users size={24} className="mx-auto mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-widest">Sem resultados</p>
                      </div>
                    ) : alunosDirectorio.map((aluno) => {
                      const isSelected = alunoPerfil?.id === aluno.id;
                      const statusLabel = getStudentStatusLabel(aluno.status);
                      const compact = modoListaContactos === 'compacto';
                      
                      const resumo = summarizeStudentBilling(aluno, pagamentos, referenciaFinanceira);
                      const tone = getBillingTone(resumo.status);
                      
                      const itemBg = isSelected 
                        ? 'bg-[var(--color-primary-light)]' 
                        : `${tone.surface} group-hover:opacity-100`;

                      return (
                        <button
                          key={aluno.id}
                          onClick={() => { setAlunoPerfil(aluno); carregarNotas(aluno.id); }}
                          className={`group w-full flex items-center gap-2.5 text-left transition-all border-l-2 ${compact ? 'px-3 py-2' : 'px-3 py-2.5'} ${itemBg} ${resumo.status === 'atrasado' || resumo.status === 'hoje' ? 'border-l-red-500' : resumo.status === 'pago' ? 'border-l-emerald-500' : 'border-l-blue-500'}`}
                        >
                          {!compact && (
                            <div className={`relative w-8 h-8 rounded-[5px] flex items-center justify-center text-[11px] font-black shrink-0 overflow-hidden border ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : tone.surface + ' ' + tone.accent}`}>
                              {aluno.foto_path ? <img src={`local-resource://${aluno.foto_path}`} className="w-full h-full object-cover" /> : aluno.nome.slice(0,2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate nl-text ${compact ? 'text-[12px]' : 'text-[13px]'}`} style={{ color: isSelected ? 'var(--color-primary)' : undefined }}>{aluno.nome}</p>
                            {!compact && <p className="text-[11px] nl-text-muted truncate">{aluno.telefone || '—'}</p>}
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] shrink-0 border ${
                            isSelected
                              ? 'bg-white text-[var(--color-primary)] border-[var(--color-primary)]/20'
                              : tone.surface + ' ' + tone.accent
                          }`}>
                            {statusLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
            </div>

            {/* Right: Detailed Profile */}
            <div className="flex-1 nl-card !p-0 flex flex-col overflow-hidden !rounded-[4px]" style={{ border: '1px solid var(--border)' }}>
              {alunoPerfil ? (
                <>
                  {(() => {
                    const resumo = summarizeStudentBilling(alunoPerfil, pagamentos, referenciaFinanceira);
                    const tone = getBillingTone(resumo.status);
                    const emAtraso = resumo.status === 'atrasado';
                    
                    return (
                      <div className={`px-6 py-5 border-b flex items-center gap-5 transition-all duration-300 ${tone.surface}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="relative group shrink-0">
                          <div className={`w-20 h-20 rounded-[4px] border-2 overflow-hidden shadow-md ${resumo.status === 'atrasado' ? 'border-red-200' : resumo.status === 'pago' ? 'border-emerald-200' : 'border-blue-200'}`}>
                            {alunoPerfil.foto_path ? <img src={`local-resource://${alunoPerfil.foto_path}`} className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center text-2xl font-black text-white ${tone.button.split(' ')[0]}`}>{alunoPerfil.nome.slice(0,2).toUpperCase()}</div>}
                          </div>
                          <label className="absolute inset-0 bg-black/40 rounded-[4px] flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                            <Camera className="text-white" size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleUploadFoto} />
                          </label>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <h2 className="text-[22px] font-extrabold nl-text tracking-tight leading-tight">{alunoPerfil.nome}</h2>
                                <div className="flex items-center gap-0.5 ml-1 opacity-40 hover:opacity-100 transition-opacity" title={`Pontualidade: ${resumo.rating} estrelas`}>
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={10} className={s <= Math.round(resumo.rating) ? "text-amber-500 fill-amber-500" : "text-slate-300"} />
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={`badge ${tone.badge} !px-2 !py-0.5 !text-[9px]`}>
                                  {resumo.status === 'atrasado' ? 'PENDENTE' : resumo.status === 'pago' ? 'REGULARIZADO' : 'DENTRO DO PRAZO'}
                                </span>
                                <span className="text-[9px] font-bold nl-text-muted px-2 py-0.5 rounded-[4px] bg-white/60 border border-[var(--border)] uppercase tracking-wider">{alunoPerfil.categoria || 'Geral'}</span>
                                <span className="text-[9px] font-bold nl-text-muted px-2 py-0.5 rounded-[4px] bg-white/60 border border-[var(--border)] uppercase tracking-wider">#{alunoPerfil.id.slice(-6)}</span>
                              </div>

                              {emAtraso && (
                                <div className="mt-2 flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle size={12} className="text-red-600" />
                                    <p className="text-[10px] font-black text-red-700 uppercase tracking-tight">Dívida acumulada:</p>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {resumo.monthsInDebt.map(m => (
                                      <span key={m} className="px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-black rounded-[2px] uppercase tracking-wider">{m}</span>
                                    ))}
                                    {resumo.monthsInDebt.length > 1 && (
                                      <button 
                                        onClick={() => abrirResolverPendencias(alunoPerfil)}
                                        className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded-[2px] uppercase tracking-widest hover:bg-black transition-colors ml-1 shadow-sm"
                                      >
                                        Resolver Tudo
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1.5 flex-wrap justify-end shrink-0">
                              <button onClick={() => enviarMensagemWhatsApp(alunoPerfil)} className="nl-icon-btn !w-8 !h-8 !bg-green-500/10 !text-green-700 hover:!bg-green-500 hover:!text-white !border-green-200" title="WhatsApp"><Smartphone size={14} /></button>
                              <button onClick={() => window.open(`mailto:${alunoPerfil.email}`)} className="nl-icon-btn !w-8 !h-8" title="E-mail"><Mail size={14} /></button>
                              <button onClick={() => setAba('gestao')} className="nl-icon-btn !w-8 !h-8" title="Ver em Alunos"><ExternalLink size={14} /></button>
                              <button onClick={() => abrirEdicao(alunoPerfil)} className="nl-btn nl-btn-secondary !h-8 !px-3 !text-[11px] font-bold"><Edit size={13} /> Editar</button>
                              <button onClick={() => marcarComoPago(alunoPerfil.id)} className="nl-btn !bg-emerald-600 !text-white hover:!bg-emerald-700 !h-8 !px-3 !text-[11px] font-bold shadow-md transition-all"><Wallet size={13} /> Cobrar</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex-1 p-5 bg-[var(--bg-surface)] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 h-full items-start">
                      {/* Coluna 1: Perfil & Perigo */}
                      <div className="flex flex-col gap-5">
                        <section className="animate-slide-up">
                          <div className="flex items-center gap-1.5 mb-3">
                            <User size={15} className="text-blue-600" />
                            <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Perfil</h3>
                          </div>
                          
                          <div className="rounded-[6px] border border-[var(--border)] overflow-hidden divide-y divide-[var(--border-light)] shadow-sm bg-white mb-4">
                            {[
                              { label: 'Telemóvel', value: alunoPerfil.telefone, icon: <Phone size={12} /> },
                              { label: 'E-mail', value: alunoPerfil.email || '—', icon: <Mail size={12} /> },
                              { label: 'Morada', value: alunoPerfil.morada || '—', icon: <MapPin size={12} /> },
                            ].map((row, i) => (
                              <div key={row.label} className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">{row.icon}</span>
                                  <p className="text-[10px] font-bold nl-text-muted uppercase tracking-wider">{row.label}</p>
                                </div>
                                <p className="text-[12px] font-semibold nl-text truncate max-w-[120px]">{row.value}</p>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-[6px] border border-[var(--border)] overflow-hidden divide-y divide-[var(--border-light)] shadow-sm bg-white">
                            {[
                              { label: 'Plano', value: formatCve(alunoPerfil.plano), icon: <Wallet size={12} /> },
                              { label: 'Categ.', value: alunoPerfil.categoria || 'Geral', icon: <Tag size={12} /> },
                              { label: 'Inscrito', value: alunoPerfil.data_matricula || '-', icon: <Calendar size={12} /> },
                            ].map((row, i) => (
                              <div key={row.label} className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">{row.icon}</span>
                                  <p className="text-[10px] font-bold nl-text-muted uppercase tracking-wider">{row.label}</p>
                                </div>
                                <p className="text-[12px] font-semibold nl-text truncate max-w-[120px]">{row.value}</p>
                              </div>
                            ))}
                          </div>

                          {(alunoPerfil.objetivos || alunoPerfil.alergias) && (
                            <div className="mt-4 space-y-2">
                              {alunoPerfil.objetivos && (
                                <div className="rounded-[6px] border border-[var(--border)] px-3 py-2 bg-[var(--color-secondary-lighter)]/30 shadow-sm">
                                  <p className="text-[9px] font-bold nl-text-muted uppercase tracking-wider mb-1">Objectivos</p>
                                  <p className="text-[11px] nl-text leading-tight">{alunoPerfil.objetivos}</p>
                                </div>
                              )}
                              {alunoPerfil.alergias && (
                                <div className="rounded-[6px] border border-amber-200 px-3 py-2 bg-amber-50 shadow-sm">
                                  <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1">Alergias</p>
                                  <p className="text-[11px] leading-tight text-amber-900">{alunoPerfil.alergias}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </section>

                        <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                          <div className="flex items-center gap-1.5 mb-3">
                            <Shield size={15} className="text-red-600" />
                            <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Segurança</h3>
                          </div>

                          <div className="rounded-[6px] border border-red-100 bg-red-50/30 p-3 shadow-sm flex flex-col gap-2">
                            {isBlockedStatus(alunoPerfil.status) ? (
                              <button onClick={() => alterarStatus(alunoPerfil.id, 'ativo')} className="w-full nl-btn !bg-white !text-blue-700 border border-blue-200 hover:!bg-blue-50 !h-8 !text-[10px] font-black uppercase tracking-widest shadow-sm"><CheckCircle2 size={12} className="mr-1"/> Reativar</button>
                            ) : isPausedStatus(alunoPerfil.status) ? (
                              <button onClick={() => alterarStatus(alunoPerfil.id, 'ativo')} className="w-full nl-btn !bg-white !text-blue-700 border border-blue-200 hover:!bg-blue-50 !h-8 !text-[10px] font-black uppercase tracking-widest shadow-sm"><CheckCircle2 size={12} className="mr-1"/> Retomar</button>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => abrirConfirmacao({ title: 'Pausar', message: 'O aluno deixa de contar nas mensalidades.', confirmLabel: 'Pausar', tone: 'warning', onConfirm: async () => alterarStatus(alunoPerfil.id, 'pausado') })} className="flex-1 nl-btn !bg-amber-100 !text-amber-800 border border-amber-300 hover:!bg-amber-200 !h-8 !text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors">
                                  <Pause size={12} className="mr-1"/> Pausar
                                </button>
                                <button onClick={() => abrirConfirmacao({ title: 'Bloquear', message: 'O acesso ficará suspenso.', confirmLabel: 'Bloquear', tone: 'warning', onConfirm: async () => alterarStatus(alunoPerfil.id, 'bloqueado') })} className="flex-1 nl-btn !bg-red-100 !text-red-800 border border-red-300 hover:!bg-red-200 !h-8 !text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors">
                                  <Ban size={12} className="mr-1"/> Bloquear
                                </button>
                              </div>
                            )}
                            <button onClick={() => eliminarAluno(alunoPerfil.id)} className="w-full nl-btn !bg-red-600 !text-white border border-red-700 hover:!bg-red-700 !h-8 !text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors">
                              <Trash2 size={12} className="mr-1" /> Eliminar Registo
                            </button>
                          </div>
                        </section>
                      </div>

                      {/* Coluna 2: Financeiro */}
                      <div className="flex flex-col h-[calc(100vh-280px)] xl:h-full">
                        <section className="animate-slide-up flex flex-col h-full" style={{ animationDelay: '0.1s' }}>
                          <div className="flex items-center justify-between mb-3 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <CreditCard size={15} className="text-green-600" />
                              <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Cobranças</h3>
                            </div>
                            <button onClick={() => marcarComoPago(alunoPerfil.id)} className="nl-btn !bg-green-600 !text-white hover:!bg-green-700 !h-7 !px-3 !text-[9px] font-black uppercase tracking-wider shadow-sm">
                              <Wallet size={12} className="mr-1" /> Novo
                            </button>
                          </div>

                          {(() => {
                            const resumoPerfil = summarizeStudentBilling(alunoPerfil, pagamentos);
                            const pagamentosAluno = pagamentos.filter(p => (p.alunoId || p.aluno_id) === alunoPerfil.id).sort((a, b) => (b.id || 0) - (a.id || 0));
                            const tonePerfil = getBillingTone(resumoPerfil.status);
                            
                            return (
                              <div className="flex flex-col flex-1 min-h-0 gap-4">
                                <div className="grid grid-cols-2 gap-2 shrink-0">
                                  {[
                                    { label: 'Estado', value: getBillingBadgeLabel(resumoPerfil.status), cls: tonePerfil.badge },
                                    { label: 'Valor', value: formatCve(alunoPerfil.plano), cls: 'pastel-blue' },
                                    { label: 'Próxima', value: resumoPerfil.nextChargeDate || '-', cls: 'pastel-amber' },
                                    { label: 'Cobertura', value: resumoPerfil.coverageEnd || '—', cls: 'pastel-green' },
                                  ].map(card => (
                                    <div key={card.label} className={`rounded-[6px] border p-2.5 shadow-sm ${card.cls}`}>
                                      <p className="text-[9px] font-bold uppercase tracking-wider opacity-70 mb-0.5">{card.label}</p>
                                      <p className="text-[13px] font-extrabold tracking-tight truncate">{card.value}</p>
                                    </div>
                                  ))}
                                </div>

                                <div className="rounded-[6px] border border-[var(--border)] bg-white shadow-sm flex flex-col flex-1 min-h-0">
                                  <div className="px-3 py-2 border-b border-[var(--border-light)] bg-slate-50 flex items-center justify-between shrink-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest nl-text-muted">Histórico</span>
                                    <span className="text-[9px] font-bold nl-text-muted bg-white px-1.5 py-0.5 rounded-full border border-[var(--border)]">{pagamentosAluno.length} reg.</span>
                                  </div>
                                  
                                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                                    {pagamentosAluno.length === 0 ? (
                                      <div className="p-6 text-center nl-text-muted opacity-40">
                                        <CreditCard size={20} className="mx-auto mb-2 text-slate-300" />
                                        <p className="text-[9px] font-bold uppercase tracking-widest">Vazio</p>
                                      </div>
                                    ) : (
                                      <div className="divide-y divide-[var(--border-light)]">
                                        {pagamentosAluno.map((p, i) => (
                                          <div key={`${p.id}-${i}`} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div>
                                              <p className="text-[12px] font-bold nl-text leading-tight mb-0.5">{p?.data_pagamento || '-'}</p>
                                              <p className="text-[9px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-1.5 py-0.5 rounded-sm inline-block">{p?.metodo_pagamento || '-'}</p>
                                            </div>
                                            <span className="text-[13px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">{formatCve(p?.valor)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </section>
                      </div>

                      {/* Coluna 3: Notas */}
                      <div className="flex flex-col h-[calc(100vh-280px)] xl:h-full">
                        <section className="animate-slide-up flex flex-col h-full" style={{ animationDelay: '0.2s' }}>
                          <div className="flex items-center gap-1.5 mb-3 shrink-0">
                            <MessageSquare size={15} className="text-slate-600" />
                            <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Notas</h3>
                          </div>

                          <div className="flex flex-col flex-1 min-h-0 gap-3">
                            <div className="flex gap-1 p-1 bg-slate-50 border border-slate-200 rounded-[6px] shrink-0">
                              <input type="text" placeholder="Escrever nota..." value={novaNota} onChange={(e) => setNovaNota(e.target.value)} className="flex-1 bg-transparent border-none outline-none px-3 text-[11px] text-slate-700 placeholder-slate-400" onKeyDown={(e) => e.key === 'Enter' && adicionarNota()} />
                              <button onClick={adicionarNota} className="nl-btn nl-btn-primary !h-7 !px-3 !text-[10px] shadow-sm"><Plus size={12} /></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                              {notasContacto.length > 0 ? (
                                <div className="space-y-2">
                                  {notasContacto.map((nota, i) => (
                                    <div key={nota.id} className={`group relative flex flex-col p-3 rounded-[6px] border shadow-sm transition-all ${coresPasteis[i % coresPasteis.length].bg}`} style={{ borderColor: 'var(--border-light)' }}>
                                      <p className="text-[11px] nl-text leading-relaxed pr-5">{nota.texto}</p>
                                      <div className="mt-2 pt-2 border-t border-black/5 flex justify-between items-center">
                                        <p className="text-[9px] font-bold nl-text-muted uppercase tracking-wider">{nota.data_criacao}</p>
                                      </div>
                                      <button onClick={() => eliminarNota(nota.id)} className="absolute top-2 right-2 nl-icon-btn !w-6 !h-6 opacity-0 group-hover:opacity-100 !text-red-500 hover:!bg-red-50 transition-opacity bg-white/80 backdrop-blur border border-red-100 shadow-sm"><Trash2 size={11} /></button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-8 text-center nl-text-muted opacity-40 border border-dashed border-slate-300 rounded-[6px] h-full flex flex-col items-center justify-center">
                                  <MessageSquare size={20} className="mb-2 text-slate-300" />
                                  <p className="text-[9px] font-bold uppercase tracking-widest">Nenhuma nota</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[var(--bg-surface)]">
                  <div className="w-14 h-14 rounded-[6px] flex items-center justify-center nl-text-muted mb-4" style={{ background: 'var(--color-secondary-lighter)', border: '1px solid var(--border)' }}>
                    <BookUser size={28} />
                  </div>
                  <h3 className="text-[16px] font-bold nl-text tracking-tight">Selecione um perfil</h3>
                  <p className="text-[12px] nl-text-muted max-w-[280px] mt-1.5 leading-relaxed">Escolha um aluno na lista lateral para ver dados, histórico de pagamentos e notas.</p>
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => setAba('gestao')}
                      className="nl-btn nl-btn-primary !h-8 !px-4 !text-[12px]"
                    >
                      <Users size={13} /> Ver Alunos
                    </button>
                    <button
                      onClick={() => { setNovoAluno(novoAlunoDefault); setMostrarForm(true); }}
                      className="nl-btn nl-btn-secondary !h-8 !px-4 !text-[12px]"
                    >
                      <Plus size={13} /> Novo Aluno
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
          );
        })()}
        {aba === 'configuracoes' && sessionUser?.role === 'admin' && (
          <div className="flex-1 overflow-hidden flex bg-[var(--bg-app)] animate-fade-in custom-scrollbar overflow-y-auto p-8">
            <div className="mx-auto flex w-full h-fit min-h-[600px] border border-[var(--border)] shadow-sm rounded-[4px]" style={{ maxWidth: `${larguraListas}px` }}>
              {/* Sidebar de Configurações */}
              <div className="w-[240px] border-r border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 p-6 flex flex-col gap-1 shrink-0">
               <div className="mb-4 px-2">
                  <p className="text-[10px] font-black nl-text-muted uppercase tracking-[0.2em] mb-1">Painel de Controlo</p>
                  <h2 className="text-[16px] font-black nl-text tracking-tight uppercase">Ajustes</h2>
               </div>
               
               {([
                  { id: 'geral',          label: 'Academia',      icon: <Landmark size={16} />,    color: 'text-blue-600' },
                  { id: 'utilizadores',   label: 'Utilizadores',  icon: <Users size={16} />,       color: 'text-emerald-600' },
                  { id: 'tema',           label: 'Aparência',     icon: <Palette size={16} />,     color: 'text-purple-600' },
                  { id: 'notificacoes',   label: 'Notificações',  icon: <Bell size={16} />,        color: 'text-rose-600' },
                  { id: 'operacao',       label: 'Operação',      icon: <Shield size={16} />,      color: 'text-orange-600' },
                  { id: 'ajuda',          label: 'Suporte',       icon: <Info size={16} />,        color: 'text-sky-600' },
                  { id: 'sobre',          label: 'Licença',       icon: <Sparkles size={16} />,    color: 'text-amber-600' },
               ] as const).map(item => (
                 <button
                   key={item.id}
                   onClick={() => setConfigAba(item.id as any)}
                   className={`w-full text-left px-4 py-3 rounded-[3px] flex items-center gap-3 transition-all ${
                     configAba === item.id
                       ? 'bg-[var(--bg-surface)] shadow-sm ring-1 ring-black/5 text-[var(--color-primary)] font-bold'
                       : 'nl-text-muted hover:bg-[var(--bg-surface)]/60 hover:text-[var(--text-primary)]'
                   }`}
                 >
                   <div className={`shrink-0 ${configAba === item.id ? '' : item.color}`}>
                     {item.icon}
                   </div>
                   <div className="min-w-0">
                     <p className="text-[13px] leading-tight">{item.label}</p>
                   </div>
                 </button>
               ))}
            </div>

            {/* Conteúdo Dinâmico */}
            <div className="flex-1 bg-[var(--bg-surface)] p-10 lg:p-14 overflow-y-auto custom-scrollbar">
               {configAba === 'geral' && (
                 <div className="animate-slide-up space-y-10">
                    <div>
                      <h3 className="text-[28px] font-black nl-text tracking-tighter uppercase">Instituição</h3>
                      <p className="nl-text-muted font-medium mt-1">Gira as informações públicas e de contacto da sua academia.</p>
                    </div>

                    {/* Logo da academia */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider block">Logótipo da Academia</label>
                      <div className="flex items-center gap-6 p-5 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)]">
                        <div className="w-20 h-20 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                          <img src={appLogo || APP_ICON_PATH} className="w-14 h-14 object-contain" alt="Logo" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[13px] font-semibold nl-text">Imagem usada no sistema, PDFs e cabeçalhos</p>
                          <p className="text-[11px] nl-text-muted">Formatos: PNG, JPEG, SVG · Recomendado: fundo transparente</p>
                          <div className="flex items-center gap-3 mt-2">
                            <input
                              type="file"
                              id="logo-upload-geral"
                              className="hidden"
                              accept="image/svg+xml,image/png,image/jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const result = ev.target?.result as string;
                                    setAppLogo(result);
                                    localStorage.setItem('nl_app_logo', result);
                                    guardarConfiguracao('app_logo', result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <button onClick={() => document.getElementById('logo-upload-geral')?.click()} className="nl-btn nl-btn-secondary h-9 px-4 text-[12px]">
                              Alterar Logo
                            </button>
                            <button onClick={() => { setAppLogo(APP_ICON_PATH); localStorage.removeItem('nl_app_logo'); guardarConfiguracao('app_logo', ''); }} className="text-[11px] font-semibold nl-text-muted hover:text-red-500 transition-colors">
                              Repor padrão
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                       <div className="space-y-2">
                          <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Nome Comercial</label>
                          <input type="text" value={nomeAcademia} onChange={(e) => setNomeAcademia(e.target.value)} className="nl-input w-full h-12 px-4" />
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Telemóvel Suporte</label>
                             <input type="text" value={telefoneAcademia} onChange={(e) => setTelefoneAcademia(e.target.value)} className="nl-input w-full h-12 px-4" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Email de Contacto</label>
                             <input type="email" value={emailAcademia} onChange={(e) => setEmailAcademia(e.target.value)} className="nl-input w-full h-12 px-4" />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Localização / Morada</label>
                          <input type="text" value={moradaAcademia} onChange={(e) => setMoradaAcademia(e.target.value)} className="nl-input w-full h-12 px-4" />
                       </div>
                    </div>

                    {/* ── Slideshow de Login ── */}
                    <div className="space-y-4 pt-8 border-t border-[var(--border)]">
                      <div>
                        <h3 className="text-[14px] font-bold nl-text">Slideshow na Tela de Login</h3>
                        <p className="text-[12px] nl-text-muted mt-0.5">Até 5 imagens que passam automaticamente no painel direito do login. Quando o app estiver inativo, entra em modo apresentação.</p>
                      </div>

                      {/* Imagens do slideshow */}
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const img = slideshowImages[i];
                          return (
                            <div key={i} className="relative aspect-video rounded-[5px] overflow-hidden border border-[var(--border)] bg-[var(--color-secondary-lighter)] group">
                              {img ? (
                                <>
                                  <img src={img} className="w-full h-full object-cover" alt={`Slide ${i + 1}`} />
                                  <button
                                    onClick={() => {
                                      const next = slideshowImages.filter((_, idx) => idx !== i);
                                      setSlideshowImages(next);
                                      localStorage.setItem('nl_slideshow_images', JSON.stringify(next));
                                    }}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >×</button>
                                </>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer nl-text-muted opacity-60 hover:opacity-100 hover:bg-[var(--color-secondary-lighter)] transition-colors gap-1">
                                  <Plus size={14} />
                                  <span className="text-[9px] font-bold uppercase tracking-wider">{i + 1}</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0]; if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const b64 = ev.target?.result as string;
                                      const next = [...slideshowImages]; next[i] = b64;
                                      const filtered = next.filter(Boolean);
                                      setSlideshowImages(filtered);
                                      localStorage.setItem('nl_slideshow_images', JSON.stringify(filtered));
                                    };
                                    reader.readAsDataURL(file);
                                  }} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Timer */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider whitespace-nowrap">Intervalo (seg)</label>
                          <input type="number" min={3} max={30} value={slideshowTimer}
                            onChange={e => { const v = Number(e.target.value); setSlideshowTimer(v); localStorage.setItem('nl_slideshow_timer', String(v)); }}
                            className="nl-input w-16 h-8 text-center text-[13px]" />
                        </div>
                        {/* Texto overlay */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div className={`w-9 h-5 rounded-full transition-colors relative ${slideshowTextEnabled ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`}
                               onClick={() => { const v = !slideshowTextEnabled; setSlideshowTextEnabled(v); localStorage.setItem('nl_slideshow_text', v ? '1' : '0'); }}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${slideshowTextEnabled ? 'left-4' : 'left-0.5'}`} />
                          </div>
                          <span className="text-[12px] nl-text-muted">Mostrar texto sobre as imagens</span>
                        </label>
                        {/* Limpar tudo */}
                        {slideshowImages.length > 0 && (
                          <button onClick={() => { setSlideshowImages([]); localStorage.removeItem('nl_slideshow_images'); }}
                            className="text-[11px] font-bold text-red-500 hover:underline">
                            Limpar Slideshow
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t flex justify-end">
                       <button onClick={salvarDefinicoesGerais} className="nl-btn nl-btn-primary px-10 h-11 font-bold rounded-[3px]">Guardar Alterações</button>
                    </div>
                 </div>
               )}

               {configAba === 'tema' && (
                 <div className="animate-slide-up space-y-10">
                    <div>
                      <h3 className="text-[28px] font-black nl-text tracking-tighter uppercase">Aparência & Branding</h3>
                      <p className="nl-text-muted font-medium mt-1">Personalize o tema e a identidade visual do sistema NEXTLevel.</p>
                    </div>

                    <div className="space-y-8">

                      {/* ── Selector de Tema ── */}
                      <div className="space-y-4">
                        <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider block">Tema da Interface</label>
                        <div className="grid grid-cols-3 gap-4">
                          {([
                            {
                              id: 'light' as const,
                              label: 'Claro',
                              desc: 'Padrão profissional',
                              preview: { bg: '#F4F5F7', surface: '#FFFFFF', header: '#FFFFFF', accent: '#0065FF', text: '#172B4D', border: '#DFE1E6' },
                            },
                            {
                              id: 'dark' as const,
                              label: 'Escuro',
                              desc: 'Conforto nocturno',
                              preview: { bg: '#161A1D', surface: '#22272B', header: '#1D2125', accent: '#579DFF', text: '#F1F2F4', border: '#3D474F' },
                            },
                            {
                              id: 'claude' as const,
                              label: 'Claude',
                              desc: 'Quente & elegante',
                              preview: { bg: '#EDE7DF', surface: '#FAF7F3', header: '#F2EDE6', accent: '#CF7C5A', text: '#1E1612', border: '#DDD4C8' },
                            },
                          ] as const).map((tema) => {
                            const active = appTheme === tema.id;
                            return (
                              <button
                                key={tema.id}
                                onClick={() => { setAppTheme(tema.id); localStorage.setItem('nl_app_theme', tema.id); }}
                                className={`relative flex flex-col rounded-[8px] overflow-hidden border-2 transition-all text-left ${active ? 'border-[var(--color-primary)] shadow-[0_0_0_3px_var(--shadow-primary)]' : 'border-[var(--border)] hover:border-[var(--color-primary)]/40'}`}
                              >
                                {/* Mini preview */}
                                <div className="h-[80px] w-full relative overflow-hidden" style={{ background: tema.preview.bg }}>
                                  {/* Mini header */}
                                  <div className="absolute top-0 left-0 right-0 h-5 flex items-center px-2 gap-1.5" style={{ background: tema.preview.header, borderBottom: `1px solid ${tema.preview.border}` }}>
                                    <div className="w-8 h-1.5 rounded-full" style={{ background: tema.preview.accent }} />
                                    <div className="flex gap-1 ml-auto">
                                      {[0,1,2].map(i => <div key={i} className="h-1.5 rounded-full" style={{ width: i === 0 ? 14 : i === 1 ? 10 : 10, background: tema.preview.border }} />)}
                                    </div>
                                  </div>
                                  {/* Mini content */}
                                  <div className="absolute top-6 left-2 right-2 bottom-2 rounded-[3px] p-2 flex flex-col gap-1" style={{ background: tema.preview.surface, border: `1px solid ${tema.preview.border}` }}>
                                    <div className="h-1.5 rounded-full w-3/4" style={{ background: tema.preview.text, opacity: 0.7 }} />
                                    <div className="h-1 rounded-full w-1/2" style={{ background: tema.preview.border }} />
                                    <div className="h-4 rounded-[2px] w-16 mt-auto" style={{ background: tema.preview.accent }} />
                                  </div>
                                </div>
                                {/* Label */}
                                <div className="px-3 py-2.5 bg-[var(--bg-surface)] border-t border-[var(--border)]">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-[12px] font-bold nl-text">{tema.label}</p>
                                      <p className="text-[10px] nl-text-muted">{tema.desc}</p>
                                    </div>
                                    {active && (
                                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]">
                                        <CheckCircle2 size={12} className="text-white" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[11px] nl-text-muted">O tema aplica-se imediatamente em todo o sistema sem necessidade de reiniciar.</p>
                      </div>

                      <div className="border-t border-[var(--border)]" />

                       <div className="grid grid-cols-2 gap-10">
                          <div className="space-y-4">
                             <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider block">Logotipo da Academia</label>
                             <div className="flex items-center gap-5">
                                <div className="w-24 h-24 rounded-[6px] bg-[var(--color-secondary-lighter)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
                                   <img src={appLogo || APP_ICON_PATH} className="w-16 h-16 object-contain" alt="Logo" />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <input type="file" id="logo-upload" className="hidden" accept="image/svg+xml,image/png,image/jpeg"
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { setAppLogo(ev.target?.result as string); }; reader.readAsDataURL(file); } }}
                                  />
                                  <button onClick={() => document.getElementById('logo-upload')?.click()} className="nl-btn nl-btn-secondary h-10 px-4 text-[12px]">Alterar Logo</button>
                                  <button onClick={() => { setAppLogo(APP_ICON_PATH); localStorage.removeItem('nl_app_logo'); }} className="text-[10px] font-bold text-red-500 hover:underline">Reset Padrão</button>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[11px] font-bold nl-text-muted uppercase tracking-wider block">Banner de Login (50%)</label>
                             <div className="flex items-center gap-5">
                                <div className="w-32 h-20 rounded-[6px] bg-[var(--color-secondary-lighter)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
                                   <img src={bannerAcademia || DEFAULT_ACADEMY_BANNER} className="w-full h-full object-cover" alt="Banner" />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <input type="file" id="banner-upload" className="hidden" accept="image/*"
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { setBannerAcademia(ev.target?.result as string); }; reader.readAsDataURL(file); } }}
                                  />
                                  <button onClick={() => document.getElementById('banner-upload')?.click()} className="nl-btn nl-btn-secondary h-10 px-4 text-[12px]">Upload Imagem</button>
                                  <button onClick={() => { setBannerAcademia(DEFAULT_ACADEMY_BANNER); localStorage.removeItem('nl_banner_academia'); }} className="text-[10px] font-bold text-red-500 hover:underline">Reset Padrão</button>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="p-5 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-[6px]">
                          <p className="text-[12px] font-bold nl-text mb-0.5">Dica de Design</p>
                          <p className="text-[11px] nl-text-muted leading-relaxed">Para o banner de login, recomenda-se imagens horizontais Full HD para garantir impacto visual premium na tela de entrada.</p>
                       </div>

                        <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                           <button onClick={salvarAparencia} className="nl-btn nl-btn-primary px-10 h-11 font-bold rounded-[3px]">Guardar Alterações</button>
                        </div>
                    </div>
                 </div>
               )}

               {configAba === 'utilizadores' && (
                 <div className="animate-slide-up space-y-8">
                    <div className="flex items-center justify-between">
                       <div>
                         <h3 className="text-[28px] font-black nl-text tracking-tighter uppercase">Utilizadores</h3>
                         <p className="nl-text-muted font-medium mt-1">{listaUtilizadores.length} conta(s) · clique para editar ou ver actividade</p>
                       </div>
                       <button onClick={() => setMostrarFormNovoUtilizador(true)} className="nl-btn nl-btn-primary px-6 h-11 flex items-center gap-2">
                          <Plus size={16} /> Novo Utilizador
                       </button>
                    </div>

                    <div className="border border-[var(--border)] rounded-[6px] overflow-hidden bg-[var(--bg-surface)] shadow-sm divide-y divide-[var(--border-light)]">
                       {listaUtilizadores.length === 0 && (
                         <p className="px-6 py-8 text-center text-[13px] nl-text-muted">Nenhum utilizador registado.</p>
                       )}
                       {listaUtilizadores.map(user => {
                         const avatar = utilizadorAvatares[String(user.id)];
                         const isCurrent = sessionUser?.email === user.email;
                         const activityCount = logs.filter(l => l.user_name === user.name).length;
                         return (
                           <button
                             key={user.id}
                             type="button"
                             onClick={() => {
                               setUtilizadorEmEdicao(user);
                               setUtilizadorEdicaoForm({ name: user.name, role: user.role, isActive: user.is_active !== 0, novaSenha: '' });
                               carregarLogs();
                             }}
                             className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[var(--color-secondary-lighter)]/40 transition-colors group"
                           >
                             {/* Avatar */}
                             <div className="relative shrink-0">
                               <div className={`w-11 h-11 rounded-[8px] overflow-hidden flex items-center justify-center font-bold text-[14px] border-2 ${user.is_active === 0 ? 'opacity-40 grayscale' : ''} ${isCurrent ? 'border-[var(--color-primary)]' : 'border-transparent'}`}
                                    style={{ background: avatar ? 'transparent' : `hsl(${(user.name.charCodeAt(0) * 37) % 360}, 60%, 88%)`, color: `hsl(${(user.name.charCodeAt(0) * 37) % 360}, 60%, 35%)` }}>
                                 {avatar
                                   ? <img src={avatar} className="w-full h-full object-cover" alt={user.name} />
                                   : user.name.slice(0, 2).toUpperCase()}
                               </div>
                               {isCurrent && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />}
                             </div>
                             {/* Info */}
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                 <p className="text-[14px] font-semibold nl-text truncate">{user.name}</p>
                                 {isCurrent && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Eu</span>}
                                 {user.is_active === 0 && <span className="text-[9px] font-bold nl-text-muted bg-[var(--color-secondary-lighter)] border border-[var(--border)] px-1.5 py-0.5 rounded-full">Inactivo</span>}
                               </div>
                               <p className="text-[12px] nl-text-muted truncate">{user.email}</p>
                             </div>
                             {/* Role + Quick Access + stats */}
                             <div className="flex items-center gap-2 shrink-0">
                               {/* Toggle Quick Access */}
                               {user.is_active !== 0 && (
                                 <button
                                   type="button"
                                   title={quickAccessUsers.includes(user.id) ? 'Remover acesso rápido' : 'Ativar acesso rápido (sem senha)'}
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setQuickAccessUsers(prev => {
                                       const next = prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id];
                                       localStorage.setItem('nl_quick_access_users', JSON.stringify(next));
                                       setLoginSlideshowUsers(listaUtilizadores.filter(u => next.includes(u.id) && u.is_active !== 0));
                                       return next;
                                     });
                                   }}
                                   className={`flex items-center gap-1 h-6 px-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${quickAccessUsers.includes(user.id) ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'}`}
                                 >
                                   <Zap size={9} /> Quick
                                 </button>
                               )}
                               {activityCount > 0 && (
                                 <span className="text-[11px] nl-text-muted">{activityCount} acção{activityCount !== 1 ? 'ões' : ''}</span>
                               )}
                               <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                 {user.role === 'admin' ? 'Admin' : 'Operador'}
                               </span>
                               <ChevronRight size={14} className="nl-text-muted group-hover:text-[var(--color-primary)] transition-colors" />
                             </div>
                           </button>
                         );
                       })}
                    </div>
                 </div>
               )}

               {configAba === 'notificacoes' && (
                 <div className="animate-slide-up space-y-10">
                    <div>
                      <h3 className="text-[28px] font-black nl-text tracking-tighter uppercase">Notificações</h3>
                      <p className="nl-text-muted font-medium mt-1">Controle quais alertas e avisos recebe no sistema.</p>
                    </div>

                    {/* Notificações Desktop */}
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold nl-text-muted uppercase tracking-wider border-b border-[var(--border-light)] pb-2">Sistema</p>
                      <div className="space-y-3">
                        {([
                          { label: 'Notificações de sistema (desktop)', sub: 'Alertas via notificação nativa do sistema operativo', val: desktopNotificationsEnabled, set: setDesktopNotificationsEnabled },
                          { label: 'Alertas do sistema', sub: 'Avisos de backup, actualizações e manutenção', val: notifSistema, set: setNotifSistema },
                        ] as const).map(row => (
                          <div key={row.label} className="flex items-center justify-between p-4 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)]">
                            <div>
                              <p className="text-[13px] font-semibold nl-text">{row.label}</p>
                              <p className="text-[11px] nl-text-muted mt-0.5">{row.sub}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => row.set(!row.val)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${row.val ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${row.val ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Categorias de notificação */}
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold nl-text-muted uppercase tracking-wider border-b border-[var(--border-light)] pb-2">Categorias</p>
                      <div className="space-y-3">
                        {([
                          { label: 'Pagamentos', sub: 'Confirmação de pagamentos registados e cobranças pendentes', icon: <CreditCard size={16} className="text-emerald-600" />, val: notifPagamentos, set: setNotifPagamentos },
                          { label: 'Matrículas', sub: 'Novos alunos inscritos e alterações de estado', icon: <UserPlus size={16} className="text-blue-600" />, val: notifMatriculas, set: setNotifMatriculas },
                          { label: 'Relatórios mensais', sub: 'Aviso quando o relatório do mês está disponível para exportar', icon: <FileBarChart size={16} className="text-amber-600" />, val: notifRelatorios, set: setNotifRelatorios },
                        ] as const).map(row => (
                          <div key={row.label} className="flex items-center justify-between p-4 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-[5px] bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-sm">
                                {row.icon}
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold nl-text">{row.label}</p>
                                <p className="text-[11px] nl-text-muted mt-0.5">{row.sub}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => row.set(!row.val)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${row.val ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${row.val ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Relatório mensal disponível */}
                    {relatorioMensalDisponivel && (
                      <div className="p-5 rounded-[8px] bg-amber-50 border border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[6px] bg-amber-100 flex items-center justify-center shrink-0">
                            <FileBarChart size={20} className="text-amber-700" />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-amber-900">Relatório de {relatorioMensalDisponivel} disponível</p>
                            <p className="text-[11px] text-amber-700 mt-0.5">Aceda à página Alunos e exporte em PDF ou Excel.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setAba('gestao'); setMostrarModalExport(true); }}
                          className="nl-btn nl-btn-primary px-5 h-9 text-[12px] shrink-0"
                        >
                          Exportar
                        </button>
                      </div>
                    )}

                    {/* Histórico de notificações */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-2">
                        <p className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Histórico</p>
                        {notificacoes.length > 0 && (
                          <button type="button" onClick={() => setNotificacoes([])} className="text-[11px] text-red-500 font-semibold hover:underline">Limpar tudo</button>
                        )}
                      </div>
                      {notificacoes.length === 0 ? (
                        <p className="text-[13px] nl-text-muted text-center py-6">Sem notificações.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                          {notificacoes.slice().reverse().map(n => (
                            <div key={n.id} className={`flex items-start gap-3 p-3 rounded-[5px] border ${n.lida ? 'bg-[var(--color-secondary-lighter)] border-[var(--border)]' : 'bg-blue-50 border-blue-100'}`}>
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.tipo === 'sucesso' ? 'bg-emerald-500' : n.tipo === 'alerta' ? 'bg-amber-500' : n.tipo === 'erro' ? 'bg-red-500' : 'bg-blue-500'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold nl-text">{n.titulo}</p>
                                <p className="text-[11px] nl-text-muted mt-0.5 line-clamp-2">{n.mensagem}</p>
                                <p className="text-[10px] nl-text-muted mt-1">{n.data}</p>
                              </div>
                              {!n.lida && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t flex justify-end">
                      <button onClick={salvarPreferenciasNotificacoes} className="nl-btn nl-btn-primary px-10 h-11 font-bold rounded-[3px]">Guardar Preferências</button>
                    </div>
                 </div>
               )}

               {configAba === 'operacao' && (
                 <div className=" animate-slide-up space-y-10">
                    <div>
                      <h3 className="text-[28px] font-black nl-text tracking-tighter uppercase">Operação & Segurança</h3>
                      <p className="nl-text-muted font-medium mt-1">Ferramentas de manutenção e cópias de segurança.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                       <div className="p-8 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)] flex flex-col gap-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-[var(--bg-surface)] rounded-[6px] shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                                  <Archive size={24} />
                               </div>
                               <div>
                                  <p className="text-[16px] font-black nl-text">Backup Integral (ZIP)</p>
                                  <p className="text-[12px] nl-text-muted">Exportar base de dados e ficheiros locais.</p>
                               </div>
                            </div>
                            <button onClick={gerarBackup} className="nl-btn nl-btn-primary px-8 h-12 shadow-blue-500/10 whitespace-nowrap">Exportar Agora</button>
                          </div>
                          
                          <div className="flex items-center gap-4 bg-[var(--bg-surface)] p-4 rounded-md border border-[var(--border)] mt-2">
                             <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-bold uppercase tracking-widest nl-text-muted mb-1">Pasta de Backups (Opcional)</p>
                               <p className="text-[13px] font-medium nl-text truncate" title={diretorioBackup || 'Guardar e escolher na hora'}>
                                 {diretorioBackup || 'O sistema perguntará onde guardar cada vez'}
                               </p>
                             </div>
                             <button onClick={selecionarDiretorioBackup} className="px-4 py-2 text-[11px] font-black uppercase tracking-widest nl-text-muted bg-[var(--color-secondary-lighter)] border border-[var(--border)] hover:bg-[var(--color-secondary-lighter)]/80 rounded-md transition-colors whitespace-nowrap">
                               Escolher Pasta
                             </button>
                             {diretorioBackup && (
                               <button onClick={async () => {
                                 setDiretorioBackup('');
                                 await electron?.ipcRenderer.invoke('update-configuracao', 'diretorio_backup', '');
                               }} className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap">
                                 Limpar
                               </button>
                             )}
                          </div>
                       </div>

                       <div className="p-8 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border)] flex items-center justify-between opacity-50 cursor-not-allowed">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 bg-[var(--bg-surface)] rounded-[6px] shadow-sm flex items-center justify-center nl-text-muted">
                                <Database size={24} />
                             </div>
                             <div>
                                <p className="text-[16px] font-black nl-text">Limpeza de Cache</p>
                                <p className="text-[12px] nl-text-muted">Otimizar base de dados interna.</p>
                             </div>
                          </div>
                          <button className="nl-btn nl-btn-secondary px-8 h-12" disabled>Otimizar</button>
                       </div>
                    </div>
                 </div>
               )}

               {configAba === 'ajuda' && (
                 <div className="animate-slide-up space-y-12">
                    <div className="text-center space-y-5">
                       <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto text-white shadow-2xl relative group transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
                          <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                          <HelpCircle size={48} className="relative z-10" />
                       </div>
                       <div>
                          <h3 className="text-[36px] font-black nl-text tracking-tighter uppercase leading-none">Centro de Ajuda</h3>
                          <p className="nl-text-muted font-medium max-w-sm mx-auto mt-4 leading-relaxed">Assistência técnica dedicada e esclarecimento de dúvidas sobre o ecossistema <span className="font-black nl-text">NEXTLevel</span>.</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <button onClick={() => electron?.ipcRenderer.invoke('open-external', `mailto:${COMPANY_EMAIL}`)} className="group p-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all text-left relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-light)] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-6 text-blue-600">
                             <Mail size={24} />
                          </div>
                          <p className="text-[18px] font-black nl-text mb-1">Suporte via E-mail</p>
                          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em]">Resposta prioritária 24h</p>
                       </button>

                       <button onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)} className="group p-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all text-left relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-secondary-lighter)] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                          <div className="w-12 h-12 rounded-lg bg-[var(--color-secondary-lighter)] flex items-center justify-center mb-6 nl-text-muted">
                             <Globe size={24} />
                          </div>
                          <p className="text-[18px] font-black nl-text mb-1">Portal do Cliente</p>
                          <p className="text-[11px] font-bold nl-text-muted uppercase tracking-[0.2em]">nextlab.com/suporte</p>
                       </button>
                    </div>

                    <div className="relative p-10 rounded-2xl overflow-hidden shadow-2xl group transition-all duration-500 hover:shadow-blue-900/20" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
                       <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center relative shadow-inner">
                                <Phone size={28} className="text-blue-400" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0F172A] rounded-full animate-pulse" />
                             </div>
                             <div>
                                <div className="flex items-center gap-3">
                                   <p className="text-[18px] font-black text-white">Suporte Directo</p>
                                   <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">Online</span>
                                </div>
                                <p className="text-white/60 text-[14px] mt-1 font-medium tracking-wide">{COMPANY_PHONE}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Atendimento Comercial</p>
                             <p className="text-white/40 text-[11px] font-medium italic">Disponível em dias úteis, 09h — 18h</p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {configAba === 'sobre' && (
                 <div className="animate-slide-up">
                   <div className="mx-auto max-w-[640px] bg-white py-14 px-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

                     {/* Logos */}
                     <div className="flex items-center justify-between mb-14">
                       <div className="flex items-center gap-3">
                         <img src={appLogo || APP_ICON_PATH} className="w-9 h-9 object-contain" alt="NEXTLevel" />
                         <div>
                           <p className="text-[15px] font-bold text-slate-900 leading-none tracking-tight">NEXTLevel</p>
                           <p className="text-[11px] text-slate-400 mt-0.5">Sistema de Gestão de Academias</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2.5">
                         <img src={NEXT_LAB_ICON} className="w-7 h-7 object-contain opacity-70" alt="NEXT Lab" />
                         <div className="text-right">
                           <p className="text-[13px] font-semibold text-slate-700 leading-none">NEXT Lab</p>
                           <p className="text-[11px] text-slate-400 mt-0.5">Creative Studio · desde 1995</p>
                         </div>
                       </div>
                     </div>

                     {/* Título */}
                     <div className="mb-10">
                       <p className="text-[10px] text-slate-400 uppercase tracking-[0.25em] mb-2">Acordo de Licença de Utilização</p>
                       <h1 className="text-[26px] font-bold text-slate-900 leading-tight tracking-tight">
                         NEXTLevel — Licença de Uso de Software
                       </h1>
                       <p className="text-[13px] text-slate-400 mt-2">
                         Emitido em {new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                         {licencaDados.chave && ` · Licença: ${licencaDados.tipo || 'Standard'} · Válida até ${licencaDados.expiracao || 'Vitalícia'}`}
                       </p>
                     </div>

                     {/* Corpo do texto */}
                     <div className="space-y-8 text-[14px] text-slate-600 leading-[1.9]" style={{ textAlign: 'justify' }}>

                       <div>
                         <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">1. Propriedade Intelectual</p>
                         <p>O presente software, incluindo o seu código-fonte, design, arquitectura e documentação, é propriedade intelectual exclusiva de <strong className="text-slate-800 font-semibold">Ivaldino da Luz Fortes</strong>, CEO da <strong className="text-slate-800 font-semibold">NEXT Lab</strong>. Todos os direitos reservados nos termos da legislação vigente sobre direitos de autor e propriedade intelectual. Qualquer reprodução, distribuição ou utilização não autorizada constitui violação do presente acordo e poderá implicar responsabilidade civil e criminal.</p>
                       </div>

                       <div>
                         <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">2. Licença de Uso</p>
                         <p>A licença concedida é de carácter pessoal e intransferível, válida para uma única entidade — pessoa singular ou colectiva — identificada no momento da activação. Fica expressamente proibida a cedência, partilha ou sublicenciamento a terceiros; a instalação simultânea em múltiplos terminais sem autorização escrita do desenvolvedor; bem como a engenharia reversa, modificação ou redistribuição do software sob qualquer forma.</p>
                       </div>

                       <div>
                         <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">3. Dados e Privacidade</p>
                         <p>O NEXTLevel opera em modo totalmente offline. Todos os dados introduzidos — incluindo informações de alunos, pagamentos e configurações — são armazenados exclusivamente no dispositivo local do utilizador. A NEXT Lab não tem acesso, não armazena nem transmite qualquer dado pessoal ou operacional. O utilizador é o único responsável pela gestão, segurança e integridade das suas informações.</p>
                       </div>

                       <div>
                         <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">4. Cópias de Segurança</p>
                         <p>Recomenda-se vivamente a realização periódica de cópias de segurança através das ferramentas disponíveis no sistema — exportação ZIP completa e exportação de dossier operacional em Excel. Estas cópias devem ser conservadas em suporte externo independente. A NEXT Lab declina qualquer responsabilidade por perda de dados resultante de falha de hardware, eliminação acidental ou causas externas ao software.</p>
                       </div>

                       <div>
                         <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">5. Suporte Técnico</p>
                         <p>Para questões técnicas, esclarecimentos ou solicitação de actualizações, o utilizador deverá contactar directamente o desenvolvedor pelos meios indicados neste documento. O suporte técnico encontra-se garantido durante todo o período de vigência da licença, sem encargos adicionais para o utilizador licenciado.</p>
                       </div>

                       <div>
                         <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.15em] mb-3">6. Limitação de Responsabilidade</p>
                         <p>O software é fornecido no estado em que se encontra. A NEXT Lab não garante que o funcionamento seja ininterrupto ou isento de erros, nem se responsabiliza por danos directos ou indirectos decorrentes da utilização do software, incluindo perda de dados, lucros cessantes ou interrupção de actividade, mesmo que tenha sido advertida da possibilidade de tais danos.</p>
                       </div>
                     </div>

                     {/* Separador */}
                     <div className="my-12 border-t border-slate-100" />

                     {/* Assinatura */}
                     <div className="flex items-end justify-between gap-8">
                       <div>
                         <p className="text-[11px] text-slate-400 uppercase tracking-[0.15em] mb-2">Desenvolvedor & CEO</p>
                         <p className="text-[20px] text-slate-900 leading-none mb-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Ivaldino da Luz Fortes</p>
                         <p className="text-[12px] text-slate-400">NEXT Lab · Cabo Verde</p>
                         <div className="flex items-center gap-5 mt-3 text-[12px] text-slate-400">
                           <span>{COMPANY_EMAIL}</span>
                           <span>{COMPANY_PHONE}</span>
                         </div>
                       </div>
                       <div className="text-right shrink-0">
                         <img src={NEXT_LAB_ICON} className="w-10 h-10 object-contain opacity-30 ml-auto" alt="NEXT Lab" />
                         <p className="text-[10px] text-slate-300 mt-2 uppercase tracking-widest">NEXT Lab</p>
                       </div>
                     </div>

                     {/* Rodapé da página */}
                     <div className="mt-14 pt-6 border-t border-slate-100 flex items-center justify-between">
                       <p className="text-[11px] text-slate-300">© {new Date().getFullYear()} NEXT Lab. Todos os direitos reservados.</p>
                       <p className="text-[11px] text-slate-300">NEXTLevel · versão 1.0 Beta</p>
                     </div>
                   </div>
                 </div>
               )}
            </div>
          </div>
            </div>
        )}
    </main>

    {/* Modal: Nova Matrícula */}
    {mostrarForm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={() => setMostrarForm(false)}>
        <div className="bg-[var(--bg-surface)] w-full max-w-[500px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>

          {/* Cabeçalho */}
          <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Nova Matrícula</h2>
            </div>
            <div className="flex-1 flex justify-end px-3">
              <button onClick={() => setMostrarForm(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                <X size={16} />
              </button>
            </div>
          </div>

          <form onSubmit={salvarAluno} className="overflow-y-auto custom-scrollbar">

            {/* Secção 1 — Identificação */}
            <div className="px-5 pt-4 pb-3 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Identificação</p>

              {/* Nome */}
              <div>
                <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nome do aluno..."
                  value={novoAluno.nome}
                  onChange={e => setNovoAluno({ ...novoAluno, nome: e.target.value })}
                  className="nl-input w-full h-10 px-3 text-[13px]"
                  required
                  autoFocus
                />
              </div>

              {/* Tel + Categoria */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">
                    Telemóvel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+238 000 00 00"
                    value={novoAluno.telefone}
                    onChange={e => setNovoAluno({ ...novoAluno, telefone: e.target.value })}
                    className="nl-input w-full h-10 px-3 text-[13px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Modalidade</label>
                  <select
                    value={novoAluno.categoria}
                    onChange={e => setNovoAluno({ ...novoAluno, categoria: e.target.value })}
                    className="nl-input w-full h-10 px-3 text-[13px] cursor-pointer"
                  >
                    <option value="">Sem categoria</option>
                    {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {/* Sexo (opcional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Sexo</label>
                  <select
                    value={novoAluno.sexo}
                    onChange={e => setNovoAluno({ ...novoAluno, sexo: e.target.value })}
                    className="nl-input w-full h-10 px-3 text-[13px] cursor-pointer"
                  >
                    <option value="">—</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Separador tracejado */}
            <div style={{ borderTop: '1px dashed var(--border-light)', margin: '0 20px' }} />

            {/* Secção 2 — Plano & Pagamento */}
            <div className="px-5 pt-4 pb-5 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Plano & Pagamento</p>

              {/* Mensalidade + Data inscrição */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">
                    Mensalidade (CVE) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="3 500"
                    value={novoAluno.plano}
                    onChange={e => setNovoAluno({ ...novoAluno, plano: e.target.value })}
                    className="nl-input w-full h-10 px-3 text-[14px] font-bold"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Data de inscrição</label>
                  <input
                    type="date"
                    value={novoAluno.data_matricula}
                    onChange={e => setNovoAluno({ ...novoAluno, data_matricula: e.target.value })}
                    className="nl-input w-full h-10 px-3 text-[13px]"
                  />
                </div>
              </div>

              {/* Modo de inscrição — pills compactos */}
              <div>
                <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1.5">Modo de inscrição</label>
                <div className="flex gap-2">
                  {([
                    { id: 'matricula',       label: 'Só matrícula',  desc: 'Cobra mais tarde',  icon: <FileText size={13} /> },
                    { id: 'matricula_pago',  label: 'Pagar agora',   desc: 'Regista pagamento', icon: <CheckCircle2 size={13} /> },
                  ] as const).map(opt => {
                    const active = novoAluno.modo_inscricao === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNovoAluno({ ...novoAluno, modo_inscricao: opt.id })}
                        className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] border-2 text-left transition-all ${
                          active
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                            : 'border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 hover:border-[var(--border)]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 ${active ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--border-light)] text-[var(--text-secondary)]'}`}>
                          {opt.icon}
                        </div>
                        <div>
                          <p className={`text-[11px] font-bold leading-tight ${active ? 'text-[var(--color-primary)]' : 'nl-text'}`}>{opt.label}</p>
                          <p className="text-[9px] text-[var(--text-secondary)] leading-tight">{opt.desc}</p>
                        </div>
                        {active && <CheckCircle2 size={13} className="ml-auto text-[var(--color-primary)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview da próxima cobrança */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-[8px] bg-[#EEF4FF] border border-[#C7DEFF]">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-[#1D4ED8]" />
                  <span className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-[0.1em]">
                    {novoAluno.modo_inscricao === 'matricula_pago' ? 'Próxima cobrança' : 'Primeira cobrança'}
                  </span>
                </div>
                <span className="text-[13px] font-extrabold text-[#1D4ED8]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {previewVencimento || '— / — / ——'}
                </span>
              </div>
            </div>

          </form>

          {/* Rodapé */}
          <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button type="button" onClick={() => setMostrarForm(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Cancelar</button>
            <button type="button" onClick={salvarAluno} className="nl-btn nl-btn-primary !h-9 !px-6 !text-[11px] font-bold">
              <UserPlus size={14} /> Confirmar Registo
            </button>
          </div>
        </div>
      </div>
    )}


    {/* Modal: Resolver Tudo (Pendências) */}
    {mostrarResolverPendencias && alunoParaResolver && (
      <div className="fixed inset-0 nl-modal-overlay flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
        <div className="bg-[var(--bg-surface)] w-full max-w-[450px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[8px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
          <div className="bg-slate-900 h-14 flex items-center shrink-0 px-6">
            <div className="flex-1 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <AlertCircle size={18} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none">Regularização</p>
                <h2 className="text-[14px] font-bold text-white tracking-tight">Resolver Pendências</h2>
              </div>
            </div>
            <button onClick={() => setMostrarResolverPendencias(false)} className="h-8 w-8 flex items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-all">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-[13px] nl-text-muted">Estás a regularizar a conta de</p>
              <p className="text-[18px] font-black nl-text mt-1">{alunoParaResolver.nome}</p>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Meses Selecionados</p>
              <div className="grid grid-cols-2 gap-2">
                {mesesParaResolver.map(mes => (
                  <div key={mes} className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold">
                    <CheckCircle2 size={12} /> {mes}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-[8px] bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total a Liquidar</p>
                <p className="text-[20px] font-black nl-text">{formatCve(normalizeAmount(alunoParaResolver.plano) * mesesParaResolver.length)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Método</p>
                <p className="text-[11px] font-bold text-slate-700">Dinheiro</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
            <button onClick={() => setMostrarResolverPendencias(false)} className="flex-1 nl-btn nl-btn-secondary !h-11 !text-[12px] font-bold uppercase tracking-widest">Cancelar</button>
            <button onClick={resolverPendencias} className="flex-[2] nl-btn !bg-slate-900 !text-white hover:!bg-black !h-11 !text-[12px] font-black uppercase tracking-widest shadow-lg">
               Resolver {mesesParaResolver.length} Mensalidades
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal: Editar Registo */}
    {mostrarFormEdicao && alunoEdicao && (
      <div className="fixed inset-0 nl-modal-overlay flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
        <div className="bg-[var(--bg-surface)] w-full max-w-[650px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
          <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Editar Registo: {alunoEdicao.id.slice(-8)}</h2>
            </div>
            <div className="flex-1 flex justify-end px-3">
              <button onClick={() => { setMostrarFormEdicao(false); setAlunoEdicao(null); setNovoAluno(novoAlunoDefault); }} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                <X size={16} />
              </button>
            </div>
          </div>

          <form id="editar-aluno-form" onSubmit={salvarEdicao} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Nome Completo</label>
                <input type="text" value={novoAluno.nome} onChange={(e) => setNovoAluno({ ...novoAluno, nome: e.target.value })} className="nl-input w-full h-12 px-4" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Telefone</label>
                <input type="tel" value={novoAluno.telefone} onChange={(e) => setNovoAluno({ ...novoAluno, telefone: e.target.value })} className="nl-input w-full h-12 px-4" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Modalidade</label>
                <select value={novoAluno.categoria} onChange={(e) => setNovoAluno({ ...novoAluno, categoria: e.target.value })} className="nl-input w-full h-12 px-4 cursor-pointer" required>
                  {Array.from(new Set([...categorias, novoAluno.categoria || 'Geral'])).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Mensalidade (CVE)</label>
                <input type="text" value={novoAluno.plano} onChange={(e) => setNovoAluno({ ...novoAluno, plano: e.target.value })} className="nl-input w-full h-12 px-4 font-bold" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Próximo Vencimento</label>
                <input type="text" value={(novoAluno as any).vencimento} onChange={(e) => setNovoAluno({ ...novoAluno, vencimento: e.target.value } as any)} className="nl-input w-full h-12 px-4" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Data de Inscrição</label>
                <input type="date" value={novoAluno.data_matricula} onChange={(e) => setNovoAluno({ ...novoAluno, data_matricula: e.target.value })} className="nl-input w-full h-12 px-4" />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Sexo</label>
                <select value={novoAluno.sexo} onChange={(e) => setNovoAluno({ ...novoAluno, sexo: e.target.value })} className="nl-input w-full h-12 px-4 cursor-pointer">
                  <option value="">Selecionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Modo de Cobrança</label>
                <select value={novoAluno.modo_cobranca} onChange={(e) => setNovoAluno({ ...novoAluno, modo_cobranca: e.target.value as 'mensalidade_movel' | 'mensalidade_fixa' })} className="nl-input w-full h-12 px-4 cursor-pointer" required>
                  <option value="mensalidade_movel">Móvel (30 dias após pagamento)</option>
                  <option value="mensalidade_fixa">Fixa (dia 1 ao 5 do mês)</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Endereço de Email</label>
                <input type="email" value={novoAluno.email} onChange={(e) => setNovoAluno({ ...novoAluno, email: e.target.value })} className="nl-input w-full h-12 px-4" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Morada de Residência</label>
                <input type="text" value={novoAluno.morada} onChange={(e) => setNovoAluno({ ...novoAluno, morada: e.target.value })} className="nl-input w-full h-12 px-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Alergias</label>
                <textarea value={novoAluno.alergias} onChange={(e) => setNovoAluno({ ...novoAluno, alergias: e.target.value })} className="nl-input min-h-[112px] px-4 py-3 resize-none" placeholder="Informações relevantes para a equipa..." />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Objetivos</label>
                <textarea value={novoAluno.objetivos} onChange={(e) => setNovoAluno({ ...novoAluno, objetivos: e.target.value })} className="nl-input min-h-[112px] px-4 py-3 resize-none" placeholder="Ex: perda de peso, ganho de massa..." />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Horário Preferido</label>
                <input type="text" value={novoAluno.horario_preferido} onChange={(e) => setNovoAluno({ ...novoAluno, horario_preferido: e.target.value })} className="nl-input w-full h-12 px-4" placeholder="Ex: 18:00 - 20:00" />
              </div>
            </div>
          </form>

          <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button type="button" onClick={() => { setMostrarFormEdicao(false); setAlunoEdicao(null); setNovoAluno(novoAlunoDefault); }} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Cancelar</button>
            <button type="submit" form="editar-aluno-form" className="nl-btn nl-btn-primary !h-9 !px-6 !text-[11px] font-bold">
              <Save size={14} /> Guardar Alterações
            </button>
          </div>
        </div>
      </div>
    )}

{/* Modal: Perfil do Aluno */}
      {alunoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] w-full max-w-[560px] shadow-xl rounded-[3px] border border-[var(--border)] overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="border-b border-[var(--border)] bg-[var(--color-secondary-lighter)] px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Informações do aluno</p>
              <button
                onClick={() => setAlunoSelecionado(null)}
                className="w-8 h-8 flex items-center justify-center rounded-[3px] hover:bg-black/5 dark:hover:bg-white/10 nl-text-muted transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="flex items-center gap-4">
                {alunoSelecionado.foto_path ? (
                  <div className="w-14 h-14 rounded-[5px] overflow-hidden border border-[var(--border)]">
                    <img src={`local-resource://${alunoSelecionado.foto_path}`} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-[5px] bg-[var(--color-secondary-lighter)] flex items-center justify-center text-[18px] font-bold nl-text-muted border border-[var(--border)]">
                    {alunoSelecionado.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-[22px] font-extrabold nl-text tracking-tight truncate">{alunoSelecionado.nome}</h2>
                  <p className="text-[12px] font-medium text-[var(--text-secondary)] mt-1">
                    ID {alunoSelecionado.id.slice(-8)} • {getStudentStatusLabel(alunoSelecionado.status)}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-1">
                {[
                  { label: 'Telefone', value: alunoSelecionado.telefone || 'Sem telefone' },
                  { label: 'Email', value: alunoSelecionado.email || 'Sem email' },
                  { label: 'Plano', value: formatCve(alunoSelecionado.plano) },
                  { label: 'Próxima cobrança', value: resumoAlunoSelecionado?.nextChargeDate || '-' },
                  {
                    label: 'Cobertura',
                    value: resumoAlunoSelecionado?.coverageStart && resumoAlunoSelecionado?.coverageEnd
                      ? `${resumoAlunoSelecionado.coverageStart} até ${resumoAlunoSelecionado.coverageEnd}`
                      : 'Sem cobertura ativa'
                  },
                  { label: 'Último pagamento', value: resumoAlunoSelecionado?.lastPaymentDate || 'Ainda sem registo' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-6 border-b border-[var(--border-light)] py-3 last:border-b-0">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)] shrink-0">{item.label}</span>
                    <span className="text-[14px] font-semibold nl-text text-right">{item.value}</span>
                  </div>
                ))}

                <div className="border-t border-[var(--border)] pt-4 mt-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Notas</p>
                  <p className="mt-2 text-[13px] nl-text leading-relaxed">
                    {alunoSelecionado.notas || 'Nenhuma nota registada para este aluno.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] bg-[var(--color-secondary-lighter)] px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => abrirEdicao(alunoSelecionado)} className="nl-btn nl-btn-ghost h-10 px-4 text-[11px] font-bold uppercase tracking-[0.12em]">
                  Editar
                </button>
                <button onClick={() => marcarComoPago(alunoSelecionado.id)} className="nl-btn nl-btn-primary h-10 px-4 text-[11px] font-bold uppercase tracking-[0.12em]">
                  <CheckCircle2 size={15} /> Registar Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.visible && (
        <div className="fixed inset-0 nl-modal-overlay flex items-center justify-center z-[115] p-4 animate-in fade-in duration-200">
          <div className="nl-modal w-full max-w-md overflow-hidden flex flex-col animate-slide-up">
            <div className={`px-8 py-6 border-b border-[var(--border)] flex items-center gap-4 ${
              confirmDialog.tone === 'danger'
                ? 'bg-[#FFECEB]'
                : confirmDialog.tone === 'warning'
                  ? 'bg-[#FFF4E5]'
                  : 'bg-[var(--color-secondary-lighter)]'
            }`}>
              <div className={`w-11 h-11 rounded-[3px] flex items-center justify-center text-white shadow-sm ${
                confirmDialog.tone === 'danger'
                  ? 'bg-red-600'
                  : confirmDialog.tone === 'warning'
                    ? 'bg-orange-500'
                    : 'bg-[var(--color-primary)]'
              }`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-[18px] font-extrabold nl-text tracking-tight">{confirmDialog.title}</h3>
                <p className="text-[12px] nl-text-muted font-bold uppercase tracking-widest">Confirmação necessária</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-[14px] nl-text leading-relaxed">{confirmDialog.message}</p>
              <div className="flex justify-end gap-3">
                <button onClick={fecharConfirmacao} className="nl-btn nl-btn-ghost h-11 px-6 font-bold uppercase tracking-widest text-[12px]">
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    const action = confirmDialog.onConfirm;
                    fecharConfirmacao();
                    if (action) await action();
                  }}
                  className={`nl-btn h-11 px-8 font-bold uppercase tracking-widest text-[12px] text-white ${
                    confirmDialog.tone === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmDialog.tone === 'warning'
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
                  }`}
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registo de Pagamento */}
      {mostrarModalPagamento && alunoParaPagamento && (() => {
        const hoje = new Date();
        const diaHoje = hoje.getDate();
        const vencParts = (alunoParaPagamento.vencimento || '').split('/');
        const diaVenc = vencParts.length >= 1 ? parseInt(vencParts[0], 10) : 0;
        
        const historicoPorAluno = pagamentos
          .filter(p => p.aluno_id === alunoParaPagamento.id || p.alunoId === alunoParaPagamento.id)
          .sort((a, b) => (b.id || 0) - (a.id || 0))
          .slice(0, 8);

        const whatsappNum = (alunoParaPagamento.telefone || '').replace(/\D/g, '');
        const valorParaWhatsapp = ultimoPagamentoInfo?.valor
          ? formatCve(normalizeAmount(ultimoPagamentoInfo.valor))
          : formatCve(normalizeAmount(alunoParaPagamento.plano));
        const mesParaWhatsapp = ultimoPagamentoInfo?.mes || '';
        const whatsappMsg = encodeURIComponent(
          `Olá ${alunoParaPagamento.nome.split(' ')[0]}! 👋\nO seu pagamento de *${valorParaWhatsapp}*${mesParaWhatsapp ? ` referente a *${mesParaWhatsapp}*` : ''} foi registado com sucesso.\n\nObrigado por continuar connosco! 💪`
        );
        const whatsappUrl = `https://wa.me/${whatsappNum}?text=${whatsappMsg}`;

        const fecharModal = () => {
          setMostrarModalPagamento(false);
          setAlunoParaPagamento(null);
          setMostrarHistoricoModal(false);
          setPagamentoSucesso(false);
          setUltimoPagamentoInfo(null);
          setPagamentoForm({ valor: '', dataPagamento: formatInputDate(), metodo: DEFAULT_PAYMENT_METHOD });
        };

        const statusColors = (() => {
          const s = alunoParaPagamento.status || 'ativo';
          if (s === 'ativo') return 'bg-green-50 text-green-700 border-green-200';
          if (s === 'pausado') return 'bg-amber-50 text-amber-700 border-amber-200';
          return 'bg-red-50 text-red-700 border-red-200';
        })();

        if (pagamentoSucesso) {
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[110] p-4 animate-fade-in" onClick={fecharModal}>
              <div className="bg-[var(--bg-surface)] w-full max-w-[420px] shadow-2xl rounded-[6px] border border-[var(--border)] overflow-hidden animate-scale-in flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center" style={{ background: 'linear-gradient(160deg, #F0FDF4 0%, #DCFCE7 100%)', borderBottom: '1px dashed #BBF7D0' }}>
                  <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center mb-4 border-2 border-green-200">
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-600/70 mb-1">Pagamento Confirmado</p>
                  <p className="text-[32px] font-black text-green-800 leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCve(normalizeAmount(ultimoPagamentoInfo?.valor || alunoParaPagamento.plano))}
                  </p>
                  {mesParaWhatsapp && <p className="text-[12px] font-bold text-green-600/80 mt-2">{mesParaWhatsapp}</p>}
                </div>
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-[16px] shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' }}>
                      {alunoParaPagamento.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-black nl-text truncate">{alunoParaPagamento.nome}</p>
                      <p className="text-[11px] font-bold text-slate-400">{alunoParaPagamento.telefone || 'Sem contacto'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {whatsappNum && (
                    <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={fecharModal} className="flex items-center justify-center gap-3 h-11 rounded-[6px] text-[12px] font-bold text-white transition-all hover:brightness-105 shadow-sm" style={{ background: '#25D366' }}>
                      <MessageSquare size={15} /> Notificar via WhatsApp
                    </a>
                  )}
                  <button onClick={fecharModal} className="w-full h-10 rounded-[5px] text-[11px] font-medium nl-text-muted hover:bg-[var(--color-secondary-lighter)] transition-all border border-[var(--border)]">
                    Concluir e fechar
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[110] p-4 animate-fade-in" onClick={fecharModal}>
            <div className="bg-[var(--bg-surface)] w-full max-w-[460px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden animate-scale-in flex flex-col" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                    <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
                </div>
                <div className="flex-1 text-center">
                  <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Registo de Cobrança</h2>
                </div>
                <div className="flex-1 flex justify-end px-3">
                  <button onClick={fecharModal} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-6 py-5 bg-gradient-to-b from-slate-50/50 to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-black text-[20px] shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' }}>
                      {alunoParaPagamento.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-black nl-text tracking-tight truncate">{alunoParaPagamento.nome}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-full border shadow-sm ${statusColors}`}>
                          {alunoParaPagamento.status || 'ativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-4 space-y-1">
                  {[
                    { label: 'Valor Mensalidade', value: formatCve(normalizeAmount(alunoParaPagamento.plano)), highlight: true },
                    { label: 'Cobertura Actual', value: resumoAlunoParaPagamento?.coverageStart && resumoAlunoParaPagamento?.coverageEnd ? `${resumoAlunoParaPagamento.coverageStart} → ${resumoAlunoParaPagamento.coverageEnd}` : 'Sem cobertura activa' },
                    { label: 'Nova Cobertura', value: previewPagamento?.coverageStart && previewPagamento?.coverageEnd ? `${previewPagamento.coverageStart} → ${previewPagamento.coverageEnd}` : '—' },
                    { label: 'Próximo Vencimento', value: previewPagamento?.nextChargeDate || '—' },
                  ].map((row, i) => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{row.label}</span>
                      <span className={`text-right ${row.highlight ? 'text-[15px] font-black text-blue-700' : 'text-[12px] font-bold nl-text'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-5 bg-slate-50/30 border-y border-slate-100 space-y-4">
                  {/* Valor com sugestão do plano */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Valor a Receber</label>
                      {!pagamentoForm.valor && (
                        <button
                          type="button"
                          onClick={() => setPagamentoForm(prev => ({ ...prev, valor: String(normalizeAmount(alunoParaPagamento.plano)) }))}
                          className="text-[9px] font-black uppercase tracking-wide text-blue-600 hover:underline"
                        >
                          Usar valor do plano ({formatCve(normalizeAmount(alunoParaPagamento.plano))})
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={pagamentoForm.valor}
                      onChange={e => setPagamentoForm(prev => ({ ...prev, valor: e.target.value }))}
                      className="nl-input h-11 px-4 text-[14px] font-black text-blue-700 !bg-white shadow-sm"
                      placeholder={`Sugerido: ${formatCve(normalizeAmount(alunoParaPagamento.plano))}`}
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    />
                  </div>
                  {/* Mês de referência + Data */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mês de Referência</label>
                      <select
                        className="nl-input h-11 px-3 text-[12px] font-bold !bg-white shadow-sm capitalize"
                        value={pagamentoForm.mesReferencia || mesFinanceiro}
                        onChange={e => setPagamentoForm(prev => ({ ...prev, mesReferencia: e.target.value }))}
                      >
                        {MONTH_OPTIONS.map(m => (
                          <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data do Pagamento</label>
                      <input type="date" value={pagamentoForm.dataPagamento} onChange={e => setPagamentoForm(prev => ({ ...prev, dataPagamento: e.target.value }))} className="nl-input h-11 px-4 text-[13px] font-bold !bg-white shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Método</label>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_METHOD_OPTIONS.map(opt => {
                        const active = pagamentoForm.metodo === opt.value;
                        return (
                          <button key={opt.value} type="button" onClick={() => setPagamentoForm(prev => ({ ...prev, metodo: opt.value }))} className={`rounded-[4px] px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border ${active ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-white border-[var(--border)] nl-text-muted hover:bg-[var(--color-secondary-lighter)]'}`}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border border-[var(--border)] rounded-[5px] overflow-hidden bg-[var(--bg-surface)] shadow-sm">
                    <button onClick={() => setMostrarHistoricoModal(prev => !prev)} className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors">
                      <span className="flex items-center gap-2"><CreditCard size={12} className="text-blue-500" /> Histórico Recente <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black">{historicoPorAluno.length}</span></span>
                      {mostrarHistoricoModal ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {mostrarHistoricoModal && (
                      <div className="border-t border-slate-100 divide-y divide-slate-50 max-h-[150px] overflow-y-auto custom-scrollbar">
                        {historicoPorAluno.length === 0 ? <p className="px-4 py-6 text-[11px] text-slate-400 text-center font-medium">Nenhum registo</p> : historicoPorAluno.map((p, i) => (
                          <div key={p.id || i} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-slate-700">{p.data_pagamento || p.dataPagamento || '—'}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.metodo_pagamento || p.metodoPagamento || '—'}{p.mes_referencia ? ` · ${p.mes_referencia}` : ''}</p>
                            </div>
                            <span className="text-[12px] font-black text-emerald-600 shrink-0">{formatCve(normalizeAmount(p.valor))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé */}
              <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                <button onClick={fecharModal} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Cancelar</button>
                <button onClick={registrarPagamento} className="nl-btn nl-btn-primary !h-9 !px-6 !text-[11px] font-bold">
                  <CheckCircle2 size={14} /> Confirmar Pagamento
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Menu de Contexto */}
      {contextMenu && (
        <div 
          className="fixed bg-[var(--bg-surface)] shadow-2xl border border-[var(--border)] rounded-[3px] py-2 z-[200] min-w-[240px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-4 py-2 text-[11px] font-bold nl-text-muted uppercase tracking-widest border-b border-[var(--border-light)] mb-1 flex items-center justify-between">
            Ações Rápidas
            <Shield size={10} className="text-[var(--color-primary)]" />
          </div>
          
          <div className="px-2 py-1">
            <button onClick={() => {
              const a = alunos.find(al => al.id === contextMenu.alunoId);
              if (a) marcarComoPago(a.id);
              setContextMenu(null);
            }} className="w-full text-left px-3 py-3 bg-[var(--color-primary)] text-white rounded-[3px] flex items-center gap-3 text-[13px] font-bold shadow-sm hover:bg-[var(--color-primary-hover)] transition-all">
              <CreditCard size={16} /> REGISTAR PAGAMENTO
            </button>
          </div>

          <div className="h-px bg-[var(--border-light)] my-1.5 mx-2"></div>

          <button onClick={() => {
            const a = alunos.find(al => al.id === contextMenu.alunoId);
            if (a) abrirEdicao(a);
            setContextMenu(null);
          }} className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 text-[14px] font-medium transition-all group nl-text">
            <Edit size={14} className="nl-text-muted group-hover:text-[var(--color-primary)]" /> Editar Perfil
          </button>
          
          <button onClick={() => {
            alterarStatus(contextMenu.alunoId, 'pausado');
            setContextMenu(null);
          }} className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 text-[14px] font-medium transition-all group nl-text">
            <Pause size={14} className="nl-text-muted group-hover:text-[var(--color-warning)]" /> Colocar em Pausa
          </button>
          
          <div className="h-px bg-[var(--border-light)] my-1.5 mx-2"></div>
          
          <button onClick={() => {
            eliminarAluno(contextMenu.alunoId);
            setContextMenu(null);
          }} className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-[14px] font-bold text-red-600 transition-all">
            <Trash2 size={14} /> Eliminar Registo
          </button>
        </div>
      )}

      {/* Barra de Estado */}
      <footer className="bg-[var(--color-primary)] text-white px-8 h-9 flex justify-between items-center text-[12px] font-semibold shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
               <div className={"w-2 h-2 rounded-full " + (online ? "bg-[#B3F5C0]" : "bg-[#FFD8A8]")} />
               <span className="opacity-80 uppercase tracking-widest text-[10px]">{online ? "Sistema conectado" : "Modo local"}</span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div className="flex items-center gap-2">
               <span className="opacity-60 uppercase tracking-widest text-[10px]">Alunos:</span>
               <span>{totalAlunos}</span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div className="flex items-center gap-2">
               <span className="opacity-60 uppercase tracking-widest text-[10px]">Atrasados:</span>
               <span className={mensalidadesPendentes > 0 ? 'text-red-200 animate-pulse' : ''}>{mensalidadesPendentes}</span>
            </div>
         </div>

         <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
               <span className="opacity-60 text-[10px] uppercase tracking-widest">Vista</span>
               <input 
                  type="range" 
                  min="60" 
                  max="100" 
                  value={zoomLista}
                  onChange={(e) => setZoomLista(parseInt(e.target.value))}
                  className="w-32 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-white"
               />
               <span className="w-8 text-right opacity-80">{zoomLista}%</span>
            </div>
            {relatorioMensalDisponivel && (
               <button onClick={() => setAba('relatorios_detalhado')} className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-all border border-white/10">
                  <Star size={10} className="text-amber-300 fill-amber-300" />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]">Relatório de {relatorioMensalDisponivel}</span>
               </button>
            )}
            <span className="opacity-80 uppercase tracking-widest text-[10px]">{new Date().toLocaleDateString('pt-PT')}</span>
            <div className="opacity-40 font-bold uppercase tracking-[0.2em] text-[9px]">NEXT LEVEL PRO</div>
         </div>
      </footer>

      {/* Modal: Relatório Mensal */}
      {mostrarRelatorioMensal && (
        <div className="fixed inset-0 nl-modal-overlay flex items-center justify-center z-[120] p-4 animate-in fade-in duration-200">
           <div className="bg-[var(--bg-surface)] w-full max-w-[850px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
              <div className="bg-[#1E293B] border-b border-white/5 h-14 flex items-center shrink-0 shadow-xl">
                <div className="flex-1 flex items-center gap-2.5 px-6">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] leading-none">Intelligence Hub</p>
                    <p className="text-[12px] font-bold text-white/50 tracking-tight">Relatório Consolidado</p>
                  </div>
                </div>
                <div className="flex-1 text-center whitespace-nowrap">
                  <h2 className="text-[14px] font-black text-white uppercase tracking-[0.2em] leading-none">{mesFinanceiro} {anoFinanceiro}</h2>
                </div>
                <div className="flex-1 flex justify-end px-4">
                  <button onClick={() => setMostrarRelatorioMensal(false)} className="h-10 w-10 flex items-center justify-center rounded-xl text-white/40 hover:bg-white/10 hover:text-white transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                 {/* Cards Resumo */}
                 <div className="grid grid-cols-4 gap-6">
                    <div className="p-5 border nl-border rounded-[6px] nl-bg-input flex flex-col justify-center relative overflow-hidden group">
                       <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><CreditCard size={100} /></div>
                       <span className="text-[11px] font-extrabold nl-text-muted uppercase tracking-wider mb-2 relative z-10">Total Recebido</span>
                       <span className="text-[28px] font-black text-[#33d17a] leading-none relative z-10">
                         {normalizeAmount(totalRecebidoPeriodo).toLocaleString()} <span className="text-[14px] text-[#33d17a]/70">CVE</span>
                       </span>
                    </div>
                    <div className="p-5 border nl-border rounded-[6px] nl-bg-input flex flex-col justify-center relative overflow-hidden group">
                       <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><CheckCircle2 size={100} /></div>
                       <span className="text-[11px] font-extrabold nl-text-muted uppercase tracking-wider mb-2 relative z-10">Cobertura Ativa</span>
                       <span className="text-[28px] font-black nl-text leading-none relative z-10">
                         {alunosComPagamentoEmDia.length}
                       </span>
                    </div>
                    <div className="p-5 border nl-border rounded-[6px] nl-bg-input flex flex-col justify-center relative overflow-hidden group">
                       <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><AlertCircle size={100} /></div>
                       <span className="text-[11px] font-extrabold nl-text-muted uppercase tracking-wider mb-2 relative z-10">Em Cobrança</span>
                       <span className="text-[28px] font-black text-[#e01b24] leading-none relative z-10">
                         {alunosEmDivida.length}
                       </span>
                    </div>
                    <div className="p-5 border nl-border rounded-[6px] nl-bg-input flex flex-col justify-center relative overflow-hidden group">
                       <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><UserPlus size={100} /></div>
                       <span className="text-[11px] font-extrabold nl-text-muted uppercase tracking-wider mb-2 relative z-10">Inscritos neste mês</span>
                       <span className="text-[28px] font-black text-[#3584e4] leading-none relative z-10">
                         {alunos.filter(a => {
                           const dataMatricula = parseFlexibleDate(a.data_matricula);
                           if (dataMatricula) {
                              const targetMonth = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'].indexOf(mesFinanceiro);
                              return dataMatricula.getMonth() === targetMonth && dataMatricula.getFullYear() === anoFinanceiro;
                           }
                           return false;
                         }).length}
                       </span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden">
                    <div className="flex flex-col gap-6 overflow-hidden">
                       <h3 className="text-[14px] font-extrabold nl-text uppercase tracking-widest flex items-center gap-3">
                          <AlertCircle size={18} className="text-red-600" /> Em Cobrança Agora
                       </h3>
                       <div className="border border-[var(--border)] rounded-[3px] overflow-hidden flex flex-col h-full bg-[var(--bg-surface)]">
                          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y border-[var(--border-light)]">
                             {alunosEmDivida.length === 0 ? (
                                <div className="p-12 text-center nl-text-muted text-[14px] font-medium ">Nenhum aluno em dívida. Tudo controlado.</div>
                             ) : (
                                alunosEmDivida.map(({ aluno, resumo }, index) => {
                                   const tom = obterTomPastel(index);
                                   return (
                                      <div key={aluno.id} className={`p-4 flex items-center justify-between border-b last:border-b-0 transition-all group ${tom.bg} ${tom.border} hover:-translate-y-[1px]`}>
                                         <div className="flex flex-col gap-1">
                                            <span className="text-[14px] font-bold nl-text">{aluno.nome}</span>
                                            <span className="text-[12px] nl-text-muted font-mono">{aluno.telefone}</span>
                                         </div>
                                         <div className="flex flex-col items-end gap-1">
                                            <span className="text-[14px] font-extrabold text-red-600">{formatCve(aluno.plano)}</span>
                                            <span className="text-[11px] text-red-600/70 font-bold uppercase tracking-wider">{resumo.statusLabel}</span>
                                         </div>
                                      </div>
                                   )
                                })
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-6 overflow-hidden">
                       <h3 className="text-[14px] font-extrabold nl-text uppercase tracking-widest flex items-center gap-3">
                          <CheckCircle2 size={18} className="text-green-600" /> Recebidos no Período
                       </h3>
                       <div className="border border-[var(--border)] rounded-[3px] overflow-hidden flex flex-col h-full bg-[var(--bg-surface)]">
                          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y border-[var(--border-light)]">
                             {pagamentosDoPeriodo.length === 0 ? (
                                <div className="p-12 text-center nl-text-muted text-[14px] font-medium ">Nenhum pagamento registado.</div>
                             ) : (
                                pagamentosDoPeriodo
                                  .sort((left, right) => (right.id || 0) - (left.id || 0))
                                  .map((p, index) => {
                                   const tom = obterTomPastel(index);
                                   return (
                                   <div key={`${p.id}-${index}`} className={`p-4 flex items-center justify-between border-b last:border-b-0 transition-all group ${tom.bg} ${tom.border} hover:-translate-y-[1px]`}>
                                      <div className="flex flex-col gap-1">
                                         <span className="text-[14px] font-bold nl-text">{p.nome}</span>
                                         <div className="flex items-center gap-3">
                                            <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-green-500/10 text-green-600 font-bold uppercase tracking-wider">{p?.metodo_pagamento}</span>
                                            <span className="text-[11px] nl-text-muted font-mono">{p?.data_pagamento}</span>
                                         </div>
                                         {p?.referencia_inicio && p?.referencia_fim && (
                                           <span className="text-[11px] nl-text-muted">cobre {p.referencia_inicio} ate {p.referencia_fim}</span>
                                         )}
                                      </div>
                                      <span className="text-[14px] font-extrabold text-green-600">{formatCve(p?.valor)}</span>
                                   </div>
                                )})
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-between shrink-0">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estatísticas & Fecho de Mensalidades</p>
                 <div className="flex gap-3">
                    <button onClick={() => setMostrarRelatorioMensal(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Fechar</button>
                    <button onClick={() => { exportarFinancasExcel(); showToast('Exportado para Excel'); }} className="nl-btn !h-9 !px-6 !text-[11px] font-bold !bg-emerald-600 !text-white hover:!bg-emerald-700 !border-emerald-700">
                       <FileSpreadsheet size={14} /> Exportar Excel
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal: Notificações */}
      {mostrarNotificacoes && (() => {
        const prioritarias = notificacoes.filter(n => n.categoria === 'prioritaria');
        const relatorios = notificacoes.filter(n => n.categoria === 'relatorio');
        const appNotifs = notificacoes.filter(n => !n.categoria || n.categoria === 'app');
        const naoLidas = notificacoes.filter(n => !n.lida).length;

        const NotifItem = ({ n, onClick }: { n: Notificacao; onClick: () => void }) => {
          const iconColor = n.tipo === 'sucesso' ? 'bg-green-500' : n.tipo === 'alerta' ? 'bg-orange-500' : n.tipo === 'erro' ? 'bg-red-500' : 'bg-[var(--color-primary)]';
          return (
            <div
              className={`px-5 py-3.5 flex items-start gap-3 hover:bg-[var(--color-secondary-lighter)]/60 transition-all cursor-pointer ${!n.lida ? 'bg-blue-50/40' : ''}`}
              onClick={onClick}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-bold nl-text leading-tight ${!n.lida ? 'text-[var(--color-primary)]' : ''}`}>{n.titulo}</p>
                <p className="text-[11px] nl-text-muted leading-relaxed mt-0.5 line-clamp-2">{n.mensagem}</p>
              </div>
              <span className="text-[9px] font-bold nl-text-muted uppercase opacity-60 shrink-0 mt-0.5">{n.data.split(',')[0]}</span>
            </div>
          );
        };

        const SectionHeader = ({ label, count, color }: { label: string; count: number; color: string }) => (
          <div className={`px-5 py-2 flex items-center justify-between border-b border-[var(--border-light)]`}>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${color}`}>{label}</span>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${color} opacity-80 border border-current`}>{count}</span>
          </div>
        );

        return (
          <div className="fixed top-16 right-6 w-[400px] bg-[var(--bg-surface)] shadow-2xl rounded-[3px] border border-[var(--border)] z-[500] overflow-hidden flex flex-col animate-slide-up" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--color-secondary-lighter)]/40">
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-[var(--color-primary)]" />
                <h3 className="text-[12px] font-black nl-text uppercase tracking-widest">Notificações</h3>
                {naoLidas > 0 && (
                  <span className="bg-[var(--color-primary)] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{naoLidas}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {notificacoes.length > 0 && (
                  <button onClick={limparNotificacoes} className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tight">Limpar</button>
                )}
                <button onClick={() => setMostrarNotificacoes(false)} className="nl-text-muted hover:text-[var(--color-primary)] transition-colors"><X size={16} /></button>
              </div>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 divide-y divide-[var(--border-light)]">
              {notificacoes.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-secondary-lighter)] flex items-center justify-center mx-auto mb-3 opacity-40"><Bell size={28} /></div>
                  <p className="text-[13px] font-bold nl-text-muted">Sem notificações.</p>
                </div>
              ) : (
                <>
                  {/* 🔴 PRIORITÁRIAS */}
                  {prioritarias.length > 0 && (
                    <div>
                      <SectionHeader label="🔴 Prioritárias" count={prioritarias.length} color="text-red-600" />
                      {prioritarias.map(n => (
                        <NotifItem key={n.id} n={n} onClick={() => marcarComoLida(n.id)} />
                      ))}
                    </div>
                  )}

                  {/* 📊 RELATÓRIOS */}
                  {relatorios.length > 0 && (
                    <div>
                      <SectionHeader label="📊 Relatórios" count={relatorios.length} color="text-blue-600" />
                      {relatorios.map(n => (
                        <NotifItem key={n.id} n={n} onClick={() => marcarComoLida(n.id)} />
                      ))}
                    </div>
                  )}

                  {/* ℹ️ APP */}
                  {appNotifs.length > 0 && (
                    <div>
                      <SectionHeader label="ℹ️ Sistema" count={appNotifs.length} color="text-slate-500" />
                      {appNotifs.map(n => (
                        <NotifItem key={n.id} n={n} onClick={() => marcarComoLida(n.id)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-3 bg-[var(--color-secondary-lighter)]/40 border-t border-[var(--border)] text-center">
              <button onClick={() => { setAba('configuracoes'); setConfigAba('notificacoes'); setMostrarNotificacoes(false); }} className="text-[10px] font-extrabold text-[var(--color-primary)] uppercase tracking-widest hover:underline">Configurações de Notificações</button>
            </div>
          </div>
        );
      })()}



      {/* Modais de configuração foram removidos para se tornarem abas principais */}

      {/* Modal: Boas-Vindas Nova Matrícula */}
      {mostrarBoasVindas && alunoBoasVindas && (() => {
        const telefone = (alunoBoasVindas.telefone || '').replace(/\D/g, '');
        const whatsappUrl = telefone
          ? `https://wa.me/${telefone}?text=${encodeURIComponent(msgBoasVindas)}`
          : null;
        const fechar = () => { setMostrarBoasVindas(false); setAlunoBoasVindas(null); setMsgBoasVindas(''); };
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[200] p-4 animate-fade-in" onClick={fechar}>
            <div className="bg-[var(--bg-surface)] w-full max-w-[480px] shadow-2xl rounded-[6px] border border-[var(--border)] overflow-hidden animate-scale-in flex flex-col" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0 px-4 gap-3">
                <div className="h-6 w-6 rounded-md bg-white/50 p-1 border border-white/40 shadow-sm flex items-center justify-center">
                  <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{nomeAcademia}</span>
                <div className="flex-1" />
                <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Nova Matrícula</h2>
                <div className="flex-1" />
                <button onClick={fechar} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"><X size={16} /></button>
              </div>

              {/* Conteúdo */}
              <div className="px-6 py-5 space-y-4">
                {/* Confirmação */}
                <div className="flex items-center gap-4 p-4 rounded-[6px] bg-green-50 border border-green-100">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm border-2 border-green-200 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={24} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-green-800">{alunoBoasVindas.nome} matriculado com sucesso!</p>
                    <p className="text-[11px] text-green-600 font-medium mt-0.5">
                      Plano: {alunoBoasVindas.plano} · {new Date().toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>

                {/* Mensagem editável */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Mensagem de Boas-Vindas</label>
                  <textarea
                    value={msgBoasVindas}
                    onChange={e => setMsgBoasVindas(e.target.value)}
                    rows={6}
                    className="nl-input resize-none text-[12px] leading-relaxed"
                  />
                </div>
              </div>

              {/* Rodapé */}
              <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-between gap-3 shrink-0">
                <button onClick={fechar} className="nl-btn nl-btn-ghost !h-9 !px-4 !text-[11px] font-bold">Pular</button>
                <div className="flex items-center gap-2">
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={fechar}
                      className="nl-btn !h-9 !px-5 !text-[11px] font-bold text-white flex items-center gap-2 rounded-[5px] transition-all hover:brightness-105 shadow-sm"
                      style={{ background: '#25D366' }}
                    >
                      <MessageSquare size={14} /> Enviar via WhatsApp
                    </a>
                  )}
                  <button onClick={fechar} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Fechar</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Sobre o App (Página Estilo Word) */}

      {mostrarSobreDoc && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
          <div className="relative bg-white w-full max-w-[520px] rounded-[12px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.25)]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Fechar */}
            <button onClick={() => setMostrarSobreDoc(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all z-10">
              <X size={16} />
            </button>

            {/* Topo com logos */}
            <div className="px-10 pt-10 pb-8 flex items-center gap-5 border-b border-slate-100">
              <div className="w-14 h-14 rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <img src={appLogo || APP_ICON_PATH} className="w-9 h-9 object-contain" alt="NEXTLevel" />
              </div>
              <div>
                <h2 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">NEXTLevel</h2>
                <p className="text-[12px] text-slate-400 mt-1">Sistema de Gestão de Academias · v1.0 Beta</p>
              </div>
            </div>

            {/* Info grid */}
            <div className="px-10 py-8 space-y-5 text-[13px]">

              {[
                { label: 'Versão',         value: '1.0.0 Beta' },
                { label: 'Plataforma',     value: 'macOS · Windows · Desktop' },
                { label: 'Base de Dados',  value: 'SQLite · Offline · Local' },
                { label: 'Licença',        value: licencaDados.tipo ? `${licencaDados.tipo} · ${licencaDados.expiracao || 'Vitalícia'}` : 'Não activada' },
                { label: 'Ano',            value: String(new Date().getFullYear()) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  <span className="text-slate-800 font-semibold text-right">{item.value}</span>
                </div>
              ))}

            </div>

            {/* Separador */}
            <div className="mx-10 border-t border-slate-100" />

            {/* NEXT Lab créditos */}
            <div className="px-10 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={NEXT_LAB_ICON} className="w-7 h-7 object-contain opacity-50" alt="NEXT Lab" />
                <div>
                  <p className="text-[13px] font-semibold text-slate-700 leading-none">NEXT Lab</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Creative Studio · desde 1995</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-slate-500 font-medium">{COMPANY_AUTHOR}</p>
                <p className="text-[11px] text-slate-400">{COMPANY_EMAIL}</p>
              </div>
            </div>

            {/* Rodapé */}
            <div className="px-10 pb-8">
              <button
                onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)}
                className="w-full h-10 rounded-[6px] text-[13px] font-semibold text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700 transition-all"
              >
                linktr.ee/next.lab
              </button>
              <p className="text-center text-[10px] text-slate-300 mt-4">
                © {new Date().getFullYear()} NEXT Lab · Todos os direitos reservados
              </p>
            </div>

          </div>
        </div>
      )}
      {/* Modal: Novo Utilizador */}
      {mostrarFormNovoUtilizador && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-6 animate-in fade-in duration-300">
           <div className="bg-[var(--bg-surface)] w-full max-w-[460px] shadow-2xl rounded-[3px] border border-[var(--border)] overflow-hidden animate-slide-up flex flex-col">
              <div className="p-6 border-b border-[var(--border)] bg-[var(--color-secondary-lighter)]/50 flex items-center justify-between">
                 <h2 className="text-[16px] font-extrabold nl-text tracking-tight">Novo Utilizador</h2>
                 <button onClick={() => setMostrarFormNovoUtilizador(false)} className="nl-text-muted hover:text-[var(--text-primary)] transition-colors"><X size={18} /></button>
              </div>
              <div className="p-8 space-y-5">
                 <div className="space-y-2">
                    <label className="block text-[11px] font-bold nl-text-muted uppercase tracking-wider">Nome Completo</label>
                    <input type="text" value={novoUtilizadorForm.name} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, name: e.target.value})} className="nl-input w-full h-11" placeholder="Ex: João Silva" required />
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[11px] font-bold nl-text-muted uppercase tracking-wider">Email</label>
                    <input type="email" value={novoUtilizadorForm.email} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, email: e.target.value})} className="nl-input w-full h-11" placeholder="contacto@exemplo.com" required />
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[11px] font-bold nl-text-muted uppercase tracking-wider">Função (Role)</label>
                    <select value={novoUtilizadorForm.role} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, role: e.target.value})} className="nl-input w-full h-11 cursor-pointer">
                       <option value="operational">Operacional (Sem Ajustes)</option>
                       <option value="admin">Administrador (Total)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[11px] font-bold nl-text-muted uppercase tracking-wider">Palavra-passe</label>
                    <input type="password" value={novoUtilizadorForm.password} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, password: e.target.value})} className="nl-input w-full h-11" placeholder="Mínimo 6 caracteres" required />
                 </div>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-surface)] flex justify-end gap-3">
                 <button onClick={() => setMostrarFormNovoUtilizador(false)} className="nl-btn nl-btn-secondary px-6 h-10">Cancelar</button>
                 <button onClick={async () => {
                    if (!electron || !novoUtilizadorForm.name || !novoUtilizadorForm.email || novoUtilizadorForm.password.length < 6) return alert('Preencha todos os campos e palavra-passe com mínimo de 6 caracteres.');
                    const res = await electron.ipcRenderer.invoke('users:create', novoUtilizadorForm);
                    if (!res?.success) return alert(res?.message || 'Erro ao criar utilizador.');
                    showToast('Utilizador criado com sucesso!');
                    setMostrarFormNovoUtilizador(false);
                    setNovoUtilizadorForm({ name: '', email: '', role: 'operational', password: '' });
                    const listRes = await electron.ipcRenderer.invoke('users:list');
                    if (listRes?.success) setListaUtilizadores(listRes.users || []);
                 }} className="nl-btn nl-btn-primary px-6 h-10">Criar Conta</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal: Editar Utilizador + Actividade */}
      {utilizadorEmEdicao && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-6 animate-in fade-in duration-200" onClick={() => setUtilizadorEmEdicao(null)}>
          <div className="bg-[var(--bg-surface)] w-full max-w-[720px] shadow-2xl rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 60px)' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--color-secondary-lighter)]/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {(() => {
                  const avatar = utilizadorAvatares[String(utilizadorEmEdicao.id)];
                  return (
                    <div className="w-10 h-10 rounded-[8px] overflow-hidden flex items-center justify-center font-bold text-[13px] border border-[var(--border)]"
                         style={{ background: avatar ? 'transparent' : `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 88%)`, color: `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 35%)` }}>
                      {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : utilizadorEmEdicao.name.slice(0,2).toUpperCase()}
                    </div>
                  );
                })()}
                <div>
                  <p className="text-[15px] font-bold nl-text">{utilizadorEmEdicao.name}</p>
                  <p className="text-[11px] nl-text-muted">{utilizadorEmEdicao.email}</p>
                </div>
              </div>
              <button onClick={() => setUtilizadorEmEdicao(null)} className="nl-icon-btn"><X size={16} /></button>
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* Left: Edit form */}
              <div className="w-[300px] shrink-0 border-r border-[var(--border)] p-6 space-y-5 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] font-bold nl-text-muted uppercase tracking-wider">Perfil</p>

                {/* Avatar upload */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-[10px] overflow-hidden flex items-center justify-center font-bold text-[18px] border border-[var(--border)]"
                         style={{ background: utilizadorAvatares[String(utilizadorEmEdicao.id)] ? 'transparent' : `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 88%)`, color: `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 35%)` }}>
                      {utilizadorAvatares[String(utilizadorEmEdicao.id)]
                        ? <img src={utilizadorAvatares[String(utilizadorEmEdicao.id)]} className="w-full h-full object-cover" />
                        : utilizadorEmEdicao.name.slice(0,2).toUpperCase()}
                    </div>
                    <label className="absolute inset-0 bg-black/50 rounded-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                      <Camera size={16} className="text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result as string;
                          const updated = { ...utilizadorAvatares, [String(utilizadorEmEdicao.id)]: result };
                          setUtilizadorAvatares(updated);
                          localStorage.setItem('nl_user_avatares', JSON.stringify(updated));
                        };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                  </div>
                  <div className="text-[11px] nl-text-muted leading-relaxed">
                    <p className="font-semibold nl-text mb-0.5">Foto de perfil</p>
                    <p>Passe o rato para alterar</p>
                    {utilizadorAvatares[String(utilizadorEmEdicao.id)] && (
                      <button type="button" onClick={() => {
                        const updated = { ...utilizadorAvatares };
                        delete updated[String(utilizadorEmEdicao.id)];
                        setUtilizadorAvatares(updated);
                        localStorage.setItem('nl_user_avatares', JSON.stringify(updated));
                      }} className="text-red-500 hover:underline mt-1 block">Remover foto</button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold nl-text-muted uppercase tracking-wider">Nome</label>
                  <input type="text" value={utilizadorEdicaoForm.name} onChange={e => setUtilizadorEdicaoForm(f => ({...f, name: e.target.value}))} className="nl-input w-full h-10 px-3 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold nl-text-muted uppercase tracking-wider">Função</label>
                  <select value={utilizadorEdicaoForm.role} onChange={e => setUtilizadorEdicaoForm(f => ({...f, role: e.target.value}))} className="nl-input w-full h-10 px-3 text-[13px] cursor-pointer">
                    <option value="operational">Operacional</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 rounded-[5px] bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-[12px] font-semibold nl-text">Conta activa</p>
                    <p className="text-[10px] nl-text-muted">Acesso ao sistema</p>
                  </div>
                  <button type="button" onClick={() => setUtilizadorEdicaoForm(f => ({...f, isActive: !f.isActive}))}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${utilizadorEdicaoForm.isActive ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${utilizadorEdicaoForm.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                <button type="button" onClick={async () => {
                  if (!electron || !utilizadorEdicaoForm.name.trim()) return;
                  const res = await electron.ipcRenderer.invoke('users:update', {
                    id: utilizadorEmEdicao.id,
                    name: utilizadorEdicaoForm.name,
                    role: utilizadorEdicaoForm.role,
                    isActive: utilizadorEdicaoForm.isActive,
                  });
                  if (!res?.success) return showToast('Erro: ' + (res?.message || ''));
                  showToast('Dados guardados.');
                  const listRes = await electron.ipcRenderer.invoke('users:list');
                  if (listRes?.success) setListaUtilizadores(listRes.users || []);
                  setUtilizadorEmEdicao({ ...utilizadorEmEdicao, name: utilizadorEdicaoForm.name, role: utilizadorEdicaoForm.role, is_active: utilizadorEdicaoForm.isActive ? 1 : 0 });
                }} className="nl-btn nl-btn-primary w-full h-10 text-[13px]">Guardar alterações</button>

                <div className="border-t border-[var(--border-light)] pt-4 space-y-2">
                  <p className="text-[10px] font-bold nl-text-muted uppercase tracking-wider">Palavra-passe</p>
                  <input type="password" value={utilizadorEdicaoForm.novaSenha} onChange={e => setUtilizadorEdicaoForm(f => ({...f, novaSenha: e.target.value}))} placeholder="Nova palavra-passe..." className="nl-input w-full h-10 px-3 text-[13px]" />
                  <button type="button" onClick={async () => {
                    if (!electron || utilizadorEdicaoForm.novaSenha.length < 6) return showToast('Mínimo 6 caracteres.');
                    const res = await electron.ipcRenderer.invoke('users:set-password', { id: utilizadorEmEdicao.id, password: utilizadorEdicaoForm.novaSenha });
                    if (!res?.success) return showToast('Erro: ' + (res?.message || ''));
                    showToast('Palavra-passe alterada.');
                    setUtilizadorEdicaoForm(f => ({...f, novaSenha: ''}));
                  }} className="nl-btn nl-btn-secondary w-full h-9 text-[12px]">Alterar palavra-passe</button>
                </div>
              </div>

              {/* Right: Activity log */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[var(--border)] bg-slate-50/50 flex items-center justify-between shrink-0">
                  <p className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">Histórico de Actividade</p>
                  <span className="text-[10px] nl-text-muted">{logs.filter(l => l.user_name === utilizadorEmEdicao.name).length} acções</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1.5">
                  {(() => {
                    const userLogs = logs.filter(l => l.user_name === utilizadorEmEdicao.name);
                    if (userLogs.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                          <Activity size={24} />
                          <p className="text-[12px] font-semibold nl-text">Sem actividade registada</p>
                          <p className="text-[11px] nl-text-muted text-center">As acções futuras deste utilizador aparecerão aqui</p>
                        </div>
                      );
                    }
                    const iconePorAcao = (acao: string) => {
                      if (acao.includes('Matrícula') || acao.includes('Novo')) return { icon: <UserPlus size={11} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
                      if (acao.includes('Pagamento')) return { icon: <CreditCard size={11} />, color: 'text-blue-600 bg-blue-50 border-blue-200' };
                      if (acao.includes('Eliminação') || acao.includes('Remov')) return { icon: <Trash2 size={11} />, color: 'text-red-600 bg-red-50 border-red-200' };
                      if (acao.includes('Status') || acao.includes('Bloqueio') || acao.includes('Pausa')) return { icon: <ShieldOff size={11} />, color: 'text-amber-600 bg-amber-50 border-amber-200' };
                      if (acao.includes('Edição') || acao.includes('Atualiz')) return { icon: <Edit size={11} />, color: 'text-violet-600 bg-violet-50 border-violet-200' };
                      if (acao.includes('Login') || acao.includes('Acesso')) return { icon: <LogOut size={11} />, color: 'text-slate-600 bg-slate-50 border-slate-200' };
                      if (acao.includes('Backup') || acao.includes('Export')) return { icon: <Archive size={11} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
                      return { icon: <Activity size={11} />, color: 'text-slate-500 bg-slate-50 border-slate-200' };
                    };
                    return userLogs.map(log => {
                      const { icon, color } = iconePorAcao(log.acao);
                      return (
                        <div key={log.id} className="flex items-start gap-2.5 p-2.5 rounded-[5px] hover:bg-slate-50 transition-colors">
                          <div className={`w-6 h-6 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold nl-text">{log.acao}</p>
                            {log.detalhes && <p className="text-[11px] nl-text-muted mt-0.5 line-clamp-2">{log.detalhes}</p>}
                          </div>
                          <span className="text-[10px] nl-text-muted shrink-0 tabular-nums whitespace-nowrap">{log.data_hora}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] shadow-xl rounded-[4px] px-5 py-3.5 flex items-center gap-3 z-[9999] animate-slide-up" style={{ boxShadow: '0 8px 30px rgba(9,30,66,0.16), 0 0 0 1px rgba(9,30,66,0.06)' }}>
           <div className="w-7 h-7 rounded-[7px] bg-green-500/10 flex items-center justify-center border border-green-200">
              <CheckCircle2 size={15} className="text-green-600" />
           </div>
           <p className="text-[13px] font-bold tracking-tight">{toast.message}</p>
        </div>
      )}
    </div>
  );
}

export default App;
