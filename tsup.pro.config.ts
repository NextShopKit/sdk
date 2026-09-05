import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.pro.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    minify: false,
    target: "esnext",
    outDir: "dist",
  },
  {
    entry: ["src/entries/client.pro.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    platform: "browser",
    target: "esnext",
    outDir: "dist/client",
  },
]);
