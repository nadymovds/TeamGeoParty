import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { getSessionId } from "../utils";

interface HostMenuProps {
  gameId: Id<"games">;
}

export const HostMenu: React.FC<HostMenuProps> = ({ gameId }) => {
  const game = useQuery(api.games.get, { gameId });
  const players = useQuery(api.players.list, { gameId });
  const currentPlayer = useQuery(api.players.getBySession, {
    gameId,
    sessionId: getSessionId(),
  });
  const guesses = useQuery(
    api.guesses.list,
    game?.activeLocationId ? { locationId: game.activeLocationId } : "skip"
  );

  const forceNextRound = useMutation(api.games.forceNextRound);
  const forceFinishGame = useMutation(api.games.forceFinishGame);
  const forceStartGame = useMutation(api.games.forceStartGame);

  if (!currentPlayer?.isHost || !game || !players) {
    return null;
  }

  const handleForceNextRound = async () => {
    // Check if all participating players have answered
    const participatingPlayers = players.filter(p => p.isParticipating);
    const playersWithGuesses = new Set(guesses?.map(g => g.playerId) || []);
    const playersWithoutGuesses = participatingPlayers.filter(p => !playersWithGuesses.has(p._id));

    // Only show confirmation if there are players who haven't answered
    if (playersWithoutGuesses.length > 0) {
      const playerNames = playersWithoutGuesses.map(p => p.name).join(", ");
      if (!confirm(
        `Перейти к следующему раунду?\n\nИгроки без ответов (${playersWithoutGuesses.length}): ${playerNames}\nОни получат 0 очков.`
      )) {
        return;
      }
    }

    try {
      await forceNextRound({ gameId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка перехода");
    }
  };

  const handleForceFinish = async () => {
    if (confirm("Завершить игру?\n\nИгра будет завершена и откроется таблица финальных результатов.")) {
      try {
        await forceFinishGame({ gameId });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Ошибка завершения");
      }
    }
  };

  const handleForceStartGame = async () => {
    const participatingPlayers = players.filter(p => p.isParticipating);
    const notReadyPlayers = participatingPlayers.filter(p => !p.isReady);

    let message = "Начать игру принудительно?";
    if (notReadyPlayers.length > 0) {
      const playerNames = notReadyPlayers.map(p => p.name).join(", ");
      message = `Начать игру принудительно?\n\nНе готовы (${notReadyPlayers.length}): ${playerNames}\n\nИгроки без локаций не смогут участвовать в угадывании своих мест.`;
    }

    if (confirm(message)) {
      try {
        await forceStartGame({ gameId });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Ошибка запуска игры");
      }
    }
  };

  const isOnline = (lastSeenAt?: number) => {
    if (!lastSeenAt) return false;
    return Date.now() - lastSeenAt < 10000; // Online if seen in last 10 seconds
  };

  const getPlayerGuess = (playerId: Id<"players">) => {
    return guesses?.find((g) => g.playerId === playerId);
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
        <h2 className="text-xl font-bold text-white">Панель хоста</h2>
        <p className="text-sm text-purple-100">{game.status}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Control Buttons */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Управление
          </h3>

          {game.status === "SETUP" && (
            <button
              onClick={handleForceStartGame}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
            >
              Начать игру
            </button>
          )}

          {(game.status === "PLAYING" || game.status === "RESULTS") && (
            <>
              <button
                onClick={handleForceNextRound}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                Следующий раунд
              </button>

              <button
                onClick={handleForceFinish}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Завершить игру
              </button>
            </>
          )}
        </div>

        {/* Player List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Игроки ({players.length})
          </h3>

          <div className="space-y-2">
            {players.map((player) => {
              const online = isOnline(player.lastSeenAt);
              const playerGuess = getPlayerGuess(player._id);

              return (
                <div
                  key={player._id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          online ? "bg-green-500" : "bg-red-500"
                        }`}
                        title={online ? "Онлайн" : "Офлайн"}
                      />
                      <span className="font-medium text-gray-900">
                        {player.name}
                      </span>
                      {player.isHost && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Хост
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Очки: <span className="font-semibold">{player.totalScore}</span>
                    </span>

                    {game.status === "SETUP" && (
                      <span
                        className={`text-xs ${
                          player.isReady
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {player.isReady ? "✓ Готов" : "⏳ Настройка"}
                      </span>
                    )}

                    {game.status === "PLAYING" && (
                      <span
                        className={`text-xs ${
                          playerGuess ? "text-green-600" : "text-yellow-600"
                        }`}
                      >
                        {playerGuess ? "✓ Ответил" : "⏳ Думает"}
                      </span>
                    )}

                    {(game.status === "RESULTS" || game.status === "FINAL") &&
                      playerGuess && (
                        <span className="text-xs text-gray-500">
                          {playerGuess.distance < 1
                            ? `${Math.round(playerGuess.distance * 1000)} м`
                            : `${playerGuess.distance.toFixed(1)} км`}
                        </span>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
