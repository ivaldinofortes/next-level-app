import type { Student } from './index';

export type Aluno = Student;

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  tipo: 'info' | 'sucesso' | 'alerta' | 'erro';
  categoria?: 'prioritaria' | 'relatorio' | 'app';
  alunoId?: string;
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

export interface Nota {
  id: number;
  aluno_id: string;
  texto: string;
  data_criacao: string;
}

export interface NotaRecente extends Nota {
  nome?: string;
  telefone?: string;
  categoria?: string;
}

export interface NotaResumo {
  aluno_id: string;
  total: number;
  ultimo_id?: number;
}

export interface Pagamento {
  id?: number;
  alunoId: string;
  aluno_id?: string;
  nome?: string;
  valor: string;
  status: 'pago' | 'pendente';
  data_pagamento?: string;
  metodo_pagamento?: string;
  mes_referencia?: string;
  referencia_inicio?: string;
  referencia_fim?: string;
}
