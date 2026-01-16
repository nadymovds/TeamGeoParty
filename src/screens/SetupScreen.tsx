import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "convex/values";
import { Map } from "../components/Map";
import { PlayerList } from "../components/PlayerList";
import { getSessionId } from "../utils";

interface SetupScreenProps {
  gameId: Id<"games">;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ gameId }) => {
  const game = useQuery(api.games.get, { gameId });
  const players = useQuery(api.players.list, { gameId });
  const currentPlayer = useQuery(
    api.players.getBySession,
    { gameId, sessionId: getSessionId() },
    "skip"
  );
  const myLocations = useQuery(
    api.locations.getByPlayer,
    currentPlayer?._id ? { playerId: currentPlayer._id } : "skip"
  );

  const addLocation = useMutation(api.locations.add);
  const setReady = useMutation(api.players.setReady);

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [hint, setHint] = useState("");

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleAddLocation = async () => {
    if (!selectedLocation || !hint.trim() || !currentPlayer || !game) {
      return;
    }

    try {
      await addLocation({
        gameId,
        playerId: currentPlayer._id,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        hint: hint.trim(),
      });
      setSelectedLocation(null);
      setHint("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка добавления локации");
    }
  };

  const handleToggleReady = async () => {
    if (!currentPlayer) return;
    try {
      await setReady({
        playerId: currentPlayer._id,
        isReady: !currentPlayer.isReady,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка");
    }
  };

  if (!game || !players || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  const locationsNeeded = game.settings.locationsPerPlayer;
  const locationsCount = myLocations?.length ?? 0;
  const allReady = players.every((p) => p.isReady);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold mb-2">Настройка локаций</h1>
          <p className="text-gray-600 mb-4">
            Добавьте {locationsNeeded} значимых для вас мест на карте
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">
                Добавить локацию ({locationsCount}/{locationsNeeded})
              </h2>
              
              {game.googleApiKey ? (
                <Map
                  apiKey={game.googleApiKey}
                  onClick={handleMapClick}
                  markers={
                    selectedLocation
                      ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng, label: "✓" }]
                      : []
                  }
                />
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-100 rounded">
                  <p className="text-gray-500">Загрузка карты...</p>
                </div>
              )}

              {selectedLocation && (
                <div className="mt-4 space-y-2">
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="Подсказка (например: Где я провел детство)"
                    className="w-full px-4 py-2 border rounded-lg"
                    onKeyPress={(e) => e.key === "Enter" && handleAddLocation()}
                  />
                  <button
                    onClick={handleAddLocation}
                    disabled={!hint.trim() || locationsCount >= locationsNeeded}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Добавить локацию
                  </button>
                </div>
              )}

              {selectedLocation && (
                <p className="text-sm text-gray-500 mt-2">
                  Координаты: {selectedLocation.lat.toFixed(4)},{" "}
                  {selectedLocation.lng.toFixed(4)}
                </p>
              )}
            </div>

            {locationsCount > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Ваши локации:</h3>
                <div className="space-y-2">
                  {myLocations?.map((loc) => (
                    <div
                      key={loc._id}
                      className="p-2 bg-gray-50 rounded flex justify-between"
                    >
                      <span>{loc.hint}</span>
                      <span className="text-sm text-gray-500">
                        {loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <PlayerList players={players} currentPlayerId={currentPlayer._id} />

            {locationsCount >= locationsNeeded && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <button
                  onClick={handleToggleReady}
                  className={`w-full px-4 py-3 rounded-lg font-semibold ${
                    currentPlayer.isReady
                      ? "bg-gray-400 hover:bg-gray-500"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  {currentPlayer.isReady ? "Не готов" : "Готов к игре"}
                </button>
              </div>
            )}

            {allReady && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-center text-green-700 font-semibold">
                  ✓ Все игроки готовы! Игра начнется автоматически...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
