import { createRoot } from 'react-dom/client';
import React, { Component, type ReactNode } from 'react';
import { App } from './App';

// Default theme before React/CSS hydrate (avoids white-on-white flash)
document.documentElement.setAttribute('data-theme', 'dark');

class PopupErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, fontFamily: 'sans-serif', color: '#111', background: '#fff' }}>
          <h2 style={{ margin: '0 0 8px' }}>MonkeyMask failed to load</h2>
          <p style={{ margin: 0, fontSize: 13 }}>{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <PopupErrorBoundary>
    <App />
  </PopupErrorBoundary>,
);
