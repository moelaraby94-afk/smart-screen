import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { InfoTooltip } from './info-tooltip';

const messages = {
  test: {},
};

describe('InfoTooltip', () => {
  it('renders a button with aria-label and aria-expanded', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <InfoTooltip content="Helpful info" />
      </NextIntlClientProvider>,
    );
    const btn = screen.getByRole('button', { name: /info/i });
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.getAttribute('aria-label')).toBe('Info');
  });

  it('does not render tooltip content when closed', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <InfoTooltip content="Helpful info" />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
