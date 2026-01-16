import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Map } from "../components/Map";
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
  } | null>(
    myGuess ? { lat: myGuess.lat, lng: myGuess.lng } : null
  );

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
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
      // Guess submitted - will be handled by parent component
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

  const hasSubmitted = myGuess !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold mb-2">Раунд {game.currentRound ?? 1}</h1>
          <p className="text-xl text-gray-700 mb-4 font-medium">
            Подсказка: {activeLocation.hint}
          </p>
          <p className="text-sm text-gray-500">
            Кликните на карте, где, по вашему мнению, находится это место
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          {game.googleApiKey ? (
            <Map
              apiKey={game.googleApiKey}
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
          ) : (
            <div className="h-96 flex items-center justify-center bg-gray-100 rounded">
              <p className="text-gray-500">Загрузка карты...</p>
            </div>
          )}
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
    </div>
  );
};
