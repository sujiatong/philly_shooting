// charts.js – Chart.js yearly counts as BAR chart + map filter

let yearChart = null; // global Chart.js instance
let selectedYear = null; // track currently selected year

function initYearChart(features) {
    if (!features || !Array.isArray(features)) {
        console.error("initYearChart: 'features' is missing or not an array", features);
        return;
    }

    // ---- Extract YEARS ----
    const years = features
        .map(f => f.properties && f.properties.year)
        .filter(y => y !== null && y !== undefined);

    if (years.length === 0) {
        console.warn("initYearChart: no valid 'year' values found in features");
    }

    // Count frequency of each year
    const yearCounts = {};
    years.forEach(y => {
        yearCounts[y] = (yearCounts[y] || 0) + 1;
    });

    // Sorted year list (as numbers)
    const sortedYears = Object.keys(yearCounts)
        .map(y => Number(y))
        .sort((a, b) => a - b);

    const counts = sortedYears.map(y => yearCounts[y]);

    // ---- CREATE CHART ----
    const canvas = document.getElementById("yearChart");
    if (!canvas) {
        console.error("initYearChart: no <canvas id='yearChart'> found in DOM");
        return;
    }

    const ctx = canvas.getContext("2d");

    // destroy old chart if re-initializing
    if (yearChart) {
        yearChart.destroy();
    }

    yearChart = new Chart(ctx, {
        type: "bar",   // ⬅️ change to BAR chart
        data: {
            labels: sortedYears,
            datasets: [{
                label: "Shootings per Year",
                data: counts,
                borderWidth: 1,
                // you can style color in CSS or here if you want
                backgroundColor: "rgba(211, 47, 47, 0.7)",
                borderColor: "rgba(211, 47, 47, 1)"
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: "Shootings per Year (click bar to filter map)"
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `Count: ${context.raw}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Year"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Number of Shootings"
                    },
                    beginAtZero: true
                }
            },
            onClick: (evt, elements) => {
                // elements = which bar was clicked
                if (!elements.length) {
                    // click on empty space → reset filter
                    selectedYear = null;
                    if (typeof window.filterMapByYear === "function") {
                        window.filterMapByYear(null);
                    }
                    return;
                }

                const index = elements[0].index;
                const year = sortedYears[index];

                // clicking the same year again → toggle off
                if (selectedYear === year) {
                    selectedYear = null;
                    if (typeof window.filterMapByYear === "function") {
                        window.filterMapByYear(null); // show all years
                    }
                } else {
                    selectedYear = year;
                    if (typeof window.filterMapByYear === "function") {
                        window.filterMapByYear(year); // show only this year
                    }
                }
            }
        }
    });
}

// EXPOSE FUNCTION (for direct use)
window.initYearChart = initYearChart;

// ✅ Wrapper so your existing main.js call works: initCharts(data.features)
function initCharts(features) {
    initYearChart(features);
}
window.initCharts = initCharts;

// inside new Chart(... options: { ... })
onClick: (evt, elements) => {
    if (!elements.length) return;
  
    const index = elements[0].index;
    const year = sortedYears[index];
  
    if (typeof window.filterMapByYear === "function") {
      window.filterMapByYear(year);  // only that year’s points on map
    }
  }
  
// Reset button to clear year filter
document.getElementById("reset-year").addEventListener("click", () => {
    if (typeof window.filterMapByYear === "function") {
        window.filterMapByYear(null);   // show all years again
        window.filterByDateRange(null); // clear date filter as well
    }
});
