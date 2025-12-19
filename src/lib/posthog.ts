import { PostHog } from "posthog-node"

export default function PostHogClient() {
  // Return null if PostHog key is not configured (e.g., local development)
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null;
  }

  const posthogClient = new PostHog(
    process.env.NEXT_PUBLIC_POSTHOG_KEY,
    {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    }
  )
  return posthogClient
}