import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "WeatherWidget",
      formats: ["es", "cjs", "umd"],
      cssFileName: "style",
      fileName: format => {
        if (format === "es") {
          return "index.js";
        }

        if (format === "cjs") {
          return "index.cjs";
        }

        if (format === "umd") {
          return "weather-widget.umd.js";
        }

        throw new Error(`Unsupported module format: ${format}`);
      },
    },
    rollupOptions: {
      output: {
        exports: "named",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@@": path.resolve(__dirname),
    },
  },
});
