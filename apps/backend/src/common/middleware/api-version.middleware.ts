import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiVersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const version = this.extractVersion(req);
    (req as Request & { apiVersion?: string }).apiVersion = version;
    res.setHeader('X-API-Version', version);
    next();
  }

  private extractVersion(req: Request): string {
    const headerVersion = req.headers['x-api-version'] as string | undefined;
    if (headerVersion) return headerVersion;

    const acceptHeader = req.headers['accept'];
    if (acceptHeader) {
      const match = acceptHeader.match(/version=(\d+)/);
      if (match) return `v${match[1]}`;
    }

    const urlMatch = req.path.match(/^\/(v\d+)\//);
    if (urlMatch) return urlMatch[1];

    return 'v1';
  }
}
