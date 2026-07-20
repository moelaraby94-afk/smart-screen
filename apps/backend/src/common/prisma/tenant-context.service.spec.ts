import { requestContext } from '../request-context/request-context';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    service = new TenantContextService();
  });

  it('sets workspaceId in AsyncLocalStorage within run()', async () => {
    let capturedWorkspaceId: string | undefined;

    await service.run('ws_123', async () => {
      capturedWorkspaceId = service.getCurrentWorkspaceId();
    });

    expect(capturedWorkspaceId).toBe('ws_123');
  });

  it('clears workspaceId after run() completes', async () => {
    await service.run('ws_123', async () => {
      expect(service.getCurrentWorkspaceId()).toBe('ws_123');
    });

    expect(service.getCurrentWorkspaceId()).toBeUndefined();
  });

  it('returns the result of the wrapped function', async () => {
    const result = await service.run('ws_123', async () => {
      return 'success';
    });

    expect(result).toBe('success');
  });

  it('bypass() sets bypassTenantIsolation flag', async () => {
    let capturedBypass: boolean | undefined;

    await service.bypass(async () => {
      capturedBypass = service.isBypassed();
    });

    expect(capturedBypass).toBe(true);
  });

  it('bypass() clears after completion', async () => {
    await service.bypass(async () => {
      expect(service.isBypassed()).toBe(true);
    });

    expect(service.isBypassed()).toBe(false);
  });

  it('isBypassed() returns false outside any context', () => {
    expect(service.isBypassed()).toBe(false);
  });

  it('getCurrentWorkspaceId() returns undefined outside any context', () => {
    expect(service.getCurrentWorkspaceId()).toBeUndefined();
  });

  it('preserves requestId from existing context', async () => {
    await requestContext.run({ requestId: 'req_abc' }, async () => {
      await service.run('ws_456', async () => {
        const store = requestContext.getStore();
        expect(store?.requestId).toBe('req_abc');
        expect(store?.workspaceId).toBe('ws_456');
      });
    });
  });

  it('nested run() overwrites workspaceId', async () => {
    await service.run('ws_outer', async () => {
      expect(service.getCurrentWorkspaceId()).toBe('ws_outer');

      await service.run('ws_inner', async () => {
        expect(service.getCurrentWorkspaceId()).toBe('ws_inner');
      });

      expect(service.getCurrentWorkspaceId()).toBe('ws_outer');
    });
  });
});
