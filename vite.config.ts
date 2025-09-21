import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    tsconfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart({
      target: "node-server",
      customViteReactPlugin: true,
    }),
    tailwindcss(),
    viteReact(),
  ],
});
