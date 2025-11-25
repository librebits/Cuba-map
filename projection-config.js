// projection-config.js
// Centralized projection / bounds configuration for Cuba SVG map
// This module provides shared coordinate conversion between lat/lng and SVG pixels

// SVG dimensions from cuba.svg viewBox
export const SVG_SIZE = {
  width: 1795.312,
  height: 760.622,
};

// Geographic bounds for Cuba (baseline approximation)
// These bounds define the lat/lng rectangle that maps to the SVG viewBox
// Note: cuba.svg uses non-linear projection, so per-city corrections needed
export const CUBA_BOUNDS = {
  north: 23.4,   // Northern coast
  south: 19.6,   // Southern coast
  west: -85.2,   // Western tip
  east: -73.8,   // Eastern tip (Faro de Maisí)
};

// Base offset applied to all cities (baseline)
export const BASE_OFFSET = {
  x: 0,
  y: 40,  // Works well for western cities
};

// Per-city correction offsets (manually calibrated)
// cuba.svg projection is non-linear: western vs eastern Cuba differ by ~80px on Y axis
// These deltas correct the baseline position for each city
export const CITY_OFFSETS = {
  'Habana': { deltaX: 0, deltaY: 0 },
  'Viñales': { deltaX: 0, deltaY: 0 },
  'Soroa': { deltaX: 0, deltaY: 0 },
  'Playa Larga': { deltaX: 0, deltaY: 0 },
  'Cienfuegos': { deltaX: 0, deltaY: 0 },
  'Trinidad': { deltaX: 0, deltaY: 0 },
  'Camagüey': { deltaX: 0, deltaY: 0 },
  'Santiago de Cuba': { deltaX: 0, deltaY: 0 },
  'Baracoa': { deltaX: 0, deltaY: 0 },
  'Faro de Maisi': { deltaX: 0, deltaY: 0 },
  'Yumurí': { deltaX: 0, deltaY: 0 },
};

/**
 * Convert latitude/longitude to SVG x,y coordinates
 * Uses baseline linear projection + per-city corrections
 *
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {string} [cityName] - Optional city name for per-city correction
 * @returns {{x: number, y: number}} SVG pixel coordinates
 */
export function latLngToSVG(lat, lng, cityName = null) {
  const { width, height } = SVG_SIZE;

  // Step 1: Baseline linear conversion
  const baseX = ((lng - CUBA_BOUNDS.west) / (CUBA_BOUNDS.east - CUBA_BOUNDS.west)) * width;
  const baseY = ((CUBA_BOUNDS.north - lat) / (CUBA_BOUNDS.north - CUBA_BOUNDS.south)) * height;

  // Step 2: Apply base offset
  let x = baseX + BASE_OFFSET.x;
  let y = baseY + BASE_OFFSET.y;

  // Step 3: Apply city-specific correction (if available)
  if (cityName && CITY_OFFSETS[cityName]) {
    x += CITY_OFFSETS[cityName].deltaX;
    y += CITY_OFFSETS[cityName].deltaY;
  }

  return { x, y };
}

/**
 * Get baseline position (without city-specific corrections)
 * Useful for calibration tools to show before/after
 */
export function getBaselinePosition(lat, lng) {
  const { width, height } = SVG_SIZE;
  const baseX = ((lng - CUBA_BOUNDS.west) / (CUBA_BOUNDS.east - CUBA_BOUNDS.west)) * width;
  const baseY = ((CUBA_BOUNDS.north - lat) / (CUBA_BOUNDS.north - CUBA_BOUNDS.south)) * height;
  return {
    x: baseX + BASE_OFFSET.x,
    y: baseY + BASE_OFFSET.y
  };
}

/**
 * City-specific position adjustments
 * Use these for fine-tuning individual city marker positions
 * Returns adjusted y-coordinate or original if no adjustment needed
 *
 * @param {string} cityName - Name of the city
 * @param {number} y - Original y-coordinate
 * @returns {number} Adjusted y-coordinate
 */
export function getCityYAdjustment(cityName, y) {
  const adjustments = {
    'Habana': y + 5,      // Move slightly south
    'Trinidad': y - 25,   // Move north (avoid overlaps)
  };

  return adjustments[cityName] ?? y;
}

/**
 * Label positioning configuration for each city
 * Returns {labelX, labelY} offsets relative to marker position
 *
 * @param {string} cityName - Name of the city
 * @param {number} markerX - Marker x-coordinate
 * @param {number} markerY - Marker y-coordinate (after adjustment)
 * @returns {{labelX: number, labelY: number}} Label coordinates
 */
export function getCityLabelPosition(cityName, markerX, markerY) {
  const positions = {
    'Viñales': { labelX: markerX - 30, labelY: markerY - 5 },
    'Habana': { labelX: markerX + 25, labelY: markerY - 5 },
    'Soroa': { labelX: markerX, labelY: markerY - 13 },
    'Playa Larga': { labelX: markerX + 30, labelY: markerY + 10 },
    'Cienfuegos': { labelX: markerX - 20, labelY: markerY + 18 },
    'Trinidad': { labelX: markerX, labelY: markerY + 22 },
    'Camagüey': { labelX: markerX, labelY: markerY - 12 },
    'Santiago de Cuba': { labelX: markerX + 20, labelY: markerY + 15 },
    'Baracoa': { labelX: markerX, labelY: markerY - 10 },
    'Faro de Maisi': { labelX: markerX + 15, labelY: markerY + 15 },
    'Yumurí': { labelX: markerX - 15, labelY: markerY - 10 },
  };

  return positions[cityName] || { labelX: markerX, labelY: markerY - 8 };
}
