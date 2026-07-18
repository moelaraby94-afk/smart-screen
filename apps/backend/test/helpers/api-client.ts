import type { Server } from 'node:http';
import request from 'supertest';

export class ApiClient {
  constructor(private readonly server: Server) {}

  private authHeader(token?: string): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  get(path: string, token?: string) {
    return request(this.server).get(path).set(this.authHeader(token));
  }

  post(path: string, body?: unknown, token?: string) {
    return request(this.server)
      .post(path)
      .set(this.authHeader(token))
      .send(body as object);
  }

  patch(path: string, body?: unknown, token?: string) {
    return request(this.server)
      .patch(path)
      .set(this.authHeader(token))
      .send(body as object);
  }

  delete(path: string, token?: string) {
    return request(this.server).delete(path).set(this.authHeader(token));
  }
}
