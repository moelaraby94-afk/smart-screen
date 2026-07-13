import { IsBoolean } from 'class-validator';

export class ToggleWebhookDto {
  @IsBoolean()
  enabled!: boolean;
}
