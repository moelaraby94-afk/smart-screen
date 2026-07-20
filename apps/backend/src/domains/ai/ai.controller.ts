import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser, type JwtUser } from '../../common/auth/current-user.decorator';
import { AiService, type AiGenerateInput } from './ai.service';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  generate(@CurrentUser() user: JwtUser, @Body() body: AiGenerateInput) {
    return this.aiService.generate(body);
  }
}
