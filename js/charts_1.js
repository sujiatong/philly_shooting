// charts.js – Chart.js yearly counts as BAR chart + map + other panels

let yearChart = null;     // global Chart.js instance
let selectedYear = null;  // track currently selected year

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
    type: "bar",
    data: {
      labels: sortedYears,
      datasets: [{
        label: "Shootings per Year",
        data: counts,
        borderWidth: 1,
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

      // 點 bar 時觸發
      onClick: (evt, elements) => {
        // elements = which bar was clicked
        if (!elements.length) {
          // click on empty space → reset filter
          selectedYear = null;
      
          if (typeof window.filterMapByYear === "function") {
            window.filterMapByYear(null);
          }
      
          // reset monthly trend to ALL years
          if (typeof window.updateMonthlyByYear === "function") {
            window.updateMonthlyByYear(null);
          }
      
          // reset fatal chart (all years)
          if (typeof window.updateFatalByYear === "function") {
            window.updateFatalByYear(null);
          }
      
          // reset sex chart (all years)
          // if (typeof window.updateSexByYear === "function") {
          //  window.updateSexByYear(null);
          // }
      
          // reset race chart (all years)
          if (typeof window.updateRaceByYear === "function") {
            window.updateRaceByYear(null);
          }
      
          // reset age chart (all years)
          // if (typeof window.updateAgeByYear === "function") {
          //  window.updateAgeByYear(null);
          // }
          
          if (typeof window.updatePyramidByYear === "function") {
            window.updatePyramidByYear(null);
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
      
          // reset monthly trend to ALL years 
          if (typeof window.updateMonthlyByYear === "function") {
            window.updateMonthlyByYear(null);
          }
      
          if (typeof window.updateFatalByYear === "function") {
            window.updateFatalByYear(null); // reset fatal chart
          }
      
          // if (typeof window.updateSexByYear === "function") {
          //  window.updateSexByYear(null); // reset sex chart
          // }
      
          if (typeof window.updateRaceByYear === "function") {
            window.updateRaceByYear(null); // reset race chart
          }
      
          // if (typeof window.updateAgeByYear === "function") {
          //  window.updateAgeByYear(null); // reset age chart
          // `}

          if (typeof window.updatePyramidByYear === "function") {
            window.updatePyramidByYear(null); // reset pyramid chart
          }
      
        } else {
          // select a new year
          selectedYear = year;
      
          if (typeof window.filterMapByYear === "function") {
            window.filterMapByYear(year); // show only this year
          }
      
          // make fatal chart show only this year
          if (typeof window.updateFatalByYear === "function") {
            window.updateFatalByYear(year);
          }
      
          // update monthly trend to this year
          if (typeof window.updateMonthlyByYear === "function") {
            window.updateMonthlyByYear(year);
          }
      
          // update sex chart to this year
          // if (typeof window.updateSexByYear === "function") {
          //  window.updateSexByYear(year);
          // }
      
          // update race chart to this year
          if (typeof window.updateRaceByYear === "function") {
            window.updateRaceByYear(year);
          }
      
          // update age chart to this year  
          // if (typeof window.updateAgeByYear === "function") {
          //  window.updateAgeByYear(year);
          //}

          // update pyramid chart to this year
          if (typeof window.updatePyramidByYear === "function") {
            window.updatePyramidByYear(year);
          }
        }
      }
    }
  });
}

// -----------------------------------------------------
// EXPOSE FUNCTIONS
// -----------------------------------------------------

window.initYearChart = initYearChart;

// 如果你以后想继续用 initCharts，也可以保留这个 wrapper
function initCharts(features) {
  initYearChart(features);
}
window.initCharts = initCharts;

// -----------------------------------------------------
// Reset button to clear year filter
// -----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("reset-year");
  if (!resetBtn) return;

  resetBtn.addEventListener("click", () => {
    selectedYear = null;

    if (typeof window.filterMapByYear === "function") {
      window.filterMapByYear(null);
    }

    if (typeof window.filterByDateRange === "function") {
      window.filterByDateRange(null, null);
    }

    if (typeof window.updateMonthlyByYear === "function") {
      window.updateMonthlyByYear(null);
    }

    if (typeof window.updateFatalByYear === "function") {
      window.updateFatalByYear(null);
    }

    // if (typeof window.updateSexByYear === "function") {
    //  window.updateSexByYear(null);
    // }

    if (typeof window.updateRaceByYear === "function") {
      window.updateRaceByYear(null);
    }

    // if (typeof window.updateAgeByYear === "function") {
    //  window.updateAgeByYear(null);
    // }

    if (typeof window.updatePyramidByYear === "function") {
      window.updatePyramidByYear(null);
    }

  });
});
