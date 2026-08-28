import fs from "node:fs"
import os from "node:os"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// The статистика page talks to a real backend. It is the preview container on
// the prod box, reached over an ssh tunnel:
//
//   ssh -i ~/.ssh/adsmetry-prod -N -L 8001:127.0.0.1:8001 root@<prod host>
//
// The account's token lives outside the repo (~/.adsmetry-stats-preview-token)
// and is attached here rather than in the browser, so nothing about it ends up
// in the page or in git. Without the file the proxy still runs and the page
// falls back to the responses saved in public/real.
function previewToken() {
  try {
    return fs
      .readFileSync(path.join(os.homedir(), ".adsmetry-stats-preview-token"), "utf8")
      .trim()
  } catch {
    return ""
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: "/proto-v2-adsmanagy/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    allowedHosts: [".ngrok-free.app"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        configure: (proxy) => {
          const token = previewToken()
          if (!token) return
          proxy.on("proxyReq", (request) => {
            request.setHeader("cookie", `access_token=${token}`)
          })
        },
      },
    },
  },
})
