import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    status: v.union(
      v.literal("LOBBY"),
      v.literal("SETUP"),
      v.literal("PLAYING"),
      v.literal("RESULTS"),
      v.literal("FINAL")
    ),
    googleApiKey: v.string(),
    activeLocationId: v.optional(v.id("locations")),
    settings: v.object({
      locationsPerPlayer: v.number(),
    }),
    currentRound: v.optional(v.number()),
    totalRounds: v.optional(v.number()),
  }),

  players: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    isHost: v.boolean(),
    isParticipating: v.optional(v.boolean()),
    isReady: v.boolean(),
    totalScore: v.number(),
    sessionId: v.string(),
    lastSeenAt: v.optional(v.number()), // Timestamp of last heartbeat
  }).index("by_game", ["gameId"]),

  locations: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    lat: v.number(),
    lng: v.number(),
    hint: v.string(),
    round: v.optional(v.number()),
  })
    .index("by_game", ["gameId"])
    .index("by_player", ["playerId"]),

  guesses: defineTable({
    locationId: v.id("locations"),
    playerId: v.id("players"),
    lat: v.number(),
    lng: v.number(),
    distance: v.number(),
    round: v.optional(v.number()),
  })
    .index("by_location", ["locationId"])
    .index("by_player", ["playerId"]),
});
