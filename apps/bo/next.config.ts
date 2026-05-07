import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@hyliren/shared', '@hyliren/ui', '@hyliren/i18n', 'lucide-react', 'ag-grid-community', 'ag-grid-react'],
  // bcrypt · @prisma/client 는 native binding/runtime 을 가져 webpack 이 번들하면 깨짐.
  // serverExternalPackages 만으론 workspace package(@hyliren/db) 내부 deep import 에
  // 적용 안 되는 케이스가 있어 webpack externals 로 함께 강제 externalize.
  serverExternalPackages: ['bcrypt', '@mapbox/node-pre-gyp', '@prisma/client', '.prisma/client'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = false;
    }
    if (isServer) {
      // server bundle 에선 native module 들을 require() 로 런타임 해소.
      const externals = Array.isArray(config.externals) ? config.externals : [];
      externals.push({
        bcrypt: 'commonjs bcrypt',
        '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
      });
      config.externals = externals;
    }
    return config;
  },
};

export default config;
