import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // إضافة هذا الإعداد
  base: '/',
  build: {
    outDir: 'dist',
    // إضافة هذه الإعدادات لتحسين الأداء
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // إعدادات الخادم للتطوير
  server: {
    port: 3000,
    open: true
  },
  // إعدادات المعاينة
  preview: {
    port: 3000,
    open: true
  }
})