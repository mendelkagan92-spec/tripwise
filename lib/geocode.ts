interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== "OK" || !data.results?.[0]) return null;

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}
