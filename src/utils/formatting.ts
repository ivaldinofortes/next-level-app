import { parseFlexibleDate } from '../lib/billing';

// Student display helpers
export const getAlunoNomeSeguro = (aluno?: { nome?: string } | null) => {
  const nome = String(aluno?.nome || '').trim();
  return nome || 'Aluno sem nome';
};

export const getAlunoIniciais = (aluno?: { nome?: string } | null) =>
  getAlunoNomeSeguro(aluno).slice(0, 2).toUpperCase();

export const getAvatarColorByName = (nome?: string) => {
  const avatarColors = [
    'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-indigo-500',
  ];
  return avatarColors[(String(nome || 'A').charCodeAt(0) || 65) % avatarColors.length];
};

/** Paleta de categoria (chips, bordas, destaques no formulário) */
export const getCategoryTone = (categoria?: string) => {
  const key = String(categoria || '').trim().toLowerCase();
  // Sem personal → azul; Com personal → verde
  if (key.includes('com personal')) {
    return {
      bg: 'color-mix(in srgb, var(--color-success) 12%, var(--bg-surface))',
      fg: 'var(--color-success)',
      border: 'color-mix(in srgb, var(--color-success) 35%, var(--border))',
      solid: '#16A34A',
    };
  }
  if (key.includes('sem personal') || !key) {
    return {
      bg: 'color-mix(in srgb, var(--color-primary) 12%, var(--bg-surface))',
      fg: 'var(--color-primary)',
      border: 'color-mix(in srgb, var(--color-primary) 35%, var(--border))',
      solid: '#2563EB',
    };
  }
  // Legado / outros
  return {
    bg: 'color-mix(in srgb, var(--color-secondary) 18%, var(--bg-surface))',
    fg: 'var(--text-secondary)',
    border: 'var(--border)',
    solid: '#64748B',
  };
};

/** Novo aluno: matriculado nos últimos `days` dias (exclui importados) */
export const isNewStudent = (
  aluno: { data_matricula?: string; status?: string } | null | undefined,
  reference: Date = new Date(),
  days = 7,
) => {
  if (!aluno) return false;
  if (aluno.status === 'importado') return false;
  const enrollment = parseFlexibleDate(aluno.data_matricula || '');
  if (!enrollment) return false;
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate()).getTime();
  const enr = new Date(enrollment.getFullYear(), enrollment.getMonth(), enrollment.getDate()).getTime();
  const diffDays = Math.floor((start - enr) / (24 * 60 * 60 * 1000));
  return diffDays >= 0 && diffDays < days;
};

// Format and parsing utilities

export const formatInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isFutureMonth = (monthIndex: number, year: number, reference = new Date()) => {
  const currentYear = reference.getFullYear();
  const currentMonth = reference.getMonth();
  return year > currentYear || (year === currentYear && monthIndex > currentMonth);
};

export const isSameMonthAndYear = (date: Date | null, monthIndex: number, year: number) =>
  !!date && date.getMonth() === monthIndex && date.getFullYear() === year;

export const getMonthKey = (monthName: string, year: number) => `${monthName}-${year}`;

// Payment and card formatting

export const getPaymentMethodMeta = (method?: string) => {
  const PAYMENT_METHOD_OPTIONS = [
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
  return PAYMENT_METHOD_OPTIONS.find((item) => item.value === method) || PAYMENT_METHOD_OPTIONS[0];
};

export const formatPaymentRecordId = (payment?: { id?: number }) =>
  payment?.id ? `PAY-${String(payment.id).padStart(6, '0')}` : 'PAY-PREVIEW';

export const buildPaymentCardNumber = (studentId?: string, paymentId?: number) => {
  const studentDigits = String(studentId || '0000').replace(/\D/g, '').slice(-4).padStart(4, '0');
  const paymentDigits = String(paymentId || 0).replace(/\D/g, '').slice(-4).padStart(4, '0');
  const checksum = String((Number(studentDigits) + Number(paymentDigits) + 1701) % 10000).padStart(4, '0');
  return `${studentDigits} ${paymentDigits} ${checksum}`;
};

// Timeline metrics

export const getTimelineMetricLabel = (summary: { status?: string; daysUntilCharge?: number; overdueDays?: number }, status?: string) => {
  const isPaused = status === 'pausado' || status === 'suspenso' || status === 'ferias';
  const isBlocked = status === 'bloqueado';
  const isQuit = status === 'desistente';

  if (isQuit) return 'Desistente';
  if (status === 'ferias') return 'Férias';
  if (isPaused) return 'Em pausa';
  if (isBlocked) return 'Bloqueado';
  if (summary.status === 'atrasado') return `${summary.overdueDays || 0}d atraso`;
  if (summary.status === 'hoje') return 'vence hoje';
  return `${Math.max(summary.daysUntilCharge || 0, 0)}d restantes`;
};

export const getTimelineMetricWidth = (summary: { status?: string; daysUntilCharge?: number; overdueDays?: number }, status?: string) => {
  const isPaused = status === 'pausado' || status === 'suspenso' || status === 'ferias';
  const isBlocked = status === 'bloqueado' || status === 'desistente';

  if (isPaused || isBlocked) return 0;
  // Em atraso: anel/barra cheios (vermelhos)
  if (summary.status === 'atrasado' || summary.status === 'hoje') {
    // Suave gradação: quanto mais dias de atraso, mais “cheio” (mín. 55%)
    const overdue = Math.max(summary.overdueDays || 0, summary.status === 'hoje' ? 0 : 1);
    if (summary.status === 'hoje') return 92;
    return Math.max(55, Math.min(100, 55 + overdue * 3));
  }
  // Em dia / no prazo: progresso pelo tempo que ainda falta (0–30 dias)
  return Math.max(6, Math.min(100, (Math.max(summary.daysUntilCharge || 0, 0) / 30) * 100));
};

export const getTimelineMetricBarClass = (summaryStatus?: string) => {
  if (summaryStatus === 'atrasado' || summaryStatus === 'hoje') return 'bg-red-500';
  if (summaryStatus === 'pago') return 'bg-emerald-500';
  return 'bg-blue-600';
};

/** Cor do anel de timeline no avatar (CSS color) */
export const getTimelineRingColor = (summaryStatus?: string, manualStatus?: string) => {
  if (manualStatus === 'desistente') return '#6d28d9'; // violeta
  if (manualStatus === 'ferias') return '#0f766e'; // teal
  if (manualStatus === 'pausado' || manualStatus === 'suspenso') return 'var(--color-warning)';
  if (manualStatus === 'bloqueado') return 'var(--color-error)';
  if (manualStatus === 'importado') return 'var(--color-warning)';
  if (summaryStatus === 'atrasado' || summaryStatus === 'hoje') return 'var(--color-error)';
  if (summaryStatus === 'pago') return 'var(--color-success)';
  if (summaryStatus === 'critico' || summaryStatus === 'pendente' || summaryStatus === 'alerta') return 'var(--color-warning)';
  return 'var(--color-primary)';
};
