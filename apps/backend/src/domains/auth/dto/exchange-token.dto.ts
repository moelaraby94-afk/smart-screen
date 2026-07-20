import { IsOptional, IsString } from 'class-validator';

export class ImpersonateDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;
}

export class ExchangeTokenDto {
  @IsString()
  token!: string;
}
