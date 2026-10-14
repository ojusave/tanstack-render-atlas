import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite is the small local development server and production bundler.
// The React plugin lets Vite understand JSX and refresh the page as you edit.
export default defineConfig({
  plugins: [react()],
  // During local development, the browser calls /api on Vite and Vite forwards
  // those requests to the Node backend running on port 10000.
  server: {
    proxy: {
      "/api": "http://127.0.0.1:10000",
    },
  },
});
