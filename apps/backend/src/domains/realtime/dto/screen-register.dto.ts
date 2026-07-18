import { IsNotEmpty, IsString } from 'class-validator';

export class ScreenRegisterDto {
  @IsString()
  @IsNotEmpty()
  serialNumber!: string;

  @IsString()
  @IsNotEmpty()
  secret!: string;
}
