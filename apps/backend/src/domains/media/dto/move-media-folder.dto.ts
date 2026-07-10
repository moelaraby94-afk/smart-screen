import { IsOptional, IsString } from 'class-validator';

/**
 * Body for moving a media item between folders.
 *
 * `null` clears the folder (moves the item to the library root); omitting the
 * property does the same. `@IsOptional()` skips validation for `null`/`undefined`
 * only, so a number or object is still rejected — previously this was an inline
 * `{ folderId?: string | null }`, which the ValidationPipe never inspected.
 */
export class MoveMediaFolderDto {
  @IsOptional()
  @IsString()
  folderId?: string | null;
}
