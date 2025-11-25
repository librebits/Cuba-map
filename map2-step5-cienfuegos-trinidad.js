// map2-step5-cienfuegos-trinidad.js
// CUBA2 with calibrated positions - STEP 5: Adding Cienfuegos → Trinidad route
// Now drawing FIVE routes: ... → Playa Larga → Cienfuegos → Trinidad
// This completes the western routes from CUBA1!

import { latLngToSVG, getCityYAdjustment, getCityLabelPosition } from './projection-config.js';

window.addEventListener('DOMContentLoaded', () => {
  console.log('map2-step5-cienfuegos-trinidad.js loaded (CUBA2 - Step 5: + Cienfuegos → Trinidad)');

  setTimeout(() => {
    const mapObject = document.getElementById('cuba-map');
    if (!mapObject) {
      console.error('Could not find #cuba-map object element');
      return;
    }

    // Export function
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
      link.download = 'cuba-map2-step5-cienfuegos-trinidad.svg';
      link.click();

      URL.revokeObjectURL(url);
    };

    // Function to draw S-curve route (double curvature, goes inland)
    function drawSCurveRoute(svgDoc, svgElement, startCity, endCity, northPull1, northPull2) {
      const [startLng, startLat] = startCity.geometry.coordinates;
      const [endLng, endLat] = endCity.geometry.coordinates;

      // Use calibrated positions
      const startPos = latLngToSVG(startLat, startLng, startCity.properties.name);
      const endPos = latLngToSVG(endLat, endLng, endCity.properties.name);

      const adjustedStartY = getCityYAdjustment(startCity.properties.name, startPos.y);
      const adjustedEndY = getCityYAdjustment(endCity.properties.name, endPos.y);

      // S-curve with asymmetric control points (25% and 75% instead of 33% and 67%)
      const control1X = startPos.x + (endPos.x - startPos.x) * 0.25;
      const control2X = startPos.x + (endPos.x - startPos.x) * 0.75;

      // Pull control points north (inland) to create S-curve
      const control1Y = adjustedStartY - northPull1;  // Strong pull at start
      const control2Y = adjustedEndY - northPull2;    // Continue north toward end

      // Create smooth S-shaped path
      const pathData = `M ${startPos.x} ${adjustedStartY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endPos.x} ${adjustedEndY}`;

      // Create path element
      const path = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', '#555555');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');

      // Calculate midpoint for arrow (using cubic Bézier at t=0.5)
      const t = 0.5;
      const midX = Math.pow(1-t,3)*startPos.x + 3*Math.pow(1-t,2)*t*control1X + 3*(1-t)*Math.pow(t,2)*control2X + Math.pow(t,3)*endPos.x;
      const midY = Math.pow(1-t,3)*adjustedStartY + 3*Math.pow(1-t,2)*t*control1Y + 3*(1-t)*Math.pow(t,2)*control2Y + Math.pow(t,3)*adjustedEndY;

      // Calculate tangent for arrow orientation
      const dt = 0.01;
      const t1 = t - dt;
      const t2 = t + dt;
      const x1 = Math.pow(1-t1,3)*startPos.x + 3*Math.pow(1-t1,2)*t1*control1X + 3*(1-t1)*Math.pow(t1,2)*control2X + Math.pow(t1,3)*endPos.x;
      const y1 = Math.pow(1-t1,3)*adjustedStartY + 3*Math.pow(1-t1,2)*t1*control1Y + 3*(1-t1)*Math.pow(t1,2)*control2Y + Math.pow(t1,3)*adjustedEndY;
      const x2 = Math.pow(1-t2,3)*startPos.x + 3*Math.pow(1-t2,2)*t2*control1X + 3*(1-t2)*Math.pow(t2,2)*control2X + Math.pow(t2,3)*endPos.x;
      const y2 = Math.pow(1-t2,3)*adjustedStartY + 3*Math.pow(1-t2,2)*t2*control1Y + 3*(1-t2)*Math.pow(t2,2)*control2Y + Math.pow(t2,3)*adjustedEndY;

      const angle = Math.atan2(y2 - y1, x2 - x1);

      // Create arrow
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

      svgElement.appendChild(path);
      svgElement.appendChild(arrowhead);

      console.log(`S-curve route drawn: ${startCity.properties.name} → ${endCity.properties.name} (northPull: ${northPull1}, ${northPull2})`);
    }

    // Function to draw a single curved route (from CUBA1, adapted for calibrated positions)
    function drawSingleRoute(svgDoc, svgElement, startCity, endCity, curvature) {
      const [startLng, startLat] = startCity.geometry.coordinates;
      const [endLng, endLat] = endCity.geometry.coordinates;

      // Use calibrated positions (pass cityName to latLngToSVG)
      const startPos = latLngToSVG(startLat, startLng, startCity.properties.name);
      const endPos = latLngToSVG(endLat, endLng, endCity.properties.name);

      // Apply legacy Y adjustments (for backward compatibility)
      const adjustedStartY = getCityYAdjustment(startCity.properties.name, startPos.y);
      const adjustedEndY = getCityYAdjustment(endCity.properties.name, endPos.y);

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

      console.log(`Route drawn: ${startCity.properties.name} → ${endCity.properties.name} (curvature: ${curvature})`);
    }

    const initializeMap = () => {
      console.log('initializeMap called (CUBA2 Step 5: ... → Cienfuegos → Trinidad)');
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

      // Load GeoJSON data and add markers + FIVE routes
      fetch('cuba-locations-geojson.json')
        .then((response) => response.json())
        .then((data) => {
          console.log('GeoJSON data loaded:', data);

          // CUBA2 city list
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

          // Add markers for all cities
          data.features
            .filter((feature) => citiesToShow.includes(feature.properties.name))
            .forEach((feature) => {
              const [lng, lat] = feature.geometry.coordinates;
              const cityName = feature.properties.name;

              // Use calibrated positions
              const { x, y } = latLngToSVG(lat, lng, cityName);
              const adjustedY = getCityYAdjustment(cityName, y);

              // Create marker circle
              const marker = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
              marker.setAttribute('cx', x);
              marker.setAttribute('cy', adjustedY);
              marker.setAttribute('r', '4');
              marker.setAttribute('fill', '#ff4444');
              marker.setAttribute('stroke', '#ffffff');
              marker.setAttribute('stroke-width', '1');
              marker.setAttribute('cursor', 'pointer');

              // Create label group
              const labelGroup = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
              const { labelX, labelY } = getCityLabelPosition(cityName, x, adjustedY);

              // Background rectangle
              const textBg = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
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
                alert(
                  `${props.name}\nType: ${props.type}\nProvince: ${
                    props.province || 'N/A'
                  }\nNotable: ${props.notable || 'N/A'}`,
                );
              });

              svgElement.appendChild(marker);
              svgElement.appendChild(labelGroup);
            });

          console.log('CUBA2 markers added');

          // Find cities
          const habana = data.features.find(f => f.properties.name === 'Habana');
          const vinales = data.features.find(f => f.properties.name === 'Viñales');
          const soroa = data.features.find(f => f.properties.name === 'Soroa');
          const playaLarga = data.features.find(f => f.properties.name === 'Playa Larga');
          const cienfuegos = data.features.find(f => f.properties.name === 'Cienfuegos');
          const trinidad = data.features.find(f => f.properties.name === 'Trinidad');

          // STEP 1: Draw Habana → Viñales route
          if (habana && vinales) {
            drawSingleRoute(svgDoc, svgElement, habana, vinales, 15);
            console.log('✅ Step 1: Habana → Viñales route drawn (curvature=15)');
          }

          // STEP 2: Draw Viñales → Soroa route
          if (vinales && soroa) {
            drawSingleRoute(svgDoc, svgElement, vinales, soroa, -10);
            console.log('✅ Step 2: Viñales → Soroa route drawn (curvature=-10)');
          }

          // STEP 3: Draw Soroa → Playa Larga route
          if (soroa && playaLarga) {
            drawSingleRoute(svgDoc, svgElement, soroa, playaLarga, -30);
            console.log('✅ Step 3: Soroa → Playa Larga route drawn (curvature=-30)');
          }

          // STEP 4: Draw Playa Larga → Cienfuegos route
          if (playaLarga && cienfuegos) {
            drawSingleRoute(svgDoc, svgElement, playaLarga, cienfuegos, -20);
            console.log('✅ Step 4: Playa Larga → Cienfuegos route drawn (curvature=-20)');
          }

          // STEP 5: Draw Cienfuegos → Trinidad route (S-curve inland)
          if (cienfuegos && trinidad) {
            drawSCurveRoute(svgDoc, svgElement, cienfuegos, trinidad, 30, 20);
            console.log('✅ Step 5: Cienfuegos → Trinidad route drawn (S-curve inland, northPull: 30, 20)');
          }

          console.log('🎉 WESTERN ROUTES COMPLETE (all 5 routes from CUBA1)');

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
