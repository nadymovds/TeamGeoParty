/* prettier-ignore-start */

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 *
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as games from "../games";
import type * as guesses from "../guesses";
import type * as locations from "../locations";
import type * as players from "../players";
import type * as utils from "../utils";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * @example
 * ```ts
 * import { api } from "./_generated/api";
 *
 * await ctx.scheduler.runAfter(0, api.games.create, { name: "Game" });
 * ```
 */
declare const fullApi: ApiFromModules<{
  games: typeof games;
  guesses: typeof guesses;
  locations: typeof locations;
  players: typeof players;
  utils: typeof utils;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

/* prettier-ignore-end */
