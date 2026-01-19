import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { haversineDistance } from "./utils";

export const submit = mutation({
  args: {
    locationId: v.id("locations"),
    playerId: v.id("players"),
    lat: v.number(),
    lng: v.number(),
    round: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the actual location
    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    // Calculate distance
    const distance = haversineDistance(
      location.lat,
      location.lng,
      args.lat,
      args.lng
    );

    // Check if guess already exists
    const existingGuess = await ctx.db
      .query("guesses")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();

    if (existingGuess) {
      // Update existing guess
      await ctx.db.patch(existingGuess._id, {
        lat: args.lat,
        lng: args.lng,
        distance,
        round: args.round,
      });
      return existingGuess._id;
    }

    // Create new guess
    const guessId = await ctx.db.insert("guesses", {
      locationId: args.locationId,
      playerId: args.playerId,
      lat: args.lat,
      lng: args.lng,
      distance,
      round: args.round,
    });

    return guessId;
  },
});

export const list = query({
  args: { locationId: v.id("locations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guesses")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .collect();
  },
});

export const getByPlayer = query({
  args: {
    locationId: v.id("locations"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guesses")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();
  },
});

export const listByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    // Get all locations for the game
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Get all guesses for each location
    const allGuesses = [];
    for (const location of locations) {
      const guesses = await ctx.db
        .query("guesses")
        .withIndex("by_location", (q) => q.eq("locationId", location._id))
        .collect();
      allGuesses.push(...guesses);
    }

    return allGuesses;
  },
});
