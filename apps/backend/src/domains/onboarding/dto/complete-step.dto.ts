import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CompleteStepDto {
  @IsString()
  @IsNotEmpty()
  @IsIn([
    'create_screen',
    'upload_media',
    'create_playlist',
    'schedule_content',
    'invite_team',
  ])
  step!: string;
}
