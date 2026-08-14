export interface Plant {
  id: string;
  commonName: string;
  latinName: string;
  imageUrl: string;
  sunlight: "Full Sun" | "Partial" | "Shade";
  soilTypes: string[];
  zones: string;
  native: boolean;
  flowering: boolean;
  edible: boolean;
  description: string;
  water: string;
  matureSize: string;
  bloomSeason: string;
  tags: string[];
}

export interface PlantList {
  id: string;
  name: string;
  plantIds: string[];
  emoji: string;
}
