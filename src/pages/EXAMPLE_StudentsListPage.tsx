import React, { useState } from 'react';
import type { Student } from '../types';
import { PageHeader, Loading, ErrorAlert } from '../components/UI';
import { useStudents, useDialog } from '../hooks';
import { Msg } from '../components/Dialog';

/**
 * EXEMPLO: Página de Lista de Alunos
 * 
 * Este é um exemplo completo de como criar uma página seguindo a nova arquitetura.
 * Use este arquivo como template para novas páginas.
 */

export const StudentsListExample: React.FC = () => {
  // ─── Estado da página ────────────────────────────────────────────────────
  const { students, loading, error, deleteStudent, addStudent } = useStudents();
  const [searchInput, setSearchInput] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const newStudentDialog = useDialog();

  // ─── Funções de lógica ───────────────────────────────────────────────────

  const filteredStudents = students.filter(student =>
    student.nome.toLowerCase().includes(searchInput.toLowerCase()) ||
    student.telefone.includes(searchInput)
  );

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Tem a certeza que deseja apagar este aluno?')) return;

    try {
      await deleteStudent(studentId);
      setSuccessMsg('Aluno apagado com sucesso');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Erro ao apagar aluno: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    try {
      await addStudent({
        nome: formData.get('nome') as string,
        telefone: formData.get('telefone') as string,
        email: formData.get('email') as string,
        plano: formData.get('plano') as string,
        vencimento: formData.get('vencimento') as string,
        data_matricula: new Date().toISOString().split('T')[0],
        status: 'ativo',
        categoria: 'Geral',
      });

      setSuccessMsg('Aluno adicionado com sucesso');
      newStudentDialog.close();
      (e.currentTarget as HTMLFormElement).reset();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Erro ao adicionar aluno: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // ─── Renderização ───────────────────────────────────────────────────────

  if (loading) return <Loading fullScreen />;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Cabeçalho */}
      <PageHeader
        title="Diretório de Alunos"
        subtitle={`${students.length} alunos cadastrados`}
        action={{
          label: 'Novo Aluno',
          onClick: newStudentDialog.open,
        }}
      />

      {/* Alertas */}
      {error && <ErrorAlert message={error} />}
      {successMsg && <Msg ok={true} texto={successMsg} />}

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col gap-4 p-6">
        {/* Barra de busca */}
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Lista */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchInput ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto">
            {filteredStudents.map(student => (
              <StudentCardExample
                key={student.id}
                student={student}
                onDelete={() => handleDeleteStudent(student.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal: Novo Aluno */}
      {newStudentDialog.isOpen && (
        <NewStudentDialogExample
          onClose={newStudentDialog.close}
          onSubmit={handleAddStudent}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

interface StudentCardProps {
  student: Student;
  onDelete: () => void;
}

const StudentCardExample: React.FC<StudentCardProps> = ({ student, onDelete }) => {
  const statusColor = {
    ativo: 'bg-green-100 text-green-800',
    pausado: 'bg-yellow-100 text-yellow-800',
    bloqueado: 'bg-red-100 text-red-800',
  }[student.status || 'ativo'] || 'bg-slate-100 text-slate-800';

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-slate-900">{student.nome}</h3>
        <p className="text-sm text-slate-600">{student.telefone}</p>
        {student.email && <p className="text-sm text-slate-600">{student.email}</p>}
      </div>

      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {student.status || 'ativo'}
        </span>
        <button
          onClick={onDelete}
          className="px-3 py-1 text-red-600 hover:text-red-700 font-semibold text-sm"
        >
          Apagar
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

interface NewStudentDialogProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const NewStudentDialogExample: React.FC<NewStudentDialogProps> = ({ onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div className="w-full max-w-[500px] bg-white rounded-lg shadow-2xl p-6">
        <h2 className="text-xl font-bold mb-4 text-slate-900">Novo Aluno</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              name="nome"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              name="telefone"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 9597220"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: joao@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Valor Plano (CVE)
            </label>
            <input
              type="number"
              name="plano"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 15000"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Vencimento (DD/MM/YYYY)
            </label>
            <input
              type="text"
              name="vencimento"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 15/07/2026"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentsListExample;
