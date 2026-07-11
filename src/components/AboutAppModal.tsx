// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { Globe } from 'lucide-react';
import {
  APP_ICON_PATH,
  COMPANY_AUTHOR,
  COMPANY_EMAIL,
  COMPANY_WEBSITE,
  NEXT_LAB_ICON,
} from '../constants';
import AppModalShell from './AppModalShell';

export default function AboutAppModal({ model }: { model: unknown }) {
  const { appLogo, licencaDados, electron, setMostrarSobreDoc } = model;

  return (
    <AppModalShell
      title="Sobre a aplicação"
      subtitle="NEXTLevel · Sistema de gestão de academias"
      onClose={() => setMostrarSobreDoc(false)}
      appLogo={appLogo || APP_ICON_PATH}
      maxWidth="max-w-[480px]"
      zIndex={2000}
      accent="var(--color-primary)"
      footer={(
        <>
          <button type="button" onClick={() => setMostrarSobreDoc(false)} className="nl-btn nl-btn-secondary !h-9">
            Fechar
          </button>
          <button
            type="button"
            onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)}
            className="nl-btn nl-btn-primary !h-9"
          >
            <Globe size={14} /> linktr.ee/next.lab
          </button>
        </>
      )}
    >
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 border-b border-[var(--border-light)] pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--color-secondary-lighter)]">
            <img src={appLogo || APP_ICON_PATH} className="h-8 w-8 object-contain" alt="" />
          </div>
          <div>
            <p className="text-[16px] font-bold tracking-tight nl-text">NEXTLevel</p>
            <p className="mt-0.5 text-[12px] nl-text-muted">Gestão de academias · v1.0</p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { label: 'Versão', value: '1.0.0' },
            { label: 'Plataforma', value: 'macOS · Windows · Desktop' },
            { label: 'Base de dados', value: 'SQLite · Offline · Local' },
            {
              label: 'Licença',
              value: licencaDados.tipo
                ? `${licencaDados.tipo} · ${licencaDados.expiracao || 'Vitalícia'}`
                : 'Não activada',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-[var(--radius-control)] border border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/35 px-3 py-2.5"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider nl-text-muted">{item.label}</span>
              <span className="text-right text-[12px] font-semibold nl-text">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--border-light)] bg-gradient-to-r from-[var(--color-secondary-lighter)] to-[var(--bg-surface)] px-3 py-3">
          <div className="flex items-center gap-3">
            <img src={NEXT_LAB_ICON} className="h-6 w-6 object-contain opacity-60" alt="" />
            <div>
              <p className="text-[12px] font-bold leading-none nl-text">NEXT Lab</p>
              <p className="mt-0.5 text-[10px] nl-text-muted">Creative Studio · desde 1995</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold nl-text">{COMPANY_AUTHOR}</p>
            <p className="text-[10px] nl-text-muted">{COMPANY_EMAIL}</p>
          </div>
        </div>
      </div>
    </AppModalShell>
  );
}
