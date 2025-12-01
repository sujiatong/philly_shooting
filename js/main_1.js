const mapboxKey = 'pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2w3ZTh1NTIxMTgxNTQwcGhmODU2NW5kaSJ9.pBPd19nWO-Gt-vTf1pOHBA';
const mapboxStyle = 'mapbox/light-v11';

//dark-v11
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

// 🔴 make these GLOBAL so filterMapByYear can see them
let shootingsLayer = null;
let allShootingFeatures = [];

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
  const age = props.age || '';
  const fatal = props.fatal || '';
  const raceMap = {
    "A": "Asian",
    "B": "Black",
    "W": "White",
    "U": "Unknown/Other"
  };
  

  let html = `
    <div class="shooting-popup">
      <h3>${location}</h3>
      <p><strong>Date:</strong> ${date}</p>
      ${year ? `<p><strong>Year:</strong> ${year}</p>` : ''}
      ${wound ? `<p><strong>Wound:</strong> ${wound}</p>` : ''}
      ${sex ? `<p><strong>Sex:</strong> ${sex}</p>` : ''}
      ${props.fatal !== undefined ? `<p><strong>Fatal:</strong> ${props.fatal === 1 ? 'Yes' : 'No'}</p>` : ''}
      ${props.age ? `<p><strong>Age:</strong> ${props.age}</p>` : ''}
      ${props.race ? `<p><strong>Race:</strong> ${raceMap[props.race] || "Unknown"}</p>` : ''}

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

    // 🔴 store all features globally for later filtering
    allShootingFeatures = data.features;   // 建议在文件顶部：let allShootingFeatures = [];

    // 🔴 create ONE global shootingsLayer (no const here)
    shootingsLayer = L.geoJSON(data, {
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

    const features = data.features;  // ✅ 之后统一用这个变量

    // pass layer into controls
    initControls(map, features, shootingsLayer);

    // 年份 bar chart – charts.js
    initYearChart(features);         

    // 月份趋势 – monthlychart.js
    initMonthlyChart(features);     

    // Fatal vs Non-fatal – fatal.js
    initFatal(features);            

    // Sex distribution – sex.js
    //initSex(features);              

    // Race distribution – race.js
    initRace(features);      
    
    // Age distribution – age.js
    //initAge(features);

    // pyramid chart – pyramid.js
    initPyramid(features);

    map.fitBounds(shootingsLayer.getBounds(), { padding: [20, 20] });
  })
  .catch(err => console.error('GeoJSON ERROR:', err));



// ===========================================
//  filterMapByYear: called from charts.js
//  year = number or string, null = show all
// ===========================================
window.filterMapByYear = function (year) {
  if (!allShootingFeatures.length) return;

  // remove current layer from map (original becomes "null")
  if (shootingsLayer) {
    map.removeLayer(shootingsLayer);
    shootingsLayer = null;
  }

  let featuresToShow = allShootingFeatures;

  if (year !== null) {
    const targetYear = Number(year);
    featuresToShow = allShootingFeatures.filter(f => {
      const y = f.properties && f.properties.year;
      return Number(y) === targetYear;
    });
  }

  const fc = {
    type: 'FeatureCollection',
    features: featuresToShow
  };

  shootingsLayer = L.geoJSON(fc, {
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
};
