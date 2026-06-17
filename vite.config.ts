import {defineConfig} from 'vite'
import react, {reactCompilerPreset} from '@vitejs/plugin-react'
import babel from "@rolldown/plugin-babel"
import {VitePWA} from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import vercel from "vite-plugin-vercel/vite";

export default defineConfig({
  server: {
    proxy: {
      "/api/buses": {
        target: "http://bielawa.trapeze.fi",
        changeOrigin: true,
        rewrite: (_) => "/bussit/web?command=olmapvehicles&action=getVehicles",
      },
    },
  },

  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    vercel(),

    VitePWA({
      strategies: "generateSW",
      injectRegister: "script-defer",
      registerType: "autoUpdate",
      manifest: {
        name: "Zpgsa",
        short_name: "Zpgsa",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        scope: "./",
        start_url: "./",
        icons: [
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable any",
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 10485760,

        navigateFallback: "index.html",

        globIgnores: ["**/api/**/*"],
        globPatterns: [
          "index.html",
          "**/*.{js,css,ico,png,svg,webmanifest,json}",
        ],

        ignoreURLParametersMatching: [/.*/],

        runtimeCaching: [
          {
            urlPattern: /\.(js|css|json)$/,
            handler: "NetworkFirst",
            options: {cacheName: "logic"},
          },
          {
            urlPattern: /\.(png|xml|txt|webmanifest|ico|svg)$/,
            handler: "CacheFirst",
            options: {cacheName: "assets"},
          },
          {
            urlPattern: ({request, url}) =>
              request.mode === "navigate" && !url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {cacheName: "html"},
          },
        ],
      },
    }),

  ],
})
