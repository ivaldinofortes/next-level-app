// @ts-nocheck -- Legacy setup controller typing is isolated during App decomposition.
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Mail, Phone, Sparkles } from 'lucide-react';
import { APP_ICON_PATH, COMPANY_EMAIL, COMPANY_PHONE, COMPANY_WEBSITE } from '../constants';

export default function InitialSetupPage({ model }: { model: unknown }) {
  const { appLogo, setupStep, setupData, setupLicenseInfo, setupError, electron, setAppLogo, setSetupData, setSetupStep, saltarSetupDesenvolvedor, proximoPassoSetup, finalizarSetupTotal } = model;
    return (
      <div className="fixed inset-0 nl-modal-overlay flex items-center justify-center z-[1000] p-4">
        <div className="bg-[var(--bg-surface)] w-full max-w-[600px] h-[500px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in">
          
          <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Configuração Inicial</h2>
            </div>
            <div className="flex-1 flex justify-end px-3">
            </div>
          </div>

          <div className="h-1 w-full bg-slate-200 flex shrink-0">
             {[1,2,3,4,5,6].map(s => (
               <div key={s} className={`h-full flex-1 transition-all duration-500 ${setupStep >= s ? 'bg-blue-600' : ''}`} />
             ))}
          </div>

          <div className="flex-1 overflow-y-auto p-10 flex flex-col bg-white">
            {setupStep === 1 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-blue-50 rounded-[6px] flex items-center justify-center p-4">
                  <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">NEXT<span className="font-light normal-case">Level</span></h1>
                  <p className="text-slate-500 font-medium mt-1">Sistema de gerenciamento de Academias</p>
                </div>
                <p className="text-slate-600 max-w-sm text-[15px] leading-relaxed">
                  Sistema de gestão profissional focado em alta performance operacional.
                </p>
                
                {import.meta.env.DEV && (
                  <button
                    onClick={saltarSetupDesenvolvedor}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors mt-4"
                  >
                    [ Ignorar (Modo Desenvolvedor) ]
                  </button>
                )}
              </div>
            )}

            {setupStep === 2 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                 <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={32} />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-slate-900">Sobre NEXT Lab</h2>
                   <p className="text-slate-500 mt-2 leading-relaxed max-w-md mx-auto text-[14px]">
                     Desenvolvemos aplicações profissionais para gestão de negócios modernos.
                   </p>
                 </div>
                 <div className="bg-slate-50 w-full p-6 rounded-xl border border-slate-100 text-left space-y-3">
                   <div className="flex items-center gap-3 text-slate-700">
                      <Mail size={16} className="text-blue-600" />
                      <span className="text-[14px] font-medium">{COMPANY_EMAIL}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-700">
                      <Phone size={16} className="text-blue-600" />
                      <span className="text-[14px] font-medium">{COMPANY_PHONE}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-700">
                      <ExternalLink size={16} className="text-blue-600" />
                      <span className="text-[14px] font-medium cursor-pointer hover:underline" onClick={() => electron?.ipcRenderer.invoke('open-external', COMPANY_WEBSITE)}>
                         linktr.ee/next.lab
                      </span>
                   </div>
                 </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="space-y-5 animate-slide-up">
                <h2 className="text-xl font-bold text-slate-900">Dados da Sua Empresa</h2>
                {/* Logo upload */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-16 h-16 rounded-[var(--radius-control)] bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={appLogo || APP_ICON_PATH} className="w-12 h-12 object-contain" alt="Logo" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-slate-700 mb-1">Logótipo da Academia (opcional)</p>
                    <p className="text-[11px] text-slate-400 mb-2">PNG, JPEG ou SVG · fundo transparente recomendado</p>
                    <input
                      type="file"
                      id="setup-logo-upload"
                      className="hidden"
                      accept="image/svg+xml,image/png,image/jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const result = ev.target?.result as string;
                            setAppLogo(result);
                            localStorage.setItem('nl_app_logo', result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button onClick={() => document.getElementById('setup-logo-upload')?.click()} className="px-4 h-8 text-[12px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-700">
                      Carregar Logo
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nome da Academia *</label>
                      <input type="text" value={setupData.nomeAcademia} onChange={e => setSetupData({...setupData, nomeAcademia: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="Ex: Master Gym" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Institucional *</label>
                      <input type="email" value={setupData.email} onChange={e => setSetupData({...setupData, email: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="contacto@academia.com" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Telefone *</label>
                    <input type="text" value={setupData.telefone} onChange={e => setSetupData({...setupData, telefone: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="+238 000 000 000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Morada (Opcional)</label>
                    <input type="text" value={setupData.morada} onChange={e => setSetupData({...setupData, morada: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="Rua, Bairro, Cidade" />
                  </div>
                </div>
              </div>
            )}

            {setupStep === 4 && (
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-xl font-bold text-slate-900">Criar Conta de Administrador</h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email do Admin *</label>
                    <input type="email" value={setupData.adminEmail} onChange={e => setSetupData({...setupData, adminEmail: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="admin@academia.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Senha *</label>
                      <input type="password" value={setupData.adminSenha} onChange={e => setSetupData({...setupData, adminSenha: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="••••••••" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirmar Senha *</label>
                      <input type="password" value={setupData.confirmarSenha} onChange={e => setSetupData({...setupData, confirmarSenha: e.target.value})} className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[14px]" placeholder="••••••••" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 5 && (
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-xl font-bold text-slate-900">Ativar Licença</h2>
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  Insira o código de licença fornecido. Se não tem licença, solicite em: <span className="font-bold text-blue-600">{COMPANY_EMAIL}</span>
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Código de Licença *</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={setupData.licenca} 
                        onChange={e => setSetupData({...setupData, licenca: e.target.value.toUpperCase()})} 
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[15px] font-mono tracking-widest"
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                      />
                      {setupLicenseInfo && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-2">
                           <CheckCircle2 size={18} />
                           <span className="text-[12px] font-bold uppercase tracking-wider">✓ Válida</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 6 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-slide-up">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Instalação Concluída!</h2>
                  <p className="text-slate-600 mt-2">Bem-vindo, <span className="font-bold">{setupData.nomeAcademia}</span>!</p>
                </div>
                <div className="bg-slate-50 w-full p-6 rounded-xl border border-slate-100 text-left">
                  <p className="text-[13px] text-slate-500 uppercase font-bold tracking-widest mb-3">Resumo da Licença</p>
                  <div className="grid grid-cols-2 gap-y-2 text-[14px]">
                     <span className="text-slate-600">Tipo:</span>
                     <span className="font-bold text-slate-900 capitalize">{setupLicenseInfo?.tipo}</span>
                     <span className="text-slate-600">Válida até:</span>
                     <span className="font-bold text-slate-900">{setupLicenseInfo?.dataExpiracao || 'Vitalício'}</span>
                  </div>
                </div>
              </div>
            )}

            {setupError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 text-[13px] animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={16} />
                {setupError}
              </div>
            )}
          </div>

          <div className="px-10 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
             <button 
               onClick={() => setupStep > 1 && setSetupStep(prev => prev - 1)}
               className={`text-[14px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors ${setupStep === 1 || setupStep === 6 ? 'invisible' : ''}`}
             >
                <ChevronLeft size={16} /> Anterior
             </button>
             
             {setupStep < 6 ? (
               <button 
                 onClick={proximoPassoSetup}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 rounded-lg font-bold text-[14px] shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
               >
                 Próximo <ChevronRight size={16} />
               </button>
             ) : (
               <button 
                 onClick={finalizarSetupTotal}
                 className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 h-11 rounded-lg font-bold text-[14px] shadow-lg shadow-emerald-600/20 transition-all"
               >
                 Iniciar Aplicação
               </button>
             )}
          </div>
        </div>
      </div>
    );
}
