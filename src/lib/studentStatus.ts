export const isPausedStatus = (status?: string) => status === 'pausado' || status === 'suspenso';
export const isBlockedStatus = (status?: string) => status === 'bloqueado';
export const isImportedStatus = (status?: string) => status === 'importado';
export const isOperationallyActive = (status?: string) => !isPausedStatus(status) && !isBlockedStatus(status);
