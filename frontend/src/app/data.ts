export type Sunlight = "Full Sun" | "Partial" | "Shade";

// Where plant data comes from; the backend's `?source=` values.
export type PlantSource = "cleared" | "mock" | "perenual";

export interface Plant {
  id: string;
  commonName: string;
  latinName: string;
  imageUrl: string;
  // Photo credit (cleared data only). Must be shown wherever the photo is
  // shown before that source is public (BACKLOG PF-001).
  imageCredit?: string;
  imageLicense?: string;
  imageLicenseUrl?: string;
  // Perenual/mock plants have one `sunlight` value. Cleared plants list every
  // tag in `sunlightTags` and may have none ("no data").
  sunlight?: Sunlight | null;
  sunlightTags?: Sunlight[];
  soilTypes: string[];
  zones: string;
  // true / false / null: null (or missing) means the source has no data, which
  // is not the same as "no". Show nothing for it.
  native?: boolean | null;
  flowering?: boolean | null;
  edible?: boolean | null;
  description: string;
  water: string;
  matureSize: string;
  bloomSeason: string;
  tags: string[];
}

// Every sunlight value a plant has, in display order (empty = no data).
export function sunlightOf(plant: Plant): Sunlight[] {
  if (plant.sunlightTags) return plant.sunlightTags;
  return plant.sunlight ? [plant.sunlight] : [];
}

export interface PlantList {
  id: string;
  name: string;
  plantIds: string[];
  emoji: string;
}
