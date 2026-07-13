import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import GestaoPage from './components/GestaoPage';
import RelatoriosPage from './components/RelatoriosPage';
import ContactosPage from './components/ContactosPage';
import ConfiguracoesPage from './components/ConfiguracoesPage';
import type { Aluno, DirectoryFilterStatus, FinanceQuickFilter, Nota, NotaRecente, NotaResumo, Notificacao, Pagamento, PaymentFormState, StudentSortMode } from './types/app';

const RootPanel = lazy(() => import('./RootPanel'));
const ImportarDadosModal = lazy(() => import('./ImportarDadosModal'));
import { loadAutoTable, loadJsPDF, loadXLSX } from './lib/lazyLoaders';
import { isBlockedStatus, isImportedStatus, isOperationallyActive, isPausedStatus } from './lib/studentStatus';
import { useConnectivity } from './hooks/useConnectivity';
import { useBackupReminder } from './hooks/useBackupReminder';
import { useMonthlyReportReminder } from './hooks/useMonthlyReportReminder';
import { useFinancialSummaries } from './hooks/useFinancialSummaries';
import { useTimelineMonths } from './hooks/useTimelineMonths';
import { sortStudents } from './utils/studentSorting';
import { calculateDueStatus } from './lib/dueStatus';
import { useStudentList } from './hooks/useStudentList';
import { useDirectoryStudents } from './hooks/useDirectoryStudents';
import { useToast } from './hooks/useToast';
import { useNotifications } from './hooks/useNotifications';
import { useListLayout } from './hooks/useListLayout';
import { useCurrentTime } from './hooks/useCurrentTime';
import { isValidEmail, isValidPhone } from './utils/validation';
import { useCategories } from './hooks/useCategories';
import { usePaymentHistory } from './hooks/usePaymentHistory';
import { useAppRefresh } from './hooks/useAppRefresh';
import { useConfirmDialog } from './hooks/useConfirmDialog';
import { useSystemNotification } from './hooks/useSystemNotification';
import { useLoginPreferences } from './hooks/useLoginPreferences';
import { useAutoSlideshow } from './hooks/useAutoSlideshow';
import { useUnpaidAlert } from './hooks/useUnpaidAlert';
import { buildMonthlyPayment } from './lib/paymentBuilder';
import ConfirmDialogModal from './components/ConfirmDialogModal';
import ToastNotification from './components/ToastNotification';
import QuickPaymentModal from './components/QuickPaymentModal';
import StudentFormModal from './components/StudentFormModal';
import StudentProfileModal from './components/StudentProfileModal';
import StudentNotesModal from './components/StudentNotesModal';

import MonthlyReportModal from './components/MonthlyReportModal';
import NotificationsPanel from './components/NotificationsPanel';
import WelcomeStudentModal from './components/WelcomeStudentModal';
import WelcomeMonthModal from './components/WelcomeMonthModal';
import ExportReportModal, { type ExportFormat, type ExportScope, type ExportSort, type ExportReportOptions } from './components/ExportReportModal';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import ResolvePendingModal from './components/ResolvePendingModal';
import DuplicateStudentsModal from './components/DuplicateStudentsModal';
import AboutAppModal from './components/AboutAppModal';
import LegacyStudentProfileModal from './components/LegacyStudentProfileModal';
import StudentContextMenu from './components/StudentContextMenu';
import AppStatusBar from './components/AppStatusBar';
import LoginPage from './components/LoginPage';
import InitialSetupPage from './components/InitialSetupPage';
import LicenseBlockedPage from './components/LicenseBlockedPage';
import SplashScreen from './components/SplashScreen';
import { useSetupState } from './hooks/useSetupState';
import { useSetupController } from './hooks/useSetupController';
import { registerPaymentAtomically } from './services/paymentRegistration';
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
  getAlunoIniciais, getAlunoNomeSeguro, getAvatarColorByName, isNewStudent,
} from './utils/formatting';




// ─── Design System — Adwaita/GNOME: Light · Dark · Claude · Híbrido ──
// Palette ref: https://developer.gnome.org/hig/reference/palette.html
// Chrome vars (--chrome-*): header + barra de estado. No hybrid, chrome=escuro e corpo=claro.
type AppThemeId = 'light' | 'dark' | 'claude' | 'hybrid';

const CHROME_LIGHT = {
  '--chrome-bg':           '#fafafa',
  '--chrome-surface':      '#f6f5f4',
  '--chrome-border':       '#deddda',
  '--chrome-text':         '#241f31',
  '--chrome-text-muted':   '#77767b',
  '--chrome-text-sub':     '#5e5c64',
};
const CHROME_DARK = {
  '--chrome-bg':           '#241f31',
  '--chrome-surface':      '#2d2a35',
  '--chrome-border':       'rgba(255,255,255,0.12)',
  '--chrome-text':         '#f6f5f4',
  '--chrome-text-muted':   '#9a9996',
  '--chrome-text-sub':     '#c0bfbc',
};

const themeVars: Record<AppThemeId, Record<string, string>> = {
  light: {
    '--color-primary':           '#3584e4', // GNOME Blue 3
    '--color-primary-hover':     '#1c71d8', // Blue 4
    '--color-primary-light':     '#eaf2fc',
    '--color-secondary':         '#5e5c64', // Dark 2
    '--color-secondary-light':   '#f6f5f4', // Light 2
    '--color-secondary-lighter': '#ededec',
    '--color-success':           '#26a269', // Green 5
    '--color-error':             '#e01b24', // Red 3
    '--color-warning':           '#e5a50a', // Yellow 5
    '--color-info':              '#1c71d8',
    '--color-bg-primary':        '#ffffff',
    '--color-bg-secondary':      '#f6f5f4',
    '--color-bg-tertiary':       '#ededec',
    '--color-text-primary':      '#241f31', // Dark 4
    '--color-text-secondary':    '#5e5c64',
    '--color-text-tertiary':     '#77767b', // Dark 1
    '--color-border':            '#deddda', // Light 3
    '--color-border-light':      '#e8e7e5',
    '--bg-app':                  '#f6f5f4',
    '--bg-surface':              '#ffffff',
    '--bg-header':               '#fafafa',
    '--bg-input':                '#ffffff',
    '--text-primary':            '#241f31',
    '--text-secondary':          '#5e5c64',
    '--text-tertiary':           '#77767b',
    '--border':                  '#deddda',
    '--border-light':            '#e8e7e5',
    // Adwaita favors borders over heavy drop-shadows
    '--shadow-xs':               '0 1px 1px rgba(0,0,0,0.04)',
    '--shadow-sm':               '0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    '--shadow-md':               '0 2px 6px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
    '--shadow-lg':               '0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)',
    '--shadow-xl':               '0 12px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)',
    '--shadow-primary':          'rgba(53,132,228,0.28)',
    '--shadow-primary-focus':    'rgba(53,132,228,0.22)',
    '--modal-overlay':           'rgba(15, 23, 42, 0.34)',
    '--modal-overlay-blur':      '7px',
    '--radius-sm':               '6px',
    '--radius-md':               '9px',
    '--radius-lg':               '12px',
    '--font-size-xs':            '11px',
    '--font-size-sm':            '12px',
    '--font-size-base':          '14px',
    '--font-size-lg':            '15px',
    '--font-size-xl':            '17px',
    '--font-size-2xl':           '20px',
    '--font-size-3xl':           '24px',
    '--spacing-xs':              '4px',
    '--spacing-sm':              '8px',
    '--spacing-md':              '12px',
    '--spacing-lg':              '16px',
    '--spacing-xl':              '20px',
    '--spacing-2xl':             '24px',
    '--rp0': '#ffffff', '--rp0h': '#f6f5f4',
    '--rp1': '#fafafa', '--rp1h': '#f0efed',
    '--rp2': '#ffffff', '--rp2h': '#f6f5f4',
    '--rp3': '#fafafa', '--rp3h': '#f0efed',
    '--rp4': '#ffffff', '--rp4h': '#f6f5f4',
    '--rp5': '#fafafa', '--rp5h': '#f0efed',
    ...CHROME_LIGHT,
  },
  dark: {
    '--color-primary':           '#62a0ea', // Blue 2
    '--color-primary-hover':     '#99c1f1', // Blue 1
    '--color-primary-light':     '#1a2f4a',
    '--color-secondary':         '#c0bfbc',
    '--color-secondary-light':   '#2d2a35',
    '--color-secondary-lighter': '#3d3846', // Dark 3
    '--color-success':           '#33d17a',
    '--color-error':             '#ed333b',
    '--color-warning':           '#f8e45c',
    '--color-info':              '#62a0ea',
    '--color-bg-primary':        '#2a2433',
    '--color-bg-secondary':      '#241f31',
    '--color-bg-tertiary':       '#3d3846',
    '--color-text-primary':      '#f6f5f4',
    '--color-text-secondary':    '#c0bfbc',
    '--color-text-tertiary':     '#9a9996',
    '--color-border':            'rgba(255,255,255,0.12)',
    '--color-border-light':      'rgba(255,255,255,0.08)',
    '--bg-app':                  '#1e1a24',
    '--bg-surface':              '#2a2433',
    '--bg-header':               '#241f31',
    '--bg-input':                '#322c3c',
    '--text-primary':            '#f6f5f4',
    '--text-secondary':          '#c0bfbc',
    '--text-tertiary':           '#9a9996',
    '--border':                  'rgba(255,255,255,0.12)',
    '--border-light':            'rgba(255,255,255,0.08)',
    '--shadow-xs':               '0 1px 1px rgba(0,0,0,0.28)',
    '--shadow-sm':               '0 1px 3px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.24)',
    '--shadow-md':               '0 3px 10px rgba(0,0,0,0.36), 0 0 0 1px rgba(0,0,0,0.24)',
    '--shadow-lg':               '0 8px 24px rgba(0,0,0,0.40), 0 0 0 1px rgba(0,0,0,0.24)',
    '--shadow-xl':               '0 16px 40px rgba(0,0,0,0.48), 0 0 0 1px rgba(0,0,0,0.28)',
    '--shadow-primary':          'rgba(98,160,234,0.30)',
    '--shadow-primary-focus':    'rgba(98,160,234,0.22)',
    '--modal-overlay':           'rgba(0, 0, 0, 0.48)',
    '--modal-overlay-blur':      '8px',
    '--radius-sm':               '6px',
    '--radius-md':               '9px',
    '--radius-lg':               '12px',
    '--font-size-xs':            '11px',
    '--font-size-sm':            '12px',
    '--font-size-base':          '14px',
    '--font-size-lg':            '15px',
    '--font-size-xl':            '17px',
    '--font-size-2xl':           '20px',
    '--font-size-3xl':           '24px',
    '--spacing-xs':              '4px',
    '--spacing-sm':              '8px',
    '--spacing-md':              '12px',
    '--spacing-lg':              '16px',
    '--spacing-xl':              '20px',
    '--spacing-2xl':             '24px',
    '--rp0': '#2a2433', '--rp0h': '#322c3c',
    '--rp1': '#261f30', '--rp1h': '#30293a',
    '--rp2': '#2a2433', '--rp2h': '#322c3c',
    '--rp3': '#261f30', '--rp3h': '#30293a',
    '--rp4': '#2a2433', '--rp4h': '#322c3c',
    '--rp5': '#261f30', '--rp5h': '#30293a',
    ...CHROME_DARK,
  },

  // Claude — mesma geometria Adwaita, paleta quente
  claude: {
    '--color-primary':           '#c6613f',
    '--color-primary-hover':     '#a84e30',
    '--color-primary-light':     '#f7ebe6',
    '--color-secondary':         '#6b5f52',
    '--color-secondary-light':   '#f2ede6',
    '--color-secondary-lighter': '#eae2d9',
    '--color-success':           '#26a269',
    '--color-error':             '#c01c28',
    '--color-warning':           '#e5a50a',
    '--color-info':              '#3584e4',
    '--color-bg-primary':        '#faf7f3',
    '--color-bg-secondary':      '#f2ede6',
    '--color-bg-tertiary':       '#eae2d9',
    '--color-text-primary':      '#241f1a',
    '--color-text-secondary':    '#6b5f52',
    '--color-text-tertiary':     '#9c8a7a',
    '--color-border':            '#ddd4c8',
    '--color-border-light':      '#eae2d9',
    '--bg-app':                  '#f0ebe4',
    '--bg-surface':              '#faf7f3',
    '--bg-header':               '#f5f0e9',
    '--bg-input':                '#faf7f3',
    '--text-primary':            '#241f1a',
    '--text-secondary':          '#6b5f52',
    '--text-tertiary':           '#9c8a7a',
    '--border':                  '#ddd4c8',
    '--border-light':            '#eae2d9',
    '--shadow-xs':               '0 1px 1px rgba(60,30,10,0.04)',
    '--shadow-sm':               '0 1px 2px rgba(60,30,10,0.06), 0 0 0 1px rgba(60,30,10,0.04)',
    '--shadow-md':               '0 2px 6px rgba(60,30,10,0.08), 0 0 0 1px rgba(60,30,10,0.05)',
    '--shadow-lg':               '0 4px 16px rgba(60,30,10,0.10), 0 0 0 1px rgba(60,30,10,0.05)',
    '--shadow-xl':               '0 12px 32px rgba(60,30,10,0.14), 0 0 0 1px rgba(60,30,10,0.06)',
    '--shadow-primary':          'rgba(198,97,63,0.26)',
    '--shadow-primary-focus':    'rgba(198,97,63,0.18)',
    '--modal-overlay':           'rgba(36, 31, 26, 0.36)',
    '--modal-overlay-blur':      '7px',
    '--radius-sm':               '6px',
    '--radius-md':               '9px',
    '--radius-lg':               '12px',
    '--font-size-xs':            '11px',
    '--font-size-sm':            '12px',
    '--font-size-base':          '14px',
    '--font-size-lg':            '15px',
    '--font-size-xl':            '17px',
    '--font-size-2xl':           '20px',
    '--font-size-3xl':           '24px',
    '--spacing-xs':              '4px',
    '--spacing-sm':              '8px',
    '--spacing-md':              '12px',
    '--spacing-lg':              '16px',
    '--spacing-xl':              '20px',
    '--spacing-2xl':             '24px',
    '--rp0': '#faf7f3', '--rp0h': '#f2ede6',
    '--rp1': '#f7f3ee', '--rp1h': '#efe9e1',
    '--rp2': '#faf7f3', '--rp2h': '#f2ede6',
    '--rp3': '#f7f3ee', '--rp3h': '#efe9e1',
    '--rp4': '#faf7f3', '--rp4h': '#f2ede6',
    '--rp5': '#f7f3ee', '--rp5h': '#efe9e1',
    '--chrome-bg':               '#f5f0e9',
    '--chrome-surface':          '#f2ede6',
    '--chrome-border':           '#ddd4c8',
    '--chrome-text':             '#241f1a',
    '--chrome-text-muted':       '#9c8a7a',
    '--chrome-text-sub':         '#6b5f52',
  },

  // Híbrido — corpo claro (leitura) + chrome escuro (header / estado)
  hybrid: {
    '--color-primary':           '#3584e4',
    '--color-primary-hover':     '#1c71d8',
    '--color-primary-light':     '#eaf2fc',
    '--color-secondary':         '#5e5c64',
    '--color-secondary-light':   '#f6f5f4',
    '--color-secondary-lighter': '#ededec',
    '--color-success':           '#26a269',
    '--color-error':             '#e01b24',
    '--color-warning':           '#e5a50a',
    '--color-info':              '#1c71d8',
    '--color-bg-primary':        '#ffffff',
    '--color-bg-secondary':      '#f6f5f4',
    '--color-bg-tertiary':       '#ededec',
    '--color-text-primary':      '#241f31',
    '--color-text-secondary':    '#5e5c64',
    '--color-text-tertiary':     '#77767b',
    '--color-border':            '#deddda',
    '--color-border-light':      '#e8e7e5',
    '--bg-app':                  '#f0eef2',
    '--bg-surface':              '#ffffff',
    '--bg-header':               '#241f31',
    '--bg-input':                '#ffffff',
    '--text-primary':            '#241f31',
    '--text-secondary':          '#5e5c64',
    '--text-tertiary':           '#77767b',
    '--border':                  '#deddda',
    '--border-light':            '#e8e7e5',
    '--shadow-xs':               '0 1px 1px rgba(0,0,0,0.04)',
    '--shadow-sm':               '0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    '--shadow-md':               '0 2px 6px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
    '--shadow-lg':               '0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)',
    '--shadow-xl':               '0 12px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)',
    '--shadow-primary':          'rgba(53,132,228,0.28)',
    '--shadow-primary-focus':    'rgba(53,132,228,0.22)',
    '--modal-overlay':           'rgba(15, 23, 42, 0.34)',
    '--modal-overlay-blur':      '7px',
    '--radius-sm':               '6px',
    '--radius-md':               '9px',
    '--radius-lg':               '12px',
    '--font-size-xs':            '11px',
    '--font-size-sm':            '12px',
    '--font-size-base':          '14px',
    '--font-size-lg':            '15px',
    '--font-size-xl':            '17px',
    '--font-size-2xl':           '20px',
    '--font-size-3xl':           '24px',
    '--spacing-xs':              '4px',
    '--spacing-sm':              '8px',
    '--spacing-md':              '12px',
    '--spacing-lg':              '16px',
    '--spacing-xl':              '20px',
    '--spacing-2xl':             '24px',
    '--rp0': '#ffffff', '--rp0h': '#f6f5f4',
    '--rp1': '#fafafa', '--rp1h': '#f0efed',
    '--rp2': '#ffffff', '--rp2h': '#f6f5f4',
    '--rp3': '#fafafa', '--rp3h': '#f0efed',
    '--rp4': '#ffffff', '--rp4h': '#f6f5f4',
    '--rp5': '#fafafa', '--rp5h': '#f0efed',
    ...CHROME_DARK,
  },
};

