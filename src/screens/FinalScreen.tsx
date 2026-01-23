import React from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ScoreTable } from "../components/ScoreTable";
import { HostMenu } from "../components/HostMenu";
import { StaticMap } from "../components/StaticMap";
import { getSessionId } from "../utils";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";

interface FinalScreenProps {
  gameId: Id<"games">;
}

export const FinalScreen: React.FC<FinalScreenProps> = ({ gameId }) => {
  const { isLoaded } = useGoogleMaps();
  const game = useQuery(api.games.get, { gameId });
  const players = useQuery(api.players.list, { gameId });
  const locations = useQuery(api.locations.list, { gameId });
  const allGuesses = useQuery(api.guesses.listByGame, { gameId });
  const currentPlayer = useQuery(api.players.getBySession, {
    gameId,
    sessionId: getSessionId(),
  });

  if (!game || !players || !locations || !allGuesses || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">
          {!isLoaded ? "Loading maps..." : "Loading..."}
        </div>
      </div>
    );
  }

  const isHost = currentPlayer?.isHost;

  // Create markers for map - green for all correct locations, red for all guesses
  const markers = [
    ...allGuesses
      .filter((guess) => !(guess.lat === 0 && guess.lng === 0)) // Exclude dummy guesses
      .map((guess) => {
        const player = players.find((p) => p._id === guess.playerId);
        const location = locations.find((l) => l._id === guess.locationId);
        return {
          lat: guess.lat,
          lng: guess.lng,
          title: `${player?.name ?? "Player"}: ${location?.hint ?? ""}`,
          color: "red" as const,
        };
      }),
    ...locations.map((loc) => {
      const player = players.find((p) => p._id === loc.playerId);
      return {
        lat: loc.lat,
        lng: loc.lng,
        title: `${loc.hint} (${player?.name ?? "Player"})`,
        color: "green" as const,
      };
    }),
  ];

  // Calculate map center as average of all locations
  const mapCenter = locations.length > 0
    ? {
        lat: locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
        lng: locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length,
      }
    : { lat: 0, lng: 0 };

  return (
    <div className={`min-h-screen bg-gray-50 p-4 ${isHost ? 'mr-80' : ''}`}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Game finished</h1>
          <p className="text-xl text-gray-600 mb-6">
            Thank you for playing! Here are the final results:
          </p>
        </div>

        <ScoreTable players={players} showAll={isHost} />

        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-xl font-bold mb-4">All game locations</h3>
          <p className="text-sm text-gray-500 mb-3">
            Green markers — correct locations, red — player guesses
          </p>
          <StaticMap
            center={mapCenter}
            markers={markers}
            fitBounds={true}
          />
        </div>

        {isHost && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-medium mb-2">
              Security recommendation:
            </p>
            <p className="text-sm text-amber-700">
              Recreate the API key in{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline font-medium"
              >
                Google Cloud Console
              </a>
              to prevent its further use by other players.
            </p>
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6 text-center">
          <button
            onClick={() => {
              window.location.href = window.location.pathname;
            }}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Create a new game
          </button>
        </div>
      </div>
      <HostMenu gameId={gameId} />
    </div>
  );
};
