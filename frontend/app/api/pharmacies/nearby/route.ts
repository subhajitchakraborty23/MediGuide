import { NextRequest, NextResponse } from "next/server";

// Types
interface GooglePlace {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  vicinity?: string;
  formatted_address?: string;
  opening_hours?: {
    open_now?: boolean;
  };
  rating?: number;
  photos?: Array<{
    photo_reference: string;
  }>;
  business_status?: string;
  types?: string[];
}

interface Pharmacy {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  website?: string;
  isOpen?: boolean;
  distance: number;
  rating?: number;
  placeId: string;
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseInt(searchParams.get("radius") || "5000");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Missing latitude or longitude" },
        { status: 400 },
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 },
      );
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
    );
    url.searchParams.append("location", `${lat},${lng}`);
    url.searchParams.append("radius", radius.toString());
    url.searchParams.append("type", "pharmacy");
    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Maps API error:", data);
      return NextResponse.json(
        { error: `Google Maps API error: ${data.status}` },
        { status: 500 },
      );
    }

    // Transform results
    const pharmacies: Pharmacy[] = (data.results || [])
      .filter(
        (place: GooglePlace) =>
          place.business_status !== "CLOSED_PERMANENTLY" &&
          !place.types?.some((type) =>
            ["hospital", "doctor", "health", "clinic"].includes(type),
          ),
      )
      .map((place: GooglePlace) => {
        const distance = calculateDistance(
          lat,
          lng,
          place.geometry.location.lat,
          place.geometry.location.lng,
        );

        return {
          id: place.place_id,
          name: place.name,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          address:
            place.formatted_address ||
            place.vicinity ||
            "Address not available",
          isOpen: place.opening_hours?.open_now,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          rating: place.rating,
          placeId: place.place_id,
        };
      })
      .sort((a: Pharmacy, b: Pharmacy) => a.distance - b.distance); // Sort by distance

    return NextResponse.json(pharmacies);
  } catch (error) {
    console.error("Error fetching pharmacies:", error);
    return NextResponse.json(
      { error: "Failed to fetch pharmacies" },
      { status: 500 },
    );
  }
}
