import { defineConfig } from "vite";

export default defineConfig({
  // 独自リポジトリ Pages ルート（https://yosie-lab.github.io/slime-exit/）向け
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    emptyOutDir: true,
  },
  server: {
    port: 5181,
    strictPort: true,
  },
});
