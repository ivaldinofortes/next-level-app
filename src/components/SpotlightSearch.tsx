/**
 * Pesquisa global estilo Spotlight — páginas, acções e alunos.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookUser, ChevronRight, FileBarChart, FileSpreadsheet, Layout,
  Search, Settings, UserPlus, Users, Wallet, AlertCircle, StickyNote,
} from 'lucide-react';
import { getAlunoIniciais, getAvatarColorByName } from '../utils/formatting';
import { STUDENT_STATUS_HELPERS } from '../constants';

export type SpotlightAction = {
  id: string;
  kind: 'page' | 'action' | 'student' | 'filter';
  title: string;
  subtitle?: string;
  keywords?: string;
  icon?: React.ReactNode;
  run: () => void;
};

type SpotlightSearchProps = {
  alunos?: Array<{
    id: string;
    nome?: string;
    telefone?: string;
    categoria?: string;
    status?: string;
    foto_path?: string;
    plano?: string;
  }>;
  isAdmin?: boolean;
  onNavigate: (aba: string) => void;
  onMatricular?: () => void;
  onOpenStudent?: (aluno: any) => void;
  onFilterStudents?: (filtro: string) => void;
  onImport?: () => void;
  className?: string;
};

function normalize(s: string) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function SpotlightSearch({
  alunos = [],
  isAdmin = false,
  onNavigate,
  onMatricular,
  onOpenStudent,
  onFilterStudents,
  onImport,
  className = '',
}: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const catalog = useMemo<SpotlightAction[]>(() => {
    const items: SpotlightAction[] = [
      {
        id: 'page-home',
        kind: 'page',
        title: 'Início',
        subtitle: 'Painel principal',
        keywords: 'home inicio dashboard painel',
        icon: <Layout size={16} />,
        run: () => onNavigate('home'),
      },
      {
        id: 'page-alunos',
        kind: 'page',
        title: 'Alunos',
        subtitle: 'Lista e cobranças',
        keywords: 'gestao alunos lista mensalidades',
        icon: <Users size={16} />,
        run: () => onNavigate('gestao'),
      },
      {
        id: 'page-contactos',
        kind: 'page',
        title: 'Contactos',
        subtitle: 'Directório e notas',
        keywords: 'contactos crm notas telefone',
        icon: <BookUser size={16} />,
        run: () => onNavigate('contactos'),
      },
      {
        id: 'action-matricular',
        kind: 'action',
        title: 'Matricular aluno',
        subtitle: 'Nova inscrição',
        keywords: 'novo aluno matricula registar',
        icon: <UserPlus size={16} />,
        run: () => onMatricular?.(),
      },
      {
        id: 'filter-divida',
        kind: 'filter',
        title: 'Alunos em dívida',
        subtitle: 'Filtro de cobrança',
        keywords: 'atraso divida cobranca pendente',
        icon: <AlertCircle size={16} />,
        run: () => {
          onNavigate('gestao');
          onFilterStudents?.('divida');
        },
      },
      {
        id: 'filter-cobertos',
        kind: 'filter',
        title: 'Alunos cobertos / em dia',
        subtitle: 'Pagamentos em dia',
        keywords: 'pago coberto em dia',
        icon: <Wallet size={16} />,
        run: () => {
          onNavigate('gestao');
          onFilterStudents?.('cobertos');
        },
      },
      {
        id: 'filter-importados',
        kind: 'filter',
        title: 'Alunos importados',
        subtitle: 'Aguardam revisão',
        keywords: 'importados importacao',
        icon: <FileSpreadsheet size={16} />,
        run: () => {
          onNavigate('gestao');
          onFilterStudents?.('importados');
        },
      },
      {
        id: 'action-import',
        kind: 'action',
        title: 'Importar dados',
        subtitle: 'Excel / CSV',
        keywords: 'importar excel csv dados',
        icon: <FileSpreadsheet size={16} />,
        run: () => onImport?.(),
      },
      {
        id: 'page-notas',
        kind: 'action',
        title: 'Contactos e notas',
        subtitle: 'Post-its e follow-up',
        keywords: 'notas postit sticky',
        icon: <StickyNote size={16} style={{ color: '#EAB308' }} />,
        run: () => onNavigate('contactos'),
      },
    ];

    if (isAdmin) {
      items.push(
        {
          id: 'page-relatorios',
          kind: 'page',
          title: 'Relatórios',
          subtitle: 'Finanças e actividade',
          keywords: 'relatorio financas pdf excel graficos',
          icon: <FileBarChart size={16} />,
          run: () => onNavigate('relatorios_detalhado'),
        },
        {
          id: 'page-config',
          kind: 'page',
          title: 'Ajustes / Configurações',
          subtitle: 'Tema, utilizadores, sistema',
          keywords: 'configuracoes ajustes tema utilizadores',
          icon: <Settings size={16} />,
          run: () => onNavigate('configuracoes'),
        },
      );
    }

    // Alunos (filtro de pesquisa aplica-se depois)
    for (const aluno of alunos.slice(0, 400)) {
      const statusHint =
        aluno.status && aluno.status !== 'ativo' && !STUDENT_STATUS_HELPERS.isImported?.(aluno.status)
          ? aluno.status
          : STUDENT_STATUS_HELPERS.isImported?.(aluno.status)
            ? 'importado'
            : '';
      items.push({
        id: `student-${aluno.id}`,
        kind: 'student',
        title: aluno.nome || 'Aluno sem nome',
        subtitle: [aluno.telefone, aluno.categoria, statusHint].filter(Boolean).join(' · '),
        keywords: `${aluno.nome} ${aluno.telefone} ${aluno.categoria} ${aluno.status}`,
        icon: (
          <div className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold text-white ${getAvatarColorByName(aluno.nome)}`}>
            {aluno.foto_path
              ? <img src={`local-resource://${aluno.foto_path}`} className="h-full w-full object-cover" alt="" />
              : getAlunoIniciais(aluno)}
          </div>
        ),
        run: () => onOpenStudent?.(aluno),
      });
    }

    return items;
  }, [alunos, isAdmin, onNavigate, onMatricular, onOpenStudent, onFilterStudents, onImport]);

  const results = useMemo(() => {
    const q = normalize(query).trim();
    if (!q) {
      // Sugestões iniciais (sem alunos)
      return catalog.filter((i) => i.kind !== 'student').slice(0, 8);
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = catalog
      .map((item) => {
        const hay = normalize(`${item.title} ${item.subtitle || ''} ${item.keywords || ''}`);
        let score = 0;
        for (const t of tokens) {
          if (hay.includes(t)) score += hay.startsWith(t) || normalize(item.title).startsWith(t) ? 3 : 1;
          else return null;
        }
        // Prefer pages/actions slightly over long student lists
        if (item.kind === 'page') score += 0.5;
        if (item.kind === 'action') score += 0.3;
        return { item, score };
      })
      .filter(Boolean) as { item: SpotlightAction; score: number }[];

    scored.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'pt'));
    return scored.slice(0, 12).map((s) => s.item);
  }, [catalog, query]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const runItem = (item: SpotlightAction) => {
    setOpen(false);
    setQuery('');
    item.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      runItem(results[active]);
    }
  };

  const kindLabel = (k: SpotlightAction['kind']) => {
    switch (k) {
      case 'page': return 'Página';
      case 'action': return 'Acção';
      case 'student': return 'Aluno';
      case 'filter': return 'Filtro';
      default: return '';
    }
  };

  return (
    <div ref={rootRef} className={`relative mx-auto w-full max-w-[640px] ${className}`}>
      <div
        className={`flex items-center gap-3 rounded-full border bg-[var(--bg-surface)] px-4 shadow-[var(--shadow-md)] transition-all ${
          open
            ? 'border-[var(--color-primary)] ring-4 ring-[var(--shadow-primary-focus)]'
            : 'border-[var(--border)] hover:border-[var(--color-primary)]/50'
        }`}
        style={{ minHeight: 52 }}
      >
        <Search size={18} className="shrink-0 text-[var(--color-primary)]" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Procurar alunos, páginas, relatórios, acções…"
          className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[15px] font-medium nl-text outline-none placeholder:text-[var(--text-tertiary)]"
          aria-label="Pesquisa global"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="text-[12px] font-semibold nl-text-muted hover:nl-text"
          >
            Limpar
          </button>
        ) : (
          <kbd className="hidden rounded-[6px] border border-[var(--border)] bg-[var(--color-secondary-light)] px-1.5 py-0.5 text-[10px] font-bold nl-text-muted sm:inline">
            ⌘K
          </kbd>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-xl)] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="border-b border-[var(--border-light)] px-3 py-2">
            <p className="text-[11px] font-semibold nl-text-muted">
              {query.trim()
                ? `${results.length} resultado(s)`
                : 'Sugestões · escreva para procurar em tudo'}
            </p>
          </div>
          <ul className="max-h-[min(380px,50vh)] overflow-y-auto custom-scrollbar py-1">
            {results.length === 0 ? (
              <li className="px-4 py-8 text-center text-[13px] nl-text-muted">
                Nada encontrado para “{query}”
              </li>
            ) : (
              results.map((item, idx) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => runItem(item)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      idx === active
                        ? 'bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--bg-surface))]'
                        : 'hover:bg-[var(--color-secondary-light)]'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-secondary-light)] text-[var(--color-primary)]">
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold nl-text">{item.title}</p>
                      {item.subtitle && (
                        <p className="truncate text-[12px] nl-text-muted">{item.subtitle}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider nl-text-muted">
                      {kindLabel(item.kind)}
                    </span>
                    <ChevronRight size={14} className="shrink-0 nl-text-muted opacity-50" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
