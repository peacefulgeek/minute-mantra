import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);

    // If it's a chunk loading failure (lazy import), auto-reload once
    if (
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError'
    ) {
      // Only auto-reload once per session to avoid infinite loops
      const lastReload = sessionStorage.getItem('chunk-reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem('chunk-reload', now.toString());
        window.location.reload();
        return;
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: 24,
            textAlign: 'center',
            background: '#fdf8f0',
          }}
        >
          <img src="/logo-transparent.png" alt="" style={{ width: 56, height: 56, marginBottom: 16, opacity: 0.7 }} />
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: '#5a3e28', marginBottom: 8 }}>
            Something went wrong
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9a8c7e', marginBottom: 20, maxWidth: 280 }}>
            The page didn't load properly. Tap below to try again.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '10px 28px',
              borderRadius: 20,
              border: 'none',
              background: 'linear-gradient(135deg, #b8860b, #d4a017)',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
