'use client';

/**
 * ErrorBoundary — catches unexpected React render errors and shows a
 * crash screen with error reporting + reload button.
 *
 * Mirrors Th3-Anime's "crash screen with error reporting" feature.
 */

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCw, Copy, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({ errorInfo });
    // Log to console for debugging
    console.error('[Yugen] Crash:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const text = `Yugen Crash Report\n================\n\nError: ${error?.message}\n\nStack:\n${error?.stack}\n\nComponent Stack:\n${errorInfo?.componentStack}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: '#080808' }}
        >
          <div className="max-w-md text-center">
            {/* Crash icon */}
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: 'rgba(255, 0, 0, 0.1)' }}
            >
              <Bug className="h-10 w-10 text-red-500" />
            </div>

            {/* Yugen logo */}
            <img
              src="/logo.svg"
              alt="Yugen"
              className="mx-auto mb-4 h-12 w-12"
              style={{ filter: 'drop-shadow(0 0 8px rgba(181, 168, 255, 0.5))' }}
            />

            <h1 className="mb-2 text-xl font-bold text-[var(--foreground)]">
              Yugen crashed unexpectedly
            </h1>
            <p className="mb-5 text-sm text-[var(--muted-foreground)]">
              We&apos;re sorry — something went wrong. Your library and progress are safe.
              Try reloading, and if the problem persists, please report the error.
            </p>

            {/* Error details (collapsible) */}
            <details className="mb-5 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-left">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                <AlertTriangle className="mr-1 inline h-3 w-3" />
                Error details
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto text-[0.7rem] text-[var(--muted-foreground)]">
                {this.state.error?.message}
                {'\n\n'}
                {this.state.error?.stack}
              </pre>
            </details>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-[var(--primary-foreground)] transition-transform active:scale-95"
              >
                <RotateCw className="h-4 w-4" />
                Reload Yugen
              </button>
              <button
                onClick={this.handleCopyError}
                className="flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-5 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
              >
                <Copy className="h-4 w-4" />
                Copy error report
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
