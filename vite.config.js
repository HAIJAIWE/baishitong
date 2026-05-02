import { defineConfig } from 'vite';
import { resolve } from 'path';
import compression from 'vite-plugin-compression';

export default defineConfig({
  root: '.',
  base: './',
  publicDir: 'public',
  plugins: [
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,  // 大于1KB的文件才压缩
      deleteOriginFile: false
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: function(id, meta) {
          // 将各页面拆分为独立chunk
          if (id.includes('/pages/home.js')) return 'page-home';
          if (id.includes('/pages/explore.js')) return 'page-explore';
          if (id.includes('/pages/tips.js')) return 'page-tips';
          if (id.includes('/pages/compare.js')) return 'page-compare';
          if (id.includes('/pages/ai-chat.js') || id.includes('/ai-engine.js')) return 'page-ai';
          if (id.includes('/pages/profile.js')) return 'page-profile';
          if (id.includes('/pages/community.js') || id.includes('/leancloud-service.js')) return 'page-community';
          if (id.includes('/pages/achievements.js')) return 'page-achievements';
          if (id.includes('/pages/favorites.js')) return 'page-favorites';
          if (id.includes('/pages/checkin.js')) return 'page-checkin';
          if (id.includes('/pages/assessment.js')) return 'page-assessment';
          if (id.includes('/pages/onboarding.js')) return 'page-onboarding';
          // leancloud-storage 单独拆分（很大）
          if (id.includes('leancloud-storage')) return 'vendor-leancloud';
          // 其他vendor
          if (id.includes('node_modules')) return 'vendor';
        },
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
