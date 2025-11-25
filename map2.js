window.addEventListener('DOMContentLoaded', () => {
  console.log('map2.js loaded');
  // Small delay to ensure object is ready
  setTimeout(() => {
    console.log('setTimeout executed');
    const mapObject = document.getElementById('cuba-map');
    console.log('mapObject:', mapObject);

    // Export function: download complete SVG with markers and routes
    const exportSVG = (svgDoc) => {
      const svgElement = svgDoc.querySelector('svg');

      // Serialize to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);

      // Create blob and download
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'cuba-map2-west-to-east.svg';
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
    };

    // Function to initialize markers (no routes yet)
    const initializeMap = () => {
      console.log('initializeMap called');
      const svgDoc = mapObject.contentDocument;
      console.log('svgDoc:', svgDoc);
      if (!svgDoc) {
        console.error('SVG document not loaded');
        return;
      }

      const svgElement = svgDoc.querySelector('svg');
      console.log('svgElement:', svgElement);
      if (!svgElement) {
        console.error('SVG element not found');
        return;
      }
      console.log('SVG element found, proceeding...');

      // Get SVG dimensions
      const svgWidth = 1795.312;
      const svgHeight = 760.622;

      // Convert lat/lng coordinates to SVG pixel coordinates
      function latLngToSVG(lat, lng, svgWidth, svgHeight) {
        // Use same bounds as CUBA1 (map.js) - working for western cities
        // Extended east bound to include eastern cities (Faro de Maisí)
        const CUBA_BOUNDS = {
          north: 23.4,
          south: 19.6,
          west: -85.2,
          east: -73.8       // Extended eastward to include Faro de Maisí (-74.1336)
        };

        // Add offset to fine-tune marker positioning
        const OFFSET = {
          x: 0,
          y: 40  // Move all markers up until Habana is on coastline
        };

        // Convert lat/lng to SVG coordinates
        const x = ((lng - CUBA_BOUNDS.west) / (CUBA_BOUNDS.east - CUBA_BOUNDS.west)) * svgWidth + OFFSET.x;
        const y = ((CUBA_BOUNDS.north - lat) / (CUBA_BOUNDS.north - CUBA_BOUNDS.south)) * svgHeight + OFFSET.y;

        // Debug logging for calibration
        console.log(`Coords: ${lat}, ${lng} -> SVG: ${x.toFixed(1)}, ${y.toFixed(1)}`);

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

      // Function to draw bidirectional route (two arrows on same path, pointing in opposite directions)
      function drawBidirectionalRoute(svgDoc, svgElement, city1, city2, svgWidth, svgHeight, curvature) {
        const [lng1, lat1] = city1.geometry.coordinates;
        const [lng2, lat2] = city2.geometry.coordinates;

        const pos1 = latLngToSVG(lat1, lng1, svgWidth, svgHeight);
        const pos2 = latLngToSVG(lat2, lng2, svgWidth, svgHeight);

        let adjustedY1 = pos1.y;
        let adjustedY2 = pos2.y;

        // Calculate single control point for quadratic Bézier (simplest curve)
        const controlX = (pos1.x + pos2.x) / 2;
        const midY = (adjustedY1 + adjustedY2) / 2;
        const controlY = midY + curvature;

        // Create quadratic Bézier path (simpler than cubic - only 1 control point)
        const pathData = `M ${pos1.x} ${adjustedY1} Q ${controlX} ${controlY}, ${pos2.x} ${adjustedY2}`;

        // Create path element
        const path = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#555555');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');

        // Helper function to calculate point and angle at parameter t on quadratic Bézier
        const calcPointAndAngle = (t) => {
          // Quadratic Bézier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
          const x = Math.pow(1-t, 2) * pos1.x + 2 * (1-t) * t * controlX + Math.pow(t, 2) * pos2.x;
          const y = Math.pow(1-t, 2) * adjustedY1 + 2 * (1-t) * t * controlY + Math.pow(t, 2) * adjustedY2;

          // Calculate tangent direction
          const dt = 0.01;
          const t1 = t - dt;
          const t2 = t + dt;
          const x1 = Math.pow(1-t1, 2) * pos1.x + 2 * (1-t1) * t1 * controlX + Math.pow(t1, 2) * pos2.x;
          const y1 = Math.pow(1-t1, 2) * adjustedY1 + 2 * (1-t1) * t1 * controlY + Math.pow(t1, 2) * adjustedY2;
          const x2 = Math.pow(1-t2, 2) * pos1.x + 2 * (1-t2) * t2 * controlX + Math.pow(t2, 2) * pos2.x;
          const y2 = Math.pow(1-t2, 2) * adjustedY1 + 2 * (1-t2) * t2 * controlY + Math.pow(t2, 2) * adjustedY2;

          const angle = Math.atan2(y2 - y1, x2 - x1);

          return { x, y, angle };
        };

        // Create arrow helper function
        const arrowSize = 9;
        const createArrow = (point, reverse) => {
          // Reverse angle by 180° for opposite direction
          const angle = reverse ? point.angle + Math.PI : point.angle;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          const arrowhead = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          const p1x = point.x + arrowSize * cos;
          const p1y = point.y + arrowSize * sin;
          const p2x = point.x - arrowSize/2 * cos + arrowSize/2 * sin;
          const p2y = point.y - arrowSize/2 * sin - arrowSize/2 * cos;
          const p3x = point.x - arrowSize/2 * cos - arrowSize/2 * sin;
          const p3y = point.y - arrowSize/2 * sin + arrowSize/2 * cos;

          arrowhead.setAttribute('points', `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`);
          arrowhead.setAttribute('fill', '#555555');
          return arrowhead;
        };

        // Create two arrows at 35% and 65%, pointing in opposite directions
        const arrow1Point = calcPointAndAngle(0.35);
        const arrow2Point = calcPointAndAngle(0.65);

        // Add path and both arrowheads (opposite directions)
        svgElement.appendChild(path);
        svgElement.appendChild(createArrow(arrow1Point, true));  // Reverse
        svgElement.appendChild(createArrow(arrow2Point, false)); // Forward
      }

      // Function to draw all CUBA2 routes
      function drawRoutes(svgDoc, svgElement, features, svgWidth, svgHeight) {
        // Helper to find city by name
        const findCity = (name) => features.find(f => f.properties.name === name);

        // Get city references
        const habana = findCity('Habana');
        const vinales = findCity('Viñales');
        const soroa = findCity('Soroa');
        const playaLarga = findCity('Playa Larga');
        const cienfuegos = findCity('Cienfuegos');
        const trinidad = findCity('Trinidad');
        const camaguey = findCity('Camagüey');
        const santiago = findCity('Santiago de Cuba');
        const baracoa = findCity('Baracoa');
        const faro = findCity('Faro de Maisi');
        const yumuri = findCity('Yumurí');

        // Western routes (same as CUBA1 but without loop back to Habana)
        // Route 1: Habana → Viñales (upper curve)
        if (habana && vinales) {
          drawSingleRoute(svgDoc, svgElement, habana, vinales, svgWidth, svgHeight, -60);
        }

        // Route 2: Viñales → Soroa (lower curve)
        if (vinales && soroa) {
          drawSingleRoute(svgDoc, svgElement, vinales, soroa, svgWidth, svgHeight, 60);
        }

        // Route 3: Soroa → Playa Larga (lower curve)
        if (soroa && playaLarga) {
          drawSingleRoute(svgDoc, svgElement, soroa, playaLarga, svgWidth, svgHeight, 40);
        }

        // Route 4: Playa Larga → Cienfuegos (upper curve)
        if (playaLarga && cienfuegos) {
          drawSingleRoute(svgDoc, svgElement, playaLarga, cienfuegos, svgWidth, svgHeight, -30);
        }

        // Route 5: Cienfuegos → Trinidad (lower curve)
        if (cienfuegos && trinidad) {
          drawSingleRoute(svgDoc, svgElement, cienfuegos, trinidad, svgWidth, svgHeight, 35);
        }

        // Eastern extension routes (new for CUBA2)
        // Route 6: Trinidad → Camagüey
        if (trinidad && camaguey) {
          drawSingleRoute(svgDoc, svgElement, trinidad, camaguey, svgWidth, svgHeight, -40);
        }

        // Route 7: Camagüey → Santiago de Cuba
        if (camaguey && santiago) {
          drawSingleRoute(svgDoc, svgElement, camaguey, santiago, svgWidth, svgHeight, 30);
        }

        // Route 8: Santiago de Cuba → Baracoa
        if (santiago && baracoa) {
          drawSingleRoute(svgDoc, svgElement, santiago, baracoa, svgWidth, svgHeight, -35);
        }

        // Route 9: Baracoa ↔ Santiago de Cuba (bidirectional)
        if (baracoa && santiago) {
          drawBidirectionalRoute(svgDoc, svgElement, baracoa, santiago, svgWidth, svgHeight, 45);
        }

        // Route 10: Santiago de Cuba → Habana (straight nightbus line, curvature=0)
        if (santiago && habana) {
          drawSingleRoute(svgDoc, svgElement, santiago, habana, svgWidth, svgHeight, 0);
        }

        // Optional eastern loop (anti-clockwise circular route)
        // Route 11: Baracoa → Faro de Maisi
        if (baracoa && faro) {
          drawSingleRoute(svgDoc, svgElement, baracoa, faro, svgWidth, svgHeight, 25);
        }

        // Route 12: Faro de Maisi → Yumurí
        if (faro && yumuri) {
          drawSingleRoute(svgDoc, svgElement, faro, yumuri, svgWidth, svgHeight, -20);
        }

        // Route 13: Yumurí → Baracoa (completing the loop)
        if (yumuri && baracoa) {
          drawSingleRoute(svgDoc, svgElement, yumuri, baracoa, svgWidth, svgHeight, 30);
        }
      }

      // Load GeoJSON data and add markers
      console.log('Starting fetch...');
      fetch('cuba-locations-geojson.json')
        .then(response => {
          console.log('Fetch response:', response);
          return response.json();
        })
        .then(data => {
          console.log('GeoJSON data loaded:', data);
          // CUBA2 cities to show markers for (per Marcel: NO María la Gorda)
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
            'Yumurí'
          ];

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
                adjustedY = y - 25;  // Move north
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

              // Reposition labels for better readability
              if (feature.properties.name === 'Viñales') {
                labelX = x - 30;
                labelY = adjustedY - 5;
              } else if (feature.properties.name === 'Habana') {
                labelX = x + 25;
                labelY = adjustedY - 5;
              } else if (feature.properties.name === 'Soroa') {
                labelX = x;
                labelY = adjustedY - 13;
              } else if (feature.properties.name === 'Playa Larga') {
                labelX = x + 30;
                labelY = adjustedY + 10;
              } else if (feature.properties.name === 'Cienfuegos') {
                labelX = x - 20;
                labelY = adjustedY + 18;
              } else if (feature.properties.name === 'Trinidad') {
                labelX = x;
                labelY = adjustedY + 22;
              } else if (feature.properties.name === 'Camagüey') {
                labelX = x;
                labelY = adjustedY - 12;
              } else if (feature.properties.name === 'Santiago de Cuba') {
                labelX = x + 20;
                labelY = adjustedY + 15;
              } else if (feature.properties.name === 'Baracoa') {
                labelX = x;
                labelY = adjustedY - 10;
              } else if (feature.properties.name === 'Faro de Maisi') {
                labelX = x + 15;
                labelY = adjustedY + 15;
              } else if (feature.properties.name === 'Yumurí') {
                labelX = x - 15;
                labelY = adjustedY - 10;
              }

              // Create background rectangle for text
              const textBg = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
              const textWidth = feature.properties.name.length * 7;
              textBg.setAttribute('x', labelX - textWidth/2 - 2);
              textBg.setAttribute('y', labelY - 12);
              textBg.setAttribute('width', textWidth + 4);
              textBg.setAttribute('height', 16);
              textBg.setAttribute('fill', '#ffffff');
              textBg.setAttribute('fill-opacity', '0.8');
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

          console.log('CUBA2 markers added');

          // Draw all CUBA2 routes
          drawRoutes(svgDoc, svgElement, data.features, svgWidth, svgHeight);
          console.log('CUBA2 routes drawn');

          // Wire export button
          document.getElementById('export-btn').addEventListener('click', () => {
            exportSVG(svgDoc);
          });
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
