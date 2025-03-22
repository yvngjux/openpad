/** @type {import('next').NextConfig} */
// Trigger Vercel deployment - ${new Date().toISOString()}
const nextConfig = {
  distDir: '.next',
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost'],
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
    
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    
    return config;
  },
  typescript: {
    ignoreBuildErrors: true
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    functionTimeout: 30, // 30 seconds
  },
  // Increase serverless function timeout
  functions: {
    maxDuration: 60 // This sets a 60-second timeout
  }
};

module.exports = nextConfig; 
