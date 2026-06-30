export type SunNeeds = "full sun" | "full sun / partial shade" | "partial shade" | "full shade";
export type PlantStatus = "active" | "removed";

export interface Plant {
  id: string;
  user_id: string;
  genus: string;
  species: string | null;
  cultivar: string | null;
  search_vector?: string; // generated column — never written, rarely read
  date_planted: string | null; // ISO date, day always stored as 1
  photo_url: string | null;
  sun_needs: SunNeeds | null;
  flowering_season_from: number | null;
  flowering_season_to: number | null;
  eventual_height_cm: number | null;
  eventual_spread_cm: number | null;
  status: PlantStatus;
  notes: string | null;
  common_names: string[];
  created_at: string;
  updated_at: string;
}

export type PlantInsert = Omit<Plant, "id" | "user_id" | "created_at" | "updated_at" | "search_vector">;
