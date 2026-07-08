const electron = require('electron');
const { app, BrowserWindow, ipcMain, protocol, Notification, dialog, shell, nativeImage } = electron;
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');
const { execFile } = require('child_process');
const XLSX = require('xlsx');
const crypto = require('crypto');
const APP_ID = 'cv.nextlab.nextlevel';
const APP_ICON = path.join(__dirname, 'build', 'icon.png');
const APP_ICON_ICO = path.join(__dirname, 'build', 'icon.ico');

let db = null;
let mainWindow = null;
let dbPath = null;

// Debug Global
process.on('uncaughtException', (err) => {
  console.error('ERRO NO PROCESSO PRINCIPAL:', err);
  try { require('electron').dialog.showErrorBox('Erro Crítico', err.stack || err.message); } catch(e) {}
});

console.log('--- INICIANDO MAIN.CJS ---');

if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: fs.existsSync(APP_ICON_ICO) ? APP_ICON_ICO : (fs.existsSync(APP_ICON) ? APP_ICON : undefined),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow = win;

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  // Permite abrir/fechar as ferramentas de desenvolvedor (DevTools)
  win.webContents.on('before-input-event', (event, input) => {
    const isShortcut = ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i') ||
                       ((input.control || input.meta) && input.alt && input.key.toLowerCase() === 'i') ||
                       (input.key === 'F12');
    if (isShortcut && input.type === 'keyDown') {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  const devServerUrl =
    process.env.ELECTRON_RENDERER_URL ||
    process.env.VITE_DEV_SERVER_URL ||
    process.env.VITE_DEV_SERVER;
  const distPath = path.join(__dirname, 'dist', 'index.html');

  if (devServerUrl) {
    win.loadURL(devServerUrl);
    if (process.env.NEXTLEVEL_OPEN_DEVTOOLS === '1') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
    return;
  }

  if (fs.existsSync(distPath)) {
    win.loadFile(distPath);
    if (!app.isPackaged && process.env.NEXTLEVEL_OPEN_DEVTOOLS === '1') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
    return;
  }

  throw new Error(`Renderer não encontrado. Gere o frontend primeiro ou informe um servidor dev. Caminho esperado: ${distPath}`);
}

app.whenReady().then(() => {
  // Registar protocolo para recursos locais
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    const url = request.url.replace(/^local-resource:\/\//, '');
    try {
      return callback(decodeURIComponent(url));
    } catch (error) {
      console.error('ERROR: registerFileProtocol:', error);
    }
  });

  if (process.platform === 'darwin' && app.dock) {
    if (fs.existsSync(APP_ICON)) {
      app.dock.setIcon(APP_ICON);
    }
  }

  // Inicializar banco de dados
  // app.isPackaged é false em dev (electron .), true em distribuição
  const isDev = !app.isPackaged;
  const dbName = isDev ? 'nextlevel-dev.db' : 'nextlevel.db';
  dbPath = path.join(app.getPath('userData'), dbName);

  // Na primeira instalação, copiar seed.db pré-configurado se não existir DB
  if (!isDev && !fs.existsSync(dbPath)) {
    const seedPath = path.join(process.resourcesPath, 'seed.db');
    if (fs.existsSync(seedPath)) {
      try {
        fs.copyFileSync(seedPath, dbPath);
        console.log('seed.db copiado para userData:', dbPath);
      } catch (e) {
        console.error('Erro ao copiar seed.db:', e.message);
      }
    }
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');

  const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
  const normalizeName = (name = '') => String(name).trim();
  const parseAppDate = (dateStr) => {
    if (!dateStr) return null;
    const normalized = String(dateStr).trim();
    if (!normalized) return null;
    if (normalized.includes('/')) {
      const [day, month, year] = normalized.split('/').map(Number);
      if (!day || !month || !year) return null;
      return new Date(year, month - 1, day);
    }
    if (normalized.includes('-')) {
      const [year, month, day] = normalized.split('-').map(Number);
      if (!day || !month || !year) return null;
      return new Date(year, month - 1, day);
    }
    const fallback = new Date(normalized);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  };
  const scryptHash = (password, salt) =>
    crypto.scryptSync(String(password || ''), String(salt || ''), 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  const verifyPassword = (password, record) => {
    try {
      if (!record?.password_hash || !record?.password_salt) return false;
      const computed = scryptHash(password, record.password_salt);
      return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(record.password_hash, 'hex'));
    } catch (e) {
      return false;
    }
  };

  // Criar tabelas se não existirem
  db.exec(`
    CREATE TABLE IF NOT EXISTS alunos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT,
      sexo TEXT,
      data_nascimento TEXT,
      morada TEXT,
      alergias TEXT,
      objetivos TEXT,
      horario_preferido TEXT,
      plano TEXT,
      vencimento TEXT,
      progresso INTEGER DEFAULT 100,
      data_matricula TEXT,
      status TEXT DEFAULT 'ativo',
      categoria TEXT,
      modo_cobranca TEXT DEFAULT 'mensalidade_movel',
      foto_path TEXT,
      notas TEXT,
      deleted INTEGER DEFAULT 0
    );
  `);

  // Adicionar colunas se não existirem (para DBs já criados)
  try {
    db.exec("ALTER TABLE alunos ADD COLUMN categoria TEXT;");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE alunos ADD COLUMN modo_cobranca TEXT DEFAULT 'mensalidade_movel';");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE alunos ADD COLUMN foto_path TEXT;");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE alunos ADD COLUMN notas TEXT;");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE alunos ADD COLUMN deleted INTEGER DEFAULT 0;");
  } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS notas_contacto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id TEXT NOT NULL,
      texto TEXT NOT NULL,
      data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pagamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id TEXT NOT NULL,
      valor TEXT NOT NULL,
      status TEXT DEFAULT 'pendente',
      data_pagamento TEXT,
      metodo_pagamento TEXT,
      mes_referencia TEXT,
      referencia_inicio TEXT,
      referencia_fim TEXT,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
    );
  `);

  // Adicionar colunas se não existirem (para DBs já criados)
  try { db.exec("ALTER TABLE pagamentos ADD COLUMN metodo_pagamento TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE pagamentos ADD COLUMN data_pagamento TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE pagamentos ADD COLUMN mes_referencia TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE pagamentos ADD COLUMN referencia_inicio TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE pagamentos ADD COLUMN referencia_fim TEXT;"); } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      acao TEXT NOT NULL,
      detalhes TEXT,
      data_hora TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try { db.exec("ALTER TABLE logs ADD COLUMN user_name TEXT;"); } catch (e) {}

  let currentUserName = 'Sistema';

  const registrarLog = (acao, detalhes) => {
    const stmt = db.prepare('INSERT INTO logs (acao, detalhes, data_hora, user_name) VALUES (?, ?, ?, ?)');
    stmt.run(acao, detalhes, new Date().toLocaleString('pt-PT'), currentUserName);
  };

  const normalizeDuplicateName = (name = '') =>
    String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const normalizeDuplicatePhone = (phone = '') => String(phone || '').replace(/\D/g, '');

  const verifyAdminPassword = (payload = {}) => {
    const password = String(payload.password || payload.adminPassword || '');
    const userId = Number(payload.userId || payload.adminId || 0);
    const emailOrName = normalizeEmail(payload.email || payload.username || payload.adminEmail || '');

    if (!password) return { ok: false, message: 'Senha do administrador obrigatória.' };

    let user = null;
    if (userId) {
      user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'admin' AND is_active = 1").get(userId);
    }
    if (!user && emailOrName) {
      user = db.prepare(`
        SELECT * FROM users
        WHERE is_active = 1 AND role = 'admin' AND (LOWER(email) = ? OR LOWER(name) = ?)
      `).get(emailOrName, emailOrName);
    }

    if (!user) return { ok: false, message: 'Administrador não encontrado ou sem permissão.' };
    if (!verifyPassword(password, user)) return { ok: false, message: 'Senha do administrador inválida.' };
    return { ok: true, user };
  };

  const findDuplicateGroups = () => {
    const rows = db.prepare('SELECT * FROM alunos WHERE deleted = 0 ORDER BY nome COLLATE NOCASE ASC').all();
    const byName = new Map();
    const byPhone = new Map();

    rows.forEach((row) => {
      const nameKey = normalizeDuplicateName(row.nome);
      const phoneKey = normalizeDuplicatePhone(row.telefone);
      if (nameKey) {
        if (!byName.has(nameKey)) byName.set(nameKey, []);
        byName.get(nameKey).push(row);
      }
      if (phoneKey) {
        if (!byPhone.has(phoneKey)) byPhone.set(phoneKey, []);
        byPhone.get(phoneKey).push(row);
      }
    });

    const groups = new Map();
    const addGroup = (kind, key, items) => {
      if (items.length < 2) return;
      const ids = [...new Set(items.map((item) => item.id))].sort();
      const groupKey = ids.join('|');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, { key, reason: kind, alunos: ids.map((id) => rows.find((row) => row.id === id)).filter(Boolean) });
      } else {
        const current = groups.get(groupKey);
        current.reason = current.reason.includes(kind) ? current.reason : `${current.reason} + ${kind}`;
      }
    };

    byName.forEach((items, key) => addGroup('nome', key, items));
    byPhone.forEach((items, key) => addGroup('telefone', key, items));
    return [...groups.values()].sort((a, b) => b.alunos.length - a.alunos.length);
  };

  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'operational',
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    );
  `);

  // Tabela de acesso root (suporte técnico)
  db.exec(`
    CREATE TABLE IF NOT EXISTS root_access (
      id INTEGER PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      senha_salt TEXT NOT NULL,
      senha_hash TEXT NOT NULL,
      permissoes TEXT DEFAULT 'all',
      ultimo_acesso TEXT,
      data_criacao TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed técnico apenas em desenvolvimento. Uma instalação empacotada para cliente
  // não deve nascer com uma senha root universal embutida no código.
  const ROOT_USERNAME = 'root';
  const ROOT_PASSWORD = process.env.NEXTLEVEL_ROOT_PASSWORD || (app.isPackaged ? '' : 'nextlevel-dev-root');
  
  // Migrar old root se existir
  db.prepare("UPDATE root_access SET email = ? WHERE email = 'root@nextlab.com'").run(ROOT_USERNAME);

  const existingRoot = db.prepare('SELECT id FROM root_access WHERE email = ?').get(ROOT_USERNAME);
  if (!existingRoot && ROOT_PASSWORD) {
    const rootSalt = crypto.randomBytes(16).toString('hex');
    const rootHash = scryptHash(ROOT_PASSWORD, rootSalt);
    db.prepare('INSERT INTO root_access (email, senha_salt, senha_hash, permissoes) VALUES (?, ?, ?, ?)').run(ROOT_USERNAME, rootSalt, rootHash, 'all');
  }

  // Tabela de logs técnicos (erros detalhados para suporte)
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs_tecnicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL DEFAULT 'info',
      contexto TEXT,
      mensagem TEXT NOT NULL,
      stack TEXT,
      utilizador TEXT,
      data_hora TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índice de desempenho: pesquisa de cobertura mensal por aluno
  // Necessário para o isolamento por mês (getStudentStatusForMonth)
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pagamentos_aluno_cobertura
      ON pagamentos (aluno_id, referencia_inicio, referencia_fim);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pagamentos_aluno_data
      ON pagamentos (aluno_id, data_pagamento);
    `);
  } catch(e) {}

  const ensureDefaultAdmin = () => {
    const adminEmail = 'admin@admin.com';
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (exists) return;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = scryptHash('adminadmin', salt);
    db.prepare(`
      INSERT INTO users (name, email, role, password_salt, password_hash, is_active)
      VALUES (?, ?, 'admin', ?, ?, 1)
    `).run('Admin', adminEmail, salt, hash);
    try { registrarLog('Utilizadores', `Conta admin inicial criada (${adminEmail})`); } catch(e) {}
  };

  // ensureDefaultAdmin(); // Desativado para a Fase 3 - O Setup Wizard criará o Admin

  // Inicializar configurações padrão se não existirem
  const initConfig = (chave, valor) => {
    const exists = db.prepare('SELECT 1 FROM configuracoes WHERE chave = ?').get(chave);
    if (!exists) {
      db.prepare('INSERT INTO configuracoes (chave, valor) VALUES (?, ?)').run(chave, valor);
    }
  };

  initConfig('nome_academia', 'Next Level Academia');
  initConfig('logo_path', '');
  initConfig('categorias', JSON.stringify(['Musculação', 'Cardio', 'Crossfit']));
  initConfig('morada_academia', 'Cidade da Praia, Cabo Verde');
  initConfig('email_academia', 'geral@nextlevel.cv');
  initConfig('require_operational_password', '1');
  initConfig('telefone_academia', '+238 9597220');
  initConfig('banner_academia', '');
  initConfig('desktop_notifications', '1');
  initConfig('backup_reminder_enabled', '1');
  initConfig('ultimo_backup_mes', '');
  initConfig('ultimo_alerta_backup_mes', '');
  initConfig('whatsapp_template', 'Olá, {nome}. A sua mensalidade da academia está pendente. Quando puder, regularize por favor.');
  initConfig('setup_completed', '0');
  initConfig('license_key', '');
  initConfig('license_expiry', '');
  initConfig('lembrar_utilizadores', '1');
  initConfig('permitir_guardar_sessao', '1');

  // ────────────── IPC HANDLERS ──────────────

  ipcMain.handle('get-alunos', async (event, includeDeleted = false) => {
    const query = includeDeleted ? 'SELECT * FROM alunos' : 'SELECT * FROM alunos WHERE deleted = 0';
    const stmt = db.prepare(query);
    return stmt.all();
  });

  ipcMain.handle('add-aluno', async (event, aluno) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO alunos (
          id, nome, telefone, email, sexo, data_nascimento,
          morada, alergias, objetivos, horario_preferido,
          plano, vencimento, progresso, data_matricula, categoria, modo_cobranca, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        aluno.id, aluno.nome, aluno.telefone, aluno.email, aluno.sexo,
        aluno.data_nascimento, aluno.morada, aluno.alergias, aluno.objetivos,
        aluno.horario_preferido, aluno.plano, aluno.vencimento, aluno.progresso,
        aluno.data_matricula, aluno.categoria, aluno.modo_cobranca || 'mensalidade_movel',
        aluno.status || 'ativo'
      );
      registrarLog('Matrícula', `Aluno: ${aluno.nome} (${aluno.id})`);
      return { success: true };
    } catch (err) {
      console.error('Erro ao adicionar aluno:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('get-pagamentos', async () => {
    const stmt = db.prepare(`
      SELECT p.*, a.nome FROM pagamentos p
      LEFT JOIN alunos a ON p.aluno_id = a.id
    `);
    const rows = stmt.all();
    return rows.map(row => ({
      id: row.id,
      aluno_id: row.aluno_id,
      alunoId: row.aluno_id,
      nome: row.nome,
      valor: row.valor,
      status: row.status,
      data_pagamento: row.data_pagamento,
      metodo_pagamento: row.metodo_pagamento,
      mes_referencia: row.mes_referencia,
      referencia_inicio: row.referencia_inicio,
      referencia_fim: row.referencia_fim
    }));
  });

  ipcMain.handle('update-aluno-status', async (event, alunoId, novoStatus) => {
    try {
      const stmt = db.prepare('UPDATE alunos SET status = ? WHERE id = ?');
      stmt.run(novoStatus, alunoId);
      registrarLog('Status Alterado', `Aluno ${alunoId} alterado para ${novoStatus}`);
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar status do aluno:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('delete-aluno', async (event, alunoId) => {
    const stmtDelete = db.prepare('UPDATE alunos SET deleted = 1 WHERE id = ?');
    stmtDelete.run(alunoId);
    registrarLog('Eliminação (Soft)', `Aluno ${alunoId} movido para a lixeira`);
    return { success: true };
  });

  ipcMain.handle('update-aluno-dados', async (event, aluno) => {
    try {
      const stmt = db.prepare(`
        UPDATE alunos SET
          nome = ?, telefone = ?, email = ?, sexo = ?, data_nascimento = ?,
          morada = ?, alergias = ?, objetivos = ?, horario_preferido = ?,
          plano = ?, vencimento = ?, data_matricula = ?, categoria = ?, modo_cobranca = ?
        WHERE id = ?
      `);
      stmt.run(
        aluno.nome, aluno.telefone, aluno.email, aluno.sexo, aluno.data_nascimento,
        aluno.morada, aluno.alergias, aluno.objetivos, aluno.horario_preferido,
        aluno.plano, aluno.vencimento, aluno.data_matricula, aluno.categoria, aluno.modo_cobranca || 'mensalidade_movel', aluno.id
      );
      registrarLog('Edição', `Dados atualizados para o aluno ${aluno.nome}`);
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar dados do aluno:', err);
      return { success: false, message: err.message };
    }
  });

  console.log('Registrando IPC Handler: check-auth');
  ipcMain.handle('check-auth', async (event, credenciais) => {
    try {
      const usernameOrEmail = (credenciais?.email || credenciais?.username || '').trim();
      const password = String(credenciais?.password || '');

      // Verificar credenciais root primeiro
      if (usernameOrEmail.toLowerCase() === ROOT_USERNAME.toLowerCase()) {
        const rootRecord = db.prepare('SELECT * FROM root_access WHERE email = ?').get(ROOT_USERNAME);
        if (rootRecord) {
          const computed = scryptHash(password, rootRecord.senha_salt);
          let isRootValid = false;
          try { isRootValid = crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(rootRecord.senha_hash, 'hex')); } catch(e) {}
          if (isRootValid) {
            db.prepare('UPDATE root_access SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ?').run(rootRecord.id);
            try {
              db.prepare('INSERT INTO logs_tecnicos (tipo, contexto, mensagem, utilizador) VALUES (?, ?, ?, ?)').run('login', 'check-auth', 'Acesso root ao sistema', ROOT_USERNAME);
            } catch(e) {}
            return { success: true, user: { id: 0, name: 'Root Técnico', email: ROOT_USERNAME, username: ROOT_USERNAME, role: 'root', isActive: true } };
          }
        }
        return { success: false, message: 'Credenciais root inválidas.' };
      }

      // Procurar utilizador por name ou email
      const user = db.prepare('SELECT * FROM users WHERE name = ? COLLATE NOCASE OR email = ? COLLATE NOCASE').get(usernameOrEmail, usernameOrEmail);
      
      if (!user) return { success: false, message: 'Credenciais inválidas. Verifique o nome de utilizador e a palavra-passe.' };
      if (user.is_active !== 1) return { success: false, message: 'Conta bloqueada. Fale com o administrador.' };
      
      // Verificar se exige password para operacionais
      const requirePasswordConfig = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'require_operational_password'").get();
      const requireOperationalPassword = requirePasswordConfig ? requirePasswordConfig.valor === '1' : true;
      
      let passwordValid = false;
      
      if (user.role === 'operational' && !requireOperationalPassword) {
        // Ignora a senha para operacionais se a config permitir
        passwordValid = true;
      } else {
        passwordValid = verifyPassword(password, user);
      }
      
      if (!passwordValid) return { success: false, message: 'Credenciais inválidas. Verifique o nome de utilizador e a palavra-passe.' };

      db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      try { registrarLog('Login', `Utilizador ${user.name} (${user.role}) acedeu ao sistema`); } catch(e) {}

      return {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, username: user.name, role: user.role, isActive: user.is_active === 1 }
      };
    } catch (err) {
      console.error('Erro no handler verificar-login:', err);
      return { success: false, message: `Erro interno: ${err.message}` };
    }
  });

  ipcMain.handle('users:list', async () => {
    try {
      const rows = db.prepare('SELECT id, name, email, role, is_active, created_at, last_login_at FROM users ORDER BY role DESC, name ASC').all();
      return { success: true, users: rows.map(u => ({ ...u, isActive: u.is_active === 1 })) };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('users:create', async (event, payload) => {
    try {
      const name = normalizeName(payload?.name);
      const email = normalizeEmail(payload?.email);
      const role = payload?.role === 'admin' ? 'admin' : 'operational';
      const password = String(payload?.password || '');

      if (!name || !email || !password) return { success: false, message: 'Preencha nome, email e palavra-passe.' };
      if (password.length < 6) return { success: false, message: 'A palavra-passe deve ter pelo menos 6 caracteres.' };

      const salt = crypto.randomBytes(16).toString('hex');
      const hash = scryptHash(password, salt);
      db.prepare(`
        INSERT INTO users (name, email, role, password_salt, password_hash, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(name, email, role, salt, hash);
      try { registrarLog('Utilizadores', `Conta criada: ${email} (${role})`); } catch(e) {}
      return { success: true };
    } catch (err) {
      const message = String(err.message || '');
      if (message.includes('UNIQUE') || message.toLowerCase().includes('unique')) {
        return { success: false, message: 'Já existe uma conta com esse email.' };
      }
      return { success: false, message };
    }
  });

  ipcMain.handle('users:update', async (event, payload) => {
    try {
      const id = Number(payload?.id);
      const name = normalizeName(payload?.name);
      const role = payload?.role === 'admin' ? 'admin' : 'operational';
      const isActive = payload?.isActive === false ? 0 : 1;
      if (!id || !name) return { success: false, message: 'Dados inválidos.' };

      db.prepare('UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ?').run(name, role, isActive, id);
      try { registrarLog('Utilizadores', `Conta atualizada: #${id} (${role}) ativo=${isActive}`); } catch(e) {}
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('users:set-password', async (event, payload) => {
    try {
      const id = Number(payload?.id);
      const password = String(payload?.password || '');
      if (!id || !password) return { success: false, message: 'Dados inválidos.' };
      if (password.length < 6) return { success: false, message: 'A palavra-passe deve ter pelo menos 6 caracteres.' };

      const salt = crypto.randomBytes(16).toString('hex');
      const hash = scryptHash(password, salt);
      db.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?').run(salt, hash, id);
      try { registrarLog('Utilizadores', `Password redefinida: #${id}`); } catch(e) {}
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('users:set-current', async (event, payload) => {
    currentUserName = String(payload?.name || 'Sistema');
    return { success: true };
  });

  ipcMain.handle('get-configuracoes', async () => {
    const rows = db.prepare('SELECT * FROM configuracoes').all();
    const configs = {};
    rows.forEach(row => {
      configs[row.chave] = row.valor;
    });
    // Garantir valores padrão para o tema
    if (!configs.theme_color) configs.theme_color = '#217346';
    return configs;
  });

  ipcMain.handle('update-configuracao', async (event, chave, valor) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)');
    stmt.run(chave, valor);
    return { success: true };
  });

  ipcMain.handle('get-historico-pagamentos', async (event, alunoId) => {
    const stmt = db.prepare('SELECT * FROM pagamentos WHERE aluno_id = ? ORDER BY id DESC');
    return stmt.all(alunoId);
  });

  ipcMain.handle('add-pagamento', async (event, pagamento) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO pagamentos (
          aluno_id, valor, status, data_pagamento, metodo_pagamento, mes_referencia, referencia_inicio, referencia_fim
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        pagamento.alunoId, pagamento.valor, pagamento.status,
        pagamento.data_pagamento, pagamento.metodo_pagamento, pagamento.mes_referencia,
        pagamento.referencia_inicio || null, pagamento.referencia_fim || null
      );
      registrarLog('Pagamento', `Recebido ${pagamento.valor} de ${pagamento.alunoId} via ${pagamento.metodo_pagamento}`);
      return { success: true };
    } catch (err) {
      console.error('Erro ao adicionar pagamento:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('billing:register-payment', async (event, payload) => {
    try {
      const pagamento = payload?.pagamento || payload;
      const alunoId = pagamento?.alunoId || pagamento?.aluno_id;
      if (!alunoId) return { success: false, message: 'Aluno inválido para registo de pagamento.' };

      const nextChargeDate = payload?.nextChargeDate || pagamento?.nextChargeDate || null;
      const updateStudentDue = payload?.updateStudentDue !== false;

      const tx = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT INTO pagamentos (
            aluno_id, valor, status, data_pagamento, metodo_pagamento, mes_referencia, referencia_inicio, referencia_fim
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          alunoId,
          pagamento.valor,
          pagamento.status || 'pago',
          pagamento.data_pagamento,
          pagamento.metodo_pagamento,
          pagamento.mes_referencia,
          pagamento.referencia_inicio || null,
          pagamento.referencia_fim || null
        );

        let updatedDueDate = null;
        if (updateStudentDue && nextChargeDate) {
          const aluno = db.prepare('SELECT vencimento FROM alunos WHERE id = ?').get(alunoId);
          const currentDueDate = parseAppDate(aluno?.vencimento);
          const proposedDueDate = parseAppDate(nextChargeDate);

          if (!currentDueDate || (proposedDueDate && proposedDueDate > currentDueDate)) {
            db.prepare("UPDATE alunos SET vencimento = ?, modo_cobranca = 'mensalidade_movel' WHERE id = ?").run(nextChargeDate, alunoId);
            updatedDueDate = nextChargeDate;
          }
        }

        registrarLog('Pagamento', `Recebido ${pagamento.valor} de ${alunoId} via ${pagamento.metodo_pagamento || 'N/A'}`);
        return { paymentId: result.lastInsertRowid, updatedDueDate };
      });

      const result = tx();
      return { success: true, ...result };
    } catch (err) {
      console.error('Erro ao registar pagamento transacional:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('restore-aluno', async (event, alunoId) => {
    db.prepare('UPDATE alunos SET deleted = 0 WHERE id = ?').run(alunoId);
    registrarLog('Restauro', `Aluno ${alunoId} restaurado da lixeira`);
    return { success: true };
  });

  ipcMain.handle('get-logs', async () => {
    const stmt = db.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT 500');
    return stmt.all();
  });

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Selecione a pasta',
      properties: ['openDirectory', 'createDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false };
  });

  ipcMain.handle('export-database', async (event, targetFolder) => {
    const AdmZip = require('adm-zip');
    
    let targetPath = '';
    const defaultFileName = `backup_nextlevel_${new Date().toISOString().slice(0,10).replace(/-/g, '')}_${Date.now().toString().slice(-4)}.zip`;

    if (targetFolder && fs.existsSync(targetFolder)) {
      targetPath = path.join(targetFolder, defaultFileName);
    } else {
      const result = await dialog.showSaveDialog({
        title: 'Escolha onde guardar o Backup Completo',
        defaultPath: path.join(app.getPath('desktop'), defaultFileName),
        filters: [{ name: 'Arquivo ZIP', extensions: ['zip'] }]
      });

      if (result.canceled || !result.filePath) {
        return { success: false };
      }
      targetPath = result.filePath;
    }

    try {
      const zip = new AdmZip();

      // Adicionar DB
      zip.addLocalFile(dbPath);

      // Adicionar Fotos se existirem
      const uploadDir = path.join(app.getPath('userData'), 'uploads');
      if (fs.existsSync(uploadDir)) {
        zip.addLocalFolder(uploadDir, 'uploads');
      }

      zip.writeZip(targetPath);
      registrarLog('Backup', `Sistema completo exportado para ${targetPath}`);
      return { success: true, path: targetPath };
    } catch (err) {
      console.error('Erro no backup:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('restore-backup', async () => {
    const AdmZip = require('adm-zip');

    const result = await dialog.showOpenDialog({
      title: 'Selecione o arquivo de Backup (.zip)',
      filters: [{ name: 'Backup ZIP', extensions: ['zip'] }],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      try {
        const zip = new AdmZip(result.filePaths[0]);
        const userData = app.getPath('userData');

        // Fechar conexão com DB temporariamente se necessário (better-sqlite3)
        db.close();

        zip.extractAllTo(userData, true);

        // Reabrir DB
        const Database = require('better-sqlite3');
        db = new Database(dbPath);
        try { registrarLog('Restauração', 'Backup restaurado com sucesso!'); } catch(e) {}
        return { success: true };
      } catch (err) {
        console.error('Erro no restore:', err);
        return { success: false, message: err.message };
      }
    }
    return { success: false };
  });

  ipcMain.handle('notify-system', async (event, payload) => {
    try {
      const title = payload?.title || 'Next Level Academia';
      const body = payload?.body || '';

      if (Notification.isSupported()) {
        const notification = new Notification({
          title,
          body,
          silent: false,
        });
        notification.show();
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao emitir notificação do sistema:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('export-operational-report', async (event, targetFolder) => {
    try {
      let outputDir = '';

      if (targetFolder && fs.existsSync(targetFolder)) {
        outputDir = targetFolder;
      } else {
        const result = await dialog.showOpenDialog({
          title: 'Escolha a pasta para guardar o dossier operacional',
          properties: ['openDirectory', 'createDirectory'],
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, canceled: true };
        }
        outputDir = result.filePaths[0];
      }

      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const workbook = XLSX.utils.book_new();

      const alunos = db.prepare('SELECT * FROM alunos WHERE deleted = 0 ORDER BY nome').all();
      const pagamentos = db.prepare(`
        SELECT p.*, a.nome
        FROM pagamentos p
        LEFT JOIN alunos a ON a.id = p.aluno_id
        ORDER BY p.id DESC
      `).all();
      const notas = db.prepare(`
        SELECT n.*, a.nome
        FROM notas_contacto n
        LEFT JOIN alunos a ON a.id = n.aluno_id
        ORDER BY n.id DESC
      `).all();
      const logs = db.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT 500').all();

      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(alunos), 'Alunos');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(pagamentos), 'Pagamentos');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(notas), 'Notas');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(logs), 'Logs');

      const outputPath = path.join(outputDir, `nextlevel_operacao_${stamp}.xlsx`);
      XLSX.writeFile(workbook, outputPath);

      db.prepare('INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)').run('ultimo_backup_mes', stamp);
      db.prepare('INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)').run('ultima_exportacao_operacional', outputPath);
      registrarLog('Exportação Operacional', `Dossier operacional exportado para ${outputPath}`);

      return { success: true, path: outputPath, folder: outputDir, monthKey: stamp };
    } catch (error) {
      console.error('Erro ao exportar dossier operacional:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('show-item-in-folder', async (event, targetPath) => {
    try {
      if (!targetPath) return { success: false, message: 'Caminho inválido.' };
      shell.showItemInFolder(targetPath);
      return { success: true };
    } catch (error) {
      console.error('Erro ao abrir pasta do ficheiro:', error);
      return { success: false, message: error.message };
    }
  });

  // Handlers para Fotos e Notas
  const uploadDir = path.join(app.getPath('userData'), 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

  ipcMain.handle('upload-foto', async (event, { alunoId, base64Data }) => {
    try {
      const fotoAtual = db.prepare('SELECT foto_path FROM alunos WHERE id = ?').get(alunoId);
      if (fotoAtual?.foto_path && fs.existsSync(fotoAtual.foto_path)) {
        try { fs.unlinkSync(fotoAtual.foto_path); } catch (e) {}
      }

      const fileName = `foto_${alunoId}_${Date.now()}.jpg`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
      fs.writeFileSync(filePath, buffer);

      db.prepare('UPDATE alunos SET foto_path = ? WHERE id = ?').run(filePath, alunoId);
      return { success: true, path: filePath };
    } catch (err) {
      console.error('Erro ao salvar foto:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('get-notas', async (event, alunoId) => {
    return db.prepare('SELECT * FROM notas_contacto WHERE aluno_id = ? ORDER BY data_criacao DESC').all(alunoId);
  });

  ipcMain.handle('add-nota', async (event, { alunoId, texto }) => {
    const stmt = db.prepare('INSERT INTO notas_contacto (aluno_id, texto, data_criacao) VALUES (?, ?, ?)');
    stmt.run(alunoId, texto, new Date().toLocaleString('pt-PT'));
    return { success: true };
  });

  ipcMain.handle('delete-nota', async (event, notaId) => {
    db.prepare('DELETE FROM notas_contacto WHERE id = ?').run(notaId);
    return { success: true };
  });

  ipcMain.handle('db:reset', async () => ({
    success: false,
    message: 'Reset direto desativado. Use o reset operacional com senha do administrador.',
  }));

  ipcMain.handle('db:find-duplicates', async () => {
    try {
      const groups = findDuplicateGroups();
      return { success: true, groups, totalGroups: groups.length, totalRows: groups.reduce((sum, group) => sum + group.alunos.length, 0) };
    } catch (err) {
      console.error('Erro ao procurar duplicados:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('db:delete-duplicate', async (event, payload) => {
    try {
      const alunoId = String(payload?.alunoId || payload?.id || '');
      if (!alunoId) return { success: false, message: 'Aluno inválido.' };

      const aluno = db.prepare('SELECT id, nome FROM alunos WHERE id = ? AND deleted = 0').get(alunoId);
      if (!aluno) return { success: false, message: 'Aluno não encontrado ou já removido.' };

      db.prepare('UPDATE alunos SET deleted = 1 WHERE id = ?').run(alunoId);
      registrarLog('Duplicados', `Registo duplicado movido para a lixeira: ${aluno.nome} (${aluno.id})`);
      return { success: true, groups: findDuplicateGroups() };
    } catch (err) {
      console.error('Erro ao remover duplicado:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('db:reset-operational-data', async (event, payload) => {
    try {
      if (String(payload?.confirmation || '').trim().toUpperCase() !== 'RESETAR') {
        return { success: false, message: 'Confirmação inválida. Escreva RESETAR para continuar.' };
      }

      const auth = verifyAdminPassword(payload || {});
      if (!auth.ok) return { success: false, message: auth.message };

      const tx = db.transaction(() => {
        const stats = {
          pagamentos: db.prepare('SELECT COUNT(*) as total FROM pagamentos').get().total || 0,
          notas: db.prepare('SELECT COUNT(*) as total FROM notas_contacto').get().total || 0,
          alunos: db.prepare('SELECT COUNT(*) as total FROM alunos').get().total || 0,
          logs: db.prepare('SELECT COUNT(*) as total FROM logs').get().total || 0,
        };

        db.prepare('DELETE FROM pagamentos').run();
        db.prepare('DELETE FROM notas_contacto').run();
        db.prepare('DELETE FROM alunos').run();
        db.prepare('DELETE FROM logs').run();
        return stats;
      });

      const stats = tx();
      currentUserName = auth.user.name || currentUserName;
      registrarLog('Reset Seguro', `Dados operacionais resetados por ${auth.user.name}: ${JSON.stringify(stats)}`);
      return { success: true, stats };
    } catch (err) {
      console.error('Erro no reset seguro:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('import-alunos', async (event, alunosToImport) => {
    console.log('[import-alunos] Recebidos:', Array.isArray(alunosToImport) ? alunosToImport.length : typeof alunosToImport, 'alunos');

    if (!Array.isArray(alunosToImport) || alunosToImport.length === 0) {
      return { success: false, message: 'Nenhum dado para importar.' };
    }

    const stmt = db.prepare(`
      INSERT INTO alunos (
        id, nome, telefone, email, morada,
        plano, vencimento, progresso, data_matricula, status, categoria
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inseridos = 0;
    let erros = 0;
    let ignorados = 0;
    const detalhesErro = [];
    const detalhesIgnorados = [];
    const hoje = new Date().toISOString().split('T')[0];
    const existingRows = db.prepare('SELECT id, nome, telefone FROM alunos WHERE deleted = 0').all();
    const existingNames = new Set(existingRows.map((row) => normalizeDuplicateName(row.nome)).filter(Boolean));
    const existingPhones = new Set(existingRows.map((row) => normalizeDuplicatePhone(row.telefone)).filter(Boolean));
    const importedNames = new Set();
    const importedPhones = new Set();

    // Cada aluno é inserido de forma independente para que falhas individuais
    // (ex: ID duplicado) não comprometam os restantes
    for (let i = 0; i < alunosToImport.length; i++) {
      const aluno = alunosToImport[i];
      try {
        const nomeKey = normalizeDuplicateName(aluno.nome);
        const phoneKey = normalizeDuplicatePhone(aluno.telefone);
        const isDuplicate =
          (phoneKey && (existingPhones.has(phoneKey) || importedPhones.has(phoneKey))) ||
          (nomeKey && (existingNames.has(nomeKey) || importedNames.has(nomeKey)));

        if (isDuplicate && !aluno.forceImport) {
          ignorados++;
          detalhesIgnorados.push(`${aluno.nome || `Linha ${i + 1}`}: possível duplicado por ${phoneKey && (existingPhones.has(phoneKey) || importedPhones.has(phoneKey)) ? 'telefone' : 'nome'}`);
          continue;
        }

        stmt.run(
          aluno.id,
          aluno.nome,
          aluno.telefone || '',
          aluno.email || '',
          aluno.morada || '',
          aluno.plano || '0',
          aluno.vencimento || '',
          100,
          aluno.data_matricula || hoje,
          aluno.status || 'ativo',
          aluno.categoria || 'Geral'
        );
        inseridos++;
        if (nomeKey) importedNames.add(nomeKey);
        if (phoneKey) importedPhones.add(phoneKey);
      } catch (e) {
        console.error(`[import-alunos] Erro no aluno ${i + 1} (${aluno.nome}):`, e.message);
        detalhesErro.push(`${aluno.nome}: ${e.message}`);
        erros++;
      }
    }

    console.log(`[import-alunos] Concluído: ${inseridos} inseridos, ${ignorados} ignorados, ${erros} erros`);
    try { registrarLog('Importação', `${inseridos} alunos importados, ${ignorados} duplicados ignorados (${erros} erros).`); } catch(e) {}
    return { success: true, result: { inseridos, ignorados, erros, detalhesErro, detalhesIgnorados } };
  });

  ipcMain.handle('finalizar-importados', async () => {
    try {
      const result = db.prepare("UPDATE alunos SET status = 'ativo' WHERE status = 'importado'").run();
      registrarLog('Finalização', `${result.changes} alunos importados confirmados como ativos.`);
      return { success: true, changes: result.changes };
    } catch (err) {
      console.error('[finalizar-importados] Erro:', err.message);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('refresh-app', async () => {
    const targetWindow = BrowserWindow.getFocusedWindow() || mainWindow || BrowserWindow.getAllWindows()[0];
    if (!targetWindow) {
      return { success: false, message: 'Nenhuma janela ativa encontrada.' };
    }

    const devServerUrl =
      process.env.ELECTRON_RENDERER_URL ||
      process.env.VITE_DEV_SERVER_URL ||
      process.env.VITE_DEV_SERVER;

    const forceReload = async () => {
      try {
        await targetWindow.webContents.session.clearCache();
      } catch (error) {
        console.warn('Não foi possível limpar a cache antes do refresh:', error);
      }
      targetWindow.webContents.reloadIgnoringCache();
    };

    if (devServerUrl) {
      await forceReload();
      return { success: true, mode: 'dev-reload' };
    }

    if (app.isPackaged) {
      await forceReload();
      return { success: true, mode: 'packaged-reload' };
    }

    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    try {
      await new Promise((resolve, reject) => {
        execFile(npmCommand, ['run', 'build'], { cwd: __dirname }, (error, stdout, stderr) => {
          if (stdout) console.log(stdout);
          if (stderr) console.error(stderr);
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });

      await forceReload();
      return { success: true, mode: 'build-and-reload' };
    } catch (error) {
      console.error('Erro ao atualizar a aplicação:', error);
      return { success: false, message: error.message || 'Falha ao reconstruir a aplicação.' };
    }
  });

  // ────────────── LICENSING & SETUP (FASE 3) ──────────────
  
  const LICENSES_FILE = path.join(app.getPath('home'), 'licencas.json');
  const EMPRESA_FILE = process.platform === 'win32' 
    ? path.join(process.env.LOCALAPPDATA, 'next-level-app', 'empresa.json')
    : path.join(app.getPath('userData'), 'empresa.json');
  
  // Garantir diretório para empresa.json
  const empresaDir = path.dirname(EMPRESA_FILE);
  if (!fs.existsSync(empresaDir)) fs.mkdirSync(empresaDir, { recursive: true });
  const defaultLicense = {
    licenca: "NEXTLEVEL-VITALICIO-2026",
    tipo: "vitalicio",
    email: "cliente@nextlevel.cv",
    dataEmissao: "2026-07-06",
    dataExpiracao: null,
    status: "ativa"
  };

  try {
    let licensesData = { licencas: [] };
    if (fs.existsSync(LICENSES_FILE)) {
      licensesData = JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf-8'));
      if (!Array.isArray(licensesData.licencas)) licensesData.licencas = [];
    }

    const hasDefaultLicense = licensesData.licencas.some((license) => license?.licenca === defaultLicense.licenca);
    if (!hasDefaultLicense) {
      licensesData.licencas.push(defaultLicense);
      fs.writeFileSync(LICENSES_FILE, JSON.stringify(licensesData, null, 2));
    }
  } catch (err) {
    console.error('Erro ao preparar ficheiro de licenças:', err.message);
  }

  ipcMain.handle('license:validate-external', async (event, key) => {
    try {
      if (!fs.existsSync(LICENSES_FILE)) return { success: false, message: 'Ficheiro de licenças não encontrado.' };
      const data = JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf-8'));
      const found = data.licencas.find(l => l.licenca === key);

      if (!found) return { success: false, message: 'Licença inválida.' };
      if (found.status !== 'ativa') return { success: false, message: 'Licença inativa.' };

      if (found.tipo !== 'vitalicio' && found.dataExpiracao) {
        const expiry = new Date(found.dataExpiracao);
        if (expiry < new Date()) return { success: false, message: 'Licença expirada.' };
      }

      return { success: true, license: found };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('setup:save-data', async (event, payload) => {
    try {
      // Salvar em arquivo empresa.json
      fs.writeFileSync(EMPRESA_FILE, JSON.stringify(payload, null, 2));
      
      // Também atualizar no banco de dados para redundância
      db.prepare('UPDATE configuracoes SET valor = ? WHERE chave = ?').run(payload.nomeAcademia, 'nome_academia');
      db.prepare('UPDATE configuracoes SET valor = ? WHERE chave = ?').run(payload.email, 'email_academia');
      db.prepare('UPDATE configuracoes SET valor = ? WHERE chave = ?').run(payload.telefone, 'telefone_academia');
      db.prepare('UPDATE configuracoes SET valor = ? WHERE chave = ?').run(payload.morada || '', 'morada_academia');
      db.prepare('UPDATE configuracoes SET valor = ? WHERE chave = ?').run('1', 'setup_completed');
      db.prepare('UPDATE configuracoes SET valor = ? WHERE chave = ?').run(payload.licenca, 'license_key');
      if (payload.dataExpiracao) {
        db.prepare('UPDATE configuracoes SET valor = ? WHERE chave = ?').run(payload.dataExpiracao, 'license_expiry');
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('window:resize', (event, width, height, resizable = true) => {
    if (mainWindow) {
      mainWindow.setSize(width, height);
      mainWindow.center();
      mainWindow.setResizable(resizable);
    }
  });

  ipcMain.handle('open-external', async (event, url) => {
    try {
      const parsed = new URL(String(url || ''));
      if (!['https:', 'http:', 'mailto:'].includes(parsed.protocol)) {
        return { success: false, message: 'Protocolo externo não permitido.' };
      }
      await shell.openExternal(parsed.toString());
      return { success: true };
    } catch (err) {
      return { success: false, message: 'URL externa inválida.' };
    }
  });

  // ────────────── ROOT TÉCNICO ──────────────

  ipcMain.handle('root:reset-password', async (event, payload) => {
    try {
      // Aceita userId OU email para compatibilidade retroativa
      let user;
      if (payload?.userId) {
        user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(Number(payload.userId));
      } else if (payload?.email) {
        const email = normalizeEmail(payload.email);
        user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);
      }
      const novaSenha = String(payload?.novaSenha || '');
      if (!user) return { success: false, message: 'Utilizador não encontrado.' };
      if (!novaSenha) return { success: false, message: 'Nova senha é obrigatória.' };
      if (novaSenha.length < 6) return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };

      const salt = crypto.randomBytes(16).toString('hex');
      const hash = scryptHash(novaSenha, salt);
      db.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?').run(salt, hash, user.id);
      db.prepare('INSERT INTO logs_tecnicos (tipo, contexto, mensagem, utilizador) VALUES (?, ?, ?, ?)').run('acao', 'root:reset-password', `Senha resetada para ${user.name} (${user.email})`, 'root');
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('root:update-user', async (event, payload) => {
    try {
      const userId = Number(payload?.userId);
      if (!userId) return { success: false, message: 'ID de utilizador inválido.' };

      const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(userId);
      if (!user) return { success: false, message: 'Utilizador não encontrado.' };

      const newName = String(payload?.name || '').trim();
      const newEmail = normalizeEmail(payload?.email || user.email);
      const newRole = payload?.role && ['admin', 'operational'].includes(payload.role) ? payload.role : user.role;
      const newIsActive = payload?.isActive !== undefined ? (payload.isActive ? 1 : 0) : null;

      if (!newName) return { success: false, message: 'O nome não pode estar vazio.' };
      if (!newEmail) return { success: false, message: 'O email não pode estar vazio.' };

      // Verificar duplicados (ignorando o próprio utilizador)
      const dupName = db.prepare('SELECT id FROM users WHERE name = ? AND id != ?').get(newName, userId);
      if (dupName) return { success: false, message: `Já existe um utilizador com o nome "${newName}".` };

      const dupEmail = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail, userId);
      if (dupEmail) return { success: false, message: `Já existe um utilizador com o email "${newEmail}".` };

      // Atualizar dados base
      if (newIsActive !== null) {
        db.prepare('UPDATE users SET name = ?, email = ?, role = ?, is_active = ? WHERE id = ?').run(newName, newEmail, newRole, newIsActive, userId);
      } else {
        db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?').run(newName, newEmail, newRole, userId);
      }

      // Atualizar senha se fornecida
      if (payload?.novaSenha) {
        const novaSenha = String(payload.novaSenha);
        if (novaSenha.length < 6) return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = scryptHash(novaSenha, salt);
        db.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?').run(salt, hash, userId);
      }

      db.prepare('INSERT INTO logs_tecnicos (tipo, contexto, mensagem, utilizador) VALUES (?, ?, ?, ?)').run('acao', 'root:update-user', `Dados atualizados: ${user.name} → ${newName} (${newEmail}, ${newRole})`, 'root');
      return { success: true, user: db.prepare('SELECT id, name, email, role, is_active, created_at, last_login_at FROM users WHERE id = ?').get(userId) };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('root:create-user', async (event, payload) => {
    try {
      const name = String(payload?.name || '').trim();
      const email = normalizeEmail(payload?.email || '');
      const role = payload?.role && ['admin', 'operational'].includes(payload.role) ? payload.role : 'operational';
      const senha = String(payload?.senha || '');

      if (!name) return { success: false, message: 'O nome é obrigatório.' };
      if (!email) return { success: false, message: 'O email é obrigatório.' };
      if (!senha || senha.length < 6) return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };

      const dupName = db.prepare('SELECT id FROM users WHERE name = ?').get(name);
      if (dupName) return { success: false, message: `Já existe um utilizador com o nome "${name}".` };

      const dupEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (dupEmail) return { success: false, message: `Já existe um utilizador com o email "${email}".` };

      const salt = crypto.randomBytes(16).toString('hex');
      const hash = scryptHash(senha, salt);
      const result = db.prepare('INSERT INTO users (name, email, role, password_salt, password_hash, is_active) VALUES (?, ?, ?, ?, ?, 1)').run(name, email, role, salt, hash);
      db.prepare('INSERT INTO logs_tecnicos (tipo, contexto, mensagem, utilizador) VALUES (?, ?, ?, ?)').run('acao', 'root:create-user', `Novo utilizador criado: ${name} (${email}, ${role})`, 'root');
      return { success: true, userId: result.lastInsertRowid };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('root:toggle-user-active', async (event, payload) => {
    try {
      const userId = Number(payload?.userId);
      if (!userId) return { success: false, message: 'ID inválido.' };
      const user = db.prepare('SELECT id, name, is_active FROM users WHERE id = ?').get(userId);
      if (!user) return { success: false, message: 'Utilizador não encontrado.' };
      const newState = user.is_active ? 0 : 1;
      db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newState, userId);
      db.prepare('INSERT INTO logs_tecnicos (tipo, contexto, mensagem, utilizador) VALUES (?, ?, ?, ?)').run('acao', 'root:toggle-active', `${user.name} ${newState ? 'ativado' : 'desativado'}`, 'root');
      return { success: true, isActive: newState === 1 };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('root:get-users', async () => {
    try {
      const users = db.prepare('SELECT id, name, email, role, is_active, created_at, last_login_at FROM users ORDER BY name ASC').all();
      return { success: true, users };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Login sem senha para utilizadores marcados como quick-access
  ipcMain.handle('login:quick-access', async (event, userId) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(Number(userId));
      if (!user) return { success: false, message: 'Utilizador não encontrado ou inativo.' };
      db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      try { registrarLog('Login', `Quick Access: ${user.email} (${user.role})`); } catch(e) {}
      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: true } };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('root:get-logs-tecnicos', async () => {
    try {
      const rows = db.prepare('SELECT * FROM logs_tecnicos ORDER BY id DESC LIMIT 300').all();
      return { success: true, logs: rows };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('root:log-error', async (event, payload) => {
    try {
      db.prepare('INSERT INTO logs_tecnicos (tipo, contexto, mensagem, stack, utilizador) VALUES (?, ?, ?, ?, ?)').run(
        payload?.tipo || 'erro',
        payload?.contexto || '',
        payload?.mensagem || '',
        payload?.stack || null,
        payload?.utilizador || 'sistema'
      );
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  });

  ipcMain.handle('root:export-report', async (event, tipo) => {
    try {
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const workbook = XLSX.utils.book_new();

      if (tipo === 'erros' || tipo === 'completo') {
        const erros = db.prepare("SELECT * FROM logs_tecnicos WHERE tipo = 'erro' ORDER BY id DESC LIMIT 500").all();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(erros.length ? erros : [{ info: 'Sem erros registados' }]), 'Erros');
      }

      if (tipo === 'uso' || tipo === 'completo') {
        const logsUso = db.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT 500').all();
        const alunos = db.prepare('SELECT COUNT(*) as total FROM alunos WHERE deleted = 0').get();
        const pagamentos = db.prepare('SELECT COUNT(*) as total FROM pagamentos').get();
        const configs = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'nome_academia'").get();
        const stats = [{
          academia: configs?.valor || 'N/A',
          total_alunos: alunos?.total || 0,
          total_pagamentos: pagamentos?.total || 0,
          data_relatorio: stamp,
        }];
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stats), 'Estatísticas');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(logsUso.length ? logsUso : [{ info: 'Sem logs' }]), 'Histórico');
      }

      if (tipo === 'configuracoes' || tipo === 'completo') {
        const configs = db.prepare('SELECT chave, valor FROM configuracoes').all();
        const rootInfo = db.prepare('SELECT email, ultimo_acesso, data_criacao FROM root_access').all();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(configs), 'Configurações');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rootInfo), 'Root');
      }

      const fileName = `nextlevel_relatorio_tecnico_${tipo}_${stamp}.xlsx`;
      const result = await dialog.showSaveDialog({
        title: 'Guardar Relatório Técnico',
        defaultPath: path.join(app.getPath('desktop'), fileName),
        filters: [{ name: 'Excel', extensions: ['xlsx'] }]
      });

      if (result.canceled || !result.filePath) return { success: false, canceled: true };
      XLSX.writeFile(workbook, result.filePath);
      return { success: true, path: result.filePath };
    } catch (err) {
      console.error('Erro ao exportar relatório técnico:', err);
      return { success: false, message: err.message };
    }
  });

  // Criar a janela principal
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
