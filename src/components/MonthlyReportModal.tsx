// @ts-nocheck -- Legacy report controller will receive strict typing in the next decomposition pass.
import { AlertCircle, CheckCircle2, CreditCard, FileSpreadsheet, UserPlus } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';
import { formatCve, normalizeAmount, parseFlexibleDate } from '../lib/billing';
import AppModalShell from './AppModalShell';

export default function MonthlyReportModal({ model }: { model: unknown }) {
  const { appLogo, mesFinanceiro, anoFinanceiro, totalRecebidoPeriodo, alunosComPagamentoEmDia, alunosEmDivida, alunos, pagamentosDoPeriodo, setMostrarRelatorioMensal, exportarFinancasExcel, showToast, obterTomPastel } = model;
  return (
    <AppModalShell
      title={`Relatório · ${mesFinanceiro} ${anoFinanceiro}`}
      subtitle="Estatísticas e fecho de mensalidades"
      onClose={() => setMostrarRelatorioMensal(false)}
      appLogo={appLogo || APP_ICON_PATH}
      maxWidth="max-w-[850px]"
      zIndex={120}
      accent="#c64600"
      footer={(
        <>
          <button type="button" onClick={() => setMostrarRelatorioMensal(false)} className="nl-btn nl-btn-secondary !h-9">Fechar</button>
          <button type="button" onClick={async () => { await exportarFinancasExcel(); showToast('Exportado para Excel'); }} className="nl-btn !h-9 !bg-emerald-600 !text-white !border-emerald-700 hover:!bg-emerald-700">
            <FileSpreadsheet size={14} /> Exportar Excel
          </button>
        </>
      )}
    >
              <div className="flex flex-col gap-6 p-6">
                 {/* Cards Resumo */}
                 <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Total Recebido', value: normalizeAmount(totalRecebidoPeriodo).toLocaleString(), suffix: 'CVE', color: '#33d17a', icon: <CreditCard size={100} /> },
                      { label: 'Cobertura Ativa', value: alunosComPagamentoEmDia.length, suffix: '', color: 'var(--color-primary)', icon: <CheckCircle2 size={100} /> },
                      { label: 'Em Cobrança', value: alunosEmDivida.length, suffix: '', color: '#e01b24', icon: <AlertCircle size={100} /> },
                      { label: 'Inscritos no mês', value: alunos.filter(a => { const d = parseFlexibleDate(a.data_matricula); return d ? d.getMonth() === ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'].indexOf(mesFinanceiro) && d.getFullYear() === anoFinanceiro : false; }).length, suffix: '', color: '#3584e4', icon: <UserPlus size={100} /> },
                    ].map(card => (
                      <div key={card.label} className="p-4 border nl-border rounded-[6px] nl-bg-input flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">{card.icon}</div>
                        <span className="text-[10px] font-extrabold nl-text-muted uppercase tracking-wider mb-1.5 relative z-10">{card.label}</span>
                        <span className="text-[24px] font-black leading-none relative z-10" style={{ color: card.color }}>
                          {card.value}{card.suffix && <> <span className="text-[12px]" style={{ opacity: 0.7 }}>{card.suffix}</span></>}
                        </span>
                      </div>
                    ))}
                 </div>

                 <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
                    <div className="flex flex-col gap-4 overflow-hidden">
                       <h3 className="text-[12px] font-extrabold nl-text uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle size={15} className="text-red-600" /> Em Cobrança Agora
                       </h3>
                       <div className="border border-[var(--border)] rounded-[3px] overflow-hidden flex flex-col h-full bg-[var(--bg-surface)]">
                          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y border-[var(--border-light)]">
                             {alunosEmDivida.length === 0 ? (
                                <div className="p-12 text-center nl-text-muted text-[13px] font-medium">Nenhum aluno em dívida. Tudo controlado.</div>
                             ) : (
                                alunosEmDivida.map(({ aluno, resumo }, index) => {
                                   const tom = obterTomPastel(index);
                                   return (
                                      <div key={aluno.id} className={`p-3 flex items-center justify-between border-b last:border-b-0 transition-all group ${tom.bg} ${tom.border} hover:-translate-y-[1px]`}>
                                         <div className="flex flex-col gap-0.5">
                                            <span className="text-[13px] font-bold nl-text">{aluno.nome}</span>
                                            <span className="text-[11px] nl-text-muted font-mono">{aluno.telefone}</span>
                                         </div>
                                         <div className="flex flex-col items-end gap-0.5">
                                            <span className="text-[13px] font-extrabold text-red-600">{formatCve(aluno.plano)}</span>
                                            <span className="text-[10px] text-red-600/70 font-bold uppercase tracking-wider">{resumo.statusLabel}</span>
                                         </div>
                                      </div>
                                   )
                                })
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4 overflow-hidden">
                       <h3 className="text-[12px] font-extrabold nl-text uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-green-600" /> Recebidos no Período
                       </h3>
                       <div className="border border-[var(--border)] rounded-[3px] overflow-hidden flex flex-col h-full bg-[var(--bg-surface)]">
                          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y border-[var(--border-light)]">
                             {pagamentosDoPeriodo.length === 0 ? (
                                <div className="p-12 text-center nl-text-muted text-[13px] font-medium">Nenhum pagamento registado.</div>
                             ) : (
                                pagamentosDoPeriodo
                                  .sort((left, right) => (right.id || 0) - (left.id || 0))
                                  .map((p, index) => {
                                   const tom = obterTomPastel(index);
                                   return (
                                   <div key={`${p.id}-${index}`} className={`p-3 flex items-center justify-between border-b last:border-b-0 transition-all group ${tom.bg} ${tom.border} hover:-translate-y-[1px]`}>
                                      <div className="flex flex-col gap-0.5">
                                         <span className="text-[13px] font-bold nl-text">{p.nome}</span>
                                         <div className="flex items-center gap-2">
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-green-500/10 text-green-600 font-bold uppercase tracking-wider">{p?.metodo_pagamento}</span>
                                            <span className="text-[10px] nl-text-muted font-mono">{p?.data_pagamento}</span>
                                         </div>
                                         {p?.referencia_inicio && p?.referencia_fim && (
                                           <span className="text-[10px] nl-text-muted">cobre {p.referencia_inicio} ate {p.referencia_fim}</span>
                                         )}
                                      </div>
                                      <span className="text-[13px] font-extrabold text-green-600">{formatCve(p?.valor)}</span>
                                   </div>
                                )})
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
    </AppModalShell>
  );
}
