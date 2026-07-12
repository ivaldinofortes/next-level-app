import { useCallback, useState } from 'react';
import { ENROLLMENT_CATEGORIES } from '../constants';

/** Lista fixa de categorias de inscrição do sistema */
export const SYSTEM_CATEGORIES = [...ENROLLMENT_CATEGORIES];

export function useCategories(_save: (key: string, value: string) => Promise<void>) {
  // Lista fixa — sem escrita em loop nem re-render desnecessário
  const [categorias] = useState<string[]>(SYSTEM_CATEGORIES);
  const [novaCategoria, setNovaCategoria] = useState('');

  /** API compatível: ignora valores antigos da BD e mantém as 2 oficiais */
  const setCategorias = useCallback((_value?: string[] | ((prev: string[]) => string[])) => {
    // no-op de estado — categorias são constantes de sistema
  }, []);

  const adicionarCategoria = useCallback(() => {
    setNovaCategoria('');
  }, []);

  const removerCategoria = useCallback((_categoria: string) => {
    // Categorias fixas
  }, []);

  return {
    categorias,
    setCategorias,
    novaCategoria,
    setNovaCategoria,
    adicionarCategoria,
    removerCategoria,
  };
}
