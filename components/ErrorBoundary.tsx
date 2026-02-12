
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-900/20 border border-red-800 rounded-lg">
            <h1 className="text-2xl font-bold text-red-400">Something went wrong.</h1>
            <p className="text-red-500 mt-2">An unexpected error occurred. Please try refreshing the page.</p>
            <button
                onClick={() => this.setState({ hasError: false })}
                className="mt-4 px-4 py-2 border text-sm font-semibold rounded-md shadow-sm bg-green-500 text-black font-bold border-green-500 hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-green-400"
            >
                Try again
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
