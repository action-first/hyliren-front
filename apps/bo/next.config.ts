import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@hyliren/shared', '@hyliren/ui', '@hyliren/i18n', 'lucide-react', 'ag-grid-community', 'ag-grid-react'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default config;
