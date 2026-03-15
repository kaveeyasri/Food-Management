import React from 'react';

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('FoodBridge ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter,sans-serif', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌿</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2D6A4F', marginBottom: '8px' }}>Something went wrong</h1>
          <p style={{ color: '#5a737a', marginBottom: '16px', maxWidth: '480px' }}>
            {this.state.error?.message?.includes('placeholder') || this.state.error?.message?.includes('fetch') ? (
              <>Please set <code style={{ background: '#f0f4f0', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> and <code style={{ background: '#f0f4f0', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code> in <code style={{ background: '#f0f4f0', padding: '2px 6px', borderRadius: '4px' }}>frontend/.env.local</code></>
            ) : this.state.error?.message}
          </p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: '#2D6A4F', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
