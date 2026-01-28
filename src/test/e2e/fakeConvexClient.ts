/**
 * Fake Convex client for E2E testing
 * Implements the minimal ConvexReactClient interface needed for the app
 */
import { getFunctionName, type FunctionReference, type FunctionArgs, type FunctionReturnType } from "convex/server";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  collections,
  artworks,
  messages,
  siteContent,
  TEST_PASSWORD,
  type ArtworkWithUrls,
} from "./mockData";

// Using Record for loose typing in test harness - handlers cast internally as needed
type QueryHandler = (args: Record<string, unknown>) => unknown;
type MutationHandler = (args: Record<string, unknown>) => Promise<unknown>;

// In-memory state for mutations
let messagesState = [...messages];
let siteContentState = { ...siteContent };

/** Reset state to initial values - call in test teardown to prevent cross-test leakage */
export function resetFakeConvexState(): void {
  messagesState = [...messages];
  siteContentState = { ...siteContent };
}

// Generate a valid token for test auth
function generateTestToken(): string {
  const timestamp = Date.now();
  return btoa(`${timestamp}:test-hash`);
}

// Query handlers
const queryHandlers: Record<string, QueryHandler> = {
  // collections.list
  "collections:list": () => {
    return collections.map((c) => ({
      ...c,
      // Remove artworkCount for list (not listWithCounts)
      artworkCount: undefined,
    }));
  },

  // collections.listWithCounts
  "collections:listWithCounts": () => {
    return collections;
  },

  // collections.getUncategorizedCount
  "collections:getUncategorizedCount": () => {
    return artworks.filter((a) => !a.collectionId && a.published).length;
  },

  // collections.getBySlug
  "collections:getBySlug": (args) => {
    const slug = args.slug as string;
    const collection = collections.find((c) => c.slug === slug);
    return collection ?? null;
  },

  // artworks.list
  "artworks:list": (args) => {
    let result = [...artworks];
    if (args.collectionId) {
      result = result.filter((a) => a.collectionId === args.collectionId);
    }
    if (args.publishedOnly) {
      result = result.filter((a) => a.published && a.thumbnailId && a.dziStatus === "complete");
    }
    return result.sort((a, b) => a.order - b.order);
  },

  // artworks.listUncategorized
  "artworks:listUncategorized": (args) => {
    let result = artworks.filter((a) => !a.collectionId);
    if (args.publishedOnly) {
      result = result.filter((a) => a.published && a.thumbnailId && a.dziStatus === "complete");
    }
    return result.sort((a, b) => a.order - b.order);
  },

  // artworks.get
  "artworks:get": (args): ArtworkWithUrls | null => {
    const artwork = artworks.find((a) => a._id === args.id);
    if (!artwork) return null;
    if (args.publishedOnly && (!artwork.published || !artwork.thumbnailId || artwork.dziStatus !== "complete")) {
      return null;
    }
    return artwork;
  },

  // messages.list
  "messages:list": () => {
    return [...messagesState].sort((a, b) => b.createdAt - a.createdAt);
  },

  // messages.unreadCount
  "messages:unreadCount": () => {
    return messagesState.filter((m) => !m.read).length;
  },

  // siteContent.get
  "siteContent:get": (args) => {
    const key = args.key as string;
    return siteContentState[key] ?? null;
  },

  // auth.validateSession
  "auth:validateSession": (args) => {
    try {
      const decoded = atob(args.token as string);
      const [timestampStr] = decoded.split(":");
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) return { valid: false };
      // Token valid for 24 hours
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return { valid: false };
      return { valid: true };
    } catch {
      return { valid: false };
    }
  },
};

// Mutation handlers
const mutationHandlers: Record<string, MutationHandler> = {
  // auth.login
  "auth:login": async (args) => {
    if (args.password === TEST_PASSWORD) {
      return { success: true, token: generateTestToken(), error: null };
    }
    return { success: false, token: null, error: "Invalid password" };
  },

  // messages.send
  "messages:send": async (args) => {
    const newId = `messages:msg${Date.now()}` as Id<"messages">;
    const newMessage = {
      _id: newId,
      _creationTime: Date.now(),
      name: args.name as string,
      email: args.email as string,
      message: args.message as string,
      read: false,
      createdAt: Date.now(),
    };
    messagesState.push(newMessage);
    return newId;
  },

  // messages.markRead
  "messages:markRead": async (args) => {
    const msg = messagesState.find((m) => m._id === args.id);
    if (msg) {
      msg.read = true;
    }
  },

  // messages.markAllRead
  "messages:markAllRead": async () => {
    messagesState.forEach((m) => {
      m.read = true;
    });
  },

  // messages.remove
  "messages:remove": async (args) => {
    messagesState = messagesState.filter((m) => m._id !== args.id);
  },

  // siteContent.set
  "siteContent:set": async (args) => {
    const key = args.key as string;
    siteContentState[key] = args.value as string;
  },

  // artworks.create, update, remove, reorder - stub implementations
  "artworks:create": async () => "artworks:new" as Id<"artworks">,
  "artworks:update": async () => undefined,
  "artworks:remove": async () => undefined,
  "artworks:reorder": async () => undefined,

  // collections.create, update, remove, reorder - stub implementations
  "collections:create": async () => "collections:new" as Id<"collections">,
  "collections:update": async () => undefined,
  "collections:remove": async () => undefined,
  "collections:reorder": async () => undefined,

  // files.generateUploadUrl - stub
  "files:generateUploadUrl": async () => "https://example.com/upload",
};

