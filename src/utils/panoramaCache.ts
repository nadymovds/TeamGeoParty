// Cache for Street View panorama results to reduce API costs
// Key format: "lat,lng" with 5 decimal precision (about 1m accuracy)

interface PanoramaResult {
  status: google.maps.StreetViewStatus;
  location?: google.maps.StreetViewLocation;
}

const cache = new Map<string, PanoramaResult>();

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export function getCachedPanorama(
  lat: number,
  lng: number
): PanoramaResult | undefined {
  return cache.get(getCacheKey(lat, lng));
}

export function setCachedPanorama(
  lat: number,
  lng: number,
  result: PanoramaResult
): void {
  cache.set(getCacheKey(lat, lng), result);
}

export async function getPanoramaWithCache(
  streetViewService: google.maps.StreetViewService,
  lat: number,
  lng: number,
  radius: number = 50
): Promise<PanoramaResult> {
  const cached = getCachedPanorama(lat, lng);
  if (cached) {
    return cached;
  }

  return new Promise((resolve) => {
    streetViewService.getPanorama(
      { location: { lat, lng }, radius },
      (data, status) => {
        const result: PanoramaResult = {
          status,
          location: data?.location ?? undefined,
        };
        setCachedPanorama(lat, lng, result);
        resolve(result);
      }
    );
  });
}
