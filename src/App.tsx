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
  const game = useQuery(api.games.get, { gameId });

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка игры...</div>
      </div>
    );
  }

  return (
    <GoogleMapsProvider apiKey={game.googleApiKey}>
      <GameContentInner game={game} gameId={gameId} />
    </GoogleMapsProvider>
  );
};

interface GameContentInnerProps {
  game: Doc<"games">;
  gameId: Id<"games">;
}

const GameContentInner: React.FC<GameContentInnerProps> = ({ game, gameId }) => {
  const players = useQuery(api.players.list, { gameId });
  const locations = useQuery(api.locations.list, { gameId });
  const startRound = useMutation(api.games.startRound);
  const finishRound = useMutation(api.games.finishRound);
  const finishGame = useMutation(api.games.finishGame);
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
      // Sort locations for consistent order
      const sortedLocations = [...locations].sort((a, b) =>
        a.hint.localeCompare(b.hint)
      );

      // Increased delay to ensure Google Maps API is loaded
      const timer = setTimeout(async () => {
        const firstLocation = sortedLocations[0];
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

  // Auto-finish game when all locations are played
  useEffect(() => {
    if (
      game.status === "RESULTS" &&
      locations &&
      game.currentRound &&
      game.currentRound >= locations.length
    ) {
      const timer = setTimeout(async () => {
        await finishGame({ gameId });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game.status, game.currentRound, locations, gameId, finishGame]);

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
            <div className="text-xl">Неизвестный статус игры</div>
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
