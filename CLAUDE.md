# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive Cuba map project built with vanilla JavaScript and SVG. The project displays a map of Cuba with interactive markers for major cities and tourist destinations.

## Architecture

- **index.html**: Main HTML container that embeds the SVG map
- **cuba.svg**: SVG vector map of Cuba with geographic boundaries
- **locations.json**: Simple JSON with city coordinates (x, y pixels for SVG positioning)
- **cuba-locations-geojson.json**: GeoJSON format with real latitude/longitude coordinates and location metadata
- **map.js**: JavaScript module for interactive functionality (referenced but not yet created)

## Development

### Running the Project
Open `index.html` in a web browser. No build process or server required.

### Key Technologies
- Vanilla JavaScript (ES6+ modules)
- SVG for map graphics
- JSON for location data

### Code Conventions
- Follow KISS (Keep It Simple Stupid) principle
- Use functional programming paradigm over object-oriented when possible
- Vanilla JavaScript only - no React or frameworks
- Refer to MDN documentation for web standards

## Data Structure

The project uses two location data formats:
1. **locations.json**: Pixel coordinates for SVG positioning
2. **cuba-locations-geojson.json**: Standard GeoJSON with real coordinates and rich metadata (population, province, notable features)

## Style Guide

### Visual Design Principles
- **Text labels with backgrounds**: Use semi-transparent white rectangles behind text for better readability
- **Strategic label positioning**: Position city labels to avoid overlapping with route lines
- **Dashed route lines**: Use `stroke-dasharray: "5,3"` for itinerary routes
- **Midpoint arrows**: Place directional arrows at 50% along curved routes, oriented to follow curve tangent (arrowSize = 9px)
- **Consistent colors**: Use `#555555` for routes and arrows, `#ff4444` for city markers

### Route Arrow Implementation
- Calculate curve midpoint using quadratic Bézier formula
- Determine arrow orientation by calculating tangent angle at midpoint
- Position arrow as oriented polygon, not as path marker
- Inspired by clean, professional map styling (reference: Sri Lanka map design)

### Multi-Route Architecture
- **Modular design**: Use `drawRoutes()` and `drawSingleRoute()` functions for reusability
- **Curvature control**: Pass positive values for lower curves, negative for upper curves
- **Route examples**:
  - Habana → Viñales (curvature = -60, upper path)
  - Viñales → Soroa (curvature = +60, lower path)
- **Consistent styling**: All routes share same dashed pattern, arrow size, and colors
- **Scalable approach**: Easy to add new route segments to complete itineraries

### S-Curve (Smooth Inflection) Bézier Routes

For routes requiring smooth S-shaped curves with inflection points (e.g., long-distance routes that need to avoid overlaps):

**Key Principles:**
- Use cubic Bézier curves with **asymmetrically positioned control points**
- Position control points at different percentages (e.g., 25% and 75%) for natural S-shape
- Create inflection by pulling control points in **opposite relative directions**

**Control Point Strategy:**
```javascript
// Example: Trinidad → Habana S-curve avoiding other routes
control1X = startX + (endX - startX) * 0.25  // Earlier control point
control2X = startX + (endX - startX) * 0.75  // Later control point

control1Y = startY - 60  // Pull strongly north at start
control2Y = endY - 15    // Continue north toward end
```

**Avoiding Overlaps:**
1. **Analyze the map**: Identify which routes/markers need to be avoided
2. **Adjust control point 1**: Pull aggressively away from obstacles at the start
3. **Adjust control point 2**: Maintain inland trajectory while approaching destination
4. **Iterate**: Increase offset values (e.g., -30 → -60) until route clears all overlaps

**Staying Inland:**
- Negative Y values pull north (inland for southern coastal cities)
- Positive Y values pull south (inland for northern coastal cities)
- Test with viewBox showing full island boundaries
- Ensure route doesn't exceed Cuba's coastlines

**Real Example (Trinidad → Habana):**
- Control point 1: -60px north (avoids Cienfuegos → Trinidad straight line)
- Control point 2: -15px north (continues through central Cuba)
- Result: Smooth S-curve staying inland, no overlaps

## Planned Features (from README.org)
Sample itinerary routing: Habana → Viñales → Soroa → Playa Larga → Cienfuegos → Trinidad → Havana
- change the Styling of the routes in the SVG map : not dashed but continuous lines. Add a very subtle curve.  Get inspiration in the ./Screeshots/indiaMap.gif
- draw itinerary paths not sealand but going inland. Adapt the Bezier curves as required for (quadratic, quintic curves... ).
- As a style guide, itinerary paths not to overlap on location texts.