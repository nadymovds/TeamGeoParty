import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
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
  color?: "red" | "green" | "blue"; // Marker color
}

interface MapProps {
  center?: { lat: number; lng: number };
  markers?: MapMarker[];
  onClick?: (lat: number, lng: number) => void;
  zoom?: number;
  showStreetViewCoverage?: boolean;
  disableStreetView?: boolean; // Hide the pegman control
  fitBounds?: boolean; // Auto-fit map to show all markers
}

export const Map: React.FC<MapProps> = ({
  center = defaultCenter,
  markers = [],
  onClick,
  zoom = 2,
  showStreetViewCoverage = false,
  disableStreetView = false,
  fitBounds = false,
}) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const coverageLayerRef = useRef<google.maps.StreetViewCoverageLayer | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    if (showStreetViewCoverage) {
      if (!coverageLayerRef.current) {
        coverageLayerRef.current = new google.maps.StreetViewCoverageLayer();
      }
      coverageLayerRef.current.setMap(mapRef.current);
    } else {
      if (coverageLayerRef.current) {
        coverageLayerRef.current.setMap(null);
      }
    }
  }, [showStreetViewCoverage, isLoaded]);

  // Fit map bounds to show all markers (client-side, no API cost)
  useEffect(() => {
    if (!mapRef.current || !isLoaded || !fitBounds || markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach((marker) => {
      bounds.extend({ lat: marker.lat, lng: marker.lng });
    });

    mapRef.current.fitBounds(bounds, 50); // 50px padding
  }, [fitBounds, markers, isLoaded]);

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
      streetViewControl: !disableStreetView,
    }),
    [disableStreetView]
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
      onLoad={onMapLoad}
    >
      {markers.map((marker, index) => {
        // Get marker icon URL based on color
        const getMarkerIcon = (color?: string) => {
          switch (color) {
            case "green":
              return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
            case "blue":
              return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
            case "red":
              return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
            default:
              return undefined;
          }
        };

        return (
        <React.Fragment key={index}>
          <Marker
            position={{ lat: marker.lat, lng: marker.lng }}
            label={marker.label}
            icon={getMarkerIcon(marker.color)}
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
        );
      })}
    </GoogleMap>
  );
};
