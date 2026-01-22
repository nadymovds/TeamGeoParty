import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Seeded random shuffle for consistent order based on gameId
const seededShuffle = <T>(array: T[], seed: string): T[] => {
  const result = [...array];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash) + i;
    hash = hash & hash;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

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
      isParticipating: true,
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
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    // Don't expose googleApiKey in the main query
    const { googleApiKey: _, ...gameWithoutKey } = game;
    return gameWithoutKey;
  },
});

// Separate query for API key - only returns to game participants
export const getApiKey = query({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    // Check if the requester is a participant in this game
    const player = await ctx.db
      .query("players")
      .withIndex("by_session", (q) =>
        q.eq("gameId", args.gameId).eq("sessionId", args.sessionId)
      )
      .first();

    // Only return API key to game participants
    if (!player) {
      return null;
    }

    return game.googleApiKey;
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
      timerEnd: undefined,
      timerDuration: undefined,
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

export const forceNextRound = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    try {
      console.log("forceNextRound: Starting mutation");
      const game = await ctx.db.get(args.gameId);
      if (!game) {
        throw new Error("Game not found");
      }
      console.log("forceNextRound: Game status =", game.status);

      // Get all locations sorted consistently
      console.log("forceNextRound: Fetching locations");
      const locations = await ctx.db
        .query("locations")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .collect();

      if (locations.length === 0) {
        throw new Error("No locations found for this game");
      }
      console.log("forceNextRound: Found", locations.length, "locations");

      // Shuffle locations randomly based on gameId for consistent order
      const shuffledLocations = seededShuffle(locations, args.gameId);

      // Get all players and filter participating ones
      console.log("forceNextRound: Fetching players");
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .collect();

      // Filter participating players (handle optional field safely)
      const players = allPlayers.filter(p => p.isParticipating !== false);
      console.log("forceNextRound: Found", players.length, "participating players");

      if (game.status === "PLAYING" && game.activeLocationId) {
        console.log("forceNextRound: Processing PLAYING state");
        // Explicitly check activeLocationId exists
        const activeLocationId = game.activeLocationId;
        if (!activeLocationId) {
          throw new Error("No active location in PLAYING state");
        }

        // Create dummy guesses for players who haven't guessed yet
        console.log("forceNextRound: Checking for missing guesses");
        const guesses = await ctx.db
          .query("guesses")
          .withIndex("by_location", (q) => q.eq("locationId", activeLocationId))
          .collect();

        const playersWhoGuessed = new Set(guesses.map((g) => g.playerId));

        for (const player of players) {
          if (!playersWhoGuessed.has(player._id)) {
            console.log("forceNextRound: Creating dummy guess for player", player.name);
            // Create a dummy guess with maximum distance (0 points)
            await ctx.db.insert("guesses", {
              locationId: activeLocationId,
              playerId: player._id,
              lat: 0,
              lng: 0,
              distance: 99999,
              round: game.currentRound ?? 1,
            });
          }
        }

        // Calculate scores for all guesses (including dummy ones)
        console.log("forceNextRound: Calculating scores");
        const allGuesses = await ctx.db
          .query("guesses")
          .withIndex("by_location", (q) => q.eq("locationId", activeLocationId))
          .collect();

        const maxDistance = 20000;
        const maxPoints = 1000;

        for (const guess of allGuesses) {
          const points = Math.max(
            0,
            Math.floor(maxPoints * (1 - guess.distance / maxDistance))
          );

          // Validate points is a finite number
          if (!Number.isFinite(points)) {
            console.error("Invalid points calculated:", points, "for guess:", guess);
            continue;
          }

          const player = await ctx.db.get(guess.playerId);
          if (player) {
            const newScore = player.totalScore + points;
            if (!Number.isFinite(newScore)) {
              console.error("Invalid new score:", newScore, "for player:", player);
              continue;
            }
            console.log("forceNextRound: Updating score for player", player.name, ":", player.totalScore, "->", newScore);
            await ctx.db.patch(guess.playerId, {
              totalScore: newScore,
            });
          }
        }

        // Transition to RESULTS to show the round results screen
        console.log("forceNextRound: Transitioning to RESULTS");
        await ctx.db.patch(args.gameId, {
          status: "RESULTS",
        });
        console.log("forceNextRound: Successfully moved to RESULTS");
      } else if (game.status === "RESULTS") {
        console.log("forceNextRound: Processing RESULTS state");
        // Currently in RESULTS, move to next round
        if (!game.activeLocationId) {
          throw new Error("No active location in RESULTS state");
        }

        const currentIndex = shuffledLocations.findIndex(
          (loc) => loc._id === game.activeLocationId
        );

        if (currentIndex !== -1 && currentIndex < shuffledLocations.length - 1) {
          const nextLocation = shuffledLocations[currentIndex + 1];
          console.log("forceNextRound: Moving to next round with location", nextLocation.hint);
          await ctx.db.patch(args.gameId, {
            status: "PLAYING",
            activeLocationId: nextLocation._id,
            currentRound: (game.currentRound ?? 1) + 1,
            timerEnd: undefined,
            timerDuration: undefined,
          });
          console.log("forceNextRound: Successfully moved to next round");
        } else {
          console.log("forceNextRound: No more locations, finishing game");
          // No more locations, finish game
          await ctx.db.patch(args.gameId, {
            status: "FINAL",
          });
          console.log("forceNextRound: Game finished");
        }
      } else {
        throw new Error(`Cannot force next round from status: ${game.status}`);
      }
    } catch (error) {
      console.error("Error in forceNextRound:", error);
      throw error;
    }
  },
});

export const forceStartGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "SETUP") {
      throw new Error("Game is not in SETUP state");
    }

    // Get all locations
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    if (locations.length === 0) {
      throw new Error("Нужна хотя бы одна локация для начала игры");
    }

    // Shuffle locations randomly based on gameId for consistent order
    const shuffledLocations = seededShuffle(locations, args.gameId);

    const firstLocation = shuffledLocations[0];

    // Start the first round
    await ctx.db.patch(args.gameId, {
      status: "PLAYING",
      activeLocationId: firstLocation._id,
      currentRound: 1,
      timerEnd: undefined,
      timerDuration: undefined,
    });
  },
});

export const forceFinishGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    try {
      // Validate game exists
      const game = await ctx.db.get(args.gameId);
      if (!game) {
        throw new Error("Game not found");
      }

      // Force finish game from any state
      await ctx.db.patch(args.gameId, {
        status: "FINAL",
      });
    } catch (error) {
      console.error("Error in forceFinishGame:", error);
      throw error;
    }
  },
});

export const startTimer = mutation({
  args: {
    gameId: v.id("games"),
    durationSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const now = Date.now();
    const timerEnd = now + args.durationSeconds * 1000;

    await ctx.db.patch(args.gameId, {
      timerEnd,
      timerDuration: args.durationSeconds,
    });
  },
});

export const stopTimer = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    await ctx.db.patch(args.gameId, {
      timerEnd: undefined,
      timerDuration: undefined,
    });
  },
});

export const addTimeToTimer = mutation({
  args: {
    gameId: v.id("games"),
    additionalSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !game.timerEnd) {
      throw new Error("No active timer");
    }

    const newTimerEnd = game.timerEnd + args.additionalSeconds * 1000;

    await ctx.db.patch(args.gameId, {
      timerEnd: newTimerEnd,
      timerDuration: (newTimerEnd - Date.now()) / 1000,
    });
  },
});
