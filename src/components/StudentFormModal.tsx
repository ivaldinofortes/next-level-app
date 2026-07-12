// @ts-nocheck -- Controller typing is intentionally isolated while the legacy App state is decomposed.
import { useMemo, useRef, useState } from 'react';
import {
  Calendar, Camera, CheckCircle2, ExternalLink, FileText, ImagePlus,
  Save, Sparkles, UserPlus, X,
} from 'lucide-react';
import {
  APP_ICON_PATH,
  ENROLLMENT_CATEGORIES,
  getDefaultPlanForCategory,
} from '../constants';
import { isImportedStatus, STUDENT_STATUS_OPTIONS } from '../lib/studentStatus';
import { getCategoryTone, getAlunoIniciais } from '../utils/formatting';

function ModalFrame({
  children,
  onClose,
  maxWidth = 'max-w-[720px]',
  accentColor,
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
  accentColor?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 nl-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`flex w-full ${maxWidth} flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] animate-scale-in`}
        style={{
          maxHeight: 'calc(100vh - 32px)',
          boxShadow: accentColor
            ? `0 0 0 1px color-mix(in srgb, ${accentColor} 25%, transparent), 0 24px 64px rgba(0,0,0,0.18)`
            : undefined,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function StudentFormModal({ mode, model }: { mode: 'create' | 'edit'; model: any }) {
  const {
    appLogo, novoAluno, categorias, sugestoesNome, previewVencimento, alunoEdicao,
    novoAlunoDefault, setMostrarForm, salvarAluno, handleNomeChange, setSugestoesNome,
    abrirPerfilAluno, setNovoAluno, setMostrarFormEdicao, setAlunoEdicao, salvarEdicao,
    ativarImportado,
  } = model;

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const catTone = useMemo(
    () => getCategoryTone(novoAluno.categoria || ENROLLMENT_CATEGORIES[0]),
    [novoAluno.categoria],
  );

  /** Lista fixa: Sem / Com personal trainer */
  const catList = useMemo(() => {
    const base = [...ENROLLMENT_CATEGORIES];
    // Se o aluno já tem categoria legada, mostrar também para não perder o valor ao editar
    const current = String(novoAluno.categoria || '').trim();
    if (current && !base.includes(current as typeof base[number])) base.push(current as any);
    return base;
  }, [novoAluno.categoria]);

  const applyCategoria = (cat: string) => {
    const defaultPlan = getDefaultPlanForCategory(cat);
    setNovoAluno({
      ...novoAluno,
      categoria: cat,
      // Aplica valor sugerido; o utilizador pode alterar o campo de mensalidade a seguir
      plano: defaultPlan,
    });
  };

  const handleFotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || '');
      setFotoPreview(base64);
      setNovoAluno({ ...novoAluno, _fotoBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const clearFoto = () => {
    setFotoPreview(null);
    setNovoAluno({ ...novoAluno, _fotoBase64: undefined });
    if (fileRef.current) fileRef.current.value = '';
  };

  if (mode === 'create') {
    const iniciais = getAlunoIniciais({ nome: novoAluno.nome || 'NA' });

    return (
      <ModalFrame onClose={() => setMostrarForm(false)} accentColor={catTone.solid}>
        {/* Hero header com cor da categoria */}
        <div
          className="relative shrink-0 overflow-hidden border-b border-[var(--border-light)]"
          style={{
            background: `linear-gradient(135deg, ${catTone.bg} 0%, var(--bg-surface) 70%)`,
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full opacity-40"
            style={{ background: catTone.solid }}
          />
          <div
            className="pointer-events-none absolute -bottom-12 left-1/3 h-28 w-28 rounded-full opacity-25"
            style={{ background: catTone.solid }}
          />

          <div className="relative flex items-center gap-3 px-5 pb-4 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-white/50 bg-white/80 p-1.5 shadow-sm">
              <img src={appLogo || APP_ICON_PATH} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} style={{ color: catTone.fg }} />
                <h2 className="text-[15px] font-bold tracking-tight nl-text">Nova matrícula</h2>
              </div>
              <p className="mt-0.5 text-[12px] font-medium nl-text-muted">
                Bem-vindo a bordo — preencha os dados essenciais
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="nl-icon-btn"
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvarAluno(e);
          }}
          className="min-h-0 flex-1 overflow-y-auto custom-scrollbar"
        >
          <div className="space-y-5 px-5 py-4">
            {/* Foto + identidade */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex shrink-0 flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-all hover:border-solid"
                  style={{
                    borderColor: catTone.border,
                    background: catTone.bg,
                    color: catTone.fg,
                  }}
                  title="Adicionar foto (opcional)"
                >
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-0.5 text-[11px] font-semibold">
                      <Camera size={22} />
                      {novoAluno.nome ? iniciais : <ImagePlus size={18} />}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera size={18} className="text-white" />
                  </span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoSelect} />
                {fotoPreview ? (
                  <button type="button" onClick={clearFoto} className="text-[10px] font-semibold nl-text-muted hover:text-[var(--color-error)]">
                    Remover foto
                  </button>
                ) : (
                  <span className="text-[10px] font-medium nl-text-muted">Foto opcional</span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
                    Nome completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nome do aluno..."
                      value={novoAluno.nome}
                      onChange={(e) => handleNomeChange(e.target.value)}
                      className="nl-input h-11 w-full px-3 text-[14px] font-medium"
                      required
                      autoFocus
                      onBlur={() => setTimeout(() => setSugestoesNome([]), 200)}
                    />
                    {sugestoesNome.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-[110] mt-1 overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)] animate-scale-in">
                        <p className="border-b border-[var(--border-light)] bg-[var(--color-secondary-lighter)] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest nl-text-muted">
                          Contactos existentes
                        </p>
                        {sugestoesNome.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setMostrarForm(false);
                              setSugestoesNome([]);
                              abrirPerfilAluno(s);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--color-primary-light)]"
                          >
                            <div>
                              <p className="text-[12px] font-bold nl-text">{s.nome}</p>
                              <p className="text-[10px] nl-text-muted">{s.telefone || 'Sem telefone'}</p>
                            </div>
                            <ExternalLink size={12} className="text-[var(--color-primary)]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
                      Telemóvel <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+238 …"
                      value={novoAluno.telefone}
                      onChange={(e) => setNovoAluno({ ...novoAluno, telefone: e.target.value })}
                      className="nl-input h-11 w-full px-3 text-[13px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">Sexo</label>
                    <select
                      value={novoAluno.sexo}
                      onChange={(e) => setNovoAluno({ ...novoAluno, sexo: e.target.value })}
                      className="nl-input h-11 w-full cursor-pointer px-3 text-[13px]"
                    >
                      <option value="">—</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Categoria — apenas Sem / Com personal trainer */}
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
                Tipo de inscrição
              </label>
              <div className="flex flex-wrap gap-1.5">
                {catList.map((cat) => {
                  const tone = getCategoryTone(cat);
                  const active = (novoAluno.categoria || ENROLLMENT_CATEGORIES[0]) === cat;
                  const suggested = getDefaultPlanForCategory(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => applyCategoria(cat)}
                      className="rounded-[var(--radius-pill)] border px-3 py-1.5 text-[12px] font-semibold transition-all"
                      style={{
                        background: active ? tone.solid : tone.bg,
                        color: active ? '#fff' : tone.fg,
                        borderColor: active ? tone.solid : tone.border,
                        boxShadow: active ? `0 4px 12px color-mix(in srgb, ${tone.solid} 35%, transparent)` : undefined,
                      }}
                      title={`Valor sugerido: ${suggested} CVE (editável)`}
                    >
                      {cat}
                      <span className={`ml-1.5 text-[10px] font-bold ${active ? 'text-white/85' : 'opacity-70'}`}>
                        {suggested} CVE
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-[var(--border-light)]" />

            {/* Plano — valor sugerido pela categoria, sempre editável */}
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] nl-text-muted">Plano & pagamento</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
                    Mensalidade (CVE) <span className="text-red-500">*</span>
                  </label>
                  <p className="mb-1 text-[10px] font-medium nl-text-muted">
                    Sugerido {getDefaultPlanForCategory(novoAluno.categoria)} CVE — pode editar
                  </p>
                  <input
                    type="text"
                    placeholder="3 500"
                    value={novoAluno.plano}
                    onChange={(e) => setNovoAluno({ ...novoAluno, plano: e.target.value })}
                    className="nl-input h-11 w-full px-3 text-[15px] font-bold tabular-nums"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
                    Data de inscrição
                  </label>
                  <input
                    type="date"
                    value={novoAluno.data_matricula}
                    onChange={(e) => setNovoAluno({ ...novoAluno, data_matricula: e.target.value })}
                    className="nl-input h-11 w-full px-3 text-[13px]"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] nl-text-muted">
                  Modo de inscrição
                </label>
                <div className="flex gap-2">
                  {([
                    { id: 'matricula', label: 'Só matrícula', desc: 'Cobra mais tarde', icon: <FileText size={14} /> },
                    { id: 'matricula_pago', label: 'Pagar agora', desc: 'Regista pagamento', icon: <CheckCircle2 size={14} /> },
                  ] as const).map((opt) => {
                    const active = novoAluno.modo_inscricao === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNovoAluno({ ...novoAluno, modo_inscricao: opt.id })}
                        className="flex flex-1 items-center gap-2.5 rounded-[var(--radius-control)] border-2 px-3 py-2.5 text-left transition-all"
                        style={
                          active
                            ? {
                                borderColor: catTone.solid,
                                background: catTone.bg,
                              }
                            : undefined
                        }
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
                          style={{
                            background: active ? catTone.solid : 'var(--color-secondary-light)',
                            color: active ? '#fff' : 'var(--text-secondary)',
                          }}
                        >
                          {opt.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold leading-tight nl-text">{opt.label}</p>
                          <p className="text-[10px] nl-text-muted">{opt.desc}</p>
                        </div>
                        {active && <CheckCircle2 size={14} className="ml-auto shrink-0" style={{ color: catTone.fg }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="mt-3 flex items-center justify-between rounded-[var(--radius-control)] border px-3 py-2.5"
                style={{ background: catTone.bg, borderColor: catTone.border }}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: catTone.fg }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: catTone.fg }}>
                    {novoAluno.modo_inscricao === 'matricula_pago' ? 'Próxima cobrança' : 'Primeira cobrança'}
                  </span>
                </div>
                <span className="text-[14px] font-extrabold tabular-nums" style={{ color: catTone.fg }}>
                  {previewVencimento || '— / — / ——'}
                </span>
              </div>
            </div>
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border-light)] bg-[var(--color-secondary-lighter)]/50 px-5 py-3.5">
          <p className="hidden text-[11px] font-medium nl-text-muted sm:block">
            Aparece como <span className="font-semibold text-amber-600">★ novo</span> na Início durante 7 dias
          </p>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button type="button" onClick={() => setMostrarForm(false)} className="nl-btn nl-btn-secondary !h-10 !px-4">
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvarAluno}
              className="nl-btn !h-10 !px-5 !text-white"
              style={{
                background: catTone.solid,
                borderColor: catTone.solid,
              }}
            >
              <UserPlus size={15} /> Confirmar matrícula
            </button>
          </div>
        </div>
      </ModalFrame>
    );
  }

  // ── Edit mode (mantido + estado do aluno) ──
  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 nl-modal-overlay">
        <div
          className="flex w-full max-w-[650px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] animate-scale-in"
          style={{ maxHeight: 'calc(100vh - 40px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-12 shrink-0 items-center border-b border-[var(--border)] bg-[var(--color-secondary-lighter)]">
            <div className="flex flex-1 items-center gap-2.5 px-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/40 bg-white/50 p-1">
                <img src={appLogo || APP_ICON_PATH} alt="Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">NextLevel</span>
            </div>
            <div className="flex-1 text-center whitespace-nowrap">
              <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-700">
                Editar: {alunoEdicao.id.slice(-8)}
              </h2>
            </div>
            <div className="flex flex-1 justify-end px-3">
              <button
                type="button"
                onClick={() => {
                  setMostrarFormEdicao(false);
                  setAlunoEdicao(null);
                  setNovoAluno(novoAlunoDefault);
                }}
                className="nl-icon-btn"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <form id="editar-aluno-form" onSubmit={salvarEdicao} className="flex-1 space-y-8 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Nome Completo</label>
                <input type="text" value={novoAluno.nome} onChange={(e) => setNovoAluno({ ...novoAluno, nome: e.target.value })} className="nl-input h-12 w-full px-4" required />
              </div>
              <div className="space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Telefone</label>
                <input type="tel" value={novoAluno.telefone} onChange={(e) => setNovoAluno({ ...novoAluno, telefone: e.target.value })} className="nl-input h-12 w-full px-4" required />
              </div>
              <div className="space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Tipo de inscrição</label>
                <select
                  value={novoAluno.categoria || ENROLLMENT_CATEGORIES[0]}
                  onChange={(e) => applyCategoria(e.target.value)}
                  className="nl-input h-12 w-full cursor-pointer px-4"
                  required
                >
                  {catList.map((cat) => (
                    <option key={cat} value={cat}>{cat} ({getDefaultPlanForCategory(cat)} CVE)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Mensalidade (CVE)</label>
                <input
                  type="text"
                  value={novoAluno.plano}
                  onChange={(e) => setNovoAluno({ ...novoAluno, plano: e.target.value })}
                  className="nl-input h-12 w-full px-4 font-bold"
                  required
                  title="Valor editável — o sugerido depende da categoria"
                />
                <p className="px-1 text-[10px] nl-text-muted">
                  Sugerido: {getDefaultPlanForCategory(novoAluno.categoria)} CVE · pode alterar
                </p>
              </div>
              <div className="space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Próximo Vencimento</label>
                <input type="text" value={(novoAluno as any).vencimento} onChange={(e) => setNovoAluno({ ...novoAluno, vencimento: e.target.value } as any)} className="nl-input h-12 w-full px-4" required />
              </div>
              <div className="space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Data de Inscrição</label>
                <input type="date" value={novoAluno.data_matricula} onChange={(e) => setNovoAluno({ ...novoAluno, data_matricula: e.target.value })} className="nl-input h-12 w-full px-4" />
              </div>
              <div className="space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Sexo</label>
                <select value={novoAluno.sexo} onChange={(e) => setNovoAluno({ ...novoAluno, sexo: e.target.value })} className="nl-input h-12 w-full cursor-pointer px-4">
                  <option value="">Selecionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Modo de Cobrança</label>
                <select value={novoAluno.modo_cobranca} onChange={(e) => setNovoAluno({ ...novoAluno, modo_cobranca: e.target.value as 'mensalidade_movel' | 'mensalidade_fixa' })} className="nl-input h-12 w-full cursor-pointer px-4" required>
                  <option value="mensalidade_movel">Móvel (30 dias após pagamento)</option>
                  <option value="mensalidade_fixa">Fixa (dia 1 ao 5 do mês)</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Estado do aluno</label>
                <select
                  value={novoAluno.status || 'ativo'}
                  onChange={(e) => setNovoAluno({ ...novoAluno, status: e.target.value })}
                  className="nl-input h-12 w-full cursor-pointer px-4"
                >
                  {STUDENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                  {isImportedStatus(alunoEdicao?.status) && (
                    <option value="importado">Importado (aguardando revisão)</option>
                  )}
                </select>
                <p className="px-1 text-[11px] nl-text-muted">
                  {STUDENT_STATUS_OPTIONS.find((o) => o.value === (novoAluno.status || 'ativo'))?.hint
                    || 'Pausa, férias e desistência retiram o aluno da contabilidade do mês.'}
                </p>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Email</label>
                <input type="email" value={novoAluno.email} onChange={(e) => setNovoAluno({ ...novoAluno, email: e.target.value })} className="nl-input h-12 w-full px-4" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Morada</label>
                <input type="text" value={novoAluno.morada} onChange={(e) => setNovoAluno({ ...novoAluno, morada: e.target.value })} className="nl-input h-12 w-full px-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Alergias</label>
                <textarea value={novoAluno.alergias} onChange={(e) => setNovoAluno({ ...novoAluno, alergias: e.target.value })} className="nl-input min-h-[112px] resize-none px-4 py-3" />
              </div>
              <div className="space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Objetivos</label>
                <textarea value={novoAluno.objetivos} onChange={(e) => setNovoAluno({ ...novoAluno, objetivos: e.target.value })} className="nl-input min-h-[112px] resize-none px-4 py-3" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block px-1 text-[12px] font-bold uppercase tracking-wider nl-text-muted">Horário Preferido</label>
                <input type="text" value={novoAluno.horario_preferido} onChange={(e) => setNovoAluno({ ...novoAluno, horario_preferido: e.target.value })} className="nl-input h-12 w-full px-4" />
              </div>
            </div>
          </form>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--color-secondary-lighter)]/40 px-6 py-4">
            <button
              type="button"
              onClick={() => {
                setMostrarFormEdicao(false);
                setAlunoEdicao(null);
                setNovoAluno(novoAlunoDefault);
              }}
              className="nl-btn nl-btn-secondary !h-9 !px-5"
            >
              Cancelar
            </button>
            {isImportedStatus(alunoEdicao?.status) && (
              <button type="button" onClick={ativarImportado} className="nl-btn !h-9 !border-emerald-700 !bg-emerald-600 !px-5 !text-white hover:!bg-emerald-700">
                <CheckCircle2 size={14} /> Confirmar e Ativar
              </button>
            )}
            <button type="submit" form="editar-aluno-form" className="nl-btn nl-btn-primary !h-9 !px-6">
              <Save size={14} /> Guardar Alterações
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
