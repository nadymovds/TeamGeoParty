import React, { useEffect } from "react";
import { ConvexProvider } from "convex/react";
import { convex } from "./convexClient";
import { CreateGameScreen } from "./screens/CreateGameScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { GuessScreen } from "./screens/GuessScreen";
import { RoundResultScreen } from "./screens/RoundResultScreen";
import { FinalScreen } from "./screens/FinalScreen";
import { getGameIdFromUrl, getSessionId } from "./utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";
import { GoogleMapsProvider } from "./contexts/GoogleMapsContext";

const GameRouter: React.FC = () => {
  const gameIdFromUrl = getGameIdFromUrl();

  if (!gameIdFromUrl) {
    return <CreateGameScreen />;
  }

  return <GameContent gameId={gameIdFromUrl as Id<"games">} />;
};

const GameContent: React.FC<{ gameId: Id<"games"> }> = ({ gameId }) => {
  const sessionId = getSessionId();
  const game = useQuery(api.games.get, { gameId });
  const apiKey = useQuery(api.games.getApiKey, { gameId, sessionId });

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  // LobbyScreen doesn't need Google Maps - allow anyone with link to join
  if (game.status === "LOBBY") {
    return <LobbyScreen gameId={gameId} />;
  }

  // For other screens, require API key (participant access)
  if (apiKey === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  if (apiKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">
          Error: no access to the game. Join via the link from the host.
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsProvider apiKey={apiKey}>
      <GameContentInner game={game} gameId={gameId} />
    </GoogleMapsProvider>
  );
};

// Game type without googleApiKey (it's fetched separately for security)
type GameWithoutApiKey = Omit<Doc<"games">, "googleApiKey">;

interface GameContentInnerProps {
  game: GameWithoutApiKey;
  gameId: Id<"games">;
}

// Seeded random shuffle for consistent order based on gameId
const seededShuffle = <T,>(array: T[], seed: string): T[] => {
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

const GameContentInner: React.FC<GameContentInnerProps> = ({ game, gameId }) => {
  const players = useQuery(api.players.list, { gameId });
  const locations = useQuery(api.locations.list, { gameId });
  const startRound = useMutation(api.games.startRound);
  const finishRound = useMutation(api.games.finishRound);
  const updateHeartbeat = useMutation(api.players.updateHeartbeat);

  // Send heartbeat every 5 seconds to track online status
  useEffect(() => {
    const sessionId = getSessionId();

    // Send initial heartbeat
    updateHeartbeat({ gameId, sessionId });

    // Set up interval for periodic heartbeats
    const interval = setInterval(() => {
      updateHeartbeat({ gameId, sessionId });
    }, 5000);

    return () => clearInterval(interval);
  }, [gameId, updateHeartbeat]);

  // Auto-start first round when all players are ready and game is in SETUP
  useEffect(() => {
    if (
      game.status === "SETUP" &&
      players &&
      locations &&
      players.every((p) => p.isReady) &&
      locations.length > 0
    ) {
      // Shuffle locations randomly based on gameId for consistent order
      const shuffledLocations = seededShuffle(locations, gameId);

      // Increased delay to ensure Google Maps API is loaded
      const timer = setTimeout(async () => {
        const firstLocation = shuffledLocations[0];
        if (firstLocation) {
          await startRound({
            gameId,
            locationId: firstLocation._id,
            round: 1,
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game.status, players, locations, gameId, startRound]);

  // Auto-finish round when all players have guessed
  const guesses = useQuery(
    api.guesses.list,
    game.activeLocationId
      ? { locationId: game.activeLocationId }
      : "skip"
  );

  useEffect(() => {
    if (
      game.status === "PLAYING" &&
      players &&
      guesses &&
      game.activeLocationId
    ) {
      // Only count participating players
      const participatingPlayers = players.filter(p => p.isParticipating !== false);

      // All participating players have guessed, automatically finish the round
      if (guesses.length >= participatingPlayers.length && participatingPlayers.length > 0) {
        const timer = setTimeout(async () => {
          await finishRound({ gameId });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [game.status, players, guesses, game.activeLocationId, gameId, finishRound]);

  // Auto-finish game disabled - host controls transition to final screen via HostMenu

  const renderScreen = () => {
    switch (game.status) {
      case "LOBBY":
        return <LobbyScreen gameId={gameId} />;
      case "SETUP":
        return <SetupScreen gameId={gameId} />;
      case "PLAYING":
        return <GuessScreen gameId={gameId} />;
      case "RESULTS":
        return <RoundResultScreen gameId={gameId} />;
      case "FINAL":
        return <FinalScreen gameId={gameId} />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl">Unknown game status</div>
          </div>
        );
    }
  };

  return renderScreen();
};

function App() {
  return (
    <ConvexProvider client={convex}>
      <GameRouter />
    </ConvexProvider>
  );
}

export default App;
