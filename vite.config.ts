import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 相对路径让构建产物可以部署在任意静态站点（包括子路径）。
  base: './',
  server: {
    // 监听所有网卡，手机等局域网设备可通过电脑 IP 访问。
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      // 忽略编辑器/工具产生的隐藏临时目录，避免 Windows 文件锁导致 dev server 退出。
      ignored: ['**/.git/**', '**/node_modules/**', '**/.*.tmpdir/**'],
    },
  },
  preview: {
    // 生产构建的本地预览同样允许局域网访问。
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false,
  },
});
