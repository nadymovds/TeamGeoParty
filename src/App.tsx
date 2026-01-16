import React, { useEffect } from "react";
import { ConvexProvider } from "convex/react";
import { convex } from "./convexClient";
import { CreateGameScreen } from "./screens/CreateGameScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { GuessScreen } from "./screens/GuessScreen";
import { RoundResultScreen } from "./screens/RoundResultScreen";
import { FinalScreen } from "./screens/FinalScreen";
import { getGameIdFromUrl } from "./utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";
import { Id } from "convex/values";

const GameRouter: React.FC = () => {
  const gameIdFromUrl = getGameIdFromUrl();

  if (!gameIdFromUrl) {
    return <CreateGameScreen />;
  }

  return <GameContent gameId={gameIdFromUrl as Id<"games">} />;
};

const GameContent: React.FC<{ gameId: Id<"games"> }> = ({ gameId }) => {
  const game = useQuery(api.games.get, { gameId });
  const players = useQuery(api.players.list, { gameId });
  const locations = useQuery(api.locations.list, { gameId });
  const startRound = useMutation(api.games.startRound);
  const finishRound = useMutation(api.games.finishRound);
  const finishGame = useMutation(api.games.finishGame);

  // Auto-start first round when all players are ready and game is in SETUP
  useEffect(() => {
    if (
      game?.status === "SETUP" &&
      players &&
      locations &&
      players.every((p) => p.isReady) &&
      locations.length > 0
    ) {
      // Sort locations for consistent order
      const sortedLocations = [...locations].sort((a, b) =>
        a.hint.localeCompare(b.hint)
      );

      // Wait a bit for UI to update, then start first round
      const timer = setTimeout(async () => {
        const firstLocation = sortedLocations[0];
        if (firstLocation) {
          await startRound({
            gameId,
            locationId: firstLocation._id,
            round: 1,
          });
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [game?.status, players, locations, gameId, startRound]);

  // Auto-finish round when all players have guessed
  const guesses = useQuery(
    api.guesses.list,
    game?.activeLocationId
      ? { locationId: game.activeLocationId }
      : "skip"
  );

  useEffect(() => {
    if (
      game?.status === "PLAYING" &&
      players &&
      guesses &&
      game.activeLocationId &&
      guesses.length >= players.length
    ) {
      // All players have guessed, automatically finish the round
      const timer = setTimeout(async () => {
        await finishRound({ gameId });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [game?.status, players, guesses, game?.activeLocationId, gameId, finishRound]);

  // Auto-finish game when all locations are played
  useEffect(() => {
    if (
      game?.status === "RESULTS" &&
      locations &&
      game.currentRound &&
      game.currentRound >= locations.length
    ) {
      const timer = setTimeout(async () => {
        await finishGame({ gameId });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [game?.status, game?.currentRound, locations, gameId, finishGame]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка игры...</div>
      </div>
    );
  }

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

function App() {
  return (
    <ConvexProvider client={convex}>
      <GameRouter />
    </ConvexProvider>
  );
}

export default App;
