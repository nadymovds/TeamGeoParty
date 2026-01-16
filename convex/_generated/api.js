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

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
const fullApi = undefined;

export const api = new Proxy({}, {
  get: (_target, mod) => {
    return new Proxy({}, {
      get: (_target, func) => {
        return {
          _name: `${String(mod)}:${String(func)}`,
        };
      },
    });
  },
});

export const internal = new Proxy({}, {
  get: (_target, mod) => {
    return new Proxy({}, {
      get: (_target, func) => {
        return {
          _name: `${String(mod)}:${String(func)}`,
        };
      },
    });
  },
});

/* prettier-ignore-end */
