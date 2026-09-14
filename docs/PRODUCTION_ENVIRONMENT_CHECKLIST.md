# Production Environment Checklist

Never commit real credentials.

## Required production configuration
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY (server-side only)
- STRIPE_SECRET_KEY (server-side only)
- STRIPE_WEBHOOK_SECRET
- GOOGLE_MAPS_API_KEY (server-side where applicable)
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER
- SENTRY_DSN
- POSTHOG_KEY
- APP_PUBLIC_URL

## Rules
- Mobile/web clients must never receive secret/service-role keys.
- Use separate test and live Stripe credentials.
- Restrict Google API keys by API and application where supported.
- Rotate credentials if exposed.
