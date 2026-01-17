import React, { useCallback, useMemo, useState } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";

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
  center?: { lat: number; lng: number };
  markers?: MapMarker[];
  onClick?: (lat: number, lng: number) => void;
  zoom?: number;
}

export const Map: React.FC<MapProps> = ({
  center = defaultCenter,
  markers = [],
  onClick,
  zoom = 2,
}) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);

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

  if (loadError) {
    return (
      <div style={containerStyle} className="bg-red-50 rounded flex items-center justify-center">
        <p className="text-red-600">Ошибка загрузки Google Maps</p>
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
            onMouseOver={() => setHoveredMarker(index)}
            onMouseOut={() => setHoveredMarker(null)}
          />
          {marker.title && hoveredMarker === index && (
            <InfoWindow
              position={{ lat: marker.lat, lng: marker.lng }}
              options={{
                pixelOffset: new window.google.maps.Size(0, -40),
                disableAutoPan: true,
              }}
            >
              <div className="px-2 py-1 text-sm font-medium text-gray-800 whitespace-nowrap">
                {marker.title}
              </div>
            </InfoWindow>
          )}
        </React.Fragment>
      ))}
    </GoogleMap>
  );
};
