import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
  root: '.',
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 不拆分chunk，保持简单
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // 文件名哈希
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 启用 gzip 压缩报告
    reportCompressedSize: true,
    // 目标浏览器
    target: 'es2015',
    // 关闭 source map（生产环境）
    sourcemap: false,
    // 最小化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 5173,
    open: false,
    // 代理 JSON 数据文件
    fs: {
      allow: ['.']
    }
  },
  // 开发时不依赖预构建
  optimizeDeps: {
    include: []
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'js'),
      '@utils': resolve(__dirname, 'js/utils'),
      '@pages': resolve(__dirname, 'js/pages'),
      '@data': resolve(__dirname, 'js/data')
    }
  }
});
