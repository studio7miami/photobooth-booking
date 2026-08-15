import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const hostedAtPhotobooth = process.env.VERCEL === "1";
const base = hostedAtPhotobooth ? "/photobooth/" : "/";

export default defineConfig({
  base,
  server: {
    host: true,
    port: 8080,
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  plugins: [
    tailwindcss(),
    tanstackStart(
      hostedAtPhotobooth ? { router: { basepath: "/photobooth" } } : undefined,
    ),
    nitro({
      ...(hostedAtPhotobooth ? { baseURL: "/photobooth" } : {}),
      rolldownConfig: {
        output: {
          inlineDynamicImports: true,
        },
      },
    }),
    viteReact(),
  ],
});
