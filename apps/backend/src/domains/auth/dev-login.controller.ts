import {
  Controller,
  HttpCode,
  NotFoundException,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { setAuthCookies } from './auth-cookie.util';
import type { Response } from 'express';

/**
 * Development-only controller for the dev-login route.
 * Conditionally registered in AuthModule only when NODE_ENV !== 'production',
 * so the route is entirely absent from a production build.
 */
@Controller('auth')
export class DevLoginController {
  constructor(private readonly authService: AuthService) {}

  /** Development only: sign in as the first active user (no password). */
  @HttpCode(200)
  @Post('dev-login')
  async devLogin(@Res({ passthrough: true }) response: Response): Promise<{
    user: { id: string; email: string; fullName: string; locale: string };
    workspaces: Array<{ id: string; name: string; slug: string; role: string }>;
    accessToken: string;
  }> {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ENABLE_DEV_LOGIN !== 'true'
    ) {
      throw new NotFoundException();
    }
    const result = await this.authService.devLoginAsFirstUser();
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return {
      user: result.user,
      workspaces: result.workspaces,
      accessToken: result.accessToken,
    };
  }
}
