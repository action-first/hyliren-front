import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  transpilePackages: ['@hyliren/shared', '@hyliren/ui', '@hyliren/i18n', 'lucide-react'],
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Webpack 캐시 비활성화 — monorepo에서 캐시 꼬임 방지
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default config;
