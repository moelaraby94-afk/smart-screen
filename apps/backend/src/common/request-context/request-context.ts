import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
  requestId: string;
}

/**
 * AsyncLocalStorage instance shared across the entire process.
 * The middleware wraps each request in `.run()` so any async code
 * path that executes within the request can retrieve the requestId
 * via `requestContext.getStore()`.
 */
export const requestContext = new AsyncLocalStorage<RequestContextData>();
