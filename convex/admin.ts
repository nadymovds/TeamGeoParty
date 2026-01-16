import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const setParticipating = mutation({
  args: {
    playerId: v.id("players"),
    isParticipating: v.boolean(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player || !player.isHost) {
      throw new Error("Only host can change participation");
    }

    await ctx.db.patch(args.playerId, {
      isParticipating: args.isParticipating,
    });
  },
});

export const resetGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    // Delete all guesses
    const guesses = await ctx.db
      .query("guesses")
      .collect();

    for (const guess of guesses) {
      const location = await ctx.db.get(guess.locationId);
      if (location && location.gameId === args.gameId) {
        await ctx.db.delete(guess._id);
      }
    }

    // Delete all locations
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const location of locations) {
      await ctx.db.delete(location._id);
    }

    // Reset all players
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const player of players) {
      await ctx.db.patch(player._id, {
        isReady: false,
        totalScore: 0,
      });
    }

    // Reset game to LOBBY
    await ctx.db.patch(args.gameId, {
      status: "LOBBY",
      activeLocationId: undefined,
      currentRound: undefined,
      totalRounds: undefined,
    });
  },
});
