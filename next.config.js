/** @type {import('next').NextConfig} */
// Trigger Vercel deployment - ${new Date().toISOString()}
const nextConfig = {
  distDir: '.next',
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      net: false, 
      dns: false,
      fs: false,
      path: false,
      canvas: false,
      encoding: false,
      http: false,
      https: false,
      stream: false,
      crypto: false
    };
    
    // Add rule for worker files
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource'
    });
    
    return config;
  },
  typescript: {
    ignoreBuildErrors: true
  }
};

module.exports = nextConfig; 
