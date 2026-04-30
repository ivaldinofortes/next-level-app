const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

// 1. Inicializar o Banco de Dados
const db = new Database('academia.db');

// 2. Criar Tabelas se não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS alunos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    plano TEXT,
    vencimento TEXT,
    progresso INTEGER DEFAULT 100,
    telefone TEXT,
    status TEXT DEFAULT 'ativo'
  );

  CREATE TABLE IF NOT EXISTS pagamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alunoId TEXT,
    valor TEXT,
    status TEXT,
    data TEXT,
    FOREIGN KEY(alunoId) REFERENCES alunos(id)
  );
`);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  win.loadURL('http://localhost:3000' );
}

app.whenReady().then(createWindow);

// --- HANDLERS IPC (A Ponte entre React e SQLite) ---

// Obter todos os alunos
ipcMain.handle('get-alunos', () => {
  return db.prepare('SELECT * FROM alunos').all();
});

// Adicionar novo aluno
ipcMain.handle('add-aluno', (event, aluno) => {
  const stmt = db.prepare('INSERT INTO alunos (id, nome, plano, vencimento, progresso, telefone) VALUES (?, ?, ?, ?, ?, ?)');
  return stmt.run(aluno.id, aluno.nome, aluno.plano, aluno.vencimento, aluno.progresso, aluno.telefone);
});

// Obter pagamentos
ipcMain.handle('get-pagamentos', () => {
  return db.prepare('SELECT * FROM pagamentos').all();
});

// Registar pagamento
ipcMain.handle('update-pagamento', (event, { alunoId, status }) => {
  const stmt = db.prepare('UPDATE pagamentos SET status = ? WHERE alunoId = ?');
  return stmt.run(status, alunoId);
});