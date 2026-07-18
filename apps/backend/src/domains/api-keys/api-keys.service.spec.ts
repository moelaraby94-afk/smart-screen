import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../../common/prisma/prisma.service';

function makePrisma() {
  return {
    apiKey: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: 'k1',
        name: 'Test Key',
        keyPrefix: 'cs_live_abcd',
        scopes: 'read',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      }),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaService;
}

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = makePrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [ApiKeysService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ApiKeysService);
  });

  it('list returns mapped keys', async () => {
    (prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'k1',
        name: 'Test',
        keyPrefix: 'cs_live_abcd',
        scopes: 'read',
        lastUsedAt: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    const keys = await service.list('ws1');
    expect(keys).toHaveLength(1);
    expect(keys[0].id).toBe('k1');
    expect(keys[0].lastUsedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('list returns null lastUsedAt for never-used keys', async () => {
    (prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'k1',
        name: 'Test',
        keyPrefix: 'cs_live_abcd',
        scopes: 'read',
        lastUsedAt: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    const keys = await service.list('ws1');
    expect(keys[0].lastUsedAt).toBeNull();
  });

  it('create throws BadRequest for empty name', async () => {
    await expect(service.create('ws1', '', 'read')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('create throws BadRequest for whitespace name', async () => {
    await expect(service.create('ws1', '  ', 'read')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('create returns key with rawKey', async () => {
    const result = await service.create('ws1', 'My Key', 'read write');
    expect(result.id).toBe('k1');
    expect(result.name).toBe('Test Key');
    expect(result.rawKey).toMatch(/^cs_live_/);
  });

  it('revoke throws NotFound for missing key', async () => {
    (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(service.revoke('ws1', 'k1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('revoke throws BadRequest for already revoked key', async () => {
    (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue({
      id: 'k1',
      revokedAt: new Date('2026-01-01'),
    });
    await expect(service.revoke('ws1', 'k1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('revoke sets revokedAt and returns success', async () => {
    (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue({
      id: 'k1',
      revokedAt: null,
    });
    const result = await service.revoke('ws1', 'k1');
    expect(result.revoked).toBe(true);
    expect(prisma.apiKey.update).toHaveBeenCalledWith({
      where: { id: 'k1' },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
