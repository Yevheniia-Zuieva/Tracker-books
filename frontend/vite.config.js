import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,           // Автоматично відкривати звіт у браузері після збірки
      filename: 'bundle-stats.html', // Назва файлу звіту
      gzipSize: true,       // Показувати розмір файлів після gzip стиснення
      brotliSize: true,     // Показувати розмір після brotli стиснення
      template: 'treemap'   // Тип візуалізації (карта блоків)
    })
  ],
  resolve: {
    alias: {
      // Це дозволить використовувати зручні шляхи на кшталт "@/components/..."
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Налаштування проксі, щоб запити до /api йшли на ваш Django-бекенд
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
