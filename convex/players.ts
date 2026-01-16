import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const join = mutation({
  args: {
    gameId: v.id("games"),
    name: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "LOBBY") {
      throw new Error("Game already started");
    }

    // Check if player with this sessionId already exists
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();

    if (existingPlayer) {
      return existingPlayer._id;
    }

    const playerId = await ctx.db.insert("players", {
      gameId: args.gameId,
      name: args.name,
      isHost: false,
      isReady: false,
      totalScore: 0,
      sessionId: args.sessionId,
    });

    return playerId;
  },
});

export const list = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

export const setReady = mutation({
  args: {
    playerId: v.id("players"),
    isReady: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, {
      isReady: args.isReady,
    });
  },
});

export const getBySession = query({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();
  },
});
