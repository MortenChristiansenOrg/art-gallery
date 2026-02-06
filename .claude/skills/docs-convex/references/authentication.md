# Authentication

Auth patterns for Convex functions.

---

## Check Auth in Functions

### Built-in Auth (Clerk, Auth0, etc.)

```typescript
export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");
    // identity.tokenIdentifier, identity.name, identity.email, etc.
    await ctx.db.insert("posts", {
      text: args.text,
      authorId: identity.tokenIdentifier,
    });
  },
});
```

### Custom Token Auth (This Project)

```typescript
// convex/auth.ts
export function requireAuth(token: string | undefined): void {
  if (!token || !validateToken(token)) {
    throw new Error("Unauthorized");
  }
}

// Usage — destructure to remove token from DB writes
export const update = mutation({
  args: { id: v.id("artworks"), token: v.string(), title: v.string() },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    const { id, token: _, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
```

---

## Custom Function Wrappers (Middleware)

Using `convex-helpers`:

```typescript
import { customMutation, customCtx } from "convex-helpers/server/customFunctions";

export const authedMutation = customMutation(mutation,
  customCtx(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");
    const user = await ctx.db.query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError("User not found");
    return { user };
  })
);

// Usage — ctx.user is available and typed
export const createPost = authedMutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("posts", { text: args.text, authorId: ctx.user._id });
  },
});
```

---

## RBAC Pattern

```typescript
async function requireRole(
  ctx: QueryCtx,
  userId: Id<"users">,
  teamId: Id<"teams">,
  requiredRole: "admin" | "editor" | "viewer"
) {
  const membership = await ctx.db.query("teamMembership")
    .withIndex("by_team_user", q => q.eq("teamId", teamId).eq("userId", userId))
    .unique();
  if (!membership || roleLevel(membership.role) < roleLevel(requiredRole)) {
    throw new ConvexError({ kind: "authorization" });
  }
}
```

---

## Key Principles

- **Never trust client data** for access control — always verify server-side
- **Frontend auth checks are UX only**, not security
- **Use `internal.`** for scheduled functions — auth context is NOT propagated
- **Pass user data explicitly** when scheduling actions
- Public functions validate args; internal functions can skip (but recommended to keep)
