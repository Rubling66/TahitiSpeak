/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Performance optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    styledComponents: true,
  },
  
  // Production optimizations
  swcMinify: true,
  reactStrictMode: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Exclude mobile directory from build
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /mobile/,
    });

    // Handle Node.js modules that shouldn't be bundled for the client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        http2: false,
        child_process: false,
        worker_threads: false,
        perf_hooks: false,
        async_hooks: false,
        inspector: false,
        dns: false,
        dgram: false,
        readline: false,
        repl: false,
        cluster: false,
        module: false,
        vm: false,
        constants: false,
        buffer: false,
        util: false,
        events: false,
        querystring: false,
        punycode: false,
        timers: false,
      };
      
      // Exclude server-side packages from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        '@genkit-ai/firebase': 'commonjs @genkit-ai/firebase',
        '@genkit-ai/google-cloud': 'commonjs @genkit-ai/google-cloud',
        '@genkit-ai/googleai': 'commonjs @genkit-ai/googleai',
        'genkit': 'commonjs genkit',
        'firebase-admin': 'commonjs firebase-admin',
      });
    }
    
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('@next/bundle-analyzer')({
        enabled: true,
      });
      config.plugins.push(new BundleAnalyzerPlugin());
    }
    
    return config;
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-select', '@radix-ui/react-dialog', 'framer-motion'],
    serverComponentsExternalPackages: ['@genkit-ai/firebase', '@genkit-ai/googleai', 'firebase-admin'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  skipTrailingSlashRedirect: true,
  
  // Environment validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Output configuration for static export if needed
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  
  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;