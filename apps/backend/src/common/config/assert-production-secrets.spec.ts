import { assertProductionSecretsAreSet } from './assert-production-secrets';

/** 32+ chars, high character variety — what `openssl rand -hex 32` produces. */
const STRONG_ENV = {
  NODE_ENV: 'production',
  JWT_ACCESS_SECRET: '9f3c1a7e5b2d8064af19c7e3d5b0a284',
  JWT_REFRESH_SECRET: 'c47e0b91d6a2f38157be4c09a7d2e6b3',
  ENCRYPTION_KEY: '5a8d2f61c093e7b4d81af6205c937e4b',
} as NodeJS.ProcessEnv;

describe('assertProductionSecretsAreSet', () => {
  it('does nothing outside production', () => {
    expect(() =>
      assertProductionSecretsAreSet({
        NODE_ENV: 'development',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });

  it('does nothing in production when every secret is strong and unique', () => {
    expect(() => assertProductionSecretsAreSet(STRONG_ENV)).not.toThrow();
  });

  it('throws in production when a secret is unset', () => {
    const env = { ...STRONG_ENV, JWT_ACCESS_SECRET: undefined };
    expect(() => assertProductionSecretsAreSet(env)).toThrow(
      /JWT_ACCESS_SECRET is unset/,
    );
  });

  it('throws in production when a secret still equals its dev default', () => {
    const env = {
      ...STRONG_ENV,
      ENCRYPTION_KEY: 'replace-with-strong-encryption-key',
    };
    expect(() => assertProductionSecretsAreSet(env)).toThrow(
      /ENCRYPTION_KEY is a publicly known placeholder/,
    );
  });

  /**
   * Regression: the original blocklist only knew the three `dev-*` fallbacks
   * from the source, so docker-compose.yml's own default sailed straight
   * through and the guard reported a clean production boot on a secret that is
   * committed in a public repository.
   */
  it("rejects docker-compose's 'change-me-in-production' default", () => {
    const env = {
      ...STRONG_ENV,
      JWT_ACCESS_SECRET: 'change-me-in-production',
      JWT_REFRESH_SECRET: 'change-me-in-production',
    };
    expect(() => assertProductionSecretsAreSet(env)).toThrow(
      /JWT_ACCESS_SECRET is a publicly known placeholder/,
    );
  });

  it('rejects a secret that is merely short, even if never seen before', () => {
    const env = { ...STRONG_ENV, JWT_ACCESS_SECRET: 'K7#pQ2vL' };
    expect(() => assertProductionSecretsAreSet(env)).toThrow(
      /JWT_ACCESS_SECRET is shorter than 32 characters \(8\)/,
    );
  });

  it('rejects a long but near-zero-entropy secret', () => {
    const env = { ...STRONG_ENV, JWT_REFRESH_SECRET: 'a'.repeat(64) };
    expect(() => assertProductionSecretsAreSet(env)).toThrow(
      /JWT_REFRESH_SECRET uses fewer than 8 distinct characters/,
    );
  });

  it('rejects reusing one strong secret for both access and refresh', () => {
    const shared = STRONG_ENV.JWT_ACCESS_SECRET;
    const env = { ...STRONG_ENV, JWT_REFRESH_SECRET: shared };
    expect(() => assertProductionSecretsAreSet(env)).toThrow(
      /JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are identical/,
    );
  });

  it('lists every offending var in one error, not just the first', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'dev-access-secret',
      JWT_REFRESH_SECRET: 'dev-refresh-secret',
      ENCRYPTION_KEY: STRONG_ENV.ENCRYPTION_KEY,
    } as NodeJS.ProcessEnv;

    let message = '';
    try {
      assertProductionSecretsAreSet(env);
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toMatch(/JWT_ACCESS_SECRET/);
    expect(message).toMatch(/JWT_REFRESH_SECRET/);
    expect(message).not.toMatch(/ENCRYPTION_KEY/);
  });
});
