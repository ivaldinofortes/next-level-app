export type StudentManualStatus = 'ativo' | 'suspenso' | 'pausado' | 'bloqueado' | 'importado' | string | undefined;

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

/** Resultado legado — mantido para compatibilidade com o mês corrente */
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

/** Resultado por mês — novo sistema de isolamento */
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
    | 'ferias'
    | 'desistente'
    | 'bloqueado'
    | 'importado'
    | 'em_dia'
    | 'vence_em_breve';
  statusLabel: string;
  /** Registo de pagamento que cobre este mês (se existir) */
  coveringPayment?: BillingPaymentLike;
  daysUntilCharge: number;
  overdueDays: number;
  /** Lista de meses com dívida */
  monthsInDebt: string[];
  rating: number;
  /** Saldo de dias: positivo = antecipado, negativo = atrasado */
  dayBalance: number;
  amount: number;
  nextChargeDate?: string;
  coverageStart?: string;
  coverageEnd?: string;
  lastPaymentDate?: string;
}

/** Entrada do histórico de saldo de dias */
export interface DayBalanceEntry {
  mesReferencia: string;
  dataPagamento: string;
  vencimentoEsperado: string;
  diasDiferenca: number; // positivo = antecipado, negativo = atrasado
}

// ─── Constantes ─────────────────────────────────────────────────────────────

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

// ─── Utilitários de data ─────────────────────────────────────────────────────

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
  if (/^\d+$/.test(normalized) && Number(normalized) < 100) return null;
  return clampToDay(fallback);
};

export const normalizeAmount = (value?: string | number | null) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const digits = String(value).replace(/[^\d]/g, '');
  return Number.parseInt(digits || '0', 10);
};

