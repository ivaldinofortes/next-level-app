// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { getStudentStatusLabel } from '../constants';
import { formatCve } from '../lib/billing';
import AppModalShell from './AppModalShell';

export default function LegacyStudentProfileModal({ model }: { model: unknown }) {
  const { alunoSelecionado, resumoAlunoSelecionado, setAlunoSelecionado, abrirEdicao } = model;
  const fechar = () => setAlunoSelecionado(null);

  return (
    <AppModalShell
      title={alunoSelecionado.nome}
      subtitle={`ID ${alunoSelecionado.id.slice(-8)} · ${getStudentStatusLabel(alunoSelecionado.status)}`}
      onClose={fechar}
      maxWidth="max-w-[560px]"
      zIndex={100}
      hideBrand
      accent="var(--color-primary)"
      footer={(
        <button type="button" onClick={() => abrirEdicao(alunoSelecionado)} className="nl-btn nl-btn-primary !h-10">
          Editar
        </button>
      )}
    >
      <div className="space-y-4 px-6 py-5">
        <div className="flex items-center gap-4">
          {alunoSelecionado.foto_path ? (
            <div className="h-14 w-14 overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)]">
              <img src={`local-resource://${alunoSelecionado.foto_path}`} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--color-secondary-lighter)] text-[18px] font-bold nl-text-muted">
              {alunoSelecionado.nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-[20px] font-bold tracking-tight nl-text">{alunoSelecionado.nome}</h2>
            <p className="mt-1 text-[12px] font-medium nl-text-muted">
              {alunoSelecionado.categoria || 'Geral'} · {alunoSelecionado.telefone || 'Sem telefone'}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {[
            { label: 'Telefone', value: alunoSelecionado.telefone || 'Sem telefone' },
            { label: 'Email', value: alunoSelecionado.email || 'Sem email' },
            { label: 'Plano', value: formatCve(alunoSelecionado.plano) },
            { label: 'Próxima cobrança', value: resumoAlunoSelecionado?.nextChargeDate || '-' },
            {
              label: 'Cobertura',
              value:
                resumoAlunoSelecionado?.coverageStart && resumoAlunoSelecionado?.coverageEnd
                  ? `${resumoAlunoSelecionado.coverageStart} até ${resumoAlunoSelecionado.coverageEnd}`
                  : 'Sem cobertura ativa',
            },
            { label: 'Último pagamento', value: resumoAlunoSelecionado?.lastPaymentDate || 'Ainda sem registo' },
            {
              label: 'Saldo de dias',
              value: (() => {
                const balance = resumoAlunoSelecionado?.dayBalance || 0;
                if (balance > 0) return <span className="font-bold text-emerald-600">+{balance} dias (Antecipado)</span>;
                if (balance < 0) return <span className="font-bold text-red-600">{balance} dias (Atraso)</span>;
                return <span className="font-bold text-slate-500">0 dias (Em dia)</span>;
              })(),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-6 border-b border-[var(--border-light)] py-3 last:border-b-0"
            >
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] nl-text-muted">{item.label}</span>
              <span className="text-right text-[14px] font-semibold nl-text">{item.value}</span>
            </div>
          ))}

          <div className="mt-2 border-t border-[var(--border)] pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] nl-text-muted">Notas</p>
            <p className="mt-2 text-[13px] leading-relaxed nl-text">
              {alunoSelecionado.notas || 'Nenhuma nota registada para este aluno.'}
            </p>
          </div>
        </div>
      </div>
    </AppModalShell>
  );
}
