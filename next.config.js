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
    family: 4
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  env: {
    UV_THREADPOOL_SIZE: '64',
    NODE_OPTIONS: '--dns-result-order=ipv4first',
    HOSTNAME: '0.0.0.0',
    HOST: '0.0.0.0',
    PORT: '3000'
  }
};

export default nextConfig; 
