import React from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ScoreTable } from "../components/ScoreTable";
import { HostMenu } from "../components/HostMenu";
import { Map } from "../components/Map";
import { getSessionId } from "../utils";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";

interface FinalScreenProps {
  gameId: Id<"games">;
}

export const FinalScreen: React.FC<FinalScreenProps> = ({ gameId }) => {
  const { isLoaded } = useGoogleMaps();
  const game = useQuery(api.games.get, { gameId });
  const players = useQuery(api.players.list, { gameId });
  const locations = useQuery(api.locations.list, { gameId });
  const allGuesses = useQuery(api.guesses.listByGame, { gameId });
  const currentPlayer = useQuery(api.players.getBySession, {
    gameId,
    sessionId: getSessionId(),
  });

  if (!game || !players || !locations || !allGuesses || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">
          {!isLoaded ? "Загрузка карт..." : "Загрузка..."}
        </div>
      </div>
    );
  }

  const isHost = currentPlayer?.isHost;

  // Create markers for map - green for all correct locations, red for all guesses
  const markers = [
    ...locations.map((loc) => {
      const player = players.find((p) => p._id === loc.playerId);
      return {
        lat: loc.lat,
        lng: loc.lng,
        title: `${loc.hint} (${player?.name ?? "Игрок"})`,
        color: "green" as const,
      };
    }),
    ...allGuesses.map((guess) => {
      const player = players.find((p) => p._id === guess.playerId);
      const location = locations.find((l) => l._id === guess.locationId);
      return {
        lat: guess.lat,
        lng: guess.lng,
        title: `${player?.name ?? "Игрок"}: ${location?.hint ?? ""}`,
        color: "red" as const,
      };
    }),
  ];

  // Calculate map center as average of all locations
  const mapCenter = locations.length > 0
    ? {
        lat: locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
        lng: locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length,
      }
    : { lat: 0, lng: 0 };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4 ${isHost ? 'mr-80' : ''}`}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <h1 className="text-4xl font-bold mb-4">🎉 Игра завершена! 🎉</h1>
          <p className="text-xl text-gray-600 mb-6">
            Спасибо за игру! Вот финальные результаты:
          </p>
        </div>

        <ScoreTable players={players} showAll={isHost} />

        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-xl font-bold mb-4">Все локации игры</h3>
          <p className="text-sm text-gray-500 mb-3">
            Зеленые маркеры — правильные места, красные — предположения игроков
          </p>
          <Map
            center={mapCenter}
            markers={markers}
            zoom={2}
          />
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6 text-center">
          <button
            onClick={() => {
              window.location.href = window.location.pathname;
            }}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
          >
            Создать новую игру
          </button>
        </div>
      </div>
      <HostMenu gameId={gameId} />
    </div>
  );
};
