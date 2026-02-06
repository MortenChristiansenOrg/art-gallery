# Action-Mutation Pipeline

Core pattern: mutations own state, actions do work.

---

## Why This Pattern

- Mutations are atomic (all-or-nothing). Actions can fail partway.
- Scheduling from mutations is atomic with the transaction.
- Actions cannot be retried by the UI — only mutations can be called from frontend.

---

## Basic Flow

```
1. Frontend calls mutation
2. Mutation writes intent to DB + schedules action
3. Action does work (API calls, image processing, etc.)
4. Action calls back into mutation to save result
5. Mutation optionally schedules next action (chaining)
```

---

## Entry Point (Public Mutation)

```typescript
export const start = mutation({
  args: { token: v.string(), artworkId: v.id("artworks") },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    await ctx.db.patch(args.artworkId, {
      status: "processing",
      startedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.processingActions.doWork, {
      artworkId: args.artworkId,
    });
  },
});
```

---

## Worker Action

```typescript
"use node";
import { internalAction } from "./_generated/server";

export const doWork = internalAction({
  args: { artworkId: v.id("artworks") },
  handler: async (ctx, args) => {
    try {
      // Read current state
      const artwork = await ctx.runQuery(internal.artworks.getInternal, {
        id: args.artworkId,
      });
      if (!artwork) return; // deleted while queued

      // Do work
      const result = await someExpensiveOperation(artwork);

      // Success callback
      await ctx.runMutation(internal.processing.onComplete, {
        artworkId: args.artworkId,
        result,
      });
    } catch (err) {
      // Error callback
      await ctx.runMutation(internal.processing.onFailed, {
        artworkId: args.artworkId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
});
```

---

## Callback Mutations

```typescript
export const onComplete = internalMutation({
  args: { artworkId: v.id("artworks"), result: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.artworkId, {
      status: "complete",
      result: args.result,
    });
  },
});

export const onFailed = internalMutation({
  args: { artworkId: v.id("artworks"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.artworkId, {
      status: "failed",
      error: args.error,
    });
  },
});
```

---

## Batch Processing with Chaining

When work is too large for a single action, chain via mutations:

```typescript
// Mutation: save batch result + schedule next
export const onBatchComplete = internalMutation({
  args: {
    artworkId: v.id("artworks"),
    completedCount: v.number(),
    remainingItems: v.array(v.object({ /* ... */ })),
  },
  handler: async (ctx, args) => {
    const artwork = await ctx.db.get(args.artworkId);
    const total = (artwork?.completed ?? 0) + args.completedCount;

    if (args.remainingItems.length > 0) {
      // Heartbeat: update timestamp for stuck detection
      await ctx.db.patch(args.artworkId, {
        completed: total,
        startedAt: Date.now(), // reset for stuck detection
      });
      // Schedule next batch
      const batch = args.remainingItems.slice(0, BATCH_SIZE);
      const remaining = args.remainingItems.slice(BATCH_SIZE);
      await ctx.scheduler.runAfter(0, internal.actions.processBatch, {
        artworkId: args.artworkId,
        items: batch,
        remainingItems: remaining,
      });
    } else {
      await ctx.db.patch(args.artworkId, {
        status: "complete",
        completed: total,
      });
    }
  },
});
```

---

## Stuck Detection (Cron)

```typescript
export const checkStuck = internalMutation({
  handler: async (ctx) => {
    const items = await ctx.db.query("artworks")
      .withIndex("by_status", q => q.eq("status", "processing"))
      .collect();

    const now = Date.now();
    for (const item of items) {
      const elapsed = item.startedAt ? now - item.startedAt : Infinity;
      if (elapsed > STUCK_TIMEOUT_MS) {
        if ((item.retryCount ?? 0) < MAX_RETRIES) {
          await ctx.db.patch(item._id, {
            startedAt: Date.now(),
            retryCount: (item.retryCount ?? 0) + 1,
          });
          await ctx.scheduler.runAfter(0, internal.actions.doWork, {
            artworkId: item._id,
          });
        } else {
          await ctx.db.patch(item._id, {
            status: "failed",
            error: `Timed out after ${MAX_RETRIES} retries`,
          });
        }
      }
    }
  },
});
```

---

## Key Principles

1. **All state changes in mutations** — never update DB from actions
2. **Heartbeat timestamps** — reset on each batch so cron knows work is progressing
3. **Guard checks in actions** — verify doc still exists/unchanged before doing work
4. **Always try/catch in actions** — call error mutation on failure
5. **Use `internal.`** — never `api.` for scheduled or server-to-server calls
6. **Idempotency** — actions may run more than once; design for it
