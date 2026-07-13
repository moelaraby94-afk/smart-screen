import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../../common/prisma/prisma.service';

function makePrisma(methodOverrides: Record<string, unknown> = {}) {
  const onboardingProgress = {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({
      id: 'op_1',
      workspaceId: 'ws_1',
      completedSteps: [],
      dismissed: false,
      completedAt: null,
    }),
    update: jest.fn().mockResolvedValue({
      id: 'op_1',
      workspaceId: 'ws_1',
      completedSteps: ['create_screen'],
      dismissed: false,
      completedAt: null,
    }),
    upsert: jest.fn().mockResolvedValue({
      id: 'op_1',
      workspaceId: 'ws_1',
      completedSteps: [],
      dismissed: false,
      completedAt: null,
    }),
    ...methodOverrides,
  };

  return {
    onboardingProgress,
  } as unknown as PrismaService;
}

describe('OnboardingService (T3.3 — Json columns)', () => {
  it('getProgress returns completedSteps as array from Json column', async () => {
    const prisma = makePrisma({
      findUnique: jest.fn().mockResolvedValue({
        id: 'op_1',
        workspaceId: 'ws_1',
        completedSteps: ['create_screen', 'upload_media'],
        dismissed: false,
        completedAt: null,
      }),
    });
    const service = new OnboardingService(prisma);
    const result = await service.getProgress('ws_1');

    expect(result.completedSteps).toEqual(['create_screen', 'upload_media']);
    expect(result.doneCount).toBe(2);
    expect(result.percentage).toBe(40);
  });

  it('completeStep writes native array (not JSON.stringify) to Json column', async () => {
    const updateSpy = jest.fn().mockResolvedValue({
      id: 'op_1',
      workspaceId: 'ws_1',
      completedSteps: ['create_screen'],
      dismissed: false,
      completedAt: null,
    });
    const prisma = makePrisma({
      findUnique: jest.fn().mockResolvedValue({
        id: 'op_1',
        workspaceId: 'ws_1',
        completedSteps: [],
        dismissed: false,
        completedAt: null,
      }),
      update: updateSpy,
    });
    const service = new OnboardingService(prisma);
    await service.completeStep('ws_1', 'create_screen');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const callArg = updateSpy.mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(callArg.data.completedSteps).toEqual(['create_screen']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(typeof callArg.data.completedSteps).not.toBe('string');
  });

  it('reset writes empty array (not "[]") to Json column', async () => {
    const upsertSpy = jest.fn().mockResolvedValue({
      id: 'op_1',
      workspaceId: 'ws_1',
      completedSteps: [],
      dismissed: false,
      completedAt: null,
    });
    const prisma = makePrisma({
      upsert: upsertSpy,
      findUnique: jest.fn().mockResolvedValue({
        id: 'op_1',
        workspaceId: 'ws_1',
        completedSteps: [],
        dismissed: false,
        completedAt: null,
      }),
    });
    const service = new OnboardingService(prisma);
    await service.reset('ws_1');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const callArg = upsertSpy.mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(callArg.update.completedSteps).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(typeof callArg.update.completedSteps).not.toBe('string');
  });
});
