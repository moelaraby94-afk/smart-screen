import path from 'path';
import { config } from 'dotenv';
import type { NextConfig } from 'next';

config({ path: path.resolve(process.cwd(), '../../.env') });

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
