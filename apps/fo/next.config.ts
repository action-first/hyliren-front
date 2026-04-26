import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  // standalone 산출물: Vercel 운영엔 영향 없으나, 향후 Docker(중국 이중화 등) 이식 시 필요.
  output: 'standalone',
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
