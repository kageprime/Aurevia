import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [inspectAttr(), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('@clerk/')) {
            return 'vendor-clerk';
          }

          if (id.includes('react-router') || id.includes('@remix-run')) {
            return 'vendor-router';
          }

          if (id.includes('@radix-ui/') || id.includes('cmdk') || id.includes('vaul')) {
            return 'vendor-ui';
          }

          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }

          return 'vendor-misc';
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
