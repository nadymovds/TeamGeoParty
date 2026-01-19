import React, { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";
import { getPanoramaWithCache } from "../utils/panoramaCache";

const containerStyle = {
  width: "100%",
  height: "400px",
};

interface StreetViewProps {
  lat: number;
  lng: number;
}

export const StreetView: React.FC<StreetViewProps> = ({ lat, lng }) => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "no_coverage">("loading");

  const { isLoaded, loadError } = useGoogleMaps();

  useEffect(() => {
    if (!isLoaded || !streetViewRef.current) return;

    setStatus("loading");
    let cancelled = false;

    const loadPanorama = async () => {
      const streetViewService = new window.google.maps.StreetViewService();
      const result = await getPanoramaWithCache(streetViewService, lat, lng, 50);

      if (cancelled) return;

      if (
        result.status === window.google.maps.StreetViewStatus.OK &&
        result.location?.latLng
      ) {
        panoramaRef.current = new window.google.maps.StreetViewPanorama(
          streetViewRef.current!,
          {
            position: result.location.latLng,
            pov: { heading: 0, pitch: 0 },
            zoom: 1,
            addressControl: false,
            fullscreenControl: false,
            panControl: false,
            zoomControl: false,
          }
        );
        setStatus("ready");
      } else {
        setStatus("no_coverage");
      }
    };

    loadPanorama();

    // Cleanup function to destroy panorama when component unmounts or coordinates change
    return () => {
      cancelled = true;
      if (panoramaRef.current) {
        panoramaRef.current.setVisible(false);
        panoramaRef.current = null;
      }
    };
  }, [isLoaded, lat, lng]);

  if (loadError) {
    return (
      <div style={containerStyle} className="bg-red-50 rounded flex items-center justify-center">
        <p className="text-red-600">Ошибка загрузки Street View</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={containerStyle} className="bg-gray-100 rounded flex items-center justify-center">
        <p className="text-gray-500">Загрузка карты...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={streetViewRef} style={containerStyle} className="rounded" />
      {status === "loading" && (
        <div className="absolute inset-0 bg-gray-100 rounded flex items-center justify-center">
          <p className="text-gray-500">Загрузка панорамы...</p>
        </div>
      )}
      {status === "no_coverage" && (
        <div className="absolute inset-0 bg-yellow-50 rounded flex items-center justify-center">
          <p className="text-yellow-700 text-center px-4">
            В этой точке нет Street View панорамы.<br />
            Попробуйте выбрать другое место ближе к дороге.
          </p>
        </div>
      )}
    </div>
  );
};
