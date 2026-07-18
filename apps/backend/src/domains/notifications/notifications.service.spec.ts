import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../common/prisma/prisma.service';

function makePrisma() {
  return {
    notification: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({
        id: 'n1',
        type: 'INFO',
        title: 'Test',
        message: 'Hello',
        read: false,
        link: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    workspaceMember: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaService;
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = makePrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(NotificationsService);
  });

  it('listForUser returns mapped rows', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'n1',
        type: 'INFO',
        title: 'T',
        message: 'M',
        read: false,
        link: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    const rows = await service.listForUser('u1', { page: 1, limit: 10 });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('n1');
    expect(rows[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('countForUser returns count', async () => {
    (prisma.notification.count as jest.Mock).mockResolvedValue(5);
    const count = await service.countForUser('u1');
    expect(count).toBe(5);
  });

  it('unreadCount returns count with read:false filter', async () => {
    (prisma.notification.count as jest.Mock).mockResolvedValue(3);
    const count = await service.unreadCount('u1');
    expect(count).toBe(3);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'u1', read: false },
    });
  });

  it('markAllRead updates all unread notifications', async () => {
    await service.markAllRead('u1');
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', read: false },
      data: { read: true },
    });
  });

  it('markRead throws NotFound for missing notification', async () => {
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(service.markRead('u1', 'n1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('markRead updates notification when found', async () => {
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue({
      id: 'n1',
    });
    await service.markRead('u1', 'n1');
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { read: true },
    });
  });

  it('createForUser creates and returns notification', async () => {
    const result = await service.createForUser('u1', {
      type: 'INFO',
      title: 'Test',
      message: 'Hello',
    });
    expect(result.id).toBe('n1');
    expect(result.title).toBe('Test');
  });

  it('createForWorkspaceMembers creates for all members', async () => {
    (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'u1' },
      { userId: 'u2' },
    ]);
    await service.createForWorkspaceMembers('ws1', {
      type: 'INFO',
      title: 'T',
      message: 'M',
    });
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'u1', type: 'INFO', title: 'T', message: 'M', link: null },
        { userId: 'u2', type: 'INFO', title: 'T', message: 'M', link: null },
      ],
    });
  });

  it('createForWorkspaceMembers does nothing with no members', async () => {
    (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue([]);
    await service.createForWorkspaceMembers('ws1', {
      type: 'INFO',
      title: 'T',
      message: 'M',
    });
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('getPreferences returns empty object for missing user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const prefs = await service.getPreferences('u1');
    expect(prefs).toEqual({});
  });

  it('getPreferences returns stored preferences', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      notificationPreferences: { email: true, push: false },
    });
    const prefs = await service.getPreferences('u1');
    expect(prefs).toEqual({ email: true, push: false });
  });

  it('updatePreferences updates user record', async () => {
    await service.updatePreferences('u1', { email: false });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { notificationPreferences: { email: false } },
    });
  });
});
