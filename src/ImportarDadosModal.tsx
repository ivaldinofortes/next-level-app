import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, UploadCloud, Check, AlertCircle, ChevronRight, ChevronLeft, Edit2, CheckCircle2, ArrowRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converte serial date do Excel (número) → string ISO YYYY-MM-DD */
function excelSerialToISO(serial: number): string {
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

/** Converte serial date do Excel (número) → string DD/MM/YYYY */
function excelSerialToDDMMYYYY(serial: number): string {
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  if (isNaN(date.getTime())) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/** Normaliza um valor de célula do Excel para string limpa */
function cellToStr(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') {
    // Possível serial date: > 1000 e inteiro
    if (Number.isInteger(val) && val > 1000) return String(val); // deixa para interpretação posterior
    return String(val);
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  return String(val).trim();
}

/** Normaliza um campo de data (vencimento) para DD/MM/YYYY */
function normVencimento(raw: string): string {
  if (!raw) return '';
  // Já no formato DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) return raw;
  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  // Serial do Excel
  const num = Number(raw);
  if (!isNaN(num) && num > 1000) return excelSerialToDDMMYYYY(num);
  // Apenas dia (1-31)
  const day = parseInt(raw.replace(/\D/g, ''), 10);
  if (!isNaN(day) && day >= 1 && day <= 31) {
    const now = new Date();
    return `${String(day).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }
  return raw;
}

/** Normaliza um campo de data de matrícula para YYYY-MM-DD */
function normDataMatricula(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const num = Number(raw);
  if (!isNaN(num) && num > 1000) return excelSerialToISO(num);
  return new Date().toISOString().split('T')[0];
}

/** Normaliza o valor do plano para string numérica */
function normPlano(raw: string): string {
  const clean = raw.replace(/[^0-9.,]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? '0' : String(num);
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const CAMPOS = [
  { id: 'nome',          label: 'Nome' },
  { id: 'telefone',      label: 'Telefone' },
  { id: 'email',         label: 'Email' },
  { id: 'plano',         label: 'Valor Mensalidade' },
  { id: 'vencimento',    label: 'Dia/Data Vencimento' },
  { id: 'data_matricula',label: 'Data de Matrícula' },
  { id: 'morada',        label: 'Morada' },
  { id: 'ignorar',       label: '— Ignorar —' },
];

function autoMap(header: string): string {
  const h = header.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (h.includes('nome') || h.includes('name') || h.includes('aluno') || h.includes('cliente')) return 'nome';
  if (h.includes('tel') || h.includes('phone') || h.includes('celular') || h.includes('movel')) return 'telefone';
  if (h.includes('mail')) return 'email';
  if (h.includes('valor') || h.includes('preco') || h.includes('plano') || h.includes('mensalidade') || h.includes('value')) return 'plano';
  if (h.includes('venc') || h.includes('dia') || h.includes('prox')) return 'vencimento';
  if (h.includes('matr') || (h.includes('data') && !h.includes('nasc'))) return 'data_matricula';
  if (h.includes('morada') || h.includes('address') || h.includes('enderec')) return 'morada';
  return 'ignorar';
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface RowData {
  _rowIdx: number;
  _status: 'ok' | 'erro';
  _erros: string[];
  nome: string;
  telefone: string;
  email: string;
  plano: string;
  vencimento: string;
  data_matricula: string;
  morada: string;
}

interface Props {
  onClose: () => void;
  onSuccess: (resumo: { inseridos: number; erros: number; ignorados?: number }) => void;
  electron: any;
  categorias: string[];
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function ImportarDadosModal({ onClose, onSuccess, electron, categorias }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Passo 1 — ficheiro
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);

  // Passo 2 — mapeamento
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Passo 3 — revisão
  const [rows, setRows] = useState<RowData[]>([]);
  const [editCell, setEditCell] = useState<{ r: number; f: keyof RowData } | null>(null);
  const [editVal, setEditVal] = useState('');
  const [defaultCategoria, setDefaultCategoria] = useState(categorias[0] || 'Sem personal trainer');
  const [defaultStatus, setDefaultStatus] = useState('importado');

  // Passo 4 — resultado
  const [resultado, setResultado] = useState<{ inseridos: number; erros: number; ignorados?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Passo 1: ler ficheiro
  // -------------------------------------------------------------------------
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buf = evt.target!.result as ArrayBuffer;
        const wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

        if (data.length < 2) {
          alert('O ficheiro está vazio ou não tem dados suficientes.');
          return;
        }

        // Cabeçalhos na linha 0
        const hdrs = (data[0] as unknown[]).map(h => String(h ?? '').trim()).filter(h => h !== '');
        // Linhas de dados (a partir da linha 1) — só linhas com pelo menos 1 célula não vazia
        const dataRows: string[][] = (data.slice(1) as unknown[][])
          .map(row => hdrs.map((_, i) => cellToStr((row as unknown[])[i])))
          .filter(row => row.some(v => v !== ''));

        console.log('[Import] Cabeçalhos:', hdrs);
        console.log('[Import] Linhas de dados:', dataRows.length);

        if (dataRows.length === 0) {
          alert('Nenhuma linha de dados encontrada após o cabeçalho.');
          return;
        }

        const initMapping: Record<string, string> = {};
        hdrs.forEach(h => { initMapping[h] = autoMap(h); });

        setHeaders(hdrs);
        setRawRows(dataRows);
        setMapping(initMapping);
        setStep(2);
      } catch (err) {
        console.error('[Import] Erro ao ler ficheiro:', err);
        alert('Erro ao ler o ficheiro. Verifique se é um Excel (.xlsx/.xls) ou CSV válido.');
      }
    };
    reader.readAsArrayBuffer(file);
    // reset input para permitir re-selecionar o mesmo ficheiro
    e.target.value = '';
  };

  // -------------------------------------------------------------------------
  // Passo 2 → 3: aplicar mapeamento e validar
  // -------------------------------------------------------------------------
  const aplicarMapeamento = () => {
    const mapped: RowData[] = rawRows.map((row, idx) => {
      const obj: Partial<RowData> = {
        _rowIdx: idx,
        _status: 'ok',
        _erros: [],
        nome: '', telefone: '', email: '', plano: '0',
        vencimento: '', data_matricula: '', morada: '',
      };

      headers.forEach((h, i) => {
        const campo = mapping[h];
        if (!campo || campo === 'ignorar') return;
        const raw = row[i] ?? '';
        if (campo === 'vencimento') {
          obj.vencimento = normVencimento(raw);
        } else if (campo === 'data_matricula') {
          obj.data_matricula = normDataMatricula(raw);
        } else if (campo === 'plano') {
          obj.plano = normPlano(raw);
        } else {
          (obj as any)[campo] = raw;
        }
      });

      const erros: string[] = [];
      if (!obj.nome?.trim()) erros.push('Nome é obrigatório');
      if (!obj.vencimento) {
        obj.vencimento = `01/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
      }
      if (!obj.data_matricula) {
        obj.data_matricula = new Date().toISOString().split('T')[0];
      }

      obj._erros = erros;
      obj._status = erros.length > 0 ? 'erro' : 'ok';
      return obj as RowData;
    });

    console.log('[Import] Linhas mapeadas:', mapped.length, '| ok:', mapped.filter(r => r._status === 'ok').length);
    setRows(mapped);
    setStep(3);
  };

  // -------------------------------------------------------------------------
  // Edição inline (passo 3)
  // -------------------------------------------------------------------------
  const saveEdit = () => {
    if (!editCell) return;
    setRows(prev => prev.map((row, i) => {
      if (i !== editCell.r) return row;
      const updated = { ...row, [editCell.f]: editVal };
      const erros: string[] = [];
      if (!updated.nome?.trim()) erros.push('Nome é obrigatório');
      updated._erros = erros;
      updated._status = erros.length > 0 ? 'erro' : 'ok';
      return updated;
    }));
    setEditCell(null);
  };

  // -------------------------------------------------------------------------
  // Passo 3 → 4: importar
  // -------------------------------------------------------------------------
  const handleImport = async () => {
    const validos = rows.filter(r => r._status === 'ok');
    if (validos.length === 0) {
      alert('Nenhuma linha válida para importar. Corrija os erros primeiro.');
      return;
    }

    setLoading(true);
    try {
      const payload = validos.map((r, i) => ({
        id: `imp-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        nome:           r.nome.trim(),
        telefone:       r.telefone || '',
        email:          r.email || '',
        morada:         r.morada || '',
        plano:          r.plano || '0',
        vencimento:     r.vencimento || '',
        data_matricula: r.data_matricula || new Date().toISOString().split('T')[0],
        categoria:      defaultCategoria,
        status:         defaultStatus,
      }));

      console.log('[Import] Enviando', payload.length, 'alunos para o backend');

      if (!electron?.ipcRenderer) {
        throw new Error('IPC não disponível. A app precisa de ser corrida via Electron.');
      }

      const res = await electron.ipcRenderer.invoke('import-alunos', payload);
      console.log('[Import] Resposta do backend:', res);

      if (!res?.success) {
        throw new Error(res?.message || 'Resposta inválida do servidor.');
      }

      const { inseridos, ignorados = 0, erros, detalhesErro, detalhesIgnorados } = res.result;

      if ((erros > 0 && detalhesErro?.length) || (ignorados > 0 && detalhesIgnorados?.length)) {
        const partes = [
          `✅ Inseridos: ${inseridos}`,
          `⏭️ Duplicados ignorados: ${ignorados}`,
          `❌ Erros: ${erros}`,
        ];
        const detalhes = [
          ...(detalhesIgnorados || []).slice(0, 5),
          ...(detalhesErro || []).slice(0, 5),
        ];
        alert(`Importação concluída com revisão!\n${partes.join('\n')}\n\n${detalhes.join('\n')}`);
      }

      setResultado({ inseridos, ignorados, erros });
      setLoading(false);
      setStep(4);
    } catch (err: any) {
      console.error('[Import] Erro crítico:', err);
      alert('Erro na importação: ' + (err?.message || String(err)));
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const okCount = rows.filter(r => r._status === 'ok').length;
  const errCount = rows.filter(r => r._status === 'erro').length;
  const CAMPOS_TABELA: Array<keyof RowData> = ['nome', 'telefone', 'email', 'plano', 'vencimento'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center nl-modal-overlay">
      <div className="w-[900px] max-w-[96vw] max-h-[90vh] bg-[var(--bg-surface)] rounded-[12px] shadow-2xl flex flex-col border border-[var(--border)] overflow-hidden">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)] bg-[var(--bg-header)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
              <UploadCloud size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold nl-text leading-tight">Importação de Dados</h2>
              <p className="text-[11px] nl-text-muted mt-0.5">Excel (.xlsx / .xls) ou CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Indicador de passos */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 py-3 border-b border-[var(--border-light)] bg-slate-50/50 shrink-0">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold
                  ${step >= s ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-8 h-[2px] ${step > s ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-app)]">

          {/* ── Passo 1: Upload ── */}
          {step === 1 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 border-[4px] border-blue-100 flex items-center justify-center mb-6 text-blue-500">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-[20px] font-black nl-text mb-2">Importar Alunos</h3>
              <p className="text-[13px] text-slate-500 mb-8 max-w-[400px]">
                Selecione um ficheiro Excel (.xlsx, .xls) ou CSV com os dados dos alunos.
                A primeira linha deve ser o cabeçalho.
              </p>
              <button onClick={() => fileRef.current?.click()} className="nl-btn nl-btn-primary !h-12 !px-8 !text-[14px]">
                Selecionar Ficheiro
              </button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </div>
          )}

          {/* ── Passo 2: Mapeamento ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-white rounded-[8px] border border-[var(--border-light)]">
                <div>
                  <p className="text-[12px] font-bold text-slate-700">Ficheiro</p>
                  <p className="text-[11px] text-slate-500">{fileName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-bold text-slate-700">{rawRows.length} linhas de dados</p>
                  <p className="text-[11px] text-slate-500">{headers.length} colunas detectadas</p>
                </div>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-3">
                  Mapeie cada coluna do ficheiro para o campo correspondente
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {headers.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-[6px] border border-slate-200 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Coluna Excel</p>
                        <p className="text-[12px] font-semibold text-slate-700 truncate">{h || `[Coluna ${i + 1}]`}</p>
                        <p className="text-[10px] text-slate-400 truncate">ex: {String(rawRows[0]?.[i] ?? '')}</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 shrink-0" />
                      <div className="flex-1">
                        <select
                          value={mapping[h] || 'ignorar'}
                          onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}
                          className="w-full text-[12px] border border-slate-300 rounded-[4px] p-1.5 bg-slate-50 focus:border-[var(--color-primary)] outline-none"
                        >
                          {CAMPOS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pré-visualização */}
              <div>
                <p className="text-[12px] font-bold text-slate-600 mb-2">Pré-visualização (primeiras 3 linhas)</p>
                <div className="overflow-x-auto rounded-[6px] border border-slate-200">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="p-2 whitespace-nowrap font-semibold">
                            {h}
                            <span className="block text-[9px] font-normal text-[var(--color-primary)]">
                              → {CAMPOS.find(c => c.id === (mapping[h] || 'ignorar'))?.label}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0 bg-white">
                          {headers.map((_, ci) => (
                            <td key={ci} className="p-2 max-w-[160px] truncate text-slate-600">{row[ci]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Passo 3: Revisão ── */}
          {step === 3 && (
            <div className="flex flex-col h-full">
              {/* Opções */}
              <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
                <div className="bg-white p-3 rounded-[6px] border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                  <select value={defaultCategoria} onChange={e => setDefaultCategoria(e.target.value)}
                    className="block w-full text-[13px] font-semibold text-slate-700 bg-transparent outline-none mt-0.5">
                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="bg-white p-3 rounded-[6px] border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Status inicial</label>
                  <select value={defaultStatus} onChange={e => setDefaultStatus(e.target.value)}
                    className="block w-full text-[13px] font-semibold text-slate-700 bg-transparent outline-none mt-0.5">
                    <option value="importado">Importado (aguarda revisão)</option>
                    <option value="ativo">Ativo</option>
                    <option value="pausado">Pausado</option>
                  </select>
                </div>
              </div>

              {/* Tabela de revisão */}
              <div className="flex-1 overflow-auto rounded-[8px] border border-[var(--border)] bg-white shadow-sm relative">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-2 w-8 text-center">#</th>
                      <th className="p-2">Nome</th>
                      <th className="p-2">Telefone</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Plano (€)</th>
                      <th className="p-2">Vencimento</th>
                      <th className="p-2">Problema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className={`border-b border-slate-100 hover:bg-slate-50 ${row._status === 'erro' ? 'bg-red-50/30' : ''}`}>
                        <td className="p-2 text-center">
                          {row._status === 'ok'
                            ? <CheckCircle2 size={14} className="text-emerald-500 mx-auto" />
                            : <AlertCircle size={14} className="text-red-500 mx-auto" />}
                        </td>
                        {CAMPOS_TABELA.map(field => (
                          <td
                            key={field}
                            className="p-2 border-r border-slate-50 cursor-text hover:bg-blue-50/50 group relative"
                            onClick={() => { setEditCell({ r: rIdx, f: field }); setEditVal(row[field] as string); }}
                          >
                            {editCell?.r === rIdx && editCell?.f === field ? (
                              <div className="absolute inset-0 bg-white border-2 border-[var(--color-primary)] flex items-center z-20 px-1 shadow-lg rounded">
                                <input
                                  autoFocus
                                  value={editVal}
                                  onChange={e => setEditVal(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditCell(null); }}
                                  onBlur={saveEdit}
                                  className="w-full text-[11px] outline-none"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1">
                                <span className={!row[field] ? 'text-slate-300 italic' : 'text-slate-700'}>
                                  {(row[field] as string) || '—'}
                                </span>
                                <Edit2 size={9} className="text-slate-300 opacity-0 group-hover:opacity-100 shrink-0" />
                              </div>
                            )}
                          </td>
                        ))}
                        <td className="p-2 text-red-600 text-[10px]">{row._erros.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumo */}
              <div className="mt-3 text-[11px] text-slate-500 flex gap-4 shrink-0">
                <span>Total: <b className="text-slate-800">{rows.length}</b></span>
                <span>Prontos: <b className="text-emerald-600">{okCount}</b></span>
                <span>Com erros: <b className="text-red-600">{errCount}</b></span>
              </div>
            </div>
          )}

          {/* ── Passo 4: Resultado ── */}
          {step === 4 && resultado && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-[4px] border-emerald-100 flex items-center justify-center mb-6 text-emerald-500">
                <Check size={40} />
              </div>
              <h3 className="text-[24px] font-black nl-text mb-2">Importação Concluída!</h3>
              <p className="text-[13px] text-slate-500 mb-8 max-w-[360px]">
                Os dados foram guardados na base de dados.
              </p>
              <div className="flex gap-6 mb-8">
                <div className="bg-emerald-50 px-6 py-4 rounded-[8px] border border-emerald-100 text-left">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase mb-1">Inseridos</p>
                  <p className="text-[32px] font-black text-emerald-700">{resultado.inseridos}</p>
                </div>
                {resultado.erros > 0 && (
                  <div className="bg-red-50 px-6 py-4 rounded-[8px] border border-red-100 text-left">
                    <p className="text-[11px] font-bold text-red-600 uppercase mb-1">Falhas</p>
                    <p className="text-[32px] font-black text-red-700">{resultado.erros}</p>
                  </div>
                )}
                {(resultado.ignorados || 0) > 0 && (
                  <div className="bg-amber-50 px-6 py-4 rounded-[8px] border border-amber-100 text-left">
                    <p className="text-[11px] font-bold text-amber-600 uppercase mb-1">Duplicados ignorados</p>
                    <p className="text-[32px] font-black text-amber-700">{resultado.ignorados}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => { onClose(); onSuccess(resultado); }}
                className="nl-btn nl-btn-primary !h-12 !px-8 !text-[14px]"
              >
                Concluir e Ver Alunos
              </button>
            </div>
          )}
        </div>

        {/* Rodapé */}
        {step < 4 && (
          <div className="px-6 py-4 border-t border-[var(--border-light)] bg-[var(--bg-header)] shrink-0 flex items-center justify-between">
            <button onClick={onClose} className="text-[13px] font-bold text-slate-500 hover:text-slate-800">
              Cancelar
            </button>
            <div className="flex gap-3">
              {step > 1 && (
                <button onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)} className="nl-btn nl-btn-secondary !h-10 !px-5">
                  <ChevronLeft size={16} className="-ml-1" /> Voltar
                </button>
              )}
              {step === 1 && (
                <button onClick={() => fileRef.current?.click()} className="nl-btn nl-btn-primary !h-10 !px-5">
                  Selecionar Ficheiro
                </button>
              )}
              {step === 2 && (
                <button onClick={aplicarMapeamento} className="nl-btn nl-btn-primary !h-10 !px-5">
                  Avançar <ChevronRight size={16} className="-mr-1" />
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleImport}
                  disabled={loading || okCount === 0}
                  className="nl-btn !bg-emerald-600 !text-white hover:!bg-emerald-700 !h-10 !px-6 disabled:opacity-50"
                >
                  {loading ? 'Importando...' : `Confirmar Importação (${okCount} alunos)`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
