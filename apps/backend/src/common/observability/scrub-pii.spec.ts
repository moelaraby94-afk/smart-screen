import { scrubPII, scrubSentryEvent } from './scrub-pii';

describe('scrubPII', () => {
  it('redacts known PII fields at the top level', () => {
    const input = {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
      token: 'abc-456',
    };

    const result = scrubPII(input) as Record<string, unknown>;

    expect(result.name).toBe('Alice');
    expect(result.email).toBe('[Redacted]');
    expect(result.password).toBe('[Redacted]');
    expect(result.token).toBe('[Redacted]');
  });

  it('redacts PII fields case-insensitively', () => {
    const input = { Email: 'test@test.com', PASSWORD: 'pass' };

    const result = scrubPII(input) as Record<string, unknown>;

    expect(result.Email).toBe('[Redacted]');
    expect(result.PASSWORD).toBe('[Redacted]');
  });

  it('redacts PII fields nested inside objects', () => {
    const input = {
      user: { name: 'Bob', email: 'bob@example.com', secret: 'xyz' },
      meta: { requestId: 'r-1' },
    };

    const result = scrubPII(input) as Record<string, unknown>;
    const user = result.user as Record<string, unknown>;
    const meta = result.meta as Record<string, unknown>;

    expect(user.name).toBe('Bob');
    expect(user.email).toBe('[Redacted]');
    expect(user.secret).toBe('[Redacted]');
    expect(meta.requestId).toBe('r-1');
  });

  it('redacts PII fields inside arrays', () => {
    const input = {
      users: [
        { name: 'A', email: 'a@a.com' },
        { name: 'B', email: 'b@b.com' },
      ],
    };

    const result = scrubPII(input) as Record<string, unknown>;
    const users = result.users as Array<Record<string, unknown>>;

    expect(users[0].name).toBe('A');
    expect(users[0].email).toBe('[Redacted]');
    expect(users[1].name).toBe('B');
    expect(users[1].email).toBe('[Redacted]');
  });

  it('passes through primitives unchanged', () => {
    expect(scrubPII('hello')).toBe('hello');
    expect(scrubPII(42)).toBe(42);
    expect(scrubPII(null)).toBe(null);
    expect(scrubPII(undefined)).toBe(undefined);
  });

  it('does not mutate the original object', () => {
    const input = { email: 'keep@original.com', name: 'Test' };

    scrubPII(input);

    expect(input.email).toBe('keep@original.com');
  });

  it('stops recursion at depth 5 to prevent stack overflow', () => {
    let nested: Record<string, unknown> = { email: 'deep@example.com' };
    for (let i = 0; i < 10; i++) {
      nested = { child: nested };
    }

    const result = scrubPII(nested) as Record<string, unknown>;
    // Walk down to find the email at the bottom
    let current: Record<string, unknown> = result;
    for (let i = 0; i < 10; i++) {
      current = current.child as Record<string, unknown>;
    }

    // At depth > 5, scrubbing stopped so the email was NOT redacted
    expect(current.email).toBe('deep@example.com');
  });
});

