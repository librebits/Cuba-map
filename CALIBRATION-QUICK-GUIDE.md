# 🎯 Cuba Map - Per-City Calibration Quick Guide

## The Problem

Cuba's SVG map uses **non-linear projection**:
- Western cities work with `Y offset = 40`
- Eastern cities need `Y offset = 120` (80px difference!)
- One CUBA_BOUNDS can't fit all

## The Solution

**Per-city manual corrections** using the new calibration tool.

---

## 🚀 Quick Start (3 Steps)

### 1. Open the Calibrator

```bash
firefox calibrate-per-city.html
# or
xdg-open calibrate-per-city.html
```

### 2. Calibrate Each City

For each city (11 total):

1. **Look at the map**:
   - 🔵 Gray marker = baseline position (mathematical)
   - 🔴 Red marker = adjusted position (what you control)

2. **Adjust position**:
   - Use **sliders** OR **arrow keys** (←→↑↓)
   - Shift + arrows = move 10px at a time
   - Goal: Red marker should be on land, in correct position

3. **Next city**:
   - Click "Next City" or press Enter
   - Progress shown top-right (e.g., "City 3/11")

### 3. Export & Apply

1. After calibrating all 11 cities, click **"Export CITY_OFFSETS"**
2. Copy the generated code from the textarea
3. Paste into `projection-config.js` (replace existing CITY_OFFSETS)
4. Done! 🎉

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Adjust deltaX (±1px) |
| `↑` `↓` | Adjust deltaY (±1px) |
| `Shift` + arrows | Move ±10px |
| `Enter` | Save & next city |
| `R` | Reset current city |

---

## 💾 Save Your Progress

**Important:** Calibrating 11 cities takes time!

- Click **"Save Progress"** → Saves to browser localStorage
- Click **"Load Progress"** → Resume where you left off
- Works across browser sessions

---

## 🗺️ Expected Corrections (Approximate)

Based on the ~80px Y difference between west and east:

| City | Expected deltaY |
|------|----------------|
| Habana | 0 (baseline OK) |
| Viñales | 0 |
| Soroa | 0 |
| Playa Larga | ~10 |
| Cienfuegos | ~20 |
| Trinidad | ~30 |
| Camagüey | ~50 |
| **Santiago de Cuba** | **~80** |
| Baracoa | ~80 |
| Faro de Maisi | ~80 |
| Yumurí | ~80 |

These are **rough estimates** - adjust visually until perfect!

---

## 📋 Example Output

After calibration, you'll get code like this:

```javascript
export const CITY_OFFSETS = {
  'Habana': { deltaX: 0, deltaY: 0 },
  'Viñales': { deltaX: 0, deltaY: 0 },
  'Soroa': { deltaX: 0, deltaY: 0 },
  'Playa Larga': { deltaX: 0, deltaY: 12 },
  'Cienfuegos': { deltaX: 0, deltaY: 23 },
  'Trinidad': { deltaX: 0, deltaY: 35 },
  'Camagüey': { deltaX: 0, deltaY: 52 },
  'Santiago de Cuba': { deltaX: 0, deltaY: 83 },
  'Baracoa': { deltaX: 0, deltaY: 80 },
  'Faro de Maisi': { deltaX: 0, deltaY: 78 },
  'Yumurí': { deltaX: 0, deltaY: 81 },
};
```

Copy this and replace the CITY_OFFSETS block in `projection-config.js`.

---

## ✅ Testing After Calibration

1. Open `index2-markers-only.html`
2. All cities should appear correctly on land
3. No more "cities in the sea" problem!
4. Ready to add routes back to map2.js

---

## 🎨 Visual Guide

```
Before calibration:
  Santiago de Cuba → 🔴 (in the sea - WRONG)

During calibration:
  Santiago de Cuba → 🔵 baseline (in sea)
                   → 🔴 adjusted (move down 80px with slider)

After calibration:
  Santiago de Cuba → 🔴 (on land, southeast coast - CORRECT!)
```

---

## 🔧 Troubleshooting

**Problem:** SVG not loading

**Solution:** Wait a few seconds and refresh

---

**Problem:** Can't see markers

**Solution:** Zoom out your browser (Ctrl + Minus)

---

**Problem:** Lost my calibration progress

**Solution:** Use "Save Progress" frequently! It's in localStorage.

---

**Problem:** Export button doesn't work

**Solution:** Make sure you've adjusted at least one city first

---

## 🎯 Pro Tips

1. **Start with western cities** (Habana, Viñales) - they should be close to baseline
2. **Eastern cities need big adjustments** (~80px down)
3. **Use keyboard** for fine-tuning (more precise than sliders)
4. **Save often** if taking breaks
5. **Visual reference:** Keep Screenshot/CubaMap2.3.png open to see what "correct" looks like

---

## 📚 Related Files

- `calibrate-per-city.html` - The calibration tool (this is what you use)
- `projection-config.js` - Where you paste the exported CITY_OFFSETS
- `index2-markers-only.html` - For testing after calibration
- `map2-markers-only.js` - Uses the calibrated offsets

---

**Status:** 🟢 Ready to use! Open `calibrate-per-city.html` and start calibrating.

**Time estimate:** 10-15 minutes for all 11 cities (with visual precision)
