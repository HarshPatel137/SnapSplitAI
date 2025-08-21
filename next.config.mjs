/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ['framer-motion', 'lucide-react'] },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.backblazeb2.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      { protocol: 'https', hostname: '**.s3.*.amazonaws.com' },
    ],
  },
};
export default nextConfig;
