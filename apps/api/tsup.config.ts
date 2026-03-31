import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/*"],
  format: ["esm"],
  dts: false,
  sourcemap: false,
  clean: true,
});
