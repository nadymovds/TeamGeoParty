import React from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ScoreTable } from "../components/ScoreTable";

interface FinalScreenProps {
  gameId: Id<"games">;
}

export const FinalScreen: React.FC<FinalScreenProps> = ({ gameId }) => {
  const game = useQuery(api.games.get, { gameId });
  const players = useQuery(api.players.list, { gameId });

  if (!game || !players) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <h1 className="text-4xl font-bold mb-4">🎉 Игра завершена! 🎉</h1>
          <p className="text-xl text-gray-600 mb-6">
            Спасибо за игру! Вот финальные результаты:
          </p>
        </div>

        <ScoreTable players={players} />

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
    </div>
  );
};
