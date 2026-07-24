import { requestContext } from '../request-context/request-context';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    service = new TenantContextService();
  });

  it('sets workspaceId in AsyncLocalStorage within run()', async () => {
    let capturedWorkspaceId: string | undefined;

    await service.run('ws_123', () => {
      capturedWorkspaceId = service.getCurrentWorkspaceId();
      return Promise.resolve();
    });

    expect(capturedWorkspaceId).toBe('ws_123');
  });

  it('clears workspaceId after run() completes', async () => {
    await service.run('ws_123', () => {
      expect(service.getCurrentWorkspaceId()).toBe('ws_123');
      return Promise.resolve();
    });

    expect(service.getCurrentWorkspaceId()).toBeUndefined();
  });

  it('returns the result of the wrapped function', async () => {
    const result = await service.run('ws_123', () => {
      return Promise.resolve('success');
    });

    expect(result).toBe('success');
  });

  it('bypass() sets bypassTenantIsolation flag', async () => {
    let capturedBypass: boolean | undefined;

    await service.bypass(() => {
      capturedBypass = service.isBypassed();
      return Promise.resolve();
    });

    expect(capturedBypass).toBe(true);
  });

  it('bypass() clears after completion', async () => {
    await service.bypass(() => {
      expect(service.isBypassed()).toBe(true);
      return Promise.resolve();
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
    await requestContext.run({ requestId: 'req_abc' }, () => {
      return service.run('ws_456', () => {
        const store = requestContext.getStore();
        expect(store?.requestId).toBe('req_abc');
        expect(store?.workspaceId).toBe('ws_456');
        return Promise.resolve();
      });
    });
  });

  it('nested run() overwrites workspaceId', async () => {
    await service.run('ws_outer', () => {
      expect(service.getCurrentWorkspaceId()).toBe('ws_outer');

      return service
        .run('ws_inner', () => {
          expect(service.getCurrentWorkspaceId()).toBe('ws_inner');
          return Promise.resolve();
        })
        .then(() => {
          expect(service.getCurrentWorkspaceId()).toBe('ws_outer');
          return Promise.resolve();
        });
    });
  });
});
