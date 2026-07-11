// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { AlertCircle, CheckCircle2, Wallet } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';
import { formatCve, normalizeAmount } from '../lib/billing';
import AppModalShell from './AppModalShell';

export default function ResolvePendingModal({ model }: { model: unknown }) {
  const {
    alunoParaResolver,
    mesesParaResolver,
    appLogo,
    setMostrarResolverPendencias,
    resolverPendencias,
  } = model;

  const fechar = () => setMostrarResolverPendencias(false);
  const total = formatCve(normalizeAmount(alunoParaResolver.plano) * mesesParaResolver.length);

  return (
    <AppModalShell
      title="Resolver pendências"
      subtitle="Regularização de mensalidades"
      onClose={fechar}
      appLogo={appLogo || APP_ICON_PATH}
      maxWidth="max-w-[450px]"
      zIndex={150}
      accent="var(--color-warning)"
      footer={(
        <>
          <button type="button" onClick={fechar} className="nl-btn nl-btn-secondary !h-9">
            Cancelar
          </button>
          <button
            type="button"
            onClick={resolverPendencias}
            className="nl-btn !h-10 !border-amber-700 !bg-amber-600 !px-5 !text-white hover:!bg-amber-700"
          >
            <CheckCircle2 size={15} /> Resolver {mesesParaResolver.length} mensalidade(s)
          </button>
        </>
      )}
    >
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-amber-100 bg-amber-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle size={18} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] nl-text-muted">Estás a regularizar a conta de</p>
            <p className="truncate text-[16px] font-bold nl-text">{alunoParaResolver.nome}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] nl-text-muted">Meses selecionados</p>
          <div className="grid grid-cols-2 gap-2">
            {mesesParaResolver.map((mes) => (
              <div
                key={mes}
                className="flex items-center gap-2 rounded-[var(--radius-control)] border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700"
              >
                <CheckCircle2 size={12} /> {mes}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Wallet size={15} className="text-white" />
            </div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-white">Total a liquidar</span>
          </div>
          <span className="text-[20px] font-black tabular-nums text-white">{total}</span>
        </div>
      </div>
    </AppModalShell>
  );
}
