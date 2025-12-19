# Local Development Setup

## Node.js v25 Compatibility Fix

If you're running Node.js v25.x, you need to disable the experimental Web Storage API which conflicts with Next.js SSR.

### Solution

Add the following to your `.env.local` file:

```bash
# Disable Node.js v25 experimental Web Storage API (causes localStorage issues with Next.js SSR)
NODE_OPTIONS="--no-experimental-webstorage"
```

### Why This Is Needed

Node.js v25.0.0+ enables the Web Storage API (localStorage) by default, which causes conflicts during server-side rendering in Next.js. The error manifests as:

```
⨯ [TypeError: localStorage.getItem is not a function]
(node:xxxxx) Warning: '--localstorage-file' was provided without a valid path
```

### Alternative Solutions

1. **Downgrade to Node.js v24 LTS** (recommended for production stability)
2. **Use nvm to switch versions**: `nvm use 24`

## PostHog Configuration

PostHog is now optional for local development. If you don't have a PostHog key configured, the application will skip analytics tracking without errors.

To enable PostHog locally, add to `.env.local`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Supabase Local Development

Make sure your local Supabase instance is running:

```bash
npx supabase status
```

Your `.env.local` should have:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
```
