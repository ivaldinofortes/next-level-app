// ─── Application Constants ──────────────────────────────────────────────────
// Note: Type imports kept but not used in this file - placeholder for future use

export const APP_ICON_PATH = new URL('./next-level-v01-2026.svg', document.baseURI).toString();
export const NEXT_LAB_ICON = new URL('./next.svg', document.baseURI).toString();
export const COMPANY_NAME = 'NEXT Lab';
export const COMPANY_WEBSITE = 'https://linktr.ee/next.lab';
export const COMPANY_AUTHOR = 'Ivaldino da Luz Fortes';
export const COMPANY_EMAIL = 'ivaldinofortes@gmail.com';
export const COMPANY_PHONE = '+238 9597220';
export const DEFAULT_ACADEMY_BANNER = '/next-oficial%20wallpapers.jpg';

export const MONTH_OPTIONS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export const DEFAULT_PAYMENT_METHOD = 'Dinheiro';

export const PAYMENT_METHOD_OPTIONS = [
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

export const HOME_SUBTITLE = 'Gestão diária num só painel.';

// ─── Status Labels ─────────────────────────────────────────────────────────

export const STUDENT_STATUS_HELPERS = {
  isPaused: (status?: string) => status === 'pausado' || status === 'suspenso',
  isBlocked: (status?: string) => status === 'bloqueado',
  isImported: (status?: string) => status === 'importado',
  isOperational: (status?: string) => !STUDENT_STATUS_HELPERS.isPaused(status) && !STUDENT_STATUS_HELPERS.isBlocked(status),
};

export const getStudentStatusLabel = (status?: string) => {
  if (STUDENT_STATUS_HELPERS.isPaused(status)) return 'pausado';
  if (status === 'bloqueado') return 'bloqueado';
  return status || 'ativo';
};

export const getBillingBadgeLabel = (status?: string) => {
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

export const getBillingTone = (status?: string) => {
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

export const getGenderBucket = (sexo?: string) => {
  const value = (sexo || '').trim().toLowerCase();
  if (value.startsWith('m')) return 'masculino';
  if (value.startsWith('f')) return 'feminino';
  return 'nao_definido';
};

// ─── Theme Colors ──────────────────────────────────────────────────────────

export const themeVars = {
  light: {
    '--color-primary': '#2563EB',
    '--color-primary-hover': '#1D4ED8',
    '--color-primary-light': '#DBEAFE',
    '--color-secondary': '#64748B',
    '--color-secondary-light': '#F1F5F9',
    '--color-secondary-lighter': '#E2E8F0',
    '--color-success': '#059669',
    '--color-error': '#DC2626',
    '--color-warning': '#D97706',
    '--color-info': '#0284C7',
    '--color-accent-teal': '#0D9488',
    '--color-accent-violet': '#7C3AED',
    '--color-accent-rose': '#E11D48',
    '--color-accent-amber': '#D97706',
    '--color-bg-primary': '#FFFFFF',
    '--color-bg-secondary': '#F8FAFC',
    '--color-bg-tertiary': '#F1F5F9',
    '--color-text-primary': '#0F172A',
    '--color-text-secondary': '#475569',
    '--color-text-tertiary': '#94A3B8',
    '--color-border': '#CBD5E1',
    '--color-border-light': '#E2E8F0',
    '--bg-app': '#F1F5F9',
    '--bg-surface': '#FFFFFF',
    '--bg-header': '#FFFFFF',
    '--bg-input': '#FFFFFF',
    '--text-primary': '#0F172A',
    '--text-secondary': '#475569',
    '--text-tertiary': '#94A3B8',
    '--border': '#CBD5E1',
    '--border-light': '#E2E8F0',
    '--shadow-sm': '0 1px 2px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.04)',
    '--shadow-md': '0 4px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)',
    '--shadow-lg': '0 8px 24px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.04)',
    '--shadow-xl': '0 16px 48px rgba(15,23,42,0.10), 0 0 0 1px rgba(15,23,42,0.04)',
    '--shadow-primary': 'rgba(37,99,235,0.20)',
    '--shadow-primary-focus': 'rgba(37,99,235,0.10)',
    '--radius-lg': '8px',
    '--radius-md': '6px',
    '--radius-sm': '4px',
    '--rp0': '#FFFFFF',
    '--rp0h': '#F8FAFC',
    '--rp1': '#FAFBFC',
    '--rp1h': '#F1F5F9',
    '--rp2': '#F8FAFC',
    '--rp2h': '#F1F5F9',
    '--rp3': '#FFFFFF',
    '--rp3h': '#F8FAFC',
    '--rp4': '#FAFBFC',
    '--rp4h': '#F1F5F9',
    '--rp5': '#F8FAFC',
    '--rp5h': '#F1F5F9',
    '--color-header-bg': '#FFFFFF',
    '--color-surface-elevated': '#F8FAFC',
  },
  dark: {
    '--color-primary': '#60A5FA',
    '--color-primary-hover': '#93C5FD',
    '--color-primary-light': '#1E3A5F',
    '--color-secondary': '#94A3B8',
    '--color-secondary-light': '#1E293B',
    '--color-secondary-lighter': '#334155',
    '--color-success': '#34D399',
    '--color-error': '#F87171',
    '--color-warning': '#FBBF24',
    '--color-info': '#38BDF8',
    '--color-accent-teal': '#2DD4BF',
    '--color-accent-violet': '#A78BFA',
    '--color-accent-rose': '#FB7185',
    '--color-accent-amber': '#FBBF24',
    '--color-bg-primary': '#0F172A',
    '--color-bg-secondary': '#1E293B',
    '--color-bg-tertiary': '#334155',
    '--color-text-primary': '#F1F5F9',
    '--color-text-secondary': '#94A3B8',
    '--color-text-tertiary': '#64748B',
    '--color-border': '#475569',
    '--color-border-light': '#334155',
    '--bg-app': '#0F172A',
    '--bg-surface': '#1E293B',
    '--bg-header': '#1E293B',
    '--bg-input': '#334155',
    '--text-primary': '#F1F5F9',
    '--text-secondary': '#94A3B8',
    '--text-tertiary': '#64748B',
    '--border': '#475569',
    '--border-light': '#334155',
    '--shadow-sm': '0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.2)',
    '--shadow-md': '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.2)',
    '--shadow-lg': '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2)',
    '--shadow-xl': '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.2)',
    '--shadow-primary': 'rgba(96,165,250,0.25)',
    '--shadow-primary-focus': 'rgba(96,165,250,0.12)',
    '--radius-lg': '8px',
    '--radius-md': '6px',
    '--radius-sm': '4px',
    '--rp0': '#1E293B',
    '--rp0h': '#334155',
    '--rp1': '#1A2533',
    '--rp1h': '#2E3A4A',
    '--rp2': '#1E293B',
    '--rp2h': '#334155',
    '--rp3': '#1A2533',
    '--rp3h': '#2E3A4A',
    '--rp4': '#1E293B',
    '--rp4h': '#334155',
    '--rp5': '#1A2533',
    '--rp5h': '#2E3A4A',
    '--color-header-bg': '#1E293B',
    '--color-surface-elevated': '#334155',
  },
};

// ─── Priority and Sorting ──────────────────────────────────────────────────

export const prioridadeResumoAlunos: Record<string, number> = {
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

export const DEFAULT_HOME_SUBTITLE = 'Operação diária, mensalidades e acompanhamento num só painel.';
export const LEGACY_HOME_SUBTITLE = 'Operação diária, mensalidades e acompanhamento num só painel.';
