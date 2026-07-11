// @ts-nocheck -- Controller typing is intentionally isolated while the legacy App state is decomposed.
/**
 * Perfil do aluno — visualização e edição apenas.
 * Cobrança/pagamento vive só no QuickPaymentModal (cartão da barra de dias na lista).
 */
import { ChevronDown, ChevronUp, Edit, History, Save, StickyNote, Wallet } from 'lucide-react';
import type { Aluno } from '../types/app';
import { formatCve, getStudentStatusForMonth, normalizeAmount } from '../lib/billing';
import { formatInputDate, getAlunoIniciais, getAlunoNomeSeguro, getAvatarColorByName } from '../utils/formatting';
import { DEFAULT_PAYMENT_METHOD, getManualStatusTone, STUDENT_STATUS_HELPERS } from '../constants';
import AppModalShell from './AppModalShell';

function statusTone(billingStatus?: string, manualStatus?: string) {
  if (
    STUDENT_STATUS_HELPERS.isQuit(manualStatus)
    || STUDENT_STATUS_HELPERS.isOnLeave(manualStatus)
    || STUDENT_STATUS_HELPERS.isPaused(manualStatus)
    || STUDENT_STATUS_HELPERS.isBlocked(manualStatus)
    || STUDENT_STATUS_HELPERS.isImported(manualStatus)
  ) {
    const t = getManualStatusTone(manualStatus);
    return { badge: t.badge, label: t.label };
  }
  if (billingStatus === 'atrasado' || billingStatus === 'hoje') return { badge: 'badge-error', label: billingStatus === 'hoje' ? 'Vence hoje' : 'Em atraso' };
  if (billingStatus === 'critico' || billingStatus === 'pendente' || billingStatus === 'alerta') return { badge: 'badge-warning', label: 'Atenção' };
  if (billingStatus === 'pago' || billingStatus === 'em_dia') return { badge: 'badge-success', label: 'Em dia' };
  if (billingStatus === 'ferias') return { badge: 'badge-leave', label: 'Férias' };
  if (billingStatus === 'desistente') return { badge: 'badge-quit', label: 'Desistente' };
  return { badge: 'badge-neutral', label: 'Regular' };
}

