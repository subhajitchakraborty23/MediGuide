export interface NearbyPharmacy {
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
  placeId: string;
}

export async function getNearbyPharmacies(
  lat: number,
  lng: number,
  radiusKm: number = 5,
): Promise<NearbyPharmacy[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key is not configured");
  }

  try {
    const response = await fetch(
      `/api/pharmacies/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm * 1000}`,
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching pharmacies:", error);
    throw error;
  }
}

export function calculateDistance(
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
