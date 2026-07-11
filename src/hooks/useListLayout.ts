import { useMemo } from 'react';
import type { CSSProperties } from 'react';

/**
 * Pastéis para linhas da lista.
 * Light: pastéis claros (como no design original).
 * Dark: mesmas cores, em tintas suaves sobre fundo escuro — mantém o estilo, legível no tema escuro.
 */
const PASTELS_LIGHT = [
  { bg: 'bg-[#EEF4FF]', border: 'border-[#C7DEFF]', rowBg: 'rgba(238, 244, 255, 0.55)', rowHover: 'rgba(226, 236, 255, 0.85)' },
  { bg: 'bg-[#F0FDF5]', border: 'border-[#BBF7D0]', rowBg: 'rgba(240, 253, 245, 0.55)', rowHover: 'rgba(220, 252, 231, 0.80)' },
  { bg: 'bg-[#FEF9EE]', border: 'border-[#FDE68A]', rowBg: 'rgba(255, 251, 235, 0.55)', rowHover: 'rgba(254, 243, 199, 0.75)' },
  { bg: 'bg-[#FDF4FF]', border: 'border-[#E9D5FF]', rowBg: 'rgba(250, 245, 255, 0.55)', rowHover: 'rgba(243, 232, 255, 0.80)' },
  { bg: 'bg-[#FFF1F2]', border: 'border-[#FECDD3]', rowBg: 'rgba(255, 241, 242, 0.50)', rowHover: 'rgba(255, 228, 230, 0.75)' },
  { bg: 'bg-[#F0FDFA]', border: 'border-[#99F6E4]', rowBg: 'rgba(240, 253, 250, 0.55)', rowHover: 'rgba(204, 251, 241, 0.70)' },
];

/** Tintas coloridas sobre superfície escura (não brancas) */
const PASTELS_DARK = [
  { bg: 'bg-blue-500/10', border: 'border-blue-400/25', rowBg: 'rgba(98, 160, 234, 0.11)', rowHover: 'rgba(98, 160, 234, 0.20)' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-400/25', rowBg: 'rgba(51, 209, 122, 0.10)', rowHover: 'rgba(51, 209, 122, 0.18)' },
  { bg: 'bg-amber-400/10', border: 'border-amber-300/25', rowBg: 'rgba(248, 228, 92, 0.09)', rowHover: 'rgba(248, 228, 92, 0.16)' },
  { bg: 'bg-violet-500/10', border: 'border-violet-400/25', rowBg: 'rgba(167, 139, 250, 0.11)', rowHover: 'rgba(167, 139, 250, 0.20)' },
  { bg: 'bg-rose-500/10', border: 'border-rose-400/25', rowBg: 'rgba(251, 113, 133, 0.10)', rowHover: 'rgba(251, 113, 133, 0.18)' },
  { bg: 'bg-teal-400/10', border: 'border-teal-300/25', rowBg: 'rgba(45, 212, 191, 0.10)', rowHover: 'rgba(45, 212, 191, 0.18)' },
];

export type AppThemeName = 'light' | 'dark' | 'claude';

export function useListLayout(zoom: number, theme: AppThemeName = 'light') {
  return useMemo(() => {
    const normalized = Math.max(60, Math.min(100, zoom));
    const density = (normalized - 60) / 40;
    const isDark = theme === 'dark';
    const pastels = isDark ? PASTELS_DARK : PASTELS_LIGHT;

    const larguraListas = Math.round(1120 + density * 360);

    // Lista de alunos
    const estiloTabelaAlunos = {
      '--list-row-py': `${(4.0 + density * 3.2).toFixed(1)}px`,
      '--list-row-px': `${(8.0 + density * 4.0).toFixed(1)}px`,
      '--list-avatar-size': `${Math.round(30 + density * 5.8)}px`,
      '--list-font-primary': `${(13.5 + density * 1.4).toFixed(1)}px`,
      '--list-font-secondary': `${(10.8 + density * 1.1).toFixed(1)}px`,
      '--list-surface': 'var(--bg-surface)',
      '--list-chip-bg': isDark ? 'rgba(255,255,255,0.06)' : 'var(--bg-surface)',
      '--list-chip-border': isDark ? 'rgba(255,255,255,0.10)' : 'var(--border-light)',
      '--list-row-divider': isDark ? 'rgba(255,255,255,0.06)' : 'var(--border-light)',
      '--list-thead-bg': isDark ? 'rgba(255,255,255,0.04)' : 'var(--color-secondary-lighter)',
    } as CSSProperties;

    // Página Início (mesma “Vista” da barra de estado)
    const estiloHome = {
      '--home-max': `${larguraListas}px`,
      '--home-gap': `${(12 + density * 8).toFixed(1)}px`,
      '--home-pad-x': `${(16 + density * 8).toFixed(1)}px`,
      '--home-pad-y': `${(16 + density * 10).toFixed(1)}px`,
      '--home-kpi-pad': `${(12 + density * 6).toFixed(1)}px`,
      '--home-kpi-title': `${(18 + density * 4).toFixed(1)}px`,
      '--home-kpi-label': `${(11 + density * 1.5).toFixed(1)}px`,
      '--home-panel-h': `${Math.round(228 + density * 48)}px`,
      '--home-panel-h-open': `${Math.round(360 + density * 80)}px`,
      '--home-font': `${(12.5 + density * 1.6).toFixed(1)}px`,
    } as CSSProperties;

    return {
      zoomListaNormalizado: normalized,
      larguraListas,
      larguraSidebarContactos: Math.round(280 + density * 80),
      estiloTabelaAlunos,
      estiloHome,
      obterTomPastel: (index: number) => pastels[index % pastels.length],
      isListDark: isDark,
    };
  }, [zoom, theme]);
}
