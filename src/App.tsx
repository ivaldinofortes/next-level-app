import { useState, useEffect, useRef, useMemo, useCallback, type CSSProperties, lazy, Suspense } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import GestaoPage from './components/GestaoPage';
import RelatoriosPage from './components/RelatoriosPage';
import ContactosPage from './components/ContactosPage';
import ConfiguracoesPage from './components/ConfiguracoesPage';

const RootPanel = lazy(() => import('./RootPanel'));
const ImportarDadosModal = lazy(() => import('./ImportarDadosModal'));
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
  Star, FileBarChart, Zap, Activity, Printer, ArrowLeft, Hash, ArrowRight, History, Banknote,
  Minimize2, Maximize2, Pencil, Send, StickyNote
} from 'lucide-react';
import {
  buildCoverageWindow,
  calculateDayBalance,
  formatCve,
  formatPtDate,
  getStudentStatusForMonth,
  isPaymentInsideMonth,
  normalizeAmount,
  parseFlexibleDate,
  summarizeStudentBilling,
} from './lib/billing';
import {
  MONTH_OPTIONS,
  APP_ICON_PATH,
  DEFAULT_ACADEMY_BANNER,
  DEFAULT_PAYMENT_METHOD,
  COMPANY_EMAIL,
  COMPANY_PHONE,
  COMPANY_WEBSITE,
  COMPANY_NAME,
  COMPANY_AUTHOR,
  NEXT_LAB_ICON,
  getStudentStatusLabel,
  getBillingBadgeLabel,
  getGenderBucket,
  PAYMENT_METHOD_OPTIONS,
  LEGACY_HOME_SUBTITLE,
  DEFAULT_HOME_SUBTITLE,
  getBillingTone,
  prioridadeResumoAlunos,
} from './constants';
import {
  formatInputDate, isFutureMonth, getMonthKey, isSameMonthAndYear,
  getPaymentMethodMeta, formatPaymentRecordId, buildPaymentCardNumber,
  getTimelineMetricLabel, getTimelineMetricWidth, getTimelineMetricBarClass,
  getAlunoIniciais, getAlunoNomeSeguro, getAvatarColorByName,
} from './utils/formatting';

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



