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
        let adjustedStartY = startPos.y;
        if (startCity.properties.name === 'Habana') {
          adjustedStartY = startPos.y + 5;
        } else if (startCity.properties.name === 'Trinidad') {
          adjustedStartY = startPos.y - 25;
        }

        let adjustedEndY = endPos.y;
        if (endCity.properties.name === 'Habana') {
          adjustedEndY = endPos.y + 5;
        } else if (endCity.properties.name === 'Trinidad') {
          adjustedEndY = endPos.y - 25;
        }

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

      // Function to draw S-curve route for Trinidad to Habana
      function drawSCurveRoute(svgDoc, svgElement, startCity, endCity, svgWidth, svgHeight) {
        const [startLng, startLat] = startCity.geometry.coordinates;
        const [endLng, endLat] = endCity.geometry.coordinates;

        const startPos = latLngToSVG(startLat, startLng, svgWidth, svgHeight);
        const endPos = latLngToSVG(endLat, endLng, svgWidth, svgHeight);

        // Adjust positions same as markers
        let adjustedStartY = startPos.y;
        if (startCity.properties.name === 'Trinidad') {
          adjustedStartY = startPos.y - 25;
        }

        let adjustedEndY = endPos.y;
        if (endCity.properties.name === 'Habana') {
          adjustedEndY = endPos.y + 5;
        }

        // Create curved route: pull very strongly north at start to avoid Cienfuegos → Trinidad line
        const control1X = startPos.x + (endPos.x - startPos.x) * 0.25;
        const control2X = startPos.x + (endPos.x - startPos.x) * 0.75;

        // Control point 1: pull much more dramatically north from Trinidad to clear collision
        const control1Y = adjustedStartY - 60;

        // Control point 2: continue north through central Cuba
        const control2Y = adjustedEndY - 15;

        // Create smooth S-shaped path
        const pathData = `M ${startPos.x} ${adjustedStartY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endPos.x} ${adjustedEndY}`;

        // Create path element
        const path = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#555555');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');

        // Calculate midpoint of cubic Bézier for arrow placement
        const t = 0.5;
        const midX = Math.pow(1-t,3)*startPos.x + 3*Math.pow(1-t,2)*t*control1X + 3*(1-t)*Math.pow(t,2)*control2X + Math.pow(t,3)*endPos.x;
        const midY = Math.pow(1-t,3)*adjustedStartY + 3*Math.pow(1-t,2)*t*control1Y + 3*(1-t)*Math.pow(t,2)*control2Y + Math.pow(t,3)*adjustedEndY;

        // Calculate tangent direction at midpoint
        const dt = 0.01;
        const t1 = t - dt;
        const t2 = t + dt;
        const x1 = Math.pow(1-t1,3)*startPos.x + 3*Math.pow(1-t1,2)*t1*control1X + 3*(1-t1)*Math.pow(t1,2)*control2X + Math.pow(t1,3)*endPos.x;
        const y1 = Math.pow(1-t1,3)*adjustedStartY + 3*Math.pow(1-t1,2)*t1*control1Y + 3*(1-t1)*Math.pow(t1,2)*control2Y + Math.pow(t1,3)*adjustedEndY;
        const x2 = Math.pow(1-t2,3)*startPos.x + 3*Math.pow(1-t2,2)*t2*control1X + 3*(1-t2)*Math.pow(t2,2)*control2X + Math.pow(t2,3)*endPos.x;
        const y2 = Math.pow(1-t2,3)*adjustedStartY + 3*Math.pow(1-t2,2)*t2*control1Y + 3*(1-t2)*Math.pow(t2,2)*control2Y + Math.pow(t2,3)*adjustedEndY;

        const angle = Math.atan2(y2 - y1, x2 - x1);

        // Create arrowhead
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

        // Route 5: Cienfuegos to Trinidad
        const trinidad = features.find(f => f.properties.name === 'Trinidad');

        if (cienfuegos && trinidad) {
          drawSingleRoute(svgDoc, svgElement, cienfuegos, trinidad, svgWidth, svgHeight, 0); // Perfect straight line, no curve
        }

        // Route 6: Trinidad to Habana (closing the loop, inland route) - S-curve
        if (trinidad && habana) {
          drawSCurveRoute(svgDoc, svgElement, trinidad, habana, svgWidth, svgHeight);
        }
      }

      // Load GeoJSON data and add markers
      fetch('cuba-locations-geojson.json')
        .then(response => response.json())
        .then(data => {
          // Cities to show markers for
          const citiesToShow = ['Habana', 'Viñales', 'Soroa', 'Playa Larga', 'Cienfuegos', 'Trinidad'];

          data.features
            .filter(feature => citiesToShow.includes(feature.properties.name))
            .forEach(feature => {
              const [lng, lat] = feature.geometry.coordinates;
              const { x, y } = latLngToSVG(lat, lng, svgWidth, svgHeight);

              // Create marker circle
              const marker = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');

              // Adjust positions for specific cities
              let adjustedY = y;
              if (feature.properties.name === 'Habana') {
                adjustedY = y + 5;  // Move south
              } else if (feature.properties.name === 'Trinidad') {
                adjustedY = y - 25;  // Move north (10 + 15 more)
              }

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
                labelY = adjustedY - 13;  // 5px south from previous position
              } else if (feature.properties.name === 'Playa Larga') {
                labelX = x + 30;
                labelY = adjustedY + 10;
              } else if (feature.properties.name === 'Cienfuegos') {
                labelX = x - 20;  // 5px more west
                labelY = adjustedY + 18;  // 5px north from previous position
              } else if (feature.properties.name === 'Trinidad') {
                labelX = x;
                labelY = adjustedY + 22;  // 10px more south
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
