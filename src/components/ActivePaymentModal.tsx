import { CheckCircle2, Pencil, X } from 'lucide-react';
import type { Aluno } from '../types/app';
import { getAlunoNomeSeguro } from '../utils/formatting';

interface PaymentSummary {
  lastPaymentDate?: string;
  nextChargeDate?: string;
  coverageStart?: string;
  coverageEnd?: string;
}

interface ActivePaymentModalProps {
  aluno: Aluno;
  resumo?: PaymentSummary;
  onReview: (alunoId: string) => void;
  onClose: () => void;
}

export default function ActivePaymentModal({ aluno, resumo = {}, onReview, onClose }: ActivePaymentModalProps) {
  const nome = getAlunoNomeSeguro(aluno);
  const ultimoPagamento = resumo.lastPaymentDate || 'Registado';
  const proximaCobranca = resumo.nextChargeDate || aluno.vencimento || 'Sem data definida';
  const cobertura = resumo.coverageStart && resumo.coverageEnd ? `${resumo.coverageStart} até ${resumo.coverageEnd}` : 'Cobertura ativa';

  return (
    <div className="fixed inset-0 nl-modal-overlay flex items-center justify-center z-[210] p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-[460px] overflow-hidden rounded-[var(--radius-control)] border border-emerald-200 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.28)] animate-scale-in" onClick={(event) => event.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/30"><CheckCircle2 size={24} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/75">Pagamento ativo</p><h3 className="mt-0.5 text-[18px] font-black leading-tight">{nome}</h3></div></div>
            <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-white/75 transition-colors hover:bg-white/15 hover:text-white" title="Fechar"><X size={16} /></button>
          </div>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="rounded-[var(--radius-control)] border border-emerald-100 bg-emerald-50 px-4 py-3"><p className="text-[13px] font-bold leading-relaxed text-emerald-800">Este aluno está em dia. A cobrança normal só deve voltar a acontecer em <span className="font-black">{proximaCobranca}</span>.</p></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[var(--radius-compact)] border border-slate-100 bg-slate-50 px-3 py-2.5"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Cobertura</p><p className="mt-1 truncate text-[12px] font-bold text-slate-700">{cobertura}</p></div>
            <div className="rounded-[var(--radius-compact)] border border-slate-100 bg-slate-50 px-3 py-2.5"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Último pagamento</p><p className="mt-1 truncate text-[12px] font-bold text-slate-700">{ultimoPagamento}</p></div>
          </div>
          <div className="rounded-[var(--radius-control)] border border-blue-100 bg-blue-50 px-4 py-3"><p className="text-[11px] font-semibold leading-relaxed text-blue-800">Se houver algum erro no valor, mês ou registo, use Rever para abrir a cobrança normal e lançar uma correção.</p></div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button type="button" onClick={onClose} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Fechar</button>
          <button type="button" onClick={() => onReview(aluno.id)} className="nl-btn !h-10 !px-6 !text-[12px] font-black !bg-gradient-to-r !from-blue-600 !to-blue-500 !text-white !border-none !shadow-lg !shadow-blue-500/10 hover:!scale-[1.02] active:!scale-[0.98] transition-all"><Pencil size={15} /> Rever e Corrigir</button>
        </div>
      </div>
    </div>
  );
}
