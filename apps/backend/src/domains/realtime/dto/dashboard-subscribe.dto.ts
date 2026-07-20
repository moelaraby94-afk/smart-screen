import { IsNotEmpty, IsString } from 'class-validator';

export class DashboardSubscribeDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;
}
