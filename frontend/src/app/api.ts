import type { Plant, PlantSource } from "./data";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export interface PlantFilters {
  sunlight?: string[];
  edible?: boolean;
  zone?: string;
  // Name search. Only the cleared source searches by name on the server; for
  // the others the page filters the returned plants by name itself.
  query?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // response body wasn't JSON — fall through to the generic message
  }
  return fallback;
}

// `source` picks the backend's plant data. The older `mock` parameter is sent
// too (for the two sources an older backend knows), so a deployed backend that
// predates `source` keeps answering as before.
function sourceParams(params: URLSearchParams, source: PlantSource): void {
  params.set("source", source);
  if (source !== "cleared") params.set("mock", source === "mock" ? "true" : "false");
}

export async function fetchPlants(filters: PlantFilters = {}, source: PlantSource = "mock"): Promise<Plant[]> {
  const params = new URLSearchParams();
  filters.sunlight?.forEach((s) => params.append("sunlight", s));
  if (filters.edible) params.set("edible", "true");
  if (filters.zone) params.set("zone", filters.zone);
  if (source === "cleared" && filters.query?.trim()) params.set("q", filters.query.trim());
  sourceParams(params, source);

  const response = await fetch(`${API_BASE_URL}/api/plants?${params.toString()}`);
  if (!response.ok) throw new Error(await errorMessage(response, `Failed to load plants (${response.status})`));
  return response.json();
}

export async function fetchPlantById(id: string, source: PlantSource = "mock"): Promise<Plant> {
  const params = new URLSearchParams();
  sourceParams(params, source);
  const response = await fetch(`${API_BASE_URL}/api/plants/${encodeURIComponent(id)}?${params.toString()}`);
  if (!response.ok) throw new Error(await errorMessage(response, `Failed to load plant ${id} (${response.status})`));
  return response.json();
}

export async function googleSignIn(credential: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "Google sign-in failed"));
  return response.json();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(await errorMessage(response, "Failed to load current user"));
  return response.json();
}

export async function signOutRequest(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
}
