import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const add = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    lat: v.number(),
    lng: v.number(),
    hint: v.string(),
  },
  handler: async (ctx, args) => {
    const locationId = await ctx.db.insert("locations", {
      gameId: args.gameId,
      playerId: args.playerId,
      lat: args.lat,
      lng: args.lng,
      hint: args.hint,
    });

    return locationId;
  },
});

export const list = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("locations")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

export const get = query({
  args: { locationId: v.id("locations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.locationId);
  },
});

export const getByPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("locations")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
  },
});

export const getActive = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !game.activeLocationId) {
      return null;
    }

    return await ctx.db.get(game.activeLocationId);
  },
});

export const remove = mutation({
  args: { locationId: v.id("locations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.locationId);
  },
});
