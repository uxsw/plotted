export interface Garden {
  id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  created_at: string;
  updated_at: string;
}

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
  image_source: "wikimedia" | "upload" | null;
  image_attribution: string | null;
  sun_needs: SunNeeds | null;
  flowering_season_from: number | null;
  flowering_season_to: number | null;
  eventual_height_cm: number | null;
  eventual_spread_cm: number | null;
  status: PlantStatus;
  notes: string | null;
  common_names: string[];
  lookup_status: "skipped" | "success" | "not_found" | "error" | null;
  lookup_notice_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

// image_source and image_attribution are optional on insert — existing plant
// creation flows don't set them; only the purchased-from-shopping-list path does.
export type PlantInsert = Omit<
  Plant,
  "id" | "user_id" | "created_at" | "updated_at" | "search_vector" | "lookup_status" | "lookup_notice_seen_at" | "image_source" | "image_attribution"
> & {
  image_source?: "wikimedia" | "upload" | null;
  image_attribution?: string | null;
};

export interface SpeciesRef {
  id: string;
  lookup_status: "pending" | "complete" | "failed";
  frost_tolerance_c: number | null;
  frost_tolerance_notice: string | null;
}

export type SchemeSpace = "small" | "medium" | "large";
export type SchemeTier = "back" | "mid" | "ground";
export type SchemeStatus = "generating" | "complete" | "failed";

export interface Scheme {
  id: string;
  user_id: string;
  status: SchemeStatus;
  name: string | null;
  summary: string | null;
  space: SchemeSpace;
  successional: boolean;
  edible: boolean;
  narrative_intro: string | null;
  narrative_body: string | null;
  featured_plant_latin: string | null;
  ai_notice_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchemeSourcePlant {
  id: string;
  scheme_id: string;
  plant_id: string | null;
  sort_order: number;
}

export interface SchemeSuggestion {
  id: string;
  scheme_id: string;
  common_name: string;
  latin_name: string;
  tier: SchemeTier;
  height_cm: number | null;
  flowering_months: number[] | null;
  why: string;
  wildlife_value: boolean;
  drought_tolerant: boolean;
  edible: boolean;
  british_native: boolean;
  wikimedia_image_url: string | null;
  wikimedia_attribution: string | null;
  saved: boolean;
  sort_order: number;
}
