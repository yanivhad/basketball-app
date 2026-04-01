import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white px-4">
        <div className="text-6xl mb-4">😬</div>
        <h1 className="text-2xl font-bold mb-2">Something broke</h1>
        <p className="text-gray-400 mb-6 text-center">Don't worry, it happens to the best of us. Try refreshing!</p>
        <button onClick={() => window.location.reload()}
          className="bg-brand-orange hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition">
          Refresh 🔄
        </button>
      </div>
    );
    return this.props.children;
  }
}