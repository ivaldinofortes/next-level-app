import type { Student, Payment, ImportPayload, ImportResult, User } from '../types';

/**
 * Service layer for IPC communication with Electron backend
 * Centralizes all window.electron.ipcRenderer.invoke calls
 */

const electron = (window as any).electron || null;

export class IPCService {
  private static isAvailable(): boolean {
    if (!electron?.ipcRenderer) {
      console.warn('[IPC] Electron IPC not available');
      return false;
    }
    return true;
  }

  // ─── Students ────────────────────────────────────────────────────────────
  
  static async getStudents(): Promise<Student[]> {
    if (!this.isAvailable()) return [];
    try {
      const result = await electron.ipcRenderer.invoke('get-alunos');
      return result || [];
    } catch (err) {
      console.error('[IPC] Error fetching students:', err);
      throw err;
    }
  }

  static async addStudent(student: Omit<Student, 'id'>): Promise<Student> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      const result = await electron.ipcRenderer.invoke('add-aluno', student);
      return result;
    } catch (err) {
      console.error('[IPC] Error adding student:', err);
      throw err;
    }
  }

  static async updateStudent(studentId: string, data: Partial<Student>): Promise<void> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      await electron.ipcRenderer.invoke('update-aluno-dados', studentId, data);
    } catch (err) {
      console.error('[IPC] Error updating student:', err);
      throw err;
    }
  }

  static async updateStudentStatus(studentId: string, status: string): Promise<void> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      await electron.ipcRenderer.invoke('update-aluno-status', studentId, status);
    } catch (err) {
      console.error('[IPC] Error updating student status:', err);
      throw err;
    }
  }

  static async deleteStudent(studentId: string): Promise<void> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      await electron.ipcRenderer.invoke('delete-aluno', studentId);
    } catch (err) {
      console.error('[IPC] Error deleting student:', err);
      throw err;
    }
  }

  // ─── Payments ────────────────────────────────────────────────────────────

  static async getPayments(): Promise<Payment[]> {
    if (!this.isAvailable()) return [];
    try {
      const result = await electron.ipcRenderer.invoke('get-pagamentos');
      return result || [];
    } catch (err) {
      console.error('[IPC] Error fetching payments:', err);
      throw err;
    }
  }

  static async getPaymentHistory(studentId: string): Promise<Payment[]> {
    if (!this.isAvailable()) return [];
    try {
      const result = await electron.ipcRenderer.invoke('get-historico-pagamentos', studentId);
      return result || [];
    } catch (err) {
      console.error('[IPC] Error fetching payment history:', err);
      throw err;
    }
  }

  static async registerPayment(payment: Omit<Payment, 'id'>): Promise<void> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      await electron.ipcRenderer.invoke('billing:register-payment', payment);
    } catch (err) {
      console.error('[IPC] Error registering payment:', err);
      throw err;
    }
  }

  // ─── Contact Notes ───────────────────────────────────────────────────────

  static async getNotes(studentId: string): Promise<any[]> {
    if (!this.isAvailable()) return [];
    try {
      const result = await electron.ipcRenderer.invoke('get-notas', studentId);
      return result || [];
    } catch (err) {
      console.error('[IPC] Error fetching notes:', err);
      throw err;
    }
  }

  static async addNote(studentId: string, text: string): Promise<void> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      await electron.ipcRenderer.invoke('add-nota', studentId, text);
    } catch (err) {
      console.error('[IPC] Error adding note:', err);
      throw err;
    }
  }

  static async deleteNote(noteId: number): Promise<void> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      await electron.ipcRenderer.invoke('delete-nota', noteId);
    } catch (err) {
      console.error('[IPC] Error deleting note:', err);
      throw err;
    }
  }

  // ─── Import/Export ───────────────────────────────────────────────────────

  static async importStudents(payload: ImportPayload[]): Promise<ImportResult> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      const result = await electron.ipcRenderer.invoke('import-alunos', payload);
      return result;
    } catch (err) {
      console.error('[IPC] Error importing students:', err);
      throw err;
    }
  }

  static async exportDatabase(): Promise<void> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      await electron.ipcRenderer.invoke('export-database');
    } catch (err) {
      console.error('[IPC] Error exporting database:', err);
      throw err;
    }
  }

  static async selectDirectory(): Promise<string> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      const result = await electron.ipcRenderer.invoke('select-directory');
      return result;
    } catch (err) {
      console.error('[IPC] Error selecting directory:', err);
      throw err;
    }
  }

  // ─── Configuration ───────────────────────────────────────────────────────

  static async getConfig(): Promise<any> {
    if (!this.isAvailable()) return null;
    try {
      const result = await electron.ipcRenderer.invoke('get-configuracoes');
      return result;
    } catch (err) {
      console.error('[IPC] Error fetching config:', err);
      throw err;
    }
  }

  static async updateConfig(key: string, value: any): Promise<void> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      await electron.ipcRenderer.invoke('update-configuracao', key, value);
    } catch (err) {
      console.error('[IPC] Error updating config:', err);
      throw err;
    }
  }

  // ─── Logs ────────────────────────────────────────────────────────────────

  static async getLogs(): Promise<any[]> {
    if (!this.isAvailable()) return [];
    try {
      const result = await electron.ipcRenderer.invoke('get-logs');
      return result || [];
    } catch (err) {
      console.error('[IPC] Error fetching logs:', err);
      throw err;
    }
  }

  // ─── Window Controls ─────────────────────────────────────────────────────

  static async resizeWindow(width: number, height: number, center: boolean = false): Promise<void> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      await electron.ipcRenderer.invoke('window:resize', width, height, center);
    } catch (err) {
      console.error('[IPC] Error resizing window:', err);
      throw err;
    }
  }

  static async refreshApp(): Promise<void> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      await electron.ipcRenderer.invoke('refresh-app');
    } catch (err) {
      console.error('[IPC] Error refreshing app:', err);
      throw err;
    }
  }

  // ─── Root/Admin Operations ──────────────────────────────────────────────

  static async getUsers(): Promise<User[]> {
    if (!this.isAvailable()) return [];
    try {
      const result = await electron.ipcRenderer.invoke('root:get-users');
      return result?.users || [];
    } catch (err) {
      console.error('[IPC] Error fetching users:', err);
      throw err;
    }
  }

  static async createUser(user: Omit<User, 'id'> & { senha: string }): Promise<{ success: boolean; message?: string }> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      const result = await electron.ipcRenderer.invoke('root:create-user', user);
      return result;
    } catch (err) {
      console.error('[IPC] Error creating user:', err);
      throw err;
    }
  }

  static async updateUser(userId: number, data: Partial<User> & { novaSenha?: string }): Promise<{ success: boolean; message?: string }> {
    if (!this.isAvailable()) throw new Error('IPC not available');
    try {
      const result = await electron.ipcRenderer.invoke('root:update-user', { userId, ...data });
      return result;
    } catch (err) {
      console.error('[IPC] Error updating user:', err);
      throw err;
    }
  }

  static async getLogsTecnicos(): Promise<any[]> {
    if (!this.isAvailable()) return [];
    try {
      const result = await electron.ipcRenderer.invoke('root:get-logs-tecnicos');
      return result?.logs || [];
    } catch (err) {
      console.error('[IPC] Error fetching technical logs:', err);
      throw err;
    }
  }
}
