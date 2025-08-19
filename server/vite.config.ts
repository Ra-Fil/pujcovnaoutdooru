import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
    },
  },
  build: {
  outDir: "../../dist/public", // relativně vůči client/
  emptyOutDir: true,
  rollupOptions: {
    input: "index.html",
  },
  },
});
