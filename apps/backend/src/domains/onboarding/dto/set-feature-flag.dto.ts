import { IsBoolean, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SetFeatureFlagDto {
  @IsString()
  @IsNotEmpty()
  @IsIn([
    'billing',
    'api_keys',
    'webhooks',
    'analytics',
    'campaigns',
    'ai',
    'emergency',
    'proof_of_play',
    'templates',
  ])
  module!: string;

  @IsBoolean()
  enabled!: boolean;
}
