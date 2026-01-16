import React, { useEffect, useRef } from "react";
import { LoadScript } from "@react-google-maps/api";

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

  useEffect(() => {
    if (!streetViewRef.current || !window.google) return;

    new window.google.maps.StreetViewPanorama(
      streetViewRef.current,
      {
        position: { lat, lng },
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
      }
    );
  }, [lat, lng]);

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <div ref={streetViewRef} style={containerStyle} />
    </LoadScript>
  );
};
