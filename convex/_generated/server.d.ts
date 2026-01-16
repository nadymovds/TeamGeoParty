/* prettier-ignore-start */

/* eslint-disable */
/**
 * Generated server-side `ConvexAuth` utilities.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 *
 * @module
 */

import { ConvexError } from "convex/values";

/**
 * An error thrown by ConvexAuth with an error code and optional message.
 */
export class ConvexAuthError extends ConvexError {
  constructor(errorCode: string, message?: string) {
    super({ code: errorCode, message });
  }
}

/**
 * An error thrown by ConvexAuth when an auth token is invalid or expired.
 */
export class ConvexAuthTokenError extends ConvexAuthError {
  constructor(message?: string) {
    super("INVALID_TOKEN", message);
  }
}

/* prettier-ignore-end */
