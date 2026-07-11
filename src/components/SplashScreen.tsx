import { NEXT_LAB_ICON } from '../constants';

export default function SplashScreen({ appLogo }: { appLogo: string }) {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-[2000] text-white">
      <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
        <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full animate-pulse" />
        <img src={appLogo} alt="App Logo" className="w-full h-full object-contain relative z-10 animate-in zoom-in duration-700" />
      </div>
      <div className="flex flex-col items-center gap-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase">NEXT<span className="font-light normal-case">Level</span></h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Sistema de gerenciamento de Academias</p>
        </div>
        <div className="w-40 h-0.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 animate-progress-loading" /></div>
        <div className="flex items-center gap-2 mt-8 opacity-40 hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by</span>
          <img src={NEXT_LAB_ICON} alt="NEXT Lab" className="h-4 object-contain" />
        </div>
      </div>
      <style>{`@keyframes progress-loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } .animate-progress-loading { width: 100%; animation: progress-loading 1.5s ease-in-out infinite; }`}</style>
    </div>
  );
}
