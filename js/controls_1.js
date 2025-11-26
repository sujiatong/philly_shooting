// controls.js
// Handles search box, date filter, and year filter

let controlsMap = null;
let controlsFeatures = [];
let originalLayer = null;      // reference to the original full layer
let dateFilteredLayer = null;  // layer for date-filtered points
let yearFilteredLayer = null;  // layer for year-filtered points (from chart)

// This is called from main.js after GeoJSON loads
function initControls(map, features, layer) {
  controlsMap = map;
  controlsFeatures = features || [];
  originalLayer = layer;

  setupSearchBox();
  setupDateFilter();
}

function setupSearchBox() {
  const input = document.getElementById("location-search");
  const suggestions = document.getElementById("suggestions");
  const searchButton = document.getElementById("search-button");

  if (!input || !suggestions || !searchButton) {
    console.error("Search box elements not found in DOM.");
    return;
  }

  // --- Live suggestions while typing ---
  input.addEventListener("input", function () {
    const text = input.value.trim().toLowerCase();
    suggestions.innerHTML = "";

    if (!text) return;

    // find matches by location (case-insensitive, partial)
    const matches = controlsFeatures
      .filter(f => {
        const loc = f.properties && f.properties.location;
        return (
          typeof loc === "string" &&
          loc.toLowerCase().includes(text)
        );
      })
      .slice(0, 8); // limit number of suggestions

    matches.forEach(feature => {
      const li = document.createElement("li");
      li.textContent = feature.properties.location;
      li.classList.add("suggestion-item");

      li.addEventListener("click", () => {
        input.value = feature.properties.location;
        suggestions.innerHTML = "";
        zoomToFeature(feature);
      });

      suggestions.appendChild(li);
    });
  });

  // --- Search button click ---
  searchButton.addEventListener("click", function () {
    performSearch(input.value);
    suggestions.innerHTML = "";
  });

  // --- Press Enter in input to search ---
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch(input.value);
      suggestions.innerHTML = "";
    }
  });
}

function performSearch(rawText) {
  const q = rawText.trim().toLowerCase();
  if (!q) return;

  // exact match first
  let match = controlsFeatures.find(f => {
    const loc = f.properties && f.properties.location;
    return typeof loc === "string" && loc.toLowerCase() === q;
  });

  // if no exact match, try partial
  if (!match) {
    match = controlsFeatures.find(f => {
      const loc = f.properties && f.properties.location;
      return typeof loc === "string" && loc.toLowerCase().includes(q);
    });
  }

  if (match) {
    zoomToFeature(match);
  } else {
    console.warn("No location match found for:", rawText);
  }
}

function zoomToFeature(feature) {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) return;
  if (!controlsMap) return;

  const coords = feature.geometry.coordinates; // [lng, lat]

  controlsMap.setView([coords[1], coords[0]], 15);

  const locName = feature.properties && feature.properties.location
    ? feature.properties.location
    : "Location";

  L.popup()
    .setLatLng([coords[1], coords[0]])
    .setContent(`<b>${locName}</b>`)
    .openOn(controlsMap);
}

/* -----------------------------
   DATE FILTER SETUP
----------------------------- */
function setupDateFilter() {
  const startInput = document.getElementById("date-start");
  const endInput = document.getElementById("date-end");
  const applyBtn = document.getElementById("date-filter-btn");
  const clearBtn = document.getElementById("date-clear-btn");

  if (!startInput || !endInput) {
    console.warn("Date filter inputs not found in DOM");
    return;
  }

  // Apply button
  if (applyBtn) {
    applyBtn.addEventListener("click", function () {
      applyDateFilter();
    });
  }

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      startInput.value = "";
      endInput.value = "";
      resetDateFilter();
    });
  }

  // Optionally filter on change
  startInput.addEventListener("change", applyDateFilter);
  endInput.addEventListener("change", applyDateFilter);
}

function applyDateFilter() {
  const startStr = document.getElementById("date-start").value; // "YYYY-MM-DD" or ""
  const endStr = document.getElementById("date-end").value;     // "YYYY-MM-DD" or ""

  filterByDateRange(startStr, endStr);
}

