// @ts-nocheck -- Controller typing is intentionally isolated while the legacy App state is decomposed.
import { CheckCircle2, History, Phone, Send, StickyNote, Wallet, X } from 'lucide-react';
import type { Pagamento } from '../types/app';
import { buildCoverageWindow, formatCve, formatPtDate, normalizeAmount, parseFlexibleDate } from '../lib/billing';
import { APP_ICON_PATH, DEFAULT_PAYMENT_METHOD, MONTH_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../constants';
import { formatInputDate } from '../utils/formatting';

function ModalFrame({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[200] p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true"><div className="bg-[var(--bg-surface)] w-full max-w-[560px] shadow-[0_28px_90px_rgba(0,0,0,0.36)] rounded-[var(--radius-control)] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 32px)' }} onClick={(event) => event.stopPropagation()}>{children}</div></div>;
}

export default function QuickPaymentModal({ model }: { model: any }) {
  const { alunoParaCobrancaRapida, pagamentoForm, mesAtualNome, cobrancaUltimoPagamentoInfo, anoAtual, electron, nomeAcademia, alunoSelecionado, pagamentos, notasResumo, appLogo, cobrancaPagamentoSucesso, setMostrarCobrancaRapida, setAlunoParaCobrancaRapida, setCobrancaPagamentoSucesso, setCobrancaUltimoPagamentoInfo, setPagamentoForm, showToast, registrarPagamentoAtomico, adicionarNotificacao, notificarSistema, carregarHistorico, carregarConfiguracoes, getAlunoNomeSeguro, getAvatarColorByName, getAlunoIniciais, abrirNotasRapidas, parseDate } = model;

        const nomeCobranca = getAlunoNomeSeguro(alunoParaCobrancaRapida);
        const primeiroNomeCobranca = nomeCobranca.split(' ')[0] || 'Aluno';
        const valorOriginal = normalizeAmount(alunoParaCobrancaRapida.plano) || 0;
        const valorCobranca = pagamentoForm.valor || String(valorOriginal);
        const mesCobranca = pagamentoForm.mesReferencia || mesAtualNome;
        
        const whatsappNum = (alunoParaCobrancaRapida.telefone || '').replace(/\D/g, '');
        const valorWhatsapp = cobrancaUltimoPagamentoInfo?.valor
          ? formatCve(normalizeAmount(cobrancaUltimoPagamentoInfo.valor))
          : formatCve(normalizeAmount(valorCobranca));
        const mesWhatsapp = cobrancaUltimoPagamentoInfo?.mes || '';
        const whatsappMsg = encodeURIComponent(
          `Olá ${primeiroNomeCobranca}! 👋\nO seu pagamento de *${valorWhatsapp}*${mesWhatsapp ? ` referente a *${mesWhatsapp}*` : ''} foi registado com sucesso.\n\nObrigado por continuar connosco! 💪`
        );
        const whatsappUrl = `https://wa.me/${whatsappNum}?text=${whatsappMsg}`;

        const fecharCobrancaRapida = () => {
          setMostrarCobrancaRapida(false);
          setAlunoParaCobrancaRapida(null);
          setCobrancaPagamentoSucesso(false);
          setCobrancaUltimoPagamentoInfo(null);
          setPagamentoForm({ valor: '', dataPagamento: formatInputDate(), metodo: DEFAULT_PAYMENT_METHOD });
        };

        const registrarCobrancaRapida = async () => {
          if (!valorCobranca || normalizeAmount(valorCobranca) <= 0) {
            showToast('❌ Valor inválido. Insira um valor maior que zero.');
            return;
          }
          if (!pagamentoForm.dataPagamento) {
            showToast('❌ Data de pagamento é obrigatória.');
            return;
          }
          try {
            const selectedMonthName = mesAtualNome;
            const targetMonthIndex = MONTH_OPTIONS.indexOf(selectedMonthName);
            const targetYear = anoAtual;
            const dueDay = (() => {
              const date = parseFlexibleDate(alunoParaCobrancaRapida.vencimento) || parseFlexibleDate(alunoParaCobrancaRapida.data_matricula) || new Date();
              return date.getDate();
            })();
            const targetDueDate = new Date(targetYear, targetMonthIndex, dueDay);
            const targetDueDateStr = formatPtDate(targetDueDate);
            const dataPagamento = formatPtDate(parseDate(pagamentoForm.dataPagamento));
            const janelaCobranca = buildCoverageWindow(dataPagamento, targetDueDateStr);
            const valorPagamento = String(normalizeAmount(valorCobranca));

            const novoPagamento: Pagamento = {
              alunoId: alunoParaCobrancaRapida.id,
              valor: valorPagamento,
              status: 'pago',
              data_pagamento: dataPagamento,
              metodo_pagamento: pagamentoForm.metodo,
              mes_referencia: `${selectedMonthName.charAt(0).toUpperCase() + selectedMonthName.slice(1)} ${targetYear}`,
              referencia_inicio: janelaCobranca.coverageStart,
              referencia_fim: janelaCobranca.coverageEnd,
            };

            if (electron) {
              await registrarPagamentoAtomico(novoPagamento, janelaCobranca.nextChargeDate);
              adicionarNotificacao('Pagamento Registado', `Pagamento de ${nomeCobranca} (${novoPagamento.mes_referencia}) foi registado com sucesso.`, 'sucesso');
              await notificarSistema(nomeAcademia, `Pagamento de ${nomeCobranca} registado com sucesso.`);

              setCobrancaUltimoPagamentoInfo({ valor: valorPagamento, mes: novoPagamento.mes_referencia });
              setCobrancaPagamentoSucesso(true);
              if (alunoSelecionado?.id === alunoParaCobrancaRapida.id) {
                carregarHistorico(alunoParaCobrancaRapida.id);
              }
              await carregarConfiguracoes();
            }
          } catch (error) {
            console.error('Erro ao registar pagamento rápido:', error);
            showToast('❌ Erro ao registar pagamento no sistema.');
          }
        };

        const avatarBg = getAvatarColorByName(nomeCobranca);
        const pagamentosAlunoCobranca = pagamentos
          .filter(p => (p.alunoId || p.aluno_id) === alunoParaCobrancaRapida.id)
          .sort((a, b) => (b.id || 0) - (a.id || 0));
        const totalNotasCobranca = notasResumo?.[alunoParaCobrancaRapida.id]?.total || 0;
        const temNotasCobranca = totalNotasCobranca > 0;

        return (
          <ModalFrame onClose={fecharCobrancaRapida}>
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-14 flex items-center shrink-0">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <div className="h-8 w-8 rounded-md bg-white/65 backdrop-blur-sm p-1.5 border border-white/50 shadow-sm flex items-center justify-center">
                    <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
                </div>
                <div className="flex-1 text-center whitespace-nowrap">
                  <h2 className="text-[13px] font-black text-slate-700 uppercase tracking-wider leading-none">Registar Pagamento</h2>
                </div>
                <div className="flex-1 flex justify-end px-3">
                  <button onClick={fecharCobrancaRapida} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {cobrancaPagamentoSucesso ? (
                <div className="px-5 py-10 text-center space-y-5 bg-gradient-to-b from-emerald-50/50 to-white">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200 flex items-center justify-center mx-auto animate-scale-in">
                    <CheckCircle2 size={40} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black text-emerald-700">Pagamento Registado!</h3>
                    <p className="text-[14px] text-emerald-600/80 font-semibold mt-1">
                      {formatCve(normalizeAmount(cobrancaUltimoPagamentoInfo?.valor || valorCobranca))} · {nomeCobranca}
                    </p>
                  </div>
                  {whatsappNum && (
                    <button
                      type="button"
                      onClick={() => electron?.ipcRenderer.invoke('open-external', whatsappUrl)}
                      className="inline-flex items-center gap-2 h-10 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white rounded-[var(--radius-control)] text-[12px] font-black shadow-lg shadow-emerald-200 transition-all"
                    >
                      <Send size={15} /> Enviar Recibo via WhatsApp
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-y-auto custom-scrollbar">
                    <section className="px-6 py-5 border-b border-[var(--border-light)]">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[var(--text-secondary)]">Aluno</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">Cobrança rápida</span>
                      </div>

                      <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black text-white overflow-hidden shadow-sm ring-2 ring-white/70 ${avatarBg} shrink-0`}>
                        {alunoParaCobrancaRapida.foto_path
                          ? <img src={`local-resource://${alunoParaCobrancaRapida.foto_path}`} className="w-full h-full object-cover" />
                          : getAlunoIniciais(alunoParaCobrancaRapida)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[16px] font-black nl-text truncate leading-tight">{nomeCobranca}</p>
                        <p className="text-[11px] nl-text-muted truncate flex items-center gap-1.5 mt-0.5">
                          <Phone size={10} className="shrink-0 opacity-60" />
                          {alunoParaCobrancaRapida.telefone || 'Sem contacto'}
                          <span className="opacity-30">·</span>
                          {alunoParaCobrancaRapida.categoria || 'Geral'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => abrirNotasRapidas(alunoParaCobrancaRapida)}
                        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] border transition-all ${
                          temNotasCobranca
                            ? 'border-amber-400 bg-amber-300 text-amber-950 shadow-sm hover:bg-amber-200 hover:shadow-md'
                            : 'border-slate-200 bg-white/70 text-slate-300 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                        title={temNotasCobranca ? `${totalNotasCobranca} nota(s) deste aluno` : 'Adicionar nota antes de registar pagamento'}
                      >
                        <StickyNote size={16} />
                        {temNotasCobranca && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[9px] font-black text-white shadow-sm">
                            {totalNotasCobranca}
                          </span>
                        )}
                      </button>
                      <div className="text-right shrink-0 bg-slate-50 px-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--border-light)]">
                        <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Plano</p>
                        <p className="text-[16px] font-black text-[var(--color-primary)] tabular-nums leading-tight">{formatCve(valorOriginal)}</p>
                      </div>
                    </div>
                    </section>

                    {pagamentosAlunoCobranca.length > 0 && (
                      <div className="mx-6 mt-4 rounded-[var(--radius-control)] border border-[#D9E2F2] bg-slate-50 px-3 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <History size={13} className="text-slate-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">Último pagamento</span>
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-600 truncate max-w-[210px]">
                          {pagamentosAlunoCobranca[0].mes_referencia || pagamentosAlunoCobranca[0].data_pagamento || 'Registado'}
                        </span>
                      </div>
                    )}

                    <section className="px-6 py-5 border-b border-[var(--border-light)]">
                      <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-[var(--text-secondary)]">Valor recebido</p>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-black text-slate-400">CVE</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={pagamentoForm.valor}
                          onChange={e => setPagamentoForm(prev => ({ ...prev, valor: e.target.value }))}
                          className="nl-input w-full h-14 pl-14 pr-4 text-[26px] font-black tracking-tight !rounded-[var(--radius-control)] !bg-white text-slate-900 focus:!border-emerald-500 focus:!ring-4 focus:!ring-emerald-100"
                          placeholder={String(valorOriginal)}
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        />
                      </div>
                    </section>

                    <section className="grid grid-cols-2 gap-3 px-6 py-5 border-b border-[var(--border-light)]">
                      <div>
                        <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Mês atual</label>
                        <select
                          value={mesAtualNome}
                          disabled
                          className="nl-input w-full h-10 px-3 text-[13px] cursor-not-allowed capitalize !bg-slate-50 !border-slate-200 !text-slate-600 !font-bold"
                        >
                          <option value={mesAtualNome}>{mesAtualNome.charAt(0).toUpperCase() + mesAtualNome.slice(1)} {anoAtual}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Data</label>
                        <input
                          type="date"
                          value={pagamentoForm.dataPagamento}
                          onChange={e => setPagamentoForm(prev => ({ ...prev, dataPagamento: e.target.value }))}
                          className="nl-input w-full h-10 px-3 text-[13px]"
                        />
                      </div>
                    </section>

                    <section className="px-6 py-5 border-b border-[var(--border-light)]">
                      <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Método</label>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHOD_OPTIONS.map((method, idx) => {
                          const selected = pagamentoForm.metodo === method.label;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPagamentoForm(prev => ({ ...prev, metodo: method.label }))}
                              className={`h-11 rounded-[var(--radius-control)] border px-2 text-[11px] font-black transition-all ${
                                selected
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                  : 'border-[var(--border-light)] bg-white text-[var(--text-secondary)] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              {method.label}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="px-6 py-5">
                    <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-emerald-600 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                          <Wallet size={15} className="text-white" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-white/80 uppercase tracking-[0.14em]">Total a registar</span>
                          <span className="block text-[10px] font-semibold text-white/70">{pagamentoForm.metodo} · {mesAtualNome} {anoAtual}</span>
                        </div>
                      </div>
                      <span className="text-[22px] font-black text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatCve(normalizeAmount(valorCobranca))}
                      </span>
                    </div>
                    </section>
                  </div>

                  <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                      <button type="button" onClick={fecharCobrancaRapida} className="nl-btn nl-btn-secondary !h-10 !px-5 !text-[11px] font-bold">Cancelar</button>
                      <button type="button" onClick={registrarCobrancaRapida} className="nl-btn !h-11 !px-8 !text-[12px] font-black !bg-emerald-600 !text-white !border-none !shadow-sm hover:!bg-emerald-700 active:!scale-[0.98] transition-all">
                      <CheckCircle2 size={16} /> Confirmar Pagamento
                      </button>
                  </div>
                </>
              )}
          </ModalFrame>
        );
      
}
