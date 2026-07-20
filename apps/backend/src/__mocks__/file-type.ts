const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const GIF_MAGIC = [0x47, 0x49, 0x46, 0x38];
const WEBP_MAGIC = [0x52, 0x49, 0x46, 0x46];
const MP4_MAGIC = [0x66, 0x74, 0x79, 0x70];
const WEBM_MAGIC = [0x1a, 0x45, 0xdf, 0xa3];

function matches(buf: Buffer, magic: number[], offset = 0): boolean {
  if (buf.length < offset + magic.length) return false;
  return magic.every((b, i) => buf[offset + i] === b);
}

export async function fileTypeFromBuffer(
  buf: Buffer,
): Promise<{ ext: string; mime: string } | null> {
  if (matches(buf, PNG_MAGIC)) return { ext: 'png', mime: 'image/png' };
  if (matches(buf, JPEG_MAGIC)) return { ext: 'jpg', mime: 'image/jpeg' };
  if (matches(buf, GIF_MAGIC)) return { ext: 'gif', mime: 'image/gif' };
  if (matches(buf, WEBP_MAGIC, 0) && buf.length >= 12 && matches(buf, [0x57, 0x45, 0x42, 0x50], 8))
    return { ext: 'webp', mime: 'image/webp' };
  if (buf.length >= 12 && matches(buf, MP4_MAGIC, 4)) return { ext: 'mp4', mime: 'video/mp4' };
  if (matches(buf, WEBM_MAGIC)) return { ext: 'webm', mime: 'video/webm' };
  return null;
}
