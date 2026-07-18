import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { MatchesPasswordComplexity } from '../../../common/validators/password-complexity.decorator';

export class CreateStaffDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MatchesPasswordComplexity()
  password!: string;

  @IsIn(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER'])
  adminRole!: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER';
}
