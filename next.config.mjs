/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  },
};

export default nextConfig;
