// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { AlertCircle, CheckCircle2, Wallet, X } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';
import { formatCve, normalizeAmount } from '../lib/billing';

export default function ResolvePendingModal({ model }: { model: unknown }) {
  const { alunoParaResolver, mesesParaResolver, appLogo, setMostrarResolverPendencias, resolverPendencias } = model;
  return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4 animate-fade-in" onClick={() => setMostrarResolverPendencias(false)}>
        <div className="bg-[var(--bg-surface)] w-full max-w-[450px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
          <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Resolver Pendências</h2>
            </div>
            <div className="flex-1 flex justify-end px-3">
              <button onClick={() => setMostrarResolverPendencias(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-[6px] bg-amber-50 border border-amber-100">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[12px] nl-text-muted">Estás a regularizar a conta de</p>
                <p className="text-[16px] font-black nl-text">{alunoParaResolver.nome}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Meses Selecionados</p>
              <div className="grid grid-cols-2 gap-2">
                {mesesParaResolver.map(mes => (
                  <div key={mes} className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold">
                    <CheckCircle2 size={12} /> {mes}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-200/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Wallet size={15} className="text-white" />
                </div>
                <span className="text-[12px] font-black text-white uppercase tracking-[0.12em]">Total a Liquidar</span>
              </div>
              <span className="text-[20px] font-black text-white drop-shadow-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatCve(normalizeAmount(alunoParaResolver.plano) * mesesParaResolver.length)}
              </span>
            </div>
          </div>

          <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button onClick={() => setMostrarResolverPendencias(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Cancelar</button>
            <button onClick={resolverPendencias} className="nl-btn !h-10 !px-7 !text-[12px] font-black !bg-gradient-to-r !from-amber-600 !to-amber-500 !text-white !border-none !shadow-lg !shadow-amber-200/50 hover:!shadow-amber-300/60 hover:!scale-[1.02] active:!scale-[0.98] transition-all">
              <CheckCircle2 size={16} /> Resolver {mesesParaResolver.length} Mensalidades
            </button>
          </div>
        </div>
      </div>
  );
}
