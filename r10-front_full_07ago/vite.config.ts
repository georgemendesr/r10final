import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
  host: "127.0.0.1",
    port: 5175,
  strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3002', // porta do servidor SQLite
        changeOrigin: true,
        secure: false,
      }
    },
    // Pre-warming para desenvolvimento
    warmup: {
      clientFiles: [
        './src/components/Header.tsx',
        './src/components/Footer.tsx',
        './src/components/HeroGrid.tsx'
      ]
    }
  },
  plugins: [
    react(),
    // Health endpoint para dev
    {
      name: 'dev-health-endpoint',
      configureServer(server: any) {
        server.middlewares.use('/health', (_req: any, res: any) => res.end('ok'))
      }
    },
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // Otimizações de build para produção
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
          admin: [
            './src/components/Dashboard.tsx',
            './src/components/PostForm.tsx'
          ]
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
    sourcemap: mode !== 'production',
  },
  
  // Otimizações de dependência
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    exclude: ['@vite/client', '@vite/env']
  },
}));
