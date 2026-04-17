import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // 親ディレクトリの postcss/tailwind 設定を拾わせない（tetris は独立した Vite プロジェクト）
  css: {
    postcss: {},
  },
  server: {
    host: true,
  },
  build: {
    target: 'es2020',
  },
});
