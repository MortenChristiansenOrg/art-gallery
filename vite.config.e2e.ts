import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config";
import path from "path";
import fs from "fs";

// E2E config extends base config but uses a different entry point
// that injects a fake Convex client with mock data
export default mergeConfig(
  baseConfig,
  defineConfig({
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.e2e.html"),
        },
      },
    },
    plugins: [
      {
        name: "e2e-html-rename",
        closeBundle() {
          // Rename index.e2e.html to index.html for vite preview
          const distDir = path.resolve(__dirname, "dist");
          const e2eHtml = path.join(distDir, "index.e2e.html");
          const indexHtml = path.join(distDir, "index.html");
          if (fs.existsSync(e2eHtml)) {
            // Remove existing index.html if present
            if (fs.existsSync(indexHtml)) {
              fs.unlinkSync(indexHtml);
            }
            fs.renameSync(e2eHtml, indexHtml);
          }
        },
      },
    ],
  })
);
