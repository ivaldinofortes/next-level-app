// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { X } from 'lucide-react';
import { getStudentStatusLabel } from '../constants';
import { formatCve } from '../lib/billing';

export default function LegacyStudentProfileModal({ model }: { model: unknown }) {
  const { alunoSelecionado, resumoAlunoSelecionado, setAlunoSelecionado, abrirEdicao } = model;
  return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] w-full max-w-[560px] shadow-xl rounded-[3px] border border-[var(--border)] overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="border-b border-[var(--border)] bg-[var(--color-secondary-lighter)] px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Informações do aluno</p>
              <button
                onClick={() => setAlunoSelecionado(null)}
                className="w-8 h-8 flex items-center justify-center rounded-[3px] hover:bg-black/5 dark:hover:bg-white/10 nl-text-muted transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="flex items-center gap-4">
                {alunoSelecionado.foto_path ? (
                  <div className="w-14 h-14 rounded-[5px] overflow-hidden border border-[var(--border)]">
                    <img src={`local-resource://${alunoSelecionado.foto_path}`} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-[5px] bg-[var(--color-secondary-lighter)] flex items-center justify-center text-[18px] font-bold nl-text-muted border border-[var(--border)]">
                    {alunoSelecionado.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-[22px] font-extrabold nl-text tracking-tight truncate">{alunoSelecionado.nome}</h2>
                  <p className="text-[12px] font-medium text-[var(--text-secondary)] mt-1">
                    ID {alunoSelecionado.id.slice(-8)} • {getStudentStatusLabel(alunoSelecionado.status)}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-1">
                {[
                  { label: 'Telefone', value: alunoSelecionado.telefone || 'Sem telefone' },
                  { label: 'Email', value: alunoSelecionado.email || 'Sem email' },
                  { label: 'Plano', value: formatCve(alunoSelecionado.plano) },
                  { label: 'Próxima cobrança', value: resumoAlunoSelecionado?.nextChargeDate || '-' },
                  {
                    label: 'Cobertura',
                    value: resumoAlunoSelecionado?.coverageStart && resumoAlunoSelecionado?.coverageEnd
                      ? `${resumoAlunoSelecionado.coverageStart} até ${resumoAlunoSelecionado.coverageEnd}`
                      : 'Sem cobertura ativa'
                  },
                  { label: 'Último pagamento', value: resumoAlunoSelecionado?.lastPaymentDate || 'Ainda sem registo' },
                  {
                    label: 'Saldo de dias',
                    value: (() => {
                      const balance = resumoAlunoSelecionado?.dayBalance || 0;
                      if (balance > 0) return <span className="text-emerald-600 font-bold">+{balance} dias (Antecipado)</span>;
                      if (balance < 0) return <span className="text-red-600 font-bold">{balance} dias (Atraso)</span>;
                      return <span className="text-slate-500 font-bold">0 dias (Em dia)</span>;
                    })()
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-6 border-b border-[var(--border-light)] py-3 last:border-b-0">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)] shrink-0">{item.label}</span>
                    <span className="text-[14px] font-semibold nl-text text-right">{item.value}</span>
                  </div>
                ))}

                <div className="border-t border-[var(--border)] pt-4 mt-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Notas</p>
                  <p className="mt-2 text-[13px] nl-text leading-relaxed">
                    {alunoSelecionado.notas || 'Nenhuma nota registada para este aluno.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] bg-[var(--color-secondary-lighter)] px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => abrirEdicao(alunoSelecionado)} className="nl-btn nl-btn-ghost h-10 px-4 text-[11px] font-bold uppercase tracking-[0.12em]">
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}