/* -----------------------------
   CORE DATE FILTER FUNCTION
----------------------------- */
function filterByDateRange(startDateStr, endDateStr) {
  if (!controlsMap) return;

  // If a YEAR filter is active, remove it (date filter takes over)
  if (yearFilteredLayer && controlsMap.hasLayer(yearFilteredLayer)) {
    controlsMap.removeLayer(yearFilteredLayer);
    yearFilteredLayer = null;
  }

  // Remove previous date-filtered layer
  if (dateFilteredLayer && controlsMap.hasLayer(dateFilteredLayer)) {
    controlsMap.removeLayer(dateFilteredLayer);
    dateFilteredLayer = null;
  }

  // If no dates → show original full layer
  if (!startDateStr && !endDateStr) {
    if (!controlsMap.hasLayer(originalLayer)) {
      originalLayer.addTo(controlsMap);
    }
    return;
  }

  // Hide original layer while filtered
  if (controlsMap.hasLayer(originalLayer)) {
    controlsMap.removeLayer(originalLayer);
  }

  const filtered = controlsFeatures.filter(f => {
    const raw = f.properties && f.properties.date_;
    if (!raw) return false;

    // raw example: "2020-12-19T00:00:00Z"
    const dStr = raw.substring(0, 10); // "2020-12-19"

    if (startDateStr && dStr < startDateStr) return false;
    if (endDateStr && dStr > endDateStr) return false;

    return true;
  });

  dateFilteredLayer = L.geoJSON(filtered, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        radius: 3,
        color: '#d32f2f',
        fillColor: '#ff6b6b',
        fillOpacity: 0.7,
        weight: 1
      }),
    onEachFeature: window.shootingOnEachFeature
  }).addTo(controlsMap);

  if (filtered.length > 0) {
    try {
      controlsMap.fitBounds(dateFilteredLayer.getBounds(), { padding: [20, 20] });
    } catch (e) {
      console.warn("Could not fit bounds for filtered layer:", e);
    }
  }
}

function resetDateFilter() {
  if (!controlsMap) return;

  // Remove filtered layer
  if (dateFilteredLayer && controlsMap.hasLayer(dateFilteredLayer)) {
    controlsMap.removeLayer(dateFilteredLayer);
    dateFilteredLayer = null;
  }

  // Also remove any year layer (reset = back to original data)
  if (yearFilteredLayer && controlsMap.hasLayer(yearFilteredLayer)) {
    controlsMap.removeLayer(yearFilteredLayer);
    yearFilteredLayer = null;
  }

  // Restore original full layer
  if (!controlsMap.hasLayer(originalLayer)) {
    originalLayer.addTo(controlsMap);
  }
}

/* -----------------------------
   YEAR FILTER (from Chart.js)
   window.filterMapByYear(year)
   - year = number or string
   - year = null → remove year filter
----------------------------- */
window.filterMapByYear = function (year) {
  if (!controlsMap || !controlsFeatures.length) return;

  // Remove previous year-filtered layer
  if (yearFilteredLayer && controlsMap.hasLayer(yearFilteredLayer)) {
    controlsMap.removeLayer(yearFilteredLayer);
    yearFilteredLayer = null;
  }

  // If year is null → just show original (or whatever date filter says)
  if (year === null || year === undefined || year === "") {
    // If there's a date filter active, leave it
    if (!dateFilteredLayer && !controlsMap.hasLayer(originalLayer)) {
      originalLayer.addTo(controlsMap);
    }
    return;
  }

  const targetYear = Number(year);

  // When year filter is applied, hide original & date-filter layers
  if (controlsMap.hasLayer(originalLayer)) {
    controlsMap.removeLayer(originalLayer);
  }
  if (dateFilteredLayer && controlsMap.hasLayer(dateFilteredLayer)) {
    controlsMap.removeLayer(dateFilteredLayer);
  }

  const filtered = controlsFeatures.filter(f => {
    const y = f.properties && f.properties.year;
    return Number(y) === targetYear;
  });

  yearFilteredLayer = L.geoJSON(filtered, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        radius: 3,
        color: '#d32f2f',
        fillColor: '#ff6b6b',
        fillOpacity: 0.7,
        weight: 1
      }),
    onEachFeature: window.shootingOnEachFeature
  }).addTo(controlsMap);

  if (filtered.length > 0) {
    try {
      controlsMap.fitBounds(yearFilteredLayer.getBounds(), { padding: [20, 20] });
    } catch (e) {
      console.warn("Could not fit bounds for year-filter layer:", e);
    }
  }
};
