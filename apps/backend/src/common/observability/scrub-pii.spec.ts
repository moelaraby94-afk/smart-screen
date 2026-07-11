import { scrubPII } from './scrub-pii';

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
