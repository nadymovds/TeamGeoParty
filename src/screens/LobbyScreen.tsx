import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { PlayerList } from "../components/PlayerList";
import { getSessionId, createGameUrl } from "../utils";

interface LobbyScreenProps {
  gameId: Id<"games">;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ gameId }) => {
  const game = useQuery(api.games.get, { gameId });
  const players = useQuery(api.players.list, { gameId });
  const currentPlayer = useQuery(
    api.players.getBySession,
    { gameId, sessionId: getSessionId() }
  );
  const startSetup = useMutation(api.games.startSetup);
  const setParticipating = useMutation(api.admin.setParticipating);

  const [playerName, setPlayerName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const joinGame = useMutation(api.players.join);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(createGameUrl(gameId));
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch (err) {
      alert("Не удалось скопировать ссылку");
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setJoinError("Введите имя");
      return;
    }
    try {
      await joinGame({
        gameId,
        name: playerName.trim(),
        sessionId: getSessionId(),
      });
      setJoinError(null);
      setPlayerName("");
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Ошибка присоединения");
    }
  };

  const handleStartSetup = async () => {
    try {
      await startSetup({ gameId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка запуска");
    }
  };

  const handleToggleParticipating = async () => {
    if (!currentPlayer?.isHost) return;
    try {
      await setParticipating({
        playerId: currentPlayer._id,
        isParticipating: !currentPlayer.isParticipating,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка");
    }
  };


  if (!game || !players) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  const isHost = currentPlayer?.isHost ?? false;
  const gameUrl = createGameUrl(gameId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold mb-2">TeamGeo</h1>
          <p className="text-gray-600 mb-4">
            Мультиплеерная игра для тимбилдинга
          </p>

          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Пригласите друзей по ссылке:
            </p>
            <div className="flex gap-2 relative">
              <input
                type="text"
                value={gameUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded-lg bg-white"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md active:bg-blue-800 transition-all duration-150"
              >
                Копировать
              </button>
            </div>
            {showCopyToast && (
              <div className="mt-2 py-2 px-3 bg-green-100 text-green-700 text-sm rounded-lg border border-green-300 animate-pulse">
                ✓ Ссылка скопирована в буфер обмена
              </div>
            )}
          </div>
        </div>

        {!currentPlayer && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <h2 className="text-xl font-semibold mb-4">Присоединиться к игре</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Ваше имя"
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                onClick={handleJoin}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Присоединиться
              </button>
            </div>
            {joinError && (
              <p className="text-red-600 text-sm mt-2">{joinError}</p>
            )}
          </div>
        )}

        <PlayerList
          players={players}
          currentPlayerId={currentPlayer?._id}
        />

        {isHost && currentPlayer && (
          <div className="mt-4 space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPlayer.isParticipating}
                  onChange={handleToggleParticipating}
                  className="w-5 h-5"
                />
                <span className="text-gray-700">Я буду участвовать в игре (добавлять локации и угадывать)</span>
              </label>
            </div>

            <button
              onClick={handleStartSetup}
              disabled={players.length < 2}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {players.length < 2
                ? "Нужно минимум 2 игрока"
                : "Начать настройку локаций"}
            </button>

          </div>
        )}
      </div>
    </div>
  );
};
