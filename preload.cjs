const { contextBridge, ipcRenderer } = require('electron');

const allowedInvokeChannels = new Set([
  'add-aluno',
  'add-nota',
  'add-pagamento',
  'billing:register-payment',
  'check-auth',
  'db:delete-duplicate',
  'db:find-duplicates',
  'db:reset',
  'db:reset-operational-data',
  'delete-aluno',
  'delete-nota',
  'export-database',
  'export-operational-report',
  'finalizar-importados',
  'get-alunos',
  'get-configuracoes',
  'get-historico-pagamentos',
  'get-logs',
  'get-notas',
  'get-notas-recentes',
  'get-notas-resumo',
  'get-pagamentos',
  'import-alunos',
  'license:validate-external',
  'login:quick-access',
  'menu:update',
  'notify-system',
  'open-external',
  'refresh-app',
  'restore-aluno',
  'restore-backup',
  'reports:admin-data',
  'reports:daily-summary',
  'reports:export-current-pdf',
  'root:create-user',
  'root:export-report',
  'root:get-logs-tecnicos',
  'root:get-users',
  'root:log-error',
  'root:reset-password',
  'root:toggle-user-active',
  'root:update-user',
  'select-directory',
  'setup:save-data',
  'show-item-in-folder',
  'update-aluno-dados',
  'update-aluno-status',
  'update-configuracao',
  'upload-foto',
  'users:create',
  'users:list',
  'users:set-current',
  'users:set-password',
  'users:update',
  'window:resize',
]);

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke(channel, ...args) {
      if (!allowedInvokeChannels.has(channel)) {
        throw new Error(`Canal IPC não permitido: ${channel}`);
      }
      return ipcRenderer.invoke(channel, ...args);
    },
    on(channel, callback) {
      const allowed = ['navigate', 'menu-action', 'menu:refresh'];
      if (!allowed.includes(channel)) {
        throw new Error(`Canal IPC não permitido para on: ${channel}`);
      }
      const listener = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
  },
});
