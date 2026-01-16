import { ConvexReactClient } from "convex/react";

// This will be set by environment variable in production
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || "";

if (!CONVEX_URL) {
  console.warn(
    "VITE_CONVEX_URL is not set. Please run 'npx convex dev' to get your Convex URL."
  );
}

export const convex = new ConvexReactClient(CONVEX_URL || "https://placeholder.convex.cloud");
