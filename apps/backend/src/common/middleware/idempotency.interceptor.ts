import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly cache = new Map<string, { result: unknown; expiresAt: number }>();
  private readonly TTL_MS = 24 * 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['x-idempotency-key'] as string | undefined;

    if (!key || request.method === 'GET') {
      return next.handle();
    }

    const cached = this.cache.get(key);
    if (cached) {
      if (cached.expiresAt < Date.now()) {
        this.cache.delete(key);
      } else {
        return of(cached.result);
      }
    }

    return next.handle().pipe(
      tap((result) => {
        this.cache.set(key, { result, expiresAt: Date.now() + this.TTL_MS });
      }),
    );
  }
}
