import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkspaceScopeDto } from './create-account-member.dto';

export class AddAccountMemberDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsIn(['VIEWER', 'EDITOR', 'ADMIN'])
  role!: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WorkspaceScopeDto)
  workspaceScopes?: WorkspaceScopeDto[];
}
