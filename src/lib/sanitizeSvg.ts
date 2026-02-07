/**
 * Sanitize SVG string to prevent XSS.
 * Strips script tags, event handlers, and dangerous URLs.
 */
export function sanitizeSvg(svg: string): string {
  // Remove <script> tags and content
  let clean = svg.replace(/<script[\s>][\s\S]*?<\/script>/gi, "");
  // Remove self-closing script tags
  clean = clean.replace(/<script[^>]*\/>/gi, "");
  // Remove on* event handler attributes (onload, onerror, onclick, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  // Remove javascript: URLs in href/xlink:href/src attributes
  clean = clean.replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "$1=\"\"");
  // Remove data: URLs that could contain scripts (allow data:image/)
  clean = clean.replace(/(href|src)\s*=\s*"data:(?!image\/)[^"]*"/gi, "$1=\"\"");
  clean = clean.replace(/(href|src)\s*=\s*'data:(?!image\/)[^']*'/gi, "$1=''");
  // Remove <iframe>, <object>, <embed>, <foreignObject> tags
  clean = clean.replace(/<(iframe|object|embed|foreignObject)[\s>][\s\S]*?<\/\1>/gi, "");
  clean = clean.replace(/<(iframe|object|embed|foreignObject)[^>]*\/>/gi, "");
  // Remove <use> tags with external references (can load external SVG)
  clean = clean.replace(/<use[^>]*href\s*=\s*"http[^"]*"[^>]*\/?>[\s\S]*?(<\/use>)?/gi, "");
  return clean;
}
