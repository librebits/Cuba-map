// map2-markers-only.js
// CUBA2 map with markers only (no routes/itineraries)
// Uses shared projection-config.js for coordinate conversion

import { latLngToSVG, getCityYAdjustment, getCityLabelPosition } from './projection-config.js';

window.addEventListener('DOMContentLoaded', () => {
  console.log('map2-markers-only.js loaded (CUBA2 markers only)');

  setTimeout(() => {
    const mapObject = document.getElementById('cuba-map');
    if (!mapObject) {
      console.error('Could not find #cuba-map object element');
      return;
    }

    // Export function: download complete SVG with markers
    const exportSVG = (svgDoc) => {
      const svgElement = svgDoc.querySelector('svg');
      if (!svgElement) {
        console.error('No <svg> element found for export');
        return;
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'cuba-map2-cities-only.svg';
      link.click();

      URL.revokeObjectURL(url);
    };

    const initializeMap = () => {
      console.log('initializeMap called (CUBA2 markers only)');
      const svgDoc = mapObject.contentDocument;
      if (!svgDoc) {
        console.error('SVG document not loaded');
        return;
      }

      const svgElement = svgDoc.querySelector('svg');
      if (!svgElement) {
        console.error('SVG element not found inside object');
        return;
      }

      // Load GeoJSON data and add ONLY markers/labels (no routes)
      fetch('cuba-locations-geojson.json')
        .then((response) => response.json())
        .then((data) => {
          console.log('GeoJSON data loaded:', data);

          // CUBA2 city list (no María la Gorda)
          const citiesToShow = [
            'Habana',
            'Viñales',
            'Soroa',
            'Playa Larga',
            'Cienfuegos',
            'Trinidad',
            'Camagüey',
            'Santiago de Cuba',
            'Baracoa',
            'Faro de Maisi',
            'Yumurí',
          ];

          data.features
            .filter((feature) => citiesToShow.includes(feature.properties.name))
            .forEach((feature) => {
              const [lng, lat] = feature.geometry.coordinates;
              const cityName = feature.properties.name;

              // Use latLngToSVG with cityName to apply per-city corrections
              const { x, y } = latLngToSVG(lat, lng, cityName);

              // Apply legacy city-specific Y adjustments (for backward compatibility)
              const adjustedY = getCityYAdjustment(cityName, y);

              // Create marker circle
              const marker = svgDoc.createElementNS(
                'http://www.w3.org/2000/svg',
                'circle',
              );
              marker.setAttribute('cx', x);
              marker.setAttribute('cy', adjustedY);
              marker.setAttribute('r', '4');
              marker.setAttribute('fill', '#ff4444');
              marker.setAttribute('stroke', '#ffffff');
              marker.setAttribute('stroke-width', '1');
              marker.setAttribute('cursor', 'pointer');

              // Create label group (background rect + text)
              const labelGroup = svgDoc.createElementNS(
                'http://www.w3.org/2000/svg',
                'g',
              );

              // Get label position from shared config
              const { labelX, labelY } = getCityLabelPosition(
                feature.properties.name,
                x,
                adjustedY
              );

              // Create background rectangle for text
              const textBg = svgDoc.createElementNS(
                'http://www.w3.org/2000/svg',
                'rect',
              );
              const textWidth = feature.properties.name.length * 7;
              textBg.setAttribute('x', labelX - textWidth / 2 - 2);
              textBg.setAttribute('y', labelY - 12);
              textBg.setAttribute('width', textWidth + 4);
              textBg.setAttribute('height', 16);
              textBg.setAttribute('fill', '#ffffff');
              textBg.setAttribute('fill-opacity', '0.8');
              textBg.setAttribute('stroke', '#333333');
              textBg.setAttribute('stroke-width', '0.5');
              textBg.setAttribute('rx', '3');

              const label = svgDoc.createElementNS(
                'http://www.w3.org/2000/svg',
                'text',
              );
              label.setAttribute('x', labelX);
              label.setAttribute('y', labelY);
              label.setAttribute('text-anchor', 'middle');
              label.setAttribute('font-family', 'Arial, sans-serif');
              label.setAttribute('font-size', '12');
              label.setAttribute('font-weight', 'bold');
              label.setAttribute('fill', '#333333');
              label.textContent = feature.properties.name;

              labelGroup.appendChild(textBg);
              labelGroup.appendChild(label);

              // Add click event for city info
              marker.addEventListener('click', () => {
                const props = feature.properties;
                alert(
                  `${props.name}\nType: ${props.type}\nProvince: ${
                    props.province || 'N/A'
                  }\nNotable: ${props.notable || 'N/A'}`,
                );
              });

              // Add to SVG
              svgElement.appendChild(marker);
              svgElement.appendChild(labelGroup);

              // Debug log
              console.log(
                `${feature.properties.name}: lat=${lat}, lng=${lng} -> SVG (${x.toFixed(1)}, ${adjustedY.toFixed(1)})`
              );
            });

          console.log('CUBA2 markers added (no routes)');

          // Wire export button
          const exportBtn = document.getElementById('export-btn');
          if (exportBtn) {
            exportBtn.addEventListener('click', () => exportSVG(svgDoc));
          }
        })
        .catch((error) => console.error('Error loading GeoJSON:', error));
    };

    if (mapObject.contentDocument) {
      initializeMap();
    } else {
      mapObject.addEventListener('load', initializeMap);
    }
  }, 100);
});
