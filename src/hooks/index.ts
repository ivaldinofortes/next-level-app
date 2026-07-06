import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';
import { IPCService } from '../services/ipc';

/**
 * Hook for managing student list data
 */
export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await IPCService.getStudents();
      setStudents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar alunos';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addStudent = useCallback(async (student: Omit<Student, 'id'>) => {
    try {
      const newStudent = await IPCService.addStudent(student);
      setStudents(prev => [...prev, newStudent]);
      return newStudent;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar aluno';
      setError(message);
      throw err;
    }
  }, []);

  const updateStudent = useCallback(async (studentId: string, data: Partial<Student>) => {
    try {
      await IPCService.updateStudent(studentId, data);
      setStudents(prev =>
        prev.map(s => s.id === studentId ? { ...s, ...data } : s)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar aluno';
      setError(message);
      throw err;
    }
  }, []);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      await IPCService.deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar aluno';
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  return {
    students,
    loading,
    error,
    loadStudents,
    addStudent,
    updateStudent,
    deleteStudent,
  };
};

/**
 * Hook for managing payments
 */
export const usePayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await IPCService.getPayments();
      setPayments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar pagamentos';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const registerPayment = useCallback(async (payment: any) => {
    try {
      await IPCService.registerPayment(payment);
      await loadPayments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registar pagamento';
      setError(message);
      throw err;
    }
  }, [loadPayments]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return {
    payments,
    loading,
    error,
    loadPayments,
    registerPayment,
  };
};

/**
 * Hook for managing dialog/modal state
 */
export const useDialog = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
};

/**
 * Hook for async operations with loading/error states
 */
export const useAsync = <T,>(asyncFn: () => Promise<T>, immediate = true) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute };
};

/**
 * Hook for blinking animation (used in terminal-like interfaces)
 */
export const useBlink = (interval = 600) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setVisible(prev => !prev), interval);
    return () => clearInterval(timer);
  }, [interval]);

  return visible;
};
