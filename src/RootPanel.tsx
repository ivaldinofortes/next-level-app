// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import {
  Shield, LogOut, RotateCcw, FileBarChart, Activity, Users,
  Eye, EyeOff, AlertCircle, CheckCircle2, Download, RefreshCw,
  Clock, Mail, Lock, Terminal, Zap, ChevronDown, ChevronUp,
  UserCheck, UserX, Key, Database, Settings, AlertTriangle
} from 'lucide-react';

const electron = (window as any).require ? (window as any).require('electron') : null;

interface RootPanelProps { onLogout: () => void; }
type RootTab = 'usuarios' | 'senhas' | 'relatorios' | 'logs' | 'sistema';

const NEXT_LAB_ICON = '/next.svg';
const APP_LOGO = '/next-level-v01-2026.svg';

function useBlink(interval = 600) {
  const [v, setV] = useState(true);
  useEffect(() => { const t = setInterval(() => setV(p => !p), interval); return () => clearInterval(t); }, [interval]);
  return v;
}

export default function RootPanel({ onLogout }: RootPanelProps) {
  const [tab, setTab] = useState<RootTab>('usuarios');
  const blink = useBlink();

  // Utilizadores
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [quickAccessIds, setQuickAccessIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('nl_quick_access_users') || '[]'); } catch { return []; }
  });

  // Reset senha
  const [resetEmail, setResetEmail] = useState('');
  const [resetSenha, setResetSenha] = useState('');
  const [resetVerificar, setResetVerificar] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFilter, setLogsFilter] = useState<'todos' | 'erro' | 'acao' | 'login'>('todos');

  // Relatórios
  const [relLoading, setRelLoading] = useState<string | null>(null);
  const [relMsg, setRelMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  // Sistema
  const [sysInfo, setSysInfo] = useState<any>(null);

  useEffect(() => {
    electron?.ipcRenderer.invoke('window:resize', 1080, 720, true);
    loadUsers();
  }, []);

  useEffect(() => {
    if (tab === 'logs') loadLogs();
    if (tab === 'sistema') loadSysInfo();
  }, [tab]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await electron?.ipcRenderer.invoke('root:get-users');
      if (res?.success) setUsers(res.users);
    } finally { setUsersLoading(false); }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await electron?.ipcRenderer.invoke('root:get-logs-tecnicos');
      if (res?.success) setLogs(res.logs);
    } finally { setLogsLoading(false); }
  };

  const loadSysInfo = async () => {
    try {
      const configs = await electron?.ipcRenderer.invoke('get-configuracoes');
      const logsAll = await electron?.ipcRenderer.invoke('get-logs');
      const alunos = await electron?.ipcRenderer.invoke('get-alunos');
      const pagamentos = await electron?.ipcRenderer.invoke('get-pagamentos');
      setSysInfo({ configs, logsCount: logsAll?.length || 0, alunosCount: alunos?.length || 0, pagamentosCount: pagamentos?.length || 0 });
    } catch(e) {}
  };

  const toggleQuickAccess = (userId: number) => {
    setQuickAccessIds(prev => {
      const next = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
      localStorage.setItem('nl_quick_access_users', JSON.stringify(next));
      return next;
    });
  };

  const handleResetSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetSenha) return;
    if (resetSenha !== resetVerificar) { setResetMsg({ ok: false, texto: 'As senhas não coincidem.' }); return; }
    setResetLoading(true); setResetMsg(null);
    try {
      const res = await electron?.ipcRenderer.invoke('root:reset-password', { email: resetEmail, novaSenha: resetSenha });
      setResetMsg({ ok: res.success, texto: res.success ? `✓ Senha de ${resetEmail} redefinida.` : (res.message || 'Erro.') });
      if (res.success) { setResetSenha(''); setResetVerificar(''); }
    } catch (err: any) { setResetMsg({ ok: false, texto: err.message }); }
    finally { setResetLoading(false); }
  };

  const handleExport = async (tipo: string) => {
    setRelLoading(tipo); setRelMsg(null);
    try {
      const res = await electron?.ipcRenderer.invoke('root:export-report', tipo);
      if (res?.success) setRelMsg({ ok: true, texto: `Guardado: ${res.path}` });
      else if (!res?.canceled) setRelMsg({ ok: false, texto: res?.message || 'Erro.' });
    } catch (err: any) { setRelMsg({ ok: false, texto: err.message }); }
    finally { setRelLoading(null); }
  };

  const logsFiltrados = logsFilter === 'todos' ? logs : logs.filter(l => l.tipo === logsFilter);

  const TABS = [
    { id: 'usuarios',   label: 'Utilizadores',    icon: <Users size={13} /> },
    { id: 'senhas',     label: 'Senhas',          icon: <Key size={13} /> },
    { id: 'relatorios', label: 'Relatórios',      icon: <FileBarChart size={13} /> },
    { id: 'logs',       label: 'Logs',            icon: <Activity size={13} /> },
    { id: 'sistema',    label: 'Sistema',         icon: <Database size={13} /> },
  ] as const;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a0a0a', color: '#e5e5e5' }}>

      {/* ══ BARRA SUPERIOR — Estilo Terminal Root GNOME ══ */}
      <header style={{ background: 'linear-gradient(90deg, #7f0000 0%, #b91c1c 40%, #991b1b 100%)', borderBottom: '1px solid #450a0a', boxShadow: '0 2px 20px rgba(185,28,28,0.4)' }}
              className="h-[48px] flex items-center px-5 gap-4 shrink-0">
        {/* Left: NEXT-Lab brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[4px] bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden">
            <img src={NEXT_LAB_ICON} alt="NEXT Lab" className="w-5 h-5 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="leading-none">
            <p className="text-[11px] font-black text-white tracking-[0.15em] uppercase leading-none">NEXT<span className="font-light">Lab</span></p>
            <p className="text-[9px] text-red-200/60 font-medium tracking-widest uppercase mt-0.5">Creative Studio</p>
          </div>
        </div>

        {/* Center: Terminal identity */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <Terminal size={13} className="text-red-200/80" />
          <span className="text-[12px] font-mono font-bold text-white/90 tracking-wider">root@nextlab</span>
          <span className="text-red-300/60 text-[11px] font-mono">:</span>
          <span className="text-[12px] font-mono text-yellow-300/80">~/suporte</span>
          <span className="text-[12px] font-mono text-white/40">$</span>
          <span className="inline-block w-[7px] h-[14px] bg-white/80 ml-0.5" style={{ opacity: blink ? 1 : 0 }} />
        </div>

        {/* Right: Status + Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
            <span className="text-[10px] text-white/70 font-mono tracking-wider">ACESSO TOTAL</span>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-black/30 border border-white/10 hover:bg-red-900/50 hover:border-red-500/40 transition-all text-[11px] font-bold text-white/60 hover:text-white">
            <LogOut size={12} /> Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ══ SIDEBAR ══ */}
        <aside style={{ background: '#111111', borderRight: '1px solid #1f1f1f', width: '200px' }} className="flex flex-col shrink-0">
          <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid #1f1f1f' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-red-500" />
              <p className="text-[11px] font-black text-red-400 uppercase tracking-widest">Root Access</p>
            </div>
            <p className="text-[10px] text-white/25 font-medium leading-snug">Painel exclusivo de suporte técnico. Todas as ações são registadas.</p>
          </div>

          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[4px] text-[12px] font-semibold transition-all text-left"
                style={{
                  background: tab === t.id ? 'rgba(185,28,28,0.15)' : 'transparent',
                  color: tab === t.id ? '#fca5a5' : 'rgba(255,255,255,0.35)',
                  borderLeft: tab === t.id ? '2px solid #b91c1c' : '2px solid transparent',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <div className="px-3 pb-4 pt-2" style={{ borderTop: '1px solid #1f1f1f' }}>
            <div className="text-center">
              <p className="text-[9px] text-white/15 uppercase tracking-widest">NEXT Lab · v1.0</p>
              <p className="text-[9px] text-white/10 mt-0.5">Ivaldino da Luz Fortes</p>
            </div>
          </div>
        </aside>

        {/* ══ CONTEÚDO ══ */}
        <main className="flex-1 overflow-y-auto" style={{ background: '#141414' }}>

          {/* ── TAB: UTILIZADORES ── */}
          {tab === 'usuarios' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[18px] font-black text-white mb-0.5">Utilizadores do Sistema</h2>
                  <p className="text-[12px] text-white/30">Gerir contas, quick access e estado de cada utilizador.</p>
                </div>
                <button onClick={loadUsers} disabled={usersLoading} className="flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-[11px] font-bold transition-all" style={{ background: '#1f1f1f', color: 'rgba(255,255,255,0.5)', border: '1px solid #2a2a2a' }}>
                  <RefreshCw size={12} className={usersLoading ? 'animate-spin' : ''} /> Atualizar
                </button>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-20 text-white/20">
                  <RefreshCw size={20} className="animate-spin mr-2" /> A carregar...
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map(u => {
                    const isQA = quickAccessIds.includes(u.id);
                    const initials = (u.name || '?').slice(0, 2).toUpperCase();
                    const hue = (u.name?.charCodeAt(0) || 0) * 37 % 360;
                    return (
                      <div key={u.id} className="rounded-[6px] p-4 flex items-center gap-4" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-[6px] flex items-center justify-center font-black text-[13px] shrink-0"
                             style={{ background: `hsl(${hue},45%,18%)`, color: `hsl(${hue},60%,70%)`, border: `1px solid hsl(${hue},45%,25%)` }}>
                          {initials}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-bold text-white truncate">{u.name}</p>
                            <span className="px-1.5 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider shrink-0"
                                  style={{ background: u.role === 'admin' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? '#93c5fd' : 'rgba(255,255,255,0.3)', border: `1px solid ${u.role === 'admin' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
                              {u.role === 'admin' ? 'Admin' : 'Operador'}
                            </span>
                            {!u.is_active && <span className="px-1.5 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>Inativo</span>}
                          </div>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{u.email}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Último login: {u.last_login_at ? u.last_login_at.slice(0, 16) : 'Nunca'}</p>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Quick Access toggle */}
                          <button onClick={() => toggleQuickAccess(u.id)}
                            title={isQA ? 'Remover Quick Access' : 'Ativar Quick Access (login sem senha)'}
                            className="flex items-center gap-1.5 h-7 px-2.5 rounded-[4px] text-[10px] font-bold transition-all"
                            style={{ background: isQA ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.04)', color: isQA ? '#fde047' : 'rgba(255,255,255,0.3)', border: `1px solid ${isQA ? 'rgba(234,179,8,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                            <Zap size={10} /> {isQA ? 'Quick ✓' : 'Quick'}
                          </button>
                          {/* Reset senha rápido */}
                          <button onClick={() => { setTab('senhas'); setResetEmail(u.email); }}
                            className="flex items-center gap-1.5 h-7 px-2.5 rounded-[4px] text-[10px] font-bold transition-all"
                            style={{ background: 'rgba(185,28,28,0.12)', color: '#fca5a5', border: '1px solid rgba(185,28,28,0.2)' }}>
                            <Key size={10} /> Reset Senha
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Access info box */}
              {quickAccessIds.length > 0 && (
                <div className="mt-4 p-3 rounded-[5px] flex items-start gap-2" style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)' }}>
                  <Zap size={13} className="mt-0.5 shrink-0" style={{ color: '#fde047' }} />
                  <p className="text-[11px]" style={{ color: 'rgba(253,224,71,0.7)' }}>
                    {quickAccessIds.length} utilizador(es) com Quick Access ativo — podem entrar na tela de login sem palavra-passe.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: SENHAS ── */}
          {tab === 'senhas' && (
            <div className="p-6 max-w-[520px]">
              <h2 className="text-[18px] font-black text-white mb-0.5">Redefinir Senha</h2>
              <p className="text-[12px] mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>Define uma nova senha para qualquer utilizador desta academia.</p>

              {/* Quick select user */}
              {users.length > 0 && (
                <div className="mb-5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Selecionar Utilizador</label>
                  <div className="flex flex-wrap gap-2">
                    {users.map(u => (
                      <button key={u.id} onClick={() => setResetEmail(u.email)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-[11px] font-semibold transition-all"
                        style={{ background: resetEmail === u.email ? 'rgba(185,28,28,0.25)' : 'rgba(255,255,255,0.04)', color: resetEmail === u.email ? '#fca5a5' : 'rgba(255,255,255,0.4)', border: `1px solid ${resetEmail === u.email ? 'rgba(185,28,28,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                        {u.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleResetSenha} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Email</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                      placeholder="utilizador@academia.com"
                      className="w-full h-10 pl-9 pr-3 rounded-[5px] text-[13px] outline-none transition-all"
                      style={{ background: '#1f1f1f', border: '1px solid #2a2a2a', color: '#e5e5e5' }} required />
                  </div>
                </div>
                {/* Nova senha */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Nova Senha</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <input type={mostrarSenha ? 'text' : 'password'} value={resetSenha} onChange={e => setResetSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full h-10 pl-9 pr-10 rounded-[5px] text-[13px] outline-none"
                      style={{ background: '#1f1f1f', border: '1px solid #2a2a2a', color: '#e5e5e5' }} required minLength={6} />
                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {mostrarSenha ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
                {/* Confirmar */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Confirmar Senha</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <input type={mostrarSenha ? 'text' : 'password'} value={resetVerificar} onChange={e => setResetVerificar(e.target.value)}
                      placeholder="Repetir nova senha"
                      className="w-full h-10 pl-9 pr-3 rounded-[5px] text-[13px] outline-none"
                      style={{ background: '#1f1f1f', border: `1px solid ${resetVerificar && resetVerificar !== resetSenha ? '#7f1d1d' : '#2a2a2a'}`, color: '#e5e5e5' }} required />
                  </div>
                </div>

                {resetMsg && (
                  <div className="p-3 rounded-[5px] flex items-start gap-2 text-[12px]"
                       style={{ background: resetMsg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${resetMsg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: resetMsg.ok ? '#6ee7b7' : '#fca5a5' }}>
                    {resetMsg.ok ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" /> : <AlertCircle size={13} className="shrink-0 mt-0.5" />}
                    {resetMsg.texto}
                  </div>
                )}

                <button type="submit" disabled={resetLoading}
                  className="flex items-center gap-2 h-10 px-5 rounded-[5px] font-bold text-[13px] transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#7f0000,#b91c1c)', color: 'white', border: '1px solid rgba(185,28,28,0.5)' }}>
                  {resetLoading ? <RefreshCw size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  {resetLoading ? 'A processar...' : 'Redefinir Senha'}
                </button>
              </form>
            </div>
          )}

          {/* ── TAB: RELATÓRIOS ── */}
          {tab === 'relatorios' && (
            <div className="p-6 max-w-[680px]">
              <h2 className="text-[18px] font-black text-white mb-0.5">Relatórios Técnicos</h2>
              <p className="text-[12px] mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>Exportar dados para diagnóstico e auditoria técnica.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { tipo: 'erros', titulo: 'Erros do Sistema', desc: 'Erros registados com contexto e stack trace.', color: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
                  { tipo: 'uso', titulo: 'Relatório de Uso', desc: 'Estatísticas: alunos, pagamentos, logins, histórico.', color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
                  { tipo: 'configuracoes', titulo: 'Configurações', desc: 'Configs do sistema, licença e dados root.', color: '#a855f7', bg: 'rgba(168,85,247,0.06)' },
                  { tipo: 'completo', titulo: 'Relatório Completo', desc: 'Tudo num único ficheiro Excel.', color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
                ].map(r => (
                  <div key={r.tipo} className="p-5 rounded-[6px] flex flex-col justify-between gap-4" style={{ background: r.bg, border: `1px solid ${r.color}22` }}>
                    <div>
                      <p className="text-[13px] font-bold mb-1" style={{ color: r.color }}>{r.titulo}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{r.desc}</p>
                    </div>
                    <button onClick={() => handleExport(r.tipo)} disabled={!!relLoading}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-[11px] font-bold self-start transition-all disabled:opacity-40"
                      style={{ background: `${r.color}18`, color: r.color, border: `1px solid ${r.color}30` }}>
                      {relLoading === r.tipo ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}
                      Exportar Excel
                    </button>
                  </div>
                ))}
              </div>
              {relMsg && (
                <div className="mt-4 p-3 rounded-[5px] flex items-start gap-2 text-[12px]"
                     style={{ background: relMsg.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${relMsg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: relMsg.ok ? '#6ee7b7' : '#fca5a5' }}>
                  {relMsg.ok ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" /> : <AlertCircle size={13} className="shrink-0 mt-0.5" />}
                  <span className="break-all">{relMsg.texto}</span>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: LOGS ── */}
          {tab === 'logs' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[18px] font-black text-white mb-0.5">Logs Técnicos</h2>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Últimas 300 entradas de atividade, erros e logins.</p>
                </div>
                <button onClick={loadLogs} disabled={logsLoading} className="flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-[11px] font-bold" style={{ background: '#1f1f1f', color: 'rgba(255,255,255,0.4)', border: '1px solid #2a2a2a' }}>
                  <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} /> Atualizar
                </button>
              </div>
              <div className="flex items-center gap-2 mb-4">
                {(['todos', 'erro', 'acao', 'login'] as const).map(f => (
                  <button key={f} onClick={() => setLogsFilter(f)}
                    className="h-7 px-3 rounded-[4px] text-[10px] font-black uppercase tracking-wider transition-all"
                    style={{ background: logsFilter === f ? 'rgba(185,28,28,0.25)' : 'rgba(255,255,255,0.04)', color: logsFilter === f ? '#fca5a5' : 'rgba(255,255,255,0.3)', border: `1px solid ${logsFilter === f ? 'rgba(185,28,28,0.35)' : 'rgba(255,255,255,0.06)'}` }}>
                    {f === 'todos' ? 'Todos' : f === 'erro' ? 'Erros' : f === 'acao' ? 'Ações' : 'Logins'}
                  </button>
                ))}
                <span className="text-[10px] ml-2" style={{ color: 'rgba(255,255,255,0.2)' }}>{logsFiltrados.length} registos</span>
              </div>
              {logsLoading ? (
                <div className="flex items-center justify-center py-16" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <RefreshCw size={18} className="animate-spin mr-2" /> A carregar...
                </div>
              ) : logsFiltrados.length === 0 ? (
                <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  <Activity size={28} className="mx-auto mb-3 opacity-40" />
                  <p className="text-[12px]">Sem logs nesta categoria.</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 font-mono">
                  {logsFiltrados.map((log, i) => (
                    <div key={i} className="p-3 rounded-[4px] flex items-start gap-3"
                         style={{ background: log.tipo === 'erro' ? 'rgba(127,0,0,0.15)' : 'rgba(255,255,255,0.02)', border: `1px solid ${log.tipo === 'erro' ? 'rgba(127,0,0,0.3)' : 'rgba(255,255,255,0.04)'}` }}>
                      <span className="px-1.5 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-widest shrink-0 mt-0.5"
                            style={{ background: log.tipo === 'erro' ? 'rgba(239,68,68,0.2)' : log.tipo === 'login' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)', color: log.tipo === 'erro' ? '#fca5a5' : log.tipo === 'login' ? '#93c5fd' : 'rgba(255,255,255,0.35)', border: `1px solid ${log.tipo === 'erro' ? 'rgba(239,68,68,0.2)' : log.tipo === 'login' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
                        {log.tipo}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{log.mensagem}</p>
                        {log.contexto && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{log.contexto}</p>}
                        {log.stack && <pre className="text-[10px] mt-1.5 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed" style={{ color: 'rgba(252,165,165,0.5)' }}>{log.stack.slice(0, 200)}</pre>}
                      </div>
                      <div className="shrink-0 text-[10px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
                        <Clock size={9} /> {log.data_hora?.slice(0, 16) || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: SISTEMA ── */}
          {tab === 'sistema' && (
            <div className="p-6 max-w-[640px]">
              <h2 className="text-[18px] font-black text-white mb-0.5">Diagnóstico do Sistema</h2>
              <p className="text-[12px] mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>Estado geral da academia instalada neste dispositivo.</p>
              {!sysInfo ? (
                <div className="flex items-center gap-2 py-8" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <RefreshCw size={16} className="animate-spin" /> A carregar diagnóstico...
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Academia', value: sysInfo.configs?.nome_academia || '—', icon: <Shield size={13} /> },
                    { label: 'Email da Academia', value: sysInfo.configs?.email_academia || '—', icon: <Mail size={13} /> },
                    { label: 'Licença', value: sysInfo.configs?.license_key || '—', icon: <Key size={13} /> },
                    { label: 'Tipo de Licença', value: sysInfo.configs?.tipo_licenca || '—', icon: <Zap size={13} /> },
                    { label: 'Expiração', value: sysInfo.configs?.license_expiry || 'Vitalícia', icon: <Clock size={13} /> },
                    { label: 'Total de Alunos', value: sysInfo.alunosCount, icon: <Users size={13} /> },
                    { label: 'Total de Pagamentos', value: sysInfo.pagamentosCount, icon: <Database size={13} /> },
                    { label: 'Entradas no Histórico', value: sysInfo.logsCount, icon: <Activity size={13} /> },
                    { label: 'Setup Completo', value: sysInfo.configs?.setup_completed === '1' ? '✓ Sim' : '✗ Não', icon: <CheckCircle2 size={13} /> },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 p-3 rounded-[5px]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                      <span style={{ color: 'rgba(255,255,255,0.25)' }}>{item.icon}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider w-[180px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.label}</span>
                      <span className="text-[12px] font-mono" style={{ color: '#e5e5e5' }}>{String(item.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
