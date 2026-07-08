// @ts-nocheck
import { memo } from 'react';
import { ChevronLeft, ChevronRight, Printer, Download, ChevronDown } from 'lucide-react';
import {
  formatCve,
  getStudentStatusForMonth,
  isPaymentInsideMonth,
  normalizeAmount,
  parseFlexibleDate,
} from '../lib/billing';
import {
  COMPANY_NAME,
  MONTH_OPTIONS,
  NEXT_LAB_ICON,
  getBillingBadgeLabel,
  getBillingTone,
  STUDENT_STATUS_HELPERS,
} from '../constants';

// ─── Helpers (originally defined in App.tsx scope) ─────────────────────────

const isFutureMonth = (monthIndex: number, year: number, reference = new Date()) => {
  const currentYear = reference.getFullYear();
  const currentMonth = reference.getMonth();
  return year > currentYear || (year === currentYear && monthIndex > currentMonth);
};

const getTimelineMetricWidth = (
  summary: { status?: string; daysUntilCharge?: number },
  status?: string,
) => {
  if (STUDENT_STATUS_HELPERS.isPaused(status) || STUDENT_STATUS_HELPERS.isBlocked(status)) return 0;
  if (summary.status === 'atrasado' || summary.status === 'hoje') return 100;
  return Math.max(8, Math.min(100, (Math.max(summary.daysUntilCharge || 0, 0) / 30) * 100));
};

// ─── Types (from App.tsx) ──────────────────────────────────────────────────

interface Aluno {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  sexo?: string;
  data_nascimento?: string;
  morada?: string;
  alergias?: string;
  objetivos?: string;
  horario_preferido?: string;
  plano: string;
  vencimento: string;
  progresso: number;
  data_matricula?: string;
  status?: string;
  categoria?: string;
  modo_cobranca?: string;
  foto_path?: string;
  notas?: string;
}

interface Pagamento {
  id?: number;
  alunoId: string;
  aluno_id?: string;
  nome?: string;
  valor: string;
  status: 'pago' | 'pendente';
  data_pagamento?: string;
  metodo_pagamento?: string;
  mes_referencia?: string;
  referencia_inicio?: string;
  referencia_fim?: string;
}

export interface RelatoriosPageProps {
  mesRelatorio: string;
  setMesRelatorio: React.Dispatch<React.SetStateAction<string>>;
  anoRelatorio: number;
  setAnoRelatorio: React.Dispatch<React.SetStateAction<number>>;
  timelineFinanceiraMinimizada: boolean;
  setTimelineFinanceiraMinimizada: React.Dispatch<React.SetStateAction<boolean>>;
  alunos: Aluno[];
  pagamentos: Pagamento[];
  hojeReferencia: Date;
  larguraListas: number;
  appLogo: string;
  nomeAcademia: string;
  onExportarExcel: () => void;
}

