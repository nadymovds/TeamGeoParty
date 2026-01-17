import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Map } from "../components/Map";
import { StreetView } from "../components/StreetView";
import { HostMenu } from "../components/HostMenu";
import { getSessionId } from "../utils";

interface GuessScreenProps {
  gameId: Id<"games">;
}

export const GuessScreen: React.FC<GuessScreenProps> = ({ gameId }) => {
  const game = useQuery(api.games.get, { gameId });
  const activeLocation = useQuery(api.locations.getActive, { gameId });
  const currentPlayer = useQuery(
    api.players.getBySession,
    { gameId, sessionId: getSessionId() }
  );
  const myGuess = useQuery(
    api.guesses.getByPlayer,
    activeLocation && currentPlayer
      ? { locationId: activeLocation._id, playerId: currentPlayer._id }
      : "skip"
  );
  const submitGuess = useMutation(api.guesses.submit);

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    if (!myGuess) {
      setSelectedLocation({ lat, lng });
    }
  };

  const handleSubmitGuess = async () => {
    if (!selectedLocation || !activeLocation || !currentPlayer || !game) {
      return;
    }

    try {
      await submitGuess({
        locationId: activeLocation._id,
        playerId: currentPlayer._id,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        round: game.currentRound,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка отправки");
    }
  };

  if (!game || !activeLocation || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  const hasSubmitted = myGuess !== undefined && myGuess !== null;
  const isHost = currentPlayer?.isHost;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4 ${isHost ? 'mr-80' : ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold mb-2">Раунд {game.currentRound ?? 1}</h1>
          <p className="text-xl text-gray-700 mb-4 font-medium">
            Подсказка: {activeLocation.hint}
          </p>
          <p className="text-sm text-gray-500">
            Посмотрите на панораму и отметьте на карте, где это находится
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-4">Панорама местности:</h2>
          <StreetView
            lat={activeLocation.lat}
            lng={activeLocation.lng}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-4">Ваше предположение:</h2>
          <Map
            onClick={hasSubmitted ? undefined : handleMapClick}
            markers={
              selectedLocation
                ? [
                    {
                      lat: selectedLocation.lat,
                      lng: selectedLocation.lng,
                      label: hasSubmitted ? "✓" : "?",
                    },
                  ]
                : []
            }
          />
        </div>

        {selectedLocation && !hasSubmitted && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Выбрано: {selectedLocation.lat.toFixed(4)},{" "}
              {selectedLocation.lng.toFixed(4)}
            </p>
            <button
              onClick={handleSubmitGuess}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              Отправить ответ
            </button>
          </div>
        )}

        {hasSubmitted && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
            <p className="text-center text-green-700 font-semibold">
              ✓ Ваш ответ отправлен! Ожидайте других игроков...
            </p>
          </div>
        )}
      </div>
      <HostMenu gameId={gameId} />
    </div>
  );
};
