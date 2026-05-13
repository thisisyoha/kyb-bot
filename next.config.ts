import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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

export default withSentryConfig(nextConfig, {
  org: 'mesh-payments',
  project: 'mai',
  silent: true,
  telemetry: false,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
})
