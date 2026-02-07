/**
 * Decode HTML entities to prevent entity-encoded XSS bypasses.
 * Handles &#xHH;, &#DDD;, and &name; forms.
 */
function decodeEntities(str: string): string {
  const named: Record<string, string> = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
    "&apos;": "'", "&tab;": "\t", "&newline;": "\n",
  };
  // Decode hex entities: &#x6A; &#x006A; (optional semicolons)
  let decoded = str.replace(/&#x([0-9a-f]{1,6});?/gi, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );
  // Decode decimal entities: &#106; &#0000106; (optional semicolons)
  decoded = decoded.replace(/&#(\d{1,7});?/g, (_, dec) =>
    String.fromCodePoint(parseInt(dec, 10))
  );
  // Decode named entities
  decoded = decoded.replace(/&\w+;/gi, (m) => named[m.toLowerCase()] ?? m);
  return decoded;
}

/**
 * Sanitize SVG string to prevent stored XSS.
 * Decodes entities first to block encoded bypasses, then strips dangerous patterns.
 */
export function sanitizeSvg(svg: string): string {
  // Normalize entities before regex matching to prevent encoded bypasses
  let clean = decodeEntities(svg);
  clean = clean.replace(/<script[\s>][\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<script[^>]*\/>/gi, "");
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  clean = clean.replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "$1=\"\"");
  clean = clean.replace(/(href|src)\s*=\s*"data:(?!image\/)[^"]*"/gi, "$1=\"\"");
  clean = clean.replace(/(href|src)\s*=\s*'data:(?!image\/)[^']*'/gi, "$1=''");
  clean = clean.replace(/<(iframe|object|embed|foreignObject|math|annotation-xml)[\s>][\s\S]*?<\/\1>/gi, "");
  clean = clean.replace(/<(iframe|object|embed|foreignObject|math|annotation-xml)[^>]*\/>/gi, "");
  clean = clean.replace(/<set\s[^>]*attributeName\s*=\s*["']on\w+["'][^>]*\/?>/gi, "");
  clean = clean.replace(/<use[^>]*href\s*=\s*"http[^"]*"[^>]*\/?>[\s\S]*?(<\/use>)?/gi, "");
  return clean;
}
