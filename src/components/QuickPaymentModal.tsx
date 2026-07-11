// @ts-nocheck -- Payment controller; strict typing follows App decomposition.
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Phone,
  Send,
  StickyNote,
  Wallet,
} from 'lucide-react';
import type { Pagamento } from '../types/app';
import { buildCoverageWindow, formatCve, formatPtDate, normalizeAmount, parseFlexibleDate } from '../lib/billing';
import { DEFAULT_PAYMENT_METHOD, MONTH_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../constants';
import { formatInputDate } from '../utils/formatting';
import AppModalShell from './AppModalShell';

function statusTone(status?: string) {
  if (status === 'atrasado' || status === 'hoje') {
    return {
      label: status === 'hoje' ? 'Vence hoje' : 'Em atraso',
      badge: 'badge-error',
      bar: 'bg-[var(--color-error)]',
      soft: 'nl-alert-error',
    };
  }
  if (status === 'critico' || status === 'pendente' || status === 'alerta') {
    return {
      label: status === 'critico' ? 'Crítico' : status === 'pendente' ? 'Pendente' : 'Alerta',
      badge: 'badge-warning',
      bar: 'bg-[var(--color-warning)]',
      soft: 'nl-alert-warning',
    };
  }
  if (status === 'pago' || status === 'em_dia') {
    return {
      label: 'Em dia',
      badge: 'badge-success',
      bar: 'bg-[var(--color-success)]',
      soft: 'nl-alert-success',
    };
  }
  return {
    label: 'Regular',
    badge: 'badge-neutral',
    bar: 'bg-[var(--color-primary)]',
    soft: 'nl-alert-info',
  };
}

export default function QuickPaymentModal({ model }: { model: any }) {
  const {
    alunoParaCobrancaRapida,
    pagamentoForm,
    mesAtualNome,
    cobrancaUltimoPagamentoInfo,
    cobrancaResumo,
    anoAtual,
    electron,
    nomeAcademia,
    alunoSelecionado,
    pagamentos,
    notasResumo,
    cobrancaPagamentoSucesso,
    setMostrarCobrancaRapida,
    setAlunoParaCobrancaRapida,
    setCobrancaPagamentoSucesso,
    setCobrancaUltimoPagamentoInfo,
    setCobrancaResumo,
    setPagamentoForm,
    showToast,
    registrarPagamentoAtomico,
    adicionarNotificacao,
    notificarSistema,
    carregarHistorico,
    carregarConfiguracoes,
    getAlunoNomeSeguro,
    getAvatarColorByName,
    getAlunoIniciais,
    abrirNotasRapidas,
    parseDate,
  } = model;

  const aluno = alunoParaCobrancaRapida;
  const nome = getAlunoNomeSeguro(aluno);
  const primeiroNome = nome.split(' ')[0] || 'Aluno';
  const planoValor = normalizeAmount(aluno.plano) || 0;
  const valorStr = pagamentoForm.valor || String(planoValor);
  const valorNum = normalizeAmount(valorStr);
  const resumo = cobrancaResumo || {};
  const tone = statusTone(resumo.status);
  const jaPago = resumo.status === 'pago' || resumo.status === 'em_dia';

  const whatsappNum = (aluno.telefone || '').replace(/\D/g, '');
  const valorWhatsapp = cobrancaUltimoPagamentoInfo?.valor
    ? formatCve(normalizeAmount(cobrancaUltimoPagamentoInfo.valor))
    : formatCve(valorNum);
  const mesWhatsapp = cobrancaUltimoPagamentoInfo?.mes || '';
  const whatsappMsg = encodeURIComponent(
    `Olá ${primeiroNome}! 👋\nO seu pagamento de *${valorWhatsapp}*${mesWhatsapp ? ` referente a *${mesWhatsapp}*` : ''} foi registado com sucesso.\n\nObrigado por continuar connosco! 💪`,
  );
  const whatsappUrl = `https://wa.me/${whatsappNum}?text=${whatsappMsg}`;

  const pagamentosAluno = (pagamentos || [])
    .filter((p) => (p.alunoId || p.aluno_id) === aluno.id)
    .sort((a, b) => (b.id || 0) - (a.id || 0));
  const ultimoPagamento = pagamentosAluno[0];
  const totalNotas = notasResumo?.[aluno.id]?.total || 0;

  // Pré-visualização da cobertura que será criada
  const dueDay = (() => {
    const d = parseFlexibleDate(aluno.vencimento) || parseFlexibleDate(aluno.data_matricula) || new Date();
    return d.getDate();
  })();
  const targetMonthIndex = Math.max(0, MONTH_OPTIONS.indexOf(mesAtualNome));
  const targetDueDateStr = formatPtDate(new Date(anoAtual, targetMonthIndex, dueDay));
  const dataPagamentoPreview = pagamentoForm.dataPagamento
    ? formatPtDate(parseDate(pagamentoForm.dataPagamento) || new Date())
    : formatPtDate(new Date());
  const janelaPreview = buildCoverageWindow(dataPagamentoPreview, targetDueDateStr);

  const fechar = () => {
    setMostrarCobrancaRapida(false);
    setAlunoParaCobrancaRapida(null);
    setCobrancaPagamentoSucesso(false);
    setCobrancaUltimoPagamentoInfo(null);
    setCobrancaResumo?.(null);
    setPagamentoForm({ valor: '', dataPagamento: formatInputDate(), metodo: DEFAULT_PAYMENT_METHOD });
  };

  const confirmar = async () => {
    if (valorNum <= 0) {
      showToast('❌ Valor inválido. Insira um valor maior que zero.');
      return;
    }
    if (!pagamentoForm.dataPagamento) {
      showToast('❌ Data de pagamento é obrigatória.');
      return;
    }
    try {
      const dataPagamento = formatPtDate(parseDate(pagamentoForm.dataPagamento));
      const janela = buildCoverageWindow(dataPagamento, targetDueDateStr);
      const valorPagamento = String(valorNum);
      const mesLabel = `${mesAtualNome.charAt(0).toUpperCase() + mesAtualNome.slice(1)} ${anoAtual}`;

      const novoPagamento: Pagamento = {
        alunoId: aluno.id,
        valor: valorPagamento,
        status: 'pago',
        data_pagamento: dataPagamento,
        metodo_pagamento: pagamentoForm.metodo,
        mes_referencia: mesLabel,
        referencia_inicio: janela.coverageStart,
        referencia_fim: janela.coverageEnd,
      };

      if (electron) {
        await registrarPagamentoAtomico(novoPagamento, janela.nextChargeDate);
        adicionarNotificacao('Pagamento registado', `Pagamento de ${nome} (${mesLabel}) foi registado com sucesso.`, 'sucesso');
        await notificarSistema(nomeAcademia, `Pagamento de ${nome} registado com sucesso.`);
        setCobrancaUltimoPagamentoInfo({ valor: valorPagamento, mes: mesLabel });
        setCobrancaPagamentoSucesso(true);
        if (alunoSelecionado?.id === aluno.id) carregarHistorico(aluno.id);
        await carregarConfiguracoes();
      }
    } catch (error) {
      console.error('Erro ao registar pagamento:', error);
      showToast('❌ Erro ao registar pagamento no sistema.');
    }
  };

  const avatarBg = getAvatarColorByName(nome);

  return (
    <AppModalShell
      title={nome}
      subtitle={`${aluno.telefone || 'Sem telefone'} · ${aluno.categoria || 'Geral'}`}
      onClose={fechar}
      maxWidth="max-w-[480px]"
      zIndex={220}
      hideBrand
      accent="var(--color-success)"
      headerExtra={(
        <button
          type="button"
          onClick={() => abrirNotasRapidas?.(aluno)}
          className="nl-icon-btn relative"
          title={totalNotas ? `${totalNotas} nota(s)` : 'Notas do aluno'}
        >
          <StickyNote size={15} />
          {totalNotas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-warning)] px-1 text-[9px] font-bold text-white">
              {totalNotas}
            </span>
          )}
        </button>
      )}
      panelStyle={{
        background: jaPago
          ? 'color-mix(in srgb, var(--color-success) 6%, var(--bg-surface))'
          : 'var(--bg-surface)',
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Identidade compacta */}
        <div className="flex items-center gap-3 border-b border-[var(--border-light)] px-4 py-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-[14px] font-semibold text-white ring-2 ring-[color-mix(in_srgb,var(--color-success)_40%,transparent)] ${avatarBg}`}>
            {aluno.foto_path
              ? <img src={`local-resource://${aluno.foto_path}`} className="h-full w-full object-cover" alt="" />
              : getAlunoIniciais(aluno)}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[var(--color-success)]">Cobrança · pagamento</p>
            <p className="flex items-center gap-1.5 truncate text-[12px] font-medium nl-text-muted">
              <Phone size={11} className="opacity-70" />
              {aluno.telefone || 'Sem telefone'}
            </p>
          </div>
        </div>

        {cobrancaPagamentoSucesso ? (
          /* ── Sucesso ── */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)] text-white shadow-[var(--shadow-md)]">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-[var(--color-success)]">Pagamento registado</h3>
              <p className="mt-1 text-[14px] font-medium nl-text">
                {formatCve(normalizeAmount(cobrancaUltimoPagamentoInfo?.valor || valorNum))}
              </p>
              <p className="mt-0.5 text-[12px] nl-text-muted">
                {cobrancaUltimoPagamentoInfo?.mes || `${mesAtualNome} ${anoAtual}`} · {nome}
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-2">
              {whatsappNum && (
                <button
                  type="button"
                  onClick={() => electron?.ipcRenderer.invoke('open-external', whatsappUrl)}
                  className="nl-btn nl-btn-primary w-full !bg-[var(--color-success)] !border-[var(--color-success)] hover:!brightness-105"
                >
                  <Send size={15} /> Enviar recibo por WhatsApp
                </button>
              )}
              <button type="button" onClick={fechar} className="nl-btn nl-btn-secondary w-full">
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
              {/* ── 1. Situação atual ── */}
              <section className={`mx-4 mt-4 rounded-[var(--radius-control)] border px-3.5 py-3 ${tone.soft}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} />
                      <p className="text-[12px] font-semibold">Situação atual</p>
                    </div>
                    <p className="mt-1 text-[13px] font-semibold leading-snug">
                      {jaPago
                        ? `Em dia até ${resumo.coverageEnd || resumo.nextChargeDate || aluno.vencimento || '—'}`
                        : resumo.overdueDays > 0
                          ? `Atrasado há ${resumo.overdueDays} dia(s)`
                          : resumo.daysUntilCharge != null
                            ? `Vence em ${Math.max(resumo.daysUntilCharge, 0)} dia(s)`
                            : 'Estado de cobrança do aluno'}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium opacity-80">
                      Próxima cobrança: <strong>{resumo.nextChargeDate || aluno.vencimento || '—'}</strong>
                    </p>
                  </div>
                  <span className={`badge ${tone.badge} shrink-0`}>{tone.label}</span>
                </div>
                {(resumo.coverageStart || resumo.coverageEnd) && (
                  <p className="mt-2 text-[11px] font-medium opacity-75">
                    Cobertura: {resumo.coverageStart || '—'} → {resumo.coverageEnd || '—'}
                  </p>
                )}
              </section>

              {/* ── 2. Resumo financeiro ── */}
              <section className="mx-4 mt-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--color-secondary-light)] p-3">
                <p className="mb-2 text-[12px] font-semibold nl-text">Resumo</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[var(--radius-compact)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
                    <p className="text-[11px] font-medium nl-text-muted">Plano / mensalidade</p>
                    <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-[var(--color-primary)]">{formatCve(planoValor)}</p>
                  </div>
                  <div className="rounded-[var(--radius-compact)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
                    <p className="text-[11px] font-medium nl-text-muted">A registar agora</p>
                    <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-[var(--color-success)]">{formatCve(valorNum)}</p>
                  </div>
                  <div className="rounded-[var(--radius-compact)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
                    <p className="text-[11px] font-medium nl-text-muted">Último pagamento</p>
                    <p className="mt-0.5 truncate text-[12px] font-semibold nl-text">
                      {ultimoPagamento
                        ? `${formatCve(ultimoPagamento.valor)} · ${ultimoPagamento.mes_referencia || ultimoPagamento.data_pagamento || ''}`
                        : 'Nenhum'}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-compact)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
                    <p className="text-[11px] font-medium nl-text-muted">Nova cobertura</p>
                    <p className="mt-0.5 truncate text-[12px] font-semibold nl-text">
                      {janelaPreview.coverageStart} → {janelaPreview.coverageEnd}
                    </p>
                  </div>
                </div>
              </section>

              {/* ── 3. Valor (apenas dígitos; CVE fora do input) ── */}
              <section className="px-4 pt-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold nl-text">
                  <Wallet size={13} className="text-[var(--color-success)]" />
                  Valor recebido
                </label>
                <div className="flex h-12 overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-input)] focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_var(--shadow-primary-focus)]">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    spellCheck={false}
                    value={String(pagamentoForm.valor ?? '').replace(/[^\d]/g, '')}
                    onChange={(e) => {
                      // Só dígitos — evita espaços unicode / "CVE" / formatação a entrar no campo
                      const digits = e.target.value.replace(/[^\d]/g, '');
                      setPagamentoForm((prev) => ({ ...prev, valor: digits }));
                    }}
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[22px] font-semibold tabular-nums nl-text outline-none placeholder:text-[var(--text-tertiary)]"
                    placeholder={planoValor > 0 ? String(planoValor) : '0'}
                    autoFocus={!jaPago}
                  />
                  <span className="flex shrink-0 items-center border-l border-[var(--border)] bg-[var(--color-secondary-light)] px-3 text-[12px] font-semibold nl-text-muted">
                    CVE
                  </span>
                </div>
                {valorNum !== planoValor && valorNum > 0 && (
                  <p className="mt-1 text-[11px] font-medium nl-text-muted">
                    Plano base: {formatCve(planoValor)} | diferenca {formatCve(valorNum - planoValor)}
                  </p>
                )}
              </section>

              {/* ── 4. Data + período ── */}
              <section className="grid grid-cols-2 gap-3 px-4 pt-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold nl-text">
                    <Calendar size={13} className="nl-text-muted" />
                    Data do pagamento
                  </label>
                  <input
                    type="date"
                    value={pagamentoForm.dataPagamento}
                    onChange={(e) => setPagamentoForm((prev) => ({ ...prev, dataPagamento: e.target.value }))}
                    className="nl-input h-10 w-full"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold nl-text">
                    <Clock size={13} className="nl-text-muted" />
                    Período
                  </label>
                  <div className="nl-input flex h-10 items-center !bg-[var(--color-secondary-light)] text-[13px] font-semibold capitalize nl-text">
                    {mesAtualNome} {anoAtual}
                  </div>
                </div>
              </section>

              {/* ── 5. Método ── */}
              <section className="px-4 py-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold nl-text">
                  <CreditCard size={13} className="nl-text-muted" />
                  Método de pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHOD_OPTIONS.map((method) => {
                    const selected = pagamentoForm.metodo === method.label;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPagamentoForm((prev) => ({ ...prev, metodo: method.label }))}
                        className={`h-11 rounded-[var(--radius-control)] border px-2 text-[12px] font-semibold transition-all ${
                          selected
                            ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                            : 'border-[var(--border)] bg-[var(--bg-surface)] nl-text-sub hover:border-[var(--color-success)] hover:bg-[var(--color-secondary-light)]'
                        }`}
                      >
                        {method.shortLabel || method.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── 6. Total sticky visual ── */}
              <section className="nl-alert nl-alert-success mx-4 mb-4 !items-center">
                <div className="nl-alert-icon">
                  <Wallet size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="nl-alert-title">Total a confirmar</p>
                      <p className="nl-alert-body">
                        {pagamentoForm.metodo || DEFAULT_PAYMENT_METHOD} · {mesAtualNome} {anoAtual}
                      </p>
                    </div>
                    <p className="text-[20px] font-semibold tabular-nums">{formatCve(valorNum)}</p>
                  </div>
                  <p className="mt-1 text-[11px] font-medium opacity-80">
                    Após confirmar, a próxima cobrança passa a <strong>{janelaPreview.nextChargeDate}</strong>
                  </p>
                </div>
              </section>
            </div>

            {/* ── Footer ações ── */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 px-4 py-3">
              <button type="button" onClick={fechar} className="nl-btn nl-btn-secondary">
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={valorNum <= 0}
                className="nl-btn !h-11 !px-6 !border-[var(--color-success)] !bg-[var(--color-success)] !text-white hover:!brightness-105 disabled:opacity-50 disabled:pointer-events-none"
              >
                <CheckCircle2 size={16} />
                {jaPago ? 'Registar mesmo assim' : 'Confirmar pagamento'}
              </button>
            </div>
          </>
        )}
      </div>
    </AppModalShell>
  );
}
