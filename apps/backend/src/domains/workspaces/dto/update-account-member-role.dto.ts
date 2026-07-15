import { IsIn, IsString } from 'class-validator';

export class UpdateAccountMemberRoleDto {
  @IsString()
  @IsIn(['VIEWER', 'EDITOR', 'ADMIN'])
  role!: string;
}
