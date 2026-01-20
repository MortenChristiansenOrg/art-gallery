/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as artworks from "../artworks.js";
import type * as auth from "../auth.js";
import type * as dzi from "../dzi.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as messages from "../messages.js";
import type * as series from "../series.js";
import type * as siteContent from "../siteContent.js";
import type * as tiles from "../tiles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  artworks: typeof artworks;
  auth: typeof auth;
  dzi: typeof dzi;
  files: typeof files;
  http: typeof http;
  images: typeof images;
  messages: typeof messages;
  series: typeof series;
  siteContent: typeof siteContent;
  tiles: typeof tiles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
