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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryHandler = (args: any) => any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationHandler = (args: any) => Promise<any>;

// In-memory state for mutations
let messagesState = [...messages];
let siteContentState = { ...siteContent };

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
  "collections:getBySlug": (args: { slug: string }) => {
    const collection = collections.find((c) => c.slug === args.slug);
    return collection ?? null;
  },

  // artworks.list
  "artworks:list": (args: { collectionId?: Id<"collections">; publishedOnly?: boolean }) => {
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
  "artworks:listUncategorized": (args: { publishedOnly?: boolean }) => {
    let result = artworks.filter((a) => !a.collectionId);
    if (args.publishedOnly) {
      result = result.filter((a) => a.published && a.thumbnailId && a.dziStatus === "complete");
    }
    return result.sort((a, b) => a.order - b.order);
  },

  // artworks.get
  "artworks:get": (args: { id: Id<"artworks">; publishedOnly?: boolean }): ArtworkWithUrls | null => {
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
  "siteContent:get": (args: { key: string }) => {
    return siteContentState[args.key] ?? null;
  },

  // auth.validateSession
  "auth:validateSession": (args: { token: string }) => {
    try {
      const decoded = atob(args.token);
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
  "auth:login": async (args: { password: string }) => {
    if (args.password === TEST_PASSWORD) {
      return { success: true, token: generateTestToken(), error: null };
    }
    return { success: false, token: null, error: "Invalid password" };
  },

  // messages.send
  "messages:send": async (args: { name: string; email: string; message: string }) => {
    const newId = `messages:msg${Date.now()}` as Id<"messages">;
    const newMessage = {
      _id: newId,
      _creationTime: Date.now(),
      name: args.name,
      email: args.email,
      message: args.message,
      read: false,
      createdAt: Date.now(),
    };
    messagesState.push(newMessage);
    return newId;
  },

  // messages.markRead
  "messages:markRead": async (args: { token: string; id: Id<"messages"> }) => {
    const msg = messagesState.find((m) => m._id === args.id);
    if (msg) {
      msg.read = true;
    }
  },

  // messages.markAllRead
  "messages:markAllRead": async (_args: { token: string }) => {
    messagesState.forEach((m) => {
      m.read = true;
    });
  },

  // messages.remove
  "messages:remove": async (args: { token: string; id: Id<"messages"> }) => {
    messagesState = messagesState.filter((m) => m._id !== args.id);
  },

  // siteContent.set
  "siteContent:set": async (args: { token: string; key: string; value: string }) => {
    siteContentState[args.key] = args.value;
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
  args: unknown;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watchQuery<Query extends FunctionReference<"query", any>>(
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async mutation<Mutation extends FunctionReference<"mutation", any>>(
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getQueryName(fn: FunctionReference<"query", any>): string {
    return getFunctionName(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getMutationName(fn: FunctionReference<"mutation", any>): string {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action(): Promise<any> {
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
