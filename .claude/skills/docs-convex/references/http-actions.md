# HTTP Actions

Custom endpoints for webhooks, file serving, and API routes.

---

## Basic Setup

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    await ctx.runMutation(internal.webhooks.process, { data: body });
    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

---

## Path Prefix Routing

```typescript
http.route({
  pathPrefix: "/api/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname; // parse route
    // ...
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});
```

---

## File Serving with Access Control

```typescript
http.route({
  pathPrefix: "/files/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = extractStorageId(url.pathname);

    const blob = await ctx.storage.get(storageId);
    if (!blob) return new Response("Not found", { status: 404 });

    return new Response(blob, {
      headers: {
        "Content-Type": blob.type,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  }),
});
```

Or redirect to storage URL:
```typescript
const url = await ctx.storage.getUrl(storageId);
if (!url) return new Response("Not found", { status: 404 });
return Response.redirect(url, 302);
```

---

## CORS

```typescript
// Handle preflight
http.route({
  pathPrefix: "/api/",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

// Add CORS headers to responses
function corsResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

---

## Limits

- 20MB request/response body
- No auto-retry on failure
- Same context as actions (`ctx.runQuery`, `ctx.runMutation`, `ctx.storage`)
- Validate request bodies with Zod or manual checks (no Convex validators for raw HTTP)
