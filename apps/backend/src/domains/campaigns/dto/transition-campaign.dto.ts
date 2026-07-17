import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TransitionCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
