import { useMemo } from 'react';
import type { CSSProperties } from 'react';

const PASTELS = [
  { bg: 'bg-[#EEF4FF]', border: 'border-[#C7DEFF]' }, { bg: 'bg-[#F0FDF5]', border: 'border-[#BBF7D0]' },
  { bg: 'bg-[#FEF9EE]', border: 'border-[#FDE68A]' }, { bg: 'bg-[#FDF4FF]', border: 'border-[#E9D5FF]' },
  { bg: 'bg-[#FFF1F2]', border: 'border-[#FECDD3]' }, { bg: 'bg-[#F0FDFA]', border: 'border-[#99F6E4]' },
];

export function useListLayout(zoom: number) {
  return useMemo(() => {
    const normalized = Math.max(60, Math.min(100, zoom));
    const density = (normalized - 60) / 40;
    const style = {
      '--list-row-py': `${((7.5 + density * 5.5) * 0.64).toFixed(1)}px`, '--list-row-px': `${(12 + density * 7).toFixed(1)}px`,
      '--list-avatar-size': `${Math.round(29 + density * 6)}px`, '--list-font-primary': `${(13 + density * 1.6).toFixed(1)}px`, '--list-font-secondary': `${(11.2 + density * 1.25).toFixed(1)}px`,
    } as CSSProperties;
    return { zoomListaNormalizado: normalized, larguraListas: Math.round(1120 + ((normalized - 60) / 40) * 360), larguraSidebarContactos: Math.round(280 + ((normalized - 60) / 40) * 80), estiloTabelaAlunos: style, obterTomPastel: (index: number) => PASTELS[index % PASTELS.length] };
  }, [zoom]);
}
