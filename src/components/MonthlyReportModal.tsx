// @ts-nocheck -- Legacy report controller will receive strict typing in the next decomposition pass.
import { AlertCircle, CheckCircle2, CreditCard, FileSpreadsheet, UserPlus, X } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';
import { formatCve, normalizeAmount, parseFlexibleDate } from '../lib/billing';

export default function MonthlyReportModal({ model }: { model: unknown }) {
  const { appLogo, mesFinanceiro, anoFinanceiro, totalRecebidoPeriodo, alunosComPagamentoEmDia, alunosEmDivida, alunos, pagamentosDoPeriodo, setMostrarRelatorioMensal, exportarFinancasExcel, showToast, obterTomPastel } = model;
  return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4 animate-fade-in" onClick={() => setMostrarRelatorioMensal(false)}>
           <div className="bg-[var(--bg-surface)] w-full max-w-[850px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                    <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
                </div>
                <div className="flex-1 text-center whitespace-nowrap">
                  <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">{mesFinanceiro} {anoFinanceiro}</h2>
                </div>
                <div className="flex-1 flex justify-end px-3">
                  <button onClick={() => setMostrarRelatorioMensal(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
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
              <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-between shrink-0">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estatísticas & Fecho de Mensalidades</p>
                 <div className="flex gap-3">
                    <button onClick={() => setMostrarRelatorioMensal(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Fechar</button>
                    <button onClick={async () => { await exportarFinancasExcel(); showToast('Exportado para Excel'); }} className="nl-btn !h-9 !px-6 !text-[11px] font-bold !bg-emerald-600 !text-white hover:!bg-emerald-700 !border-emerald-700">
                       <FileSpreadsheet size={14} /> Exportar Excel
                    </button>
                 </div>
              </div>
           </div>
        </div>
  );
}