describe('scrubSentryEvent', () => {
  it('scrubs request.headers by key name', () => {
    const event = {
      request: {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9',
          'content-type': 'application/json',
        },
      },
    };

    const result = scrubSentryEvent(event);
    expect(result.request.headers.authorization).toBe('[Redacted]');
    expect(result.request.headers['content-type']).toBe('application/json');
  });

  it('clears request.cookies entirely', () => {
    const event = {
      request: { cookies: { session: 'abc123', csrf: 'xyz' } },
    };

    const result = scrubSentryEvent(event);
    expect(result.request.cookies).toBeUndefined();
  });

  it('scrubs request.data by key name', () => {
    const event = {
      request: { data: { email: 'alice@example.com', name: 'Alice' } },
    };

    const result = scrubSentryEvent(event);
    expect(result.request.data).toEqual({
      email: '[Redacted]',
      name: 'Alice',
    });
  });

  it('scrubs request.json by key name', () => {
    const event = {
      request: { json: { password: 'secret', data: 'ok' } },
    };

    const result = scrubSentryEvent(event);
    expect(result.request.json).toEqual({
      password: '[Redacted]',
      data: 'ok',
    });
  });

  it('redacts emails from request.url string', () => {
    const event = {
      request: { url: 'https://app.example.com/users?email=bob@test.com' },
    };

    const result = scrubSentryEvent(event);
    expect(result.request.url).toBe(
      'https://app.example.com/users?email=[Redacted]',
    );
  });

  it('redacts tokens from request.url string', () => {
    const event = {
      request: { url: 'https://app.example.com/api?token=abc123def' },
    };

    const result = scrubSentryEvent(event);
    expect(result.request.url).toContain('[Redacted]');
    expect(result.request.url).not.toContain('abc123def');
  });

  it('scrubs request.query_string deeply', () => {
    const event = {
      request: { query_string: { filter: { email: 'admin@corp.com' } } },
    };

    const result = scrubSentryEvent(event);
    const qs = result.request.query_string as Record<string, unknown>;
    const filter = qs.filter as Record<string, unknown>;
    expect(filter.email).toBe('[Redacted]');
  });

  it('scrubs extra by key name', () => {
    const event = {
      extra: { email: 'leaked@test.com', requestId: 'r-1' },
    };

    const result = scrubSentryEvent(event);
    expect(result.extra).toEqual({ email: '[Redacted]', requestId: 'r-1' });
  });

  it('scrubs tags by key name', () => {
    const event = {
      tags: { email: 'tagged@test.com', route: '/api/users' },
    };

    const result = scrubSentryEvent(event);
    const tags = result.tags as Record<string, unknown>;
    expect(tags.email).toBe('[Redacted]');
    expect(tags.route).toBe('/api/users');
  });

  it('scrubs contexts by key name', () => {
    const event = {
      contexts: { auth: { token: 'secret-xyz', user: 'admin' } },
    };

    const result = scrubSentryEvent(event);
    const ctx = result.contexts as Record<string, unknown>;
    const auth = ctx.auth as Record<string, unknown>;
    expect(auth.token).toBe('[Redacted]');
    expect(auth.user).toBe('admin');
  });

  it('redacts user.email and user.ip_address', () => {
    const event = {
      user: { email: 'user@test.com', ip_address: '192.168.1.1', id: 'u-1' },
    };

    const result = scrubSentryEvent(event);
    expect(result.user.email).toBe('[Redacted]');
    expect(result.user.ip_address).toBe('[Redacted]');
    expect(result.user.id).toBe('u-1');
  });

  it('scrubs breadcrumb messages for email patterns', () => {
    const event = {
      breadcrumbs: [
        { message: 'Login attempt for alice@example.com', data: {} },
        { message: 'Request completed', data: { status: 200 } },
      ],
    };

    const result = scrubSentryEvent(event);
    expect(result.breadcrumbs[0].message).not.toContain('alice@example.com');
    expect(result.breadcrumbs[0].message).toContain('[Redacted]');
    expect(result.breadcrumbs[1].message).toBe('Request completed');
  });

  it('scrubs breadcrumb data by key name', () => {
    const event = {
      breadcrumbs: [
        { message: 'ok', data: { email: 'bob@bob.com', path: '/home' } },
      ],
    };

    const result = scrubSentryEvent(event);
    expect(result.breadcrumbs[0].data).toEqual({
      email: '[Redacted]',
      path: '/home',
    });
  });

  it('redacts emails from exception values', () => {
    const event = {
      exception: {
        values: [
          { value: 'User not found: alice@example.com' },
          { value: 'Database connection failed' },
        ],
      },
    };

    const result = scrubSentryEvent(event);
    expect(result.exception.values[0].value).not.toContain('alice@example.com');
    expect(result.exception.values[0].value).toContain('[Redacted]');
    expect(result.exception.values[1].value).toBe('Database connection failed');
  });

  it('redacts bearer tokens from exception values', () => {
    const event = {
      exception: {
        values: [
          { value: 'Auth failed for Bearer eyJhbGciOiJIUzI1NiJ9.token' },
        ],
      },
    };

    const result = scrubSentryEvent(event);
    expect(result.exception.values[0].value).not.toContain(
      'eyJhbGciOiJIUzI1NiJ9',
    );
  });

  it('redacts emails from top-level message', () => {
    const event = {
      message: 'Failed to process user bob@company.com request',
    };

    const result = scrubSentryEvent(event);
    expect(result.message).not.toContain('bob@company.com');
    expect(result.message).toContain('[Redacted]');
  });

  it('handles events with no PII-carrying fields without crashing', () => {
    const event = { event_id: 'abc123', level: 'error' as const };

    const result = scrubSentryEvent(event);
    expect(result).toEqual({ event_id: 'abc123', level: 'error' });
  });

  it('handles null/non-object events without crashing', () => {
    expect(scrubSentryEvent(null)).toBeNull();
    expect(scrubSentryEvent(undefined)).toBeUndefined();
    expect(scrubSentryEvent('string')).toBe('string');
  });

  it('preserves non-PII data in a complex event', () => {
    const event = {
      event_id: 'evt-1',
      level: 'error' as const,
      request: {
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer xyz',
        },
        url: 'https://app.example.com/api/users',
        data: { userId: 'u-1', email: 'alice@test.com' },
      },
      extra: { requestId: 'r-1', password: 'secret' },
      user: { id: 'u-1', email: 'alice@test.com', ip_address: '1.2.3.4' },
      breadcrumbs: [{ message: 'GET /api/users', data: { status: 500 } }],
      exception: {
        values: [{ value: 'TypeError: cannot read property of undefined' }],
      },
      message: 'Something went wrong',
    };

    const result = scrubSentryEvent(event);

    // Non-PII preserved
    expect(result.event_id).toBe('evt-1');
    expect(result.level).toBe('error');
    expect(result.request.headers['content-type']).toBe('application/json');
    expect(result.request.url).toBe('https://app.example.com/api/users');
    expect(result.extra.requestId).toBe('r-1');
    expect(result.user.id).toBe('u-1');
    expect(result.breadcrumbs[0].message).toBe('GET /api/users');
    expect(result.breadcrumbs[0].data).toEqual({ status: 500 });
    expect(result.exception.values[0].value).toBe(
      'TypeError: cannot read property of undefined',
    );
    expect(result.message).toBe('Something went wrong');

    // PII redacted
    expect(result.request.headers.authorization).toBe('[Redacted]');
    expect(result.request.data).toEqual({
      userId: 'u-1',
      email: '[Redacted]',
    });
    expect(result.extra.password).toBe('[Redacted]');
    expect(result.user.email).toBe('[Redacted]');
    expect(result.user.ip_address).toBe('[Redacted]');
  });

  // ── Regression: PII in string values under non-PII keys ──

  it('redacts emails in extra string values under non-PII keys', () => {
    const event = {
      extra: { description: 'Email sent to alice@test.com', requestId: 'r-1' },
    };

    const result = scrubSentryEvent(event);
    expect(result.extra.description).not.toContain('alice@test.com');
    expect(result.extra.description).toContain('[Redacted]');
    expect(result.extra.requestId).toBe('r-1');
  });

  it('redacts tokens in extra string values under non-PII keys', () => {
    const event = {
      extra: { detail: 'Request used Bearer eyJhbGciOiJIUzI1NiJ9' },
    };

    const result = scrubSentryEvent(event);
    expect(result.extra.detail).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(result.extra.detail).toContain('[Redacted]');
  });

  it('redacts emails in contexts string values under non-PII keys', () => {
    const event = {
      contexts: {
        runtime: { note: 'User admin@corp.com triggered alert' },
      },
    };

    const result = scrubSentryEvent(event);
    const ctx = result.contexts as Record<string, unknown>;
    const runtime = ctx.runtime as Record<string, unknown>;
    expect(runtime.note).not.toContain('admin@corp.com');
    expect(runtime.note).toContain('[Redacted]');
  });

  it('redacts emails in breadcrumbs data string values under non-PII keys', () => {
    const event = {
      breadcrumbs: [
        {
          message: 'ok',
          data: { path: '/users', detail: 'Created alice@test.com' },
        },
      ],
    };

    const result = scrubSentryEvent(event);
    expect(result.breadcrumbs[0].data.detail).not.toContain('alice@test.com');
    expect(result.breadcrumbs[0].data.detail).toContain('[Redacted]');
    expect(result.breadcrumbs[0].data.path).toBe('/users');
  });

  it('redacts emails in request.data string values under non-PII keys', () => {
    const event = {
      request: {
        data: { feedback: 'My email is bob@test.com', userId: 'u-1' },
      },
    };

    const result = scrubSentryEvent(event);
    expect(result.request.data.feedback).not.toContain('bob@test.com');
    expect(result.request.data.feedback).toContain('[Redacted]');
    expect(result.request.data.userId).toBe('u-1');
  });

  it('redacts emails in request.json string values under non-PII keys', () => {
    const event = {
      request: { json: { note: 'Contact: carol@test.com', ok: true } },
    };

    const result = scrubSentryEvent(event);
    expect(result.request.json.note).not.toContain('carol@test.com');
    expect(result.request.json.note).toContain('[Redacted]');
    expect(result.request.json.ok).toBe(true);
  });

  it('still redacts PII by key name in extra (no regression)', () => {
    const event = {
      extra: { email: 'leaked@test.com', description: 'ok' },
    };

    const result = scrubSentryEvent(event);
    expect(result.extra.email).toBe('[Redacted]');
    expect(result.extra.description).toBe('ok');
  });

  it('still redacts PII by key name in contexts (no regression)', () => {
    const event = {
      contexts: { auth: { token: 'secret-xyz', user: 'admin' } },
    };

    const result = scrubSentryEvent(event);
    const ctx = result.contexts as Record<string, unknown>;
    const auth = ctx.auth as Record<string, unknown>;
    expect(auth.token).toBe('[Redacted]');
    expect(auth.user).toBe('admin');
  });

  it('still redacts PII by key name in breadcrumbs data (no regression)', () => {
    const event = {
      breadcrumbs: [
        { message: 'ok', data: { email: 'bob@bob.com', path: '/home' } },
      ],
    };

    const result = scrubSentryEvent(event);
    expect(result.breadcrumbs[0].data.email).toBe('[Redacted]');
    expect(result.breadcrumbs[0].data.path).toBe('/home');
  });

  it('preserves non-PII string values in extra (no false positives)', () => {
    const event = {
      extra: { route: '/api/users', method: 'GET', count: 42 },
    };

    const result = scrubSentryEvent(event);
    expect(result.extra).toEqual({
      route: '/api/users',
      method: 'GET',
      count: 42,
    });
  });

  it('preserves non-PII string values in contexts (no false positives)', () => {
    const event = {
      contexts: { device: { model: 'iPhone 12', os: 'iOS 17' } },
    };

    const result = scrubSentryEvent(event);
    const ctx = result.contexts as Record<string, unknown>;
    const device = ctx.device as Record<string, unknown>;
    expect(device.model).toBe('iPhone 12');
    expect(device.os).toBe('iOS 17');
  });
});
