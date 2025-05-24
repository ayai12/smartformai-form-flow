import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to the backend server
      '/create-checkout-session': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/save-subscription': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/cancel-subscription': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/get-session': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/webhook': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/test-firebase': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
