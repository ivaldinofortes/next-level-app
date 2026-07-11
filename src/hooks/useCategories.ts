import { useCallback, useState } from 'react';

export function useCategories(save: (key: string, value: string) => Promise<void>) {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const adicionarCategoria = useCallback(() => {
    const categoria = novaCategoria.trim();
    if (!categoria) return;
    const novas = [...categorias, categoria];
    setCategorias(novas);
    void save('categorias', JSON.stringify(novas));
    setNovaCategoria('');
  }, [categorias, novaCategoria, save]);
  const removerCategoria = useCallback((categoria: string) => {
    const novas = categorias.filter((item) => item !== categoria);
    setCategorias(novas);
    void save('categorias', JSON.stringify(novas));
  }, [categorias, save]);
  return { categorias, setCategorias, novaCategoria, setNovaCategoria, adicionarCategoria, removerCategoria };
}
