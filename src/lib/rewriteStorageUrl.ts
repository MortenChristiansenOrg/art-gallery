const LOCAL_CONVEX = "http://127.0.0.1:3210";

/**
 * When using a tunneled Convex backend, storage URLs still point to 127.0.0.1:3210
 * which is unreachable from remote devices. Rewrite them to use VITE_CONVEX_URL.
 */
export function rewriteStorageUrl(url: string | null): string | null {
  if (!url || !url.startsWith(LOCAL_CONVEX)) return url;
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl || convexUrl.startsWith(LOCAL_CONVEX)) return url;
  return url.replace(LOCAL_CONVEX, convexUrl);
}
