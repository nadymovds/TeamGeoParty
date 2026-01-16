import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "convex/values";
import { Map } from "../components/Map";
import { ScoreTable } from "../components/ScoreTable";
import { getSessionId } from "../utils";

interface RoundResultScreenProps {
  gameId: Id<"games">;
}

export const RoundResultScreen: React.FC<RoundResultScreenProps> = ({
  gameId,
}) => {
  const game = useQuery(api.games.get, { gameId });
  const activeLocation = useQuery(api.locations.getActive, { gameId });
  const guesses = useQuery(
    api.guesses.list,
    activeLocation ? { locationId: activeLocation._id } : "skip"
  );
  const players = useQuery(api.players.list, { gameId });
  const currentPlayer = useQuery(
    api.players.getBySession,
    { gameId, sessionId: getSessionId() },
    "skip"
  );
  const finishRound = useMutation(api.games.finishRound);
  const startRound = useMutation(api.games.startRound);
  const finishGame = useMutation(api.games.finishGame);
  const locations = useQuery(api.locations.list, { gameId });

  // Sort locations to ensure consistent order
  const sortedLocations = locations
    ? [...locations].sort((a, b) => {
        // Sort by player creation order, then by hint
        return a.hint.localeCompare(b.hint);
      })
    : null;

  if (!game || !activeLocation || !players || !guesses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  // Create markers for map
  const markers = [
    {
      lat: activeLocation.lat,
      lng: activeLocation.lng,
      label: "🎯",
    },
    ...guesses.map((guess) => ({
      lat: guess.lat,
      lng: guess.lng,
      label: "?",
    })),
  ];

  // Sort guesses by distance
  const sortedGuesses = [...guesses].sort((a, b) => a.distance - b.distance);


  const handleNextRound = async () => {
    if (!currentPlayer?.isHost || !sortedLocations) return;

    // Get the next location in sequence
    const currentIndex = sortedLocations.findIndex(
      (loc) => loc._id === activeLocation._id
    );
    
    if (currentIndex === -1 || currentIndex >= sortedLocations.length - 1) {
      // No more locations, finish game
      await finishGame({ gameId });
      return;
    }

    const nextLocation = sortedLocations[currentIndex + 1];

    await finishRound({ gameId });
    // Small delay to ensure state is updated
    setTimeout(async () => {
      await startRound({
        gameId,
        locationId: nextLocation._id,
        round: (game.currentRound ?? 1) + 1,
      });
    }, 500);
  };


  const allLocationsPlayed =
    sortedLocations &&
    game.currentRound &&
    game.currentRound >= sortedLocations.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold mb-2">
            Результаты раунда {game.currentRound ?? 1}
          </h1>
          <p className="text-xl text-gray-700 mb-2 font-medium">
            Подсказка была: {activeLocation.hint}
          </p>
          <p className="text-sm text-gray-500">
            Правильное место отмечено 🎯 на карте
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            {game.googleApiKey ? (
              <Map
                apiKey={game.googleApiKey}
                center={{ lat: activeLocation.lat, lng: activeLocation.lng }}
                markers={markers}
                zoom={4}
              />
            ) : (
              <div className="h-96 flex items-center justify-center bg-gray-100 rounded">
                <p className="text-gray-500">Загрузка карты...</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Результаты игроков</h3>
            <div className="space-y-2">
              {sortedGuesses.map((guess, index) => {
                const player = players.find((p) => p._id === guess.playerId);
                return (
                  <div
                    key={guess._id}
                    className={`p-3 rounded ${
                      index === 0
                        ? "bg-green-100 border-2 border-green-500"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">
                          {index + 1}. {player?.name ?? "Unknown"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">
                          {guess.distance < 1
                            ? `${Math.round(guess.distance * 1000)} м`
                            : `${guess.distance.toFixed(2)} км`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ScoreTable players={players} />

        {currentPlayer?.isHost && (
          <div className="mt-4">
            {allLocationsPlayed ? (
              <button
                onClick={async () => {
                  await finishGame({ gameId });
                }}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
              >
                Завершить игру
              </button>
            ) : (
              <button
                onClick={handleNextRound}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Следующий раунд
              </button>
            )}
          </div>
        )}

        {!currentPlayer?.isHost && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-center text-blue-700">
              Ожидание следующего раунда от хоста...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
