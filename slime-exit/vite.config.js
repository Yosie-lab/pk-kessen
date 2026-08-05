import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages のサブパスでも相対で動くようにする
  base: "./",
  build: {
    // GitHub Pages 用にコミットする静的出力先
    outDir: "play",
    assetsDir: "assets",
    sourcemap: false,
    emptyOutDir: true,
  },
  server: {
    port: 5181,
    strictPort: true,
  },
});
