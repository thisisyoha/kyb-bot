'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: '#1E293B',
          gap: 12,
        }}
      >
        <p>Something went wrong. Please try refreshing the page.</p>
        <button
          onClick={reset}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: '#1D4ED8',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
