import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    /**
     * Remote image hosts that next/image is allowed to optimise.
     * Add entries here whenever a new external image source is introduced.
     */
    remotePatterns: [
      {
        // Stellar Wallets Kit — wallet icon fallback images (issue #79 audit)
        protocol: "https",
        hostname: "stellar.creit.tech",
        pathname: "/wallet-icons/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  /**
   * Sentry organisation + project — set these in your CI/CD environment or
   * locally in a .env.sentry-build-plugin file (never commit that file).
   *
   * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#extend-your-nextjs-configuration
   */
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in CI / production builds to keep local dev fast.
  silent: process.env.CI !== "true",

  // Hides source maps from the browser in production.
  hideSourceMaps: true,

  // Automatically tree-shakes Sentry logger statements in production.
  disableLogger: true,
});
