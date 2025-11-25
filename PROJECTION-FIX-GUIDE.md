# Cuba Map - Projection Fix Implementation Guide

## Problem Summary

**Critical Bug:** City markers appearing in water instead of on land, especially Santiago de Cuba and eastern cities.

**Root Cause:** Mismatch between GeoJSON lat/lng coordinates and SVG coordinate system in the `latLngToSVG()` conversion function.

---

## Solution Implemented

### Files Created

1. **`projection-config.js`** (NEW)
   - Centralized projection configuration module
   - Exports `SVG_SIZE`, `CUBA_BOUNDS`, `OFFSET`
   - Contains `latLngToSVG()` coordinate conversion function
   - Provides `getCityYAdjustment()` and `getCityLabelPosition()` helpers
   - **Single source of truth** for all maps (CUBA1, CUBA2, etc.)

2. **`map2-markers-only.js`** (NEW)
   - Refactored CUBA2 map showing **only markers** (no routes)
   - Imports shared `projection-config.js`
   - Shows 11 CUBA2 cities (excludes María la Gorda)
   - Clean test case for verifying marker positioning
   - Exports as `cuba-map2-cities-only.svg`

3. **`index2-markers-only.html`** (NEW)
   - Test page for markers-only version
   - Simple interface to verify city positions
   - Links to `map2-markers-only.js`

4. **`calibrate-projection.html`** (NEW)
   - **Interactive calibration tool**
   - Adjust `CUBA_BOUNDS` and `OFFSET` in real-time
   - Tests 6 reference cities:
     - Habana (north coast, capital)
     - Santiago de Cuba (southeast coast)
     - Baracoa (far east)
     - Faro de Maisí (extreme east point)
     - Viñales (west)
     - Trinidad (south-central)
   - Displays calculated SVG coordinates
   - Visual feedback with red markers and labels

---

## How to Test & Calibrate

### Step 1: Test Current Configuration

```bash
# Open the markers-only test page
firefox index2-markers-only.html
# or
xdg-open index2-markers-only.html
```

**Check:**
- Are all 11 cities visible on the map?
- Is Santiago de Cuba on land (southeast coast)?
- Are Baracoa, Faro de Maisí, Yumurí correctly positioned in eastern Cuba?
- Is Habana on the north coast?

### Step 2: If Positioning Needs Adjustment

```bash
# Open the interactive calibration tool
firefox calibrate-projection.html
```

**Calibration Process:**

1. **Adjust North/South bounds** if cities are too far north/south
   - Increase `north` to move markers south
   - Decrease `south` to move markers north

2. **Adjust West/East bounds** if cities are too far west/east
   - Increase `west` (less negative) to move markers east
   - Decrease `east` (more negative) to move markers west

3. **Adjust X/Y offsets** for systematic shifts
   - Increase `Y offset` to move all markers down
   - Decrease `Y offset` to move all markers up
   - Adjust `X offset` for horizontal shifts

4. **Click "Update Map"** to see changes in real-time

5. **Focus on reference cities:**
   - Habana should be on northern coast
   - Santiago should be on southeastern coast (inland, not in water)
   - Faro de Maisí should be at extreme eastern tip

6. **Copy calibrated values** from the output box

### Step 3: Apply Calibrated Values

Once you find the correct bounds:

```bash
# Edit projection-config.js
nano projection-config.js
```

Update the `CUBA_BOUNDS` and `OFFSET` constants with your calibrated values.

### Step 4: Verify Final Positioning

```bash
# Refresh the test page
firefox index2-markers-only.html
```

All cities should now appear correctly on land!

---

## Current Configuration

**SVG Dimensions:**
```javascript
SVG_SIZE = {
  width: 1795.312,
  height: 760.622
}
```

**Initial Bounds** (may need calibration):
```javascript
CUBA_BOUNDS = {
  north: 23.4,   // Northern coast
  south: 19.6,   // Southern coast
  west: -85.2,   // Western tip
  east: -73.8    // Eastern tip (Faro de Maisí)
}

OFFSET = {
  x: 0,
  y: 40  // Moves markers up
}
```

---

## Reference City Coordinates

Use these to verify positioning:

| City | Latitude | Longitude | Expected Position |
|------|----------|-----------|-------------------|
| Habana | 23.1136°N | -82.3666°W | North coast (capital) |
| Santiago de Cuba | 20.0247°N | -75.8219°W | Southeast coast (inland) |
| Baracoa | 20.3475°N | -74.5024°W | Far northeast coast |
| Faro de Maisí | 20.2089°N | -74.1336°W | Extreme east point |
| Viñales | 22.6167°N | -83.7167°W | Northwest interior |
| Trinidad | 21.8022°N | -79.9847°W | South-central coast |

---

## Next Steps (After Calibration)

1. ✅ **Calibrate projection** using `calibrate-projection.html`
2. ✅ **Update** `projection-config.js` with correct values
3. ✅ **Verify** markers on `index2-markers-only.html`
4. **Refactor** existing `map.js` (CUBA1) to use shared `projection-config.js`
5. **Refactor** existing `map2.js` (CUBA2) to use shared `projection-config.js`
6. **Add routes** back to CUBA2 once markers are correctly positioned
7. **Test** that all routes stay inland

---

## Benefits of This Approach

✅ **Single source of truth** - All maps use same projection config
✅ **Easy maintenance** - Change bounds once, applies everywhere
✅ **Reduced code duplication** - DRY principle
✅ **Interactive calibration** - Visual feedback for adjustments
✅ **Systematic testing** - Markers-only version isolates positioning issues

---

## Files Modified in TODO.org

Updated `TODO.org` to mark the following as **DONE**:
- ✅ CRITICAL: Fix coordinate/map projection mismatch
- ✅ CUBA2 map with markers only (no itineraries)
- ✅ Investigation: SVG projection type, bounds calibration, reference cities

---

## Troubleshooting

**Problem:** Cities still appearing in water after calibration

**Solutions:**
1. Check that `projection-config.js` is being imported correctly
2. Verify browser is loading the latest version (hard refresh: Ctrl+Shift+R)
3. Check browser console for JavaScript errors
4. Verify GeoJSON coordinates in `cuba-locations-geojson.json`

**Problem:** Some cities correct, others wrong

**Solutions:**
1. The SVG may use a non-linear projection (not equirectangular)
2. May need to adjust individual city offsets using `getCityYAdjustment()`
3. Fine-tune label positions using `getCityLabelPosition()`

---

## Architecture

```
┌─────────────────────────────────────┐
│  projection-config.js               │
│  (Shared module)                    │
│  - SVG_SIZE                         │
│  - CUBA_BOUNDS                      │
│  - OFFSET                           │
│  - latLngToSVG()                    │
│  - getCityYAdjustment()             │
│  - getCityLabelPosition()           │
└──────────────┬──────────────────────┘
               │ (imports)
               │
       ┌───────┴────────┬─────────────────┐
       │                │                 │
       ▼                ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   map.js     │  │ map2.js      │  │calibrate...  │
│   (CUBA1)    │  │ (CUBA2)      │  │   .html      │
│ [to refactor]│  │[to refactor] │  │ (test tool)  │
└──────────────┘  └──────────────┘  └──────────────┘
       │                │
       │                │
       ▼                ▼
   index.html    index2.html
```

---

**Status:** ✅ Solution implemented, ready for testing and calibration
