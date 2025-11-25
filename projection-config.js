// projection-config.js
// Centralized projection / bounds configuration for Cuba SVG map
// This module provides shared coordinate conversion between lat/lng and SVG pixels

// SVG dimensions from cuba.svg viewBox
export const SVG_SIZE = {
  width: 1795.312,
  height: 760.622,
};

// Geographic bounds for Cuba
// These bounds define the lat/lng rectangle that maps to the SVG viewBox
// Calibrated to match the cuba.svg map projection
export const CUBA_BOUNDS = {
  north: 23.4,   // Northern coast
  south: 19.6,   // Southern coast
  west: -85.2,   // Western tip
  east: -73.8,   // Eastern tip (Faro de Maisí)
};

// Global offset to fine-tune marker positioning
// Adjust these values if markers need systematic shifting
export const OFFSET = {
  x: 0,
  y: 40,  // Moves markers up to better align with coastlines
};

/**
 * Convert latitude/longitude to SVG x,y coordinates
 * Uses simple linear (equirectangular) projection
 *
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @returns {{x: number, y: number}} SVG pixel coordinates
 */
export function latLngToSVG(lat, lng) {
  const { width, height } = SVG_SIZE;

  // Linear mapping from lng to x (west to east)
  const x =
    ((lng - CUBA_BOUNDS.west) / (CUBA_BOUNDS.east - CUBA_BOUNDS.west)) * width +
    OFFSET.x;

  // Linear mapping from lat to y (north to south, inverted for SVG)
  const y =
    ((CUBA_BOUNDS.north - lat) / (CUBA_BOUNDS.north - CUBA_BOUNDS.south)) * height +
    OFFSET.y;

  return { x, y };
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
