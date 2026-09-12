import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths. GitHub Pages serves a project repo from a subpath
  // (https://<user>.github.io/license-admin-react/), and the default base of "/"
  // would make the bundle request /assets/... from the domain root and 404 into a
  // blank page. "./" also keeps a custom domain or local `vite preview` working
  // without changing this file. Safe here because the app has no client-side router.
  base: "./",
  build: {
    outDir: "dist",
    // index.html at the project root is the Vite entry; it pulls in src/main.jsx.
    rollupOptions: {
      input: "index.html",
    },
  },
});
