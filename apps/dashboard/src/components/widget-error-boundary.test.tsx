import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { WidgetErrorBoundary } from './widget-error-boundary';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

vi.mock('@/lib/dev-log', () => ({
  devError: vi.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { devError } from '@/lib/dev-log';

function ThrowOnRender({ message }: { message: string }): ReactNode {
  throw new Error(message);
}

describe('WidgetErrorBoundary (F-07)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback UI when child throws', () => {
    const { getByText } = render(
      <WidgetErrorBoundary>
        <ThrowOnRender message="test crash" />
      </WidgetErrorBoundary>,
    );
    expect(getByText('This section is temporarily unavailable.')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const { getByText } = render(
      <WidgetErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowOnRender message="test crash" />
      </WidgetErrorBoundary>,
    );
    expect(getByText('Custom fallback')).toBeTruthy();
  });

  it('captures error to Sentry with component name, message, and stack', () => {
    render(
      <WidgetErrorBoundary name="AnalyticsWidget">
        <ThrowOnRender message="chart failed" />
      </WidgetErrorBoundary>,
    );

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [error, context] = (Sentry.captureException as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('chart failed');
    expect(context.tags.component).toBe('AnalyticsWidget');
    expect(context.extra.errorMessage).toBe('chart failed');
    expect(context.extra.errorStack).toBeDefined();
    expect(context.extra.componentStack).toBeDefined();
  });

  it('logs structured error via devError', () => {
    render(
      <WidgetErrorBoundary name="ScheduleWidget">
        <ThrowOnRender message="calendar crash" />
      </WidgetErrorBoundary>,
    );

    expect(devError).toHaveBeenCalledTimes(1);
    const [logMessage, errorObj] = (devError as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(logMessage).toContain('ScheduleWidget');
    expect(errorObj).toBeInstanceOf(Error);
    expect(errorObj.message).toBe('calendar crash');
  });

  it('uses default name when name prop is not provided', () => {
    render(
      <WidgetErrorBoundary>
        <ThrowOnRender message="no name" />
      </WidgetErrorBoundary>,
    );

    const [, context] = (Sentry.captureException as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(context.tags.component).toBe('WidgetErrorBoundary');
  });

  it('renders children normally when no error occurs', () => {
    const { getByText } = render(
      <WidgetErrorBoundary>
        <div>Healthy content</div>
      </WidgetErrorBoundary>,
    );
    expect(getByText('Healthy content')).toBeTruthy();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
