import React, { createContext, useContext, ReactNode } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(
  undefined
);

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error("useGoogleMaps must be used within GoogleMapsProvider");
  }
  return context;
};

interface GoogleMapsProviderProps {
  apiKey: string;
  children: ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  apiKey,
  children,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
