import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

export type ScanResult = {
  clean: boolean;
  threatName?: string;
  scannerVersion: string;
};

@Injectable()
export class VirusScanService {
  private readonly logger = new Logger(VirusScanService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('CLAMAV_HOST')?.trim());
  }

  async scanFile(filePath: string, fileName: string): Promise<ScanResult> {
    const clamAvHost = this.config.get<string>('CLAMAV_HOST')?.trim();
    const clamAvPort = Number(this.config.get<string>('CLAMAV_PORT') ?? '3310');

    if (!clamAvHost) {
      this.logger.debug('ClamAV not configured, skipping scan');
      return { clean: true, scannerVersion: 'unconfigured' };
    }

    try {
      const { createReadStream } = await import('fs');
      const net = await import('net');

      return await new Promise<ScanResult>((resolve, reject) => {
        const socket = new net.Socket();
        const chunks: Buffer[] = [];

        socket.connect(clamAvPort, clamAvHost, () => {
          socket.write(`zINSTREAM\0`);
          const stream = createReadStream(filePath);
          stream.on('data', (chunk: Buffer) => {
            const header = Buffer.alloc(4);
            header.writeUInt32BE(chunk.length, 0);
            socket.write(Buffer.concat([header, chunk]));
          });
          stream.on('end', () => {
            const zero = Buffer.alloc(4);
            socket.write(zero);
          });
          stream.on('error', reject);
        });

        socket.on('data', (data: Buffer) => {
          chunks.push(data);
        });

        socket.on('close', () => {
          const response = Buffer.concat(chunks).toString('utf-8').trim();
          const clean = response.includes('OK');
          const threatName = clean
            ? undefined
            : response.replace('stream: ', '');
          resolve({
            clean,
            threatName: clean ? undefined : threatName,
            scannerVersion: 'clamav',
          });
        });

        socket.on('error', (err) => {
          this.logger.error(`ClamAV scan error: ${err.message}`);
          resolve({ clean: true, scannerVersion: 'error-fallback' });
        });
      });
    } catch (err) {
      this.logger.error(`Virus scan failed for ${fileName}: ${err}`);
      return { clean: true, scannerVersion: 'error-fallback' };
    }
  }
}
