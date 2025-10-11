window.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure object is ready
  setTimeout(() => {
    const mapObject = document.getElementById('cuba-map');

    // Function to initialize markers and routes
    const initializeMap = () => {
      const svgDoc = mapObject.contentDocument;
      if (!svgDoc) {
        console.error('SVG document not loaded');
        return;
      }

      const svgElement = svgDoc.querySelector('svg');
      if (!svgElement) {
        console.error('SVG element not found');
        return;
      }

      // Get SVG dimensions
      const svgWidth = 1795.312;
      const svgHeight = 760.622;

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

      // Function to draw a single curved route
      function drawSingleRoute(svgDoc, svgElement, startCity, endCity, svgWidth, svgHeight, curvature) {
        const [startLng, startLat] = startCity.geometry.coordinates;
        const [endLng, endLat] = endCity.geometry.coordinates;

        const startPos = latLngToSVG(startLat, startLng, svgWidth, svgHeight);
        const endPos = latLngToSVG(endLat, endLng, svgWidth, svgHeight);

        // Adjust positions same as markers
        const adjustedStartY = startCity.properties.name === 'Habana' ? startPos.y + 5 : startPos.y;
        const adjustedEndY = endPos.y;

        // Create cubic Bézier curve with two control points
        const control1X = startPos.x + (endPos.x - startPos.x) * 0.33;
        const control2X = startPos.x + (endPos.x - startPos.x) * 0.67;

        const baseY = curvature > 0 ?
              Math.max(adjustedStartY, adjustedEndY) : // Lower curve
              Math.min(adjustedStartY, adjustedEndY);  // Upper curve

        const control1Y = baseY + curvature * 0.8;
        const control2Y = baseY + curvature * 0.8;

        // Create full curved path connecting both cities using cubic Bézier
        const pathData = `M ${startPos.x} ${adjustedStartY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endPos.x} ${adjustedEndY}`;

        // Create path element with solid style
        const path = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#555555');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');

        // Calculate midpoint of cubic Bézier curve for arrow placement
        const t = 0.5; // Midpoint of the curve
        const midX = Math.pow(1-t,3)*startPos.x + 3*Math.pow(1-t,2)*t*control1X + 3*(1-t)*Math.pow(t,2)*control2X + Math.pow(t,3)*endPos.x;
        const midY = Math.pow(1-t,3)*adjustedStartY + 3*Math.pow(1-t,2)*t*control1Y + 3*(1-t)*Math.pow(t,2)*control2Y + Math.pow(t,3)*adjustedEndY;

        // Calculate tangent direction at midpoint for proper arrow orientation
        const dt = 0.01;
        const t1 = t - dt;
        const t2 = t + dt;
        const x1 = Math.pow(1-t1,3)*startPos.x + 3*Math.pow(1-t1,2)*t1*control1X + 3*(1-t1)*Math.pow(t1,2)*control2X + Math.pow(t1,3)*endPos.x;
        const y1 = Math.pow(1-t1,3)*adjustedStartY + 3*Math.pow(1-t1,2)*t1*control1Y + 3*(1-t1)*Math.pow(t1,2)*control2Y + Math.pow(t1,3)*adjustedEndY;
        const x2 = Math.pow(1-t2,3)*startPos.x + 3*Math.pow(1-t2,2)*t2*control1X + 3*(1-t2)*Math.pow(t2,2)*control2X + Math.pow(t2,3)*endPos.x;
        const y2 = Math.pow(1-t2,3)*adjustedStartY + 3*Math.pow(1-t2,2)*t2*control1Y + 3*(1-t2)*Math.pow(t2,2)*control2Y + Math.pow(t2,3)*adjustedEndY;

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

      // Function to draw multiple curved routes
      function drawRoutes(svgDoc, svgElement, features) {
        // Route 1: Habana to Viñales
        const habana = features.find(f => f.properties.name === 'Habana');
        const vinales = features.find(f => f.properties.name === 'Viñales');

        if (habana && vinales) {
          drawSingleRoute(svgDoc, svgElement, habana, vinales, svgWidth, svgHeight, 15); // Subtle inland curve (south)
        }

        // Route 2: Viñales to Soroa
        const soroa = features.find(f => f.properties.name === 'Soroa');

        if (vinales && soroa) {
          drawSingleRoute(svgDoc, svgElement, vinales, soroa, svgWidth, svgHeight, -10); // Subtle inland curve (north)
        }

        // Route 3: Soroa to Playa Larga
        const playaLarga = features.find(f => f.properties.name === 'Playa Larga');

        if (soroa && playaLarga) {
          drawSingleRoute(svgDoc, svgElement, soroa, playaLarga, svgWidth, svgHeight, -30); // Inland curve (north, away from sea)
        }

        // Route 4: Playa Larga to Cienfuegos
        const cienfuegos = features.find(f => f.properties.name === 'Cienfuegos');

        if (playaLarga && cienfuegos) {
          drawSingleRoute(svgDoc, svgElement, playaLarga, cienfuegos, svgWidth, svgHeight, -20); // Inland curve (north, away from sea)
        }
      }

      // Load GeoJSON data and add markers
      fetch('cuba-locations-geojson.json')
        .then(response => response.json())
        .then(data => {
          // Cities to show markers for
          const citiesToShow = ['Habana', 'Viñales', 'Soroa', 'Playa Larga', 'Cienfuegos'];

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
              marker.setAttribute('r', '4');
              marker.setAttribute('fill', '#ff4444');
              marker.setAttribute('stroke', '#ffffff');
              marker.setAttribute('stroke-width', '1');
              marker.setAttribute('cursor', 'pointer');

              // Create label with background for better readability
              const labelGroup = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');

              // Adjust label position to avoid arrow overlap
              let labelX = x;
              let labelY = adjustedY - 8;

              // Reposition labels for better readability and avoid route overlap
              if (feature.properties.name === 'Viñales') {
                labelX = x - 20;
                labelY = adjustedY + 20;
              } else if (feature.properties.name === 'Habana') {
                labelX = x + 25;
                labelY = adjustedY - 5;
              } else if (feature.properties.name === 'Soroa') {
                labelX = x;
                labelY = adjustedY - 18;
              } else if (feature.properties.name === 'Playa Larga') {
                labelX = x + 30;
                labelY = adjustedY + 10;
              } else if (feature.properties.name === 'Cienfuegos') {
                labelX = x;
                labelY = adjustedY + 18;  // Below marker to avoid route overlap
              }

              // Create background rectangle for text
              const textBg = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
              const textWidth = feature.properties.name.length * 7;
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
          console.log('Drawing routes...');
          drawRoutes(svgDoc, svgElement, data.features);
        })
        .catch(error => console.error('Error loading GeoJSON:', error));
    };

    // Check if SVG is already loaded, or wait for it to load
    if (mapObject.contentDocument) {
      initializeMap();
    } else {
      mapObject.addEventListener('load', initializeMap);
    }
  }, 100);
});