const GlobalStyles = ({ theme }: { theme: AppThemeId }) => {
  const vars = themeVars[theme] || themeVars.light;
  const cssVars = Object.entries(vars).map(([k,v]) => `${k}:${v};`).join('');

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      :root {
        /* Cantarell-like stack: Inter + system UI (Adwaita feel on Linux/macOS/Windows) */
        --font-ui: 'Inter', 'Cantarell', system-ui, -apple-system, 'Segoe UI', sans-serif;
        --font-list: var(--font-ui);
        font-family: var(--font-ui);
        ${cssVars}
        --accent-primary: var(--color-primary);
        --accent-light: var(--color-primary-light);
        --header-bg: var(--bg-header);
        --transition-fast: 120ms cubic-bezier(0.25, 0.1, 0.25, 1);
        --transition-base: 180ms cubic-bezier(0.25, 0.1, 0.25, 1);
        --transition-slow: 280ms cubic-bezier(0.25, 0.1, 0.25, 1);
        --radius-control: 9px;
        --radius-surface: 12px;
        --radius-compact: 6px;
        --radius-pill: 999px;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.98); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pulseSoft {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.55; }
      }

      .animate-slide-up  { animation: slideUp  0.2s var(--transition-base) both; }
      .animate-fade-in   { animation: fadeIn   0.16s var(--transition-fast) both; }
      .animate-scale-in  { animation: scaleIn  0.16s var(--transition-base) both; }
      .animate-spin      { animation: spin 0.7s linear infinite; }
      .animate-pulse-soft{ animation: pulseSoft 1.8s ease-in-out infinite; }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { height: 100%; }

      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: var(--bg-app);
        color: var(--text-primary);
        line-height: 1.45;
        font-size: var(--font-size-base);
        font-weight: 400;
        overflow: hidden;
        letter-spacing: 0;
      }

      ::selection {
        background: color-mix(in srgb, var(--color-primary) 28%, transparent);
        color: var(--text-primary);
      }

      button, input, select, textarea { font: inherit; }

      :focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
      button:focus:not(:focus-visible),
      a:focus:not(:focus-visible) { outline: none; }

      /* ── Card (Adwaita boxed list / content block) ── */
      .nl-card {
        background: var(--bg-surface);
        border-radius: var(--radius-surface);
        box-shadow: none;
        padding: 18px;
        transition: background-color var(--transition-base), border-color var(--transition-base);
        border: 1px solid var(--border);
      }
      .nl-card:hover {
        border-color: color-mix(in srgb, var(--border) 70%, var(--color-secondary));
      }

      /* ── Relatórios: SEMPRE tema escuro (independente do tema global) ── */
      .nl-reports-page {
        --color-primary: #62a0ea;
        --color-primary-hover: #99c1f1;
        --color-primary-light: #1a2f4a;
        --color-secondary: #c0bfbc;
        --color-secondary-light: #2d2a35;
        --color-secondary-lighter: #3d3846;
        --color-success: #33d17a;
        --color-error: #ed333b;
        --color-warning: #f8e45c;
        --color-info: #62a0ea;
        --bg-app: #1e1a24;
        --bg-surface: #2a2433;
        --bg-header: #241f31;
        --bg-input: #322c3c;
        --text-primary: #f6f5f4;
        --text-secondary: #c0bfbc;
        --text-tertiary: #9a9996;
        --border: rgba(255,255,255,0.12);
        --border-light: rgba(255,255,255,0.08);
        --shadow-xs: 0 1px 1px rgba(0,0,0,0.28);
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.24);
        --shadow-md: 0 3px 10px rgba(0,0,0,0.36), 0 0 0 1px rgba(0,0,0,0.24);
        --shadow-primary: rgba(98,160,234,0.30);
        color: var(--text-primary);
        background: var(--bg-app);
      }
      .nl-reports-page .nl-reports-scroll {
        background: transparent;
      }
      .nl-reports-page .nl-reports-toolbar {
        background: var(--bg-surface);
        border-bottom: 1px solid var(--border);
        box-shadow: var(--shadow-xs);
      }
      .nl-reports-page .nl-reports-kpi {
        background: var(--bg-surface);
        box-shadow: var(--shadow-sm);
        border-color: color-mix(in srgb, var(--border) 80%, transparent);
      }
      .nl-reports-page .nl-reports-kpi:hover {
        box-shadow: var(--shadow-md);
      }
      .nl-reports-page .nl-text { color: var(--text-primary); }
      .nl-reports-page .nl-text-sub { color: var(--text-secondary); }
      .nl-reports-page .nl-text-muted { color: var(--text-tertiary); }
      .nl-reports-page .nl-card {
        background: var(--bg-surface);
        border-color: var(--border);
      }
      .nl-reports-page .nl-input,
      .nl-reports-page .nl-btn-ghost,
      .nl-reports-page .nl-icon-btn {
        color: inherit;
      }

      /* ── Buttons (libadwaita-like) ── */
      .nl-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 34px;
        padding: 0 14px;
        border-radius: var(--radius-control);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
        border: 1px solid transparent;
        outline: none;
        white-space: nowrap;
        letter-spacing: 0;
        user-select: none;
      }
      .nl-btn:active { filter: brightness(0.96); }

      .nl-btn-primary {
        background: var(--color-primary);
        color: #ffffff;
        border-color: color-mix(in srgb, var(--color-primary) 85%, #000);
      }
      .nl-btn-primary:hover {
        background: var(--color-primary-hover);
      }

      .nl-btn-secondary {
        background: var(--color-secondary-light);
        color: var(--text-primary);
        border: 1px solid var(--border);
      }
      .nl-btn-secondary:hover {
        background: var(--color-secondary-lighter);
      }

      .nl-btn-ghost {
        background: transparent;
        color: var(--text-secondary);
      }
      .nl-btn-ghost:hover {
        background: var(--color-secondary-lighter);
        color: var(--text-primary);
      }

      .nl-btn-danger {
        background: transparent;
        color: var(--color-error);
        border-color: transparent;
      }
      .nl-btn-danger:hover {
        background: color-mix(in srgb, var(--color-error) 12%, transparent);
        border-color: color-mix(in srgb, var(--color-error) 28%, transparent);
      }

      .nl-btn-sm {
        height: 28px;
        padding: 0 10px;
        font-size: 12px;
        gap: 4px;
        border-radius: var(--radius-compact);
      }

      .nl-btn-lg {
        height: 40px;
        padding: 0 18px;
        font-size: 14px;
        gap: 8px;
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
      .nl-input::placeholder { color: var(--text-tertiary); opacity: 0.9; }

      /* ── Badges (sentence case, soft Adwaita chips) ── */
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: var(--radius-pill);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0;
        text-transform: none;
        border: 1px solid transparent;
      }
      .badge-success { background: color-mix(in srgb, var(--color-success) 14%, var(--bg-surface)); color: var(--color-success); border-color: color-mix(in srgb, var(--color-success) 28%, transparent); }
      .badge-error   { background: color-mix(in srgb, var(--color-error) 12%, var(--bg-surface)); color: var(--color-error); border-color: color-mix(in srgb, var(--color-error) 28%, transparent); }
      .badge-warning { background: color-mix(in srgb, var(--color-warning) 16%, var(--bg-surface)); color: color-mix(in srgb, var(--color-warning) 70%, #000); border-color: color-mix(in srgb, var(--color-warning) 35%, transparent); }
      .badge-info    { background: color-mix(in srgb, var(--color-primary) 12%, var(--bg-surface)); color: var(--color-primary); border-color: color-mix(in srgb, var(--color-primary) 28%, transparent); }
      .badge-neutral { background: var(--color-secondary-lighter); color: var(--text-secondary); border-color: var(--border); }
      /* Férias (teal) vs Desistente (violeta) — distintos entre si e da pausa (âmbar) */
      .badge-leave { background: color-mix(in srgb, #14b8a6 16%, var(--bg-surface)); color: #0f766e; border-color: color-mix(in srgb, #0f766e 35%, transparent); }
      .badge-quit  { background: color-mix(in srgb, #8b5cf6 16%, var(--bg-surface)); color: #6d28d9; border-color: color-mix(in srgb, #6d28d9 35%, transparent); }

      /* ── Accent color utilities ── */
      .text-accent-teal   { color: var(--color-accent-teal, #26a269); }
      .text-accent-violet { color: var(--color-accent-violet, #9141ac); }
      .text-accent-rose   { color: var(--color-accent-rose, #e01b24); }
      .text-accent-amber  { color: var(--color-accent-amber, #e5a50a); }
      .bg-accent-teal     { background: var(--color-accent-teal, #26a269); }
      .bg-accent-violet   { background: var(--color-accent-violet, #9141ac); }
      .bg-accent-rose     { background: var(--color-accent-rose, #e01b24); }
      .bg-accent-amber    { background: var(--color-accent-amber, #e5a50a); }
      .border-accent-teal   { border-color: var(--color-accent-teal, #26a269); }
      .border-accent-violet { border-color: var(--color-accent-violet, #9141ac); }
      .border-accent-rose   { border-color: var(--color-accent-rose, #e01b24); }
      .border-accent-amber  { border-color: var(--color-accent-amber, #e5a50a); }

      /* ── Status pill ── */
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 8px;
        border-radius: var(--radius-pill);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0;
        text-transform: none;
      }
      .status-pill::before {
        content: '';
        display: inline-block;
        width: 6px; height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      /* ── Scrollbar (thin, quiet) ── */
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: color-mix(in srgb, var(--border) 80%, var(--color-secondary));
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      ::-webkit-scrollbar-thumb:hover { background: var(--color-secondary); background-clip: content-box; border: 2px solid transparent; }
      .custom-scrollbar::-webkit-scrollbar { width: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-secondary); background-clip: content-box; border: 2px solid transparent; }

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

      /* Header bar — chrome (escuro no tema Híbrido) */
      .nl-glass {
        background: var(--chrome-bg, var(--bg-header));
        border-bottom: 1px solid var(--chrome-border, var(--border));
        box-shadow: none;
        color: var(--chrome-text, var(--text-primary));
      }
      .nl-glass .nl-text { color: var(--chrome-text, var(--text-primary)); }
      .nl-glass .nl-text-sub { color: var(--chrome-text-sub, var(--text-secondary)); }
      .nl-glass .nl-text-muted { color: var(--chrome-text-muted, var(--text-tertiary)); }
      .nl-glass .nl-icon-btn {
        color: var(--chrome-text, var(--text-primary));
        border-color: var(--chrome-border, var(--border));
        background: transparent;
      }
      .nl-glass .nl-icon-btn:hover {
        background: var(--chrome-surface, var(--color-secondary-light));
      }
      .nl-glass .nl-btn-ghost,
      .nl-glass .nl-btn-secondary {
        border-color: var(--chrome-border, var(--border));
        color: var(--chrome-text, var(--text-primary));
        background: var(--chrome-surface, var(--color-secondary-light));
      }
      .nl-glass .nl-btn-ghost:hover,
      .nl-glass .nl-btn-secondary:hover {
        background: color-mix(in srgb, var(--chrome-surface, var(--color-secondary-light)) 80%, var(--chrome-text, #fff) 8%);
      }

      /* Barra de estado — mesmo chrome do header */
      .nl-status-bar {
        background: var(--chrome-bg, var(--bg-header));
        border-top: 1px solid var(--chrome-border, var(--border));
        color: var(--chrome-text-sub, var(--text-secondary));
      }
      .nl-status-bar .nl-text { color: var(--chrome-text, var(--text-primary)); }
      .nl-status-bar .nl-text-sub { color: var(--chrome-text-sub, var(--text-secondary)); }
      .nl-status-bar .nl-text-muted { color: var(--chrome-text-muted, var(--text-tertiary)); }

      /* Fundo translúcido + blur — vê-se o ecrã por trás do popup */
      .nl-modal-overlay {
        background: var(--modal-overlay, rgba(15, 23, 42, 0.34));
        backdrop-filter: blur(var(--modal-overlay-blur, 7px)) saturate(1.05);
        -webkit-backdrop-filter: blur(var(--modal-overlay-blur, 7px)) saturate(1.05);
      }
      .nl-modal {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
      }
      .nl-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--border);
        padding: 14px 18px;
        background: var(--bg-header);
      }
      .nl-modal-body {
        padding: 18px;
      }
      .nl-modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        border-top: 1px solid var(--border);
        padding: 12px 18px;
        background: var(--color-secondary-light);
      }

      .nl-table thead { background: var(--color-secondary-light); }
      .nl-table thead th {
        font-size: 11px;
        font-weight: 600;
        text-transform: none;
        letter-spacing: 0;
        color: var(--text-secondary);
        padding: 9px 12px;
      }
      .nl-table tbody tr { transition: background-color var(--transition-fast); }
      .nl-table tbody tr:hover { background: color-mix(in srgb, var(--color-primary) 6%, var(--bg-surface)); }
      .nl-table td {
        padding: 9px 12px;
        font-size: 13px;
        border-bottom: 1px solid var(--border-light);
      }

      /* ── Unified alert ── */
      .nl-alert { display:flex; align-items:flex-start; gap:10px; padding:10px 14px; border-radius:var(--radius-control); border:1px solid; }
      .nl-alert-icon { width:28px; height:28px; min-width:28px; border-radius:var(--radius-compact); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .nl-alert-success  { background: color-mix(in srgb, var(--color-success) 10%, var(--bg-surface)); border-color: color-mix(in srgb, var(--color-success) 28%, transparent); color: color-mix(in srgb, var(--color-success) 80%, #000); }
      .nl-alert-success  .nl-alert-icon { background: color-mix(in srgb, var(--color-success) 16%, var(--bg-surface)); color: var(--color-success); }
      .nl-alert-warning  { background: color-mix(in srgb, var(--color-warning) 12%, var(--bg-surface)); border-color: color-mix(in srgb, var(--color-warning) 32%, transparent); color: color-mix(in srgb, var(--color-warning) 55%, #000); }
      .nl-alert-warning  .nl-alert-icon { background: color-mix(in srgb, var(--color-warning) 18%, var(--bg-surface)); color: color-mix(in srgb, var(--color-warning) 70%, #000); }
      .nl-alert-error    { background: color-mix(in srgb, var(--color-error) 10%, var(--bg-surface)); border-color: color-mix(in srgb, var(--color-error) 28%, transparent); color: color-mix(in srgb, var(--color-error) 75%, #000); }
      .nl-alert-error    .nl-alert-icon { background: color-mix(in srgb, var(--color-error) 14%, var(--bg-surface)); color: var(--color-error); }
      .nl-alert-info     { background: color-mix(in srgb, var(--color-primary) 10%, var(--bg-surface)); border-color: color-mix(in srgb, var(--color-primary) 28%, transparent); color: color-mix(in srgb, var(--color-primary) 75%, #000); }
      .nl-alert-info     .nl-alert-icon { background: color-mix(in srgb, var(--color-primary) 14%, var(--bg-surface)); color: var(--color-primary); }
      .nl-alert-title    { font-size: 13px; font-weight: 600; line-height: 1.3; }
      .nl-alert-body     { font-size: 12px; opacity: .85; margin-top: 2px; line-height: 1.4; }

      /* ── Row palette — subtle alternating ── */
      tr.rp-0 { background-color: var(--rp0); } tr.rp-0:hover { background-color: var(--rp0h); }
      tr.rp-1 { background-color: var(--rp1); } tr.rp-1:hover { background-color: var(--rp1h); }
      tr.rp-2 { background-color: var(--rp2); } tr.rp-2:hover { background-color: var(--rp2h); }
      tr.rp-3 { background-color: var(--rp3); } tr.rp-3:hover { background-color: var(--rp3h); }
      tr.rp-4 { background-color: var(--rp4); } tr.rp-4:hover { background-color: var(--rp4h); }
      tr.rp-5 { background-color: var(--rp5); } tr.rp-5:hover { background-color: var(--rp5h); }

      /* ── Timeline chip / view-switcher pill ── */
      .nl-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: var(--radius-pill);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0;
        text-transform: none;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-secondary);
        transition: all var(--transition-fast);
      }
      .nl-chip-active {
        background: var(--color-primary);
        color: #ffffff;
        border-color: var(--color-primary);
        box-shadow: none;
      }

      /* ── Action icon buttons ── */
      .nl-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px; height: 34px;
        border-radius: var(--radius-control);
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
        border-color: transparent;
      }
      .nl-icon-btn:active { filter: brightness(0.97); }

      .nl-icon-btn-sm {
        width: 28px; height: 28px;
        border-radius: var(--radius-compact);
      }

      .nl-icon-btn-lg {
        width: 40px; height: 40px;
      }

      .nl-icon-btn-primary {
        color: var(--color-primary);
      }
      .nl-icon-btn-primary:hover {
        background: var(--color-primary-light);
        border-color: transparent;
        color: var(--color-primary);
      }

      .nl-icon-btn-danger {
        color: var(--color-error);
      }
      .nl-icon-btn-danger:hover {
        background: color-mix(in srgb, var(--color-error) 12%, transparent);
        border-color: transparent;
        color: var(--color-error);
      }

      /* View switcher (header nav) */
      .nl-view-switcher {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 3px;
        border-radius: var(--radius-control);
        background: var(--color-secondary-lighter);
        border: 1px solid var(--border-light);
      }
      .nl-view-switcher-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 30px;
        padding: 0 14px;
        border-radius: 7px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
      }
      .nl-view-switcher-btn:hover { color: var(--text-primary); }
      .nl-view-switcher-btn.is-active {
        background: var(--bg-surface);
        color: var(--text-primary);
        box-shadow: var(--shadow-xs);
      }

      /* ── Section label ── */
      .nl-section-label {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0;
        text-transform: none;
        color: var(--text-tertiary);
      }

      /* ── Row hover ── */
      .nl-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        border-radius: var(--radius-compact);
        transition: background-color var(--transition-fast);
        cursor: pointer;
      }
      .nl-row:hover { background: color-mix(in srgb, var(--color-secondary-lighter) 55%, transparent); }

      /* ── Divider ── */
      .nl-divider {
        height: 1px;
        background: var(--border-light);
        margin: 4px 0;
      }

      /* ── Inline code / highlight ── */
      .nl-kbd {
        display: inline-flex;
        align-items: center;
        padding: 1px 6px;
        font-size: 10px;
        font-weight: 600;
        border-radius: 4px;
        background: var(--color-secondary-lighter);
        border: 1px solid var(--border-light);
        color: var(--text-secondary);
      }

      /* ── Pastel accent blocks ── */
      .pastel-blue   { background: #EBF4FF; color: #1D4ED8; border: 1px solid #C7DEFF; }
      .pastel-green  { background: #ECFDF5; color: #15803D; border: 1px solid #BBF7D0; }
      .pastel-amber  { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
      .pastel-red    { background: #FFF1F2; color: #B91C1C; border: 1px solid #FECDD3; }
      .pastel-purple { background: #F5F3FF; color: #7C3AED; border: 1px solid #DDD6FE; }

      /* ── Status dot ── */
      .nl-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        display: inline-block;
      }
      .nl-dot-success { background: #16A34A; }
      .nl-dot-warning { background: #D97706; }
      .nl-dot-error   { background: #DC2626; }
      .nl-dot-info    { background: #2563EB; }
      .nl-dot-neutral { background: var(--text-tertiary); }

      /* ── Empty state ── */
      .nl-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 32px 16px;
        color: var(--text-tertiary);
      }
      .nl-empty-icon {
        opacity: 0.4;
      }
      .nl-empty-text {
        font-size: 12px;
        font-weight: 600;
      }
    ` }} />
  );
};

// Acesso ao Electron (apenas se estivermos a correr no Electron)
const electron = (window as any).electron || null;

// Tema Padrão
const DEFAULT_THEME = '#217346';

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
  const { historicoPagamentos, setHistoricoPagamentos, carregarHistorico } = usePaymentHistory(electron);
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
  const [cobrancaResumo, setCobrancaResumo] = useState<any>(null);

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
  const [resetSeguroForm, setResetSeguroForm] = useState({ password: '', confirmation: '', exportBeforeReset: true });
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
  const [appTheme, setAppTheme] = useState<AppThemeId>(() => {
    const saved = localStorage.getItem('nl_app_theme') || localStorage.getItem('nl_gnome_theme');
    return (saved === 'light' || saved === 'dark' || saved === 'claude' || saved === 'hybrid') ? saved : 'light';
  });
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, alunoId: string } | null>(null);
  const [configAba, setConfigAba] = useState<'geral' | 'operacao' | 'notificacoes' | 'tema' | 'utilizadores' | 'lixeira' | 'ajuda' | 'sobre'>('geral');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregandoLogin, setCarregandoLogin] = useState(false);
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
  const { setupStep, setSetupStep, setupData, setSetupData, setupLicenseInfo, setSetupLicenseInfo, setupError, setSetupError, licencaAtiva, setLicencaAtiva, licencaDados, setLicencaDados, configuracoes, setConfiguracoes, loadingConfig, setLoadingConfig, chaveReativacao, setChaveReativacao, erroReativacao, setErroReativacao } = useSetupState();
  const [mostrarUserMenu, setMostrarUserMenu] = useState(false);
  const [mostrarConfigModal, setMostrarConfigModal] = useState(false);
  const [mostrarSobreDoc, setMostrarSobreDoc] = useState(false);
  const [mesFinanceiro, setMesFinanceiro] = useState(new Date().toLocaleString('pt-PT', { month: 'long' }).toLowerCase());
  const [anoFinanceiro, setAnoFinanceiro] = useState(new Date().getFullYear());
  const [mostrarRelatorioMensal, setMostrarRelatorioMensal] = useState(false);
  const [mostrarExportRelatorio, setMostrarExportRelatorio] = useState(false);
  const [mostrarBoasVindasMes, setMostrarBoasVindasMes] = useState(false);
  const [mesPassadoEditavel, setMesPassadoEditavel] = useState(false);
  const [mesRelatorio, setMesRelatorio] = useState(new Date().toLocaleString('pt-PT', { month: 'long' }).toLowerCase());
  const [anoRelatorio, setAnoRelatorio] = useState(new Date().getFullYear());
  const [mostrarListaMatriculas, setMostrarListaMatriculas] = useState(false);
  const { notificacoes, setNotificacoes, adicionarNotificacao, marcarComoLida, limparNotificacoes, notificacoesNaoLidas } = useNotifications();
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [mostrarDailyReport, setMostrarDailyReport] = useState(false);
  const [mostrarResolverPendencias, setMostrarResolverPendencias] = useState(false);
  const [alunoParaResolver, setAlunoParaResolver] = useState<any>(null);
  const [mesesParaResolver, setMesesParaResolver] = useState<string[]>([]);
  // Boas-vindas pós-matrícula
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);
  const [alunoBoasVindas, setAlunoBoasVindas] = useState<Aluno | null>(null);
  const [msgBoasVindas, setMsgBoasVindas] = useState('');

  // Quick Access — login sem senha
  const { quickAccessUsers, setQuickAccessUsers, slideshowImages, setSlideshowImages, slideshowTimer, setSlideshowTimer, slideshowTextEnabled, setSlideshowTextEnabled, loginSlideshowUsers, setLoginSlideshowUsers } = useLoginPreferences();
  const [quickAccessExpanded, setQuickAccessExpanded] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [mostrarSobreApp, setMostrarSobreApp] = useState(false);
  const agora = useCurrentTime();
  const { confirmDialog, setConfirmDialog, abrirConfirmacao, fecharConfirmacao } = useConfirmDialog();
  const { zoomListaNormalizado, larguraListas, larguraSidebarContactos, estiloTabelaAlunos, estiloHome, obterTomPastel } = useListLayout(zoomLista, appTheme);
  const timelineAnnouncementRef = useRef('');

  // Notificação automática de relatório diário
  useEffect(() => {
    if (!isLoggedIn || !sessionUser) return;
    const autoNotif = localStorage.getItem('nl_daily_report_notif') === '1';
    if (!autoNotif) return;

    const hojeChave = new Date().toDateString();
    const ultimaNotif = localStorage.getItem('nl_daily_report_last_shown');
    if (ultimaNotif === hojeChave) return;

    const horaStr = localStorage.getItem('nl_daily_report_time') || '18:00';
    const [h, m] = horaStr.split(':').map(Number);
    const agora = new Date();
    const minutosDesdeMeiaNoite = agora.getHours() * 60 + agora.getMinutes();
    const horaNotifMinutos = h * 60 + m;

    if (minutosDesdeMeiaNoite >= horaNotifMinutos) {
      localStorage.setItem('nl_daily_report_last_shown', hojeChave);
      adicionarNotificacao(
        'Relatório Diário',
        `O resumo do dia ${agora.toLocaleDateString('pt-PT')} já está disponível. Clique no ícone de atividade para ver.`,
        'info'
      );
    }
  }, [isLoggedIn, sessionUser, adicionarNotificacao]);

  useEffect(() => {
    localStorage.setItem('nl_zoom_lista', String(zoomListaNormalizado));
  }, [zoomListaNormalizado]);



  const { toast, showToast } = useToast();

  const guardarConfiguracao = async (chave: string, valor: string) => {
    if (!electron) return;
    await electron.ipcRenderer.invoke('update-configuracao', chave, valor);
  };

  const notificarSistema = useSystemNotification(electron, desktopNotificationsEnabled);

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
    if (mostrarCobrancaRapida) { setMostrarCobrancaRapida(false); setAlunoParaCobrancaRapida(null); setCobrancaPagamentoSucesso(false); setCobrancaUltimoPagamentoInfo(null); setCobrancaResumo(null); return true; }
    if (mostrarPerfilModal) { setMostrarPerfilModal(false); setMostrarHistoricoPerfil(false); setAlunoPerfil(null); setPerfilPagamentoSucesso(false); return true; }
    if (mostrarRelatorioMensal) { setMostrarRelatorioMensal(false); return true; }
    if (mostrarModalDuplicados) { setMostrarModalDuplicados(false); return true; }
    if (mostrarExportRelatorio) { setMostrarExportRelatorio(false); return true; }
    if (mostrarBoasVindasMes) { setMostrarBoasVindasMes(false); return true; }
    if (mostrarModalExport) { setMostrarModalExport(false); return true; }
    if (mostrarModalPagamento) { setMostrarModalPagamento(false); return true; }
    if (mostrarImportar) { setMostrarImportar(false); return true; }
    return false;
  }, [
    confirmDialog.visible, mostrarCalendarioMeses, mostrarFiltroListaAlunos,
    mostrarUserMenu, mostrarMenuAcoes, contextMenu, mostrarNotificacoes,
    mostrarDropdownRecentes, mostrarSobreDoc, utilizadorEmEdicao,
    mostrarFormNovoUtilizador, mostrarBoasVindas, alunoNotasRapidas,
    mostrarCobrancaRapida, mostrarPerfilModal,
    mostrarRelatorioMensal, mostrarModalDuplicados, mostrarModalExport,
    mostrarExportRelatorio, mostrarBoasVindasMes,
    mostrarModalPagamento, mostrarImportar, fecharConfirmacao,
  ]);

  // Função para calcular progresso, status e cores inteligentes (Inteligência Termométrica)
  const calcularStatusVencimento = calculateDueStatus;

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
  const registrarPagamentoAtomico = (pagamento: Pagamento, nextChargeDate?: string, updateStudentDue = true) =>
    registerPaymentAtomically(electron, pagamento, nextChargeDate, updateStudentDue);

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
    plano: '1000',
    vencimento: '',
    data_matricula: new Date().toISOString().split('T')[0],
    categoria: 'Sem personal trainer',
    modo_cobranca: 'mensalidade_movel',
    modo_inscricao: 'matricula' as 'matricula' | 'matricula_pago',
    dia_pagamento: 1 as 1 | 'ultimo',
    status: 'ativo',
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
  /** Meses passados em leitura por defeito; admin pode desbloquear */
  const periodoBloqueado = periodoSelecionadoPassado && !mesPassadoEditavel;
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

  const resumosFinanceiros = useFinancialSummaries(alunos, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia);

  const timelineMonths = useTimelineMonths(alunos, pagamentos, anoFinanceiro, mesFinanceiro, hojeReferencia);

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

  /** Caixa do dia (pagamentos com data = hoje) — pulso operacional da Início */
  const totalRecebidoHoje = useMemo(() => {
    const hojeLabel = formatPtDate(hojeReferencia);
    return pagamentos.reduce((acc, pagamento) => {
      const d = parseFlexibleDate(pagamento.data_pagamento);
      if (!d || formatPtDate(d) !== hojeLabel) return acc;
      return acc + normalizeAmount(pagamento.valor);
    }, 0);
  }, [pagamentos, hojeReferencia]);

  const cobrancasCriticas = useMemo(() => alunosAtivos.filter(({ resumo }) => ['hoje', 'critico'].includes(resumo.status)).length, [alunosAtivos]);
  const mesAtualOperacional = `${hojeReferencia.getFullYear()}-${String(hojeReferencia.getMonth() + 1).padStart(2, '0')}`;
  const backupMensalPendente = backupReminderEnabled && ultimoBackupMes !== mesAtualOperacional;
  /** Novos alunos (7 dias) — exclui importados; aparecem na Início com ★ */
  const novosInscritosRecentes = useMemo(() => (
    alunos
      .filter((aluno) => isNewStudent(aluno, hojeReferencia, 7))
      .sort((left, right) => {
        const leftDate = parseFlexibleDate(left.data_matricula)?.getTime() || 0;
        const rightDate = parseFlexibleDate(right.data_matricula)?.getTime() || 0;
        return rightDate - leftDate;
      })
      .slice(0, 24)
  ), [alunos, hojeReferencia]);
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

  useUnpaidAlert(alunos.length, alunosEmDivida.length, mesFinanceiro, adicionarNotificacao);

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

  // Ao mudar de mês, volta a bloquear edição de meses passados
  useEffect(() => {
    setMesPassadoEditavel(false);
  }, [periodoSelecionadoKey]);

  // Boas-vindas ao mês actual (uma vez por mês civil, primeiros 5 dias)
  useEffect(() => {
    if (!isLoggedIn || sessionUser?.role === 'operational') return;
    const now = hojeReferencia;
    const key = `nl_welcome_month_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (localStorage.getItem(key)) return;
    if (now.getDate() > 5) return;
    setMostrarBoasVindasMes(true);
  }, [isLoggedIn, sessionUser?.role, hojeReferencia]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (timelineAnnouncementRef.current === periodoSelecionadoKey) return;

    timelineAnnouncementRef.current = periodoSelecionadoKey;

    if (periodoSelecionadoFuturo) {
      showToast(`Historico de ${mesFinanceiro} ${anoFinanceiro} pronto para receber novas matriculas quando o mes chegar.`);
      return;
    }

    if (periodoSelecionadoPassado) {
      showToast(
        `${mesFinanceiro} ${anoFinanceiro} está fechado (leitura). Use Exportar em Relatórios ou desbloqueie a edição se for admin.`,
      );
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
    periodoSelecionadoPassado,
    mesFinanceiro,
    anoFinanceiro,
    resumosHistoricoMensal.length,
    alunosNovosNoPeriodo.length,
    alunosComCobrancaNoPeriodo.length,
    nomeAcademia,
    notificarSistema,
    showToast,
    adicionarNotificacao,
  ]);

  const [alunosDeletados, setAlunosDeletados] = useState<Aluno[]>([]);

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
        // Categorias oficiais fixas (Sem / Com personal trainer) — lista de sistema
        setCategorias(['Sem personal trainer', 'Com personal trainer'] as any);
        if (configs.theme_color) setThemeColor(configs.theme_color);
        if (configs.app_theme && ['light','dark','claude','hybrid'].includes(configs.app_theme)) setAppTheme(configs.app_theme as AppThemeId);
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
        // Splash mínimo — app deve abrir rápido
        setTimeout(() => setLoadingConfig(false), 160);
      }
    }
  // setCategorias é estável; a função é definida abaixo para depender de guardarConfiguracao.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { online, sincronizando, setSincronizando } = useConnectivity(isLoggedIn, carregarConfiguracoes);

  const atualizarAplicacao = useAppRefresh({ electron, reloadData: carregarConfiguracoes, showToast, setSyncing: setSincronizando });


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

  // Notificar main process sobre mudança de role para atualizar menu nativo
  useEffect(() => {
    const electron = (window as any).electron;
    if (electron?.ipcRenderer) {
      electron.ipcRenderer.invoke('menu:update', { role: sessionUser?.role || null });
    }
  }, [sessionUser?.role]);

  useBackupReminder({
    enabled: backupReminderEnabled,
    lastBackupMonth: ultimoBackupMes,
    academyName: nomeAcademia,
    notify: adicionarNotificacao,
    notifySystem: notificarSistema,
  });

  useMonthlyReportReminder({
    enabled: notifRelatorios,
    loggedIn: isLoggedIn,
    setAvailable: setRelatorioMensalDisponivel,
    notify: adicionarNotificacao,
  });

  const salvarConfig = async (chave: string, valor: string) => {
    await guardarConfiguracao(chave, valor);
  };
  const { categorias, setCategorias, novaCategoria, setNovaCategoria, adicionarCategoria, removerCategoria } = useCategories(salvarConfig);


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
        exportBeforeReset: resetSeguroForm.exportBeforeReset !== false,
      });
      if (res?.canceled) {
        showToast('Reset cancelado — guarde o Excel de segurança ou desmarque “Exportar antes”.');
        return;
      }
      if (res.success) {
        const n = res.stats?.alunos ?? 0;
        const p = res.stats?.pagamentos ?? 0;
        showToast(`✅ Base a zero: ${n} alunos e ${p} pagamentos removidos.`);
        if (res.exportPath) {
          showToast(`📄 Cópia Excel: ${res.exportPath}`);
          try { await electron.ipcRenderer.invoke('show-item-in-folder', res.exportPath); } catch { /* ignore */ }
        }
        adicionarNotificacao(
          'Limpeza de Sistema',
          `Dados operacionais apagados${res.exportPath ? ' (com exportação Excel prévia)' : ''}.`,
          'info',
        );
        setResetSeguroForm({ password: '', confirmation: '', exportBeforeReset: true });
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
      const { payment: novoPagamento, coverage: janelaCobranca } = buildMonthlyPayment(alunoParaPagamento, pagamentoForm, mesAtualNome, anoAtual);
      const valorPagamento = novoPagamento.valor;

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

  const gerarRecibo = async (p: Pagamento, alunoNome: string) => {
    const jsPDF = await loadJsPDF();
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
  const avancarSlide = useCallback(() => setCurrentSlide((slide) => (slide + 1) % slideshowImages.length), [slideshowImages.length]);
  useAutoSlideshow(isLoggedIn, slideshowImages.length, slideshowTimer, avancarSlide);

  // Carregar lista de utilizadores para quick access na tela de login
  useEffect(() => {
    if (isLoggedIn || !electron) return;
    const qaIds: number[] = (() => { try { return JSON.parse(localStorage.getItem('nl_quick_access_users') || '[]'); } catch { return []; } })();
    if (qaIds.length === 0) { setLoginSlideshowUsers([]); return; }
    electron.ipcRenderer.invoke('users:list').then((res: any) => {
      if (res?.success) setLoginSlideshowUsers((res.users || []).filter((u: any) => qaIds.includes(u.id) && u.is_active !== 0));
    }).catch(() => {});
  }, [isLoggedIn, setLoginSlideshowUsers]);

  // ─── Matricular aluno com lógica inteligente de pagamentos ──────────────
  const salvarAluno = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!novoAluno.nome.trim()) {
      showToast('❌ Nome do aluno é obrigatório.');
      return;
    }
    if (!isValidPhone(novoAluno.telefone)) {
      showToast('❌ Telefone inválido. Use apenas números.');
      return;
    }
    if (novoAluno.email && !isValidEmail(novoAluno.email)) {
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
        // Não gravar campo temporário de foto no registo
        const { _fotoBase64, ...alunoDb } = alunoParaSalvar as typeof alunoParaSalvar & { _fotoBase64?: string };
        await electron.ipcRenderer.invoke('add-aluno', alunoDb);

        // Foto opcional escolhida no formulário
        if (_fotoBase64) {
          try {
            await electron.ipcRenderer.invoke('upload-foto', { alunoId: id, base64Data: _fotoBase64 });
          } catch (fotoErr) {
            console.warn('Foto não guardada na matrícula:', fotoErr);
          }
        }

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
      dia_pagamento: (aluno as any).dia_pagamento || 1,
      status: aluno.status || 'ativo',
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
    if (!isValidPhone(novoAluno.telefone)) {
      showToast('❌ Telefone inválido. Use apenas números.');
      return;
    }
    if (novoAluno.email && !isValidEmail(novoAluno.email)) {
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
          const tone =
            novoStatus === 'desistente' || isBlockedStatus(novoStatus)
              ? 'alerta'
              : isPausedStatus(novoStatus)
                ? 'alerta'
                : 'info';
          adicionarNotificacao('Alteração de Status', `O aluno ${aluno.nome} agora está ${statusLabel}.`, tone);
        }
        setMenuAlunoAberto(null);
        await carregarConfiguracoes();
        showToast(`Estado actualizado: ${getStudentStatusLabel(novoStatus)}`);
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

  const ordenarAlunosPorModo = useCallback((lista: Aluno[], modo: StudentSortMode) => sortStudents(lista, modo, calcularStatusVencimento), [calcularStatusVencimento]);

  const alunosFiltradosOrdenados = useStudentList(resumosFinanceiros, filtroStatus, pesquisa);

  const alunosDirectorio = useDirectoryStudents(alunosNoPeriodo, filtroDirectorioStatus, pesquisaDirectorio, ordenacaoDirectorio, ordenarAlunosPorModo);

  // Cálculos das Métricas
  const totalAlunos = alunos.length;
  const mensalidadesPendentes = alunosEmDivida.length;
  
  const receitaPrevista = alunos.reduce((acc, a) => {
    if (!isOperationallyActive(a.status)) return acc;
    return acc + normalizeAmount(a.plano);
  }, 0);

  /** Único fluxo de cobrança — sempre o mesmo popup (cartão da barra de dias / atalhos). */
  const abrirCobrancaUnificada = (aluno: Aluno, resumo?: any) => {
    if (!aluno?.id) {
      showToast('❌ Aluno não encontrado para cobrança.');
      return;
    }
    const alunoSeguro = {
      ...aluno,
      nome: getAlunoNomeSeguro(aluno),
      plano: String(aluno.plano || ''),
      telefone: aluno.telefone || '',
      status: aluno.status || 'ativo',
    } as Aluno;
    const resumoFinal =
      resumo ||
      getStudentStatusForMonth(alunoSeguro, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia);
    setAlunoParaCobrancaRapida(alunoSeguro);
    setCobrancaResumo(resumoFinal);
    setCobrancaPagamentoSucesso(false);
    setCobrancaUltimoPagamentoInfo(null);
    // Valor só com dígitos (sem espaços unicode nem "CVE")
    const valorLimpo = String(normalizeAmount(alunoSeguro.plano) || 0).replace(/[^\d]/g, '');
    setPagamentoForm({
      valor: valorLimpo === '0' ? '' : valorLimpo,
      dataPagamento: formatInputDate(),
      metodo: DEFAULT_PAYMENT_METHOD,
      mesReferencia: mesAtualNome,
    });
    setMostrarCobrancaRapida(true);
  };

  const marcarComoPago = (alunoId: string) => {
    const aluno = alunos.find((a) => a.id === alunoId);
    if (aluno) abrirCobrancaUnificada(aluno);
    else showToast('❌ Aluno não encontrado para cobrança.');
  };

  const abrirAcaoPagamentoDaLista = (aluno: Aluno, resumo: any) => {
    if (periodoBloqueado) {
      showToast('Mês fechado em leitura. Em Relatórios pode exportar, ou desbloqueie a edição (admin).');
      return;
    }
    if (!aluno) return;
    abrirCobrancaUnificada(aluno, resumo);
  };



  const exportarPDF = async () => {
    const [jsPDF, autoTable] = await Promise.all([loadJsPDF(), loadAutoTable()]);
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
      const XLSX = await loadXLSX();
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
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

  const handleExportarExcelContactos = async () => {
    const XLSX = await loadXLSX();
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos_CRM');
    XLSX.writeFile(workbook, `CRM-Export-${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportarFinancasExcel = async () => {
    const XLSX = await loadXLSX();
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

  const exportarExcel = async () => {
    const XLSX = await loadXLSX();
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista_Alunos');
    if (exportConfig.incluirCabecalho) {
      const headerRows = [
        [nomeAcademia.toUpperCase()],
        [`Morada: ${moradaAcademia}`],
        [`Telefone: ${telefoneAcademia} | Email: ${emailAcademia}`],
        [''],
      ];
      XLSX.utils.sheet_add_aoa(worksheet, headerRows, { origin: 'A1' });
    }
    XLSX.writeFile(workbook, `${nomeAcademia.replace(/\s+/g, '_')}_Export.xlsx`);
    setMostrarModalExport(false);
  };

  const isResumoEmDivida = (status?: string) => status === 'atrasado' || status === 'hoje';
  const isResumoPago = (status?: string) => status === 'pago';

  const filtrarResumosExport = (
    resumos: { aluno: Aluno; resumo: ReturnType<typeof getStudentStatusForMonth>; pagamentoPeriodo?: Pagamento }[],
    scope: ExportScope,
  ) => {
    if (scope === 'pagos') return resumos.filter(({ resumo }) => isResumoPago(resumo.status));
    if (scope === 'dividas') return resumos.filter(({ resumo }) => isResumoEmDivida(resumo.status));
    if (scope === 'pendentes') {
      return resumos.filter(({ aluno, resumo }) => {
        if (!isOperationallyActive(aluno.status)) return false;
        return !isResumoPago(resumo.status);
      });
    }
    return resumos;
  };

  const ordenarResumosExport = <T extends { aluno: Aluno; resumo: ReturnType<typeof getStudentStatusForMonth> }>(
    resumos: T[],
    sort: ExportSort,
  ): T[] => {
    const rank = (status?: string) => {
      if (isResumoPago(status)) return 0;
      if (isResumoEmDivida(status)) return 1;
      return 2;
    };
    const byName = (a: T, b: T) => getAlunoNomeSeguro(a.aluno).localeCompare(getAlunoNomeSeguro(b.aluno), 'pt-PT');
    const list = [...resumos];
    if (sort === 'pagos') {
      return list.sort((a, b) => {
        const d = rank(a.resumo.status) - rank(b.resumo.status);
        return d !== 0 ? d : byName(a, b);
      });
    }
    if (sort === 'dividas') {
      return list.sort((a, b) => {
        // dívidas primeiro (rank invertido parcial)
        const ra = isResumoEmDivida(a.resumo.status) ? 0 : isResumoPago(a.resumo.status) ? 1 : 2;
        const rb = isResumoEmDivida(b.resumo.status) ? 0 : isResumoPago(b.resumo.status) ? 1 : 2;
        return ra !== rb ? ra - rb : byName(a, b);
      });
    }
    return list.sort(byName);
  };

  const exportarRelatorioExcel = async (scope: ExportScope = 'todos', sort: ExportSort = 'alfabetica') => {
    const XLSX = await loadXLSX();
    const mesIdx = MONTH_OPTIONS.indexOf(mesRelatorio);
    const refRel = new Date(anoRelatorio, mesIdx + 1, 0);
    const alunosRel = [...alunos]
      .filter(a => { const e = parseFlexibleDate(a.data_matricula); return e ? e.getTime() <= refRel.getTime() : true; });

    const resumosBase = alunosRel.map((a) => ({
      aluno: a,
      resumo: getStudentStatusForMonth(a, pagamentos, anoRelatorio, mesIdx, hojeReferencia),
    }));
    const resumosFiltrados = ordenarResumosExport(filtrarResumosExport(resumosBase, scope), sort);

    const rows = resumosFiltrados.map(({ aluno: a, resumo }, idx) => {
      const emDivida = isResumoEmDivida(resumo.status);
      const planoNum = normalizeAmount(a.plano);
      return {
        '#': idx + 1,
        'Nome': a.nome,
        'Telefone': a.telefone || '',
        'Plano (CVE)': emDivida ? -Math.abs(planoNum) : planoNum,
        'Estado': getBillingBadgeLabel(resumo.status),
        'Situação': emDivida ? 'Devido' : isResumoPago(resumo.status) ? 'Pago' : 'Outro',
        'Próx. Vencimento': resumo.nextChargeDate || '',
        'Último Pagamento': resumo.lastPaymentDate || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ '#': 0, Nome: '(sem registos neste recorte)' }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${mesRelatorio}_${anoRelatorio}`);
    const receitaMesExp = pagamentos.filter(p => isPaymentInsideMonth(p, mesRelatorio, anoRelatorio)).reduce((s, p) => s + normalizeAmount(p.valor), 0);
    const scopeLabel = scope === 'todos' ? 'Todos' : scope === 'pagos' ? 'Pagos' : scope === 'dividas' ? 'Dívidas' : 'Por cobrar';
    const sortLabel = sort === 'alfabetica' ? 'Alfabética' : sort === 'pagos' ? 'Pagos primeiro' : 'Dívidas primeiro';
    const resumoRows = [
      [],
      ['RESUMO FINANCEIRO', '', `${mesRelatorio.toUpperCase()} ${anoRelatorio}`],
      ['Recorte', scopeLabel],
      ['Ordenação', sortLabel],
      ['Registos exportados', resumosFiltrados.length],
      ['Receita Cobrada (CVE)', receitaMesExp],
      ['Nota', 'Valores devidos em negativo na coluna Plano'],
      ['Gerado em', new Date().toLocaleString('pt-PT')],
    ];
    XLSX.utils.sheet_add_aoa(worksheet, resumoRows, { origin: -1 });
    XLSX.writeFile(workbook, `Relatorio_${nomeAcademia.replace(/\s+/g,'_')}_${mesRelatorio}_${anoRelatorio}_${scope}.xlsx`);
    showToast(`Excel · ${mesRelatorio} ${anoRelatorio} (${scopeLabel}) exportado.`);
  };

  const exportarRelatorioPdf = async (scope: ExportScope = 'todos', sort: ExportSort = 'alfabetica') => {
    const [jsPDF, autoTable] = await Promise.all([loadJsPDF(), loadAutoTable()]);
    const mesIdx = MONTH_OPTIONS.indexOf(mesRelatorio);
    const periodoLabel = `${mesRelatorio.charAt(0).toUpperCase()}${mesRelatorio.slice(1)} ${anoRelatorio}`;
    const dataGeracao = new Date().toLocaleString('pt-PT');
    const refRelatorio = new Date(anoRelatorio, mesIdx + 1, 0);
    const alunosRelatorio = [...alunos]
      .filter((aluno) => {
        const entrada = parseFlexibleDate(aluno.data_matricula);
        return entrada ? entrada.getTime() <= refRelatorio.getTime() : true;
      });

    const resumosRelatorioAll = alunosRelatorio.map((aluno) => ({
      aluno,
      resumo: getStudentStatusForMonth(aluno, pagamentos, anoRelatorio, mesIdx, hojeReferencia),
      pagamentoPeriodo: pagamentos
        .filter((pagamento) => (pagamento.aluno_id || pagamento.alunoId) === aluno.id && isPaymentInsideMonth(pagamento, mesRelatorio, anoRelatorio))
        .sort((left, right) => (right.id || 0) - (left.id || 0))[0],
    }));
    const resumosRelatorio = ordenarResumosExport(filtrarResumosExport(resumosRelatorioAll, scope), sort);

    const pagamentosPeriodo = pagamentos.filter((pagamento) => isPaymentInsideMonth(pagamento, mesRelatorio, anoRelatorio));
    const receitaRecebida = pagamentosPeriodo.reduce((sum, pagamento) => sum + normalizeAmount(pagamento.valor), 0);
    const alunosOperacionais = alunosRelatorio.filter((aluno) => isOperationallyActive(aluno.status));
    const receitaPrevistaPeriodo = alunosOperacionais.reduce((sum, aluno) => sum + normalizeAmount(aluno.plano), 0);
    const alunosAtrasados = resumosRelatorioAll.filter(({ resumo }) => isResumoEmDivida(resumo.status));
    const alunosPagos = resumosRelatorioAll.filter(({ resumo }) => isResumoPago(resumo.status));
    const porCobrar = Math.max(0, receitaPrevistaPeriodo - receitaRecebida);
    const scopeLabelPdf = scope === 'todos' ? 'Todos' : scope === 'pagos' ? 'Pagos' : scope === 'dividas' ? 'Dívidas' : 'Por cobrar';
    const sortLabelPdf = sort === 'alfabetica' ? 'A–Z' : sort === 'pagos' ? 'Pagos primeiro' : 'Dívidas primeiro';

    const sanitizeFilePart = (value: string) => String(value || 'Relatorio').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
    const textOrDash = (value?: string | number | null) => {
      const text = String(value ?? '').trim();
      return text || '—';
    };
    const formatValorPdf = (amount: number, negativo: boolean) => {
      const abs = formatCve(Math.abs(amount));
      return negativo ? `-${abs}` : abs;
    };

    // Colunas só se tiverem dados úteis no recorte
    const hasTelefone = resumosRelatorio.some(({ aluno }) => Boolean(String(aluno.telefone || '').trim()));
    const hasCategoria = resumosRelatorio.some(({ aluno }) => {
      const c = String(aluno.categoria || '').trim();
      return c && c.toLowerCase() !== 'geral';
    });
    const hasProxCobranca = resumosRelatorio.some(({ resumo }) => Boolean(String(resumo.nextChargeDate || '').trim()));
    const hasPagoPeriodo = resumosRelatorio.some(({ pagamentoPeriodo }) => Boolean(pagamentoPeriodo));

    type ColDef = { key: string; head: string; width?: number; align?: 'left' | 'center' | 'right'; value: (row: typeof resumosRelatorio[0], i: number) => string };
    const columns: ColDef[] = [
      { key: '#', head: '#', width: 7, align: 'center', value: (_r, i) => String(i + 1) },
      {
        key: 'estado',
        head: 'Sit.',
        width: 10,
        align: 'center',
        value: ({ resumo }) => {
          if (isResumoPago(resumo.status)) return '●';
          if (isResumoEmDivida(resumo.status)) return '●';
          return '○';
        },
      },
      { key: 'nome', head: 'Aluno', width: 42, value: ({ aluno }) => getAlunoNomeSeguro(aluno) },
    ];
    if (hasTelefone) {
      columns.push({ key: 'tel', head: 'Telefone', width: 24, value: ({ aluno }) => textOrDash(aluno.telefone) });
    }
    if (hasCategoria) {
      columns.push({ key: 'cat', head: 'Categoria', width: 20, value: ({ aluno }) => textOrDash(aluno.categoria) });
    }
    columns.push(
      {
        key: 'valor',
        head: 'Valor (CVE)',
        width: 26,
        align: 'right',
        value: ({ aluno, resumo, pagamentoPeriodo }) => {
          if (isResumoPago(resumo.status)) {
            const pago = pagamentoPeriodo ? normalizeAmount(pagamentoPeriodo.valor) : normalizeAmount(aluno.plano);
            return formatValorPdf(pago, false);
          }
          if (isResumoEmDivida(resumo.status) || !isResumoPago(resumo.status)) {
            return formatValorPdf(normalizeAmount(aluno.plano), true);
          }
          return formatValorPdf(normalizeAmount(aluno.plano), false);
        },
      },
      {
        key: 'label',
        head: 'Estado',
        width: 26,
        value: ({ resumo }) => getBillingBadgeLabel(resumo.status),
      },
    );
    if (hasProxCobranca) {
      columns.push({ key: 'prox', head: 'Próx. cobrança', width: 24, align: 'center', value: ({ resumo }) => textOrDash(resumo.nextChargeDate) });
    }
    if (hasPagoPeriodo) {
      columns.push({
        key: 'pago',
        head: 'Pago no mês',
        width: 22,
        align: 'right',
        value: ({ pagamentoPeriodo }) => (pagamentoPeriodo ? formatValorPdf(normalizeAmount(pagamentoPeriodo.valor), false) : '—'),
      });
    }

    const tableHead = [columns.map((c) => c.head)];
    const tableBody = resumosRelatorio.length
      ? resumosRelatorio.map((row, i) => columns.map((c) => c.value(row, i)))
      : [columns.map((c, i) => (i === 2 ? '(sem registos neste recorte)' : '—'))];
    const estadoColIndex = columns.findIndex((c) => c.key === 'estado');
    const valorColIndex = columns.findIndex((c) => c.key === 'valor');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const ink: [number, number, number] = [30, 30, 30];
    const muted: [number, number, number] = [100, 100, 100];
    const line: [number, number, number] = [200, 200, 200];

    // ── Cabeçalho simples: logo + academia + contactos + período ──
    let cursorY = 14;
    const logoSrc = appLogo && String(appLogo).startsWith('data:image') ? appLogo : null;
    if (logoSrc) {
      try {
        const fmt = logoSrc.includes('image/png') ? 'PNG' : logoSrc.includes('image/jpeg') || logoSrc.includes('image/jpg') ? 'JPEG' : 'PNG';
        doc.addImage(logoSrc, fmt, marginX, cursorY - 2, 12, 12);
      } catch {
        /* logo opcional */
      }
    }

    const textStartX = logoSrc ? marginX + 16 : marginX;
    doc.setTextColor(...ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(nomeAcademia || 'Academia', textStartX, cursorY + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    const contactParts = [telefoneAcademia, emailAcademia, moradaAcademia].filter((v) => String(v || '').trim());
    if (contactParts.length) {
      doc.text(contactParts.join('  ·  '), textStartX, cursorY + 9);
    }

    // Período à direita
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...ink);
    doc.text('Relatório mensal', pageWidth - marginX, cursorY + 2, { align: 'right' });
    doc.setFontSize(11);
    doc.text(periodoLabel, pageWidth - marginX, cursorY + 8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text(`Recorte: ${scopeLabelPdf}  ·  Ordem: ${sortLabelPdf}`, pageWidth - marginX, cursorY + 13, { align: 'right' });

    cursorY = 30;
    doc.setDrawColor(...line);
    doc.setLineWidth(0.3);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);

    // Resumo mínimo em texto
    cursorY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...ink);
    const resumoLinha = [
      `${resumosRelatorio.length} registo(s)`,
      `${alunosPagos.length} pagos`,
      `${alunosAtrasados.length} em dívida`,
      `Recebido ${formatCve(receitaRecebida)}`,
      porCobrar > 0 ? `Por cobrar ${formatCve(porCobrar)}` : null,
    ].filter(Boolean).join('   ·   ');
    doc.text(resumoLinha, marginX, cursorY);
    cursorY += 5;
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text('Legenda:  ● pago (verde)    ● em dívida (vermelho, valor negativo)', marginX, cursorY);

    cursorY += 3;
    doc.setDrawColor(...line);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);

    const green: [number, number, number] = [22, 101, 52];
    const red: [number, number, number] = [153, 27, 27];

    const columnStyles: Record<number, { cellWidth?: number; halign?: 'left' | 'center' | 'right'; fontStyle?: string }> = {};
    columns.forEach((col, idx) => {
      columnStyles[idx] = {
        cellWidth: col.width,
        halign: col.align || 'left',
        ...(col.key === 'nome' || col.key === 'valor' ? { fontStyle: 'bold' } : {}),
      };
    });

    autoTable(doc, {
      startY: cursorY + 5,
      margin: { left: marginX, right: marginX, bottom: 18 },
      head: tableHead,
      body: tableBody,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        textColor: ink,
        cellPadding: { top: 2.2, right: 1.5, bottom: 2.2, left: 1.5 },
        lineColor: line,
        lineWidth: 0.15,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fontStyle: 'bold',
        fontSize: 7.5,
        textColor: ink,
        fillColor: [245, 245, 245],
        lineColor: line,
        lineWidth: 0.2,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [252, 252, 252],
      },
      columnStyles,
      tableLineColor: line,
      tableLineWidth: 0.15,
      didParseCell: (data: any) => {
        if (data.section !== 'body' || !resumosRelatorio.length) return;
        const row = resumosRelatorio[data.row.index];
        if (!row) return;
        const status = row.resumo?.status;
        const pago = isResumoPago(status);
        const divida = isResumoEmDivida(status);

        if (data.column.index === estadoColIndex) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 11;
          if (pago) data.cell.styles.textColor = green;
          else if (divida) data.cell.styles.textColor = red;
          else data.cell.styles.textColor = muted;
        }
        if (data.column.index === valorColIndex) {
          data.cell.styles.fontStyle = 'bold';
          if (pago) data.cell.styles.textColor = green;
          else if (divida) data.cell.styles.textColor = red;
        }
      },
    });

    // Rodapé técnico em todas as páginas
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      const footerY = pageHeight - 10;
      doc.setDrawColor(...line);
      doc.setLineWidth(0.25);
      doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...muted);
      doc.text(
        `Next Level Academia  ·  ${COMPANY_NAME}  ·  ${COMPANY_AUTHOR}  ·  v1.0`,
        marginX,
        footerY,
      );
      doc.text(
        `${periodoLabel}  ·  Gerado ${dataGeracao}  ·  Pág. ${page}/${totalPages}`,
        pageWidth - marginX,
        footerY,
        { align: 'right' },
      );
    }

    const fileName = `Relatorio_${sanitizeFilePart(nomeAcademia)}_${mesRelatorio}_${anoRelatorio}_${scope}.pdf`;
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    if (electron) {
      const res = await electron.ipcRenderer.invoke('reports:export-current-pdf', {
        fileName,
        pdfBase64,
      });

      if (res?.success) {
        showToast(`PDF · ${scopeLabelPdf} guardado: ${res.path}`);
        return;
      }

      if (!res?.canceled) {
        showToast(res?.message || 'Não foi possível exportar o relatório em PDF.');
      }
      return;
    }

    doc.save(fileName);
    showToast(`PDF · ${scopeLabelPdf} gerado.`);
  };

  const executarExportacaoRelatorio = async ({ format, scope, sort }: ExportReportOptions) => {
    if (format === 'excel') await exportarRelatorioExcel(scope, sort);
    else await exportarRelatorioPdf(scope, sort);
  };

  // Stats leves só quando o modal de export está aberto (evita trabalho em cada render)
  const exportReportStats = useMemo(() => {
    if (!mostrarExportRelatorio) {
      return { alunos: 0, pagos: 0, dividas: 0, pendentes: 0, receita: 0, dividaValor: 0 };
    }
    const mesIdx = MONTH_OPTIONS.indexOf(mesRelatorio);
    const refRel = new Date(anoRelatorio, mesIdx + 1, 0);
    let alunosCount = 0;
    let pagos = 0;
    let dividas = 0;
    let pendentes = 0;
    let dividaValor = 0;
    for (const a of alunos) {
      const e = parseFlexibleDate(a.data_matricula);
      if (e && e.getTime() > refRel.getTime()) continue;
      alunosCount += 1;
      const resumo = getStudentStatusForMonth(a, pagamentos, anoRelatorio, mesIdx, hojeReferencia);
      if (!isOperationallyActive(a.status)) continue;
      if (resumo.status === 'pago') pagos += 1;
      else {
        pendentes += 1;
        if (resumo.status === 'atrasado' || resumo.status === 'hoje') {
          dividas += 1;
          dividaValor += normalizeAmount(a.plano);
        }
      }
    }
    const receita = pagamentos
      .filter((p) => isPaymentInsideMonth(p, mesRelatorio, anoRelatorio))
      .reduce((s, p) => s + normalizeAmount(p.valor), 0);
    return { alunos: alunosCount, pagos, dividas, pendentes, receita, dividaValor };
  }, [mostrarExportRelatorio, mesRelatorio, anoRelatorio, alunos, pagamentos, hojeReferencia]);

  const exportarPDFPersonalizado = async () => {
    const [jsPDF, autoTable] = await Promise.all([loadJsPDF(), loadAutoTable()]);
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

  // Menu nativo: ouvir comandos do main process
  useEffect(() => {
    const electron = (window as any).electron;
    if (!electron?.ipcRenderer?.on) return;

    const cleanupFns: (() => void)[] = [];

    const unsubNavigate = electron.ipcRenderer.on('navigate', (page: string) => {
      if (sessionUser?.role === 'root') return;
      setAba(page as any);
    });
    cleanupFns.push(unsubNavigate);

    const unsubAction = electron.ipcRenderer.on('menu-action', (action: string) => {
      switch (action) {
        case 'about':
          setMostrarSobreDoc(true);
          break;
        case 'new-student':
          onMatricular();
          break;
        case 'import-data':
          setMostrarImportar(true);
          break;
        case 'export-backup':
          setMostrarModalExport(true);
          break;
      }
    });
    cleanupFns.push(unsubAction);

    return () => cleanupFns.forEach(fn => fn());
  }, [sessionUser?.role, onMatricular]);

  // ── Setup Wizard Controller ─────────────────────────────────────
  const { proximoPassoSetup, saltarSetupDesenvolvedor, finalizarSetupTotal } = useSetupController({
    electron, appLogo,
    setup: { setupStep, setSetupStep, setupData, setupLicenseInfo, setSetupLicenseInfo, setSetupError, configuracoes },
    guardarConfiguracao, carregarConfiguracoes,
  });

  // ── Splash Screen ────────────────────────────────────────────────
  if (loadingConfig) return <SplashScreen appLogo={appLogo} />;

  if (configuracoes?.setup_completed === '0') {
    return (
      <InitialSetupPage
        model={{
          appLogo,
          setupStep,
          setupData,
          setupLicenseInfo,
          setupError,
          electron,
          setAppLogo,
          setSetupData,
          setSetupStep,
          saltarSetupDesenvolvedor,
          proximoPassoSetup,
          finalizarSetupTotal,
        }}
      />
    );
  }

  // ── License Block Screen ──────────────────────────────────────────
  if (!licencaAtiva) return <LicenseBlockedPage model={{ chaveReativacao, erroReativacao, electron, GlobalStyles, setChaveReativacao, setErroReativacao, setLicencaAtiva, carregarConfiguracoes, showToast, gerarBackup }} />;

  // ── Split-Screen Premium Login ────────────────────────────────────
  if (!isLoggedIn) return <LoginPage model={{ agora, appLogo, nomeAcademia, moradaAcademia, telefoneAcademia, bannerAcademia, loginForm, mostrarDropdownRecentes, lembrarUtilizadores, utilizadoresRecentes, mostrarSenha, permitirGuardarSessao, guardarSessao, loginError, carregandoLogin, loginSlideshowUsers, quickAccessExpanded, electron, GlobalStyles, handleLogin, setLoginForm, setMostrarDropdownRecentes, setMostrarSenha, setGuardarSessao, setQuickAccessExpanded, setCarregandoLogin, setSessionUser, setIsLoggedIn, utilizadorAvatares }} />;

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
        onExportarRelatorio={() => setMostrarExportRelatorio(true)}
        setMostrarRelatorioMensal={setMostrarRelatorioMensal}
        mostrarDailyReport={mostrarDailyReport}
        setMostrarDailyReport={setMostrarDailyReport}
        listaStats={{
          total: historicoMensalFiltrado.length,
          atrasados: alunosEmDivida.length,
          recebido: totalRecebidoPeriodo,
        }}
        larguraListas={larguraListas}
        appTheme={appTheme}
        utilizadorAvatares={utilizadorAvatares}
        setUtilizadorAvatares={setUtilizadorAvatares}
        onCycleTheme={() => {
          const order: AppThemeId[] = ['light', 'dark', 'claude', 'hybrid'];
          const idx = order.indexOf(appTheme);
          const next = order[(idx >= 0 ? idx + 1 : 0) % order.length];
          setAppTheme(next);
          localStorage.setItem('nl_app_theme', next);
          try {
            electron?.ipcRenderer?.invoke?.('update-configuracao', 'app_theme', next);
          } catch {
            /* offline / sem IPC — localStorage basta */
          }
        }}
      />

      {/* Container Principal */}
      <main className={`flex-1 overflow-hidden relative flex flex-col ${aba === 'gestao' || aba === 'contactos' || aba === 'configuracoes' || aba === 'relatorios_detalhado' ? 'px-0 pb-0 pt-0' : 'p-5 pt-3'}`}>
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
            abrirNotasRapidas={abrirNotasRapidas}
            onCobrarAluno={marcarComoPago}
            notasRecentes={notasRecentes}
            onUploadBanner={handleUploadBanner}
            larguraListas={larguraListas}
            estiloHome={estiloHome}
            isAdmin={sessionUser?.role === 'admin' || String(sessionUser?.role) === 'root'}
            onImport={() => setMostrarImportar(true)}
            sessionUserName={sessionUser?.name || ''}
            periodoLabel={`${mesFinanceiro} ${anoFinanceiro}`}
            cobrancasHoje={cobrancasParaHoje}
            matriculasHoje={alunosInscritosHoje}
            totalRecebidoHoje={totalRecebidoHoje}
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
            periodoBloqueado={
              (anoRelatorio < anoAtual
                || (anoRelatorio === anoAtual && MONTH_OPTIONS.indexOf(mesRelatorio) < hojeReferencia.getMonth()))
              && !mesPassadoEditavel
            }
            onPermitirEdicaoMes={
              sessionUser?.role === 'admin'
                ? () => {
                    setMesPassadoEditavel(true);
                    showToast('Edição de mês passado desbloqueada para esta sessão.');
                  }
                : undefined
            }
            onNavigateGestao={(filtro) => {
              setFiltroStatus(filtro || 'todos');
              setAba('gestao');
            }}
            onOpenStudent={abrirPerfilAluno}
            onCobrarAluno={marcarComoPago}
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
            obterTomPastel={obterTomPastel}
            setAlunoPerfil={setAlunoPerfil}
            irParaMesAtualOperacional={irParaMesAtualOperacional}
            abrirEdicao={abrirEdicao}
            abrirPerfilAluno={abrirPerfilAluno}
            onEstadoPagamentoClick={abrirAcaoPagamentoDaLista}
            notasResumo={notasResumo}
            onNotasClick={abrirNotasRapidas}
            finalizarTodosImportados={finalizarTodosImportados}
            setAba={setAba}
            periodoBloqueado={periodoBloqueado}
            onPermitirEdicaoMes={
              sessionUser?.role === 'admin'
                ? () => {
                    setMesPassadoEditavel(true);
                    showToast('Edição de mês passado desbloqueada para esta sessão.');
                  }
                : undefined
            }
            onExportarRelatorio={() => {
              setMesRelatorio(mesFinanceiro);
              setAnoRelatorio(anoFinanceiro);
              setAba('relatorios_detalhado');
              setMostrarExportRelatorio(true);
            }}
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
    {mostrarForm && <StudentFormModal mode="create" model={{
      appLogo, novoAluno, categorias, sugestoesNome, previewVencimento, alunoEdicao,
      novoAlunoDefault, setMostrarForm, salvarAluno, handleNomeChange, setSugestoesNome,
      abrirPerfilAluno, setNovoAluno, setMostrarFormEdicao, setAlunoEdicao, salvarEdicao,
      ativarImportado,
    }} />}


    {/* Modal: Resolver Tudo (Pendências) */}
    {mostrarResolverPendencias && alunoParaResolver && <ResolvePendingModal model={{ alunoParaResolver, mesesParaResolver, appLogo, setMostrarResolverPendencias, resolverPendencias }} />}

    {/* Modal: Editar Registo */}
    {mostrarFormEdicao && alunoEdicao && <StudentFormModal mode="edit" model={{
      appLogo, novoAluno, categorias, sugestoesNome, previewVencimento, alunoEdicao,
      novoAlunoDefault, setMostrarForm, salvarAluno, handleNomeChange, setSugestoesNome,
      abrirPerfilAluno, setNovoAluno, setMostrarFormEdicao, setAlunoEdicao, salvarEdicao,
      ativarImportado,
    }} />}

    {/* Modal: Resolver Duplicados */}
    {mostrarModalDuplicados && <DuplicateStudentsModal model={{ duplicadosEncontrados, appLogo, electron, setMostrarModalDuplicados, setDuplicadosEncontrados, abrirPerfilAluno, abrirConfirmacao, carregarConfiguracoes, showToast }} />}

      {/* Perfil resumido do aluno */}
      {alunoSelecionado && <LegacyStudentProfileModal model={{ alunoSelecionado, resumoAlunoSelecionado, setAlunoSelecionado, abrirEdicao }} />}

      <ConfirmDialogModal dialog={confirmDialog} onClose={fecharConfirmacao} />



      {/* Menu de Contexto */}
      {contextMenu && <StudentContextMenu model={{ contextMenu, contextMenuRef, alunos, setContextMenu, abrirEdicao, alterarStatus, eliminarAluno }} />}

      {/* Barra de Estado */}
      <AppStatusBar model={{ online, totalAlunos, mensalidadesPendentes, zoomLista, relatorioMensalDisponivel, setZoomLista, setAba }} />

      {/* Modal: Relatório Mensal */}
      {mostrarRelatorioMensal && <MonthlyReportModal model={{ appLogo, mesFinanceiro, anoFinanceiro, totalRecebidoPeriodo, alunosComPagamentoEmDia, alunosEmDivida, alunos, pagamentosDoPeriodo, setMostrarRelatorioMensal, exportarFinancasExcel, showToast, obterTomPastel }} />}

      {/* Modal: Notificações */}
      {mostrarNotificacoes && <NotificationsPanel model={{ notificacoes, notificacoesRef, limparNotificacoes, setMostrarNotificacoes, marcarComoLida, setAba, setConfigAba }} />}


      {/* Modais de configuração foram removidos para se tornarem abas principais */}

      {/* Modal: Boas-Vindas Nova Matrícula */}
      {mostrarBoasVindas && alunoBoasVindas && <WelcomeStudentModal model={{ alunoBoasVindas, msgBoasVindas, appLogo, nomeAcademia, electron, setMostrarBoasVindas, setAlunoBoasVindas, setMsgBoasVindas }} />}

      {mostrarBoasVindasMes && (() => {
        const prevMonthIdx = hojeReferencia.getMonth() === 0 ? 11 : hojeReferencia.getMonth() - 1;
        const prevYear = hojeReferencia.getMonth() === 0 ? hojeReferencia.getFullYear() - 1 : hojeReferencia.getFullYear();
        const prevLabel = `${MONTH_OPTIONS[prevMonthIdx]} ${prevYear}`;
        const mesAtual = MONTH_OPTIONS[hojeReferencia.getMonth()];
        return (
          <WelcomeMonthModal
            mes={mesAtual}
            ano={hojeReferencia.getFullYear()}
            mesAnteriorLabel={prevLabel}
            appLogo={appLogo}
            nomeAcademia={nomeAcademia}
            onClose={() => {
              const key = `nl_welcome_month_${hojeReferencia.getFullYear()}-${String(hojeReferencia.getMonth() + 1).padStart(2, '0')}`;
              localStorage.setItem(key, '1');
              setMostrarBoasVindasMes(false);
            }}
            onOpenReports={() => {
              const key = `nl_welcome_month_${hojeReferencia.getFullYear()}-${String(hojeReferencia.getMonth() + 1).padStart(2, '0')}`;
              localStorage.setItem(key, '1');
              setMostrarBoasVindasMes(false);
              setMesRelatorio(MONTH_OPTIONS[prevMonthIdx]);
              setAnoRelatorio(prevYear);
              setAba('relatorios_detalhado');
              setMostrarExportRelatorio(true);
            }}
          />
        );
      })()}

      {mostrarExportRelatorio && (
        <ExportReportModal
          mes={mesRelatorio}
          ano={anoRelatorio}
          stats={exportReportStats}
          onClose={() => setMostrarExportRelatorio(false)}
          onExport={executarExportacaoRelatorio}
        />
      )}

      {/* Modal: Sobre o App (Página Estilo Word) */}
      {mostrarSobreDoc && <AboutAppModal model={{ appLogo, licencaDados, electron, setMostrarSobreDoc }} />}
      {/* Modal: Novo Utilizador */}
      {mostrarFormNovoUtilizador && <CreateUserModal model={{ appLogo, novoUtilizadorForm, electron, setMostrarFormNovoUtilizador, setNovoUtilizadorForm, showToast, setListaUtilizadores }} />}

      {/* Modal: Editar Utilizador + Actividade */}
      {utilizadorEmEdicao && <EditUserModal model={{ utilizadorEmEdicao, utilizadorAvatares, utilizadorEdicaoForm, electron, logs, setUtilizadorEmEdicao, setUtilizadorAvatares, setUtilizadorEdicaoForm, showToast, setListaUtilizadores }} />}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL DE PERFIL DO ALUNO — Painel Unificado com Abas
          Abas: [ Perfil ] [ Histórico ] [ Cobrar ]
      ═══════════════════════════════════════════════════════════════════════ */}
      {mostrarPerfilModal && alunoPerfil && (
        <StudentProfileModal
          model={{
            alunoPerfil,
            pagamentos,
            anoFinanceiro,
            mesFinanceiroIndex,
            hojeReferencia,
            notasResumo,
            perfilEditForm,
            editandoPerfil,
            mostrarHistoricoPerfil,
            setMostrarPerfilModal,
            setMostrarHistoricoPerfil,
            setEditandoPerfil,
            setPerfilEditForm,
            setCol1Minimizada,
            setCol2Minimizada,
            setPerfilAba,
            setPerfilPagamentoSucesso,
            setPerfilUltimoPagamentoInfo,
            setPagamentoForm,
            sincronizarAlunoAtualizado,
            carregarConfiguracoes,
            adicionarNotificacao,
            abrirNotasRapidas,
            onAbrirCobranca: abrirCobrancaUnificada,
          }}
        />
      )}

      {/* Modal único de cobrança (cartão da barra de dias) */}
      {mostrarCobrancaRapida && alunoParaCobrancaRapida && (
        <QuickPaymentModal
          model={{
            alunoParaCobrancaRapida,
            pagamentoForm,
            mesAtualNome,
            cobrancaUltimoPagamentoInfo,
            cobrancaResumo,
            anoAtual,
            electron,
            nomeAcademia,
            alunoSelecionado,
            pagamentos,
            notasResumo,
            cobrancaPagamentoSucesso,
            setMostrarCobrancaRapida,
            setAlunoParaCobrancaRapida,
            setCobrancaPagamentoSucesso,
            setCobrancaUltimoPagamentoInfo,
            setCobrancaResumo,
            setPagamentoForm,
            showToast,
            registrarPagamentoAtomico,
            adicionarNotificacao,
            notificarSistema,
            carregarHistorico,
            carregarConfiguracoes,
            getAlunoNomeSeguro,
            getAvatarColorByName,
            getAlunoIniciais,
            abrirNotasRapidas,
            parseDate,
          }}
        />
      )}

      {/* Post-it de notas (sempre por cima — z-index 400) */}
      {alunoNotasRapidas && (
        <StudentNotesModal
          aluno={alunoNotasRapidas}
          notas={notasRapidas}
          novaNota={novaNotaRapida}
          onNovaNotaChange={setNovaNotaRapida}
          onAdd={adicionarNotaRapida}
          onDelete={eliminarNotaRapida}
          onClose={() => setAlunoNotasRapidas(null)}
        />
      )}

      <ToastNotification message={toast.message} visible={toast.visible} />
    </div>
  );
}

export default App;
