// Student and Billing Types
export type StudentManualStatus = 'ativo' | 'suspenso' | 'pausado' | 'bloqueado' | 'importado' | string | undefined;

export interface Student {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  sexo?: string;
  data_nascimento?: string;
  morada?: string;
  alergias?: string;
  objetivos?: string;
  horario_preferido?: string;
  plano?: string;
  vencimento?: string;
  progresso?: number;
  data_matricula?: string;
  status?: StudentManualStatus;
  categoria?: string;
  modo_cobranca?: string;
  foto_path?: string;
  notas?: string;
  modalidade?: string;
  deleted?: number;
}

export interface Payment {
  id?: number;
  aluno_id?: string;
  alunoId?: string;
  valor?: string;
  status?: string;
  data_pagamento?: string;
  metodo_pagamento?: string;
  mes_referencia?: string;
  referencia_inicio?: string;
  referencia_fim?: string;
}

export interface BillingSummary {
  amount: number;
  coverageStart?: string;
  coverageEnd?: string;
  nextChargeDate: string;
  lastPaymentDate?: string;
  status: 'pago' | 'alerta' | 'pendente' | 'critico' | 'hoje' | 'atrasado' | 'suspenso' | 'pausado' | 'bloqueado';
  statusLabel: string;
  daysUntilCharge: number;
  overdueDays: number;
  monthsInDebt: string[];
  rating: number;
}

export interface MonthlyBillingSummary {
  status:
    | 'pago'
    | 'atrasado'
    | 'pendente'
    | 'critico'
    | 'alerta'
    | 'hoje'
    | 'futuro'
    | 'suspenso'
    | 'pausado'
    | 'bloqueado'
    | 'importado';
  statusLabel: string;
  coveringPayment?: Payment;
  daysUntilCharge: number;
  overdueDays: number;
  monthsInDebt: string[];
  rating: number;
  dayBalance: number;
  amount: number;
}

export interface Notification {
  id: string;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  tipo: 'info' | 'sucesso' | 'alerta' | 'erro';
  categoria?: 'prioritaria' | 'relatorio' | 'app';
  alunoId?: string;
}

export interface ContactNote {
  id: number;
  aluno_id: string;
  texto: string;
  data_criacao: string;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  role: 'admin' | 'operational';
  is_active?: number;
}

export interface ConfirmDialogState {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'warning' | 'primary';
  onConfirm?: () => void | Promise<void>;
}

export type FinanceQuickFilter = 'todos' | 'atrasados' | 'vence_hoje' | '7_dias' | 'cobertos';
export type StudentSortMode = 'inteligente' | 'alfabetica' | 'inscricao_recente' | 'inscricao_antiga';
export type DirectoryFilterStatus = 'todos' | 'ativos' | 'pausados' | 'bloqueados';

export interface PaymentFormState {
  valor: string;
  dataPagamento: string;
  metodo: string;
  mesReferencia?: string;
}

export interface ImportPayload {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  morada: string;
  plano: string;
  vencimento: string;
  data_matricula: string;
  categoria: string;
  status: string;
}

export interface ImportResult {
  success: boolean;
  result?: {
    inseridos: number;
    erros: number;
    detalhesErro?: string[];
  };
  message?: string;
}
