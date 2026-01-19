import React from "react";
import { Id } from "../convex/_generated/dataModel";

interface Player {
  _id: Id<"players">;
  name: string;
  isHost: boolean;
  isReady: boolean;
  totalScore: number;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: Id<"players">;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentPlayerId,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Игроки ({players.length})</h3>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player._id}
            className={`flex items-center justify-between p-2 rounded ${
              player._id === currentPlayerId ? "bg-blue-100" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{player.name}</span>
              {player.isHost && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Хост
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {player.isReady && (
                <span className="text-blue-600 text-sm">Готов</span>
              )}
              <span className="text-gray-600 text-sm">
                {player.totalScore} очков
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
