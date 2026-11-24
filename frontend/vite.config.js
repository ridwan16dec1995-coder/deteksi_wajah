import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// basicSsl -> mode dev memakai https, supaya kamera bisa dipakai dari HP
export default defineConfig({
  base: "./",
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    proxy: { "/api": "http://127.0.0.1:5000" },
  },
});