export const formatCve = (value?: string | number | null) => {
  // Separador de milhares ASCII (evita NBSP / espaços unicode do locale que “estragam” cópias)
  const n = normalizeAmount(value);
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted} CVE`;
};

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

// ─── Janela de cobertura ─────────────────────────────────────────────────────

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

// ─── Helpers internos ────────────────────────────────────────────────────────

const getStudentPayments = (studentId: string, payments: BillingPaymentLike[]) =>
  payments.filter(
    (p) => (p.aluno_id || p.alunoId) === studentId && p.status === 'pago'
  );

const getSortedStudentPayments = (studentId: string, payments: BillingPaymentLike[]) =>
  getStudentPayments(studentId, payments).sort((a, b) => {
    const aDate = parseFlexibleDate(a.referencia_fim || a.data_pagamento);
    const bDate = parseFlexibleDate(b.referencia_fim || b.data_pagamento);
    if (!aDate && !bDate) return (a.id || 0) - (b.id || 0);
    if (!aDate) return -1;
    if (!bDate) return 1;
    return aDate.getTime() - bDate.getTime();
  });

const ratingFromDebt = (monthsInDebt: number, overdueDays: number) => {
  let rating = 5;
  if (monthsInDebt > 0) rating -= monthsInDebt;
  else if (overdueDays > 0) rating -= 0.5;
  return Math.max(1, Math.min(5, rating));
};

// ─── NOVA FUNÇÃO PRINCIPAL: isolamento por mês ──────────────────────────────

/**
 * Determina o estado de pagamento de um aluno para um mês ESPECÍFICO.
 *
 * Esta função é IMUTÁVEL em relação ao tempo:
 * - Meses passados: estado determinado APENAS pelos registos de pagamentos
 *   que cobrem esse mês. O campo `vencimento` é IGNORADO para meses passados.
 * - Mês corrente: usa `vencimento` apenas quando não há pagamento registado.
 * - Meses futuros: retorna sempre 'futuro'.
 */
export const getStudentStatusForMonth = (
  student: BillingStudentLike,
  payments: BillingPaymentLike[],
  targetYear: number,
  targetMonthIndex: number,
  today: Date = new Date()
): MonthlyBillingSummary => {
  const amount = normalizeAmount(student.plano);
  const todayClean = clampToDay(today);
  const dayBalance = calculateDayBalance(student, payments).balance;

  // ── 1. Estados manuais (bloqueado, pausado, etc.) ────────────────────────
  const manualStatus = student.status;
  if (manualStatus === 'importado') {
    return { amount, status: 'importado', statusLabel: 'Aguarda revisão', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 3, dayBalance };
  }
  if (manualStatus === 'bloqueado') {
    return { amount, status: 'bloqueado', statusLabel: 'Bloqueado', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 1, dayBalance };
  }
  if (manualStatus === 'desistente') {
    return { amount, status: 'desistente', statusLabel: 'Desistente', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 2, dayBalance };
  }
  if (manualStatus === 'ferias') {
    return { amount, status: 'ferias', statusLabel: 'Férias', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 3, dayBalance };
  }
  if (manualStatus === 'suspenso') {
    return { amount, status: 'suspenso', statusLabel: 'Suspenso', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 3, dayBalance };
  }
  if (manualStatus === 'pausado') {
    return { amount, status: 'pausado', statusLabel: 'Em pausa', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 3, dayBalance };
  }

  // ── 2. Calcular janela do mês alvo ───────────────────────────────────────
  const monthStart = clampToDay(new Date(targetYear, targetMonthIndex, 1));
  const monthEnd = clampToDay(new Date(targetYear, targetMonthIndex + 1, 0));

  // ── 3. Mês futuro → sem dados ────────────────────────────────────────────
  if (monthStart > todayClean) {
    return { amount, status: 'futuro', statusLabel: 'Mês futuro', daysUntilCharge: 999, overdueDays: 0, monthsInDebt: [], rating: 5, dayBalance };
  }

  // ── 4. Aluno ainda não matriculado neste mês ─────────────────────────────
  const enrollmentDate = parseFlexibleDate(student.data_matricula);
  if (enrollmentDate && enrollmentDate > monthEnd) {
    return { amount, status: 'futuro', statusLabel: 'Não matriculado', daysUntilCharge: 999, overdueDays: 0, monthsInDebt: [], rating: 5, dayBalance };
  }

  // ── 5. Procurar pagamento que cobre este mês ─────────────────────────────
  //
  // Um pagamento cobre um mês se a sua janela de cobertura intersecta o mês:
  //   referencia_fim >= monthStart  E  referencia_inicio <= monthEnd
  //
  // Fallback para pagamentos antigos sem referencia_inicio/fim:
  //   data_pagamento no mês alvo  OU  mes_referencia textual match
  //
  const studentPaidPayments = getStudentPayments(student.id, payments);

  const coveringPayment = studentPaidPayments.find((p) => {
    const refInicio = parseFlexibleDate(p.referencia_inicio);
    const refFim = parseFlexibleDate(p.referencia_fim);

    // Estratégia principal: janela explícita
    if (refInicio && refFim) {
      return refFim >= monthStart && refInicio <= monthEnd;
    }

    // Fallback 1: data_pagamento dentro do mês
    const dataPag = parseFlexibleDate(p.data_pagamento);
    if (dataPag) {
      if (dataPag.getFullYear() === targetYear && dataPag.getMonth() === targetMonthIndex) return true;
    }

    // Fallback 2: mes_referencia textual
    if (p.mes_referencia) {
      const ref = p.mes_referencia.toLowerCase();
      if (ref.includes(MONTHS_PT[targetMonthIndex]) && ref.includes(String(targetYear))) return true;
    }

    return false;
  });

  if (coveringPayment) {
    return {
      amount,
      status: 'pago',
      statusLabel: 'Pago',
      coveringPayment,
      daysUntilCharge: 999,
      overdueDays: 0,
      monthsInDebt: [],
      rating: ratingFromDebt(0, 0),
      dayBalance,
    };
  }

  // ── 6. Sem pagamento: mês corrente → calcular com vencimento ────────────
  const isCurrentMonth =
    targetYear === todayClean.getFullYear() && targetMonthIndex === todayClean.getMonth();

  if (isCurrentMonth) {
    const dueDate = parseFlexibleDate(student.vencimento);
    const effectiveDueDate = dueDate || (enrollmentDate ? addMonthsClamped(enrollmentDate, 1) : todayClean);
    const daysUntilCharge = diffInDays(todayClean, effectiveDueDate);
    const overdueDays = daysUntilCharge < 0 ? Math.abs(daysUntilCharge) : 0;

    const monthsInDebt: string[] = [];
    if (overdueDays > 0) {
      let tempDate = new Date(effectiveDueDate);
      while (tempDate <= todayClean) {
        monthsInDebt.push(`${MONTHS_PT[tempDate.getMonth()]} ${tempDate.getFullYear()}`);
        tempDate = addMonthsClamped(tempDate, 1);
      }
    }

    let status: MonthlyBillingSummary['status'] = 'pago';
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
      status,
      statusLabel,
      daysUntilCharge,
      overdueDays,
      monthsInDebt,
      rating: ratingFromDebt(monthsInDebt.length, overdueDays),
      dayBalance,
    };
  }

  // ── 7. Mês passado sem pagamento → sempre em dívida ─────────────────────
  const overdueDays = Math.max(1, diffInDays(monthEnd, todayClean));
  return {
    amount,
    status: 'atrasado',
    statusLabel: `Não pago em ${MONTHS_PT[targetMonthIndex]}`,
    daysUntilCharge: -overdueDays,
    overdueDays,
    monthsInDebt: [`${MONTHS_PT[targetMonthIndex]} ${targetYear}`],
    rating: ratingFromDebt(1, overdueDays),
    dayBalance,
  };
};

// ─── Saldo de dias ───────────────────────────────────────────────────────────

/**
 * Calcula o saldo acumulado de dias de antecedência/atraso de um aluno.
 *
 * Para cada pagamento com referencia_inicio e data_pagamento:
 *   delta = diffInDays(data_pagamento, referencia_inicio)
 *   positivo → pagou antes do início do período (crédito)
 *   negativo → pagou depois (débito)
 */
export const calculateDayBalance = (
  student: BillingStudentLike,
  payments: BillingPaymentLike[]
): { balance: number; details: DayBalanceEntry[] } => {
  const studentPayments = getSortedStudentPayments(student.id, payments);
  const details: DayBalanceEntry[] = [];
  let balance = 0;

  for (const p of studentPayments) {
    const dataPag = parseFlexibleDate(p.data_pagamento);
    const refInicio = parseFlexibleDate(p.referencia_inicio);
    if (!dataPag || !refInicio) continue;

    const delta = diffInDays(dataPag, refInicio);
    balance += delta;
    details.push({
      mesReferencia: p.mes_referencia || '',
      dataPagamento: formatPtDate(dataPag),
      vencimentoEsperado: formatPtDate(refInicio),
      diasDiferenca: delta,
    });
  }

  return { balance, details };
};

// ─── Função legada ───────────────────────────────────────────────────────────
// Mantida para compatibilidade. Usada onde não há mês específico alvo.

export const summarizeStudentBilling = (
  student: BillingStudentLike,
  payments: BillingPaymentLike[],
  referenceDate = new Date()
): BillingSummary => {
  const amount = normalizeAmount(student.plano);
  const manualStatus = student.status;
  const today = clampToDay(referenceDate);

  if (manualStatus === 'importado') {
    return { amount, nextChargeDate: student.vencimento || formatPtDate(today), status: 'pendente', statusLabel: 'Aguarda revisão', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 3 };
  }
  if (manualStatus === 'bloqueado') {
    return { amount, nextChargeDate: student.vencimento || formatPtDate(today), status: 'bloqueado', statusLabel: 'Bloqueado', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 1 };
  }
  if (manualStatus === 'desistente') {
    return { amount, nextChargeDate: student.vencimento || formatPtDate(today), status: 'bloqueado', statusLabel: 'Desistente', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 2 };
  }
  if (manualStatus === 'ferias') {
    return { amount, nextChargeDate: student.vencimento || formatPtDate(today), status: 'pausado', statusLabel: 'Férias', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 3 };
  }
  if (manualStatus === 'suspenso') {
    return { amount, nextChargeDate: student.vencimento || formatPtDate(today), status: 'suspenso', statusLabel: 'Suspenso', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 3 };
  }
  if (manualStatus === 'pausado') {
    return { amount, nextChargeDate: student.vencimento || formatPtDate(today), status: 'pausado', statusLabel: 'Em pausa', daysUntilCharge: 0, overdueDays: 0, monthsInDebt: [], rating: 3 };
  }

  const history = getSortedStudentPayments(student.id, payments);
  const lastPayment = history[history.length - 1];

  let coverageStart = lastPayment?.referencia_inicio;
  let coverageEnd = lastPayment?.referencia_fim;
  let nextChargeDate = student.vencimento;
  const lastPaymentDate = lastPayment?.data_pagamento;

  if (lastPayment && (!coverageStart || !coverageEnd || !nextChargeDate)) {
    const generated = buildCoverageWindow(lastPayment.data_pagamento, student.vencimento);
    coverageStart = coverageStart || generated.coverageStart;
    coverageEnd = coverageEnd || generated.coverageEnd;
    nextChargeDate = nextChargeDate || generated.nextChargeDate;
  }

  if (!nextChargeDate) {
    const firstDue = parseFlexibleDate(student.data_matricula) || parseFlexibleDate(student.vencimento) || today;
    nextChargeDate = formatPtDate(firstDue);
  }

  const dueDate = parseFlexibleDate(nextChargeDate) || today;
  const daysUntilCharge = diffInDays(today, dueDate);
  const overdueDays = daysUntilCharge < 0 ? Math.abs(daysUntilCharge) : 0;

  const monthsInDebt: string[] = [];
  if (overdueDays > 0) {
    let tempDate = new Date(dueDate);
    while (tempDate < today) {
      monthsInDebt.push(`${MONTHS_PT[tempDate.getMonth()]} ${tempDate.getFullYear()}`);
      tempDate = addMonthsClamped(tempDate, 1);
    }
  }

  let rating = 5;
  if (monthsInDebt.length > 0) rating -= monthsInDebt.length;
  else if (overdueDays > 0) rating -= 0.5;
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

  return { amount, coverageStart, coverageEnd, nextChargeDate, lastPaymentDate, status, statusLabel, daysUntilCharge, overdueDays, monthsInDebt, rating };
};

// ─── isPaymentInsideMonth (compatibilidade) ──────────────────────────────────

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

