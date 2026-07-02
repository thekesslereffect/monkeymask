/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as exploreSites from "../exploreSites.js";
import type * as exploreSitesActions from "../exploreSitesActions.js";
import type * as http from "../http.js";
import type * as lib_explorePreview from "../lib/explorePreview.js";
import type * as lib_exploreSeedData from "../lib/exploreSeedData.js";
import type * as siwb from "../siwb.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  exploreSites: typeof exploreSites;
  exploreSitesActions: typeof exploreSitesActions;
  http: typeof http;
  "lib/explorePreview": typeof lib_explorePreview;
  "lib/exploreSeedData": typeof lib_exploreSeedData;
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
