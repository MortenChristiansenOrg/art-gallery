/**
 * Sanitize SVG string to prevent stored XSS.
 * Strips script tags, event handlers, and dangerous URLs.
 */
export function sanitizeSvg(svg: string): string {
  let clean = svg.replace(/<script[\s>][\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<script[^>]*\/>/gi, "");
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  clean = clean.replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "$1=\"\"");
  clean = clean.replace(/(href|src)\s*=\s*"data:(?!image\/)[^"]*"/gi, "$1=\"\"");
  clean = clean.replace(/(href|src)\s*=\s*'data:(?!image\/)[^']*'/gi, "$1=''");
  clean = clean.replace(/<(iframe|object|embed|foreignObject)[\s>][\s\S]*?<\/\1>/gi, "");
  clean = clean.replace(/<(iframe|object|embed|foreignObject)[^>]*\/>/gi, "");
  clean = clean.replace(/<use[^>]*href\s*=\s*"http[^"]*"[^>]*\/?>[\s\S]*?(<\/use>)?/gi, "");
  return clean;
}
