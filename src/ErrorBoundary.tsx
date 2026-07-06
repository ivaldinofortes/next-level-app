import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro de interface capturado:', error, info);
    (window as unknown as { electron?: { ipcRenderer?: { invoke?: (channel: string, payload: unknown) => void } } }).electron?.ipcRenderer?.invoke?.('root:log-error', {
      contexto: 'react-error-boundary',
      mensagem: error.message,
      stack: `${error.stack || ''}\n${info.componentStack || ''}`,
    });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: '#f6f8fb',
        color: '#172033',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <section style={{
          width: 'min(520px, 100%)',
          border: '1px solid #dde5f0',
          borderRadius: 8,
          background: '#ffffff',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
          overflow: 'hidden',
        }}>
          <header style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            padding: '0 18px',
            borderBottom: '1px solid #e6ecf4',
            background: '#f1f4f9',
          }}>
            <strong style={{ fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase' }}>Next Level Academia</strong>
          </header>
          <div style={{ padding: 22 }}>
            <h1 style={{ margin: 0, fontSize: 20, lineHeight: 1.2 }}>A interface encontrou um erro</h1>
            <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.55 }}>
              O sistema continua protegido. Recarregue a aplicação para voltar ao ponto anterior.
            </p>
            <pre style={{
              margin: '16px 0 0',
              padding: 12,
              borderRadius: 6,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#475569',
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              maxHeight: 120,
              overflow: 'auto',
            }}>{this.state.error.message}</pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: 18,
                height: 40,
                padding: '0 18px',
                border: 0,
                borderRadius: 6,
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Recarregar aplicação
            </button>
          </div>
        </section>
      </main>
    );
  }
}
