// @ts-nocheck -- Controller typing is intentionally isolated while the legacy App state is decomposed.
import { CheckCircle2, ChevronDown, ChevronUp, Edit, History, Save, Send, StickyNote, Wallet, X } from 'lucide-react';
import type { Aluno, Pagamento } from '../types/app';
import { buildCoverageWindow, formatCve, formatPtDate, getStudentStatusForMonth, normalizeAmount, parseFlexibleDate } from '../lib/billing';
import { DEFAULT_PAYMENT_METHOD, MONTH_OPTIONS } from '../constants';
import { formatInputDate, getAlunoIniciais, getAlunoNomeSeguro, getAvatarColorByName } from '../utils/formatting';
function ModalFrame({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/65 backdrop-blur-[3px] flex items-center justify-center z-[180] p-3 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true"><div className="bg-[var(--bg-surface)] w-full max-w-[920px] shadow-[0_30px_100px_rgba(0,0,0,0.4)] rounded-[var(--radius-control)] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 24px)' }} onClick={(event) => event.stopPropagation()}>{children}</div></div>;
}

export default function StudentProfileModal({ model }: { model: any }) {
  const {
    alunoPerfil, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia, notasResumo,
    pagamentoForm, perfilUltimoPagamentoInfo, perfilPagamentoSucesso, perfilEditForm,
    editandoPerfil, mostrarHistoricoPerfil, mesAtualNome, anoAtual, electron, nomeAcademia,
    alunoSelecionado, setMostrarPerfilModal, setMostrarHistoricoPerfil, setEditandoPerfil,
    setPerfilEditForm, setCol1Minimizada, setCol2Minimizada, setPerfilAba,
    setPerfilPagamentoSucesso, setPerfilUltimoPagamentoInfo, setPagamentoForm,
    sincronizarAlunoAtualizado, carregarConfiguracoes, adicionarNotificacao, showToast,
    registrarPagamentoAtomico, notificarSistema, carregarHistorico, abrirNotasRapidas, parseDate,
  } = model;

        const nomePerfil = getAlunoNomeSeguro(alunoPerfil);
        const primeiroNomePerfil = nomePerfil.split(' ')[0] || 'Aluno';
        const resumoPerfil = getStudentStatusForMonth(alunoPerfil, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia);
        const pagamentosAlunoPerfil = pagamentos
          .filter(p => (p.alunoId || p.aluno_id) === alunoPerfil.id)
          .sort((a, b) => (b.id || 0) - (a.id || 0));
        const avatarBg = getAvatarColorByName(nomePerfil);
        const valorMensalidade = normalizeAmount(alunoPerfil.plano) || 0;
        const totalNotasPerfil = notasResumo?.[alunoPerfil.id]?.total || 0;
        const temNotasPerfil = totalNotasPerfil > 0;

        // Dados para a aba Cobrar (preview de cobertura)
        const perfilPreview = alunoPerfil
          ? buildCoverageWindow(
              formatPtDate(parseDate(pagamentoForm.dataPagamento)),
              alunoPerfil.vencimento
            )
          : null;
        const perfilResumoCobranca = getStudentStatusForMonth(alunoPerfil, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia);

        // WhatsApp para recibo inline
        const whatsappNumPerfil = (alunoPerfil.telefone || '').replace(/\D/g, '');
        const valorWhatsappPerfil = perfilUltimoPagamentoInfo?.valor
          ? formatCve(normalizeAmount(perfilUltimoPagamentoInfo.valor))
          : formatCve(normalizeAmount(alunoPerfil.plano));
        const mesWhatsappPerfil = perfilUltimoPagamentoInfo?.mes || '';
        const whatsappMsgPerfil = encodeURIComponent(
          `Olá ${primeiroNomePerfil}! 👋\nO seu pagamento de *${valorWhatsappPerfil}*${mesWhatsappPerfil ? ` referente a *${mesWhatsappPerfil}*` : ''} foi registado com sucesso.\n\nObrigado por continuar connosco! 💪`
        );
        const whatsappUrlPerfil = `https://wa.me/${whatsappNumPerfil}?text=${whatsappMsgPerfil}`;

        const fecharPerfilModal = () => {
          setMostrarPerfilModal(false);
          setMostrarHistoricoPerfil(false);
          setEditandoPerfil(false);
          setPerfilEditForm({});
          setCol1Minimizada(false);
          setCol2Minimizada(false);
          setPerfilAba('perfil');
          setPerfilPagamentoSucesso(false);
          setPerfilUltimoPagamentoInfo(null);
          setPagamentoForm({ valor: '', dataPagamento: formatInputDate(), metodo: DEFAULT_PAYMENT_METHOD });
        };

        const iniciarEdicao = () => {
          setEditandoPerfil(true);
          setPerfilEditForm({
            nome: nomePerfil,
            telefone: alunoPerfil.telefone,
            email: alunoPerfil.email || '',
            sexo: alunoPerfil.sexo || '',
            data_nascimento: alunoPerfil.data_nascimento || '',
            morada: alunoPerfil.morada || '',
            categoria: alunoPerfil.categoria || '',
            plano: alunoPerfil.plano,
          });
        };

        const salvarEdicao = async () => {
          if (!(window as any).electron) return;
          const alunoAtualizado = { ...alunoPerfil, ...perfilEditForm };
          await (window as any).electron.ipcRenderer.invoke('update-aluno-dados', alunoAtualizado);
          sincronizarAlunoAtualizado(alunoAtualizado as Aluno);
          await carregarConfiguracoes();
          setEditandoPerfil(false);
          adicionarNotificacao('Dados Atualizados', `Perfil de ${getAlunoNomeSeguro(alunoAtualizado)} salvo com sucesso.`, 'sucesso');
        };

        // Registrar pagamento direto do perfil (aba Cobrar)
        const registrarPagamentoPerfil = async () => {
          if (!alunoPerfil) return;
          const valForm = pagamentoForm.valor || String(valorMensalidade);
          if (!valForm || normalizeAmount(valForm) <= 0) {
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
              const date = parseFlexibleDate(alunoPerfil.vencimento) || parseFlexibleDate(alunoPerfil.data_matricula) || new Date();
              return date.getDate();
            })();
            const targetDueDate = new Date(targetYear, targetMonthIndex, dueDay);
            const targetDueDateStr = formatPtDate(targetDueDate);
            const dataPagamento = formatPtDate(parseDate(pagamentoForm.dataPagamento));
            const janelaCobranca = buildCoverageWindow(dataPagamento, targetDueDateStr);
            const valorPagamento = String(normalizeAmount(valForm) || normalizeAmount(alunoPerfil.plano) || 1000);

            const novoPagamento: Pagamento = {
              alunoId: alunoPerfil.id,
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
              adicionarNotificacao('Pagamento Registado', `Pagamento de ${nomePerfil} (${novoPagamento.mes_referencia}) foi registado com sucesso.`, 'sucesso');
              await notificarSistema(nomeAcademia, `Pagamento de ${nomePerfil} registado com sucesso.`);

              setPerfilUltimoPagamentoInfo({ valor: valorPagamento, mes: novoPagamento.mes_referencia });
              setPerfilPagamentoSucesso(true);
              if (alunoSelecionado?.id === alunoPerfil.id) {
                carregarHistorico(alunoPerfil.id);
              }
              await carregarConfiguracoes();
              setTimeout(() => { fecharPerfilModal(); }, 2000); // Fecha automaticamente após o sucesso
            }
          } catch (error) {
            console.error('Erro ao registar pagamento:', error);
            showToast('❌ Erro ao registar pagamento no sistema.');
          }
        };

        const statusColorsPerfil = (() => {
          const s = alunoPerfil.status || 'ativo';
          if (s === 'ativo') return 'bg-green-50 text-green-700 border-green-200';
          if (s === 'pausado') return 'bg-amber-50 text-amber-700 border-amber-200';
          return 'bg-red-50 text-red-700 border-red-200';
        })();

        return (
          <ModalFrame onClose={fecharPerfilModal}>
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-black text-white overflow-hidden shrink-0 ${avatarBg}`}>
                    {alunoPerfil.foto_path
                      ? <img src={`local-resource://${alunoPerfil.foto_path}`} className="w-full h-full object-cover" />
                      : getAlunoIniciais(alunoPerfil)}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none truncate max-w-[100px]">{nomePerfil}</span>
                </div>
                <div className="flex-1 text-center whitespace-nowrap">
                  <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Perfil do Aluno</h2>
                </div>
                <div className="flex-1 flex justify-end px-3">
                  <button onClick={fecharPerfilModal} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {perfilPagamentoSucesso ? (
                <div className="px-5 py-10 text-center space-y-5 bg-gradient-to-b from-emerald-50/50 to-white">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200 flex items-center justify-center mx-auto animate-scale-in">
                    <CheckCircle2 size={40} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black text-emerald-700">Pagamento Registado!</h3>
                    <p className="text-[14px] text-emerald-600/80 font-semibold mt-1">
                      {formatCve(normalizeAmount(perfilUltimoPagamentoInfo?.valor || alunoPerfil.plano))} · {nomePerfil}
                    </p>
                  </div>
                  {whatsappNumPerfil && (
                    <button
                      type="button"
                      onClick={() => electron?.ipcRenderer.invoke('open-external', whatsappUrlPerfil)}
                      className="inline-flex items-center gap-2 h-10 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white rounded-[var(--radius-control)] text-[12px] font-black shadow-lg shadow-emerald-200 transition-all"
                    >
                      <Send size={15} /> Enviar Recibo via WhatsApp
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="px-5 pt-3 space-y-3 overflow-y-auto custom-scrollbar">
                    {/* Info do Aluno */}
                    <div className="flex items-center gap-3 rounded-[10px] border-2 border-[var(--border-light)] bg-gradient-to-br from-[var(--color-secondary-lighter)]/40 to-white p-3.5 shadow-sm">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black text-white overflow-hidden shadow-md ring-2 ring-white/60 shrink-0 ${avatarBg}`}>
                        {alunoPerfil.foto_path
                          ? <img src={`local-resource://${alunoPerfil.foto_path}`} className="w-full h-full object-cover" />
                          : getAlunoIniciais(alunoPerfil)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-black nl-text truncate leading-tight">{nomePerfil}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${statusColorsPerfil}`}>
                            {alunoPerfil.status || 'ativo'}
                          </span>
                          <span className="text-[10px] nl-text-muted">· {alunoPerfil.categoria || 'Geral'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 bg-white/60 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border-light)]">
                        <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Plano</p>
                        <p className="text-[15px] font-black text-[var(--color-primary)] tabular-nums leading-tight">{formatCve(valorMensalidade)}</p>
                      </div>
                    </div>

                    {/* Histórico Accordion */}
                    <div className="rounded-[var(--radius-control)] border border-[var(--border-light)] overflow-hidden">
                      <button
                        onClick={() => setMostrarHistoricoPerfil(!mostrarHistoricoPerfil)}
                        className="w-full px-4 py-2.5 flex items-center justify-between bg-[var(--color-secondary-lighter)]/30 hover:bg-[var(--color-secondary-lighter)]/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <History size={13} className="nl-text-muted" />
                          <span className="text-[10px] font-bold nl-text-muted uppercase tracking-[0.1em]">
                            {mostrarHistoricoPerfil ? "Ocultar Histórico" : `Ver Histórico (${pagamentosAlunoPerfil.length})`}
                          </span>
                        </div>
                        {mostrarHistoricoPerfil ? <ChevronUp size={13} className="nl-text-muted" /> : <ChevronDown size={13} className="nl-text-muted" />}
                      </button>

                      {mostrarHistoricoPerfil && (
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/20">
                          {pagamentosAlunoPerfil.length === 0 ? (
                            <p className="text-[11px] nl-text-muted text-center py-6">Sem pagamentos registados.</p>
                          ) : (
                            <div className="p-3 space-y-2">
                              {pagamentosAlunoPerfil.map((pag) => (
                                <div key={pag.id} className="flex items-center justify-between bg-white border border-[var(--border-light)] rounded-[6px] p-2.5">
                                  <div>
                                    <p className="text-[11px] font-bold nl-text capitalize">{pag.mes_referencia}</p>
                                    <p className="text-[9px] nl-text-muted">{pag.data_pagamento} • {pag.metodo_pagamento}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[12px] font-black nl-text tabular-nums">{formatCve(pag.valor)}</p>
                                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded uppercase">{pag.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Separador */}
                    <div style={{ borderTop: '1px dashed var(--border-light)', margin: '0 4px' }} />

                    {/* Valor a Registar */}
                    <div className="space-y-3 pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Registar Pagamento</p>
                        <button
                          type="button"
                          onClick={() => abrirNotasRapidas(alunoPerfil)}
                          className={`relative flex h-9 items-center gap-2 rounded-[var(--radius-compact)] border px-3 text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
                            temNotasPerfil
                              ? 'border-amber-400 bg-amber-300 text-amber-950 shadow-sm hover:bg-amber-200'
                              : 'border-slate-200 bg-slate-100 text-slate-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                          title={temNotasPerfil ? `${totalNotasPerfil} nota(s) deste aluno` : 'Adicionar nota antes de cobrar'}
                        >
                          <StickyNote size={14} />
                          Notas
                          {temNotasPerfil && (
                            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white/80 px-1 text-[9px] font-black text-amber-900">
                              {totalNotasPerfil}
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[var(--text-secondary)] z-10">$</span>
                        <input
                          type="text"
                          value={pagamentoForm.valor}
                          onChange={e => setPagamentoForm(prev => ({ ...prev, valor: e.target.value }))}
                          className="nl-input w-full h-12 pl-7 pr-3 text-[18px] font-black tracking-tight"
                          placeholder={String(valorMensalidade)}
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        />
                      </div>
                      {pagamentoForm.valor && normalizeAmount(pagamentoForm.valor) !== valorMensalidade && (
                        <button onClick={() => setPagamentoForm(prev => ({ ...prev, valor: '' }))} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors">
                          Repor valor original ({formatCve(valorMensalidade)})
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Mês atual</label>
                          <select
                            value={mesAtualNome}
                            disabled
                            className="nl-input w-full h-10 px-3 text-[13px] cursor-not-allowed capitalize !bg-emerald-50 !border-emerald-200 !text-emerald-700 !font-bold"
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
                      </div>

                      <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200/50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Wallet size={15} className="text-white" />
                          </div>
                          <span className="text-[12px] font-black text-white uppercase tracking-[0.12em]">Total a registar</span>
                        </div>
                        <span className="text-[20px] font-black text-white drop-shadow-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatCve(normalizeAmount(pagamentoForm.valor || String(valorMensalidade)))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-between gap-3 shrink-0">
                    <button onClick={fecharPerfilModal} className="nl-btn nl-btn-ghost !h-9 !px-4 !text-[11px] font-bold">Cancelar</button>
                    <div className="flex items-center gap-2">
                      {editandoPerfil && (
                        <button onClick={salvarEdicao} className="nl-btn !h-9 !px-5 !text-[11px] font-bold nl-btn-primary"><Save size={14} /> Guardar</button>
                      )}
                      <button onClick={iniciarEdicao} className="nl-btn nl-btn-secondary !h-9 !px-4 !text-[11px] font-bold"><Edit size={14} /> Editar</button>
                      <button onClick={registrarPagamentoPerfil} className="nl-btn !h-10 !px-7 !text-[12px] font-black !bg-gradient-to-r !from-emerald-600 !to-emerald-500 !text-white !border-none !shadow-lg !shadow-emerald-200/50 hover:!shadow-emerald-300/60 hover:!scale-[1.02] active:!scale-[0.98] transition-all">
                        <CheckCircle2 size={16} /> Cobrar
                      </button>
                    </div>
                  </div>
                </>
              )}
          </ModalFrame>
        );
      
}
