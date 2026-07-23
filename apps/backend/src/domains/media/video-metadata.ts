/**
 * Video metadata extraction using ffprobe.
 *
 * Fault-tolerant: if ffprobe cannot analyze the file, all fields return null
 * and a warning is logged. The upload is never failed due to metadata extraction.
 */

export type VideoMetadata = {
  width: number | null;
  height: number | null;
  durationSec: number | null;
  rotation: number | null;
  codec: string | null;
  bitrate: number | null;
  frameRate: number | null;
};

const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/avi',
]);

export function isVideoMime(mime: string): boolean {
  return VIDEO_MIMES.has(mime);
}

/**
 * Extracts video metadata from a buffer using ffprobe.
 *
 * Writes the buffer to a temporary file, runs ffprobe, then cleans up.
 * Returns null for all fields if extraction fails — never throws.
 */
export async function extractVideoMetadata(
  buffer: Buffer,
  logger?: { warn: (msg: string) => void },
): Promise<VideoMetadata> {
  const empty: VideoMetadata = {
    width: null,
    height: null,
    durationSec: null,
    rotation: null,
    codec: null,
    bitrate: null,
    frameRate: null,
  };

  let tmpFile: string | null = null;

  try {
    const ffprobePath = require('@ffprobe-installer/ffprobe').path;
    const ffmpeg = (await import('fluent-ffmpeg')).default;
    ffmpeg.setFfprobePath(ffprobePath);

    const { tmpdir } = require('os');
    const { join } = require('path');
    const { writeFileSync } = require('fs');
    tmpFile = join(tmpdir(), `ffprobe-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
    writeFileSync(tmpFile, buffer);

    const metadata = await new Promise<import('fluent-ffmpeg').FfprobeData>((resolve, reject) => {
      ffmpeg(tmpFile!).ffprobe((err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const videoStream = metadata.streams.find((s: import('fluent-ffmpeg').FfprobeStream) => s.codec_type === 'video');
    if (!videoStream) return empty;

    // Parse rotation from side_data_list (display matrix, older ffprobe) or tags
    let rotation: number | null = null;
    if (videoStream.side_data_list) {
      for (const sd of videoStream.side_data_list) {
        if (sd.rotation !== undefined) {
          rotation = Math.abs(sd.rotation) % 360;
          break;
        }
      }
    }
    if (rotation === null && videoStream.tags) {
      const rotateTag = videoStream.tags.rotate;
      if (rotateTag !== undefined) {
        rotation = parseInt(String(rotateTag), 10) || null;
      }
    }

    // Parse frame rate (r_frame_rate is a fraction like "30/1")
    let frameRate: number | null = null;
    if (videoStream.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
      if (num && den) frameRate = Math.round((num / den) * 1000) / 1000;
    }

    return {
      width: videoStream.width ?? null,
      height: videoStream.height ?? null,
      durationSec: metadata.format.duration ? parseFloat(String(metadata.format.duration)) : null,
      rotation,
      codec: videoStream.codec_name ?? null,
      bitrate: videoStream.bit_rate ? parseInt(String(videoStream.bit_rate), 10) : (metadata.format.bit_rate ? parseInt(String(metadata.format.bit_rate), 10) : null),
      frameRate,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger?.warn(`ffprobe metadata extraction failed: ${msg}`);
    return empty;
  } finally {
    if (tmpFile) {
      try { require('fs').unlinkSync(tmpFile); } catch { /* ignore cleanup errors */ }
    }
  }
}
