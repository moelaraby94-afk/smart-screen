import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { fetchHijriDate } from '@/features/islamic/islamic-api';
import { HijriDateWidget } from './hijri-date-widget';

const messages = {
  hijriDateWidget: {
    title: 'Hijri Date',
    loading: 'Loading Hijri date…',
    notConfigured: 'Set location in Prayer Times settings to see the Hijri date.',
    error: 'Could not load Hijri date.',
    weekdayLabel: 'Day',
  },
};

vi.mock('@/features/workspace/workspace-context', () => ({
  useWorkspace: () => ({ workspaceId: 'ws-1' }),
}));

vi.mock('@/features/islamic/islamic-api', () => ({
  fetchHijriDate: vi.fn(),
}));

function renderWidget() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HijriDateWidget />
    </NextIntlClientProvider>,
  );
}

describe('HijriDateWidget (T4.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Hijri date when data is available', async () => {
    (fetchHijriDate as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        date: '15 Muharram 1447',
        day: '15',
        monthEn: 'Muharram',
        monthAr: 'محرم',
        year: '1447',
        weekdayEn: 'Monday',
        weekdayAr: 'الاثنين',
      }),
    });

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
    });
    expect(screen.getByText('Muharram')).toBeInTheDocument();
    expect(screen.getByText('1447 AH')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
  });

  it('renders error message when fetch fails', async () => {
    (fetchHijriDate as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    renderWidget();

    await waitFor(() => {
      expect(
        screen.getByText('Could not load Hijri date.'),
      ).toBeInTheDocument();
    });
  });

  it('renders not-configured message when data is null', async () => {
    (fetchHijriDate as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => null,
    });

    renderWidget();

    await waitFor(() => {
      expect(
        screen.getByText(
          'Set location in Prayer Times settings to see the Hijri date.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('renders the widget title', async () => {
    (fetchHijriDate as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        date: '1 Ramadan 1447',
        day: '1',
        monthEn: 'Ramadan',
        monthAr: 'رمضان',
        year: '1447',
      }),
    });

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('Hijri Date')).toBeInTheDocument();
    });
  });
});
