/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cover.openbd.jp',
      },
      {
        protocol: 'https',
        hostname: 'ndlsearch.ndl.go.jp',
      },
    ],
  },
};

export default nextConfig;
