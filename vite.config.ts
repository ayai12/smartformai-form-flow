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
        target: 'https://us-central1-smartformai-51e03.cloudfunctions.net/api',
        changeOrigin: true,
      },
      '/create-portal-session': {
        target: 'https://us-central1-smartformai-51e03.cloudfunctions.net/api',
        changeOrigin: true,
      },
      '/get-stripe-prices': {
        target: 'https://us-central1-smartformai-51e03.cloudfunctions.net/api',
        changeOrigin: true,
      },
      '/save-subscription': {
        target: 'https://us-central1-smartformai-51e03.cloudfunctions.net/api',
        changeOrigin: true,
      },
      '/cancel-subscription': {
        target: 'https://us-central1-smartformai-51e03.cloudfunctions.net/api',
        changeOrigin: true,
      },
      '/get-session': {
        target: 'https://us-central1-smartformai-51e03.cloudfunctions.net/api',
        changeOrigin: true,
      },
      '/webhook': {
        target: 'https://us-central1-smartformai-51e03.cloudfunctions.net/api',
        changeOrigin: true,
      },
      '/chat': {
        target: 'https://us-central1-smartformai-51e03.cloudfunctions.net/api',
        changeOrigin: true,
      },
      '/test-firebase': {
        target: 'https://us-central1-smartformai-51e03.cloudfunctions.net/api',
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
