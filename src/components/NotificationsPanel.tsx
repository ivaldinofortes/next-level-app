// @ts-nocheck -- Legacy notification controller will receive strict typing in the next decomposition pass.
import { Bell, X } from 'lucide-react';
import type { Notificacao } from '../types/app';

function NotifItem({ n, onClick }: { n: Notificacao; onClick: () => void }) {
  const iconColor = n.tipo === 'sucesso' ? 'bg-green-500' : n.tipo === 'alerta' ? 'bg-orange-500' : n.tipo === 'erro' ? 'bg-red-500' : 'bg-[var(--color-primary)]';
  return (
    <div className={`px-5 py-3.5 flex items-start gap-3 hover:bg-[var(--color-secondary-lighter)]/60 transition-all cursor-pointer ${!n.lida ? 'bg-blue-50/40' : ''}`} onClick={onClick}>
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] font-bold nl-text leading-tight ${!n.lida ? 'text-[var(--color-primary)]' : ''}`}>{n.titulo}</p>
        <p className="text-[11px] nl-text-muted leading-relaxed mt-0.5 line-clamp-2">{n.mensagem}</p>
      </div>
      <span className="text-[9px] font-bold nl-text-muted uppercase opacity-60 shrink-0 mt-0.5">{n.data.split(',')[0]}</span>
    </div>
  );
}

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return <div className="px-5 py-2 flex items-center justify-between border-b border-[var(--border-light)]"><span className={`text-[9px] font-black uppercase tracking-[0.2em] ${color}`}>{label}</span><span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${color} opacity-80 border border-current`}>{count}</span></div>;
}

export default function NotificationsPanel({ model }: { model: unknown }) {
  const { notificacoes, notificacoesRef, limparNotificacoes, setMostrarNotificacoes, marcarComoLida, setAba, setConfigAba } = model;

        const prioritarias = notificacoes.filter(n => n.categoria === 'prioritaria');
        const relatorios = notificacoes.filter(n => n.categoria === 'relatorio');
        const appNotifs = notificacoes.filter(n => !n.categoria || n.categoria === 'app');
        const naoLidas = notificacoes.filter(n => !n.lida).length;

        return (
          <div ref={notificacoesRef} className="fixed top-16 right-6 w-[400px] bg-[var(--bg-surface)] shadow-2xl rounded-[3px] border border-[var(--border)] z-[500] overflow-hidden flex flex-col animate-slide-up" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--color-secondary-lighter)]/40">
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-[var(--color-primary)]" />
                <h3 className="text-[12px] font-black nl-text uppercase tracking-widest">Notificações</h3>
                {naoLidas > 0 && (
                  <span className="bg-[var(--color-primary)] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{naoLidas}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {notificacoes.length > 0 && (
                  <button onClick={limparNotificacoes} className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tight">Limpar</button>
                )}
                <button onClick={() => setMostrarNotificacoes(false)} className="nl-text-muted hover:text-[var(--color-primary)] transition-colors"><X size={16} /></button>
              </div>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 divide-y divide-[var(--border-light)]">
              {notificacoes.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-secondary-lighter)] flex items-center justify-center mx-auto mb-3 opacity-40"><Bell size={28} /></div>
                  <p className="text-[13px] font-bold nl-text-muted">Sem notificações.</p>
                </div>
              ) : (
                <>
                  {/* 🔴 PRIORITÁRIAS */}
                  {prioritarias.length > 0 && (
                    <div>
                      <SectionHeader label="🔴 Prioritárias" count={prioritarias.length} color="text-red-600" />
                      {prioritarias.map(n => (
                        <NotifItem key={n.id} n={n} onClick={() => marcarComoLida(n.id)} />
                      ))}
                    </div>
                  )}

                  {/* 📊 RELATÓRIOS */}
                  {relatorios.length > 0 && (
                    <div>
                      <SectionHeader label="📊 Relatórios" count={relatorios.length} color="text-blue-600" />
                      {relatorios.map(n => (
                        <NotifItem key={n.id} n={n} onClick={() => marcarComoLida(n.id)} />
                      ))}
                    </div>
                  )}

                  {/* ℹ️ APP */}
                  {appNotifs.length > 0 && (
                    <div>
                      <SectionHeader label="ℹ️ Sistema" count={appNotifs.length} color="text-slate-500" />
                      {appNotifs.map(n => (
                        <NotifItem key={n.id} n={n} onClick={() => marcarComoLida(n.id)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-3 bg-[var(--color-secondary-lighter)]/40 border-t border-[var(--border)] text-center">
              <button onClick={() => { setAba('configuracoes'); setConfigAba('notificacoes'); setMostrarNotificacoes(false); }} className="text-[10px] font-extrabold text-[var(--color-primary)] uppercase tracking-widest hover:underline">Configurações de Notificações</button>
            </div>
          </div>
        );
      
}
