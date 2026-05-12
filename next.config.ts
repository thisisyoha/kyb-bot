import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow this app to be embedded as an iframe from any origin
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://kyb.meshpayments.com https://*.vercel.app http://localhost:3000",
          },
        ],
      },
    ]
  },
}

export default nextConfig
