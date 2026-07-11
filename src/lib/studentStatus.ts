/** Status manuais do aluno (operacionais vs fora da contabilidade) */

export const STUDENT_MANUAL_STATUSES = [
  'ativo',
  'pausado',
  'ferias',
  'desistente',
  'bloqueado',
  'importado',
  'suspenso',
] as const;

export type StudentManualStatusCode = (typeof STUDENT_MANUAL_STATUSES)[number];

/** Pausa, férias ou legado "suspenso" — fora da cobrança temporariamente */
export const isPausedStatus = (status?: string) =>
  status === 'pausado' || status === 'suspenso' || status === 'ferias';

/** Desistiu — não entra na contabilidade mensal */
export const isQuitStatus = (status?: string) => status === 'desistente';

export const isBlockedStatus = (status?: string) => status === 'bloqueado';

export const isImportedStatus = (status?: string) => status === 'importado';

/**
 * Fora da contabilidade do mês (dívida, previsão, cobrança operacional).
 * Pagamentos já registados continuam visíveis no histórico.
 */
export const isExcludedFromBilling = (status?: string) =>
  isPausedStatus(status) || isQuitStatus(status) || isBlockedStatus(status) || isImportedStatus(status);

/** Activo para cobrança e operação do dia a dia */
export const isOperationallyActive = (status?: string) => !isExcludedFromBilling(status);

export const getManualStatusLabel = (status?: string) => {
  switch (status) {
    case 'pausado':
    case 'suspenso':
      return 'Em pausa';
    case 'ferias':
      return 'Férias';
    case 'desistente':
      return 'Desistente';
    case 'bloqueado':
      return 'Bloqueado';
    case 'importado':
      return 'Importado';
    case 'ativo':
    case undefined:
    case '':
      return 'Ativo';
    default:
      return status || 'Ativo';
  }
};

/** Opções para selects de edição */
export const STUDENT_STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo', hint: 'Entra na contabilidade e cobrança do mês' },
  { value: 'pausado', label: 'Em pausa', hint: 'Temporário — fora da contabilidade do mês' },
  { value: 'ferias', label: 'Férias', hint: 'Fora da contabilidade até regressar' },
  { value: 'desistente', label: 'Desistente', hint: 'Saiu — não conta no mês actual' },
  { value: 'bloqueado', label: 'Bloqueado', hint: 'Sem acesso; fora da contabilidade' },
] as const;
