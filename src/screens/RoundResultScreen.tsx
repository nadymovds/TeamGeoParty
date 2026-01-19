import React from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Map } from "../components/Map";
import { StreetView } from "../components/StreetView";
import { ScoreTable } from "../components/ScoreTable";
import { HostMenu } from "../components/HostMenu";
import { getSessionId } from "../utils";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";

interface RoundResultScreenProps {
  gameId: Id<"games">;
}

export const RoundResultScreen: React.FC<RoundResultScreenProps> = ({
  gameId,
}) => {
  const { isLoaded } = useGoogleMaps();
  const game = useQuery(api.games.get, { gameId });
  const activeLocation = useQuery(api.locations.getActive, { gameId });
  const guesses = useQuery(
    api.guesses.list,
    activeLocation ? { locationId: activeLocation._id } : "skip"
  );
  const players = useQuery(api.players.list, { gameId });
  const currentPlayer = useQuery(
    api.players.getBySession,
    { gameId, sessionId: getSessionId() }
  );
  if (!game || !activeLocation || !players || !guesses || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">
          {!isLoaded ? "Загрузка карт..." : "Загрузка..."}
        </div>
      </div>
    );
  }

  // Create markers for map - green for correct location, red for guesses
  const markers = [
    {
      lat: activeLocation.lat,
      lng: activeLocation.lng,
      title: "Правильное место",
      color: "green" as const,
    },
    ...guesses.map((guess) => {
      const player = players.find((p) => p._id === guess.playerId);
      return {
        lat: guess.lat,
        lng: guess.lng,
        title: player?.name ?? "Игрок",
        color: "red" as const,
      };
    }),
  ];

  // Sort guesses by distance
  const sortedGuesses = [...guesses].sort((a, b) => a.distance - b.distance);
  const isHost = currentPlayer?.isHost;

  // Find the author of this location
  const locationAuthor = players.find((p) => p._id === activeLocation.playerId);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 ${isHost ? 'mr-80' : ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold mb-2">
            Результаты раунда {game.currentRound ?? 1}
          </h1>
          <p className="text-xl text-gray-700 mb-2 font-medium">
            Подсказка от {locationAuthor?.name ?? "Игрока"}: «{activeLocation.hint}»
          </p>
          <p className="text-sm text-gray-500">
            Правильное место отмечено зеленым маркером на карте
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Панорама:</h2>
          <StreetView lat={activeLocation.lat} lng={activeLocation.lng} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <Map
              center={{ lat: activeLocation.lat, lng: activeLocation.lng }}
              markers={markers}
              zoom={4}
            />
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

        <ScoreTable players={players} showAll={isHost} />

        {!isHost && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-center text-blue-700">
              Ожидание следующего раунда от хоста...
            </p>
          </div>
        )}
      </div>
      <HostMenu gameId={gameId} />
    </div>
  );
};