const isPausedStatus = (status?: string) => status === 'pausado' || status === 'suspenso';
const isBlockedStatus = (status?: string) => status === 'bloqueado';
const isImportedStatus = (status?: string) => status === 'importado';
const isOperationallyActive = (status?: string) => !isPausedStatus(status) && !isBlockedStatus(status);

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
    '--radius-lg':               '9px',
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
    '--rp0': '#EEF3FF', '--rp0h': '#DDE8FF',
    '--rp1': '#F2EEFF', '--rp1h': '#E6DCFF',
    '--rp2': '#EDFFF5', '--rp2h': '#D7FFE9',
    '--rp3': '#FFF7EE', '--rp3h': '#FFEEDD',
    '--rp4': '#FFF0F3', '--rp4h': '#FFE0E6',
    '--rp5': '#EDFFFE', '--rp5h': '#D6FFFB',
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
    '--radius-lg':               '9px',
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
    '--rp0': '#1C2340', '--rp0h': '#222A4A',
    '--rp1': '#211B38', '--rp1h': '#2A2244',
    '--rp2': '#172822', '--rp2h': '#1D302A',
    '--rp3': '#2A2115', '--rp3h': '#32281B',
    '--rp4': '#2A1A1D', '--rp4h': '#342025',
    '--rp5': '#162828', '--rp5h': '#1C3131',
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
    '--radius-lg':               '9px',
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
    '--rp0': '#EBF0FA', '--rp0h': '#DBEAFF',
    '--rp1': '#EFE9F6', '--rp1h': '#E3D9F0',
    '--rp2': '#EAF7EF', '--rp2h': '#D8F0E4',
    '--rp3': '#FAF2E8', '--rp3h': '#F5EAD8',
    '--rp4': '#F7E9EE', '--rp4h': '#F0D9E5',
    '--rp5': '#E9F5F3', '--rp5h': '#D8EEEA',
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
        --radius-control: 8.4px;
        --radius-surface: 9px;
        --radius-compact: 6px;
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
        border-radius: var(--radius-surface);
        box-shadow: var(--shadow-sm);
        padding: var(--spacing-lg);
        transition: box-shadow var(--transition-base), background-color var(--transition-base), transform var(--transition-base);
        border: 1px solid var(--border-light);
      }
      .nl-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }

      /* ── Buttons ── */
      .nl-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: var(--radius-control);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: background-color var(--transition-fast), box-shadow var(--transition-fast),
                    transform var(--transition-fast), border-color var(--transition-fast);
        border: 1px solid transparent;
        outline: none;
        white-space: nowrap;
        letter-spacing: 0.01em;
      }
      .nl-btn:active { transform: scale(0.97); }

      .nl-btn-primary {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
        box-shadow: 0 1px 3px var(--shadow-primary);
      }
      .nl-btn-primary:hover {
        background: var(--color-primary-hover);
        box-shadow: 0 4px 12px var(--shadow-primary);
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
        border-radius: var(--radius-control);
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
        box-shadow: 0 0 0 3px var(--shadow-primary-focus);
        background: var(--bg-surface);
      }
      .nl-input::placeholder { color: var(--text-tertiary); opacity: 0.65; }

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

      /* ── Accent color utilities ── */
      .text-accent-teal   { color: var(--color-accent-teal); }
      .text-accent-violet { color: var(--color-accent-violet); }
      .text-accent-rose   { color: var(--color-accent-rose); }
      .text-accent-amber  { color: var(--color-accent-amber); }
      .bg-accent-teal     { background: var(--color-accent-teal); }
      .bg-accent-violet   { background: var(--color-accent-violet); }
      .bg-accent-rose     { background: var(--color-accent-rose); }
      .bg-accent-amber    { background: var(--color-accent-amber); }
      .border-accent-teal   { border-color: var(--color-accent-teal); }
      .border-accent-violet { border-color: var(--color-accent-violet); }
      .border-accent-rose   { border-color: var(--color-accent-rose); }
      .border-accent-amber  { border-color: var(--color-accent-amber); }

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
        box-shadow: var(--shadow-sm);
      }

      .nl-modal-overlay {
        background: rgba(15, 23, 42, 0.50);
        backdrop-filter: blur(4px);
      }
      .nl-modal {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
      }

      .nl-table thead { background: var(--color-secondary-lighter); }
      .nl-table tbody tr { transition: background-color var(--transition-fast); }
      .nl-table tbody tr:hover { background: color-mix(in srgb, var(--color-secondary-lighter) 72%, transparent); }

      /* ── Unified alert / notification component ── */
      .nl-alert { display:flex; align-items:flex-start; gap:12px; padding:11px 14px; border-radius:6px; border:1px solid; }
      .nl-alert-icon { width:30px; height:30px; min-width:30px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .nl-alert-success  { background:#F0FDF4; border-color:#BBF7D0; color:#166534; }
      .nl-alert-success  .nl-alert-icon { background:#DCFCE7; color:#059669; }
      .nl-alert-warning  { background:#FFFBEB; border-color:#FDE68A; color:#92400E; }
      .nl-alert-warning  .nl-alert-icon { background:#FEF3C7; color:#D97706; }
      .nl-alert-error    { background:#FEF2F2; border-color:#FECACA; color:#991B1B; }
      .nl-alert-error    .nl-alert-icon { background:#FEE2E2; color:#DC2626; }
      .nl-alert-info     { background:#F0F9FF; border-color:#BAE6FD; color:#075985; }
      .nl-alert-info     .nl-alert-icon { background:#E0F2FE; color:#0284C7; }
      .nl-alert-title    { font-size:12px; font-weight:700; line-height:1.3; }
      .nl-alert-body     { font-size:11px; opacity:.75; margin-top:1px; line-height:1.4; }

      /* ── Row palette — pastel alternating rows ── */
      tr.rp-0 { background-color: var(--rp0); } tr.rp-0:hover { background-color: var(--rp0h); }
      tr.rp-1 { background-color: var(--rp1); } tr.rp-1:hover { background-color: var(--rp1h); }
      tr.rp-2 { background-color: var(--rp2); } tr.rp-2:hover { background-color: var(--rp2h); }
      tr.rp-3 { background-color: var(--rp3); } tr.rp-3:hover { background-color: var(--rp3h); }
      tr.rp-4 { background-color: var(--rp4); } tr.rp-4:hover { background-color: var(--rp4h); }
      tr.rp-5 { background-color: var(--rp5); } tr.rp-5:hover { background-color: var(--rp5h); }

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
const electron = (window as any).electron || null;

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
  modalidade?: string;
}

interface Nota {
  id: number;
  aluno_id: string;
  texto: string;
  data_criacao: string;
}

interface NotaRecente extends Nota {
  nome?: string;
  telefone?: string;
  categoria?: string;
}

interface NotaResumo {
  aluno_id: string;
  total: number;
  ultimo_id?: number;
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
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const [expandirExtras, setExpandirExtras] = useState(false);
  const [mostrarFormEdicao, setMostrarFormEdicao] = useState(false);
  const [alunoEdicao, setAlunoEdicao] = useState<Aluno | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'divida' | 'cobertos' | 'importados'>('todos');
  const [mostrarFiltroListaAlunos, setMostrarFiltroListaAlunos] = useState(false);
  const [ordenacaoListaAlunos, setOrdenacaoListaAlunos] = useState<StudentSortMode>('inteligente');
  const [menuAlunoAberto, setMenuAlunoAberto] = useState<string | null>(null);
  const [mostrarCalendarioMeses, setMostrarCalendarioMeses] = useState(false);
  const [pesquisa, setPesquisa] = useState('');
  const [pesquisaDirectorio, setPesquisaDirectorio] = useState('');
  const [modoListaContactos, setModoListaContactos] = useState<'normal' | 'compacto'>('normal');
  const [ordenacaoDirectorio, setOrdenacaoDirectorio] = useState<StudentSortMode>('alfabetica');
  const [filtroDirectorioStatus, setFiltroDirectorioStatus] = useState<DirectoryFilterStatus>('todos');
  const [bannerAcademia, setBannerAcademia] = useState(() => localStorage.getItem('nl_banner_academia') || DEFAULT_ACADEMY_BANNER);
  const [appLogo, setAppLogo] = useState(() => localStorage.getItem('nl_app_logo') || APP_ICON_PATH);
  
  // Estados para Configurações
  const [mostrarSettings, setMostrarSettings] = useState(false);
  const [nomeAcademia, setNomeAcademia] = useState(() => localStorage.getItem('nl_nome_academia') || 'NEXTLevel');
  const [subtituloAcademia, setSubtituloAcademia] = useState(() => {
    const saved = localStorage.getItem('nl_subtitulo_academia');
    if (!saved || saved === LEGACY_HOME_SUBTITLE) return DEFAULT_HOME_SUBTITLE;
    return saved;
  });
  const [moradaAcademia, setMoradaAcademia] = useState(() => localStorage.getItem('nl_morada_academia') || 'Avenida Principal, Mindelo');
  const [emailAcademia, setEmailAcademia] = useState(() => localStorage.getItem('nl_email_academia') || 'contacto@nextlevel.cv');
  const [telefoneAcademia, setTelefoneAcademia] = useState(() => localStorage.getItem('nl_telefone_academia') || '+238 000 00 00');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [novaCategoria, setNovaCategoria] = useState('');

  // Estados para Controle Financeiro
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  const [mostrarHistoricoModal, setMostrarHistoricoModal] = useState(false);
  const [mostrarOpcoesAvancadas, setMostrarOpcoesAvancadas] = useState(false);
  const [pagamentoSucesso, setPagamentoSucesso] = useState(false);
  const [ultimoPagamentoInfo, setUltimoPagamentoInfo] = useState<{ valor: string; mes: string } | null>(null);
  const [pagamentoForm, setPagamentoForm] = useState<PaymentFormState>({
    valor: '',
    dataPagamento: formatInputDate(),
    metodo: DEFAULT_PAYMENT_METHOD,
  });
  const [historicoPagamentos, setHistoricoPagamentos] = useState<Pagamento[]>([]);
  const [alunoParaPagamento, setAlunoParaPagamento] = useState<Aluno | null>(null);
  const [timelineFinanceiraMinimizada, setTimelineFinanceiraMinimizada] = useState(true);

  // Estados para Central de Contactos Profissional
  const [alunoPerfil, setAlunoPerfil] = useState<Aluno | null>(null);
  const [notasContacto, setNotasContacto] = useState<Nota[]>([]);
  const [novaNota, setNovaNota] = useState('');
  const [notasResumo, setNotasResumo] = useState<Record<string, NotaResumo>>({});
  const [notasRecentes, setNotasRecentes] = useState<NotaRecente[]>([]);
  const [alunoNotasRapidas, setAlunoNotasRapidas] = useState<Aluno | null>(null);
  const [notasRapidas, setNotasRapidas] = useState<Nota[]>([]);
  const [novaNotaRapida, setNovaNotaRapida] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [contactosAbaDetalhe, setContactosAbaDetalhe] = useState<'perfil' | 'historico' | 'financeiro' | 'notas'>('perfil');
  // contactosTimeline now shares mesFinanceiro / anoFinanceiro
  const [timelineContactosMinimizada, setTimelineContactosMinimizada] = useState(false);
  const [contactosDesconto, setContactosDesconto] = useState('');
  const [contactosMostrarDesconto, setContactosMostrarDesconto] = useState(false);
  const [sugestoesNome, setSugestoesNome] = useState<Aluno[]>([]);
  const [mostrarModalDuplicados, setMostrarModalDuplicados] = useState(false);
  const [duplicadosEncontrados, setDuplicadosEncontrados] = useState<Aluno[][]>([]);
  const [mostrarMenuAcoes, setMostrarMenuAcoes] = useState(false);
  const menuAcoesRef = useRef<HTMLDivElement>(null);
  const notificacoesRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Estados para Modal de Perfil do Aluno (Painel Unificado com Abas)
  const [mostrarPerfilModal, setMostrarPerfilModal] = useState(false);
  const [mostrarHistoricoPerfil, setMostrarHistoricoPerfil] = useState(false);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [col1Minimizada, setCol1Minimizada] = useState(false);
  const [col2Minimizada, setCol2Minimizada] = useState(false);
  const [perfilEditForm, setPerfilEditForm] = useState<Partial<Aluno>>({});
  const [metodoPerfilPagamento, setMetodoPerfilPagamento] = useState('Dinheiro');
  const [perfilAba, setPerfilAba] = useState<'perfil' | 'historico' | 'cobrar'>('perfil');
  const [perfilPagamentoSucesso, setPerfilPagamentoSucesso] = useState(false);
  const [perfilUltimoPagamentoInfo, setPerfilUltimoPagamentoInfo] = useState<any>(null);

  // Estados para Modal Minimalista de Cobrança Rápida
  const [mostrarCobrancaRapida, setMostrarCobrancaRapida] = useState(false);
  const [alunoParaCobrancaRapida, setAlunoParaCobrancaRapida] = useState<Aluno | null>(null);
  const [cobrancaPagamentoSucesso, setCobrancaPagamentoSucesso] = useState(false);
  const [cobrancaUltimoPagamentoInfo, setCobrancaUltimoPagamentoInfo] = useState<any>(null);
  const [pagamentoAtivoInfo, setPagamentoAtivoInfo] = useState<{ aluno: Aluno; resumo: any } | null>(null);

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
  const [carregandoDuplicados, setCarregandoDuplicados] = useState(false);
  const [resetSeguroForm, setResetSeguroForm] = useState({ password: '', confirmation: '' });
  const [resetSeguroLoading, setResetSeguroLoading] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Sessão / utilizadores
  type UserRole = 'admin' | 'operational' | 'root';
  type SessionUser = { id: number; name: string; email: string; role: UserRole };
  const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias — sessão persistente
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    try {
      // 1. Verificar primeiro a sessão temporária (sessionStorage)
      const tempRaw = sessionStorage.getItem('nl_session_user');
      if (tempRaw) {
        const parsed = JSON.parse(tempRaw);
        if (parsed?.email && parsed?.role) return parsed as SessionUser;
      }
      
      // 2. Verificar a sessão persistente (localStorage)
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
  const [loginForm, setLoginForm] = useState(() => ({ username: localStorage.getItem('nl_last_username') || '', password: '' }));
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
  const [zoomLista, setZoomLista] = useState(() => Number(localStorage.getItem('nl_zoom_lista')) || 90); 
  const [fontSizeLista, setFontSizeLista] = useState(() => Number(localStorage.getItem('nl_font_size_lista')) || 13);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(true);
  const [notifPagamentos, setNotifPagamentos] = useState(true);
  const [notifMatriculas, setNotifMatriculas] = useState(true);
  const [notifSistema, setNotifSistema] = useState(true);
  const [notifRelatorios, setNotifRelatorios] = useState(true);
  const [relatorioMensalDisponivel, setRelatorioMensalDisponivel] = useState('');
  const [backupReminderEnabled, setBackupReminderEnabled] = useState(true);
  const [whatsappTemplate, setWhatsappTemplate] = useState('Olá, {nome}. A sua mensalidade da academia está pendente. Quando puder, regularize por favor.');
  const [ultimaExportacaoOperacional, setUltimaExportacaoOperacional] = useState('');
  const [diretorioBackup, setDiretorioBackup] = useState('');
  const [ultimoBackupMes, setUltimoBackupMes] = useState('');
  
  // Novos Estados de Segurança e Autenticação
  const [lembrarUtilizadores, setLembrarUtilizadores] = useState(true);
  const [permitirGuardarSessao, setPermitirGuardarSessao] = useState(true);
  const [requireOperationalPassword, setRequireOperationalPassword] = useState(true);
  const [guardarSessao, setGuardarSessao] = useState(false);
  const [mostrarDropdownRecentes, setMostrarDropdownRecentes] = useState(false);
  const [utilizadoresRecentes, setUtilizadoresRecentes] = useState<{ email: string, name: string, role: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('nl_recent_users') || '[]');
    } catch(e) {
      return [];
    }
  });

  const adicionarUtilizadorRecente = (email: string, name: string, role: string) => {
    try {
      const listRaw = localStorage.getItem('nl_recent_users') || '[]';
      const list = JSON.parse(listRaw);
      const filtered = list.filter((u: any) => u.email.toLowerCase() !== email.toLowerCase());
      filtered.unshift({ email, name, role });
      const limited = filtered.slice(0, 5);
      localStorage.setItem('nl_recent_users', JSON.stringify(limited));
      setUtilizadoresRecentes(limited);
    } catch (e) {
      console.error(e);
    }
  };
  
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
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(() => JSON.parse(localStorage.getItem('nl_notificacoes') || '[]'));
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
  const paddingLinhaY = `${((7.5 + densidadeLista * 5.5) * 0.64).toFixed(1)}px`;
  const paddingLinhaX = `${(12 + densidadeLista * 7).toFixed(1)}px`;
  const tamanhoAvatarLista = `${Math.round(29 + densidadeLista * 6)}px`;
  const tamanhoFonteLista = `${(13 + densidadeLista * 1.6).toFixed(1)}px`;
  const tamanhoFonteSecundariaLista = `${(11.2 + densidadeLista * 1.25).toFixed(1)}px`;
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
    const intervalId = window.setInterval(() => setAgora(new Date()), 60_000);
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
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  }, []);

  const guardarConfiguracao = async (chave: string, valor: string) => {
    if (!electron) return;
    await electron.ipcRenderer.invoke('update-configuracao', chave, valor);
  };

  const notificarSistema = useCallback(async (title: string, body: string) => {
    if (!electron || !desktopNotificationsEnabled) return;
    await electron.ipcRenderer.invoke('notify-system', { title, body });
  }, [desktopNotificationsEnabled]);

  const abrirConfirmacao = (config: Omit<ConfirmDialogState, 'visible'>) => {
    setConfirmDialog({ visible: true, ...config });
  };

  const fecharConfirmacao = () => {
    setConfirmDialog((prev) => ({ ...prev, visible: false }));
  };

  const fecharCamadaAtiva = useCallback(() => {
    if (confirmDialog.visible) { fecharConfirmacao(); return true; }
    if (mostrarCalendarioMeses) { setMostrarCalendarioMeses(false); return true; }
    if (mostrarFiltroListaAlunos) { setMostrarFiltroListaAlunos(false); return true; }
    if (mostrarUserMenu) { setMostrarUserMenu(false); return true; }
    if (mostrarMenuAcoes) { setMostrarMenuAcoes(false); return true; }
    if (contextMenu) { setContextMenu(null); return true; }
    if (mostrarNotificacoes) { setMostrarNotificacoes(false); return true; }
    if (mostrarDropdownRecentes) { setMostrarDropdownRecentes(false); return true; }
    if (mostrarSobreDoc) { setMostrarSobreDoc(false); return true; }
    if (utilizadorEmEdicao) { setUtilizadorEmEdicao(null); return true; }
    if (mostrarFormNovoUtilizador) { setMostrarFormNovoUtilizador(false); return true; }
    if (mostrarBoasVindas) { setMostrarBoasVindas(false); setAlunoBoasVindas(null); setMsgBoasVindas(''); return true; }
    if (alunoNotasRapidas) { setAlunoNotasRapidas(null); return true; }
    if (pagamentoAtivoInfo) { setPagamentoAtivoInfo(null); return true; }
    if (mostrarCobrancaRapida) { setMostrarCobrancaRapida(false); setAlunoParaCobrancaRapida(null); setCobrancaPagamentoSucesso(false); setCobrancaUltimoPagamentoInfo(null); return true; }
    if (mostrarPerfilModal) { setMostrarPerfilModal(false); setMostrarHistoricoPerfil(false); setAlunoPerfil(null); setPerfilPagamentoSucesso(false); return true; }
    if (mostrarRelatorioMensal) { setMostrarRelatorioMensal(false); return true; }
    if (mostrarModalDuplicados) { setMostrarModalDuplicados(false); return true; }
    if (mostrarModalExport) { setMostrarModalExport(false); return true; }
    if (mostrarModalPagamento) { setMostrarModalPagamento(false); return true; }
    if (mostrarImportar) { setMostrarImportar(false); return true; }
    return false;
  }, [
    confirmDialog.visible, mostrarCalendarioMeses, mostrarFiltroListaAlunos,
    mostrarUserMenu, mostrarMenuAcoes, contextMenu, mostrarNotificacoes,
    mostrarDropdownRecentes, mostrarSobreDoc, utilizadorEmEdicao,
    mostrarFormNovoUtilizador, mostrarBoasVindas, alunoNotasRapidas,
    pagamentoAtivoInfo, mostrarCobrancaRapida, mostrarPerfilModal,
    mostrarRelatorioMensal, mostrarModalDuplicados, mostrarModalExport,
    mostrarModalPagamento, mostrarImportar,
  ]);

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
  const abrirPerfilAluno = (aluno?: Aluno | null) => {
    if (!aluno?.id) {
      showToast('❌ Não foi possível abrir este aluno. Dados incompletos.');
      return;
    }
    setAlunoPerfil({
      ...aluno,
      nome: getAlunoNomeSeguro(aluno),
      plano: String(aluno.plano || ''),
      telefone: aluno.telefone || '',
      status: aluno.status || 'ativo',
    } as Aluno);
    setPerfilPagamentoSucesso(false);
    setPerfilUltimoPagamentoInfo(null);
    setMostrarHistoricoPerfil(false);
    setEditandoPerfil(false);
    setPagamentoForm({
      valor: String(normalizeAmount(aluno.plano) || ''),
      dataPagamento: formatInputDate(),
      metodo: DEFAULT_PAYMENT_METHOD,
      mesReferencia: mesAtualNome,
    });
    carregarNotas(aluno.id);
    setMostrarPerfilModal(true);
  };
  const registrarPagamentoAtomico = async (
    pagamento: Pagamento,
    nextChargeDate?: string,
    updateStudentDue = true
  ) => {
    const ipcRenderer = electron?.ipcRenderer || (window as any).electron?.ipcRenderer;
    if (!ipcRenderer) throw new Error('Electron IPC indisponível.');

    const res = await ipcRenderer.invoke('billing:register-payment', {
      pagamento,
      nextChargeDate,
      updateStudentDue,
    });
    if (!res?.success) throw new Error(res?.message || 'Erro ao registar pagamento.');
    return res;
  };

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
  const novoAlunoDefault = useMemo(() => ({
    nome: '', telefone: '', email: '', sexo: '',
    data_nascimento: '', morada: '', alergias: '',
    objetivos: '', horario_preferido: '',
    plano: '', vencimento: '', data_matricula: new Date().toISOString().split('T')[0],
    categoria: '',
    modo_cobranca: 'mensalidade_movel',
    modo_inscricao: 'matricula' as 'matricula' | 'matricula_pago',
    dia_pagamento: 1 as 1 | 'ultimo',
  }), []);
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
  const hojeReferenciaKey = agora.toDateString();
  const hojeReferencia = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
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
  const mesAtualNome = MONTH_OPTIONS[hojeReferencia.getMonth()];
  const anoAtual = hojeReferencia.getFullYear();
  const periodoAtualSelecionado = anoFinanceiro === anoAtual && mesFinanceiroIndex === hojeReferencia.getMonth();
  const periodoSelecionadoPassado = !periodoAtualSelecionado && (
    anoFinanceiro < anoAtual || (anoFinanceiro === anoAtual && mesFinanceiroIndex < hojeReferencia.getMonth())
  );
  const periodoSelecionadoLabel = `${mesFinanceiro.charAt(0).toUpperCase() + mesFinanceiro.slice(1)} ${anoFinanceiro}`;
  const subtituloPeriodoSelecionado = periodoAtualSelecionado
    ? 'Mês atual'
    : periodoSelecionadoPassado
      ? 'Mês passado'
      : 'Período futuro';
  const diasNoPeriodoSelecionado = mesFinanceiroIndex >= 0 ? new Date(anoFinanceiro, mesFinanceiroIndex + 1, 0).getDate() : 31;
  const diaProgressoPeriodo = periodoAtualSelecionado
    ? hojeReferencia.getDate()
    : periodoSelecionadoPassado
      ? diasNoPeriodoSelecionado
      : 0;
  const progressoPeriodoPercentual = Math.min(100, Math.max(0, (diaProgressoPeriodo / Math.max(diasNoPeriodoSelecionado, 1)) * 100));
  const irParaMesAtualOperacional = useCallback((mostrarAviso = false) => {
    setAnoFinanceiro(anoAtual);
    setMesFinanceiro(mesAtualNome);
    if (mostrarAviso) {
      showToast(`Ação operacional movida para ${mesAtualNome} ${anoAtual}.`);
    }
    return { mes: mesAtualNome, ano: anoAtual };
  }, [anoAtual, mesAtualNome, showToast]);
  const prepararAcaoOperacionalNoMesAtual = useCallback(() => {
    if (periodoAtualSelecionado) return { mes: mesFinanceiro, ano: anoFinanceiro };
    return irParaMesAtualOperacional(true);
  }, [periodoAtualSelecionado, mesFinanceiro, anoFinanceiro, irParaMesAtualOperacional]);

  const resumosFinanceiros = useMemo(() => {
    return alunos.map((aluno) => {
      // Também usa isolamento por mês para que os contadores do dashboard
      // reflictam o estado do mês selecionado, não do mês corrente.
      const resumo = getStudentStatusForMonth(aluno, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia);
      return { aluno, resumo };
    });
  }, [alunos, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia]);

  const timelineMonths = useMemo(() => {
    return MONTH_OPTIONS.map((mes, index) => {
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
            // Usar isolamento por mês: cada mês é avaliado independentemente
            const summary = getStudentStatusForMonth(aluno, pagamentos, anoFinanceiro, index, hojeReferencia);
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
  }, [anoFinanceiro, hojeReferencia, alunos, pagamentos, mesFinanceiro]);

  const alunosNoPeriodo = useMemo(() => {
    return periodoSelecionadoFuturo
      ? []
      : alunos.filter((aluno) => {
          const enrollment = parseFlexibleDate(aluno.data_matricula);
          return enrollment ? enrollment.getTime() <= referenciaFinanceira.getTime() : true;
        });
  }, [periodoSelecionadoFuturo, alunos, referenciaFinanceira]);

  const resumosHistoricoMensal = useMemo(() => {
    return alunosNoPeriodo.map((aluno) => {
      // Isolamento por mês: para meses passados usa apenas os pagamentos que cobrem esse mês.
      // Para o mês corrente usa o campo vencimento normalmente.
      const resumo = getStudentStatusForMonth(aluno, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia);
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
  }, [alunosNoPeriodo, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia, mesFinanceiro]);

  const alunosPausados = useMemo(() => resumosFinanceiros.filter(({ aluno }) => isPausedStatus(aluno.status)), [resumosFinanceiros]);
  const alunosBloqueados = useMemo(() => resumosFinanceiros.filter(({ aluno }) => isBlockedStatus(aluno.status)), [resumosFinanceiros]);
  const alunosImportados = useMemo(() => alunos.filter((a) => isImportedStatus(a.status)), [alunos]);
  const alunosAtivos = useMemo(() => resumosFinanceiros.filter(({ aluno }) => isOperationallyActive(aluno.status)), [resumosFinanceiros]);
  const alunosEmDivida = useMemo(() => alunosAtivos.filter(({ resumo }) => resumo.status === 'atrasado' || resumo.status === 'hoje'), [alunosAtivos]);
  const alunosComPagamentoEmDia = useMemo(() => alunosAtivos.filter(({ resumo }) => ['pago', 'alerta', 'pendente', 'critico'].includes(resumo.status)), [alunosAtivos]);
  const pagamentosDoPeriodo = useMemo(() => pagamentos.filter((pagamento) => isPaymentInsideMonth(pagamento, mesFinanceiro, anoFinanceiro)), [pagamentos, mesFinanceiro, anoFinanceiro]);
  const totalRecebidoPeriodo = useMemo(() => pagamentosDoPeriodo.reduce((acc, pagamento) => acc + normalizeAmount(pagamento.valor), 0), [pagamentosDoPeriodo]);
  const previsaoRecuperacao = useMemo(() => alunosEmDivida.reduce((acc, { aluno }) => acc + normalizeAmount(aluno.plano), 0), [alunosEmDivida]);
  const cobrancasParaHoje = useMemo(() => alunosAtivos.filter(({ resumo }) => resumo.status === 'hoje').length, [alunosAtivos]);
  
  const alunosInscritosHoje = useMemo(() => {
    return alunos.filter((aluno) => {
      const enrollment = parseFlexibleDate(aluno.data_matricula);
      if (!enrollment) return false;
      return formatPtDate(enrollment) === formatPtDate(hojeReferencia);
    }).length;
  }, [alunos, hojeReferencia]);

  const cobrancasCriticas = useMemo(() => alunosAtivos.filter(({ resumo }) => ['hoje', 'critico'].includes(resumo.status)).length, [alunosAtivos]);
  const mesAtualOperacional = `${hojeReferencia.getFullYear()}-${String(hojeReferencia.getMonth() + 1).padStart(2, '0')}`;
  const backupMensalPendente = backupReminderEnabled && ultimoBackupMes !== mesAtualOperacional;
  const novosInscritosRecentes = [...alunos]
    .sort((left, right) => {
      const leftDate = parseFlexibleDate(left.data_matricula)?.getTime();
      const rightDate = parseFlexibleDate(right.data_matricula)?.getTime();
      // sem data = recém adicionado → aparece primeiro
      if (!leftDate && !rightDate) return 0;
      if (!leftDate) return -1;
      if (!rightDate) return 1;
      return rightDate - leftDate;
    })
    .slice(0, 5);
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

        await registrarPagamentoAtomico(novoPagamento as Pagamento, janela.nextChargeDate);
        
        // Projetar próximo vencimento para o próximo loop ou para o estado final
        currentDueDate = parseFlexibleDate(janela.nextChargeDate) || new Date();
      }
      
      await carregarConfiguracoes();
      setMostrarResolverPendencias(false);
      adicionarNotificacao('sucesso', 'Regularização concluída', 'sucesso');
    } catch (err) {
      console.error(err);
      adicionarNotificacao('Erro', 'Falha ao resolver', 'erro');
    } finally {
      setCarregando(false);
    }
  };

  const resumoAlunoSelecionado = alunoSelecionado ? getStudentStatusForMonth(alunoSelecionado, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia) : null;
  const resumoAlunoParaPagamento = alunoParaPagamento ? getStudentStatusForMonth(alunoParaPagamento, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia) : null;
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

  const historicoMensalFiltrado = useMemo(() => resumosHistoricoMensal
    .filter(({ aluno, resumo }) => {
      const statusMatch = filtroStatus === 'todos'
        || (filtroStatus === 'divida' && (resumo.status === 'atrasado' || resumo.status === 'hoje'))
        || (filtroStatus === 'cobertos' && (resumo.status === 'pago' || resumo.status === 'em_dia' || resumo.status === 'vence_em_breve'))
        || (filtroStatus === 'importados' && isImportedStatus(aluno.status));
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
      if (ordenacaoListaAlunos === 'alfabetica') {
        return left.aluno.nome.localeCompare(right.aluno.nome, 'pt-PT');
      }
      if (ordenacaoListaAlunos === 'inscricao_recente') {
        const leftDate = parseFlexibleDate(left.aluno.data_matricula)?.getTime() || 0;
        const rightDate = parseFlexibleDate(right.aluno.data_matricula)?.getTime() || 0;
        if (leftDate !== rightDate) return rightDate - leftDate;
        return left.aluno.nome.localeCompare(right.aluno.nome, 'pt-PT');
      }
      if (ordenacaoListaAlunos === 'inscricao_antiga') {
        const leftDate = parseFlexibleDate(left.aluno.data_matricula)?.getTime() || 0;
        const rightDate = parseFlexibleDate(right.aluno.data_matricula)?.getTime() || 0;
        if (leftDate !== rightDate) return leftDate - rightDate;
        return left.aluno.nome.localeCompare(right.aluno.nome, 'pt-PT');
      }
      const prioridadeLeft = prioridadeResumoAlunos[left.resumo.status as keyof typeof prioridadeResumoAlunos] ?? 99;
      const prioridadeRight = prioridadeResumoAlunos[right.resumo.status as keyof typeof prioridadeResumoAlunos] ?? 99;
      if (prioridadeLeft !== prioridadeRight) return prioridadeLeft - prioridadeRight;
      if (left.entrouNesteMes !== right.entrouNesteMes) return left.entrouNesteMes ? -1 : 1;
      if (left.resumo.daysUntilCharge !== right.resumo.daysUntilCharge) {
        return left.resumo.daysUntilCharge - right.resumo.daysUntilCharge;
      }
      return left.aluno.nome.localeCompare(right.aluno.nome, 'pt-PT');
    }), [resumosHistoricoMensal, filtroStatus, pesquisa, ordenacaoListaAlunos]);

  const alunosNovosNoPeriodo = useMemo(() => resumosHistoricoMensal.filter((item) => item.entrouNesteMes), [resumosHistoricoMensal]);
  const alunosMigradosNoPeriodo = useMemo(() => resumosHistoricoMensal.filter((item) => !item.entrouNesteMes), [resumosHistoricoMensal]);
  const alunosComCobrancaNoPeriodo = useMemo(() => resumosHistoricoMensal.filter(({ resumo }) => resumo.status === 'atrasado' || resumo.status === 'hoje'), [resumosHistoricoMensal]);

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
    notificarSistema,
    showToast,
  ]);

  const [alunosDeletados, setAlunosDeletados] = useState<Aluno[]>([]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\d+$/.test(phone.replace(/[\s\-()+]/g, ''));

  const carregarConfiguracoes = useCallback(async () => {
    if (electron) {
      try {
        const lista = await electron.ipcRenderer.invoke('get-alunos', false);
        setAlunos(lista);
        
        const deletados = await electron.ipcRenderer.invoke('get-alunos', true);
        setAlunosDeletados(deletados.filter((a: any) => a.deleted === 1));

        const listaPagamentos = await electron.ipcRenderer.invoke('get-pagamentos');
        setPagamentos(listaPagamentos);

        const resumoNotas = await electron.ipcRenderer.invoke('get-notas-resumo');
        setNotasResumo(Object.fromEntries((resumoNotas || []).map((item: NotaResumo) => [item.aluno_id, item])));

        const notasRecentesLista = await electron.ipcRenderer.invoke('get-notas-recentes');
        setNotasRecentes(notasRecentesLista || []);
        
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
        if (configs.lembrar_utilizadores) setLembrarUtilizadores(configs.lembrar_utilizadores === '1');
        if (configs.permitir_guardar_sessao) setPermitirGuardarSessao(configs.permitir_guardar_sessao === '1');
        if (configs.require_operational_password !== undefined) setRequireOperationalPassword(configs.require_operational_password === '1');

        const setupOk = configs.setup_completed === '1';
        
        if (setupOk) {
          const key = configs.license_key || '';
          const expiry = configs.license_expiry || '';
          setLicencaDados({ chave: key, expiracao: expiry, tipo: configs.tipo_licenca || '' });

          if (!key) {
            setLicencaAtiva(false);
          } else {
            const normalizedExpiry = String(expiry || '').trim().toLowerCase();
            const isLifetimeLicense = !normalizedExpiry || normalizedExpiry === 'vitalícia' || normalizedExpiry === 'vitalicia';

            if (isLifetimeLicense) {
              setLicencaAtiva(true);
            } else if (expiry.includes('/')) {
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
  }, []);

  const atualizarAplicacao = useCallback(async () => {
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
  }, [setSincronizando, carregarConfiguracoes, showToast]);


  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fecharCamadaAtiva()) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'r') { e.preventDefault(); setAba('relatorios_detalhado'); }
      if (mod && e.key === ',') { e.preventDefault(); setAba('configuracoes'); }
      if (mod && e.key === 'j') { e.preventDefault(); setAba('contactos'); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    confirmDialog.visible,
    mostrarCalendarioMeses,
    mostrarFiltroListaAlunos,
    mostrarUserMenu,
    mostrarMenuAcoes,
    contextMenu,
    mostrarNotificacoes,
    mostrarDropdownRecentes,
    mostrarSobreDoc,
    utilizadorEmEdicao,
    mostrarFormNovoUtilizador,
    mostrarBoasVindas,
    mostrarCobrancaRapida,
    mostrarPerfilModal,
    mostrarRelatorioMensal,
    mostrarModalDuplicados,
    mostrarResolverPendencias,
    mostrarFormEdicao,
    mostrarForm,
    mostrarImportar,
    mostrarModalExport,
    mostrarModalPagamento,
    alunoSelecionado,
    mostrarSettings,
    mostrarConfigModal,
    fecharCamadaAtiva,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuAcoesRef.current && !menuAcoesRef.current.contains(event.target as Node)) {
        setMostrarMenuAcoes(false);
      }
      if (notificacoesRef.current && !notificacoesRef.current.contains(event.target as Node)) {
        setMostrarNotificacoes(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    if (mostrarMenuAcoes || mostrarNotificacoes || contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarMenuAcoes, mostrarNotificacoes, contextMenu]);

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
  }, [online, isLoggedIn, carregarConfiguracoes]);

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
  }, [backupReminderEnabled, ultimoBackupMes, nomeAcademia, notificarSistema]);

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
    electron.ipcRenderer.invoke('users:list').then((res: any) => {
      if (res?.success) setListaUtilizadores(res.users || []);
    });
  }, [aba, configAba]);

  const resetarBancoDeDados = async () => {
    if (!electron) return;
    if (sessionUser?.role !== 'admin') {
      showToast('❌ Apenas administradores podem resetar dados.');
      return;
    }
    if (resetSeguroForm.confirmation.trim().toUpperCase() !== 'RESETAR') {
      showToast('❌ Escreva RESETAR para confirmar.');
      return;
    }
    if (!resetSeguroForm.password) {
      showToast('❌ Informe a senha do administrador.');
      return;
    }

    setResetSeguroLoading(true);
    try {
      const res = await electron.ipcRenderer.invoke('db:reset-operational-data', {
        userId: sessionUser.id,
        email: sessionUser.email,
        password: resetSeguroForm.password,
        confirmation: resetSeguroForm.confirmation,
      });
      if (res.success) {
        showToast('✅ Dados operacionais resetados com segurança.');
        adicionarNotificacao('Limpeza de Sistema', 'Todos os dados de alunos e pagamentos foram removidos.', 'info');
        setResetSeguroForm({ password: '', confirmation: '' });
        await carregarConfiguracoes();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      console.error('Erro no reset:', err);
      showToast(`❌ ${err?.message || 'Erro ao limpar base de dados.'}`);
    } finally {
      setResetSeguroLoading(false);
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
      await electron.ipcRenderer.invoke('update-configuracao', 'nome_academia', setupData.nomeAcademia);
      await electron.ipcRenderer.invoke('update-configuracao', 'email_academia', setupData.email);
      await electron.ipcRenderer.invoke('update-configuracao', 'telefone_academia', setupData.telefone);
      
      // 2. Criar conta admin real (ou atualizar)
      await electron.ipcRenderer.invoke('users:create', {
        name: setupData.adminEmail,
        email: setupData.adminEmail,
        password: setupData.adminSenha,
        role: 'admin'
      });

      // 3. Guardar Licença (Simular 1 ano de validade)
      const dataExp = new Date();
      dataExp.setFullYear(dataExp.getFullYear() + 1);
      const expiryStr = formatPtDate(dataExp);
      
      await electron.ipcRenderer.invoke('update-configuracao', 'license_key', setupData.licenca);
      await electron.ipcRenderer.invoke('update-configuracao', 'license_expiry', expiryStr);
      
      // 4. Marcar setup como concluído
      await electron.ipcRenderer.invoke('update-configuracao', 'setup_completed', '1');

      adicionarNotificacao('Sistema Configurado', 'A configuração inicial foi concluída com sucesso.', 'sucesso');
      setSetupStep(5); // Ir para tela de confirmação
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
      const selectedMonthName = mesAtualNome;
      const targetMonthIndex = MONTH_OPTIONS.indexOf(selectedMonthName);
      const targetYear = anoAtual;

      const dueDay = (() => {
        const date = parseFlexibleDate(alunoParaPagamento.vencimento) || parseFlexibleDate(alunoParaPagamento.data_matricula) || new Date();
        return date.getDate();
      })();

      const targetDueDate = new Date(targetYear, targetMonthIndex, dueDay);
      const targetDueDateStr = formatPtDate(targetDueDate);

      const dataPagamento = formatPtDate(parseDate(pagamentoForm.dataPagamento));
      const janelaCobranca = buildCoverageWindow(dataPagamento, targetDueDateStr);
      const valorPagamento = String(
        normalizeAmount(pagamentoForm.valor) || normalizeAmount(alunoParaPagamento.plano) || 1000
      );
      
      const novoPagamento: Pagamento = {
        alunoId: alunoParaPagamento.id,
        valor: valorPagamento,
        status: 'pago',
        data_pagamento: dataPagamento,
        metodo_pagamento: pagamentoForm.metodo,
        mes_referencia: `${selectedMonthName.charAt(0).toUpperCase() + selectedMonthName.slice(1)} ${targetYear}`,
        referencia_inicio: janelaCobranca.coverageStart,
        referencia_fim: janelaCobranca.coverageEnd,
      };

      if (electron) {
        await registrarPagamentoAtomico(novoPagamento, janelaCobranca.nextChargeDate);
        adicionarNotificacao('Pagamento Registado', `Pagamento de ${alunoParaPagamento.nome} (${novoPagamento.mes_referencia}) foi registado com sucesso.`, 'sucesso');
        await notificarSistema(nomeAcademia, `Pagamento de ${alunoParaPagamento.nome} registado com sucesso.`);

        setUltimoPagamentoInfo({ valor: valorPagamento, mes: novoPagamento.mes_referencia || '' });
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

  async function carregarLogs() {
    if (electron) {
      const listaLogs = await electron.ipcRenderer.invoke('get-logs');
      setLogs(listaLogs);
    }
  }

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
      guardarConfiguracao('lembrar_utilizadores', lembrarUtilizadores ? '1' : '0'),
      guardarConfiguracao('permitir_guardar_sessao', permitirGuardarSessao ? '1' : '0'),
      guardarConfiguracao('require_operational_password', requireOperationalPassword ? '1' : '0'),
    ]);

    localStorage.setItem('nl_nome_academia', nomeAcademia);
    localStorage.setItem('nl_subtitulo_academia', subtituloAcademia);
    localStorage.setItem('nl_morada_academia', moradaAcademia);
    localStorage.setItem('nl_email_academia', emailAcademia);
    localStorage.setItem('nl_telefone_academia', telefoneAcademia);

    showToast('Definições gerais guardadas.');
    adicionarNotificacao('Definições atualizadas', 'Os dados gerais e políticas de login foram guardados.', 'sucesso');
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
  }, [carregarConfiguracoes]);

  useEffect(() => { if (isLoggedIn) carregarConfiguracoes(); }, [isLoggedIn, carregarConfiguracoes]);

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
    const dataMatriculaSelecionada = parseDate(novoAluno.data_matricula);
    if (!isSameMonthAndYear(dataMatriculaSelecionada, hojeReferencia.getMonth(), anoAtual)) {
      setNovoAluno((prev) => ({ ...prev, data_matricula: formatInputDate(hojeReferencia) }));
      irParaMesAtualOperacional();
      showToast('A matrícula deve ser registada no mês atual. Confirme a data e tente novamente.');
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
          await registrarPagamentoAtomico({
            alunoId: id,
            valor: String(normalizeAmount(novoAluno.plano)),
            status: 'pago',
            data_pagamento: formatPtDate(parseDate(novoAluno.data_matricula)),
            metodo_pagamento: DEFAULT_PAYMENT_METHOD,
            mes_referencia: janelaPrimeiroPagamento?.monthReference,
            referencia_inicio: janelaPrimeiroPagamento?.coverageStart,
            referencia_fim: janelaPrimeiroPagamento?.coverageEnd,
          }, janelaPrimeiroPagamento?.nextChargeDate, false);
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

  const sincronizarAlunoAtualizado = (alunoAtualizado: Aluno) => {
    setAlunos(prev => prev.map(aluno => aluno.id === alunoAtualizado.id ? { ...aluno, ...alunoAtualizado } : aluno));
    setAlunosDeletados(prev => prev.map(aluno => aluno.id === alunoAtualizado.id ? { ...aluno, ...alunoAtualizado } : aluno));
    setAlunoPerfil(prev => prev?.id === alunoAtualizado.id ? { ...prev, ...alunoAtualizado } : prev);
    setAlunoSelecionado(prev => prev?.id === alunoAtualizado.id ? { ...prev, ...alunoAtualizado } : prev);
    setAlunoEdicao(prev => prev?.id === alunoAtualizado.id ? { ...prev, ...alunoAtualizado } : prev);
    setAlunoParaCobrancaRapida(prev => prev?.id === alunoAtualizado.id ? { ...prev, ...alunoAtualizado } : prev);
    setPagamentoAtivoInfo(prev => prev?.aluno?.id === alunoAtualizado.id ? { ...prev, aluno: { ...prev.aluno, ...alunoAtualizado } } : prev);
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
      modo_cobranca: aluno.modo_cobranca || 'mensalidade_movel',
      modo_inscricao: (aluno as any).modo_inscricao || 'matricula',
      dia_pagamento: (aluno as any).dia_pagamento || 1
    } as typeof novoAlunoDefault);
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
        sincronizarAlunoAtualizado(alunoAtualizado as Aluno);
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

  const handleNomeChange = (nome: string) => {
    setNovoAluno({ ...novoAluno, nome });
    if (nome.trim().length > 1) {
      const termo = nome.toLowerCase().trim();
      const filtrados = alunos.filter(a => 
        a.nome.toLowerCase().includes(termo) || 
        (a.telefone && a.telefone.includes(termo))
      ).slice(0, 5);
      setSugestoesNome(filtrados);
    } else {
      setSugestoesNome([]);
    }
  };

  const sincronizarNotasDoAluno = (alunoId: string, notas: Nota[], options: { atualizarContacto?: boolean; atualizarRapidas?: boolean } = {}) => {
    const shouldUpdateContact = options.atualizarContacto || alunoPerfil?.id === alunoId;
    const shouldUpdateQuick = options.atualizarRapidas || alunoNotasRapidas?.id === alunoId;

    setNotasResumo(prev => ({ ...prev, [alunoId]: { aluno_id: alunoId, total: notas.length, ultimo_id: notas[0]?.id } }));
    if (shouldUpdateContact) setNotasContacto(notas);
    if (shouldUpdateQuick) setNotasRapidas(notas);
  };

  const carregarNotasRecentes = async () => {
    if (!electron) return [];
    const recentes = await electron.ipcRenderer.invoke('get-notas-recentes');
    setNotasRecentes(recentes || []);
    return recentes || [];
  };

  const carregarNotas = async (alunoId: string) => {
    if (electron) {
      const notas = await electron.ipcRenderer.invoke('get-notas', alunoId);
      sincronizarNotasDoAluno(alunoId, notas, { atualizarContacto: true });
      return notas;
    }
    return [];
  };

  const carregarNotasRapidas = async (alunoId: string, options: { abrirContacto?: boolean } = {}) => {
    if (!electron) return [];
    const notas = await electron.ipcRenderer.invoke('get-notas', alunoId);
    sincronizarNotasDoAluno(alunoId, notas, { atualizarRapidas: true, atualizarContacto: options.abrirContacto });
    return notas;
  };

  const abrirNotasRapidas = async (aluno: Aluno) => {
    const alunoSeguro = { ...aluno, nome: getAlunoNomeSeguro(aluno) } as Aluno;
    setAlunoNotasRapidas(alunoSeguro);
    setNovaNotaRapida('');
    await carregarNotasRapidas(aluno.id);
  };

  const adicionarNotaRapida = async () => {
    if (!electron || !alunoNotasRapidas || !novaNotaRapida.trim()) return;
    await electron.ipcRenderer.invoke('add-nota', { alunoId: alunoNotasRapidas.id, texto: novaNotaRapida.trim() });
    setNovaNotaRapida('');
    await carregarNotasRapidas(alunoNotasRapidas.id);
    await carregarNotasRecentes();
  };

  const eliminarNotaRapida = async (notaId: number) => {
    if (!electron || !alunoNotasRapidas) return;
    await electron.ipcRenderer.invoke('delete-nota', notaId);
    await carregarNotasRapidas(alunoNotasRapidas.id);
    await carregarNotasRecentes();
  };

  const abrirContactoAPartirNotas = async () => {
    if (!alunoNotasRapidas) return;
    const alunoId = alunoNotasRapidas.id;
    setAlunoPerfil({ ...alunoNotasRapidas, nome: getAlunoNomeSeguro(alunoNotasRapidas) } as Aluno);
    setAba('contactos');
    await carregarNotasRapidas(alunoId, { abrirContacto: true });
    setAlunoNotasRapidas(null);
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
      await carregarNotas(alunoPerfil.id);
      await carregarNotasRecentes();
    }
  };

  const eliminarNota = async (notaId: number) => {
    if (electron) {
      await electron.ipcRenderer.invoke('delete-nota', notaId);
      if (alunoPerfil) await carregarNotas(alunoPerfil.id);
      await carregarNotasRecentes();
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
          sincronizarAlunoAtualizado(alunoAtualizado as Aluno);
          await carregarConfiguracoes();
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
      e.target.value = '';
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
          sincronizarAlunoAtualizado({ ...aluno, status: novoStatus } as Aluno);
          const statusLabel = getStudentStatusLabel(novoStatus).toUpperCase();
          adicionarNotificacao('Alteração de Status', `O aluno ${aluno.nome} agora está ${statusLabel}.`, isPausedStatus(novoStatus) ? 'alerta' : 'info');
        }
        setMenuAlunoAberto(null);
        await carregarConfiguracoes();
        showToast(`Status atualizado para: ${novoStatus}`);
      } catch (error) {
        showToast('❌ Erro ao atualizar status.');
      }
    }
  };

  const buscarDuplicados = async () => {
    if (electron) {
      try {
        setCarregandoDuplicados(true);
        const res = await electron.ipcRenderer.invoke('db:find-duplicates');
        if (!res?.success) throw new Error(res?.message || 'Falha ao procurar duplicados.');
        setDuplicadosEncontrados((res.groups || []).map((group: any) => group.alunos || []));
        setMostrarModalDuplicados(true);
        return;
      } catch (err: any) {
        showToast(`❌ ${err?.message || 'Erro ao procurar duplicados.'}`);
      } finally {
        setCarregandoDuplicados(false);
      }
    }

    const grupos: Aluno[][] = [];
    const visitados = new Set<string>();
    for (const aluno of alunos) {
      if (visitados.has(aluno.id)) continue;
      const nomeNorm = aluno.nome.trim().toLowerCase();
      const tel = (aluno.telefone || '').replace(/\D/g, '');
      const grupo = alunos.filter(a => {
        if (a.id === aluno.id) return false;
        const aNome = a.nome.trim().toLowerCase();
        const aTel = (a.telefone || '').replace(/\D/g, '');
        return aNome === nomeNorm || (tel && aTel && tel === aTel);
      });
      if (grupo.length > 0) {
        const todos = [aluno, ...grupo];
        todos.forEach(a => visitados.add(a.id));
        grupos.push(todos);
      }
    }
    setDuplicadosEncontrados(grupos);
    setMostrarModalDuplicados(true);
  };

  const finalizarTodosImportados = async () => {
    if (!electron) return;
    try {
      const result = await electron.ipcRenderer.invoke('finalizar-importados');
      if (result.success) {
        await carregarConfiguracoes();
        showToast(`✅ ${result.changes} alunos ativados com sucesso!`);
      }
    } catch {
      showToast('❌ Erro ao finalizar importados.');
    }
  };

  const ativarImportado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoEdicao || !electron) return;
    try {
      const alunoAtivado = {
        id: alunoEdicao.id,
        nome: novoAluno.nome,
        telefone: novoAluno.telefone,
        email: novoAluno.email,
        sexo: novoAluno.sexo,
        data_nascimento: novoAluno.data_nascimento,
        morada: novoAluno.morada,
        alergias: novoAluno.alergias,
        objetivos: novoAluno.objetivos,
        horario_preferido: novoAluno.horario_preferido,
        plano: novoAluno.plano,
        vencimento: novoAluno.vencimento,
        data_matricula: novoAluno.data_matricula,
        categoria: novoAluno.categoria,
        modo_cobranca: novoAluno.modo_cobranca,
        status: 'ativo',
      };
      await electron.ipcRenderer.invoke('update-aluno-dados', alunoAtivado);
      await electron.ipcRenderer.invoke('update-aluno-status', alunoEdicao.id, 'ativo');
      sincronizarAlunoAtualizado({ ...alunoEdicao, ...alunoAtivado } as Aluno);
      setMostrarFormEdicao(false);
      setAlunoEdicao(null);
      await carregarConfiguracoes();
      showToast(`✅ ${novoAluno.nome} ativado com sucesso!`);
    } catch {
      showToast('❌ Erro ao ativar aluno.');
    }
  };

  const ordenarAlunosPorModo = useCallback((lista: Aluno[], modo: StudentSortMode) => {
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

    return ordered.sort((a: any, b: any) => {
      const statusA = calcularStatusVencimento((a.vencimento || ''));
      const statusB = calcularStatusVencimento(b.vencimento);
      const prioridade = { 'atrasado': 0, 'hoje': 1, 'critico': 2, 'pendente': 3, 'alerta': 4, 'pago': 5, 'pausado': 6, 'suspenso': 6, 'bloqueado': 7 };
      const pA = (isBlockedStatus(a.status) || isPausedStatus(a.status)) ? prioridade[a.status as keyof typeof prioridade] : prioridade[statusA.status as keyof typeof prioridade];
      const pB = (isBlockedStatus(b.status) || isPausedStatus(b.status)) ? prioridade[b.status as keyof typeof prioridade] : prioridade[statusB.status as keyof typeof prioridade];
      if (pA !== pB) return (pA ?? 99) - (pB ?? 99);
      return statusA.diffDays - statusB.diffDays;
    });
  }, []);

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

  const alunosFiltradosOrdenados = useMemo(() => resumosFinanceiros
    .filter(({ aluno, resumo }) => {
      const statusMatch = filtroStatus === 'todos'
        || (filtroStatus === 'divida' && (resumo.status === 'atrasado' || resumo.status === 'hoje'))
        || (filtroStatus === 'cobertos' && (resumo.status === 'pago' || resumo.status === 'em_dia' || resumo.status === 'vence_em_breve'))
        || (filtroStatus === 'importados' && isImportedStatus(aluno.status));
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
    }), [resumosFinanceiros, filtroStatus, pesquisa]);

  // alunosDirectorio uses the same period-filtered base as the Alunos page
  const alunosDirectorio = useMemo(() => ordenarAlunosPorModo(
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
        || String(aluno.id).toLowerCase().includes(termo);

      return statusMatch && pesquisaMatch;
    }),
    ordenacaoDirectorio
  ), [alunosNoPeriodo, filtroDirectorioStatus, pesquisaDirectorio, ordenacaoDirectorio, ordenarAlunosPorModo]);

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
      const alunoSeguro = {
        ...aluno,
        nome: getAlunoNomeSeguro(aluno),
        plano: String(aluno.plano || ''),
        telefone: aluno.telefone || '',
        status: aluno.status || 'ativo',
      } as Aluno;
      setAlunoParaCobrancaRapida(alunoSeguro);
      setCobrancaPagamentoSucesso(false);
      setCobrancaUltimoPagamentoInfo(null);
      setPagamentoForm({
        valor: String(normalizeAmount(alunoSeguro.plano) || ''),
        dataPagamento: formatInputDate(),
        metodo: DEFAULT_PAYMENT_METHOD,
        mesReferencia: mesAtualNome,
      });
      setMostrarCobrancaRapida(true);
    } else {
      showToast('❌ Aluno não encontrado para cobrança.');
    }
  };

  const abrirAcaoPagamentoDaLista = (aluno: Aluno, resumo: any) => {
    if (!aluno) return;
    if (resumo?.status === 'pago') {
      setPagamentoAtivoInfo({ aluno, resumo });
      return;
    }
    marcarComoPago(aluno.id);
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
      Status: (a.status || 'ativo').toUpperCase()
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
      if (exportConfig.colunas.includes('status')) row['Status'] = (a.status || 'ativo').toUpperCase();
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
      const resumo = getStudentStatusForMonth(a, pagamentos, anoRelatorio, mesIdx, hojeReferencia);
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

  const exportarRelatorioPdf = async () => {
    const mesIdx = MONTH_OPTIONS.indexOf(mesRelatorio);
    const periodoLabel = `${mesRelatorio.toUpperCase()} ${anoRelatorio}`;
    const dataGeracao = new Date().toLocaleString('pt-PT');
    const refRelatorio = new Date(anoRelatorio, mesIdx + 1, 0);
    const alunosRelatorio = [...alunos]
      .filter((aluno) => {
        const entrada = parseFlexibleDate(aluno.data_matricula);
        return entrada ? entrada.getTime() <= refRelatorio.getTime() : true;
      })
      .sort((a, b) => getAlunoNomeSeguro(a).localeCompare(getAlunoNomeSeguro(b)));

    const resumosRelatorio = alunosRelatorio.map((aluno) => ({
      aluno,
      resumo: getStudentStatusForMonth(aluno, pagamentos, anoRelatorio, mesIdx, hojeReferencia),
      pagamentoPeriodo: pagamentos
        .filter((pagamento) => (pagamento.aluno_id || pagamento.alunoId) === aluno.id && isPaymentInsideMonth(pagamento, mesRelatorio, anoRelatorio))
        .sort((left, right) => (right.id || 0) - (left.id || 0))[0],
    }));

    const pagamentosPeriodo = pagamentos.filter((pagamento) => isPaymentInsideMonth(pagamento, mesRelatorio, anoRelatorio));
    const receitaRecebida = pagamentosPeriodo.reduce((sum, pagamento) => sum + normalizeAmount(pagamento.valor), 0);
    const alunosOperacionais = alunosRelatorio.filter((aluno) => isOperationallyActive(aluno.status));
    const receitaPrevistaPeriodo = alunosOperacionais.reduce((sum, aluno) => sum + normalizeAmount(aluno.plano), 0);
    const alunosAtrasados = resumosRelatorio.filter(({ resumo }) => resumo.status === 'atrasado' || resumo.status === 'hoje');
    const alunosPagos = resumosRelatorio.filter(({ resumo }) => resumo.status === 'pago');
    const alunosComPagamentoPeriodo = resumosRelatorio.filter(({ pagamentoPeriodo }) => Boolean(pagamentoPeriodo));
    const coberturaPercentual = alunosOperacionais.length > 0 ? Math.round((alunosPagos.length / alunosOperacionais.length) * 100) : 100;
    const porCobrar = Math.max(0, receitaPrevistaPeriodo - receitaRecebida);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 12;

    const sanitizeFilePart = (value: string) => String(value || 'Relatorio').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
    const textOrDash = (value?: string | number | null) => {
      const text = String(value ?? '').trim();
      return text || '-';
    };
    const truncate = (value: string, max = 28) => {
      const text = textOrDash(value);
      return text.length > max ? `${text.slice(0, max - 1)}...` : text;
    };
    const statusTone = (status?: string) => {
      if (status === 'pago') return { fill: [220, 252, 231], text: [22, 101, 52] };
      if (status === 'atrasado' || status === 'hoje') return { fill: [254, 226, 226], text: [153, 27, 27] };
      if (status === 'critico') return { fill: [255, 237, 213], text: [154, 52, 18] };
      return { fill: [219, 234, 254], text: [30, 64, 175] };
    };

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 48, 'F');
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(marginX, 10, 15, 15, 2, 2, 'F');
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(marginX + 3.2, 13.2, 8.6, 1.8, 0.8, 0.8, 'F');
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(marginX + 3.2, 17, 8.6, 1.8, 0.8, 0.8, 'F');
    doc.setFillColor(248, 113, 113);
    doc.roundedRect(marginX + 3.2, 20.8, 8.6, 1.8, 0.8, 0.8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(nomeAcademia || 'Academia', marginX + 20, 14);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(textOrDash(subtituloAcademia), marginX + 20, 20);
    doc.text(truncate([moradaAcademia, telefoneAcademia, emailAcademia].filter(Boolean).join('  |  '), 56), marginX + 20, 26);
    doc.text(`Next Level Academia by ${COMPANY_NAME}`, marginX + 20, 32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.text('RELATORIO', pageWidth - marginX, 14, { align: 'right' });
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(periodoLabel, pageWidth - marginX, 21, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Gerado em ${dataGeracao}`, pageWidth - marginX, 28, { align: 'right' });
    doc.text(truncate(sessionUser?.name || 'Administrador', 24), pageWidth - marginX, 34, { align: 'right' });

    // Summary strip
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 48, pageWidth, 52, 'F');
    const stats: [string, string, [number, number, number]][] = [
      ['Alunos no periodo', String(alunosRelatorio.length), [30, 64, 175]],
      ['Operacionais', String(alunosOperacionais.length), [15, 118, 110]],
      ['Pagos', String(alunosPagos.length), [22, 101, 52]],
      ['Em atraso', String(alunosAtrasados.length), [153, 27, 27]],
      ['Cobertura', `${coberturaPercentual}%`, [37, 99, 235]],
      ['Previsto', formatCve(receitaPrevistaPeriodo), [30, 64, 175]],
      ['Recebido', formatCve(receitaRecebida), [22, 101, 52]],
      ['Por cobrar', formatCve(porCobrar), porCobrar > 0 ? [153, 27, 27] : [22, 101, 52]],
    ];

    const cardGap = 3;
    const cardsPerRow = 4;
    const cardWidth = (pageWidth - marginX * 2 - cardGap * (cardsPerRow - 1)) / cardsPerRow;
    stats.forEach(([label, value, tone], index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      const x = marginX + col * (cardWidth + cardGap);
      const y = 55 + row * 21;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cardWidth, 17, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(100, 116, 139);
      doc.text(String(label).toUpperCase(), x + 3, y + 5.2);
      doc.setFontSize(String(value).length > 12 ? 8.2 : 10);
      doc.setTextColor(tone[0], tone[1], tone[2]);
      doc.text(String(value), x + 3, y + 12.4);
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Lista detalhada de alunos', marginX, 110);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`${alunosComPagamentoPeriodo.length} aluno(s) com pagamento registado neste periodo. Valores em CVE.`, marginX, 115);

    const tableRows = resumosRelatorio.map(({ aluno, resumo, pagamentoPeriodo }, index) => [
      String(index + 1).padStart(2, '0'),
      truncate(getAlunoNomeSeguro(aluno), 24),
      truncate(textOrDash(aluno.telefone), 16),
      truncate(aluno.categoria || 'Geral', 12),
      formatCve(aluno.plano),
      getBillingBadgeLabel(resumo.status),
      textOrDash(resumo.nextChargeDate),
      truncate(resumo.coverageStart && resumo.coverageEnd ? `${resumo.coverageStart} - ${resumo.coverageEnd}` : textOrDash(resumo.coverageEnd), 20),
      textOrDash(resumo.lastPaymentDate),
      pagamentoPeriodo ? formatCve(pagamentoPeriodo.valor) : '-',
    ]);

    autoTable(doc, {
      startY: 120,
      margin: { left: marginX, right: marginX, bottom: 16 },
      head: [[
        '#',
        'Aluno',
        'Contacto',
        'Categoria',
        'Plano',
        'Estado',
        'Prox. cobranca',
        'Cobertura',
        'Ult. pagamento',
        'Pago periodo',
      ]],
      body: tableRows,
      theme: 'grid',
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.1,
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 5.6,
        cellPadding: { top: 1.8, right: 1, bottom: 1.8, left: 1 },
      },
      styles: {
        font: 'helvetica',
        fontSize: 5.3,
        cellPadding: { top: 1.45, right: 1, bottom: 1.45, left: 1 },
        textColor: [51, 65, 85],
        overflow: 'linebreak',
        valign: 'middle',
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 6, halign: 'center', textColor: [100, 116, 139] },
        1: { cellWidth: 32, fontStyle: 'bold', textColor: [15, 23, 42] },
        2: { cellWidth: 20 },
        3: { cellWidth: 17 },
        4: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 22 },
        8: { cellWidth: 19, halign: 'center' },
        9: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const rowData = resumosRelatorio[data.row.index];
          const tone = statusTone(rowData?.resumo?.status);
          data.cell.styles.fillColor = tone.fill as any;
          data.cell.styles.textColor = tone.text as any;
        }
      },
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`${nomeAcademia} | ${periodoLabel} | Next Level Academia`, marginX, pageHeight - 5);
      doc.text(`Pagina ${page} de ${totalPages}`, pageWidth - marginX, pageHeight - 5, { align: 'right' });
    }

    const fileName = `Relatorio_${sanitizeFilePart(nomeAcademia)}_${mesRelatorio}_${anoRelatorio}.pdf`;
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    if (electron) {
      const res = await electron.ipcRenderer.invoke('reports:export-current-pdf', {
        fileName,
        pdfBase64,
      });

      if (res?.success) {
        showToast(`Relatório PDF guardado: ${res.path}`);
        return;
      }

      if (!res?.canceled) {
        showToast(res?.message || 'Não foi possível exportar o relatório em PDF.');
      }
      return;
    }

    doc.save(fileName);
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
      if (col === 'status') return (a.status || 'ativo').toUpperCase();
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
        username: loginForm.username, 
        password: loginForm.password 
      });
      
      if (res.success) {
        localStorage.setItem('nl_last_username', loginForm.username);
        if (res.user?.email) {
          const role: UserRole = res.user.role === 'root' ? 'root' : (res.user.role === 'admin' ? 'admin' : 'operational');
          const user: SessionUser = {
            id: Number(res.user.id),
            name: String(res.user.name || 'Utilizador'),
            email: String(res.user.email),
            role,
          };
          
          if (lembrarUtilizadores) {
            adicionarUtilizadorRecente(user.email, user.name, user.role);
          }
          
          if (permitirGuardarSessao && guardarSessao) {
            localStorage.setItem('nl_session_user', JSON.stringify({ ...user, loginTimestamp: Date.now() }));
          } else {
            sessionStorage.setItem('nl_session_user', JSON.stringify(user));
          }
          
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

  const handleLogout = useCallback(() => {
    localStorage.removeItem('nl_session_user');
    sessionStorage.removeItem('nl_session_user');
    setSessionUser(null);
    setIsLoggedIn(false);
    setAba('home');
  }, []);

  const onMatricular = useCallback(() => {
    prepararAcaoOperacionalNoMesAtual();
    setNovoAluno({ ...novoAlunoDefault, data_matricula: formatInputDate(hojeReferencia) });
    setMostrarForm(true);
  }, [prepararAcaoOperacionalNoMesAtual, novoAlunoDefault, hojeReferencia, setNovoAluno, setMostrarForm]);

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
         licenca: 'NEXTLEVEL-VITALICIO-2026',
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
                
                {import.meta.env.DEV && (
                  <button
                    onClick={saltarSetupDesenvolvedor}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors mt-4"
                  >
                    [ Ignorar (Modo Desenvolvedor) ]
                  </button>
                )}
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
                  <div className="w-16 h-16 rounded-[var(--radius-control)] bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
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
                   if (res.success && res.license) {
                     await electron?.ipcRenderer.invoke('update-configuracao', 'license_key', chaveReativacao);
                     await electron?.ipcRenderer.invoke('update-configuracao', 'license_expiry', res.license.dataExpiracao || 'Vitalícia');
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
                <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-wider">Nome de Utilizador</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    onFocus={() => setMostrarDropdownRecentes(true)}
                    onBlur={() => setTimeout(() => setMostrarDropdownRecentes(false), 200)}
                    placeholder="O teu nome..."
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-[6px] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)] outline-none transition-all text-[13px]"
                    required
                  />
                  {mostrarDropdownRecentes && lembrarUtilizadores && utilizadoresRecentes.filter(u => u.name !== 'root' && u.name !== 'Root Técnico').length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-[6px] shadow-lg z-50 max-h-48 overflow-y-auto">
                      <div className="p-1.5 space-y-0.5">
                        {utilizadoresRecentes.filter(u => u.name !== 'root' && u.name !== 'Root Técnico').map((u) => (
                          <button
                            key={u.name}
                            type="button"
                            onMouseDown={() => {
                              setLoginForm(prev => ({ ...prev, username: u.name }));
                              setMostrarDropdownRecentes(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-left text-[12px] hover:bg-slate-50 rounded-[4px] transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-slate-700 leading-none">{u.name}</p>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-[3px] border ${
                              u.role === 'admin' 
                                ? 'bg-red-50 border-red-100 text-red-600'
                                : 'bg-blue-50 border-blue-100 text-blue-600'
                            }`}>
                              {u.role === 'admin' ? 'Admin' : 'Operador'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {permitirGuardarSessao && (
                <div className="space-y-1 py-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={guardarSessao}
                      onChange={(e) => setGuardarSessao(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                    />
                    <span className="text-[12px] font-medium text-slate-600">Manter sessão iniciada</span>
                  </label>
                  {guardarSessao && (() => {
                    const isTypedAdmin = loginForm.username.toLowerCase().includes('admin') || 
                                         loginForm.username.toLowerCase() === 'root' ||
                                         utilizadoresRecentes.some(u => u.name.toLowerCase() === loginForm.username.toLowerCase() && (u.role === 'admin' || u.role === 'root'));
                    if (isTypedAdmin) {
                      return (
                        <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 leading-normal pl-6">
                          ⚠️ Atenção Administrador: Não recomendado em computadores partilhados.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

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
                          } catch (e) {
                            console.warn('Falha no acesso rápido:', e);
                          }
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
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white/50 text-[12px] font-bold">A carregar painel root...</div>}>
        <RootPanel
          onLogout={() => {
            localStorage.removeItem('nl_session_user');
            setSessionUser(null);
            setIsLoggedIn(false);
          }}
        />
      </Suspense>
    );
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden antialiased nl-text"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      <GlobalStyles theme={appTheme} />
      
      {/* Header */}
      <Header
        nomeAcademia={nomeAcademia}
        COMPANY_NAME={COMPANY_NAME}
        COMPANY_WEBSITE={COMPANY_WEBSITE}
        appLogo={appLogo}
        APP_ICON_PATH={APP_ICON_PATH}
        aba={aba}
        setAba={setAba}
        sessionUser={sessionUser}
        onLogout={handleLogout}
        notificacoesNaoLidas={notificacoesNaoLidas}
        mostrarNotificacoes={mostrarNotificacoes}
        setMostrarNotificacoes={setMostrarNotificacoes}
        sincronizando={sincronizando}
        onRefreshApp={atualizarAplicacao}
        relatorioMensalDisponivel={relatorioMensalDisponivel}
        mostrarUserMenu={mostrarUserMenu}
        setMostrarUserMenu={setMostrarUserMenu}
        setMostrarSobreDoc={setMostrarSobreDoc}
        onMatricular={onMatricular}
        setMostrarRelatorioMensal={setMostrarRelatorioMensal}
        listaStats={{
          total: historicoMensalFiltrado.length,
          atrasados: alunosEmDivida.length,
          recebido: totalRecebidoPeriodo,
        }}
        larguraListas={larguraListas}
      />

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
          <HomePage
            bannerAcademia={bannerAcademia}
            DEFAULT_ACADEMY_BANNER={DEFAULT_ACADEMY_BANNER}
            appLogo={appLogo}
            APP_ICON_PATH={APP_ICON_PATH}
            nomeAcademia={nomeAcademia}
            subtituloAcademia={subtituloAcademia}
            agora={agora}
            alunosAtivos={alunosAtivos}
            alunosEmDivida={alunosEmDivida}
            totalRecebidoPeriodo={totalRecebidoPeriodo}
            alunos={alunos}
            previsaoRecuperacao={previsaoRecuperacao}
            alunosImportados={alunosImportados}
            relatorioMensalDisponivel={relatorioMensalDisponivel}
            setAba={setAba}
            setFiltroStatus={(status: string) => setFiltroStatus(status as any)}
            setMostrarForm={setMostrarForm}
            setMostrarImportar={setMostrarImportar}
            setNovoAluno={setNovoAluno}
            novoAlunoDefault={novoAlunoDefault}
            hojeReferencia={hojeReferencia}
            prepararAcaoOperacionalNoMesAtual={prepararAcaoOperacionalNoMesAtual}
            novosInscritosRecentes={novosInscritosRecentes}
            abrirPerfilAluno={abrirPerfilAluno}
            notasRecentes={notasRecentes}
            onUploadBanner={handleUploadBanner}
          />
        )}

        {aba === 'relatorios_detalhado' && (
          <RelatoriosPage
            mesRelatorio={mesRelatorio}
            setMesRelatorio={setMesRelatorio}
            anoRelatorio={anoRelatorio}
            setAnoRelatorio={setAnoRelatorio}
            timelineFinanceiraMinimizada={timelineFinanceiraMinimizada}
            setTimelineFinanceiraMinimizada={setTimelineFinanceiraMinimizada}
            alunos={alunos}
            pagamentos={pagamentos}
            hojeReferencia={hojeReferencia}
            larguraListas={larguraListas}
            appLogo={appLogo}
            nomeAcademia={nomeAcademia}
            sessionUser={sessionUser}
            onExportarExcel={exportarRelatorioExcel}
            onExportarPdf={exportarRelatorioPdf}
          />
        )}

        {/* Module: Alunos */}
        {aba === 'gestao' && (
          <GestaoPage
            larguraListas={larguraListas}
            mostrarFiltroListaAlunos={mostrarFiltroListaAlunos}
            setMostrarFiltroListaAlunos={setMostrarFiltroListaAlunos}
            mostrarCalendarioMeses={mostrarCalendarioMeses}
            setMostrarCalendarioMeses={setMostrarCalendarioMeses}
            periodoAtualSelecionado={periodoAtualSelecionado}
            periodoSelecionadoLabel={periodoSelecionadoLabel}
            subtituloPeriodoSelecionado={subtituloPeriodoSelecionado}
            historicoMensalFiltrado={historicoMensalFiltrado}
            alunosNovosNoPeriodo={alunosNovosNoPeriodo}
            anoFinanceiro={anoFinanceiro}
            setAnoFinanceiro={setAnoFinanceiro}
            anoAtual={anoAtual}
            mesFinanceiro={mesFinanceiro}
            setMesFinanceiro={setMesFinanceiro}
            hojeReferencia={hojeReferencia}
            periodoSelecionadoKey={periodoSelecionadoKey}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
            ordenacaoListaAlunos={ordenacaoListaAlunos}
            setOrdenacaoListaAlunos={setOrdenacaoListaAlunos}
            pesquisa={pesquisa}
            setPesquisa={setPesquisa}
            alunosEmDivida={alunosEmDivida}
            alunosImportados={alunosImportados}
            totalRecebidoPeriodo={totalRecebidoPeriodo}
            previsaoRecuperacao={previsaoRecuperacao}
            progressoPeriodoPercentual={progressoPeriodoPercentual}
            periodoSelecionadoPassado={periodoSelecionadoPassado}
            diasNoPeriodoSelecionado={diasNoPeriodoSelecionado}
            diaProgressoPeriodo={diaProgressoPeriodo}
            periodoSelecionadoFuturo={periodoSelecionadoFuturo}
            estiloTabelaAlunos={estiloTabelaAlunos}
            setAlunoPerfil={setAlunoPerfil}
            irParaMesAtualOperacional={irParaMesAtualOperacional}
            abrirEdicao={abrirEdicao}
            abrirPerfilAluno={abrirPerfilAluno}
            onEstadoPagamentoClick={abrirAcaoPagamentoDaLista}
            notasResumo={notasResumo}
            onNotasClick={abrirNotasRapidas}
            finalizarTodosImportados={finalizarTodosImportados}
            setAba={setAba}
          />
        )}

        {/* Module: Finanças — removido, integrado em Alunos */}

        {/* Module: CRM / Contactos */}
        {aba === 'contactos' && (
          <ContactosPage
            alunoPerfil={alunoPerfil}
            setAlunoPerfil={setAlunoPerfil}
            mesFinanceiroIndex={mesFinanceiroIndex}
            anoFinanceiro={anoFinanceiro}
            setAnoFinanceiro={setAnoFinanceiro}
            setMesFinanceiro={setMesFinanceiro}
            timelineFinanceiraMinimizada={timelineFinanceiraMinimizada}
            setTimelineFinanceiraMinimizada={setTimelineFinanceiraMinimizada}
            pagamentos={pagamentos}
            notasContacto={notasContacto}
            notasResumo={notasResumo}
            carregarNotas={carregarNotas}
            hojeReferencia={hojeReferencia}
            larguraListas={larguraListas}
            larguraSidebarContactos={larguraSidebarContactos}
            alunosDirectorio={alunosDirectorio}
            pesquisaDirectorio={pesquisaDirectorio}
            setPesquisaDirectorio={setPesquisaDirectorio}
            filtroDirectorioStatus={filtroDirectorioStatus}
            setFiltroDirectorioStatus={setFiltroDirectorioStatus}
            handleUploadFoto={handleUploadFoto}
            enviarMensagemWhatsApp={enviarMensagemWhatsApp}
            abrirEdicao={abrirEdicao}
            alterarStatus={alterarStatus}
            eliminarAluno={eliminarAluno}
            onEstadoPagamentoClick={abrirAcaoPagamentoDaLista}
            abrirResolverPendencias={abrirResolverPendencias}
            adicionarNota={adicionarNota}
            eliminarNota={eliminarNota}
            buscarDuplicados={buscarDuplicados}
            timelineMonths={timelineMonths}
            mostrarMenuAcoes={mostrarMenuAcoes}
            setMostrarMenuAcoes={setMostrarMenuAcoes}
            menuAcoesRef={menuAcoesRef}
            novaNota={novaNota}
            setNovaNota={setNovaNota}
          />
        )}
        {aba === 'configuracoes' && sessionUser?.role === 'admin' && (
          <ConfiguracoesPage
            aba={aba}
            configAba={configAba}
            setConfigAba={setConfigAba}
            sessionUser={sessionUser}
            larguraListas={larguraListas}
            appLogo={appLogo}
            setAppLogo={setAppLogo}
            nomeAcademia={nomeAcademia}
            setNomeAcademia={setNomeAcademia}
            telefoneAcademia={telefoneAcademia}
            setTelefoneAcademia={setTelefoneAcademia}
            emailAcademia={emailAcademia}
            setEmailAcademia={setEmailAcademia}
            moradaAcademia={moradaAcademia}
            setMoradaAcademia={setMoradaAcademia}
            lembrarUtilizadores={lembrarUtilizadores}
            setLembrarUtilizadores={setLembrarUtilizadores}
            permitirGuardarSessao={permitirGuardarSessao}
            setPermitirGuardarSessao={setPermitirGuardarSessao}
            requireOperationalPassword={requireOperationalPassword}
            setRequireOperationalPassword={setRequireOperationalPassword}
            slideshowImages={slideshowImages}
            setSlideshowImages={setSlideshowImages}
            slideshowTimer={slideshowTimer}
            setSlideshowTimer={setSlideshowTimer}
            slideshowTextEnabled={slideshowTextEnabled}
            setSlideshowTextEnabled={setSlideshowTextEnabled}
            appTheme={appTheme}
            setAppTheme={setAppTheme}
            bannerAcademia={bannerAcademia}
            setBannerAcademia={setBannerAcademia}
            listaUtilizadores={listaUtilizadores}
            utilizadorAvatares={utilizadorAvatares}
            logs={logs}
            mostrarFormNovoUtilizador={mostrarFormNovoUtilizador}
            setMostrarFormNovoUtilizador={setMostrarFormNovoUtilizador}
            utilizadorEmEdicao={utilizadorEmEdicao}
            setUtilizadorEmEdicao={setUtilizadorEmEdicao}
            utilizadorEdicaoForm={utilizadorEdicaoForm}
            setUtilizadorEdicaoForm={setUtilizadorEdicaoForm}
            quickAccessUsers={quickAccessUsers}
            setQuickAccessUsers={setQuickAccessUsers}
            loginSlideshowUsers={loginSlideshowUsers}
            setLoginSlideshowUsers={setLoginSlideshowUsers}
            desktopNotificationsEnabled={desktopNotificationsEnabled}
            setDesktopNotificationsEnabled={setDesktopNotificationsEnabled}
            notifSistema={notifSistema}
            setNotifSistema={setNotifSistema}
            notifPagamentos={notifPagamentos}
            setNotifPagamentos={setNotifPagamentos}
            notifMatriculas={notifMatriculas}
            setNotifMatriculas={setNotifMatriculas}
            notifRelatorios={notifRelatorios}
            setNotifRelatorios={setNotifRelatorios}
            relatorioMensalDisponivel={relatorioMensalDisponivel}
            notificacoes={notificacoes}
            setNotificacoes={setNotificacoes}
            diretorioBackup={diretorioBackup}
            setDiretorioBackup={setDiretorioBackup}
            resetSeguroForm={resetSeguroForm}
            setResetSeguroForm={setResetSeguroForm}
            resetSeguroLoading={resetSeguroLoading}
            carregandoDuplicados={carregandoDuplicados}
            mostrarImportar={mostrarImportar}
            setMostrarImportar={setMostrarImportar}
            licencaDados={licencaDados}
            guardarConfiguracao={guardarConfiguracao}
            salvarDefinicoesGerais={salvarDefinicoesGerais}
            salvarAparencia={salvarAparencia}
            carregarLogs={carregarLogs}
            gerarBackup={gerarBackup}
            selecionarDiretorioBackup={selecionarDiretorioBackup}
            buscarDuplicados={buscarDuplicados}
            abrirConfirmacao={abrirConfirmacao}
            resetarBancoDeDados={resetarBancoDeDados}
            salvarPreferenciasNotificacoes={salvarPreferenciasNotificacoes}
            setAba={setAba}
            setMostrarModalExport={setMostrarModalExport}
          />
        )}
    </main>

    {/* Modal: Nova Matrícula */}
    {mostrarImportar && (
      <Suspense fallback={null}>
        <ImportarDadosModal
          onClose={() => setMostrarImportar(false)}
          onSuccess={(resumo) => {
            setMostrarImportar(false);
            carregarConfiguracoes();
            showToast(`Importação concluída: ${resumo.inseridos} inseridos e ${resumo.erros} falhas.`);
          }}
          electron={electron}
          categorias={categorias || ['Geral']}
        />
      </Suspense>
    )}
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
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nome do aluno..."
                    value={novoAluno.nome}
                    onChange={e => handleNomeChange(e.target.value)}
                    className="nl-input w-full h-10 px-3 text-[13px]"
                    required
                    autoFocus
                    onBlur={() => setTimeout(() => setSugestoesNome([]), 200)}
                  />
                  {sugestoesNome.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-md shadow-lg z-[110] overflow-hidden animate-scale-in">
                      <p className="px-3 py-1.5 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contactos Existentes</p>
                      {sugestoesNome.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setMostrarForm(false);
                            setSugestoesNome([]);
                            abrirPerfilAluno(s);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <p className="text-[12px] font-bold text-slate-700">{s.nome}</p>
                            <p className="text-[10px] text-slate-400">{s.telefone || 'Sem telefone'}</p>
                          </div>
                          <ExternalLink size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                        className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-surface)] border-2 text-left transition-all ${
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
              <div className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-control)] bg-[#EEF4FF] border border-[#C7DEFF]">
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4 animate-fade-in" onClick={() => setMostrarResolverPendencias(false)}>
        <div className="bg-[var(--bg-surface)] w-full max-w-[450px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
          <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Resolver Pendências</h2>
            </div>
            <div className="flex-1 flex justify-end px-3">
              <button onClick={() => setMostrarResolverPendencias(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-[6px] bg-amber-50 border border-amber-100">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[12px] nl-text-muted">Estás a regularizar a conta de</p>
                <p className="text-[16px] font-black nl-text">{alunoParaResolver.nome}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Meses Selecionados</p>
              <div className="grid grid-cols-2 gap-2">
                {mesesParaResolver.map(mes => (
                  <div key={mes} className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold">
                    <CheckCircle2 size={12} /> {mes}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-200/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Wallet size={15} className="text-white" />
                </div>
                <span className="text-[12px] font-black text-white uppercase tracking-[0.12em]">Total a Liquidar</span>
              </div>
              <span className="text-[20px] font-black text-white drop-shadow-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatCve(normalizeAmount(alunoParaResolver.plano) * mesesParaResolver.length)}
              </span>
            </div>
          </div>

          <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button onClick={() => setMostrarResolverPendencias(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Cancelar</button>
            <button onClick={resolverPendencias} className="nl-btn !h-10 !px-7 !text-[12px] font-black !bg-gradient-to-r !from-amber-600 !to-amber-500 !text-white !border-none !shadow-lg !shadow-amber-200/50 hover:!shadow-amber-300/60 hover:!scale-[1.02] active:!scale-[0.98] transition-all">
              <CheckCircle2 size={16} /> Resolver {mesesParaResolver.length} Mensalidades
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
            {isImportedStatus(alunoEdicao?.status) && (
              <button type="button" onClick={ativarImportado} className="nl-btn !h-9 !px-5 !text-[11px] font-bold !bg-emerald-600 !text-white hover:!bg-emerald-700 border border-emerald-700 shadow-sm">
                <CheckCircle2 size={14} /> Confirmar e Ativar
              </button>
            )}
            <button type="submit" form="editar-aluno-form" className="nl-btn nl-btn-primary !h-9 !px-6 !text-[11px] font-bold">
              <Save size={14} /> Guardar Alterações
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal: Resolver Duplicados */}
    {mostrarModalDuplicados && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[160] p-4 animate-fade-in" onClick={() => setMostrarModalDuplicados(false)}>
        <div className="bg-[var(--bg-surface)] w-full max-w-[600px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
          <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Duplicados ({duplicadosEncontrados.length})</h2>
            </div>
            <div className="flex-1 flex justify-end px-3">
              <button onClick={() => setMostrarModalDuplicados(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
            {duplicadosEncontrados.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <p className="text-[16px] font-black nl-text">Tudo limpo!</p>
                <p className="text-[12px] nl-text-muted">Não foram encontrados contactos com nomes ou telefones repetidos.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-[11px] nl-text-muted">Os grupos abaixo partilham o mesmo <b>nome</b> ou <b>número de telemóvel</b>.</p>
                
                {duplicadosEncontrados.map((grupo, idx) => (
                  <div key={idx} className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
                    <div className="px-4 py-2 bg-[var(--color-secondary-lighter)]/50 border-b border-[var(--border-light)] flex items-center justify-between">
                      <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Grupo #{idx + 1}</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase">{grupo.length} ocorrências</span>
                    </div>
                    <div className="divide-y divide-[var(--border-light)]">
                      {grupo.map(aluno => (
                        <div key={aluno.id} className="p-3 hover:bg-[var(--color-secondary-lighter)]/30 transition-colors flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--color-secondary-lighter)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-[12px] shrink-0 overflow-hidden border border-[var(--border)]">
                            {aluno.foto_path ? <img src={`local-resource://${aluno.foto_path}`} className="w-full h-full object-cover" /> : getAlunoIniciais(aluno)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold nl-text truncate">{aluno.nome}</p>
                            <p className="text-[11px] nl-text-muted">{aluno.telefone || 'Sem telefone'}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Inscrito em: {aluno.data_matricula || '—'}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => {
                                setMostrarModalDuplicados(false);
                                abrirPerfilAluno(aluno);
                              }}
                              className="nl-btn !h-8 !px-3 !text-[10px] font-bold uppercase"
                            >
                              Ver
                            </button>
                            <button 
                              onClick={() => {
                                abrirConfirmacao({
                                  title: 'Eliminar Duplicado',
                                  message: `Tens a certeza que queres mover o registo de ${aluno.nome} para a lixeira?`,
                                  confirmLabel: 'Eliminar',
                                  tone: 'danger',
                                  onConfirm: async () => {
                                    if (electron) {
                                      const res = await electron.ipcRenderer.invoke('db:delete-duplicate', { alunoId: aluno.id });
                                      if (!res?.success) throw new Error(res?.message || 'Falha ao remover duplicado.');
                                      const novosGrupos = (res.groups || []).map((group: any) => group.alunos || []);
                                      setDuplicadosEncontrados(novosGrupos);
                                      await carregarConfiguracoes();
                                      showToast('✅ Duplicado movido para a lixeira.');
                                      if (novosGrupos.length === 0) setMostrarModalDuplicados(false);
                                    }
                                  }
                                });
                              }}
                              className="nl-btn !h-8 !w-8 !p-0 !bg-red-50 !text-red-500 hover:!bg-red-500 hover:!text-white !border-red-100 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-center shrink-0">
            <button onClick={() => setMostrarModalDuplicados(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Fechar</button>
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
                  {
                    label: 'Saldo de dias',
                    value: (() => {
                      const balance = resumoAlunoSelecionado?.dayBalance || 0;
                      if (balance > 0) return <span className="text-emerald-600 font-bold">+{balance} dias (Antecipado)</span>;
                      if (balance < 0) return <span className="text-red-600 font-bold">{balance} dias (Atraso)</span>;
                      return <span className="text-slate-500 font-bold">0 dias (Em dia)</span>;
                    })()
                  },
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
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.visible && (
        <div className="fixed inset-0 nl-modal-overlay flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
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



      {/* Menu de Contexto */}
      {contextMenu && (
        <div 
          ref={contextMenuRef}
          className="fixed bg-[var(--bg-surface)] shadow-2xl border border-[var(--border)] rounded-[3px] py-2 z-[200] min-w-[240px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-4 py-2 text-[11px] font-bold nl-text-muted uppercase tracking-widest border-b border-[var(--border-light)] mb-1 flex items-center justify-between">
            Ações Rápidas
            <Shield size={10} className="text-[var(--color-primary)]" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4 animate-fade-in" onClick={() => setMostrarRelatorioMensal(false)}>
           <div className="bg-[var(--bg-surface)] w-full max-w-[850px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                    <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
                </div>
                <div className="flex-1 text-center whitespace-nowrap">
                  <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">{mesFinanceiro} {anoFinanceiro}</h2>
                </div>
                <div className="flex-1 flex justify-end px-3">
                  <button onClick={() => setMostrarRelatorioMensal(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                 {/* Cards Resumo */}
                 <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Total Recebido', value: normalizeAmount(totalRecebidoPeriodo).toLocaleString(), suffix: 'CVE', color: '#33d17a', icon: <CreditCard size={100} /> },
                      { label: 'Cobertura Ativa', value: alunosComPagamentoEmDia.length, suffix: '', color: 'var(--color-primary)', icon: <CheckCircle2 size={100} /> },
                      { label: 'Em Cobrança', value: alunosEmDivida.length, suffix: '', color: '#e01b24', icon: <AlertCircle size={100} /> },
                      { label: 'Inscritos no mês', value: alunos.filter(a => { const d = parseFlexibleDate(a.data_matricula); return d ? d.getMonth() === ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'].indexOf(mesFinanceiro) && d.getFullYear() === anoFinanceiro : false; }).length, suffix: '', color: '#3584e4', icon: <UserPlus size={100} /> },
                    ].map(card => (
                      <div key={card.label} className="p-4 border nl-border rounded-[6px] nl-bg-input flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">{card.icon}</div>
                        <span className="text-[10px] font-extrabold nl-text-muted uppercase tracking-wider mb-1.5 relative z-10">{card.label}</span>
                        <span className="text-[24px] font-black leading-none relative z-10" style={{ color: card.color }}>
                          {card.value}{card.suffix && <> <span className="text-[12px]" style={{ opacity: 0.7 }}>{card.suffix}</span></>}
                        </span>
                      </div>
                    ))}
                 </div>

                 <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
                    <div className="flex flex-col gap-4 overflow-hidden">
                       <h3 className="text-[12px] font-extrabold nl-text uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle size={15} className="text-red-600" /> Em Cobrança Agora
                       </h3>
                       <div className="border border-[var(--border)] rounded-[3px] overflow-hidden flex flex-col h-full bg-[var(--bg-surface)]">
                          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y border-[var(--border-light)]">
                             {alunosEmDivida.length === 0 ? (
                                <div className="p-12 text-center nl-text-muted text-[13px] font-medium">Nenhum aluno em dívida. Tudo controlado.</div>
                             ) : (
                                alunosEmDivida.map(({ aluno, resumo }, index) => {
                                   const tom = obterTomPastel(index);
                                   return (
                                      <div key={aluno.id} className={`p-3 flex items-center justify-between border-b last:border-b-0 transition-all group ${tom.bg} ${tom.border} hover:-translate-y-[1px]`}>
                                         <div className="flex flex-col gap-0.5">
                                            <span className="text-[13px] font-bold nl-text">{aluno.nome}</span>
                                            <span className="text-[11px] nl-text-muted font-mono">{aluno.telefone}</span>
                                         </div>
                                         <div className="flex flex-col items-end gap-0.5">
                                            <span className="text-[13px] font-extrabold text-red-600">{formatCve(aluno.plano)}</span>
                                            <span className="text-[10px] text-red-600/70 font-bold uppercase tracking-wider">{resumo.statusLabel}</span>
                                         </div>
                                      </div>
                                   )
                                })
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4 overflow-hidden">
                       <h3 className="text-[12px] font-extrabold nl-text uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-green-600" /> Recebidos no Período
                       </h3>
                       <div className="border border-[var(--border)] rounded-[3px] overflow-hidden flex flex-col h-full bg-[var(--bg-surface)]">
                          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y border-[var(--border-light)]">
                             {pagamentosDoPeriodo.length === 0 ? (
                                <div className="p-12 text-center nl-text-muted text-[13px] font-medium">Nenhum pagamento registado.</div>
                             ) : (
                                pagamentosDoPeriodo
                                  .sort((left, right) => (right.id || 0) - (left.id || 0))
                                  .map((p, index) => {
                                   const tom = obterTomPastel(index);
                                   return (
                                   <div key={`${p.id}-${index}`} className={`p-3 flex items-center justify-between border-b last:border-b-0 transition-all group ${tom.bg} ${tom.border} hover:-translate-y-[1px]`}>
                                      <div className="flex flex-col gap-0.5">
                                         <span className="text-[13px] font-bold nl-text">{p.nome}</span>
                                         <div className="flex items-center gap-2">
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-green-500/10 text-green-600 font-bold uppercase tracking-wider">{p?.metodo_pagamento}</span>
                                            <span className="text-[10px] nl-text-muted font-mono">{p?.data_pagamento}</span>
                                         </div>
                                         {p?.referencia_inicio && p?.referencia_fim && (
                                           <span className="text-[10px] nl-text-muted">cobre {p.referencia_inicio} ate {p.referencia_fim}</span>
                                         )}
                                      </div>
                                      <span className="text-[13px] font-extrabold text-green-600">{formatCve(p?.valor)}</span>
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
          <div ref={notificacoesRef} className="fixed top-16 right-6 w-[400px] bg-[var(--bg-surface)] shadow-2xl rounded-[3px] border border-[var(--border)] z-[500] overflow-hidden flex flex-col animate-slide-up" style={{ maxHeight: 'calc(100vh - 80px)' }}>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4 animate-fade-in" onClick={() => setMostrarSobreDoc(false)}>
          <div className="bg-[var(--bg-surface)] w-full max-w-[520px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>

            <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
              <div className="flex-1 flex items-center gap-2.5 px-4">
                <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                  <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
              </div>
              <div className="flex-1 text-center whitespace-nowrap">
                <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Sobre a Aplicação</h2>
              </div>
              <div className="flex-1 flex justify-end px-3">
                <button onClick={() => setMostrarSobreDoc(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-light)]">
                <div className="w-12 h-12 rounded-[var(--radius-control)] bg-[var(--color-secondary-lighter)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <img src={appLogo || APP_ICON_PATH} className="w-8 h-8 object-contain" alt="NEXTLevel" />
                </div>
                <div>
                  <p className="text-[16px] font-black nl-text tracking-tight leading-none">NEXTLevel</p>
                  <p className="text-[11px] nl-text-muted mt-1">Sistema de Gestão de Academias · v1.0 Beta</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Versão', value: '1.0.0 Beta' },
                  { label: 'Plataforma', value: 'macOS · Windows · Desktop' },
                  { label: 'Base de Dados', value: 'SQLite · Offline · Local' },
                  { label: 'Licença', value: licencaDados.tipo ? `${licencaDados.tipo} · ${licencaDados.expiracao || 'Vitalícia'}` : 'Não activada' },
                  { label: 'Ano', value: String(new Date().getFullYear()) },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-[6px] bg-[var(--color-secondary-lighter)]/30 border border-[var(--border-light)]">
                    <span className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">{item.label}</span>
                    <span className="text-[12px] font-bold nl-text text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between px-3 py-3 rounded-[6px] bg-gradient-to-r from-slate-50 to-white border border-[var(--border-light)]">
                <div className="flex items-center gap-3">
                  <img src={NEXT_LAB_ICON} className="w-6 h-6 object-contain opacity-50" alt="NEXT Lab" />
                  <div>
                    <p className="text-[12px] font-bold nl-text leading-none">NEXT Lab</p>
                    <p className="text-[10px] nl-text-muted mt-0.5">Creative Studio · desde 1995</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold nl-text">{COMPANY_AUTHOR}</p>
                  <p className="text-[10px] nl-text-muted">{COMPANY_EMAIL}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-between shrink-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">© {new Date().getFullYear()} NEXT Lab</p>
              <div className="flex gap-3">
                <button onClick={() => setMostrarSobreDoc(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Fechar</button>
                <button onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)} className="nl-btn !h-9 !px-5 !text-[11px] font-bold !bg-slate-800 !text-white hover:!bg-slate-900">
                  <Globe size={14} /> linktr.ee/next.lab
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* Modal: Novo Utilizador */}
      {mostrarFormNovoUtilizador && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-fade-in" onClick={() => setMostrarFormNovoUtilizador(false)}>
           <div className="bg-[var(--bg-surface)] w-full max-w-[460px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                    <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
                </div>
                <div className="flex-1 text-center whitespace-nowrap">
                  <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Novo Utilizador</h2>
                </div>
                <div className="flex-1 flex justify-end px-3">
                  <button onClick={() => setMostrarFormNovoUtilizador(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Nome Completo</label>
                    <input type="text" value={novoUtilizadorForm.name} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, name: e.target.value})} className="nl-input w-full h-10 px-3 text-[13px]" placeholder="Ex: João Silva" required />
                 </div>
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Email</label>
                    <input type="email" value={novoUtilizadorForm.email} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, email: e.target.value})} className="nl-input w-full h-10 px-3 text-[13px]" placeholder="contacto@exemplo.com" required />
                 </div>
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Função</label>
                    <select value={novoUtilizadorForm.role} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, role: e.target.value})} className="nl-input w-full h-10 px-3 text-[13px] cursor-pointer">
                       <option value="operational">Operacional (Sem Ajustes)</option>
                       <option value="admin">Administrador (Total)</option>
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Palavra-passe</label>
                    <input type="password" value={novoUtilizadorForm.password} onChange={e => setNovoUtilizadorForm({...novoUtilizadorForm, password: e.target.value})} className="nl-input w-full h-10 px-3 text-[13px]" placeholder="Mínimo 6 caracteres" required />
                 </div>
              </div>
              <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                 <button onClick={() => setMostrarFormNovoUtilizador(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Cancelar</button>
                 <button onClick={async () => {
                    if (!electron || !novoUtilizadorForm.name || !novoUtilizadorForm.email || novoUtilizadorForm.password.length < 6) return alert('Preencha todos os campos e palavra-passe com mínimo de 6 caracteres.');
                    const res = await electron.ipcRenderer.invoke('users:create', novoUtilizadorForm);
                    if (!res?.success) return alert(res?.message || 'Erro ao criar utilizador.');
                    showToast('Utilizador criado com sucesso!');
                    setMostrarFormNovoUtilizador(false);
                    setNovoUtilizadorForm({ name: '', email: '', role: 'operational', password: '' });
                    const listRes = await electron.ipcRenderer.invoke('users:list');
                    if (listRes?.success) setListaUtilizadores(listRes.users || []);
                 }} className="nl-btn !h-9 !px-6 !text-[11px] font-bold nl-btn-primary">
                    <UserPlus size={14} /> Criar Conta
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal: Editar Utilizador + Actividade */}
      {utilizadorEmEdicao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-fade-in" onClick={() => setUtilizadorEmEdicao(null)}>
          <div className="bg-[var(--bg-surface)] w-full max-w-[720px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
            <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
              <div className="flex-1 flex items-center gap-2.5 px-4">
                {(() => {
                  const avatar = utilizadorAvatares[String(utilizadorEmEdicao.id)];
                  return (
                    <div className="h-6 w-6 rounded-md overflow-hidden flex items-center justify-center font-bold text-[9px] border border-white/40 shadow-sm"
                         style={{ background: avatar ? 'transparent' : `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 88%)`, color: `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 35%)` }}>
                      {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : utilizadorEmEdicao.name.slice(0,2).toUpperCase()}
                    </div>
                  );
                })()}
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{utilizadorEmEdicao.name}</span>
              </div>
              <div className="flex-1 text-center whitespace-nowrap">
                <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Editar Utilizador</h2>
              </div>
              <div className="flex-1 flex justify-end px-3">
                <button onClick={() => setUtilizadorEmEdicao(null)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
              <div className="w-[300px] shrink-0 border-r border-[var(--border)] p-5 space-y-4 overflow-y-auto custom-scrollbar">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Perfil</p>

                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="w-14 h-14 rounded-[var(--radius-control)] overflow-hidden flex items-center justify-center font-bold text-[16px] border border-[var(--border)]"
                         style={{ background: utilizadorAvatares[String(utilizadorEmEdicao.id)] ? 'transparent' : `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 88%)`, color: `hsl(${(utilizadorEmEdicao.name.charCodeAt(0) * 37) % 360}, 60%, 35%)` }}>
                      {utilizadorAvatares[String(utilizadorEmEdicao.id)]
                        ? <img src={utilizadorAvatares[String(utilizadorEmEdicao.id)]} className="w-full h-full object-cover" />
                        : utilizadorEmEdicao.name.slice(0,2).toUpperCase()}
                    </div>
                    <label className="absolute inset-0 bg-black/50 rounded-[var(--radius-control)] flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                      <Camera size={14} className="text-white" />
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
                  <div className="text-[10px] nl-text-muted leading-relaxed">
                    <p className="font-bold nl-text mb-0.5">Foto de perfil</p>
                    <p>Passe o rato para alterar</p>
                    {utilizadorAvatares[String(utilizadorEmEdicao.id)] && (
                      <button type="button" onClick={() => {
                        const updated = { ...utilizadorAvatares };
                        delete updated[String(utilizadorEmEdicao.id)];
                        setUtilizadorAvatares(updated);
                        localStorage.setItem('nl_user_avatares', JSON.stringify(updated));
                      }} className="text-red-500 hover:underline mt-1 block text-[10px]">Remover foto</button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Nome</label>
                  <input type="text" value={utilizadorEdicaoForm.name} onChange={e => setUtilizadorEdicaoForm(f => ({...f, name: e.target.value}))} className="nl-input w-full h-10 px-3 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Função</label>
                  <select value={utilizadorEdicaoForm.role} onChange={e => setUtilizadorEdicaoForm(f => ({...f, role: e.target.value}))} className="nl-input w-full h-10 px-3 text-[13px] cursor-pointer">
                    <option value="operational">Operacional</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 rounded-[6px] bg-[var(--color-secondary-lighter)]/40 border border-[var(--border-light)]">
                  <div>
                    <p className="text-[11px] font-bold nl-text">Conta activa</p>
                    <p className="text-[9px] nl-text-muted">Acesso ao sistema</p>
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
                }} className="nl-btn nl-btn-primary w-full h-10 text-[12px] font-bold"><Save size={14} /> Guardar alterações</button>

                <div className="border-t border-[var(--border-light)] pt-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Palavra-passe</p>
                  <input type="password" value={utilizadorEdicaoForm.novaSenha} onChange={e => setUtilizadorEdicaoForm(f => ({...f, novaSenha: e.target.value}))} placeholder="Nova palavra-passe..." className="nl-input w-full h-10 px-3 text-[13px]" />
                  <button type="button" onClick={async () => {
                    if (!electron || utilizadorEdicaoForm.novaSenha.length < 6) return showToast('Mínimo 6 caracteres.');
                    const res = await electron.ipcRenderer.invoke('users:set-password', { id: utilizadorEmEdicao.id, password: utilizadorEdicaoForm.novaSenha });
                    if (!res?.success) return showToast('Erro: ' + (res?.message || ''));
                    showToast('Palavra-passe alterada.');
                    setUtilizadorEdicaoForm(f => ({...f, novaSenha: ''}));
                  }} className="nl-btn nl-btn-secondary w-full h-9 text-[11px] font-bold">Alterar palavra-passe</button>
                </div>
              </div>

              {/* Right: Activity log */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--color-secondary-lighter)]/30 flex items-center justify-between shrink-0">
                  <p className="text-[10px] font-bold nl-text-muted uppercase tracking-wider">Histórico de Actividade</p>
                  <span className="text-[9px] nl-text-muted">{logs.filter(l => l.user_name === utilizadorEmEdicao.name).length} acções</span>
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
                        <div key={log.id} className="flex items-start gap-2.5 p-2.5 rounded-[5px] hover:bg-[var(--color-secondary-lighter)]/30 transition-colors">
                          <div className={`w-6 h-6 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold nl-text">{log.acao}</p>
                            {log.detalhes && <p className="text-[10px] nl-text-muted mt-0.5 line-clamp-2">{log.detalhes}</p>}
                          </div>
                          <span className="text-[9px] nl-text-muted shrink-0 tabular-nums whitespace-nowrap">{log.data_hora}</span>
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

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL DE PERFIL DO ALUNO — Painel Unificado com Abas
          Abas: [ Perfil ] [ Histórico ] [ Cobrar ]
      ═══════════════════════════════════════════════════════════════════════ */}
      {mostrarPerfilModal && alunoPerfil && (() => {
        const nomePerfil = getAlunoNomeSeguro(alunoPerfil);
        const primeiroNomePerfil = nomePerfil.split(' ')[0] || 'Aluno';
        const resumoPerfil = getStudentStatusForMonth(alunoPerfil, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia);
        const pagamentosAlunoPerfil = pagamentos
          .filter(p => (p.alunoId || p.aluno_id) === alunoPerfil.id)
          .sort((a, b) => (b.id || 0) - (a.id || 0));
        const avatarBg = getAvatarColorByName(nomePerfil);
        const valorMensalidade = normalizeAmount(alunoPerfil.plano) || 0;
        const totalNotasPerfil = notasResumo?.[alunoPerfil.id]?.total || 0;
        const temNotasPerfil = totalNotasPerfil > 0;

        // Dados para a aba Cobrar (preview de cobertura)
        const perfilPreview = alunoPerfil
          ? buildCoverageWindow(
              formatPtDate(parseDate(pagamentoForm.dataPagamento)),
              alunoPerfil.vencimento
            )
          : null;
        const perfilResumoCobranca = getStudentStatusForMonth(alunoPerfil, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia);

        // WhatsApp para recibo inline
        const whatsappNumPerfil = (alunoPerfil.telefone || '').replace(/\D/g, '');
        const valorWhatsappPerfil = perfilUltimoPagamentoInfo?.valor
          ? formatCve(normalizeAmount(perfilUltimoPagamentoInfo.valor))
          : formatCve(normalizeAmount(alunoPerfil.plano));
        const mesWhatsappPerfil = perfilUltimoPagamentoInfo?.mes || '';
        const whatsappMsgPerfil = encodeURIComponent(
          `Olá ${primeiroNomePerfil}! 👋\nO seu pagamento de *${valorWhatsappPerfil}*${mesWhatsappPerfil ? ` referente a *${mesWhatsappPerfil}*` : ''} foi registado com sucesso.\n\nObrigado por continuar connosco! 💪`
        );
        const whatsappUrlPerfil = `https://wa.me/${whatsappNumPerfil}?text=${whatsappMsgPerfil}`;

        const fecharPerfilModal = () => {
          setMostrarPerfilModal(false);
          setMostrarHistoricoPerfil(false);
          setEditandoPerfil(false);
          setPerfilEditForm({});
          setCol1Minimizada(false);
          setCol2Minimizada(false);
          setPerfilAba('perfil');
          setPerfilPagamentoSucesso(false);
          setPerfilUltimoPagamentoInfo(null);
          setPagamentoForm({ valor: '', dataPagamento: formatInputDate(), metodo: DEFAULT_PAYMENT_METHOD });
        };

        const iniciarEdicao = () => {
          setEditandoPerfil(true);
          setPerfilEditForm({
            nome: nomePerfil,
            telefone: alunoPerfil.telefone,
            email: alunoPerfil.email || '',
            sexo: alunoPerfil.sexo || '',
            data_nascimento: alunoPerfil.data_nascimento || '',
            morada: alunoPerfil.morada || '',
            categoria: alunoPerfil.categoria || '',
            plano: alunoPerfil.plano,
          });
        };

        const salvarEdicao = async () => {
          if (!(window as any).electron) return;
          const alunoAtualizado = { ...alunoPerfil, ...perfilEditForm };
          await (window as any).electron.ipcRenderer.invoke('update-aluno-dados', alunoAtualizado);
          sincronizarAlunoAtualizado(alunoAtualizado as Aluno);
          await carregarConfiguracoes();
          setEditandoPerfil(false);
          adicionarNotificacao('Dados Atualizados', `Perfil de ${getAlunoNomeSeguro(alunoAtualizado)} salvo com sucesso.`, 'sucesso');
        };

        // Registrar pagamento direto do perfil (aba Cobrar)
        const registrarPagamentoPerfil = async () => {
          if (!alunoPerfil) return;
          const valForm = pagamentoForm.valor || String(valorMensalidade);
          if (!valForm || normalizeAmount(valForm) <= 0) {
            showToast('❌ Valor inválido. Insira um valor maior que zero.');
            return;
          }
          if (!pagamentoForm.dataPagamento) {
            showToast('❌ Data de pagamento é obrigatória.');
            return;
          }
          try {
            const selectedMonthName = mesAtualNome;
            const targetMonthIndex = MONTH_OPTIONS.indexOf(selectedMonthName);
            const targetYear = anoAtual;
            const dueDay = (() => {
              const date = parseFlexibleDate(alunoPerfil.vencimento) || parseFlexibleDate(alunoPerfil.data_matricula) || new Date();
              return date.getDate();
            })();
            const targetDueDate = new Date(targetYear, targetMonthIndex, dueDay);
            const targetDueDateStr = formatPtDate(targetDueDate);
            const dataPagamento = formatPtDate(parseDate(pagamentoForm.dataPagamento));
            const janelaCobranca = buildCoverageWindow(dataPagamento, targetDueDateStr);
            const valorPagamento = String(normalizeAmount(valForm) || normalizeAmount(alunoPerfil.plano) || 1000);

            const novoPagamento: Pagamento = {
              alunoId: alunoPerfil.id,
              valor: valorPagamento,
              status: 'pago',
              data_pagamento: dataPagamento,
              metodo_pagamento: pagamentoForm.metodo,
              mes_referencia: `${selectedMonthName.charAt(0).toUpperCase() + selectedMonthName.slice(1)} ${targetYear}`,
              referencia_inicio: janelaCobranca.coverageStart,
              referencia_fim: janelaCobranca.coverageEnd,
            };

            if (electron) {
              await registrarPagamentoAtomico(novoPagamento, janelaCobranca.nextChargeDate);
              adicionarNotificacao('Pagamento Registado', `Pagamento de ${nomePerfil} (${novoPagamento.mes_referencia}) foi registado com sucesso.`, 'sucesso');
              await notificarSistema(nomeAcademia, `Pagamento de ${nomePerfil} registado com sucesso.`);

              setPerfilUltimoPagamentoInfo({ valor: valorPagamento, mes: novoPagamento.mes_referencia });
              setPerfilPagamentoSucesso(true);
              if (alunoSelecionado?.id === alunoPerfil.id) {
                carregarHistorico(alunoPerfil.id);
              }
              await carregarConfiguracoes();
              setTimeout(() => { fecharPerfilModal(); }, 2000); // Fecha automaticamente após o sucesso
            }
          } catch (error) {
            console.error('Erro ao registar pagamento:', error);
            showToast('❌ Erro ao registar pagamento no sistema.');
          }
        };

        const statusColorsPerfil = (() => {
          const s = alunoPerfil.status || 'ativo';
          if (s === 'ativo') return 'bg-green-50 text-green-700 border-green-200';
          if (s === 'pausado') return 'bg-amber-50 text-amber-700 border-amber-200';
          return 'bg-red-50 text-red-700 border-red-200';
        })();

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[210] p-4 animate-fade-in" onClick={fecharPerfilModal}>
            <div className="bg-[var(--bg-surface)] w-full max-w-[480px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-black text-white overflow-hidden shrink-0 ${avatarBg}`}>
                    {alunoPerfil.foto_path
                      ? <img src={`local-resource://${alunoPerfil.foto_path}`} className="w-full h-full object-cover" />
                      : getAlunoIniciais(alunoPerfil)}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none truncate max-w-[100px]">{nomePerfil}</span>
                </div>
                <div className="flex-1 text-center whitespace-nowrap">
                  <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Perfil do Aluno</h2>
                </div>
                <div className="flex-1 flex justify-end px-3">
                  <button onClick={fecharPerfilModal} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {perfilPagamentoSucesso ? (
                <div className="px-5 py-10 text-center space-y-5 bg-gradient-to-b from-emerald-50/50 to-white">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200 flex items-center justify-center mx-auto animate-scale-in">
                    <CheckCircle2 size={40} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black text-emerald-700">Pagamento Registado!</h3>
                    <p className="text-[14px] text-emerald-600/80 font-semibold mt-1">
                      {formatCve(normalizeAmount(perfilUltimoPagamentoInfo?.valor || alunoPerfil.plano))} · {nomePerfil}
                    </p>
                  </div>
                  {whatsappNumPerfil && (
                    <button
                      type="button"
                      onClick={() => electron?.ipcRenderer.invoke('open-external', whatsappUrlPerfil)}
                      className="inline-flex items-center gap-2 h-10 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white rounded-[var(--radius-control)] text-[12px] font-black shadow-lg shadow-emerald-200 transition-all"
                    >
                      <Send size={15} /> Enviar Recibo via WhatsApp
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="px-5 pt-3 space-y-3 overflow-y-auto custom-scrollbar">
                    {/* Info do Aluno */}
                    <div className="flex items-center gap-3 rounded-[10px] border-2 border-[var(--border-light)] bg-gradient-to-br from-[var(--color-secondary-lighter)]/40 to-white p-3.5 shadow-sm">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black text-white overflow-hidden shadow-md ring-2 ring-white/60 shrink-0 ${avatarBg}`}>
                        {alunoPerfil.foto_path
                          ? <img src={`local-resource://${alunoPerfil.foto_path}`} className="w-full h-full object-cover" />
                          : getAlunoIniciais(alunoPerfil)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-black nl-text truncate leading-tight">{nomePerfil}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${statusColorsPerfil}`}>
                            {alunoPerfil.status || 'ativo'}
                          </span>
                          <span className="text-[10px] nl-text-muted">· {alunoPerfil.categoria || 'Geral'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 bg-white/60 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border-light)]">
                        <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Plano</p>
                        <p className="text-[15px] font-black text-[var(--color-primary)] tabular-nums leading-tight">{formatCve(valorMensalidade)}</p>
                      </div>
                    </div>

                    {/* Histórico Accordion */}
                    <div className="rounded-[var(--radius-control)] border border-[var(--border-light)] overflow-hidden">
                      <button
                        onClick={() => setMostrarHistoricoPerfil(!mostrarHistoricoPerfil)}
                        className="w-full px-4 py-2.5 flex items-center justify-between bg-[var(--color-secondary-lighter)]/30 hover:bg-[var(--color-secondary-lighter)]/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <History size={13} className="nl-text-muted" />
                          <span className="text-[10px] font-bold nl-text-muted uppercase tracking-[0.1em]">
                            {mostrarHistoricoPerfil ? "Ocultar Histórico" : `Ver Histórico (${pagamentosAlunoPerfil.length})`}
                          </span>
                        </div>
                        {mostrarHistoricoPerfil ? <ChevronUp size={13} className="nl-text-muted" /> : <ChevronDown size={13} className="nl-text-muted" />}
                      </button>

                      {mostrarHistoricoPerfil && (
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/20">
                          {pagamentosAlunoPerfil.length === 0 ? (
                            <p className="text-[11px] nl-text-muted text-center py-6">Sem pagamentos registados.</p>
                          ) : (
                            <div className="p-3 space-y-2">
                              {pagamentosAlunoPerfil.map((pag) => (
                                <div key={pag.id} className="flex items-center justify-between bg-white border border-[var(--border-light)] rounded-[6px] p-2.5">
                                  <div>
                                    <p className="text-[11px] font-bold nl-text capitalize">{pag.mes_referencia}</p>
                                    <p className="text-[9px] nl-text-muted">{pag.data_pagamento} • {pag.metodo_pagamento}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[12px] font-black nl-text tabular-nums">{formatCve(pag.valor)}</p>
                                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded uppercase">{pag.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Separador */}
                    <div style={{ borderTop: '1px dashed var(--border-light)', margin: '0 4px' }} />

                    {/* Valor a Registar */}
                    <div className="space-y-3 pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Registar Pagamento</p>
                        <button
                          type="button"
                          onClick={() => abrirNotasRapidas(alunoPerfil)}
                          className={`relative flex h-9 items-center gap-2 rounded-[var(--radius-compact)] border px-3 text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
                            temNotasPerfil
                              ? 'border-amber-400 bg-amber-300 text-amber-950 shadow-sm hover:bg-amber-200'
                              : 'border-slate-200 bg-slate-100 text-slate-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                          title={temNotasPerfil ? `${totalNotasPerfil} nota(s) deste aluno` : 'Adicionar nota antes de cobrar'}
                        >
                          <StickyNote size={14} />
                          Notas
                          {temNotasPerfil && (
                            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white/80 px-1 text-[9px] font-black text-amber-900">
                              {totalNotasPerfil}
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[var(--text-secondary)] z-10">$</span>
                        <input
                          type="text"
                          value={pagamentoForm.valor}
                          onChange={e => setPagamentoForm(prev => ({ ...prev, valor: e.target.value }))}
                          className="nl-input w-full h-12 pl-7 pr-3 text-[18px] font-black tracking-tight"
                          placeholder={String(valorMensalidade)}
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        />
                      </div>
                      {pagamentoForm.valor && normalizeAmount(pagamentoForm.valor) !== valorMensalidade && (
                        <button onClick={() => setPagamentoForm(prev => ({ ...prev, valor: '' }))} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors">
                          Repor valor original ({formatCve(valorMensalidade)})
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Mês atual</label>
                          <select
                            value={mesAtualNome}
                            disabled
                            className="nl-input w-full h-10 px-3 text-[13px] cursor-not-allowed capitalize !bg-emerald-50 !border-emerald-200 !text-emerald-700 !font-bold"
                          >
                            <option value={mesAtualNome}>{mesAtualNome.charAt(0).toUpperCase() + mesAtualNome.slice(1)} {anoAtual}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Data</label>
                          <input
                            type="date"
                            value={pagamentoForm.dataPagamento}
                            onChange={e => setPagamentoForm(prev => ({ ...prev, dataPagamento: e.target.value }))}
                            className="nl-input w-full h-10 px-3 text-[13px]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200/50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Wallet size={15} className="text-white" />
                          </div>
                          <span className="text-[12px] font-black text-white uppercase tracking-[0.12em]">Total a registar</span>
                        </div>
                        <span className="text-[20px] font-black text-white drop-shadow-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatCve(normalizeAmount(pagamentoForm.valor || String(valorMensalidade)))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-between gap-3 shrink-0">
                    <button onClick={fecharPerfilModal} className="nl-btn nl-btn-ghost !h-9 !px-4 !text-[11px] font-bold">Cancelar</button>
                    <div className="flex items-center gap-2">
                      {editandoPerfil && (
                        <button onClick={salvarEdicao} className="nl-btn !h-9 !px-5 !text-[11px] font-bold nl-btn-primary"><Save size={14} /> Guardar</button>
                      )}
                      <button onClick={iniciarEdicao} className="nl-btn nl-btn-secondary !h-9 !px-4 !text-[11px] font-bold"><Edit size={14} /> Editar</button>
                      <button onClick={registrarPagamentoPerfil} className="nl-btn !h-10 !px-7 !text-[12px] font-black !bg-gradient-to-r !from-emerald-600 !to-emerald-500 !text-white !border-none !shadow-lg !shadow-emerald-200/50 hover:!shadow-emerald-300/60 hover:!scale-[1.02] active:!scale-[0.98] transition-all">
                        <CheckCircle2 size={16} /> Cobrar
                      </button>
                    </div>
                  </div>
                </>
              )}
              </div>
          </div>
        );
      })()}

      {/* Modal: notas rápidas */}
      {alunoNotasRapidas && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-[220] p-4 animate-fade-in" onClick={() => setAlunoNotasRapidas(null)}>
          <div
            className="w-full max-w-[440px] overflow-hidden rounded-[4px] border border-amber-300 bg-[#FFF7C7] shadow-[0_24px_70px_rgba(0,0,0,0.28)] animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-300/70 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-amber-300 text-amber-950 shadow-sm">
                  <StickyNote size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Notas do aluno</p>
                  <h3 className="truncate text-[18px] font-black leading-tight text-amber-950">{getAlunoNomeSeguro(alunoNotasRapidas)}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlunoNotasRapidas(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-amber-800/60 transition-colors hover:bg-amber-200 hover:text-amber-950"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novaNotaRapida}
                  onChange={(event) => setNovaNotaRapida(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && adicionarNotaRapida()}
                  placeholder="Escrever nota rápida..."
                  className="h-10 flex-1 rounded-[4px] border border-amber-300 bg-white/70 px-3 text-[13px] text-amber-950 outline-none placeholder:text-amber-700/45 focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={adicionarNotaRapida}
                  className="h-10 rounded-[4px] bg-amber-500 px-4 text-[11px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-amber-600"
                >
                  Adicionar
                </button>
              </div>

              <div className="mt-4 max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {notasRapidas.length === 0 ? (
                  <div className="rounded-[4px] border border-dashed border-amber-300 bg-white/30 px-4 py-8 text-center">
                    <p className="text-[13px] font-bold text-amber-800/65">Este aluno ainda não tem notas.</p>
                  </div>
                ) : notasRapidas.map((nota) => (
                  <div key={nota.id} className="group relative rounded-[4px] border border-amber-300/70 bg-white/45 p-3">
                    <p className="pr-7 text-[13px] leading-relaxed text-amber-950">{nota.texto}</p>
                    <p className="mt-2 text-[10px] font-semibold text-amber-700/65">{nota.data_criacao}</p>
                    <button
                      type="button"
                      onClick={() => eliminarNotaRapida(nota.id)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded text-amber-700/35 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      title="Apagar nota"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-amber-300/70 bg-amber-100/55 px-5 py-4">
              <span className="text-[11px] font-bold text-amber-800">{notasRapidas.length} nota(s) neste post-it</span>
              <button
                type="button"
                onClick={abrirContactoAPartirNotas}
                className="inline-flex h-9 items-center gap-2 rounded-[4px] bg-amber-900 px-4 text-[11px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-amber-950"
              >
                <BookUser size={14} /> Ver Contacto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pagamento ativo */}
      {pagamentoAtivoInfo && (() => {
        const alunoPago = pagamentoAtivoInfo.aluno;
        const resumoPago = pagamentoAtivoInfo.resumo || {};
        const nomePago = getAlunoNomeSeguro(alunoPago);
        const ultimoPagamento = resumoPago.lastPaymentDate || 'Registado';
        const proximaCobranca = resumoPago.nextChargeDate || alunoPago.vencimento || 'Sem data definida';
        const cobertura = resumoPago.coverageStart && resumoPago.coverageEnd
          ? `${resumoPago.coverageStart} até ${resumoPago.coverageEnd}`
          : 'Cobertura ativa';

        const reverPagamentoAtivo = () => {
          setPagamentoAtivoInfo(null);
          marcarComoPago(alunoPago.id);
        };

        return (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-[210] p-4 animate-fade-in" onClick={() => setPagamentoAtivoInfo(null)}>
            <div className="w-full max-w-[460px] overflow-hidden rounded-[var(--radius-control)] border border-emerald-200 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.28)] animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/30">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/75">Pagamento ativo</p>
                      <h3 className="mt-0.5 text-[18px] font-black leading-tight">{nomePago}</h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPagamentoAtivoInfo(null)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-white/75 transition-colors hover:bg-white/15 hover:text-white"
                    title="Fechar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="rounded-[var(--radius-control)] border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[13px] font-bold leading-relaxed text-emerald-800">
                    Este aluno está em dia. A cobrança normal só deve voltar a acontecer em <span className="font-black">{proximaCobranca}</span>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[var(--radius-compact)] border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Cobertura</p>
                    <p className="mt-1 truncate text-[12px] font-bold text-slate-700">{cobertura}</p>
                  </div>
                  <div className="rounded-[var(--radius-compact)] border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Último pagamento</p>
                    <p className="mt-1 truncate text-[12px] font-bold text-slate-700">{ultimoPagamento}</p>
                  </div>
                </div>

                <div className="rounded-[var(--radius-control)] border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-[11px] font-semibold leading-relaxed text-blue-800">
                    Se houver algum erro no valor, mês ou registo, use Rever para abrir a cobrança normal e lançar uma correção.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
                <button type="button" onClick={() => setPagamentoAtivoInfo(null)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={reverPagamentoAtivo}
                  className="nl-btn !h-10 !px-6 !text-[12px] font-black !bg-gradient-to-r !from-blue-600 !to-blue-500 !text-white !border-none !shadow-lg !shadow-blue-500/10 hover:!scale-[1.02] active:!scale-[0.98] transition-all"
                >
                  <Pencil size={15} /> Rever e Corrigir
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Minimalista de Cobrança Rápida */}
      {mostrarCobrancaRapida && alunoParaCobrancaRapida && (() => {
        const nomeCobranca = getAlunoNomeSeguro(alunoParaCobrancaRapida);
        const primeiroNomeCobranca = nomeCobranca.split(' ')[0] || 'Aluno';
        const valorOriginal = normalizeAmount(alunoParaCobrancaRapida.plano) || 0;
        const valorCobranca = pagamentoForm.valor || String(valorOriginal);
        const mesCobranca = pagamentoForm.mesReferencia || mesAtualNome;
        
        const whatsappNum = (alunoParaCobrancaRapida.telefone || '').replace(/\D/g, '');
        const valorWhatsapp = cobrancaUltimoPagamentoInfo?.valor
          ? formatCve(normalizeAmount(cobrancaUltimoPagamentoInfo.valor))
          : formatCve(normalizeAmount(valorCobranca));
        const mesWhatsapp = cobrancaUltimoPagamentoInfo?.mes || '';
        const whatsappMsg = encodeURIComponent(
          `Olá ${primeiroNomeCobranca}! 👋\nO seu pagamento de *${valorWhatsapp}*${mesWhatsapp ? ` referente a *${mesWhatsapp}*` : ''} foi registado com sucesso.\n\nObrigado por continuar connosco! 💪`
        );
        const whatsappUrl = `https://wa.me/${whatsappNum}?text=${whatsappMsg}`;

        const fecharCobrancaRapida = () => {
          setMostrarCobrancaRapida(false);
          setAlunoParaCobrancaRapida(null);
          setCobrancaPagamentoSucesso(false);
          setCobrancaUltimoPagamentoInfo(null);
          setPagamentoForm({ valor: '', dataPagamento: formatInputDate(), metodo: DEFAULT_PAYMENT_METHOD });
        };

        const registrarCobrancaRapida = async () => {
          if (!valorCobranca || normalizeAmount(valorCobranca) <= 0) {
            showToast('❌ Valor inválido. Insira um valor maior que zero.');
            return;
          }
          if (!pagamentoForm.dataPagamento) {
            showToast('❌ Data de pagamento é obrigatória.');
            return;
          }
          try {
            const selectedMonthName = mesAtualNome;
            const targetMonthIndex = MONTH_OPTIONS.indexOf(selectedMonthName);
            const targetYear = anoAtual;
            const dueDay = (() => {
              const date = parseFlexibleDate(alunoParaCobrancaRapida.vencimento) || parseFlexibleDate(alunoParaCobrancaRapida.data_matricula) || new Date();
              return date.getDate();
            })();
            const targetDueDate = new Date(targetYear, targetMonthIndex, dueDay);
            const targetDueDateStr = formatPtDate(targetDueDate);
            const dataPagamento = formatPtDate(parseDate(pagamentoForm.dataPagamento));
            const janelaCobranca = buildCoverageWindow(dataPagamento, targetDueDateStr);
            const valorPagamento = String(normalizeAmount(valorCobranca));

            const novoPagamento: Pagamento = {
              alunoId: alunoParaCobrancaRapida.id,
              valor: valorPagamento,
              status: 'pago',
              data_pagamento: dataPagamento,
              metodo_pagamento: pagamentoForm.metodo,
              mes_referencia: `${selectedMonthName.charAt(0).toUpperCase() + selectedMonthName.slice(1)} ${targetYear}`,
              referencia_inicio: janelaCobranca.coverageStart,
              referencia_fim: janelaCobranca.coverageEnd,
            };

            if (electron) {
              await registrarPagamentoAtomico(novoPagamento, janelaCobranca.nextChargeDate);
              adicionarNotificacao('Pagamento Registado', `Pagamento de ${nomeCobranca} (${novoPagamento.mes_referencia}) foi registado com sucesso.`, 'sucesso');
              await notificarSistema(nomeAcademia, `Pagamento de ${nomeCobranca} registado com sucesso.`);

              setCobrancaUltimoPagamentoInfo({ valor: valorPagamento, mes: novoPagamento.mes_referencia });
              setCobrancaPagamentoSucesso(true);
              if (alunoSelecionado?.id === alunoParaCobrancaRapida.id) {
                carregarHistorico(alunoParaCobrancaRapida.id);
              }
              await carregarConfiguracoes();
            }
          } catch (error) {
            console.error('Erro ao registar pagamento rápido:', error);
            showToast('❌ Erro ao registar pagamento no sistema.');
          }
        };

        const avatarBg = getAvatarColorByName(nomeCobranca);
        const pagamentosAlunoCobranca = pagamentos
          .filter(p => (p.alunoId || p.aluno_id) === alunoParaCobrancaRapida.id)
          .sort((a, b) => (b.id || 0) - (a.id || 0));
        const totalNotasCobranca = notasResumo?.[alunoParaCobrancaRapida.id]?.total || 0;
        const temNotasCobranca = totalNotasCobranca > 0;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[200] p-4 animate-fade-in" onClick={fecharCobrancaRapida}>
            <div className="bg-[var(--bg-surface)] w-full max-w-[560px] shadow-[0_28px_90px_rgba(0,0,0,0.36)] rounded-[var(--radius-control)] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 32px)' }} onClick={e => e.stopPropagation()}>
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-14 flex items-center shrink-0">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <div className="h-8 w-8 rounded-md bg-white/65 backdrop-blur-sm p-1.5 border border-white/50 shadow-sm flex items-center justify-center">
                    <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
                </div>
                <div className="flex-1 text-center whitespace-nowrap">
                  <h2 className="text-[13px] font-black text-slate-700 uppercase tracking-wider leading-none">Registar Pagamento</h2>
                </div>
                <div className="flex-1 flex justify-end px-3">
                  <button onClick={fecharCobrancaRapida} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {cobrancaPagamentoSucesso ? (
                <div className="px-5 py-10 text-center space-y-5 bg-gradient-to-b from-emerald-50/50 to-white">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200 flex items-center justify-center mx-auto animate-scale-in">
                    <CheckCircle2 size={40} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black text-emerald-700">Pagamento Registado!</h3>
                    <p className="text-[14px] text-emerald-600/80 font-semibold mt-1">
                      {formatCve(normalizeAmount(cobrancaUltimoPagamentoInfo?.valor || valorCobranca))} · {nomeCobranca}
                    </p>
                  </div>
                  {whatsappNum && (
                    <button
                      type="button"
                      onClick={() => electron?.ipcRenderer.invoke('open-external', whatsappUrl)}
                      className="inline-flex items-center gap-2 h-10 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white rounded-[var(--radius-control)] text-[12px] font-black shadow-lg shadow-emerald-200 transition-all"
                    >
                      <Send size={15} /> Enviar Recibo via WhatsApp
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-y-auto custom-scrollbar">
                    <section className="px-6 py-5 border-b border-[var(--border-light)]">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[var(--text-secondary)]">Aluno</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">Cobrança rápida</span>
                      </div>

                      <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black text-white overflow-hidden shadow-sm ring-2 ring-white/70 ${avatarBg} shrink-0`}>
                        {alunoParaCobrancaRapida.foto_path
                          ? <img src={`local-resource://${alunoParaCobrancaRapida.foto_path}`} className="w-full h-full object-cover" />
                          : getAlunoIniciais(alunoParaCobrancaRapida)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[16px] font-black nl-text truncate leading-tight">{nomeCobranca}</p>
                        <p className="text-[11px] nl-text-muted truncate flex items-center gap-1.5 mt-0.5">
                          <Phone size={10} className="shrink-0 opacity-60" />
                          {alunoParaCobrancaRapida.telefone || 'Sem contacto'}
                          <span className="opacity-30">·</span>
                          {alunoParaCobrancaRapida.categoria || 'Geral'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => abrirNotasRapidas(alunoParaCobrancaRapida)}
                        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] border transition-all ${
                          temNotasCobranca
                            ? 'border-amber-400 bg-amber-300 text-amber-950 shadow-sm hover:bg-amber-200 hover:shadow-md'
                            : 'border-slate-200 bg-white/70 text-slate-300 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                        title={temNotasCobranca ? `${totalNotasCobranca} nota(s) deste aluno` : 'Adicionar nota antes de registar pagamento'}
                      >
                        <StickyNote size={16} />
                        {temNotasCobranca && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[9px] font-black text-white shadow-sm">
                            {totalNotasCobranca}
                          </span>
                        )}
                      </button>
                      <div className="text-right shrink-0 bg-slate-50 px-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--border-light)]">
                        <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Plano</p>
                        <p className="text-[16px] font-black text-[var(--color-primary)] tabular-nums leading-tight">{formatCve(valorOriginal)}</p>
                      </div>
                    </div>
                    </section>

                    {pagamentosAlunoCobranca.length > 0 && (
                      <div className="mx-6 mt-4 rounded-[var(--radius-control)] border border-[#D9E2F2] bg-slate-50 px-3 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <History size={13} className="text-slate-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">Último pagamento</span>
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-600 truncate max-w-[210px]">
                          {pagamentosAlunoCobranca[0].mes_referencia || pagamentosAlunoCobranca[0].data_pagamento || 'Registado'}
                        </span>
                      </div>
                    )}

                    <section className="px-6 py-5 border-b border-[var(--border-light)]">
                      <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-[var(--text-secondary)]">Valor recebido</p>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-black text-slate-400">CVE</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={pagamentoForm.valor}
                          onChange={e => setPagamentoForm(prev => ({ ...prev, valor: e.target.value }))}
                          className="nl-input w-full h-14 pl-14 pr-4 text-[26px] font-black tracking-tight !rounded-[var(--radius-control)] !bg-white text-slate-900 focus:!border-emerald-500 focus:!ring-4 focus:!ring-emerald-100"
                          placeholder={String(valorOriginal)}
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        />
                      </div>
                    </section>

                    <section className="grid grid-cols-2 gap-3 px-6 py-5 border-b border-[var(--border-light)]">
                      <div>
                        <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Mês atual</label>
                        <select
                          value={mesAtualNome}
                          disabled
                          className="nl-input w-full h-10 px-3 text-[13px] cursor-not-allowed capitalize !bg-slate-50 !border-slate-200 !text-slate-600 !font-bold"
                        >
                          <option value={mesAtualNome}>{mesAtualNome.charAt(0).toUpperCase() + mesAtualNome.slice(1)} {anoAtual}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Data</label>
                        <input
                          type="date"
                          value={pagamentoForm.dataPagamento}
                          onChange={e => setPagamentoForm(prev => ({ ...prev, dataPagamento: e.target.value }))}
                          className="nl-input w-full h-10 px-3 text-[13px]"
                        />
                      </div>
                    </section>

                    <section className="px-6 py-5 border-b border-[var(--border-light)]">
                      <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Método</label>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHOD_OPTIONS.map((method, idx) => {
                          const selected = pagamentoForm.metodo === method.label;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPagamentoForm(prev => ({ ...prev, metodo: method.label }))}
                              className={`h-11 rounded-[var(--radius-control)] border px-2 text-[11px] font-black transition-all ${
                                selected
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                  : 'border-[var(--border-light)] bg-white text-[var(--text-secondary)] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              {method.label}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="px-6 py-5">
                    <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-emerald-600 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                          <Wallet size={15} className="text-white" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-white/80 uppercase tracking-[0.14em]">Total a registar</span>
                          <span className="block text-[10px] font-semibold text-white/70">{pagamentoForm.metodo} · {mesAtualNome} {anoAtual}</span>
                        </div>
                      </div>
                      <span className="text-[22px] font-black text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatCve(normalizeAmount(valorCobranca))}
                      </span>
                    </div>
                    </section>
                  </div>

                  <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                      <button type="button" onClick={fecharCobrancaRapida} className="nl-btn nl-btn-secondary !h-10 !px-5 !text-[11px] font-bold">Cancelar</button>
                      <button type="button" onClick={registrarCobrancaRapida} className="nl-btn !h-11 !px-8 !text-[12px] font-black !bg-emerald-600 !text-white !border-none !shadow-sm hover:!bg-emerald-700 active:!scale-[0.98] transition-all">
                      <CheckCircle2 size={16} /> Confirmar Pagamento
                      </button>
                  </div>
                </>
              )}
              </div>
          </div>
        );
      })()}

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up nl-alert nl-alert-success shadow-[0_8px_30px_rgba(9,30,66,0.14)]" style={{ minWidth: 260, maxWidth: 380 }}>
          <div className="nl-alert-icon"><CheckCircle2 size={15} /></div>
          <p className="nl-alert-title">{toast.message}</p>
        </div>
      )}
    </div>
  );
}

export default App;
