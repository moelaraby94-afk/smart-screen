import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AppToaster } from './app-toaster';

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

const messages = {
  notifications: {
    bellLabel: 'Notifications',
    unread: 'unread',
  },
};

describe('AppToaster', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AppToaster />
      </NextIntlClientProvider>,
    );
    expect(container).toBeTruthy();
  });
});
