// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { Star } from 'lucide-react';

export default function AppStatusBar({ model }: { model: unknown }) {
  const { online, totalAlunos, mensalidadesPendentes, zoomLista, relatorioMensalDisponivel, setZoomLista, setAba } = model;
  return (
<footer className="bg-[var(--color-primary)] text-white px-8 h-9 flex justify-between items-center text-[12px] font-semibold shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
               <div className={"w-2 h-2 rounded-full " + (online ? "bg-[#B3F5C0]" : "bg-[#FFD8A8]")} />
               <span className="opacity-80 uppercase tracking-widest text-[10px]">{online ? "Sistema conectado" : "Modo local"}</span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div className="flex items-center gap-2">
               <span className="opacity-60 uppercase tracking-widest text-[10px]">Alunos:</span>
               <span>{totalAlunos}</span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div className="flex items-center gap-2">
               <span className="opacity-60 uppercase tracking-widest text-[10px]">Atrasados:</span>
               <span className={mensalidadesPendentes > 0 ? 'text-red-200 animate-pulse' : ''}>{mensalidadesPendentes}</span>
            </div>
         </div>

         <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
               <span className="opacity-60 text-[10px] uppercase tracking-widest">Vista</span>
               <input 
                  type="range" 
                  min="60" 
                  max="100" 
                  value={zoomLista}
                  onChange={(e) => setZoomLista(parseInt(e.target.value))}
                  className="w-32 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-white"
               />
               <span className="w-8 text-right opacity-80">{zoomLista}%</span>
            </div>
            {relatorioMensalDisponivel && (
               <button onClick={() => setAba('relatorios_detalhado')} className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-all border border-white/10">
                  <Star size={10} className="text-amber-300 fill-amber-300" />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]">Relatório de {relatorioMensalDisponivel}</span>
               </button>
            )}
            <span className="opacity-80 uppercase tracking-widest text-[10px]">{new Date().toLocaleDateString('pt-PT')}</span>
            <div className="opacity-40 font-bold uppercase tracking-[0.2em] text-[9px]">NEXT LEVEL PRO</div>
         </div>
      </footer>
  );
}
