import type { NextConfig } from 'next'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig: NextConfig = {
  // Build static HTML/CSS/JS into ./out so GitHub Pages can serve it directly.
  output: 'export',

  // GitHub project pages live under /repository-name.
  // Keep NEXT_PUBLIC_BASE_PATH empty for local dev or username.github.io repos.
  basePath,
  assetPrefix: basePath || undefined,

  // GitHub Pages has no Next.js image optimization server.
  images: {
    unoptimized: true,
  },

  turbopack: {
    root: import.meta.dirname,
  },
}

export default nextConfig
