"use client";

import { useEffect } from "react";

/**
 * WalletNoiseFilter — suppresses known-harmless console noise from
 * WalletConnect / Reown wallet SDKs.
 *
 * ## Usage
 *
 * Mount this component **inside** the wallet provider tree, as close to the
 * wallet SDK initialisation as possible:
 *
 * ```tsx
 * <WalletProvider>
 *   <WalletNoiseFilter />
 *   {children}
 * </WalletProvider>
 * ```
 *
 * **Do NOT** render this at the root layout level (`app/layout.tsx`).
 * Placing it at the root permanently patches `console.error` / `console.warn`
 * for the entire app session and makes it harder to trace real errors.
 *
 * ## How it works
 *
 * On mount it wraps `console.error`, `console.warn`, and the `unhandledrejection`
 * event with filters that drop known-harmless SDK noise.
 * The **originals are fully restored on unmount** — i.e. when the wallet provider
 * tree unmounts — so the patch is scoped to the wallet provider's lifetime.
 *
 * ## Patterns
 *
 * Filters are matched against exact substrings known to originate from
 * WalletConnect / Reown internals. Avoid broadening them: a filter like
 * `"reown"` would also suppress any app-level log that happens to mention
 * the word "reown" in a different context.
 */
export default function WalletNoiseFilter() {
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    // Patterns that reliably identify WalletConnect / Reown / valtio noise.
    // Keep these as specific as possible — broad substrings can hide real bugs.
    const SUPPRESSED_PATTERNS: ReadonlyArray<string> = [
      // WalletConnect session management — not actionable by the app
      "Connection request reset. Please try again.",
      // WalletConnect / Reown package identifiers in stack traces / prefixes
      "@walletconnect/",
      "@reown/",
      // valtio proxy warnings emitted by Reown's state management
      "[valtio]",
      // ethereum-provider internal heartbeat / version warnings
      "ethereum-provider",
    ];

    const shouldSuppress = (args: unknown[]): boolean => {
      const message = args
        .map((a) => (typeof a === "string" ? a : String(a)))
        .join(" ");
      return SUPPRESSED_PATTERNS.some((p) => message.includes(p));
    };

    console.error = (...args: unknown[]) => {
      if (!shouldSuppress(args)) originalError.apply(console, args);
    };

    console.warn = (...args: unknown[]) => {
      if (!shouldSuppress(args)) originalWarn.apply(console, args);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const msg: string = event.reason?.message ?? "";
      if (SUPPRESSED_PATTERNS.some((p) => msg.includes(p))) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Restore originals on unmount so the patch does not outlive the
    // component that installed it.
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return null;
}

/**
 * Legacy export alias — kept for backwards compatibility while callers are
 * updated to use the more descriptive `WalletNoiseFilter` name.
 *
 * @deprecated Use `WalletNoiseFilter` instead.
 */
export { WalletNoiseFilter as ErrorSuppressor };

/** Named export for direct use. */
export { WalletNoiseFilter };
