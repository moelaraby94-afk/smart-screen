import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  url!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  events!: string;
}
