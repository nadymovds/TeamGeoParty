import React from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { StaticMap } from "../components/StaticMap";
import { StreetView } from "../components/StreetView";
import { ScoreTable } from "../components/ScoreTable";
import { HostMenu } from "../components/HostMenu";
import { getSessionId } from "../utils";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";

interface RoundResultScreenProps {
  gameId: Id<"games">;
}

export const RoundResultScreen: React.FC<RoundResultScreenProps> = ({
  gameId,
}) => {
  const { isLoaded } = useGoogleMaps();
  const game = useQuery(api.games.get, { gameId });
  const activeLocation = useQuery(api.locations.getActive, { gameId });
  const guesses = useQuery(
    api.guesses.list,
    activeLocation ? { locationId: activeLocation._id } : "skip"
  );
  const players = useQuery(api.players.list, { gameId });
  const currentPlayer = useQuery(
    api.players.getBySession,
    { gameId, sessionId: getSessionId() }
  );
  if (!game || !activeLocation || !players || !guesses || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">
          {!isLoaded ? "Loading maps..." : "Loading..."}
        </div>
      </div>
    );
  }

  // Create markers for map - green for correct location, red for guesses
  const markers = [
    ...guesses
      .filter((guess) => !(guess.lat === 0 && guess.lng === 0)) // Exclude dummy guesses
      .map((guess) => {
        const player = players.find((p) => p._id === guess.playerId);
        return {
          lat: guess.lat,
          lng: guess.lng,
          title: player?.name ?? "Player",
          color: "red" as const,
        };
      }),
    {
      lat: activeLocation.lat,
      lng: activeLocation.lng,
      title: "Correct location",
      color: "green" as const,
    },
  ];

  // Filter valid guesses (exclude dummy guesses from players who didn't guess)
  const validGuesses = guesses.filter((guess) => !(guess.lat === 0 && guess.lng === 0));

  // Create player results including those who didn't guess
  const playerResults = players.map((player) => {
    const guess = validGuesses.find((g) => g.playerId === player._id);
    return { player, guess };
  }).sort((a, b) => {
    if (!a.guess && !b.guess) return 0;
    if (!a.guess) return 1;
    if (!b.guess) return -1;
    return a.guess.distance - b.guess.distance;
  });
  const isHost = currentPlayer?.isHost;

  // Find the author of this location
  const locationAuthor = players.find((p) => p._id === activeLocation.playerId);

  return (
    <div className={`min-h-screen bg-gray-50 p-4 ${isHost ? 'mr-80' : ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold mb-2">
            Results of round {game.currentRound ?? 1}
          </h1>
          <p className="text-xl text-gray-700 mb-2 font-medium">
            Hint from {locationAuthor?.name ?? "Player"}: «{activeLocation.hint}»
          </p>
          <p className="text-sm text-gray-500">
            The correct location is marked with a green marker on the map
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Panorama:</h2>
          <StreetView lat={activeLocation.lat} lng={activeLocation.lng} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <StaticMap
              center={{ lat: activeLocation.lat, lng: activeLocation.lng }}
              markers={markers}
              fitBounds={true}
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Player results</h3>
            <div className="space-y-2">
              {playerResults.map(({ player, guess }, index) => (
                <div
                  key={player._id}
                  className={`p-3 rounded ${
                    index === 0 && guess
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">
                        {index + 1}. {player.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">
                        {guess ? (
                          guess.distance < 1
                            ? `${Math.round(guess.distance * 1000)} m`
                            : `${guess.distance.toFixed(2)} km`
                        ) : (
                          "Didn't guess"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ScoreTable players={players} showAll={isHost} />

        {!isHost && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-center text-blue-700">
              Waiting for the next round from the host...
            </p>
          </div>
        )}
      </div>
      <HostMenu gameId={gameId} />
    </div>
  );
};
