import path from 'path'
import { fileURLToPath } from 'url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(projectRoot, '..')

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  async redirects() {
    return ['web-development', 'mobile-development', 'ai-development', 'hosting-deployment', 'cybersecurity', 'machine-learning', 'data-science'].map(category => ({
      source: `/resources/${category}/:path*`, destination: '/resources', permanent: true,
    }))
  },
  async rewrites() {
    return [
      { source: '/api/studio/:path*', destination: `${backendUrl}/api/studio/:path*` },
      { source: '/api/projects/:path*', destination: `${backendUrl}/api/projects/:path*` },
      { source: '/api/agent/info', destination: `${backendUrl}/api/agent/info` },
      { source: '/api/agent', destination: `${backendUrl}/api/agent` },
      { source: '/api/compile/:path*', destination: `${backendUrl}/api/compile/:path*` },
      { source: '/api/generate', destination: `${backendUrl}/api/generate` },
      { source: '/api/health', destination: `${backendUrl}/api/health` },
    ]
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://generativelanguage.googleapis.com https://api.groq.com https://api.openai.com https://api.anthropic.com",
            ].join('; '),
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
