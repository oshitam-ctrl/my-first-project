/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/tetris', destination: '/tetris/index.html' },
      { source: '/tetris/', destination: '/tetris/index.html' },
    ];
  },
};

export default nextConfig;
