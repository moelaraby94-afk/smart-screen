import { IsNotEmpty, IsString } from 'class-validator';

export class PairingWatchDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  pollSecret!: string;
}
