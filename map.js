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

          // Create label with background for better readability
          const labelGroup = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');

          // Adjust label position to avoid arrow overlap
          let labelX = x;
          let labelY = adjustedY - 8;

          // Reposition labels for better readability
          if (feature.properties.name === 'Viñales') {
            labelX = x - 20;  // Move left
            labelY = adjustedY + 20;  // Move below marker
          } else if (feature.properties.name === 'Habana') {
            labelX = x + 25;  // Move right to avoid arrow start
            labelY = adjustedY - 5;  // Slightly above marker
          }

          // Create background rectangle for text
          const textBg = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
          const textWidth = feature.properties.name.length * 7; // Approximate width
          textBg.setAttribute('x', labelX - textWidth/2 - 2);
          textBg.setAttribute('y', labelY - 12);
          textBg.setAttribute('width', textWidth + 4);
          textBg.setAttribute('height', 16);
          textBg.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
          textBg.setAttribute('stroke', '#333333');
          textBg.setAttribute('stroke-width', '0.5');
          textBg.setAttribute('rx', '3');

          const label = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
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

          // Add click event
          marker.addEventListener('click', () => {
            const props = feature.properties;
            alert(`${props.name}\nType: ${props.type}\nProvince: ${props.province || 'N/A'}\nNotable: ${props.notable || 'N/A'}`);
          });

          // Add to SVG
          svgElement.appendChild(marker);
          svgElement.appendChild(labelGroup);
        });

      // Draw curved routes
      drawRoutes(svgDoc, svgElement, data.features);
    });
  })
  .catch(error => console.error('Error loading GeoJSON:', error));

// Function to draw multiple curved routes
function drawRoutes(svgDoc, svgElement, features) {
  const svgWidth = 1795.312;
  const svgHeight = 760.622;

  // Route 1: Habana to Viñales via upper path
  const habana = features.find(f => f.properties.name === 'Habana');
  const vinales = features.find(f => f.properties.name === 'Viñales');

  if (habana && vinales) {
    drawSingleRoute(svgDoc, svgElement, habana, vinales, svgWidth, svgHeight, 15); // Subtle inland curve (south)
  }

  // Route 2: Viñales to Soroa via upper path
  const soroa = features.find(f => f.properties.name === 'Soroa');

  if (vinales && soroa) {
    drawSingleRoute(svgDoc, svgElement, vinales, soroa, svgWidth, svgHeight, -10); // Subtle inland curve (north)
  }
}

// Function to draw a single curved route
function drawSingleRoute(svgDoc, svgElement, startCity, endCity, svgWidth, svgHeight, curvature) {
  const [startLng, startLat] = startCity.geometry.coordinates;
  const [endLng, endLat] = endCity.geometry.coordinates;

  const startPos = latLngToSVG(startLat, startLng, svgWidth, svgHeight);
  const endPos = latLngToSVG(endLat, endLng, svgWidth, svgHeight);

  // Adjust positions same as markers
  const adjustedStartY = startCity.properties.name === 'Habana' ? startPos.y + 5 : startPos.y;
  const adjustedEndY = endPos.y;

  // Create curved path
  const controlX = (startPos.x + endPos.x) / 2;
  const controlY = curvature > 0 ?
    Math.max(adjustedStartY, adjustedEndY) + curvature : // Lower curve
    Math.min(adjustedStartY, adjustedEndY) + curvature;  // Upper curve

  // Create full curved path connecting both cities
  const pathData = `M ${startPos.x} ${adjustedStartY} Q ${controlX} ${controlY} ${endPos.x} ${adjustedEndY}`;

  // Create path element with solid style
  const path = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('stroke', '#555555');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');

  // Calculate midpoint of curve for arrow placement
  const t = 0.5; // Midpoint of the curve
  const midX = (1-t)*(1-t)*startPos.x + 2*(1-t)*t*controlX + t*t*endPos.x;
  const midY = (1-t)*(1-t)*adjustedStartY + 2*(1-t)*t*controlY + t*t*adjustedEndY;

  // Calculate tangent direction at midpoint for proper arrow orientation
  const dt = 0.01;
  const t1 = t - dt;
  const t2 = t + dt;
  const x1 = (1-t1)*(1-t1)*startPos.x + 2*(1-t1)*t1*controlX + t1*t1*endPos.x;
  const y1 = (1-t1)*(1-t1)*adjustedStartY + 2*(1-t1)*t1*controlY + t1*t1*adjustedEndY;
  const x2 = (1-t2)*(1-t2)*startPos.x + 2*(1-t2)*t2*controlX + t2*t2*endPos.x;
  const y2 = (1-t2)*(1-t2)*adjustedStartY + 2*(1-t2)*t2*controlY + t2*t2*adjustedEndY;

  // Calculate angle for arrow orientation
  const angle = Math.atan2(y2 - y1, x2 - x1);

  // Create properly oriented arrowhead at midpoint
  const arrowSize = 9;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const arrowhead = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  const p1x = midX + arrowSize * cos;
  const p1y = midY + arrowSize * sin;
  const p2x = midX - arrowSize/2 * cos + arrowSize/2 * sin;
  const p2y = midY - arrowSize/2 * sin - arrowSize/2 * cos;
  const p3x = midX - arrowSize/2 * cos - arrowSize/2 * sin;
  const p3y = midY - arrowSize/2 * sin + arrowSize/2 * cos;

  arrowhead.setAttribute('points', `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`);
  arrowhead.setAttribute('fill', '#555555');

  // Add path and arrowhead to SVG
  svgElement.appendChild(path);
  svgElement.appendChild(arrowhead);
}
