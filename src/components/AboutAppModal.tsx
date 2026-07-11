// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { Globe, X } from 'lucide-react';
import { APP_ICON_PATH, COMPANY_AUTHOR, COMPANY_EMAIL, COMPANY_WEBSITE, NEXT_LAB_ICON } from '../constants';

export default function AboutAppModal({ model }: { model: unknown }) {
  const { appLogo, licencaDados, electron, setMostrarSobreDoc } = model;
  return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4 animate-fade-in" onClick={() => setMostrarSobreDoc(false)}>
          <div className="bg-[var(--bg-surface)] w-full max-w-[520px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>

            <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
              <div className="flex-1 flex items-center gap-2.5 px-4">
                <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                  <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
              </div>
              <div className="flex-1 text-center whitespace-nowrap">
                <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Sobre a Aplicação</h2>
              </div>
              <div className="flex-1 flex justify-end px-3">
                <button onClick={() => setMostrarSobreDoc(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-light)]">
                <div className="w-12 h-12 rounded-[var(--radius-control)] bg-[var(--color-secondary-lighter)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <img src={appLogo || APP_ICON_PATH} className="w-8 h-8 object-contain" alt="NEXTLevel" />
                </div>
                <div>
                  <p className="text-[16px] font-black nl-text tracking-tight leading-none">NEXTLevel</p>
                  <p className="text-[11px] nl-text-muted mt-1">Sistema de Gestão de Academias · v1.0 Beta</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Versão', value: '1.0.0 Beta' },
                  { label: 'Plataforma', value: 'macOS · Windows · Desktop' },
                  { label: 'Base de Dados', value: 'SQLite · Offline · Local' },
                  { label: 'Licença', value: licencaDados.tipo ? `${licencaDados.tipo} · ${licencaDados.expiracao || 'Vitalícia'}` : 'Não activada' },
                  { label: 'Ano', value: String(new Date().getFullYear()) },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-[6px] bg-[var(--color-secondary-lighter)]/30 border border-[var(--border-light)]">
                    <span className="text-[11px] font-bold nl-text-muted uppercase tracking-wider">{item.label}</span>
                    <span className="text-[12px] font-bold nl-text text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between px-3 py-3 rounded-[6px] bg-gradient-to-r from-slate-50 to-white border border-[var(--border-light)]">
                <div className="flex items-center gap-3">
                  <img src={NEXT_LAB_ICON} className="w-6 h-6 object-contain opacity-50" alt="NEXT Lab" />
                  <div>
                    <p className="text-[12px] font-bold nl-text leading-none">NEXT Lab</p>
                    <p className="text-[10px] nl-text-muted mt-0.5">Creative Studio · desde 1995</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold nl-text">{COMPANY_AUTHOR}</p>
                  <p className="text-[10px] nl-text-muted">{COMPANY_EMAIL}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-between shrink-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">© {new Date().getFullYear()} NEXT Lab</p>
              <div className="flex gap-3">
                <button onClick={() => setMostrarSobreDoc(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Fechar</button>
                <button onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)} className="nl-btn !h-9 !px-5 !text-[11px] font-bold !bg-slate-800 !text-white hover:!bg-slate-900">
                  <Globe size={14} /> linktr.ee/next.lab
                </button>
              </div>
            </div>

          </div>
        </div>
  );
}
