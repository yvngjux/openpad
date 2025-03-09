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
  },
  httpAgentOptions: {
    family: 4 // Force IPv4
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
};

export default nextConfig; 
