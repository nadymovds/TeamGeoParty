import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { getSessionId } from "../utils";
import { Timer } from "./Timer";

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
  const startTimer = useMutation(api.games.startTimer);
  const stopTimer = useMutation(api.games.stopTimer);
  const addTimeToTimer = useMutation(api.games.addTimeToTimer);

  if (!currentPlayer?.isHost || !game || !players) {
    return null;
  }

  const handleForceNextRound = async () => {
    // Check if all participating players have answered (only relevant during PLAYING)
    const participatingPlayers = players.filter(p => p.isParticipating);
    const playersWithGuesses = new Set(guesses?.map(g => g.playerId) || []);
    const playersWithoutGuesses = participatingPlayers.filter(p => !playersWithGuesses.has(p._id));

    // Only show confirmation if there are players who haven't answered (during PLAYING state)
    if (game.status === "PLAYING" && playersWithoutGuesses.length > 0) {
      const playerNames = playersWithoutGuesses.map(p => p.name).join(", ");
      if (!confirm(
        `Finish the round?\n\nPlayers without answers (${playersWithoutGuesses.length}): ${playerNames}\nThey will get 0 points.`
      )) {
        return;
      }
    }

    try {
      // Stop timer when finishing round
      if (game.status === "PLAYING" && game.timerEnd) {
        await stopTimer({ gameId });
      }
      await forceNextRound({ gameId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Transition error");
    }
  };

  const handleForceFinish = async () => {
    if (confirm("Finish the game?\n\nThe game will be finished and the final results table will open.")) {
      try {
        await forceFinishGame({ gameId });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Completion error");
      }
    }
  };

  const handleForceStartGame = async () => {
    const participatingPlayers = players.filter(p => p.isParticipating);
    const notReadyPlayers = participatingPlayers.filter(p => !p.isReady);

    let message = "Start the game forcibly?";
    if (notReadyPlayers.length > 0) {
      const playerNames = notReadyPlayers.map(p => p.name).join(", ");
      message = `Start the game forcibly?\n\nNot ready (${notReadyPlayers.length}): ${playerNames}\n\nPlayers without locations will not be able to participate in guessing their places.`;
    }

    if (confirm(message)) {
      try {
        await forceStartGame({ gameId });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Game start error");
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
      <div className="p-4 border-b border-gray-200 bg-blue-600">
        <h2 className="text-xl font-bold text-white">Host panel</h2>
        <p className="text-sm text-blue-100">{game.status}</p>
        {game.timerEnd && (
          <div className="mt-2">
            <Timer endTime={game.timerEnd} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Control Buttons */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Control
          </h3>

          {game.status === "SETUP" && (
            <button
              onClick={handleForceStartGame}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              Start game
            </button>
          )}

          {(game.status === "PLAYING" || game.status === "RESULTS") && (
            <>
              <button
                onClick={handleForceNextRound}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                {game.status === "PLAYING" ? "Finish round" : "Next round"}
              </button>

              <button
                onClick={handleForceFinish}
                className="w-full px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Finish game
              </button>
            </>
          )}
        </div>

        {/* Timer Controls */}
        {(game.status === "SETUP" || game.status === "PLAYING") && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Timer
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => startTimer({ gameId, durationSeconds: 60 })}
                className="px-2 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
              >
                1 min
              </button>
              <button
                onClick={() => startTimer({ gameId, durationSeconds: 120 })}
                className="px-2 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
              >
                2 min
              </button>
              <button
                onClick={() => startTimer({ gameId, durationSeconds: 240 })}
                className="px-2 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
              >
                4 min
              </button>
            </div>
            {game.timerEnd && (
              <div className="flex gap-2">
                <button
                  onClick={() => addTimeToTimer({ gameId, additionalSeconds: 30 })}
                  className="flex-1 px-2 py-2 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700 transition-colors"
                >
                  +30s
                </button>
                <button
                  onClick={() => addTimeToTimer({ gameId, additionalSeconds: 60 })}
                  className="flex-1 px-2 py-2 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700 transition-colors"
                >
                  +1m
                </button>
                <button
                  onClick={() => stopTimer({ gameId })}
                  className="flex-1 px-2 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Stop
                </button>
              </div>
            )}
          </div>
        )}

        {/* Player List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Players ({players.length})
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
                        title={online ? "Online" : "Offline"}
                      />
                      <span className="font-medium text-gray-900">
                        {player.name}
                      </span>
                      {player.isHost && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Host
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Points: <span className="font-semibold">{player.totalScore}</span>
                    </span>

                    {game.status === "SETUP" && (
                      <span
                        className={`text-xs ${
                          player.isReady
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {player.isReady ? "✓ Ready" : "⏳ Setup"}
                      </span>
                    )}

                    {game.status === "PLAYING" && (
                      <span
                        className={`text-xs ${
                          playerGuess ? "text-green-600" : "text-yellow-600"
                        }`}
                      >
                        {playerGuess ? "✓ Answered" : "⏳ Thinking"}
                      </span>
                    )}

                    {(game.status === "RESULTS" || game.status === "FINAL") &&
                      playerGuess && (
                        <span className="text-xs text-gray-500">
                          {playerGuess.distance < 1
                            ? `${Math.round(playerGuess.distance * 1000)} m`
                            : `${playerGuess.distance.toFixed(1)} km`}
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
