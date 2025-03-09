/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['next']
  },
  webpack: (config) => {
    config.resolve.fallback = { net: false, dns: false };
    return config;
  }
};

export default nextConfig; 
