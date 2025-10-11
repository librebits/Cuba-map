# Cuba Map - SVG Export Guide

## Export Complete SVG with Itinerary

### Solution: SVG Serialization and Download

#### Step 1: Add Export Function

```javascript
// Export the complete SVG with markers and routes
const exportSVG = (svgDoc) => {
  // Get the SVG element
  const svgElement = svgDoc.querySelector('svg');
  
  // Serialize to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  
  // Create blob and download
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cuba-map-with-itinerary.svg';
  link.click();
  
  // Cleanup
  URL.revokeObjectURL(url);
};
```

#### Step 2: Update HTML

Add an export button to `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Cuba Map</title>
  </head>
  <body>
    <object data="cuba.svg?v=3" type="image/svg+xml" id="cuba-map"></object>
    <button id="export-btn">Export SVG</button>
    <script type="module" src="map.js"></script>
  </body>
</html>
```

#### Step 3: Wire Export Button

Add this at the end of your `initMap()` function in `map.js`:

```javascript
// Inside initMap() after drawing routes
drawRoutes(svgDoc, svgElement, data.features);

// Add export button functionality
document.getElementById('export-btn').addEventListener('click', () => {
  exportSVG(svgDoc);
});
```

---

## Complete Integration Example

Here's how the export fits into your existing code:

```javascript
// ... (your existing latLngToSVG, drawRoutes, drawSingleRoute functions)

// Export function
const exportSVG = (svgDoc) => {
  const svgElement = svgDoc.querySelector('svg');
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cuba-map-with-itinerary.svg';
  link.click();
  
  URL.revokeObjectURL(url);
};

// Load GeoJSON data and add markers
fetch('cuba-locations-geojson.json')
  .then(response => response.json())
  .then(data => {
    const mapObject = document.getElementById('cuba-map');

    const initMap = () => {
      const svgDoc = mapObject.contentDocument;
      const svgElement = svgDoc.querySelector('svg');

      // ... your existing marker creation code ...
      
      // Draw routes
      drawRoutes(svgDoc, svgElement, data.features);

      // Wire export button
      document.getElementById('export-btn').addEventListener('click', () => {
        exportSVG(svgDoc);
      });
    };

    // Handle load event
    if (mapObject.contentDocument && mapObject.contentDocument.querySelector('svg')) {
      initMap();
    } else {
      mapObject.addEventListener('load', initMap);
    }
  })
  .catch(error => console.error('Error loading GeoJSON:', error));
```

---

## How It Works

### Export Process

1. **Serialization**: `XMLSerializer` converts the DOM SVG element to a string
2. **Blob creation**: Wraps the string in a binary format suitable for download
3. **URL generation**: `URL.createObjectURL()` creates a temporary download URL
4. **Download trigger**: Programmatic click on `<a>` element initiates download
5. **Cleanup**: `revokeObjectURL()` releases memory

### Functional Flow

```
DOM SVG → String → Blob → Temporary URL → Download → Cleanup
```

---

## Unix Philosophy Applied

- **Single responsibility**: `exportSVG()` does one thing well
- **Composability**: Function can be reused anywhere
- **No side effects**: Pure transformation (except final I/O)
- **KISS**: Minimal, straightforward solution

---

## References

- [MDN: XMLSerializer](https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer)
- [MDN: Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
- [MDN: URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)
- [MDN: URL.revokeObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL)