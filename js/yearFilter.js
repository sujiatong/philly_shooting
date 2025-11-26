// yearFilter.js
// Manages the shootings layer + filtering by rebuilding the layer

let shootingLayer;              // L.geoJSON layer on the map
let allShootingFeatures = null;   // store ALL features

// Called once after loading GeoJSON
window.addShootingsToMap = function (features) {
    if (!map) {
        console.error("Map is not defined before addShootingsToMap()");
        return;
    }

    allShootingFeatures = features;  // keep full copy

    // If there is already a layer, remove it
    if (shootingLayer) {
        map.removeLayer(shootingLayer);
    }

    shootingLayer = L.geoJSON(allShootingFeatures, {
        pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
                radius: 4,
                fillColor: "#ff4d4d",
                color: "#ffffff",
                weight: 0.5,
                fillOpacity: 0.9,
                opacity: 1
            });
        },
        onEachFeature: (feature, layer) => {
            const p = feature.properties || {};
            layer.bindPopup(`
                <strong>Year:</strong> ${p.year ?? "N/A"}<br>
                <strong>Location:</strong> ${p.location ?? "N/A"}
            `);
        }
    }).addTo(map);
};


// Called from charts.js when a year is selected
window.filterMapByYear = function (year) {
    if (!map || !allShootingFeatures.length) return;

    // remove current layer completely
    if (shootingLayer) {
        map.removeLayer(shootingLayer);
        shootingLayer = null;
    }

    let featuresToShow;

    if (year === null) {
        // show ALL years
        featuresToShow = allShootingFeatures;
    } else {
        const target = Number(year);
        featuresToShow = allShootingFeatures.filter(f => {
            const y = f.properties && f.properties.year;
            return Number(y) === target;
        });
    }

    shootingLayer = L.geoJSON(featuresToShow, {
        pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
                radius: 3,
                fillColor: "'#d32f2f",
                color: "'#d32f2f",
                weight: 0.5,
                fillOpacity: 0.7,
                opacity: 1
            });
        },
        onEachFeature: (feature, layer) => {
            const p = feature.properties || {};
            layer.bindPopup(`
                <strong>Year:</strong> ${p.year ?? "N/A"}<br>
                <strong>Location:</strong> ${p.location ?? "N/A"}
            `);
        }
    }).addTo(map);
};
