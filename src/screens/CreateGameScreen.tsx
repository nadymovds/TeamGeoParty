import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { getSessionId } from "../utils";

export const CreateGameScreen: React.FC = () => {
  const [hostName, setHostName] = useState("");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [locationsPerPlayer, setLocationsPerPlayer] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [showHowToGet, setShowHowToGet] = useState(false);
  const [showProtection, setShowProtection] = useState(false);
  const createGame = useMutation(api.games.create);

  const handleCreateGame = async () => {
    if (!hostName.trim()) {
      setError("Введите ваше имя");
      return;
    }
    if (!googleApiKey.trim()) {
      setError("Введите Google Maps API ключ");
      return;
    }

    try {
      const { gameId } = await createGame({
        hostName: hostName.trim(),
        googleApiKey: googleApiKey.trim(),
        locationsPerPlayer,
        sessionId: getSessionId(),
      });

      // Navigate to game
      window.location.href = `?gameId=${gameId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания игры");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center">TeamGeo</h1>
        <p className="text-gray-600 text-center mb-6">
          Мультиплеерная игра для команды
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ваше имя (хост)
            </label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateGame()}
              placeholder="Иван"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Maps API ключ
            </label>
            <input
              type="text"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-2 bg-blue-50 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHowToGet(!showHowToGet)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
              >
                <span className="text-xs font-medium text-blue-800">Как получить ключ</span>
                <span className={`text-blue-600 transition-transform ${showHowToGet ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showHowToGet && (
                <div className="px-3 pb-3">
                  <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Откройте <a
                      href="https://console.cloud.google.com/google/maps-apis"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >Google Cloud Console</a></li>
                    <li>Создайте проект (или выберите существующий)</li>
                    <li>Включите APIs: <span className="font-medium">Maps JavaScript API</span> и <span className="font-medium">Street View Static API</span></li>
                    <li>Перейдите в "Credentials" → "Create Credentials" → "API Key"</li>
                    <li>Скопируйте ключ (начинается с AIza...)</li>
                  </ol>
                  <p className="text-xs text-blue-600 mt-2">
                    Google даёт достаточно ежемесячных бесплатных кредитов.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-2 bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowProtection(!showProtection)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-amber-100 transition-colors"
              >
                <span className="text-xs font-medium text-amber-800">Защита ключа (рекомендуется)</span>
                <span className={`text-amber-600 transition-transform ${showProtection ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showProtection && (
                <div className="px-3 pb-3">
                  <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                    <li>В Google Cloud Console перейдите в "Credentials"</li>
                    <li>Нажмите на ваш API ключ для редактирования</li>
                    <li>В разделе "Application restrictions" выберите <span className="font-medium">"HTTP referrers"</span></li>
                    <li>Добавьте домены: <code className="bg-amber-100 px-1 rounded">*.github.io/*</code> (для GitHub Pages) или ваш домен</li>
                    <li>В разделе "API restrictions" выберите <span className="font-medium">"Restrict key"</span></li>
                    <li>Выберите только: <span className="font-medium">Maps JavaScript API</span>, <span className="font-medium">Geocoding API</span></li>
                  </ol>
                  <p className="text-xs text-amber-600 mt-2">
                    Это защитит ключ от использования на других сайтах.
                  </p>
                  <p className="text-xs text-amber-700 mt-2 font-medium">
                    После игры рекомендуем пересоздать ключ в Google Console для безопасности.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Локаций на игрока
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={locationsPerPlayer}
              onChange={(e) =>
                setLocationsPerPlayer(parseInt(e.target.value) || 1)
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleCreateGame}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Создать игру
          </button>
        </div>
      </div>
    </div>
  );
};
