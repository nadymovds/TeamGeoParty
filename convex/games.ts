import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    hostName: v.string(),
    googleApiKey: v.string(),
    locationsPerPlayer: v.optional(v.number()),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const gameId = await ctx.db.insert("games", {
      status: "LOBBY",
      googleApiKey: args.googleApiKey,
      settings: {
        locationsPerPlayer: args.locationsPerPlayer ?? 3,
      },
    });

    const playerId = await ctx.db.insert("players", {
      gameId,
      name: args.hostName,
      isHost: true,
      isReady: false,
      totalScore: 0,
      sessionId: args.sessionId,
    });

    return { gameId, playerId };
  },
});

export const get = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const startSetup = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "LOBBY") {
      throw new Error("Game not found or not in LOBBY state");
    }

    await ctx.db.patch(args.gameId, {
      status: "SETUP",
    });
  },
});

export const startRound = mutation({
  args: {
    gameId: v.id("games"),
    locationId: v.id("locations"),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    await ctx.db.patch(args.gameId, {
      status: "PLAYING",
      activeLocationId: args.locationId,
      currentRound: args.round,
    });
  },
});

export const finishRound = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !game.activeLocationId) {
      throw new Error("Game not found or no active location");
    }

    // Calculate scores for all guesses
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_location", (q) => q.eq("locationId", game.activeLocationId!))
      .collect();

    const location = await ctx.db.get(game.activeLocationId!);
    if (!location) {
      throw new Error("Location not found");
    }

    // Update player scores based on distance (closer = better)
    // Scoring: max points for perfect guess, decreasing linearly
    const maxDistance = 20000; // 20,000 km (half Earth's circumference)
    const maxPoints = 1000;

    for (const guess of guesses) {
      const points = Math.max(
        0,
        Math.floor(maxPoints * (1 - guess.distance / maxDistance))
      );

      const player = await ctx.db.get(guess.playerId);
      if (player) {
        await ctx.db.patch(guess.playerId, {
          totalScore: player.totalScore + points,
        });
      }
    }

    await ctx.db.patch(args.gameId, {
      status: "RESULTS",
    });
  },
});

export const finishGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, {
      status: "FINAL",
    });
  },
});
