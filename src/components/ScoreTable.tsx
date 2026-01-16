import React from "react";
import { Id } from "convex/values";

interface Player {
  _id: Id<"players">;
  name: string;
  totalScore: number;
}

interface ScoreTableProps {
  players: Player[];
}

export const ScoreTable: React.FC<ScoreTableProps> = ({ players }) => {
  const sortedPlayers = [...players].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-xl font-bold mb-4">Таблица лидеров</h3>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player._id}
            className={`flex items-center justify-between p-3 rounded ${
              index === 0
                ? "bg-yellow-100 border-2 border-yellow-400"
                : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold w-8 text-center">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
              </span>
              <span className="font-medium text-lg">{player.name}</span>
            </div>
            <span className="font-bold text-lg">{player.totalScore} очков</span>
          </div>
        ))}
      </div>
    </div>
  );
};
