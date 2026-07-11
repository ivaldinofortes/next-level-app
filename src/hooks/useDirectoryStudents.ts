import { useMemo } from 'react';
import { isBlockedStatus, isOperationallyActive, isPausedStatus } from '../lib/studentStatus';
import type { Aluno, DirectoryFilterStatus, StudentSortMode } from '../types/app';

export function useDirectoryStudents(students: Aluno[], filter: DirectoryFilterStatus, query: string, sort: StudentSortMode, sortStudents: (students: Aluno[], mode: StudentSortMode) => Aluno[]) {
  return useMemo(() => sortStudents(students.filter((student) => {
    const statusMatch = filter === 'todos' ? !isBlockedStatus(student.status)
      : filter === 'ativos' ? isOperationallyActive(student.status)
      : filter === 'pausados' ? isPausedStatus(student.status)
      : isBlockedStatus(student.status);
    const term = query.trim().toLowerCase();
    const queryMatch = !term || student.nome.toLowerCase().includes(term) || (student.telefone || '').toLowerCase().includes(term) || (student.email || '').toLowerCase().includes(term) || String(student.id).toLowerCase().includes(term);
    return statusMatch && queryMatch;
  }), sort), [students, filter, query, sort, sortStudents]);
}
