import React, { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileBarChart,
  FileSpreadsheet,
  ImagePlus,
  Maximize2,
  MessageSquare,
  Minimize2,
  Phone,
  Sparkles,
  Star,
  StickyNote,
  Dumbbell,
  Users,
  Wallet,
} from 'lucide-react';
import {
  formatCve,
  formatPtDate,
  parseFlexibleDate,
} from '../lib/billing';
import { getAlunoIniciais, getAvatarColorByName, getCategoryTone } from '../utils/formatting';
import SpotlightSearch from './SpotlightSearch';

const normalizeDateLabel = (value?: string) => {
  const date = parseFlexibleDate(value || '');
  if (!date) return 'Sem data';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  if (sameDay(date, today)) return 'Hoje';
  if (sameDay(date, yesterday)) return 'Ontem';
  return formatPtDate(date);
};

const statusResumoLabel = (status?: string) => {
  switch (status) {
    case 'atrasado': return 'Em atraso';
    case 'hoje': return 'Vence hoje';
    case 'critico': return 'Crítico';
    case 'pendente': return 'Pendente';
    case 'alerta': return 'Alerta';
    case 'pago': return 'Em dia';
    default: return status || '—';
  }
};

interface NotaRecente {
  id: number;
  aluno_id: string;
  nome?: string;
  texto: string;
  data_criacao: string;
}

interface HomePageProps {
  bannerAcademia: string;
  DEFAULT_ACADEMY_BANNER: string;
  appLogo: string;
  APP_ICON_PATH: string;
  nomeAcademia: string;
  subtituloAcademia: string;
  agora: Date;
  alunosAtivos: { aluno: any; resumo: any }[];
  alunosEmDivida: { aluno: any; resumo: any }[];
  totalRecebidoPeriodo: number;
  alunos: any[];
  previsaoRecuperacao: number;
  alunosImportados: any[];
  relatorioMensalDisponivel: string;
  setAba: (aba: string) => void;
  setFiltroStatus: (status: string) => void;
  setMostrarForm: (v: boolean) => void;
  setMostrarImportar: (v: boolean) => void;
  setNovoAluno: (aluno: any) => void;
  novoAlunoDefault: any;
  hojeReferencia: Date;
  prepararAcaoOperacionalNoMesAtual: () => void;
  novosInscritosRecentes: any[];
  abrirPerfilAluno: (aluno: any) => void;
  abrirNotasRapidas?: (aluno: any) => void;
  onCobrarAluno?: (alunoId: string) => void;
  notasRecentes: NotaRecente[];
  onUploadBanner: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Zoom da barra de estado (mesma “Vista” que Alunos) */
  larguraListas?: number;
  estiloHome?: CSSProperties;
  isAdmin?: boolean;
  onImport?: () => void;
}

const POSTIT_BG = '#FFF59D';
const POSTIT_BORDER = '#E6D36A';
const POSTIT_INK = '#3D3410';
const POSTIT_MUTED = '#6B5B24';

type PanelKey = 'prioridade' | 'movimento' | 'notas';

/**
 * Cada card expande de forma independente.
 * - expandMode "width": cresce em largura (bento full-row) — Prioridades
 * - expandMode "height": cresce para baixo — Movimento / Notas
 */
