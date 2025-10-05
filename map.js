// Convert lat/lng coordinates to SVG pixel coordinates
function latLngToSVG(lat, lng, svgWidth, svgHeight) {
  // Adjusted Cuba bounds to match this SVG map better
  const CUBA_BOUNDS = {
    north: 23.4,
    south: 19.6,
    west: -85.2,
    east: -73.9
  };

  // Add offset to fine-tune marker positioning
  const OFFSET = {
    x: 0,
    y: 40  // Move all markers up until Habana is on coastline
  };

  // Convert lat/lng to SVG coordinates
  const x = ((lng - CUBA_BOUNDS.west) / (CUBA_BOUNDS.east - CUBA_BOUNDS.west)) * svgWidth + OFFSET.x;
  const y = ((CUBA_BOUNDS.north - lat) / (CUBA_BOUNDS.north - CUBA_BOUNDS.south)) * svgHeight + OFFSET.y;

  return { x, y };
}

// Load GeoJSON data and add markers
fetch('cuba-locations-geojson.json')
  .then(response => response.json())
  .then(data => {
    const mapObject = document.getElementById('cuba-map');

    mapObject.addEventListener('load', () => {
      const svgDoc = mapObject.contentDocument;
      const svgElement = svgDoc.querySelector('svg');

      // Get SVG dimensions
      const svgWidth = 1795.312;
      const svgHeight = 760.622;

      // Cities to show markers for
      const citiesToShow = ['Habana', 'Viñales', 'Soroa'];

      data.features
        .filter(feature => citiesToShow.includes(feature.properties.name))
        .forEach(feature => {
          const [lng, lat] = feature.geometry.coordinates;
          const { x, y } = latLngToSVG(lat, lng, svgWidth, svgHeight);

          // Create marker circle
          const marker = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');

          // Adjust Habana position slightly south
          const adjustedY = feature.properties.name === 'Habana' ? y + 5 : y;

          marker.setAttribute('cx', x);
          marker.setAttribute('cy', adjustedY);
          marker.setAttribute('r', '4');  // 50% smaller (was 8)
          marker.setAttribute('fill', '#ff4444');
          marker.setAttribute('stroke', '#ffffff');
          marker.setAttribute('stroke-width', '1');  // Smaller stroke too
          marker.setAttribute('cursor', 'pointer');

          // Create label
          const label = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', x);
          label.setAttribute('y', adjustedY - 8);  // Adjust label position too
          label.setAttribute('text-anchor', 'middle');
          label.setAttribute('font-family', 'Arial, sans-serif');
          label.setAttribute('font-size', '14');
          label.setAttribute('font-weight', 'bold');
          label.setAttribute('fill', '#333333');
          label.textContent = feature.properties.name;

          // Add click event
          marker.addEventListener('click', () => {
            const props = feature.properties;
            alert(`${props.name}\nType: ${props.type}\nProvince: ${props.province || 'N/A'}\nNotable: ${props.notable || 'N/A'}`);
          });

          // Add to SVG
          svgElement.appendChild(marker);
          svgElement.appendChild(label);
        });
    });
  })
  .catch(error => console.error('Error loading GeoJSON:', error));
