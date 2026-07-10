import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Body for creating and renaming a media folder.
 *
 * These two routes previously took an inline `{ name?: string }`. The global
 * ValidationPipe only validates class DTOs, so `whitelist`/`forbidNonWhitelisted`
 * silently did nothing there: unknown properties were accepted, and `{"name": 12345}`
 * reached `name.trim()` in the service and crashed with a 500.
 */
export class FolderNameDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name!: string;
}
