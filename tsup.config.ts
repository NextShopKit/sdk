import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.sdk.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: "dist",
  },
  {
    entry: ["src/entries/client.sdk.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    outDir: "dist/client",
    platform: "browser",
  },
]);