// Subscriber type for watch functionality
type Subscriber = {
  callback: () => void;
  queryKey: string;
  args: Record<string, unknown>;
  cacheKey: string;
};

/**
 * Fake ConvexReactClient that mimics the real client's behavior
 * using in-memory mock data
 */
export class FakeConvexClient {
  private subscribers: Set<Subscriber> = new Set();
  private queryCache: Map<string, unknown> = new Map();

  // Required by ConvexProvider - matches Watch<T> interface
  watchQuery<Query extends FunctionReference<"query", "public" | "internal">>(
    query: Query,
    ...argsAndOptions: [args?: FunctionArgs<Query> | "skip"]
  ): {
    onUpdate: (callback: () => void) => () => void;
    localQueryResult: () => FunctionReturnType<Query> | undefined;
    journal: () => undefined;
  } {
    const args = argsAndOptions[0] ?? {};
    const queryName = this.getQueryName(query);
    const cacheKey = JSON.stringify({ queryName, args });

    // Pre-populate cache if args are not "skip"
    if (args !== "skip") {
      const handler = queryHandlers[queryName];
      if (handler) {
        const result = handler(args);
        this.queryCache.set(cacheKey, result);
      }
    }

    return {
      onUpdate: (callback: () => void) => {
        if (args === "skip") {
          return () => {};
        }

        const subscriber: Subscriber = {
          callback,
          queryKey: queryName,
          args,
          cacheKey,
        };
        this.subscribers.add(subscriber);

        // Call callback once to trigger initial render
        // Use microtask to ensure it's after the hook setup
        queueMicrotask(() => {
          callback();
        });

        return () => {
          this.subscribers.delete(subscriber);
        };
      },
      localQueryResult: (): FunctionReturnType<Query> | undefined => {
        if (args === "skip") return undefined;
        return this.queryCache.get(cacheKey) as FunctionReturnType<Query> | undefined;
      },
      journal: () => undefined,
    };
  }

  // Execute a mutation
  async mutation<Mutation extends FunctionReference<"mutation", "public" | "internal">>(
    mutation: Mutation,
    ...argsAndOptions: [args?: FunctionArgs<Mutation>]
  ): Promise<FunctionReturnType<Mutation>> {
    const args = argsAndOptions[0] ?? {};
    const mutationName = this.getMutationName(mutation);
    const handler = mutationHandlers[mutationName];

    if (handler) {
      const result = await handler(args);
      // Refresh affected queries and notify subscribers
      this.refreshQueries();
      return result as FunctionReturnType<Mutation>;
    }

    console.warn(`No handler for mutation: ${mutationName}`);
    return undefined as FunctionReturnType<Mutation>;
  }

  // Get function name from reference using Convex's getFunctionName utility
  private getQueryName(fn: FunctionReference<"query", "public" | "internal">): string {
    return getFunctionName(fn);
  }

  private getMutationName(fn: FunctionReference<"mutation", "public" | "internal">): string {
    return getFunctionName(fn);
  }

  // Refresh all cached queries and notify subscribers
  private refreshQueries(): void {
    this.subscribers.forEach((subscriber) => {
      const handler = queryHandlers[subscriber.queryKey];
      if (handler) {
        const result = handler(subscriber.args);
        this.queryCache.set(subscriber.cacheKey, result);
        subscriber.callback();
      }
    });
  }

  // Required interface methods (stubs)
  setAuth(): void {}
  clearAuth(): void {}
  action(): Promise<unknown> {
    return Promise.resolve(undefined);
  }
  connectionState() {
    return { hasInflightRequests: false, isWebSocketConnected: true };
  }
  subscribeToConnectionState(cb: () => void) {
    cb();
    return () => {};
  }
}

// Export singleton instance
export const fakeConvexClient = new FakeConvexClient();
