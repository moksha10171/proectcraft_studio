"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e] text-gray-300 p-4">
          <div className="max-w-2xl w-full bg-[#252526] rounded-xl border border-[#333] p-8 shadow-2xl">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-900/20 border-2 border-red-500/50 flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-white text-center mb-3">
              {this.props.fallbackTitle || 'Something Went Wrong'}
            </h1>

            {/* Error Message */}
            <p className="text-gray-400 text-center mb-6">
              {this.props.fallbackMessage || 
                'An unexpected error occurred in the Studio. Don\'t worry, your work might still be saved.'}
            </p>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 bg-[#1e1e1e] rounded-lg border border-[#333] p-4">
                <summary className="cursor-pointer text-sm font-mono text-red-400 hover:text-red-300 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="text-xs font-mono text-gray-500 space-y-2">
                  <div>
                    <strong className="text-gray-400">Error:</strong>
                    <pre className="mt-1 overflow-x-auto">{this.state.error.toString()}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong className="text-gray-400">Component Stack:</strong>
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-[#333] hover:bg-[#444] text-gray-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={18} />
                Reload Page
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-[#333] hover:bg-[#444] text-gray-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Home size={18} />
                Go Home
              </Link>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center mt-6">
              If this problem persists, try clearing your browser cache or using a different browser.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
