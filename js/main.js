const mapboxKey = 'pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2w3ZTh1NTIxMTgxNTQwcGhmODU2NW5kaSJ9.pBPd19nWO-Gt-vTf1pOHBA';
const mapboxStyle = 'mapbox/light-v11';

// Initialize map (Philadelphia as example)
const map = L.map('map').setView([39.9526, -75.1652], 12);

// Add Mapbox tiles
L.tileLayer(
  `https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/{z}/{x}/{y}?access_token=${mapboxKey}`,
  {
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    attribution:
      '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>'
  }
).addTo(map);



// -------------------------

const geojsonUrl = 'data/shootings-3.geojson';

function shootingOnEachFeature(feature, layer) {
  const props = feature.properties || {};

  const location = props.location || 'Unknown location';
  const dateRaw = props.date_ || '';
  const date = dateRaw
    ? new Date(dateRaw).toLocaleString()
    : 'Unknown date';

  const year = props.year || '';
  const wound = props.wound || '';
  const sex = props.sex || '';

  let html = `
    <div class="shooting-popup">
      <h3>${location}</h3>
      <p><strong>Date:</strong> ${date}</p>
      ${year ? `<p><strong>Year:</strong> ${year}</p>` : ''}
      ${wound ? `<p><strong>Wound:</strong> ${wound}</p>` : ''}
      ${sex ? `<p><strong>Sex:</strong> ${sex}</p>` : ''}
    </div>
  `;

  layer.bindPopup(html);
}

// make available to controls.js
window.shootingOnEachFeature = shootingOnEachFeature;

fetch(geojsonUrl)
  .then(res => res.json())
  .then(raw => {
    const validFeatures = (raw.features || []).filter(f => {
      const g = f.geometry;
      return (
        g &&
        g.type === 'Point' &&
        Array.isArray(g.coordinates) &&
        g.coordinates.length === 2 &&
        typeof g.coordinates[0] === 'number' &&
        typeof g.coordinates[1] === 'number'
      );
    });

    console.log('Valid features:', validFeatures.length);

    const data = {
      type: 'FeatureCollection',
      features: validFeatures
    };

    const shootingsLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 3,
          color: '#d32f2f',
          fillColor: '#ff6b6b',
          fillOpacity: 0.7,
          weight: 1
        }),

      onEachFeature: shootingOnEachFeature
    }).addTo(map);

    // pass layer into controls
    initControls(map, data.features, shootingsLayer); // <-- from controls.js
    initYearChart(data.features); // <-- from charts.js 
    addShootingsToMap(data.features);  // <-- from this yearFilter file



    map.fitBounds(shootingsLayer.getBounds(), { padding: [20, 20] });
  })
  .catch(err => console.error('GeoJSON ERROR:', err));
