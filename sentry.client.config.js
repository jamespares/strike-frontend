import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  integrations: [],
  enabled: process.env.NODE_ENV === 'production',
  ignoreErrors: [
    'Critical dependency: the request of a dependency is an expression'
  ]
}) 