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

## Planned Features (from README.org)
Sample itinerary routing: Habana → Viñales → Soroa → Playa Larga → Cienfuegos → Trinidad → Havana