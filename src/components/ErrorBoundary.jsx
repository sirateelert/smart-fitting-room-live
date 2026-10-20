import React from "react";

// Keeps one broken panel from blanking the whole screen. "Try again" re-mounts the children.
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[${this.props.label || "panel"}]`, error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="m-6 border border-alert p-6 space-y-4 bg-white text-ink">
        <p className="text-[13px] uppercase tracking-[0.12em] text-alert">Something went wrong</p>
        <p className="text-base">The {this.props.label || "screen"} hit an error. Your other requests are not affected.</p>
        <button
          onClick={() => this.setState({ error: null })}
          className="min-h-[48px] px-5 border border-ink bg-ink text-white text-[13px] uppercase tracking-[0.12em]"
        >
          Try again
        </button>
      </div>
    );
  }
}
