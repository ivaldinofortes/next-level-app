import { describe, expect, it } from 'vitest';
import { calculateDayBalance, getStudentStatusForMonth, normalizeAmount, parseFlexibleDate } from './billing';
import { buildMonthlyPayment } from './paymentBuilder';

describe('billing', () => {
  it('normaliza valores CVE', () => {
    expect(normalizeAmount('1.500 CVE')).toBe(1500);
    expect(normalizeAmount('')).toBe(0);
  });

  it('interpreta datas portuguesas sem alterar o dia', () => {
    expect(parseFlexibleDate('29/02/2024')?.toISOString().slice(0, 10)).toBe('2024-02-29');
    expect(parseFlexibleDate('data inválida')).toBeNull();
  });

  it('marca mês passado como pago quando a cobertura o intersecta', () => {
    const result = getStudentStatusForMonth(
      { id: 'a1', plano: '1500', data_matricula: '01/01/2026' },
      [{ aluno_id: 'a1', status: 'pago', referencia_inicio: '15/01/2026', referencia_fim: '14/02/2026' }],
      2026, 1, new Date(2026, 2, 1)
    );
    expect(result.status).toBe('pago');
  });

  it('marca mês passado sem cobertura como atrasado', () => {
    const result = getStudentStatusForMonth(
      { id: 'a1', plano: '1500', data_matricula: '01/01/2026' }, [], 2026, 0, new Date(2026, 2, 1)
    );
    expect(result.status).toBe('atrasado');
    expect(result.monthsInDebt).toEqual(['janeiro 2026']);
  });

  it('calcula crédito de dias para pagamentos antecipados', () => {
    const result = calculateDayBalance(
      { id: 'a1' },
      [{ aluno_id: 'a1', status: 'pago', data_pagamento: '28/01/2026', referencia_inicio: '01/02/2026' }]
    );
    expect(result.balance).toBe(4);
  });

  it('cria pagamento com a cobertura mensal correta', () => {
    const { payment, coverage } = buildMonthlyPayment(
      { id: 'a1', nome: 'Ana', telefone: '9910000', plano: '1500', vencimento: '05/01/2026' },
      { valor: '1.800', dataPagamento: '03/02/2026', metodo: 'Dinheiro' },
      'fevereiro', 2026,
    );
    expect(payment.valor).toBe('1800');
    expect(payment.mes_referencia).toBe('Fevereiro 2026');
    expect(coverage.coverageStart).toBe('05/02/2026');
    expect(coverage.coverageEnd).toBe('04/03/2026');
  });
});