const RelatoriosPage = memo(function RelatoriosPage({
  mesRelatorio,
  setMesRelatorio,
  anoRelatorio,
  setAnoRelatorio,
  timelineFinanceiraMinimizada,
  setTimelineFinanceiraMinimizada,
  alunos,
  pagamentos,
  hojeReferencia,
  larguraListas,
  appLogo,
  nomeAcademia,
  onExportarExcel,
}: RelatoriosPageProps) {
  const mesIdxRel = MONTH_OPTIONS.indexOf(mesRelatorio);
  const refRelatorio = new Date(anoRelatorio, mesIdxRel + 1, 0);
  const geradoEm = new Date().toLocaleString('pt-PT');

  const alunosPeriodoRel = [...alunos]
    .filter(a => { const e = parseFlexibleDate(a.data_matricula); return e ? e.getTime() <= refRelatorio.getTime() : true; })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const resumosRel = alunosPeriodoRel.map(aluno => ({ aluno, resumo: getStudentStatusForMonth(aluno, pagamentos, anoRelatorio, mesIdxRel, hojeReferencia) }));

  const totalInscritos = alunosPeriodoRel.length;
  const pagosCount   = resumosRel.filter(r => r.resumo.status === 'pago').length;
  const emDiaCount   = resumosRel.filter(r => ['alerta','pendente','critico','hoje'].includes(r.resumo.status)).length;
  const atrasadosCount = resumosRel.filter(r => r.resumo.status === 'atrasado').length;
  const inativosCount  = resumosRel.filter(r => ['pausado','suspenso','bloqueado'].includes(r.resumo.status)).length;

  const receitaMes   = pagamentos.filter(p => isPaymentInsideMonth(p, mesRelatorio, anoRelatorio)).reduce((s, p) => s + normalizeAmount(p.valor), 0);
  const previsaoMes  = alunosPeriodoRel.filter(a => STUDENT_STATUS_HELPERS.isOperational(a.status)).reduce((s, a) => s + normalizeAmount(a.plano), 0);
  const pendenteMes  = Math.max(0, previsaoMes - receitaMes);

  const dadosBarra = MONTH_OPTIONS
    .map((mes, idx) => { if (isFutureMonth(idx, anoRelatorio, new Date())) return null; const total = pagamentos.filter(p => isPaymentInsideMonth(p, mes, anoRelatorio)).reduce((s, p) => s + normalizeAmount(p.valor), 0); return { mes: mes.slice(0,3), total, ativo: mes === mesRelatorio }; })
    .filter(Boolean) as { mes: string; total: number; ativo: boolean }[];
  const maxBarra = Math.max(...dadosBarra.map(d => d.total), 1);

  const donutSegments = [
    { label: 'Em dia',   count: emDiaCount,    color: '#2563EB' },
    { label: 'Pago',     count: pagosCount,    color: '#16A34A' },
    { label: 'Atrasado', count: atrasadosCount, color: '#DC2626' },
    { label: 'Pausado',  count: inativosCount,  color: '#94A3B8' },
  ].filter(s => s.count > 0);
  const donutTotal = donutSegments.reduce((s, seg) => s + seg.count, 0);
  const donutR = 42; const donutCx = 65; const donutCy = 65;
  const donutC = 2 * Math.PI * donutR;
  let donutAngle = 0;
  const donutArcs = donutSegments.map(seg => { const pct = seg.count / donutTotal; const len = pct * donutC; const startAngle = donutAngle - 90; donutAngle += pct * 360; return { ...seg, len, startAngle }; });

  return (
    <div className="animate-slide-up h-full w-full flex flex-col overflow-hidden">
      {/* ── Barra de período ── */}
      <div className="sticky top-0 z-20 shrink-0 border-b border-blue-100 bg-[#EEF4FF]">
        <div className={`overflow-x-auto transition-all ${timelineFinanceiraMinimizada ? 'py-1' : 'py-1.5'}`}>
          <div className="flex min-w-[1100px] items-center gap-4 px-6">
            <span className="text-[11px] font-extrabold nl-text tracking-tight whitespace-nowrap shrink-0">Período</span>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setAnoRelatorio(p => p - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] transition-colors"><ChevronLeft size={14} /></button>
              <div className="rounded-full border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">{anoRelatorio}</div>
              <button onClick={() => setAnoRelatorio(p => p + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] transition-colors"><ChevronRight size={14} /></button>
            </div>
            <div className="relative flex-1 min-w-[520px]">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#D9E2F2]" />
              <div className="relative flex items-center justify-between gap-1">
                {MONTH_OPTIONS.map((mes, index) => {
                  if (isFutureMonth(index, anoRelatorio, new Date())) return null;
                  const ativo = mesRelatorio === mes;
                  const atual = anoRelatorio === new Date().getFullYear() && index === new Date().getMonth();
                  return (
                    <button key={mes} onClick={() => setMesRelatorio(mes)}
                      className={`group flex min-w-[70px] flex-col items-center rounded-[5px] px-1.5 transition-all ${timelineFinanceiraMinimizada ? 'gap-0 py-0.5' : 'gap-0.5 py-1'}`}
                      title={`${mes} ${anoRelatorio}`}>
                      <span className={`h-3 w-3 rounded-full border transition-all ${ativo ? 'border-[var(--color-primary)] bg-[var(--color-primary)] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]' : atual ? 'border-[#2563EB] bg-white' : 'border-[var(--border)] bg-[var(--bg-surface)] group-hover:border-[var(--color-primary)]/45'}`} />
                      <div className={`transition-all ${timelineFinanceiraMinimizada ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
                        <p className={`text-[9px] font-bold uppercase tracking-[0.12em] ${ativo ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)]'}`}>{mes.slice(0,3)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => window.print()} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--border-light)] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] hover:bg-white/60 transition-colors"><Printer size={12} /> Imprimir</button>
              <button onClick={() => onExportarExcel()} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 hover:bg-emerald-100 transition-colors"><Download size={12} /> Excel</button>
              <button type="button" onClick={() => setTimelineFinanceiraMinimizada(prev => !prev)}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--border-light)] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] transition-colors hover:bg-white/60"
                title={timelineFinanceiraMinimizada ? 'Expandir' : 'Minimizar'}>
                <ChevronDown size={13} className={`transition-transform ${timelineFinanceiraMinimizada ? '-rotate-90' : 'rotate-0'}`} />
                {timelineFinanceiraMinimizada ? 'Expandir' : 'Minimizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Corpo — folha de relatório ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-app)] px-8 py-8">
        <div className="mx-auto" style={{ maxWidth: `${larguraListas}px` }}>
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] border border-[var(--border)]">

            {/* Cabeçalho do documento */}
            <div className="px-12 pt-10 pb-6 border-b-2 border-[#1E3A5F]">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <img src={appLogo} alt="" className="w-11 h-11 object-contain" />
                  <div>
                    <h1 className="text-[22px] font-black tracking-tight leading-tight uppercase" style={{ color: '#0F1F35' }}>{nomeAcademia}</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#526070' }}>Sistema de Gestão · {COMPANY_NAME}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-black uppercase tracking-[0.1em]" style={{ color: '#1E3A5F' }}>Dossier de Desempenho</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#526070' }}>Relatório Mensal de Mensalidades</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[#D9E2EF]">
                <div><p className="text-[9px] font-black uppercase tracking-[0.16em] mb-1" style={{ color: '#1E3A5F' }}>Período</p><p className="text-[11px] font-semibold capitalize" style={{ color: '#0F1F35' }}>{mesRelatorio} {anoRelatorio}</p></div>
                <div><p className="text-[9px] font-black uppercase tracking-[0.16em] mb-1" style={{ color: '#1E3A5F' }}>Gerado em</p><p className="text-[11px] font-semibold" style={{ color: '#0F1F35' }}>{geradoEm}</p></div>
                <div><p className="text-[9px] font-black uppercase tracking-[0.16em] mb-1" style={{ color: '#1E3A5F' }}>Total no Período</p><p className="text-[11px] font-semibold" style={{ color: '#0F1F35' }}>{totalInscritos} aluno{totalInscritos !== 1 ? 's' : ''}</p></div>
              </div>
            </div>

            {/* KPIs */}
            <div className="px-12 py-6 border-b border-[#E2E8F0]" style={{ background: '#F8FAFD' }}>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Inscritos', value: String(totalInscritos), sub: 'no período', bg: '#EBF0F8', fg: '#1E3A5F' },
                  { label: 'Em dia / Pago', value: String(pagosCount + emDiaCount), sub: `${Math.round(((pagosCount + emDiaCount) / Math.max(totalInscritos, 1)) * 100)}% do total`, bg: '#DCFCE7', fg: '#166534' },
                  { label: 'Em Atraso', value: String(atrasadosCount), sub: atrasadosCount === 0 ? 'Tudo em dia ✓' : 'requerem atenção', bg: atrasadosCount > 0 ? '#FEE2E2' : '#DCFCE7', fg: atrasadosCount > 0 ? '#991B1B' : '#166534' },
                  { label: 'Receita Cobrada', value: formatCve(receitaMes), sub: `Previsão: ${formatCve(previsaoMes)}`, bg: '#D1FAE5', fg: '#065F46' },
                ].map((kpi, i) => (
                  <div key={i} className="rounded-[4px] border border-[#E2E8F0] p-4" style={{ background: kpi.bg }}>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] mb-2" style={{ color: '#526070' }}>{kpi.label}</p>
                    <p className="text-[20px] font-black leading-none truncate" style={{ color: kpi.fg }}>{kpi.value}</p>
                    <p className="text-[9px] mt-1.5" style={{ color: '#526070' }}>{kpi.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráficos */}
            <div className="px-12 py-7 border-b border-[#E2E8F0]">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-5" style={{ color: '#526070' }}>Análise Gráfica</p>
              <div className="grid grid-cols-2 gap-10">
                {/* Donut */}
                <div>
                  <p className="text-[10px] font-bold mb-4" style={{ color: '#1E3A5F' }}>Distribuição por Estado</p>
                  <div className="flex items-center gap-6">
                    <svg width="130" height="130" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
                      <circle cx={donutCx} cy={donutCy} r={donutR} fill="none" stroke="#E2E8F0" strokeWidth={13} />
                      {donutTotal > 0 && donutArcs.map((arc, i) => (
                        <circle key={i} cx={donutCx} cy={donutCy} r={donutR} fill="none" stroke={arc.color} strokeWidth={13}
                          strokeDasharray={`${arc.len} ${donutC - arc.len}`} strokeDashoffset={0}
                          transform={`rotate(${arc.startAngle} ${donutCx} ${donutCy})`} strokeLinecap="butt" />
                      ))}
                      <text x={donutCx} y={donutCy - 6} textAnchor="middle" style={{ fontSize: '20px', fontWeight: 800, fill: '#0F1F35', fontFamily: 'system-ui' }}>{totalInscritos}</text>
                      <text x={donutCx} y={donutCy + 11} textAnchor="middle" style={{ fontSize: '8px', fill: '#526070', fontWeight: 700, fontFamily: 'system-ui', letterSpacing: '0.08em' }}>ALUNOS</text>
                    </svg>
                    <div className="flex flex-col gap-3">
                      {donutSegments.map((seg, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: seg.color }} />
                          <div>
                            <p className="text-[11px] font-black leading-none" style={{ color: seg.color }}>{seg.count}</p>
                            <p className="text-[9px] mt-0.5" style={{ color: '#526070' }}>{seg.label}</p>
                          </div>
                        </div>
                      ))}
                      {donutTotal === 0 && <p className="text-[10px]" style={{ color: '#526070' }}>Sem dados</p>}
                    </div>
                  </div>
                </div>
                {/* Barras mensais */}
                <div>
                  <p className="text-[10px] font-bold mb-4" style={{ color: '#1E3A5F' }}>Receita Mensal — {anoRelatorio}</p>
                  <div className="flex items-end gap-1 h-[88px]">
                    {dadosBarra.map((d, i) => {
                      const h = maxBarra > 0 ? Math.max(3, (d.total / maxBarra) * 76) : 3;
                      return (
                        <div key={i} className="flex flex-col items-center gap-0.5 flex-1" title={`${d.mes}: ${formatCve(d.total)}`}>
                          <div className="w-full rounded-t-[2px] transition-all" style={{ height: `${h}px`, background: d.ativo ? '#1E3A5F' : '#93BBDC' }} />
                          <p className="text-[7px] font-bold uppercase" style={{ color: d.ativo ? '#1E3A5F' : '#8A9BB0' }}>{d.mes}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-[8px]" style={{ color: '#8A9BB0' }}>
                    <span>0</span>
                    <span className="font-bold">{formatCve(maxBarra)} máx.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de alunos */}
            <div className="px-12 py-7 border-b border-[#E2E8F0]">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-5" style={{ color: '#526070' }}>Detalhe por Aluno — <span style={{ color: '#1E3A5F' }}>{mesRelatorio} {anoRelatorio}</span></p>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: '2px solid #1E3A5F' }}>
                    {['#', 'Nome do Aluno', 'Plano', 'Modalidade', 'Estado', 'Vencimento', 'Cobertura'].map((h, i) => (
                      <th key={i} className="pb-2.5 text-[8px] font-black uppercase tracking-[0.14em]" style={{ color: '#1E3A5F', paddingRight: i < 6 ? '12px' : 0 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resumosRel.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-[11px]" style={{ color: '#526070' }}>Nenhum aluno inscrito neste período</td></tr>
                  )}
                  {resumosRel.map(({ aluno, resumo }, idx) => {
                    const tone = getBillingTone(resumo.status);
                    return (
                      <tr key={aluno.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFD', borderBottom: '1px solid #EDF0F5' }}>
                        <td className="py-2.5 pr-3 align-middle text-[10px] font-bold" style={{ color: '#8A9BB0' }}>{String(idx + 1).padStart(2,'0')}</td>
                        <td className="py-2.5 pr-4 align-middle" style={{ width: '30%' }}>
                          <p className="text-[11px] font-bold leading-tight" style={{ color: '#0F1F35' }}>{aluno.nome}</p>
                          <p className="text-[9px]" style={{ color: '#8A9BB0' }}>{aluno.telefone || '—'}</p>
                        </td>
                        <td className="py-2.5 pr-4 align-middle text-[10px] font-semibold" style={{ color: '#1E3A5F' }}>{formatCve(aluno.plano)}</td>
                        <td className="py-2.5 pr-4 align-middle">
                          <span className="px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold uppercase tracking-wider" style={{ background: '#EBF0F8', color: '#1E3A5F' }}>{aluno.modalidade || 'Musc.'}</span>
                        </td>
                        <td className="py-2.5 pr-4 align-middle">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone.color }} />
                            <span className="text-[10px] font-bold" style={{ color: tone.color }}>{getBillingBadgeLabel(resumo.status)}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 align-middle text-[10px]" style={{ color: '#526070' }}>{resumo.nextChargeDate || '—'}</td>
                        <td className="py-2.5 align-middle">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full mb-0.5" style={{ background: '#E2E8F0' }}>
                            <div className="h-full rounded-full" style={{ width: `${getTimelineMetricWidth(resumo, aluno.status)}%`, background: tone.color }} />
                          </div>
                          <p className="text-[8px]" style={{ color: '#8A9BB0' }}>{resumo.coverageEnd || '—'}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumo Financeiro */}
            <div className="px-12 py-7 border-b border-[#E2E8F0]" style={{ background: '#F8FAFD' }}>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-5" style={{ color: '#526070' }}>Resumo Financeiro — {mesRelatorio} {anoRelatorio}</p>
              <div className="grid grid-cols-3 gap-6 mb-5">
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#526070' }}>Receita Prevista</p>
                  <p className="text-[20px] font-black" style={{ color: '#1E3A5F' }}>{formatCve(previsaoMes)}</p>
                  <p className="text-[9px] mt-1" style={{ color: '#8A9BB0' }}>Base: alunos activos</p>
                </div>
                <div className="text-center" style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#526070' }}>Receita Recebida</p>
                  <p className="text-[20px] font-black" style={{ color: '#166534' }}>{formatCve(receitaMes)}</p>
                  <p className="text-[9px] mt-1" style={{ color: '#8A9BB0' }}>{previsaoMes > 0 ? `${Math.round((receitaMes / previsaoMes) * 100)}% realizado` : '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#526070' }}>Por Cobrar</p>
                  <p className="text-[20px] font-black" style={{ color: pendenteMes > 0 ? '#991B1B' : '#166534' }}>{formatCve(pendenteMes)}</p>
                  <p className="text-[9px] mt-1" style={{ color: '#8A9BB0' }}>{pendenteMes === 0 ? '100% cobrado ✓' : `${atrasadosCount} em atraso`}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[9px] mb-1.5" style={{ color: '#526070' }}>
                  <span>Progresso de cobrança do mês</span>
                  <span className="font-bold">{previsaoMes > 0 ? `${Math.round((receitaMes / previsaoMes) * 100)}%` : '—'}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${previsaoMes > 0 ? Math.min(100, (receitaMes / previsaoMes) * 100) : 0}%`, background: pendenteMes === 0 ? '#166534' : '#1E3A5F' }} />
                </div>
              </div>
            </div>

            {/* Rodapé do documento */}
            <div className="px-12 py-5 flex items-center justify-between" style={{ borderTop: '1px solid #E2E8F0' }}>
              <div className="flex items-center gap-2">
                <img src={NEXT_LAB_ICON as string} alt="" className="w-4 h-4" style={{ opacity: 0.35 }} />
                <p className="text-[9px]" style={{ color: '#8A9BB0' }}>{COMPANY_NAME} · {nomeAcademia}</p>
              </div>
              <p className="text-[9px] text-center" style={{ color: '#8A9BB0' }}>Gerado em {geradoEm} · Versão do momento da exportação</p>
              <p className="text-[9px] font-bold" style={{ color: '#1E3A5F' }}>Pág. 1 / 1</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
});

export default RelatoriosPage;
