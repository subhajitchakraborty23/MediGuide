"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";

interface Pharmacy {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  website?: string;
  isOpen?: boolean;
  distance?: number;
  rating?: number;
  placeId?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "600px",
  borderRadius: "8px",
};

export function PharmacyMap() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError(
            "Unable to get your location. Please enable location services.",
          );
          setIsLoading(false);
        },
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
    }
  }, []);

  const fetchPharmacies = useCallback(async () => {
    if (!userLocation) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/pharmacies/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch pharmacies");
      }

      const data: Pharmacy[] = await response.json();
      setPharmacies(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching pharmacies:", err);
      setError("Failed to load nearby pharmacies. Please try again.");
      setIsLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    if (userLocation && isLoaded) {
      fetchPharmacies();
    }
  }, [userLocation, isLoaded, fetchPharmacies]);

  if (loadError) {
    return (
      <div className="w-full h-150 bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <p className="text-red-600 font-semibold">
            Failed to load Google Maps
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Please check your API key configuration
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-150 bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (isLoading && !pharmacies.length) {
    return (
      <div className="w-full h-150 bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Finding nearby pharmacies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-150 bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="w-full h-150 bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-600">Getting your location...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: userLocation.lat, lng: userLocation.lng }}
        zoom={19}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {/* User location marker */}
        <Marker
          position={{ lat: userLocation.lat, lng: userLocation.lng }}
          title="Your Location"
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4F46E5",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          }}
          onClick={() => setSelectedPharmacy(null)}
        />

        {/* Pharmacy markers */}
        {pharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            position={{ lat: pharmacy.lat, lng: pharmacy.lng }}
            title={pharmacy.name}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            }}
            onClick={() => setSelectedPharmacy(pharmacy)}
          />
        ))}

        {/* Info window for selected pharmacy */}
        {selectedPharmacy && (
          <InfoWindow
            position={{ lat: selectedPharmacy.lat, lng: selectedPharmacy.lng }}
            onCloseClick={() => setSelectedPharmacy(null)}
          >
            <div className="w-64 p-2">
              <h3 className="font-bold text-green-700 mb-2">
                {selectedPharmacy.name}
              </h3>
              <p className="text-xs text-gray-700 mb-1">
                <strong>Address:</strong> {selectedPharmacy.address}
              </p>
              {selectedPharmacy.distance && (
                <p className="text-xs text-gray-700 mb-1">
                  <strong>Distance:</strong>{" "}
                  {selectedPharmacy.distance.toFixed(1)} km away
                </p>
              )}
              {selectedPharmacy.phone && (
                <p className="text-xs text-gray-700 mb-1">
                  <strong>Phone:</strong>{" "}
                  <a
                    href={`tel:${selectedPharmacy.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {selectedPharmacy.phone}
                  </a>
                </p>
              )}
              {selectedPharmacy.isOpen !== undefined && (
                <p className="text-xs mb-2">
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      selectedPharmacy.isOpen
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {selectedPharmacy.isOpen ? "Open Now" : "Closed"}
                  </span>
                </p>
              )}
              {selectedPharmacy.rating && (
                <p className="text-xs text-gray-700 mb-2">
                  <strong>Rating:</strong> ⭐ {selectedPharmacy.rating}/5
                </p>
              )}
              {selectedPharmacy.website && (
                <a
                  href={selectedPharmacy.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-xs hover:underline"
                >
                  Visit Website
                </a>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Pharmacy List */}
      {pharmacies.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">
            Found {pharmacies.length} pharmacies near you
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
            {pharmacies.map((pharmacy) => (
              <div
                key={pharmacy.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setSelectedPharmacy(pharmacy)}
              >
                <h4 className="font-semibold text-primary mb-2">
                  {pharmacy.name}
                </h4>
                <p className="text-sm text-white/70 mb-2">{pharmacy.address}</p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  {pharmacy.distance && (
                    <span>📍 {pharmacy.distance.toFixed(1)} km away</span>
                  )}
                  {pharmacy.isOpen !== undefined && (
                    <span
                      className={
                        pharmacy.isOpen ? "text-green-400" : "text-red-400"
                      }
                    >
                      {pharmacy.isOpen ? "Open" : "Closed"}
                    </span>
                  )}
                </div>
                {pharmacy.phone && (
                  <a
                    href={`tel:${pharmacy.phone}`}
                    className="inline-block mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Call Now
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
