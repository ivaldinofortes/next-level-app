/**
 * Database Models and Repository Pattern for Electron Backend
 * This file should replace inline queries in main.cjs
 */

export interface Database {
  prepare: (sql: string) => any;
  exec: (sql: string) => void;
  close: () => void;
}

export class StudentRepository {
  constructor(private db: Database) {}

  findAll() {
    const stmt = this.db.prepare('SELECT * FROM alunos WHERE deleted = 0');
    return stmt.all();
  }

  findById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM alunos WHERE id = ? AND deleted = 0');
    return stmt.get(id);
  }

  findByEmail(email: string) {
    const stmt = this.db.prepare('SELECT * FROM alunos WHERE email = ? AND deleted = 0');
    return stmt.get(email);
  }

  create(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO alunos (
        id, nome, telefone, email, sexo, data_nascimento, morada, alergias,
        objetivos, horario_preferido, plano, vencimento, data_matricula,
        status, categoria, modo_cobranca, foto_path, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.id, data.nome, data.telefone, data.email || null, data.sexo || null,
      data.data_nascimento || null, data.morada || null, data.alergias || null,
      data.objetivos || null, data.horario_preferido || null, data.plano || null,
      data.vencimento || null, data.data_matricula || new Date().toISOString().split('T')[0],
      data.status || 'ativo', data.categoria || 'Geral', data.modo_cobranca || 'mensalidade_movel',
      data.foto_path || null, data.notas || null
    );

    return this.findById(data.id);
  }

  update(id: string, data: any) {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'deleted') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) return;

    values.push(id);
    const sql = `UPDATE alunos SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(...values);
  }

  softDelete(id: string) {
    const stmt = this.db.prepare('UPDATE alunos SET deleted = 1 WHERE id = ?');
    stmt.run(id);
  }

  delete(id: string) {
    const stmt = this.db.prepare('DELETE FROM alunos WHERE id = ?');
    stmt.run(id);
  }
}

export class PaymentRepository {
  constructor(private db: Database) {}

  findAll() {
    const stmt = this.db.prepare('SELECT * FROM pagamentos ORDER BY data_pagamento DESC');
    return stmt.all();
  }

  findByStudentId(studentId: string) {
    const stmt = this.db.prepare('SELECT * FROM pagamentos WHERE aluno_id = ? ORDER BY data_pagamento DESC');
    return stmt.all(studentId);
  }

  create(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO pagamentos (
        aluno_id, valor, status, data_pagamento, metodo_pagamento,
        mes_referencia, referencia_inicio, referencia_fim
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.aluno_id,
      data.valor,
      data.status || 'pendente',
      data.data_pagamento || new Date().toLocaleString('pt-PT'),
      data.metodo_pagamento || 'Dinheiro',
      data.mes_referencia || null,
      data.referencia_inicio || null,
      data.referencia_fim || null
    );

    return stmt.db.prepare('SELECT * FROM pagamentos WHERE id = last_insert_rowid()').get();
  }

  update(id: number, data: any) {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) return;

    values.push(id);
    const sql = `UPDATE pagamentos SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(...values);
  }

  delete(id: number) {
    const stmt = this.db.prepare('DELETE FROM pagamentos WHERE id = ?');
    stmt.run(id);
  }
}

export class LogRepository {
  constructor(private db: Database) {}

  findAll() {
    const stmt = this.db.prepare('SELECT * FROM logs ORDER BY data_hora DESC LIMIT 1000');
    return stmt.all();
  }

  create(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO logs (acao, detalhes, data_hora, user_name)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      data.acao,
      data.detalhes || null,
      new Date().toLocaleString('pt-PT'),
      data.user_name || 'Sistema'
    );
  }
}

export class UserRepository {
  constructor(private db: Database) {}

  findAll() {
    const stmt = this.db.prepare('SELECT id, name, email, role, is_active FROM users');
    return stmt.all();
  }

  findById(id: number) {
    const stmt = this.db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?');
    return stmt.get(id);
  }

  findByEmail(email: string) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  create(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO users (name, email, role, password_salt, password_hash, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    stmt.run(data.name, data.email, data.role || 'operational', data.password_salt, data.password_hash);
    return this.findByEmail(data.email);
  }

  update(id: number, data: any) {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) return;

    values.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(...values);
  }
}

export class ConfigRepository {
  constructor(private db: Database) {}

  get(key: string) {
    const stmt = this.db.prepare('SELECT valor FROM configuracoes WHERE chave = ?');
    const result = stmt.get(key);
    return result?.valor || null;
  }

  set(key: string, value: string) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)
    `);
    stmt.run(key, value);
  }

  getAll() {
    const stmt = this.db.prepare('SELECT chave, valor FROM configuracoes');
    return stmt.all();
  }
}

/**
 * Factory class to initialize all repositories
 */
export class RepositoryFactory {
  private students: StudentRepository;
  private payments: PaymentRepository;
  private logs: LogRepository;
  private users: UserRepository;
  private config: ConfigRepository;

  constructor(db: Database) {
    this.students = new StudentRepository(db);
    this.payments = new PaymentRepository(db);
    this.logs = new LogRepository(db);
    this.users = new UserRepository(db);
    this.config = new ConfigRepository(db);
  }

  get Students() {
    return this.students;
  }

  get Payments() {
    return this.payments;
  }

  get Logs() {
    return this.logs;
  }

  get Users() {
    return this.users;
  }

  get Config() {
    return this.config;
  }
}
