/**
 * Get or create a session ID from localStorage
 */
export function getSessionId(): string {
  let sessionId = localStorage.getItem("teamgeo_sessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("teamgeo_sessionId", sessionId);
  }
  return sessionId;
}

/**
 * Extract game ID from URL
 */
export function getGameIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("gameId");
}

/**
 * Create a shareable game URL
 */
export function createGameUrl(gameId: string): string {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?gameId=${gameId}`;
}
