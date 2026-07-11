// @ts-nocheck -- Legacy controller typing is isolated during App decomposition.
import { CheckCircle2, MessageSquare, X } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';

export default function WelcomeStudentModal({ model }: { model: unknown }) {
  const { alunoBoasVindas, msgBoasVindas, appLogo, nomeAcademia, electron, setMostrarBoasVindas, setAlunoBoasVindas, setMsgBoasVindas } = model;

        const telefone = (alunoBoasVindas.telefone || '').replace(/\D/g, '');
        const whatsappUrl = telefone
          ? `https://wa.me/${telefone}?text=${encodeURIComponent(msgBoasVindas)}`
          : null;
        const fechar = () => { setMostrarBoasVindas(false); setAlunoBoasVindas(null); setMsgBoasVindas(''); };
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[200] p-4 animate-fade-in" onClick={fechar}>
            <div className="bg-[var(--bg-surface)] w-full max-w-[480px] shadow-2xl rounded-[6px] border border-[var(--border)] overflow-hidden animate-scale-in flex flex-col" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0 px-4 gap-3">
                <div className="h-6 w-6 rounded-md bg-white/50 p-1 border border-white/40 shadow-sm flex items-center justify-center">
                  <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{nomeAcademia}</span>
                <div className="flex-1" />
                <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Nova Matrícula</h2>
                <div className="flex-1" />
                <button onClick={fechar} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"><X size={16} /></button>
              </div>

              {/* Conteúdo */}
              <div className="px-6 py-5 space-y-4">
                {/* Confirmação */}
                <div className="flex items-center gap-4 p-4 rounded-[6px] bg-green-50 border border-green-100">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm border-2 border-green-200 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={24} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-green-800">{alunoBoasVindas.nome} matriculado com sucesso!</p>
                    <p className="text-[11px] text-green-600 font-medium mt-0.5">
                      Plano: {alunoBoasVindas.plano} · {new Date().toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>

                {/* Mensagem editável */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Mensagem de Boas-Vindas</label>
                  <textarea
                    value={msgBoasVindas}
                    onChange={e => setMsgBoasVindas(e.target.value)}
                    rows={6}
                    className="nl-input resize-none text-[12px] leading-relaxed"
                  />
                </div>
              </div>

              {/* Rodapé */}
              <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-between gap-3 shrink-0">
                <button onClick={fechar} className="nl-btn nl-btn-ghost !h-9 !px-4 !text-[11px] font-bold">Pular</button>
                <div className="flex items-center gap-2">
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={fechar}
                      className="nl-btn !h-9 !px-5 !text-[11px] font-bold text-white flex items-center gap-2 rounded-[5px] transition-all hover:brightness-105 shadow-sm"
                      style={{ background: '#25D366' }}
                    >
                      <MessageSquare size={14} /> Enviar via WhatsApp
                    </a>
                  )}
                  <button onClick={fechar} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Fechar</button>
                </div>
              </div>
            </div>
          </div>
        );
      
}
