export type Sunlight = "Full Sun" | "Partial" | "Shade";

// Where plant data comes from; the backend's `?source=` values.
export type PlantSource = "cleared" | "mock" | "perenual";

// How a plant relates to a region ("native in Maryland"). "cultivated" means grown
// in gardens there but not living wild; "unknown" means the sources disagree or are silent.
export type Nativity = "native" | "introduced" | "cultivated" | "unknown";

// Where a ZIP code is, from the cleared plant data (cleared source only).
export interface ZipLocation {
  zip: string;
  region: string;
  regionName: string;
  state: string;
  county: string;
  approximate: boolean;
  hasPlantData: boolean;
}

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
  imagePageUrl?: string;
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
  // Cleared source only. null = the data has no row for this region.
  nativity?: Nativity | null;
  nativityRegion?: string;
  nativityRegionName?: string;
  nativityConfidence?: string;
  nativityBasis?: string;
}

// Short label for a tile chip; null when there is nothing to show.
export function nativityChipLabel(plant: Plant): string | null {
  switch (plant.nativity) {
    case "native":
      return "Native";
    case "introduced":
      return "Introduced";
    case "cultivated":
      return "Garden-grown only";
    default:
      return null;
  }
}

// Full wording for the detail page, naming the region; "" when there is no data.
export function nativityDetailLabel(plant: Plant): string {
  const where = plant.nativityRegionName || "this region";
  switch (plant.nativity) {
    case "native":
      return `Native to ${where}`;
    case "introduced":
      return `Introduced in ${where}`;
    case "cultivated":
      return `Garden-grown only in ${where}`;
    case "unknown":
      return `Unclear for ${where}`;
    default:
      return "";
  }
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