export default function StudentProfileModal({ model }: { model: any }) {
  const {
    alunoPerfil,
    pagamentos,
    anoFinanceiro,
    mesFinanceiroIndex,
    hojeReferencia,
    notasResumo,
    editandoPerfil,
    mostrarHistoricoPerfil,
    perfilEditForm,
    setMostrarPerfilModal,
    setMostrarHistoricoPerfil,
    setEditandoPerfil,
    setPerfilEditForm,
    setCol1Minimizada,
    setCol2Minimizada,
    setPerfilAba,
    setPerfilPagamentoSucesso,
    setPerfilUltimoPagamentoInfo,
    setPagamentoForm,
    sincronizarAlunoAtualizado,
    carregarConfiguracoes,
    adicionarNotificacao,
    abrirNotasRapidas,
    onAbrirCobranca,
  } = model;

  const nomePerfil = getAlunoNomeSeguro(alunoPerfil);
  const resumoPerfil = getStudentStatusForMonth(alunoPerfil, pagamentos, anoFinanceiro, mesFinanceiroIndex, hojeReferencia);
  const tone = statusTone(resumoPerfil.status, alunoPerfil.status);
  const pagamentosAlunoPerfil = pagamentos
    .filter((p) => (p.alunoId || p.aluno_id) === alunoPerfil.id)
    .sort((a, b) => (b.id || 0) - (a.id || 0));
  const avatarBg = getAvatarColorByName(nomePerfil);
  const valorMensalidade = normalizeAmount(alunoPerfil.plano) || 0;
  const totalNotas = notasResumo?.[alunoPerfil.id]?.total || 0;

  const fecharPerfilModal = () => {
    setMostrarPerfilModal(false);
    setMostrarHistoricoPerfil(false);
    setEditandoPerfil(false);
    setPerfilEditForm({});
    setCol1Minimizada?.(false);
    setCol2Minimizada?.(false);
    setPerfilAba?.('perfil');
    setPerfilPagamentoSucesso?.(false);
    setPerfilUltimoPagamentoInfo?.(null);
    setPagamentoForm?.({ valor: '', dataPagamento: formatInputDate(), metodo: DEFAULT_PAYMENT_METHOD });
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
    adicionarNotificacao('Dados atualizados', `Perfil de ${getAlunoNomeSeguro(alunoAtualizado)} guardado.`, 'sucesso');
  };

  const abrirCobranca = () => {
    fecharPerfilModal();
    // defer so profile unmounts first
    setTimeout(() => onAbrirCobranca?.(alunoPerfil, resumoPerfil), 0);
  };

  return (
    <AppModalShell
      title={nomePerfil}
      subtitle="Perfil do aluno · visualização e edição"
      onClose={fecharPerfilModal}
      maxWidth="max-w-[520px]"
      zIndex={180}
      hideBrand
      accent="var(--color-primary)"
    >
      <div className="space-y-3 px-4 py-4">
        {/* Identidade */}
        <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--color-secondary-light)] p-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-[14px] font-semibold text-white ${avatarBg}`}>
            {alunoPerfil.foto_path
              ? <img src={`local-resource://${alunoPerfil.foto_path}`} className="h-full w-full object-cover" alt="" />
              : getAlunoIniciais(alunoPerfil)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`badge ${tone.badge}`}>{tone.label}</span>
              <span className="text-[12px] font-medium nl-text-muted">{alunoPerfil.categoria || 'Geral'}</span>
            </div>
            <p className="mt-1 truncate text-[12px] font-medium nl-text-sub">
              {alunoPerfil.telefone || 'Sem telefone'}
              {alunoPerfil.email ? ` · ${alunoPerfil.email}` : ''}
            </p>
          </div>
          <div className="shrink-0 rounded-[var(--radius-compact)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-right">
            <p className="text-[11px] font-medium nl-text-muted">Plano</p>
            <p className="text-[15px] font-semibold tabular-nums text-[var(--color-primary)]">{formatCve(valorMensalidade)}</p>
          </div>
        </div>

        {/* Situação de cobrança (só leitura + atalho) */}
        <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-surface)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold nl-text">Situação de pagamento</p>
              <p className="mt-1 text-[12px] font-medium nl-text-sub">
                Próxima cobrança: <strong className="nl-text">{resumoPerfil.nextChargeDate || alunoPerfil.vencimento || '—'}</strong>
              </p>
              {(resumoPerfil.coverageStart || resumoPerfil.coverageEnd) && (
                <p className="mt-0.5 text-[11px] nl-text-muted">
                  Cobertura: {resumoPerfil.coverageStart || '—'} → {resumoPerfil.coverageEnd || '—'}
                </p>
              )}
            </div>
            <button type="button" onClick={abrirCobranca} className="nl-btn nl-btn-sm !border-[var(--color-success)] !bg-[var(--color-success)] !text-white">
              <Wallet size={13} /> Cobrar
            </button>
          </div>
          <p className="mt-2 text-[11px] font-medium nl-text-muted">
            O registo de pagamento abre no formulário único de cobrança (mesmo da barra de dias na lista).
          </p>
        </div>

        {/* Edição */}
        {editandoPerfil ? (
          <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--border)] p-3">
            <p className="text-[12px] font-semibold nl-text">Editar dados</p>
            {[
              { key: 'nome', label: 'Nome' },
              { key: 'telefone', label: 'Telefone' },
              { key: 'email', label: 'Email' },
              { key: 'categoria', label: 'Categoria' },
              { key: 'plano', label: 'Plano (CVE)' },
              { key: 'morada', label: 'Morada' },
            ].map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-[11px] font-medium nl-text-muted">{field.label}</label>
                <input
                  className="nl-input h-9"
                  value={perfilEditForm[field.key] ?? ''}
                  onChange={(e) => setPerfilEditForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Sexo', value: alunoPerfil.sexo || '—' },
              { label: 'Nascimento', value: alunoPerfil.data_nascimento || '—' },
              { label: 'Matrícula', value: alunoPerfil.data_matricula || '—' },
              { label: 'Morada', value: alunoPerfil.morada || '—' },
            ].map((item) => (
              <div key={item.label} className="rounded-[var(--radius-compact)] border border-[var(--border-light)] bg-[var(--color-secondary-light)] px-3 py-2">
                <p className="text-[11px] font-medium nl-text-muted">{item.label}</p>
                <p className="mt-0.5 truncate text-[12px] font-semibold nl-text">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Histórico (só leitura) */}
        <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setMostrarHistoricoPerfil(!mostrarHistoricoPerfil)}
            className="flex w-full items-center justify-between bg-[var(--color-secondary-light)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-secondary-lighter)]"
          >
            <span className="flex items-center gap-2 text-[12px] font-semibold nl-text">
              <History size={14} className="nl-text-muted" />
              Histórico de pagamentos ({pagamentosAlunoPerfil.length})
            </span>
            {mostrarHistoricoPerfil ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {mostrarHistoricoPerfil && (
            <div className="max-h-[180px] space-y-1.5 overflow-y-auto custom-scrollbar border-t border-[var(--border-light)] p-2">
              {pagamentosAlunoPerfil.length === 0 ? (
                <p className="py-4 text-center text-[12px] nl-text-muted">Sem pagamentos registados.</p>
              ) : (
                pagamentosAlunoPerfil.map((pag) => (
                  <div key={pag.id} className="flex items-center justify-between rounded-[var(--radius-compact)] border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold nl-text capitalize">{pag.mes_referencia || '—'}</p>
                      <p className="text-[11px] nl-text-muted">{pag.data_pagamento} · {pag.metodo_pagamento}</p>
                    </div>
                    <p className="text-[12px] font-semibold tabular-nums nl-text">{formatCve(pag.valor)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/45 px-4 py-3">
        <button
          type="button"
          onClick={() => abrirNotasRapidas?.(alunoPerfil)}
          className="nl-btn nl-btn-ghost nl-btn-sm"
        >
          <StickyNote
            size={15}
            strokeWidth={2}
            color={totalNotas > 0 ? '#EAB308' : 'var(--text-tertiary, #9CA3AF)'}
            fill={totalNotas > 0 ? '#FDE047' : 'none'}
          />
          Notas{totalNotas > 0 ? ` (${totalNotas})` : ''}
        </button>
        <div className="flex items-center gap-2">
          {editandoPerfil ? (
            <>
              <button type="button" onClick={() => setEditandoPerfil(false)} className="nl-btn nl-btn-secondary nl-btn-sm">Cancelar</button>
              <button type="button" onClick={salvarEdicao} className="nl-btn nl-btn-primary nl-btn-sm"><Save size={14} /> Guardar</button>
            </>
          ) : (
            <>
              <button type="button" onClick={iniciarEdicao} className="nl-btn nl-btn-secondary nl-btn-sm"><Edit size={14} /> Editar</button>
              <button type="button" onClick={abrirCobranca} className="nl-btn nl-btn-sm !border-[var(--color-success)] !bg-[var(--color-success)] !text-white">
                <Wallet size={14} /> Registar pagamento
              </button>
            </>
          )}
        </div>
      </div>
    </AppModalShell>
  );
}
