import React, { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

interface StreetViewProps {
  apiKey: string;
  lat: number;
  lng: number;
}

export const StreetView: React.FC<StreetViewProps> = ({ apiKey, lat, lng }) => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "no_coverage">("loading");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  useEffect(() => {
    if (!isLoaded || !streetViewRef.current) return;

    setStatus("loading");

    const streetViewService = new window.google.maps.StreetViewService();

    streetViewService.getPanorama(
      { location: { lat, lng }, radius: 50 },
      (data, serviceStatus) => {
        if (serviceStatus === window.google.maps.StreetViewStatus.OK && data?.location?.latLng) {
          panoramaRef.current = new window.google.maps.StreetViewPanorama(
            streetViewRef.current!,
            {
              position: data.location.latLng,
              pov: { heading: 0, pitch: 0 },
              zoom: 1,
            }
          );
          setStatus("ready");
        } else {
          setStatus("no_coverage");
        }
      }
    );
  }, [isLoaded, lat, lng]);

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
