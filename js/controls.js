// controls.js
// Handles search box functionality for "location" column

let controlsMap = null;
let controlsFeatures = [];
// let shootingsLayer = null; // the L.geoJSON layer from main.js
let originalLayer = null; // reference to the original full layer
let dateFilteredLayer = null; // layer for date-filtered points



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
    // optional: show an alert or console message
    console.warn("No location match found for:", rawText);
  }
}

function zoomToFeature(feature) {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) return;
  if (!controlsMap) return;

  const coords = feature.geometry.coordinates; // [lng, lat]

  // Set view with a nicer zoom level
  controlsMap.setView([coords[1], coords[0]], 15);

  // Optional popup showing the location name
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
    // Remove previous filtered layer
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
  
      // If start selected and feature date is before it
      if (startDateStr && dStr < startDateStr) return false;
  
      // If end selected and feature date is after it
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
        onEachFeature: window.shootingOnEachFeature  // ✅ reuse popup
    }).addTo(controlsMap);
  
    // Zoom to filtered points if any
    if (filtered.length > 0) {
      try {
        controlsMap.fitBounds(dateFilteredLayer.getBounds(), { padding: [20, 20] });
      } catch (e) {
        console.warn("Could not fit bounds for filtered layer:", e);
      }
    }
  }
  
  function resetDateFilter() {
    // Remove filtered layer and restore original
    if (dateFilteredLayer && controlsMap.hasLayer(dateFilteredLayer)) {
      controlsMap.removeLayer(dateFilteredLayer);
      dateFilteredLayer = null;
    }
    if (!controlsMap.hasLayer(originalLayer)) {
      originalLayer.addTo(controlsMap);
    }
  }