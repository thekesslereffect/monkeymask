/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crawler from "../crawler.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_nftCodec from "../lib/nftCodec.js";
import type * as nfts from "../nfts.js";
import type * as siwb from "../siwb.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crawler: typeof crawler;
  crons: typeof crons;
  http: typeof http;
  "lib/nftCodec": typeof lib_nftCodec;
  nfts: typeof nfts;
  siwb: typeof siwb;
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
