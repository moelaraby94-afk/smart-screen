'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { devError } from '@/lib/dev-log';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional name for the widget section — included in logs for identification. */
  name?: string;
};

type State = {
  hasError: boolean;
};

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const componentName = this.props.name ?? 'WidgetErrorBoundary';
    devError(`[${componentName}] render error:`, error, errorInfo);
    Sentry.captureException(error, {
      tags: { component: componentName },
      extra: {
        componentStack: errorInfo.componentStack,
        errorMessage: error.message,
        errorStack: error.stack,
      },
    });
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">This section is temporarily unavailable.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
