import React, { useCallback, useMemo } from "react";
import { GoogleMap, Marker, LoadScript, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 0,
  lng: 0,
};

interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  title?: string; // Подпись под маркером
}

interface MapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  markers?: MapMarker[];
  onClick?: (lat: number, lng: number) => void;
  zoom?: number;
}

export const Map: React.FC<MapProps> = ({
  apiKey,
  center = defaultCenter,
  markers = [],
  onClick,
  zoom = 2,
}) => {
  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent | google.maps.IconMouseEvent) => {
      if (onClick && e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onClick(lat, lng);
      }
    },
    [onClick]
  );

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      clickableIcons: false,
      scrollwheel: true,
      zoomControl: true,
      mapTypeControl: false,
    }),
    []
  );

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onClick={onMapClick}
        options={mapOptions}
      >
        {markers.map((marker, index) => (
          <React.Fragment key={index}>
            <Marker
              position={{ lat: marker.lat, lng: marker.lng }}
              label={marker.label}
            />
            {marker.title && (
              <InfoWindow
                position={{ lat: marker.lat, lng: marker.lng }}
                options={{
                  pixelOffset: new window.google.maps.Size(0, 30),
                  disableAutoPan: true,
                }}
              >
                <div className="px-2 py-1 text-xs font-medium text-gray-800 whitespace-nowrap">
                  {marker.title}
                </div>
              </InfoWindow>
            )}
          </React.Fragment>
        ))}
      </GoogleMap>
    </LoadScript>
  );
};
