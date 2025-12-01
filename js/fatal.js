// fatal.js – handles Fatal vs Non-fatal chart only
// -----------------------------------------------
// Requirements:
//   - <canvas id="chart-year-fatal">
//   - Chart.js included in HTML
//
// Exposed functions:
//   - window.initFatal(features)
//   - window.updateFatalByYear(yearOrNull)

let fatalFeatures = [];
let fatalChart = null;

// initialize fatal vs non-fatal chart
function initFatal(features) {
  console.log("[fatal.js] initFatal called, features length =", features && features.length);

  fatalFeatures = features || [];

  const canvas = document.getElementById("chart-year-fatal");
  if (!canvas) {
    console.error("[fatal.js] <canvas id='chart-year-fatal'> not found in DOM");
    return;
  }

  const ctx = canvas.getContext("2d");
  const { fatal, nonFatal } = countFatalBreakdown(fatalFeatures);

  // ---- convert to percentage ----
  const total = fatal + nonFatal;
  const fatalPct = total ? (fatal / total) * 100 : 0;
  const nonFatalPct = total ? (nonFatal / total) * 100 : 0;

  if (fatalChart) {
    fatalChart.destroy();
  }

  fatalChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Fatal", "Non-fatal"],
      datasets: [{
        label: "Share of victims",
        data: [fatalPct, nonFatalPct],
        borderWidth: 1,
        backgroundColor: [
          "rgba(183, 28, 28, 0.75)",  // Fatal
          "rgba(120, 120, 120, 0.85)",  // grey 
        ],
        borderColor: [
          "rgba(183, 28, 28, 1)",
          "rgba(120, 120, 120, 0.85)",  // grey 
        ]
      }]
    },
    options: {
      responsive: true,

      // ---- horizontal bar ----
      indexAxis: "y",

      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Fatal vs Non-fatal (Percentage)"
        },
        tooltip: {
          callbacks: {
            // show "XX cases (YY.Y%)"
            label: (context) => {
              const chart = context.chart;
              const counts = chart.rawCounts || { fatal: 0, nonFatal: 0, total: 0 };
              const index = context.dataIndex; // 0 = fatal, 1 = nonFatal

              const count = index === 0 ? counts.fatal : counts.nonFatal;
              const pct = context.raw != null ? context.raw.toFixed(1) : 0;

              return `${count} cases (${pct}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Share of Victims (%)"
          },
          ticks: {
            callback: (value) => value + "%"
          }
        },
        y: {
          title: {
            display: true,
            text: "Outcome"
          }
        }
      }
    }
  });

  // store raw counts for tooltip use
  fatalChart.rawCounts = { fatal, nonFatal, total };

  console.log("[fatal.js] fatalChart created");
}

// update fatal chart by year
function updateFatalByYear(year) {
  console.log("[fatal.js] updateFatalByYear, year =", year);

  const subset = getFeaturesForYear(year);

  if (!fatalChart) {
    console.warn("[fatal.js] fatalChart is null, call initFatal with subset");
    initFatal(subset);  // initialize with subset
    return;
  }

  const { fatal, nonFatal } = countFatalBreakdown(subset);

  const total = fatal + nonFatal;
  const fatalPct = total ? (fatal / total) * 100 : 0;
  const nonFatalPct = total ? (nonFatal / total) * 100 : 0;

  fatalChart.data.datasets[0].data = [fatalPct, nonFatalPct];
  fatalChart.rawCounts = { fatal, nonFatal, total }; // update raw counts for tooltip
  fatalChart.update();
  console.log("[fatal.js] fatalChart updated");

  const subtitle = document.getElementById("year-analysis-subtitle");
  if (subtitle) {
    if (!year) subtitle.textContent = "Showing all years";
    else subtitle.textContent = `Showing only ${year}`;
  }
}

// count fatal vs non-fatal in features array 
function countFatalBreakdown(features) {
  let fatal = 0;
  let nonFatal = 0;

  (features || []).forEach(f => {
    const props = f.properties || {};
    const val = Number(props.fatal); // 0 or 1

    if (val === 1) fatal++;
    else nonFatal++;
  });

  console.log("[fatal.js] countFatalBreakdown → fatal =", fatal, ", nonFatal =", nonFatal);
  return { fatal, nonFatal };
}

// get features for specific year, or all if year is null/undefined
function getFeaturesForYear(year) {
  if (!year || !fatalFeatures || !fatalFeatures.length) {
    console.log("[fatal.js] getFeaturesForYear → all years, len =", fatalFeatures.length);
    return fatalFeatures;
  }

  const subset = fatalFeatures.filter(f => {
    const props = f.properties || {};
    return props.year == year;  // loose equality to match string/number
  });

  console.log("[fatal.js] getFeaturesForYear(", year, ") → subset len =", subset.length);
  return subset;
}

// expose functions globally
window.initFatal = initFatal;
window.updateFatalByYear = updateFatalByYear;
