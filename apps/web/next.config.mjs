/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tpm/ui', '@tpm/schemas', '@tpm/config', '@tpm/database', '@tpm/queue'],
  // Keep native-ish Node libs out of the webpack bundle; required at runtime from node_modules.
  serverExternalPackages: ['bullmq', 'ioredis'],
  eslint: {
    // Linting is run at the repo root via the flat ESLint config.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
