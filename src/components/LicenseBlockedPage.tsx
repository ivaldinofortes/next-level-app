// @ts-nocheck -- Legacy license controller typing is isolated during App decomposition.
import { Mail, Phone, ShieldOff } from 'lucide-react';
import { COMPANY_EMAIL, COMPANY_PHONE } from '../constants';

export default function LicenseBlockedPage({ model }: { model: unknown }) {
  const { chaveReativacao, erroReativacao, electron, GlobalStyles, setChaveReativacao, setErroReativacao, setLicencaAtiva, carregarConfiguracoes, showToast, gerarBackup } = model;
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#172B4D] nl-font-ui p-6">
        <GlobalStyles theme="dark" />
        <div className="nl-card w-full max-w-[480px] text-center space-y-8 animate-slide-up bg-white p-12">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
            <ShieldOff size={48} className="text-red-500" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-[#172B4D] tracking-tight">Licença Expirada</h1>
            <p className="text-[#626F86] text-base leading-relaxed">
              O seu período de licença para o <strong>NEXTLevel</strong> terminou ou a chave é inválida. 
            </p>
          </div>
          
          <div className="bg-[#F4F5F7] p-6 rounded-xl space-y-4 border border-[#DFE1E6]">
             <p className="text-[11px] text-[#172B4D] font-bold uppercase tracking-widest">Renovar Licença</p>
             <div className="space-y-3">
               <input 
                 type="text" 
                 placeholder="Cole aqui a nova chave de licença..." 
                 value={chaveReativacao}
                 onChange={(e) => { setChaveReativacao(e.target.value); setErroReativacao(''); }}
                 className="w-full h-11 px-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-[14px] text-center font-mono"
               />
               {erroReativacao && <p className="text-[12px] text-red-600 font-bold">{erroReativacao}</p>}
               <button 
                 onClick={async () => {
                   if (!chaveReativacao) return;
                   const res = await electron?.ipcRenderer.invoke('license:validate-external', chaveReativacao);
                   if (res.success && res.license) {
                     await electron?.ipcRenderer.invoke('update-configuracao', 'license_key', chaveReativacao);
                     await electron?.ipcRenderer.invoke('update-configuracao', 'license_expiry', res.license.dataExpiracao || 'Vitalícia');
                     await carregarConfiguracoes();
                     setLicencaAtiva(true);
                     showToast('Sistema reativado com sucesso!');
                   } else {
                     setErroReativacao('Chave inválida ou expirada.');
                   }
                 }}
                 className="w-full h-11 bg-[#0052CC] text-white font-bold rounded-lg hover:bg-[#0747A6] transition-colors shadow-lg"
               >
                 Ativar Agora
               </button>
             </div>
          </div>

          <div className="pt-2">
             <p className="text-[13px] text-[#172B4D] font-bold uppercase tracking-widest mb-3">Suporte NEXT LAB</p>
             <div className="flex justify-center gap-6">
                <p className="text-[14px] text-[#626F86] flex items-center gap-2">
                  <Mail size={16} className="text-[#0052CC]" /> {COMPANY_EMAIL}
                </p>
                <p className="text-[14px] text-[#626F86] flex items-center gap-2">
                  <Phone size={16} className="text-[#0052CC]" /> {COMPANY_PHONE}
                </p>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button onClick={() => window.location.reload()} className="nl-btn nl-btn-secondary h-12 flex-1 font-bold">Verificar Novamente</button>
            <button onClick={gerarBackup} className="nl-btn nl-btn-primary h-12 flex-1 font-bold">Exportar Meus Dados</button>
          </div>
          
          <p className="text-[11px] text-[#8993A4] font-medium tracking-tight">
            NEXTLevel v1.0.0 • Desenvolvido com ❤️ por NEXT LAB
          </p>
        </div>
      </div>
    );
}
