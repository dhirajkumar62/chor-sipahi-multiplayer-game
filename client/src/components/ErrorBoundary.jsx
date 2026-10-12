import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('CHOR-SIPAHI render error:', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return <main className="shell error-screen"><section className="card auth"><p className="muted">CHOR-SIPAHI</p><h1 className="title">The game screen could not load</h1><p className="error">{this.state.error.message}</p><button onClick={() => window.location.reload()}>Reload game</button></section></main>;
  }
}
