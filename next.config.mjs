/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/tetris', destination: '/tetris/index.html' },
      { source: '/tetris/', destination: '/tetris/index.html' },
      { source: '/minecraft', destination: '/minecraft/index.html' },
      { source: '/minecraft/', destination: '/minecraft/index.html' },
      { source: '/world', destination: '/world/index.html' },
      { source: '/world/', destination: '/world/index.html' },
    ];
  },
};

export default nextConfig;
