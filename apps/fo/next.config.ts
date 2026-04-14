import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@hyliren/shared', '@hyliren/ui', '@hyliren/i18n'],
};

export default config;
