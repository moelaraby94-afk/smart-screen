import { BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    webhookEndpoint: {
      create: jest.fn().mockResolvedValue({
        id: 'wh_1',
        url: 'https://example.com/hook',
        events: 'screen.online',
        secret: 'whsec_test',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    ...overrides,
  } as unknown as PrismaService;
}

describe('WebhooksService SSRF guard', () => {
  const privateUrls = [
    'http://127.0.0.1/hook',
    'http://127.0.0.1:8080/hook',
    'http://localhost/hook',
    'http://localhost:3000/hook',
    'http://169.254.169.254/hook',
    'http://10.0.0.1/hook',
    'http://10.255.255.255/hook',
    'http://172.16.0.1/hook',
    'http://172.31.255.255/hook',
    'http://192.168.0.1/hook',
    'http://192.168.1.100/hook',
    'http://[::1]/hook',
    'http://[::ffff:127.0.0.1]/hook', // IPv4-mapped IPv6 loopback
  ];

  for (const url of privateUrls) {
    it(`create() rejects private/local URL: ${url}`, async () => {
      const service = new WebhooksService(makePrisma());
      await expect(
        service.create('ws_1', url, 'screen.online'),
      ).rejects.toThrow(DomainException);
    });
  }

  it('create() rejects non-http(s) protocols', async () => {
    const service = new WebhooksService(makePrisma());
    await expect(
      service.create('ws_1', 'file:///etc/passwd', 'screen.online'),
    ).rejects.toThrow(BadRequestException);
  });

  it('create() accepts a public HTTPS URL', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'wh_1',
      url: 'https://example.com/hook',
      events: 'screen.online',
      secret: 'whsec_test',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const prisma = {
      webhookEndpoint: {
        create,
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    } as unknown as PrismaService;
    const service = new WebhooksService(prisma);
    const result = await service.create(
      'ws_1',
      'https://example.com/hook',
      'screen.online',
    );
    expect(result.id).toBe('wh_1');
    expect(create).toHaveBeenCalled();
  });

  it('test() rejects a stored private URL before fetching', async () => {
    const prisma = makePrisma({
      webhookEndpoint: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'wh_1',
          url: 'http://127.0.0.1/hook',
          secret: 'whsec_test',
          enabled: true,
          deletedAt: null,
        }),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    });
    const service = new WebhooksService(prisma);
    await expect(service.test('ws_1', 'wh_1')).rejects.toThrow(DomainException);
  });

  it('test() does not follow a redirect to an internal target', async () => {
    const prisma = makePrisma({
      webhookEndpoint: {
        // Public host passes assertSafeUrl; the redirect is the attack.
        findFirst: jest.fn().mockResolvedValue({
          id: 'wh_1',
          url: 'https://example.com/hook',
          secret: 'whsec_test',
          enabled: true,
          deletedAt: null,
        }),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    });
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      type: 'opaqueredirect',
      status: 0,
      ok: false,
    }) as unknown as typeof fetch;
    try {
      const service = new WebhooksService(prisma);
      const res = await service.test('ws_1', 'wh_1');
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/redirect/i);
      // Ensure we asked fetch not to follow redirects.
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/hook',
        expect.objectContaining({ redirect: 'manual' }),
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('SSRF errors carry the SSRF_BLOCKED code', async () => {
    const service = new WebhooksService(makePrisma());
    try {
      await service.create('ws_1', 'http://10.0.0.1/hook', 'screen.online');
      fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(DomainException);
      expect((e as DomainException).code).toBe(ErrorCode.SSRF_BLOCKED);
    }
  });
});
