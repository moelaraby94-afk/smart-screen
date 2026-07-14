import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AssignPlaylistDto {
  @IsString()
  playlistId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
