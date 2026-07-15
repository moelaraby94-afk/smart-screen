import path from 'path';
import { config } from 'dotenv';
import type { NextConfig } from 'next';

config({ path: path.resolve(process.cwd(), '../../.env') });

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', '192.168.1.144'],
};

export default nextConfig;
