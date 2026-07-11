import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Notificacao } from '../types/app';

export function useNotifications() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(() => JSON.parse(localStorage.getItem('nl_notificacoes') || '[]'));
  useEffect(() => { localStorage.setItem('nl_notificacoes', JSON.stringify(notificacoes)); }, [notificacoes]);
  const adicionarNotificacao = useCallback((titulo: string, mensagem: string, tipo: Notificacao['tipo'] = 'info', alunoId?: string) => {
    const tituloBaixo = titulo.toLowerCase();
    const categoria: Notificacao['categoria'] = tituloBaixo.includes('matr') || tituloBaixo.includes('atraso') || tituloBaixo.includes('pagamento') || tituloBaixo.includes('status') || tituloBaixo.includes('cancelamento') || tipo === 'alerta' || tipo === 'erro' ? 'prioritaria'
      : tituloBaixo.includes('relat') || tituloBaixo.includes('export') || tituloBaixo.includes('dossier') || tituloBaixo.includes('mensal') || tituloBaixo.includes('receita') || tituloBaixo.includes('taxa') ? 'relatorio' : 'app';
    setNotificacoes((prev) => [{ id: Date.now().toString(), titulo, mensagem, data: new Date().toLocaleString('pt-PT'), lida: false, tipo, categoria, alunoId }, ...prev]);
  }, []);
  const marcarComoLida = useCallback((id: string) => setNotificacoes((prev) => prev.map((notificacao) => notificacao.id === id ? { ...notificacao, lida: true } : notificacao)), []);
  const limparNotificacoes = useCallback(() => setNotificacoes([]), []);
  const notificacoesNaoLidas = useMemo(() => notificacoes.filter((notificacao) => !notificacao.lida).length, [notificacoes]);
  return { notificacoes, setNotificacoes, adicionarNotificacao, marcarComoLida, limparNotificacoes, notificacoesNaoLidas };
}
