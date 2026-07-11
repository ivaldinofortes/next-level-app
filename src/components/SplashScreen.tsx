import { NEXT_LAB_ICON } from '../constants';

/**
 * Splash leve e rápido — sem blur pesado nem loops longos.
 */
export default function SplashScreen({ appLogo }: { appLogo: string }) {
  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-[var(--bg-app,#f6f5f4)] nl-font-ui">
      <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]">
          <img src={appLogo} alt="" className="h-12 w-12 object-contain" />
        </div>

        <div className="text-center">
          <h1 className="text-[20px] font-bold tracking-tight nl-text">
            NEXT<span className="font-semibold text-[var(--color-primary)]">Level</span>
          </h1>
          <p className="mt-1 text-[11px] font-medium nl-text-muted">A carregar o sistema…</p>
        </div>

        <div className="h-1 w-36 overflow-hidden rounded-full bg-[var(--border-light)]">
          <div className="h-full w-1/2 rounded-full bg-[var(--color-primary)] animate-splash-bar" />
        </div>

        <div className="mt-4 flex items-center gap-1.5 opacity-50">
          <span className="text-[9px] font-bold uppercase tracking-widest nl-text-muted">by</span>
          <img src={NEXT_LAB_ICON} alt="NEXT Lab" className="h-3.5 object-contain" />
        </div>
      </div>

      <style>{`
        @keyframes splash-bar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(280%); }
        }
        .animate-splash-bar {
          animation: splash-bar 0.9s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
