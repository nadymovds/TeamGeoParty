import React, { useState, useRef, useEffect } from "react";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";

interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  title?: string;
  color?: "red" | "green" | "blue";
}

interface StaticMapProps {
  center?: { lat: number; lng: number };
  markers?: MapMarker[];
  zoom?: number;
  width?: number;
  height?: number;
  fitBounds?: boolean;
}

export const StaticMap: React.FC<StaticMapProps> = ({
  center,
  markers = [],
  zoom = 2,
  width = 600,
  height = 400,
  fitBounds = false,
}) => {
  const { apiKey } = useGoogleMaps();
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Calculate bounds center if fitBounds is true
  const getCenter = () => {
    if (fitBounds && markers.length > 0) {
      const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
      const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
      return { lat: avgLat, lng: avgLng };
    }
    return center || { lat: 0, lng: 0 };
  };

  // Calculate zoom to fit all markers if fitBounds is true
  const getZoom = () => {
    if (!fitBounds || markers.length <= 1) return zoom;

    const lats = markers.map((m) => m.lat);
    const lngs = markers.map((m) => m.lng);
    const latSpan = Math.max(...lats) - Math.min(...lats);
    const lngSpan = Math.max(...lngs) - Math.min(...lngs);
    const maxSpan = Math.max(latSpan, lngSpan);

    // Approximate zoom level based on span
    if (maxSpan > 100) return 1;
    if (maxSpan > 50) return 2;
    if (maxSpan > 20) return 3;
    if (maxSpan > 10) return 4;
    if (maxSpan > 5) return 5;
    if (maxSpan > 2) return 6;
    if (maxSpan > 1) return 7;
    if (maxSpan > 0.5) return 8;
    if (maxSpan > 0.2) return 10;
    if (maxSpan > 0.1) return 11;
    if (maxSpan > 0.05) return 12;
    return 13;
  };

  const buildUrl = () => {
    const mapCenter = getCenter();
    const mapZoom = getZoom();
    const scale = 2; // Retina display support

    const params = new URLSearchParams();
    params.set("center", `${mapCenter.lat},${mapCenter.lng}`);
    params.set("zoom", mapZoom.toString());
    params.set("size", `${width}x${height}`);
    params.set("scale", scale.toString());
    params.set("key", apiKey);

    // Group markers by color for more efficient URL
    const markersByColor: Record<string, MapMarker[]> = {};
    markers.forEach((marker) => {
      const color = marker.color || "red";
      if (!markersByColor[color]) {
        markersByColor[color] = [];
      }
      markersByColor[color].push(marker);
    });

    // Build URL manually to handle multiple markers params
    let url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;

    // Define color order: red markers first, green on top
    const colorOrder = ['red', 'green', 'blue'];
    colorOrder.forEach((color) => {
      if (markersByColor[color]) {
        const colorMarkers = markersByColor[color];
        const locations = colorMarkers.map((m) => `${m.lat},${m.lng}`).join("|");
        url += `&markers=color:${color}|${locations}`;
      }
    });

    return url;
  };

  const containerStyle = {
    width: "100%",
    height: `${height}px`,
  };

  return (
    <div ref={containerRef} style={containerStyle} className="rounded overflow-hidden bg-gray-100">
      {isVisible ? (
        <img
          src={buildUrl()}
          alt="Map"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500">Loading map...</p>
        </div>
      )}
    </div>
  );
};