const ExpandablePanel: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  style?: React.CSSProperties;
  header: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  tone?: 'default' | 'green' | 'red' | 'blue' | 'postit';
  expandMode?: 'width' | 'height';
  /** span na grelha 12 cols quando fechado */
  spanClosed?: string;
  /** span quando aberto */
  spanOpen?: string;
}> = ({
  isOpen,
  onToggle,
  className = '',
  style,
  header,
  footer,
  children,
  tone = 'default',
  expandMode = 'height',
  spanClosed = 'col-span-12 md:col-span-4',
  spanOpen,
}) => {
  const toneCls =
    tone === 'green'
      ? 'border-[color-mix(in_srgb,var(--color-success)_35%,var(--border))] bg-[color-mix(in_srgb,var(--color-success)_8%,var(--bg-surface))]'
      : tone === 'red'
        ? 'border-[color-mix(in_srgb,var(--color-error)_35%,var(--border))] bg-[color-mix(in_srgb,var(--color-error)_8%,var(--bg-surface))]'
        : tone === 'blue'
          ? 'border-[color-mix(in_srgb,var(--color-primary)_35%,var(--border))] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--bg-surface))]'
          : tone === 'postit'
            ? ''
            : 'border-[var(--border)] bg-[var(--bg-surface)]';

  const openSpan = spanOpen || (expandMode === 'width' ? 'col-span-12' : spanClosed);
  const sizeCls = isOpen
    ? 'shadow-[var(--shadow-md)]'
    : 'shadow-[var(--shadow-xs)]';

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[var(--radius-lg)] border transition-all duration-300 ease-out ${toneCls} ${sizeCls} ${
        isOpen ? openSpan : spanClosed
      } ${className}`}
      style={{
        ...style,
        height: isOpen ? undefined : 'var(--home-panel-h, 248px)',
        minHeight: isOpen ? 'var(--home-panel-h-open, 360px)' : undefined,
        maxHeight: isOpen ? 'calc(var(--home-panel-h-open, 360px) + 160px)' : undefined,
      }}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--border-light)] px-3.5 py-2.5">
        <div className="min-w-0 flex-1">{header}</div>
        <button
          type="button"
          onClick={onToggle}
          className="nl-icon-btn nl-icon-btn-sm shrink-0"
          title={isOpen ? 'Recolher' : 'Expandir'}
        >
          {isOpen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-2.5 py-2">{children}</div>
      {footer && (
        <div className="shrink-0 border-t border-[var(--border-light)] px-2.5 py-2">{footer}</div>
      )}
    </div>
  );
};

const HomePage: React.FC<HomePageProps> = React.memo(({
  bannerAcademia,
  DEFAULT_ACADEMY_BANNER,
  appLogo,
  APP_ICON_PATH,
  nomeAcademia,
  subtituloAcademia,
  agora,
  alunosAtivos,
  alunosEmDivida,
  totalRecebidoPeriodo,
  alunos,
  previsaoRecuperacao,
  alunosImportados,
  relatorioMensalDisponivel,
  setAba,
  setFiltroStatus,
  setMostrarForm,
  setMostrarImportar,
  setNovoAluno,
  novoAlunoDefault,
  prepararAcaoOperacionalNoMesAtual,
  novosInscritosRecentes,
  abrirPerfilAluno,
  abrirNotasRapidas,
  onCobrarAluno,
  notasRecentes,
  onUploadBanner,
  larguraListas = 1120,
  estiloHome = {},
  isAdmin = false,
  onImport,
}) => {
  const alunosEmDia = Math.max(alunosAtivos.length - alunosEmDivida.length, 0);
  const coberturaPercentual = alunosAtivos.length > 0 ? Math.round((alunosEmDia / alunosAtivos.length) * 100) : 100;
  const horaAtual = agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const dataAtual = agora.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' });
  const alunoPorId = useMemo(() => new Map(alunos.map((aluno) => [aluno.id, aluno])), [alunos]);

  // Lista prioritária: atraso → importados → críticos do resumo
  const listaPrioridade = useMemo(() => {
    if (alunosEmDivida.length > 0) {
      return alunosEmDivida
        .slice()
        .sort((a, b) => (a.resumo?.overdueDays || 0) - (b.resumo?.overdueDays || 0) || (a.resumo?.daysUntilCharge || 0) - (b.resumo?.daysUntilCharge || 0))
        .slice(0, 12)
        .map(({ aluno, resumo }) => ({
          kind: 'divida' as const,
          aluno,
          resumo,
          title: aluno.nome,
          meta: `${statusResumoLabel(resumo?.status)} · ${formatCve(aluno.plano)}`,
        }));
    }
    if (alunosImportados.length > 0) {
      return alunosImportados.slice(0, 12).map((aluno) => ({
        kind: 'importado' as const,
        aluno,
        resumo: null as any,
        title: aluno.nome,
        meta: 'Importado · aguarda validação',
      }));
    }
    return [];
  }, [alunosEmDivida, alunosImportados]);

  // Expansão independente por card (vários podem estar abertos ao mesmo tempo)
  const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>({
    prioridade: false,
    movimento: false,
    notas: false,
  });
  const togglePanel = (key: PanelKey) =>
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));

  // Verde leve quando está bem; vermelho quando há dívida
  const prioridadeMeta = alunosEmDivida.length > 0
    ? {
        title: 'Prioridades',
        subtitle: `${alunosEmDivida.length} a cobrar · ${formatCve(previsaoRecuperacao)}`,
        tone: 'text-[var(--color-error)]',
        cardTone: 'red' as const,
        icon: <AlertCircle size={15} className="text-[var(--color-error)]" />,
        emptyTitle: 'Operação em dia',
        emptyBody: 'Sem cobranças críticas agora.',
        footerLabel: 'Ver cobranças',
        footerAction: () => { setAba('gestao'); setFiltroStatus('divida'); },
      }
    : alunosImportados.length > 0
      ? {
          title: 'Prioridades',
          subtitle: `${alunosImportados.length} importação(ões)`,
          tone: 'text-[var(--color-primary)]',
          cardTone: 'blue' as const,
          icon: <FileSpreadsheet size={15} className="text-[var(--color-primary)]" />,
          emptyTitle: '',
          emptyBody: '',
          footerLabel: 'Rever importados',
          footerAction: () => { setAba('gestao'); setFiltroStatus('importados'); },
        }
      : relatorioMensalDisponivel
        ? {
            title: 'Prioridades',
            subtitle: `Relatório de ${relatorioMensalDisponivel}`,
            tone: 'text-[var(--color-success)]',
            cardTone: 'green' as const,
            icon: <FileBarChart size={15} className="text-[var(--color-success)]" />,
            emptyTitle: 'Relatório pronto',
            emptyBody: 'Consulte o relatório administrativo.',
            footerLabel: 'Abrir relatório',
            footerAction: () => setAba('relatorios_detalhado'),
          }
        : {
            title: 'Prioridades',
            subtitle: 'Tudo controlado',
            tone: 'text-[var(--color-success)]',
            cardTone: 'green' as const,
            icon: <CheckCircle2 size={15} className="text-[var(--color-success)]" />,
            emptyTitle: 'Operação controlada',
            emptyBody: 'Sem pendências críticas.',
            footerLabel: 'Ver alunos',
            footerAction: () => { setAba('gestao'); setFiltroStatus('todos'); },
          };

  const indicadores = [
    {
      label: 'Alunos ativos',
      value: String(alunosAtivos.length),
      sub: `${alunos.length} no sistema`,
      icon: <Users size={16} />,
      accent: 'text-[var(--color-primary)]',
      action: () => { setAba('gestao'); setFiltroStatus('todos'); },
    },
    {
      label: 'Em dia',
      value: `${coberturaPercentual}%`,
      sub: `${alunosEmDia}/${alunosAtivos.length || 0} cobertos`,
      icon: <CheckCircle2 size={16} />,
      accent: 'text-[var(--color-success)]',
      action: () => { setAba('gestao'); setFiltroStatus('cobertos'); },
    },
    {
      label: 'Recebido',
      value: formatCve(totalRecebidoPeriodo),
      sub: 'Período atual',
      icon: <Wallet size={16} />,
      accent: 'text-[var(--color-primary)]',
      action: () => setAba('relatorios_detalhado'),
    },
    {
      label: 'A recuperar',
      value: formatCve(previsaoRecuperacao),
      sub: `${alunosEmDivida.length} pendência(s)`,
      icon: <AlertCircle size={16} />,
      accent: alunosEmDivida.length > 0 ? 'text-[var(--color-error)]' : 'text-[var(--text-secondary)]',
      action: () => { setAba('gestao'); setFiltroStatus('divida'); },
    },
  ];

  const matricular = () => {
    prepararAcaoOperacionalNoMesAtual?.();
    setNovoAluno?.({ ...novoAlunoDefault });
    setMostrarForm(true);
  };

  // Atalho estilo Spotlight (⌘K / Ctrl+K) foca a pesquisa da Início
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('[aria-label="Pesquisa global"]');
        el?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative h-full w-full overflow-y-auto custom-scrollbar nl-bg-app" style={estiloHome}>
      {/* Bolinhas de cor no fundo — mesmo espírito do login / matrícula */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -right-20 top-[18%] h-72 w-72 rounded-full opacity-40 blur-[1px]"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 26%, transparent)' }}
        />
        <div
          className="absolute -left-24 top-[42%] h-80 w-80 rounded-full opacity-35 blur-[1px]"
          style={{ background: 'color-mix(in srgb, var(--color-success) 20%, transparent)' }}
        />
        <div
          className="absolute right-[18%] bottom-[8%] h-48 w-48 rounded-full opacity-30"
          style={{ background: 'color-mix(in srgb, #D97706 18%, transparent)' }}
        />
        <div
          className="absolute left-[28%] top-[58%] h-28 w-28 rounded-full opacity-28"
          style={{ background: 'color-mix(in srgb, #7C3AED 16%, transparent)' }}
        />
        <div
          className="absolute right-[40%] top-[32%] h-20 w-20 rounded-full opacity-25"
          style={{ background: 'color-mix(in srgb, #0D9488 18%, transparent)' }}
        />
      </div>

      {/* Banner com mais respiro (altura + padding) */}
      <section className="relative z-[1] min-h-[240px] w-full overflow-hidden border-b border-[var(--border)] sm:min-h-[260px]">
        <input
          id="home-banner-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onUploadBanner}
        />
        <img
          src={bannerAcademia || DEFAULT_ACADEMY_BANNER}
          alt="Banner da academia"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/28 to-black/12" />
        <button
          type="button"
          onClick={() => document.getElementById('home-banner-upload')?.click()}
          className="absolute right-5 top-5 z-10 inline-flex h-8 items-center gap-2 rounded-[var(--radius-control)] border border-white/30 bg-black/25 px-3 text-[12px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/40"
          title="Alterar imagem do banner"
        >
          <ImagePlus size={14} strokeWidth={2} />
          Alterar imagem
        </button>

        <div
          className="relative mx-auto flex min-h-[240px] items-end justify-between gap-5 pb-8 pt-16 sm:min-h-[260px] sm:pb-10 sm:pt-20"
          style={{ maxWidth: 'var(--home-max, 1120px)', paddingLeft: 'var(--home-pad-x, 20px)', paddingRight: 'var(--home-pad-x, 20px)' }}
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-surface)] border border-white/35 bg-white/90 p-2 shadow-[var(--shadow-sm)]">
              <img src={appLogo || APP_ICON_PATH} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 text-white">
              <p className="text-[13px] font-medium text-white/85">Bem-vindo</p>
              <h1 className="mt-1 truncate text-[28px] font-semibold leading-tight tracking-tight">{nomeAcademia}</h1>
              <p className="mt-1.5 max-w-[640px] truncate text-[14px] font-medium text-white/75">{subtituloAcademia}</p>
            </div>
          </div>

          <div className="hidden shrink-0 text-right text-white sm:block">
            <p className="text-[28px] font-semibold leading-none tabular-nums tracking-tight">{horaAtual}</p>
            <p className="mt-1.5 text-[13px] font-medium capitalize text-white/80">{dataAtual}</p>
          </div>
        </div>
      </section>

      {/* Conteúdo afastado do banner — zoom da barra de estado */}
      <div
        className="relative z-[1] mx-auto flex w-full flex-col transition-[max-width,gap,padding] duration-200"
        style={{
          maxWidth: 'var(--home-max, 1120px)',
          gap: 'var(--home-gap, 16px)',
          paddingLeft: 'var(--home-pad-x, 20px)',
          paddingRight: 'var(--home-pad-x, 20px)',
          paddingTop: 'calc(var(--home-pad-y, 20px) + 12px)',
          paddingBottom: 'var(--home-pad-y, 20px)',
        }}
      >
        {/* Spotlight — pesquisa global (abaixo do banner, centrada) */}
        <div className="relative z-[30] -mt-1 flex w-full justify-center px-1">
          <SpotlightSearch
            alunos={alunos}
            isAdmin={isAdmin}
            onNavigate={(page) => setAba(page)}
            onMatricular={matricular}
            onOpenStudent={(aluno) => abrirPerfilAluno(aluno)}
            onFilterStudents={(filtro) => {
              setAba('gestao');
              setFiltroStatus(filtro);
            }}
            onImport={() => {
              onImport?.();
              setMostrarImportar(true);
            }}
            className="w-full"
          />
        </div>

        {/* KPIs clicáveis */}
        <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-4" style={{ gap: 'var(--home-gap, 12px)' }}>
          {indicadores.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="nl-card text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)] focus-visible:outline-none"
              style={{ padding: 'var(--home-kpi-pad, 14px)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={item.accent}>{item.icon}</span>
                <p className="font-medium nl-text-muted" style={{ fontSize: 'var(--home-kpi-label, 12px)' }}>{item.label}</p>
              </div>
              <p className={`mt-1.5 truncate font-semibold leading-tight tabular-nums ${item.accent}`} style={{ fontSize: 'var(--home-kpi-title, 20px)' }}>{item.value}</p>
              <p className="mt-0.5 truncate font-medium nl-text-muted" style={{ fontSize: 'var(--home-kpi-label, 11px)' }}>{item.sub}</p>
            </button>
          ))}
        </section>

        {/* Atalhos compactos */}
        <section className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={matricular}
            className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-all hover:brightness-110 hover:shadow-[0_6px_18px_rgba(37,99,235,0.42)] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 48%, #1d4ed8 100%)' }}
          >
            <Dumbbell size={15} strokeWidth={2.2} /> Matricular
          </button>
          <button type="button" onClick={() => { setAba('gestao'); setFiltroStatus('divida'); }} className="nl-btn nl-btn-sm !bg-[var(--color-success)] !border-[var(--color-success)] !text-white">
            <Wallet size={14} /> Cobranças
          </button>
          <button type="button" onClick={() => setAba('contactos')} className="nl-btn nl-btn-sm !bg-[var(--color-primary)] !border-[var(--color-primary)] !text-white">
            <MessageSquare size={14} /> Contactos
          </button>
          <button type="button" onClick={() => setMostrarImportar(true)} className="nl-btn nl-btn-ghost nl-btn-sm">
            <FileSpreadsheet size={14} /> Importar
          </button>
          <button type="button" onClick={() => setAba('configuracoes')} className="nl-btn nl-btn-ghost nl-btn-sm">
            <CalendarDays size={14} /> Ajustes
          </button>
        </section>

        {/* Bento: Prioridade maior; cada card expande sozinho */}
        <section className="grid grid-cols-12 items-start" style={{ gap: 'var(--home-gap, 12px)' }}>
          {/* ── PRIORIDADES — expande em largura + nomes em colunas ── */}
          <ExpandablePanel
            isOpen={openPanels.prioridade}
            onToggle={() => togglePanel('prioridade')}
            tone={prioridadeMeta.cardTone}
            expandMode="width"
            spanClosed="col-span-12 md:col-span-6 xl:col-span-5"
            spanOpen="col-span-12"
            header={(
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {prioridadeMeta.icon}
                  <h2 className="text-[14px] font-semibold nl-text">{prioridadeMeta.title}</h2>
                  {listaPrioridade.length > 0 && (
                    <span className={`badge tabular-nums ${prioridadeMeta.cardTone === 'red' ? 'badge-error' : prioridadeMeta.cardTone === 'green' ? 'badge-success' : 'badge-info'}`}>
                      {listaPrioridade.length}
                    </span>
                  )}
                </div>
                <p className={`mt-0.5 truncate text-[11px] font-medium ${prioridadeMeta.tone}`}>{prioridadeMeta.subtitle}</p>
              </div>
            )}
            footer={(
              <button type="button" onClick={prioridadeMeta.footerAction} className="nl-btn nl-btn-ghost nl-btn-sm w-full !justify-between">
                {prioridadeMeta.footerLabel}
                <ChevronRight size={14} />
              </button>
            )}
          >
            {listaPrioridade.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 px-3 py-6 text-center">
                <CheckCircle2 size={22} className="text-[var(--color-success)] opacity-80" />
                <p className="text-[13px] font-semibold nl-text">{prioridadeMeta.emptyTitle}</p>
                <p className="text-[11px] font-medium nl-text-muted">{prioridadeMeta.emptyBody}</p>
              </div>
            ) : (
              <ul
                className={
                  openPanels.prioridade
                    ? 'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'space-y-0.5'
                }
              >
                {listaPrioridade.map(({ aluno, title, meta, kind }) => (
                  <li key={aluno.id}>
                    <div
                      className={`group flex items-center gap-1.5 rounded-[var(--radius-control)] px-1.5 py-1.5 hover:bg-[var(--color-secondary-light)] ${
                        openPanels.prioridade ? 'border border-[var(--border-light)] bg-[var(--bg-surface)]/80 px-2.5 py-2' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => abrirPerfilAluno(aluno)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        title="Abrir perfil"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold text-white ${getAvatarColorByName(aluno.nome)}`}>
                          {aluno.foto_path
                            ? <img src={`local-resource://${aluno.foto_path}`} className="h-full w-full object-cover" alt="" />
                            : getAlunoIniciais(aluno)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold nl-text">{title}</p>
                          <p className="truncate text-[11px] font-medium nl-text-muted">{meta}</p>
                        </div>
                      </button>
                      {kind === 'divida' && onCobrarAluno && (
                        <button
                          type="button"
                          onClick={() => onCobrarAluno(aluno.id)}
                          className="nl-icon-btn nl-icon-btn-sm opacity-70 group-hover:opacity-100"
                          title="Registar pagamento"
                        >
                          <Wallet size={13} className="text-[var(--color-success)]" />
                        </button>
                      )}
                      {aluno.telefone && (
                        <button
                          type="button"
                          onClick={() => {
                            const tel = String(aluno.telefone).replace(/\D/g, '');
                            window.open(`https://wa.me/${tel}`, '_blank');
                          }}
                          className="nl-icon-btn nl-icon-btn-sm opacity-70 group-hover:opacity-100"
                          title="WhatsApp"
                        >
                          <Phone size={13} className="text-[var(--color-primary)]" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ExpandablePanel>

          {/* ── MOVIMENTO — expande para baixo ── */}
          <ExpandablePanel
            isOpen={openPanels.movimento}
            onToggle={() => togglePanel('movimento')}
            tone="blue"
            expandMode="height"
            spanClosed="col-span-12 md:col-span-6 xl:col-span-4"
            spanOpen="col-span-12 md:col-span-6 xl:col-span-4"
            header={(
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Star size={15} className="fill-amber-400 text-amber-500" />
                  <h2 className="text-[14px] font-semibold nl-text">Novos alunos</h2>
                  <span className="badge badge-warning tabular-nums">{novosInscritosRecentes.length}</span>
                </div>
                <p className="mt-0.5 text-[11px] font-medium nl-text-muted">
                  Últimos 7 dias · sem importados
                </p>
              </div>
            )}
            footer={(
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={matricular}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-white shadow-[0_3px_10px_rgba(37,99,235,0.32)] transition hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)' }}
                >
                  <Dumbbell size={13} strokeWidth={2.2} /> Matricular
                </button>
                <button
                  type="button"
                  onClick={() => { setAba('gestao'); setFiltroStatus('todos'); }}
                  className="nl-btn nl-btn-ghost nl-btn-sm"
                >
                  Ver todos
                </button>
              </div>
            )}
          >
            {novosInscritosRecentes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 px-3 py-6 text-center">
                <Sparkles size={22} className="text-amber-500 opacity-70" />
                <p className="text-[13px] font-semibold nl-text">Sem novos alunos</p>
                <p className="text-[11px] font-medium nl-text-muted">Matriculados nos últimos 7 dias aparecem aqui.</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {novosInscritosRecentes.map((aluno) => {
                  const dataMatricula = parseFlexibleDate(aluno.data_matricula);
                  const catTone = getCategoryTone(aluno.categoria);
                  return (
                    <li key={aluno.id || aluno.nome}>
                      <button
                        type="button"
                        onClick={() => abrirPerfilAluno(aluno)}
                        className="group flex w-full items-center gap-2 rounded-[var(--radius-compact)] px-1.5 py-1.5 text-left transition-colors hover:bg-[var(--color-secondary-light)]"
                        style={{ boxShadow: `inset 3px 0 0 ${catTone.solid}` }}
                      >
                        <div className="relative shrink-0">
                          <div className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold text-white ${getAvatarColorByName(aluno.nome)}`}>
                            {aluno.foto_path
                              ? <img src={`local-resource://${aluno.foto_path}`} className="h-full w-full object-cover" alt="" />
                              : getAlunoIniciais(aluno)}
                          </div>
                          {/* Estrela “novo aluno” */}
                          <span
                            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--bg-surface)] bg-amber-400 text-amber-950 shadow-sm"
                            title="Novo aluno"
                          >
                            <Star size={9} className="fill-current" strokeWidth={0} />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <p className="truncate text-[12px] font-semibold nl-text">{aluno.nome}</p>
                            <span className="badge badge-warning !px-1.5 !py-0 !text-[9px] shrink-0">Novo</span>
                          </div>
                          <p className="truncate text-[10px] font-medium nl-text-muted">
                            {dataMatricula ? formatPtDate(dataMatricula) : 'Sem data'}
                            {aluno.categoria ? ` · ${aluno.categoria}` : ''}
                            {aluno.plano ? ` · ${formatCve(aluno.plano)}` : ''}
                          </p>
                        </div>
                        <ChevronRight size={14} className="shrink-0 nl-text-muted opacity-60 group-hover:opacity-100" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ExpandablePanel>

          {/* ── NOTAS — expande para baixo ── */}
          <ExpandablePanel
            isOpen={openPanels.notas}
            onToggle={() => togglePanel('notas')}
            tone="postit"
            expandMode="height"
            spanClosed="col-span-12 md:col-span-6 xl:col-span-3"
            spanOpen="col-span-12 md:col-span-6 xl:col-span-3"
            style={{
              background: POSTIT_BG,
              borderColor: POSTIT_BORDER,
              boxShadow: '0 8px 24px rgba(90,70,10,0.10)',
            }}
            header={(
              <div className="flex items-center gap-2" style={{ color: POSTIT_INK }}>
                <StickyNote size={16} style={{ color: '#EAB308' }} />
                <div>
                  <p className="text-[15px] font-semibold leading-none">Notas</p>
                  <p className="mt-0.5 text-[11px] font-medium" style={{ color: POSTIT_MUTED }}>
                    {notasRecentes.length} recente(s) · destaque da operação
                  </p>
                </div>
              </div>
            )}
            footer={(
              <button
                type="button"
                onClick={() => setAba('contactos')}
                className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                <MessageSquare size={13} /> Abrir contactos
              </button>
            )}
          >
            {notasRecentes.length === 0 ? (
              <p className="py-8 text-center text-[12px] font-medium" style={{ color: POSTIT_MUTED }}>
                Sem notas recentes.
              </p>
            ) : (
              <ul className="space-y-2 px-1">
                {notasRecentes.map((nota) => {
                  const aluno = alunoPorId.get(nota.aluno_id);
                  const nome = nota.nome || aluno?.nome || 'Aluno sem nome';
                  return (
                    <li key={nota.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (aluno && abrirNotasRapidas) {
                            abrirNotasRapidas(aluno);
                            return;
                          }
                          if (aluno) abrirPerfilAluno(aluno);
                        }}
                        className="w-full rounded-[var(--radius-control)] border p-3 text-left transition-all hover:-translate-y-0.5"
                        style={{
                          background: 'rgba(255,255,255,0.55)',
                          borderColor: POSTIT_BORDER,
                          boxShadow: '0 3px 10px rgba(90,70,10,0.07)',
                          color: POSTIT_INK,
                        }}
                      >
                        <p className="truncate text-[15px] font-semibold leading-snug">{nome}</p>
                        <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-relaxed" style={{ color: POSTIT_MUTED }}>
                          {nota.texto}
                        </p>
                        <p className="mt-1.5 text-[10px] font-medium" style={{ color: POSTIT_MUTED }}>
                          {normalizeDateLabel(nota.data_criacao)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ExpandablePanel>
        </section>
      </div>
    </div>
  );
});

export default HomePage;
