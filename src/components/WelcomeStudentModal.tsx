// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';
import AppModalShell from './AppModalShell';

export default function WelcomeStudentModal({ model }: { model: unknown }) {
  const {
    alunoBoasVindas,
    msgBoasVindas,
    appLogo,
    nomeAcademia,
    electron,
    setMostrarBoasVindas,
    setAlunoBoasVindas,
    setMsgBoasVindas,
  } = model;

  const telefone = (alunoBoasVindas.telefone || '').replace(/\D/g, '');
  const whatsappUrl = telefone
    ? `https://wa.me/${telefone}?text=${encodeURIComponent(msgBoasVindas)}`
    : null;
  const fechar = () => {
    setMostrarBoasVindas(false);
    setAlunoBoasVindas(null);
    setMsgBoasVindas('');
  };

  return (
    <AppModalShell
      title="Matrícula concluída"
      subtitle={nomeAcademia || 'Next Level'}
      onClose={fechar}
      appLogo={appLogo || APP_ICON_PATH}
      maxWidth="max-w-[480px]"
      zIndex={200}
      accent="var(--color-success)"
      footer={(
        <>
          <button type="button" onClick={fechar} className="nl-btn nl-btn-ghost !h-9">
            Pular
          </button>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={fechar}
              className="nl-btn !h-9 !border-emerald-700 !bg-emerald-600 !text-white hover:!bg-emerald-700"
            >
              <MessageSquare size={14} /> Enviar WhatsApp
            </a>
          )}
          <button type="button" onClick={fechar} className="nl-btn nl-btn-primary !h-9">
            Concluir
          </button>
        </>
      )}
    >
      <div className="space-y-4 px-5 py-5">
        <div className="flex items-center gap-4 rounded-[var(--radius-control)] border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-emerald-200 bg-white shadow-sm">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-emerald-800">
              <Sparkles size={14} />
              {alunoBoasVindas.nome} matriculado!
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-emerald-600">
              Plano: {alunoBoasVindas.plano} · {new Date().toLocaleDateString('pt-PT')}
              {alunoBoasVindas.categoria ? ` · ${alunoBoasVindas.categoria}` : ''}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-amber-700">
              ★ Aparece como novo na Início durante 7 dias
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest nl-text-muted">
            Mensagem de boas-vindas
          </label>
          <textarea
            value={msgBoasVindas}
            onChange={(e) => setMsgBoasVindas(e.target.value)}
            rows={6}
            className="nl-input resize-none text-[12px] leading-relaxed"
          />
        </div>
      </div>
    </AppModalShell>
  );
}
