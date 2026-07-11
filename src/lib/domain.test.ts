import { describe, expect, it } from 'vitest';
import { calculateDueStatus } from './dueStatus';
import {
  isBlockedStatus,
  isImportedStatus,
  isOperationallyActive,
  isPausedStatus,
} from './studentStatus';
import { sortStudents } from '../utils/studentSorting';
import { isValidEmail, isValidPhone } from '../utils/validation';
import { buildMonthlyPayment } from './paymentBuilder';
import { buildCoverageWindow, formatPtDate, parseFlexibleDate } from './billing';
import type { Aluno } from '../types/app';

const baseAluno = (overrides: Partial<Aluno> = {}): Aluno =>
  ({
    id: 'a1',
    nome: 'Ana Silva',
    telefone: '9912345',
    plano: '1500',
    vencimento: '10/07/2026',
    data_matricula: '01/01/2026',
    status: 'ativo',
    ...overrides,
  }) as Aluno;

describe('studentStatus', () => {
  it('classifica pausado, férias e suspenso', () => {
    expect(isPausedStatus('pausado')).toBe(true);
    expect(isPausedStatus('suspenso')).toBe(true);
    expect(isPausedStatus('ferias')).toBe(true);
    expect(isPausedStatus('ativo')).toBe(false);
  });

  it('classifica bloqueado, importado e desistente (fora da contabilidade)', () => {
    expect(isBlockedStatus('bloqueado')).toBe(true);
    expect(isImportedStatus('importado')).toBe(true);
    expect(isOperationallyActive('ativo')).toBe(true);
    expect(isOperationallyActive('pausado')).toBe(false);
    expect(isOperationallyActive('bloqueado')).toBe(false);
    expect(isOperationallyActive('desistente')).toBe(false);
    expect(isOperationallyActive('ferias')).toBe(false);
  });
});

describe('calculateDueStatus', () => {
  const ref = new Date(2026, 6, 10); // 10/07/2026

  it('trata data inválida como pago (fallback seguro)', () => {
    expect(calculateDueStatus('', ref).status).toBe('pago');
    expect(calculateDueStatus('invalid', ref).status).toBe('pago');
  });

  it('marca atraso, hoje e janelas de alerta', () => {
    expect(calculateDueStatus('05/07/2026', ref).status).toBe('atrasado');
    expect(calculateDueStatus('10/07/2026', ref).status).toBe('hoje');
    expect(calculateDueStatus('12/07/2026', ref).status).toBe('critico');
    expect(calculateDueStatus('15/07/2026', ref).status).toBe('pendente');
    expect(calculateDueStatus('20/07/2026', ref).status).toBe('alerta');
    expect(calculateDueStatus('30/07/2026', ref).status).toBe('pago');
  });

  it('aceita formato ISO', () => {
    expect(calculateDueStatus('2026-07-10', ref).status).toBe('hoje');
  });
});

describe('sortStudents', () => {
  const alunos = [
    baseAluno({ id: '1', nome: 'Carlos', vencimento: '01/07/2026' }),
    baseAluno({ id: '2', nome: 'Ana', vencimento: '30/07/2026' }),
    baseAluno({ id: '3', nome: 'Bruno', status: 'bloqueado', vencimento: '01/01/2026' }),
  ];

  const due = (d: string) => calculateDueStatus(d, new Date(2026, 6, 10));

  it('ordena alfabeticamente', () => {
    const result = sortStudents(alunos, 'alfabetica', due);
    expect(result.map((a) => a.nome)).toEqual(['Ana', 'Bruno', 'Carlos']);
  });

  it('prioriza atrasados e deixa bloqueados no fim da prioridade', () => {
    const result = sortStudents(alunos, 'inteligente', due);
    expect(result[0].nome).toBe('Carlos');
    expect(result[result.length - 1].nome).toBe('Bruno');
  });
});

describe('validation', () => {
  it('valida email e telefone', () => {
    expect(isValidEmail('a@b.cv')).toBe(true);
    expect(isValidEmail('x')).toBe(false);
    expect(isValidPhone('+238 991 22 33')).toBe(true);
    expect(isValidPhone('abc')).toBe(false);
  });
});

describe('paymentBuilder + coverage', () => {
  it('gera cobertura de 1 mês a partir do vencimento do aluno', () => {
    const aluno = baseAluno({ vencimento: '05/01/2026' });
    const { payment, coverage } = buildMonthlyPayment(
      aluno,
      { valor: '1500', dataPagamento: '03/02/2026', metodo: 'Transferência' },
      'fevereiro',
      2026,
    );
    expect(payment.alunoId).toBe('a1');
    expect(payment.metodo_pagamento).toBe('Transferência');
    expect(payment.status).toBe('pago');
    expect(coverage.coverageStart).toBe('05/02/2026');
    expect(coverage.coverageEnd).toBe('04/03/2026');
  });

  it('buildCoverageWindow antecipa início se pagamento for antes do vencimento', () => {
    const window = buildCoverageWindow('01/03/2026', '10/03/2026');
    expect(window.coverageStart).toBe('10/03/2026');
    expect(parseFlexibleDate(window.coverageEnd)?.getTime()).toBeLessThan(
      parseFlexibleDate(window.nextChargeDate)?.getTime() || 0,
    );
    expect(formatPtDate(parseFlexibleDate(window.nextChargeDate)!)).toBe(window.nextChargeDate);
  });
});
