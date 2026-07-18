import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AccountContextHelper } from '../../src/common/auth/account-context.helper';

export interface E2eTestContext {
  app: INestApplication;
  moduleRef: TestingModule;
  prisma: Record<string, unknown>;
}

export function createMockPrisma(): Record<string, unknown> {
  const target: Record<string, unknown> = {};

  function makeProxy(): Record<string, unknown> {
    return new Proxy(target, {
      get(_t: Record<string, unknown>, prop: string) {
        if (prop === '$transaction') {
          return jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
            cb(makeProxy()),
          );
        }
        if (prop === '$connect') return jest.fn().mockResolvedValue(undefined);
        if (prop === '$disconnect')
          return jest.fn().mockResolvedValue(undefined);
        return new Proxy(
          {},
          {
            get() {
              return jest.fn().mockResolvedValue(null);
            },
          },
        );
      },
    }) as unknown as Record<string, unknown>;
  }

  return makeProxy();
}

export async function createTestApp(
  imports: Parameters<typeof Test.createTestingModule>[0]['imports'] = [],
  providers: Parameters<typeof Test.createTestingModule>[0]['providers'] = [],
): Promise<E2eTestContext> {
  const prisma = createMockPrisma();

  const moduleRef = await Test.createTestingModule({
    imports,
    providers: [
      AccountContextHelper,
      { provide: PrismaService, useValue: prisma },
      ...providers,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'ready', 'metrics'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();

  return { app, moduleRef, prisma };
}

export async function closeTestApp(ctx: E2eTestContext): Promise<void> {
  await ctx.app.close();
  await ctx.moduleRef.close();
}

export function extractToken(response: {
  body: Record<string, unknown>;
}): string | undefined {
  return response.body.accessToken as string | undefined;
}
