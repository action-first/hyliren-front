import type { NextConfig } from 'next';
import path from 'path';

/**
 * 정적 이미지 자산 base URL.
 * - dev: FO dev server (apps/fo/public/images/...) 재사용
 * - prod: CDN 또는 별도 정적 호스팅 (env 로 주입)
 *
 * Backend (procedure entity 등) 가 상대 경로(`/images/...`)로 이미지를 반환하는데,
 * 그 자산이 FO public 디렉토리에 있어 PO 도메인에서는 404. rewrite 로 prefix 적용.
 */
const STATIC_IMAGE_BASE = process.env.NEXT_PUBLIC_STATIC_IMAGE_BASE || 'http://localhost:9000';

const config: NextConfig = {
  transpilePackages: ['@hyliren/shared', '@hyliren/ui', '@hyliren/i18n', 'lucide-react', 'ag-grid-community', 'ag-grid-react'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/images/:path*',
        destination: `${STATIC_IMAGE_BASE}/images/:path*`,
      },
    ];
  },
};

export default config;
