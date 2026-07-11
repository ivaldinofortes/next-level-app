// @ts-nocheck -- Controller typing is intentionally isolated while the legacy App state is decomposed.
import { Calendar, CheckCircle2, ExternalLink, FileText, Save, UserPlus, X } from 'lucide-react';
import { APP_ICON_PATH } from '../constants';
import { isImportedStatus } from '../lib/studentStatus';
function ModalFrame({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 nl-modal-overlay flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={onClose} role="dialog" aria-modal="true"><div className="bg-[var(--bg-surface)] w-full max-w-[650px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={(event) => event.stopPropagation()}>{children}</div></div>;
}

export default function StudentFormModal({ mode, model }: { mode: 'create' | 'edit'; model: any }) {
  const {
    appLogo, novoAluno, categorias, sugestoesNome, previewVencimento, alunoEdicao,
    novoAlunoDefault, setMostrarForm, salvarAluno, handleNomeChange, setSugestoesNome,
    abrirPerfilAluno, setNovoAluno, setMostrarFormEdicao, setAlunoEdicao, salvarEdicao,
    ativarImportado,
  } = model;
  if (mode === 'create') return (
    <ModalFrame onClose={() => setMostrarForm(false)}>

          {/* Cabeçalho */}
          <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Nova Matrícula</h2>
            </div>
            <div className="flex-1 flex justify-end px-3">
              <button onClick={() => setMostrarForm(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                <X size={16} />
              </button>
            </div>
          </div>

          <form onSubmit={salvarAluno} className="overflow-y-auto custom-scrollbar">

            {/* Secção 1 — Identificação */}
            <div className="px-5 pt-4 pb-3 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Identificação</p>

              {/* Nome */}
              <div>
                <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nome do aluno..."
                    value={novoAluno.nome}
                    onChange={e => handleNomeChange(e.target.value)}
                    className="nl-input w-full h-10 px-3 text-[13px]"
                    required
                    autoFocus
                    onBlur={() => setTimeout(() => setSugestoesNome([]), 200)}
                  />
                  {sugestoesNome.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-md shadow-lg z-[110] overflow-hidden animate-scale-in">
                      <p className="px-3 py-1.5 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contactos Existentes</p>
                      {sugestoesNome.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setMostrarForm(false);
                            setSugestoesNome([]);
                            abrirPerfilAluno(s);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <p className="text-[12px] font-bold text-slate-700">{s.nome}</p>
                            <p className="text-[10px] text-slate-400">{s.telefone || 'Sem telefone'}</p>
                          </div>
                          <ExternalLink size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tel + Categoria */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">
                    Telemóvel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+238 000 00 00"
                    value={novoAluno.telefone}
                    onChange={e => setNovoAluno({ ...novoAluno, telefone: e.target.value })}
                    className="nl-input w-full h-10 px-3 text-[13px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Modalidade</label>
                  <select
                    value={novoAluno.categoria}
                    onChange={e => setNovoAluno({ ...novoAluno, categoria: e.target.value })}
                    className="nl-input w-full h-10 px-3 text-[13px] cursor-pointer"
                  >
                    <option value="">Sem categoria</option>
                    {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {/* Sexo (opcional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Sexo</label>
                  <select
                    value={novoAluno.sexo}
                    onChange={e => setNovoAluno({ ...novoAluno, sexo: e.target.value })}
                    className="nl-input w-full h-10 px-3 text-[13px] cursor-pointer"
                  >
                    <option value="">—</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Separador tracejado */}
            <div style={{ borderTop: '1px dashed var(--border-light)', margin: '0 20px' }} />

            {/* Secção 2 — Plano & Pagamento */}
            <div className="px-5 pt-4 pb-5 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Plano & Pagamento</p>

              {/* Mensalidade + Data inscrição */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">
                    Mensalidade (CVE) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="3 500"
                    value={novoAluno.plano}
                    onChange={e => setNovoAluno({ ...novoAluno, plano: e.target.value })}
                    className="nl-input w-full h-10 px-3 text-[14px] font-bold"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1">Data de inscrição</label>
                  <input
                    type="date"
                    value={novoAluno.data_matricula}
                    onChange={e => setNovoAluno({ ...novoAluno, data_matricula: e.target.value })}
                    className="nl-input w-full h-10 px-3 text-[13px]"
                  />
                </div>
              </div>

              {/* Modo de inscrição — pills compactos */}
              <div>
                <label className="block text-[10px] font-bold nl-text-muted uppercase tracking-[0.12em] mb-1.5">Modo de inscrição</label>
                <div className="flex gap-2">
                  {([
                    { id: 'matricula',       label: 'Só matrícula',  desc: 'Cobra mais tarde',  icon: <FileText size={13} /> },
                    { id: 'matricula_pago',  label: 'Pagar agora',   desc: 'Regista pagamento', icon: <CheckCircle2 size={13} /> },
                  ] as const).map(opt => {
                    const active = novoAluno.modo_inscricao === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNovoAluno({ ...novoAluno, modo_inscricao: opt.id })}
                        className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-surface)] border-2 text-left transition-all ${
                          active
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                            : 'border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/40 hover:border-[var(--border)]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 ${active ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--border-light)] text-[var(--text-secondary)]'}`}>
                          {opt.icon}
                        </div>
                        <div>
                          <p className={`text-[11px] font-bold leading-tight ${active ? 'text-[var(--color-primary)]' : 'nl-text'}`}>{opt.label}</p>
                          <p className="text-[9px] text-[var(--text-secondary)] leading-tight">{opt.desc}</p>
                        </div>
                        {active && <CheckCircle2 size={13} className="ml-auto text-[var(--color-primary)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview da próxima cobrança */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-control)] bg-[#EEF4FF] border border-[#C7DEFF]">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-[#1D4ED8]" />
                  <span className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-[0.1em]">
                    {novoAluno.modo_inscricao === 'matricula_pago' ? 'Próxima cobrança' : 'Primeira cobrança'}
                  </span>
                </div>
                <span className="text-[13px] font-extrabold text-[#1D4ED8]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {previewVencimento || '— / — / ——'}
                </span>
              </div>
            </div>

          </form>

          {/* Rodapé */}
          <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button type="button" onClick={() => setMostrarForm(false)} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Cancelar</button>
            <button type="button" onClick={salvarAluno} className="nl-btn nl-btn-primary !h-9 !px-6 !text-[11px] font-bold">
              <UserPlus size={14} /> Confirmar Registo
            </button>
          </div>
      
    </ModalFrame>
  );
  return (
    <>
      <div className="fixed inset-0 nl-modal-overlay flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
        <div className="bg-[var(--bg-surface)] w-full max-w-[650px] shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-[6px] border border-[var(--border)] overflow-hidden flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 40px)' }} onClick={e => e.stopPropagation()}>
          <div className="bg-[#F1F4F9] border-b border-[#DDE2EB] h-12 flex items-center shrink-0">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <div className="h-6 w-6 rounded-md bg-white/50 backdrop-blur-sm p-1 border border-white/40 shadow-sm flex items-center justify-center">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider leading-none">Editar Registo: {alunoEdicao.id.slice(-8)}</h2>
            </div>
            <div className="flex-1 flex justify-end px-3">
              <button onClick={() => { setMostrarFormEdicao(false); setAlunoEdicao(null); setNovoAluno(novoAlunoDefault); }} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Fechar">
                <X size={16} />
              </button>
            </div>
          </div>

          <form id="editar-aluno-form" onSubmit={salvarEdicao} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Nome Completo</label>
                <input type="text" value={novoAluno.nome} onChange={(e) => setNovoAluno({ ...novoAluno, nome: e.target.value })} className="nl-input w-full h-12 px-4" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Telefone</label>
                <input type="tel" value={novoAluno.telefone} onChange={(e) => setNovoAluno({ ...novoAluno, telefone: e.target.value })} className="nl-input w-full h-12 px-4" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Modalidade</label>
                <select value={novoAluno.categoria} onChange={(e) => setNovoAluno({ ...novoAluno, categoria: e.target.value })} className="nl-input w-full h-12 px-4 cursor-pointer" required>
                  {Array.from(new Set([...categorias, novoAluno.categoria || 'Geral'])).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Mensalidade (CVE)</label>
                <input type="text" value={novoAluno.plano} onChange={(e) => setNovoAluno({ ...novoAluno, plano: e.target.value })} className="nl-input w-full h-12 px-4 font-bold" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Próximo Vencimento</label>
                <input type="text" value={(novoAluno as any).vencimento} onChange={(e) => setNovoAluno({ ...novoAluno, vencimento: e.target.value } as any)} className="nl-input w-full h-12 px-4" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Data de Inscrição</label>
                <input type="date" value={novoAluno.data_matricula} onChange={(e) => setNovoAluno({ ...novoAluno, data_matricula: e.target.value })} className="nl-input w-full h-12 px-4" />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Sexo</label>
                <select value={novoAluno.sexo} onChange={(e) => setNovoAluno({ ...novoAluno, sexo: e.target.value })} className="nl-input w-full h-12 px-4 cursor-pointer">
                  <option value="">Selecionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Modo de Cobrança</label>
                <select value={novoAluno.modo_cobranca} onChange={(e) => setNovoAluno({ ...novoAluno, modo_cobranca: e.target.value as 'mensalidade_movel' | 'mensalidade_fixa' })} className="nl-input w-full h-12 px-4 cursor-pointer" required>
                  <option value="mensalidade_movel">Móvel (30 dias após pagamento)</option>
                  <option value="mensalidade_fixa">Fixa (dia 1 ao 5 do mês)</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Endereço de Email</label>
                <input type="email" value={novoAluno.email} onChange={(e) => setNovoAluno({ ...novoAluno, email: e.target.value })} className="nl-input w-full h-12 px-4" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Morada de Residência</label>
                <input type="text" value={novoAluno.morada} onChange={(e) => setNovoAluno({ ...novoAluno, morada: e.target.value })} className="nl-input w-full h-12 px-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Alergias</label>
                <textarea value={novoAluno.alergias} onChange={(e) => setNovoAluno({ ...novoAluno, alergias: e.target.value })} className="nl-input min-h-[112px] px-4 py-3 resize-none" placeholder="Informações relevantes para a equipa..." />
              </div>
              <div className="space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Objetivos</label>
                <textarea value={novoAluno.objetivos} onChange={(e) => setNovoAluno({ ...novoAluno, objetivos: e.target.value })} className="nl-input min-h-[112px] px-4 py-3 resize-none" placeholder="Ex: perda de peso, ganho de massa..." />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block text-[12px] font-bold nl-text-muted uppercase tracking-wider px-1">Horário Preferido</label>
                <input type="text" value={novoAluno.horario_preferido} onChange={(e) => setNovoAluno({ ...novoAluno, horario_preferido: e.target.value })} className="nl-input w-full h-12 px-4" placeholder="Ex: 18:00 - 20:00" />
              </div>
            </div>
          </form>

          <div className="bg-[#F8F9FC] border-t border-[#DDE2EB] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button type="button" onClick={() => { setMostrarFormEdicao(false); setAlunoEdicao(null); setNovoAluno(novoAlunoDefault); }} className="nl-btn nl-btn-secondary !h-9 !px-5 !text-[11px] font-bold">Cancelar</button>
            {isImportedStatus(alunoEdicao?.status) && (
              <button type="button" onClick={ativarImportado} className="nl-btn !h-9 !px-5 !text-[11px] font-bold !bg-emerald-600 !text-white hover:!bg-emerald-700 border border-emerald-700 shadow-sm">
                <CheckCircle2 size={14} /> Confirmar e Ativar
              </button>
            )}
            <button type="submit" form="editar-aluno-form" className="nl-btn nl-btn-primary !h-9 !px-6 !text-[11px] font-bold">
              <Save size={14} /> Guardar Alterações
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
