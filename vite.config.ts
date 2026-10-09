import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      // redirect.html is the MSAL popup's landing page (see src/lib/msal.ts).
      input: {
        main: path.resolve(__dirname, "index.html"),
        redirect: path.resolve(__dirname, "redirect.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})