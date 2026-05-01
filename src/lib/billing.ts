export type StudentManualStatus = 'ativo' | 'suspenso' | 'pausado' | 'bloqueado' | string | undefined;

export interface BillingStudentLike {
  id: string;
  plano?: string;
  status?: StudentManualStatus;
  vencimento?: string;
  data_matricula?: string;
}

export interface BillingPaymentLike {
  id?: number;
  alunoId?: string;
  aluno_id?: string;
  valor?: string;
  status?: string;
  data_pagamento?: string;
  referencia_inicio?: string;
  referencia_fim?: string;
  mes_referencia?: string;
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
  rating: number; // 1-5
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const clampToDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const formatPtDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

export const parseFlexibleDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;

  const normalized = String(dateStr).trim();
  if (!normalized) return null;

  if (normalized.includes('/')) {
    const [day, month, year] = normalized.split('/').map(Number);
    if (!day || !month || !year) return null;
    return clampToDay(new Date(year, month - 1, day));
  }

  if (normalized.includes('-')) {
    const [year, month, day] = normalized.split('-').map(Number);
    if (!day || !month || !year) return null;
    return clampToDay(new Date(year, month - 1, day));
  }

  const fallback = new Date(normalized);
  if (Number.isNaN(fallback.getTime())) return null;
  return clampToDay(fallback);
};

export const normalizeAmount = (value?: string | number | null) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const digits = String(value).replace(/[^\d]/g, '');
  return Number.parseInt(digits || '0', 10);
};

export const formatCve = (value?: string | number | null) =>
  `${normalizeAmount(value).toLocaleString('pt-PT')} CVE`;

const addMonthsClamped = (date: Date, months: number) => {
  const source = clampToDay(date);
  const targetMonth = new Date(source.getFullYear(), source.getMonth() + months, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();

  return clampToDay(
    new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(source.getDate(), lastDay))
  );
};

const addDays = (date: Date, days: number) => {
  const result = clampToDay(date);
  result.setDate(result.getDate() + days);
  return result;
};

const diffInDays = (fromDate: Date, toDate: Date) => {
  const from = clampToDay(fromDate).getTime();
  const to = clampToDay(toDate).getTime();
  return Math.ceil((to - from) / MS_PER_DAY);
};

export const buildCoverageWindow = (paymentDateStr?: string, currentDueDateStr?: string) => {
  const today = clampToDay(new Date());
  const paymentDate = parseFlexibleDate(paymentDateStr) || today;
  const dueDate = parseFlexibleDate(currentDueDateStr);

  const effectiveStart = dueDate && dueDate > paymentDate ? dueDate : paymentDate;
  const nextChargeDate = addMonthsClamped(effectiveStart, 1);
  const coverageEnd = addDays(nextChargeDate, -1);

  return {
    coverageStart: formatPtDate(effectiveStart),
    coverageEnd: formatPtDate(coverageEnd),
    nextChargeDate: formatPtDate(nextChargeDate),
    monthReference: `${MONTHS_PT[effectiveStart.getMonth()]} ${effectiveStart.getFullYear()}`,
  };
};

const getSortedStudentPayments = (
  studentId: string,
  payments: BillingPaymentLike[]
) =>
  payments
    .filter((payment) => (payment.aluno_id || payment.alunoId) === studentId && payment.status === 'pago')
    .sort((left, right) => {
      const leftDate = parseFlexibleDate(left.referencia_fim || left.data_pagamento);
      const rightDate = parseFlexibleDate(right.referencia_fim || right.data_pagamento);

      if (!leftDate && !rightDate) return (left.id || 0) - (right.id || 0);
      if (!leftDate) return -1;
      if (!rightDate) return 1;
      return leftDate.getTime() - rightDate.getTime();
    });

