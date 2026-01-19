import React from "react";
import { Id } from "../convex/_generated/dataModel";

interface Player {
  _id: Id<"players">;
  name: string;
  totalScore: number;
}

interface ScoreTableProps {
  players: Player[];
  showAll?: boolean; // If true, show all players; if false, show only top 3
}

export const ScoreTable: React.FC<ScoreTableProps> = ({ players, showAll = false }) => {
  const sortedPlayers = [...players].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  // Show only top 3 for regular users, all players for host
  const displayPlayers = showAll ? sortedPlayers : sortedPlayers.slice(0, 3);
  const hasMorePlayers = !showAll && sortedPlayers.length > 3;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-xl font-bold mb-4">Таблица лидеров</h3>
      <div className="space-y-2">
        {displayPlayers.map((player, index) => (
          <div
            key={player._id}
            className={`flex items-center justify-between p-3 rounded ${
              index === 0
                ? "bg-blue-100 border-2 border-blue-400"
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
        {hasMorePlayers && (
          <div className="text-center text-gray-500 text-sm pt-2">
            и еще {sortedPlayers.length - 3} игроков...
          </div>
        )}
      </div>
    </div>
  );
};
