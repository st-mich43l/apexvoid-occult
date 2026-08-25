import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2022",
    sourcemap: false,
    cssMinify: "lightningcss",
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      // Host `npm run dev` → localhost:8000. Docker compose sets
      // OCCULT_API_PROXY=http://backend:8000 so /api hits the backend service.
      "/api": process.env.OCCULT_API_PROXY ?? "http://localhost:8000",
      "/health": process.env.OCCULT_API_PROXY ?? "http://localhost:8000",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