export const summarizeStudentBilling = (
  student: BillingStudentLike,
  payments: BillingPaymentLike[],
  referenceDate = new Date()
): BillingSummary => {
  const amount = normalizeAmount(student.plano);
  const manualStatus = student.status;

  if (manualStatus === 'bloqueado') {
    return {
      amount,
      nextChargeDate: student.vencimento || formatPtDate(referenceDate),
      status: 'bloqueado',
      statusLabel: 'Bloqueado',
      daysUntilCharge: 0,
      overdueDays: 0,
      monthsInDebt: [],
      rating: 1,
    };
  }

  if (manualStatus === 'suspenso') {
    return {
      amount,
      nextChargeDate: student.vencimento || formatPtDate(referenceDate),
      status: 'suspenso',
      statusLabel: 'Suspenso',
      daysUntilCharge: 0,
      overdueDays: 0,
      monthsInDebt: [],
      rating: 3,
    };
  }

  if (manualStatus === 'pausado') {
    return {
      amount,
      nextChargeDate: student.vencimento || formatPtDate(referenceDate),
      status: 'pausado',
      statusLabel: 'Em pausa',
      daysUntilCharge: 0,
      overdueDays: 0,
      monthsInDebt: [],
      rating: 3,
    };
  }

  const history = getSortedStudentPayments(student.id, payments);
  const lastPayment = history[history.length - 1];

  let coverageStart = lastPayment?.referencia_inicio;
  let coverageEnd = lastPayment?.referencia_fim;
  let nextChargeDate = student.vencimento;
  let lastPaymentDate = lastPayment?.data_pagamento;

  if (lastPayment && (!coverageStart || !coverageEnd || !nextChargeDate)) {
    const generated = buildCoverageWindow(lastPayment.data_pagamento, student.vencimento);
    coverageStart = coverageStart || generated.coverageStart;
    coverageEnd = coverageEnd || generated.coverageEnd;
    nextChargeDate = nextChargeDate || generated.nextChargeDate;
  }

  if (!nextChargeDate) {
    const firstDue = parseFlexibleDate(student.data_matricula) || parseFlexibleDate(student.vencimento) || clampToDay(referenceDate);
    nextChargeDate = formatPtDate(firstDue);
  }

  const dueDate = parseFlexibleDate(nextChargeDate) || clampToDay(referenceDate);
  const daysUntilCharge = diffInDays(referenceDate, dueDate);
  const overdueDays = daysUntilCharge < 0 ? Math.abs(daysUntilCharge) : 0;

  // Calculate multiple months in debt
  const monthsInDebt: string[] = [];
  if (overdueDays > 0) {
    let tempDate = new Date(dueDate);
    while (tempDate < referenceDate) {
      monthsInDebt.push(`${MONTHS_PT[tempDate.getMonth()]} ${tempDate.getFullYear()}`);
      tempDate = addMonthsClamped(tempDate, 1);
    }
  }

  // Calculate Rating (1-5)
  // Logic: Starts at 5, drops by 0.5 for each week of total historical delay or current debt
  let rating = 5;
  if (monthsInDebt.length > 0) {
    rating -= monthsInDebt.length;
  } else if (overdueDays > 0) {
    rating -= 0.5;
  }
  // Clamp rating
  rating = Math.max(1, Math.min(5, rating));

  let status: BillingSummary['status'] = 'pago';
  let statusLabel = 'Pago';

  if (daysUntilCharge < 0) {
    status = 'atrasado';
    statusLabel = overdueDays === 1 ? '1 dia em atraso' : `${overdueDays} dias em atraso`;
  } else if (daysUntilCharge === 0) {
    status = 'hoje';
    statusLabel = 'Vence hoje';
  } else if (daysUntilCharge <= 3) {
    status = 'critico';
    statusLabel = `Vence em ${daysUntilCharge} dias`;
  } else if (daysUntilCharge <= 7) {
    status = 'pendente';
    statusLabel = `Vence em ${daysUntilCharge} dias`;
  } else if (daysUntilCharge <= 15) {
    status = 'alerta';
    statusLabel = `Vence em ${daysUntilCharge} dias`;
  }

  return {
    amount,
    coverageStart,
    coverageEnd,
    nextChargeDate,
    lastPaymentDate,
    status,
    statusLabel,
    daysUntilCharge,
    overdueDays,
    monthsInDebt,
    rating,
  };
};

export const isPaymentInsideMonth = (
  payment: BillingPaymentLike,
  targetMonthName: string,
  targetYear: number
) => {
  const paymentDate = parseFlexibleDate(payment.data_pagamento);
  if (paymentDate) {
    return paymentDate.getMonth() === MONTHS_PT.indexOf(targetMonthName) && paymentDate.getFullYear() === targetYear;
  }

  const ref = (payment.mes_referencia || '').toLowerCase();
  return ref.includes(targetMonthName) && ref.includes(String(targetYear));
};
