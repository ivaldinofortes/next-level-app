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
    '--color-primary': '#0065FF',
    '--color-primary-hover': '#0052CC',
    '--color-primary-light': '#DEEBFF',
    '--color-secondary': '#626F86',
    '--color-secondary-light': '#F4F5F7',
    '--color-secondary-lighter': '#EBECF0',
    '--color-success': '#61BD4F',
    '--color-error': '#EB5A46',
    '--color-warning': '#FF9F1A',
    '--color-info': '#0065FF',
    '--color-bg-primary': '#FFFFFF',
    '--color-bg-secondary': '#F4F5F7',
    '--color-bg-tertiary': '#EBECF0',
    '--color-text-primary': '#172B4D',
    '--color-text-secondary': '#626F86',
    '--color-text-tertiary': '#738496',
    '--color-border': '#DFE1E6',
    '--color-border-light': '#EBECF0',
    '--bg-app': '#F4F5F7',
    '--bg-surface': '#FFFFFF',
    '--bg-header': '#FFFFFF',
    '--bg-input': '#FFFFFF',
    '--text-primary': '#172B4D',
    '--text-secondary': '#626F86',
    '--text-tertiary': '#738496',
    '--border': '#DFE1E6',
    '--border-light': '#EBECF0',
    '--shadow-sm': '0 1px 0 rgba(9,30,66,0.25)',
    '--shadow-md': '0 2px 4px rgba(9,30,66,0.13)',
    '--shadow-lg': '0 4px 8px rgba(9,30,66,0.12)',
    '--shadow-xl': '0 8px 16px rgba(9,30,66,0.25)',
    '--shadow-primary': 'rgba(0,101,255,0.24)',
    '--shadow-primary-focus': 'rgba(0,101,255,0.12)',
    '--radius-lg': '3px',
    '--radius-md': '3px',
    '--radius-sm': '3px',
  },
  dark: {
    '--color-primary': '#579DFF',
    '--color-primary-hover': '#85B8FF',
    '--color-primary-light': '#1D3A6A',
    '--color-secondary': '#9FADBC',
    '--color-secondary-light': '#1D2125',
    '--color-secondary-lighter': '#282E33',
    '--color-success': '#61BD4F',
    '--color-error': '#F87171',
    '--color-warning': '#FBBF24',
    '--color-info': '#60A5FA',
    '--color-bg-primary': '#22272B',
    '--color-bg-secondary': '#1D2125',
    '--color-bg-tertiary': '#282E33',
    '--color-text-primary': '#F1F2F4',
    '--color-text-secondary': '#9FADBC',
    '--color-text-tertiary': '#8696A7',
    '--color-border': '#3D474F',
    '--color-border-light': '#2C333A',
    '--bg-app': '#161A1D',
    '--bg-surface': '#22272B',
    '--bg-header': '#1D2125',
    '--bg-input': '#282E33',
    '--text-primary': '#F1F2F4',
    '--text-secondary': '#9FADBC',
    '--text-tertiary': '#8696A7',
    '--border': '#3D474F',
    '--border-light': '#2C333A',
    '--shadow-sm': '0 1px 2px rgba(0,0,0,0.5)',
    '--shadow-md': '0 4px 8px rgba(0,0,0,0.5)',
    '--shadow-lg': '0 8px 16px rgba(0,0,0,0.5)',
    '--shadow-xl': '0 12px 24px rgba(0,0,0,0.6)',
    '--shadow-primary': 'rgba(87,157,255,0.28)',
    '--shadow-primary-focus': 'rgba(87,157,255,0.14)',
    '--radius-lg': '3px',
    '--radius-md': '3px',
    '--radius-sm': '3px',
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
