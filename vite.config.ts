import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  server: {
    host: true,   // écoute sur 0.0.0.0, accessible depuis le téléphone
    port: 5173,
    proxy: {
      '/graphql': { target: 'http://localhost:3000', changeOrigin: true },
      '/upload':  { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
});
