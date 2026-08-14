import type { Plant } from "./data";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export interface PlantFilters {
  sunlight?: string[];
  edible?: boolean;
  zone?: string;
}

export async function fetchPlants(filters: PlantFilters = {}): Promise<Plant[]> {
  const params = new URLSearchParams();
  filters.sunlight?.forEach((s) => params.append("sunlight", s));
  if (filters.edible) params.set("edible", "true");
  if (filters.zone) params.set("zone", filters.zone);

  const response = await fetch(`${API_BASE_URL}/api/plants?${params.toString()}`);
  if (!response.ok) throw new Error(`Failed to load plants (${response.status})`);
  return response.json();
}

export async function fetchPlantById(id: string): Promise<Plant> {
  const response = await fetch(`${API_BASE_URL}/api/plants/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`Failed to load plant ${id} (${response.status})`);
  return response.json();
}
