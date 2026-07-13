import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @MaxLength(2048)
  url!: string;

  @IsString()
  @MaxLength(500)
  events!: string;
}
