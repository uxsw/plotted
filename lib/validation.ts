import type { PlantInsert } from "@/lib/types";

export type FieldErrors = Partial<Record<string, string>>;

function isValidMonth(n: number | null | undefined): boolean {
  return (
    n !== null &&
    n !== undefined &&
    Number.isInteger(n) &&
    n >= 1 &&
    n <= 12
  );
}

/**
 * Validates a PlantInsert after sanitization has already been applied.
 * Returns an object of field-keyed error messages; empty object = valid.
 */
export function validatePlantInput(data: PlantInsert): FieldErrors {
  const errors: FieldErrors = {};

  // species — required after sanitization
  if (!data.species) {
    errors.species = "Species is required.";
  }

  // date_planted — must be YYYY-MM-01 with a real month and sensible year
  if (data.date_planted) {
    const match = /^(\d{4})-(\d{2})-01$/.exec(data.date_planted);
    if (!match) {
      errors.date_planted = "Invalid date.";
    } else {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      if (month < 1 || month > 12) {
        errors.date_planted = "Month must be between 1 and 12.";
      } else if (year < 1900 || year > 2100) {
        errors.date_planted = "Year must be between 1900 and 2100.";
      }
    }
  }

  // flowering months — each must be 1–12 if provided; from > to is allowed
  // (represents a season that wraps across the new year, e.g. Nov–Feb)
  if (data.flowering_season_from != null && !isValidMonth(data.flowering_season_from)) {
    errors.flowering_season_from = "Flowering start month must be between 1 and 12.";
  }
  if (data.flowering_season_to != null && !isValidMonth(data.flowering_season_to)) {
    errors.flowering_season_to = "Flowering end month must be between 1 and 12.";
  }

  // dimensions — positive integers if provided
  if (data.eventual_height_cm != null) {
    if (!Number.isInteger(data.eventual_height_cm) || data.eventual_height_cm <= 0) {
      errors.eventual_height_cm = "Height must be a positive whole number.";
    }
  }
  if (data.eventual_spread_cm != null) {
    if (!Number.isInteger(data.eventual_spread_cm) || data.eventual_spread_cm <= 0) {
      errors.eventual_spread_cm = "Spread must be a positive whole number.";
    }
  }

  return errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
