// race.js – handles Race breakdown chart
// --------------------------------------
// Requirements:
//   - <canvas id="chart-year-race">
//   - Chart.js included in HTML
//
// Exposed functions:
//   - window.initRace(features)
//   - window.updateRaceByYear(yearOrNull)

let raceFeatures = [];
let raceChart = null;

// 初始化 race chart
function initRace(features) {
  console.log("[race.js] initRace called, features length =", features && features.length);

  raceFeatures = features || [];

  const canvas = document.getElementById("chart-year-race");
  if (!canvas) {
    console.error("[race.js] <canvas id='chart-year-race'> not found in DOM");
    return;
  }

  const ctx = canvas.getContext("2d");
  const { black, white, asian, unknown } = countRaceBreakdown(raceFeatures);

  const total = black + white + asian + unknown;
  const blackPct   = total ? (black   / total) * 100 : 0;
  const whitePct   = total ? (white   / total) * 100 : 0;
  const asianPct   = total ? (asian   / total) * 100 : 0;
  const unknownPct = total ? (unknown / total) * 100 : 0;

  if (raceChart) {
    raceChart.destroy();
  }

  raceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Black", "White", "Asian", "Unknown/Other"],
      datasets: [{
        label: "Share of victims",
        data: [blackPct, whitePct, asianPct, unknownPct],
        borderWidth: 1,
        barThickness: 35, // 厚度
        maxBarThickness: 30, // 最大厚度
        backgroundColor: [
          "rgba(61,  91, 159, 0.85)",   // primary blue - Black
          "rgba(231, 179, 79, 0.85)",    // light orange - White
          "rgba(217, 98, 88, 0.85)",    // yellow/orange - Asian
          "rgba(120, 120, 120, 0.85)",  // grey - Unknown
        
        ],
        borderColor: [
          "rgba(61,  91, 159, 0.85)",   // primary blue - Black
          "rgba(231,179, 79, 0.85)",    // light orange - White
          "rgba(217, 98, 88, 0.85)",    // yellow/orange - Asian
          "rgba(120, 120, 120, 0.85)",  // grey - Unknown
        ]
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y", // 水平 bar

      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Victims by Race (Percentage)"
        },
        dataLabels: {
          anchor: 'end',
          align: 'right',
          color: '#444',
          formatter: (value) => {
            if (value === 0) return '';
            return value < 1 ? value.toFixed(1) + '%' : Math.round(value) + '%';
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const chart = context.chart;
              const counts = chart.rawCounts || {
                black: 0, white: 0, asian: 0, unknown: 0, total: 0
              };
              const index = context.dataIndex;

              let count = 0;
              if (index === 0)      count = counts.black;
              else if (index === 1) count = counts.white;
              else if (index === 2) count = counts.asian;
              else                  count = counts.unknown;

              const pct = context.raw != null ? context.raw.toFixed(1) : 0;
              return `${count} cases (${pct}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: xMax = 100,
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
            text: "Race"
          }
        }
      }
    }
  });

  raceChart.rawCounts = { black, white, asian, unknown, total };

  console.log("[race.js] raceChart created");
}

// 更新：按 year 过滤
function updateRaceByYear(year) {
  console.log("[race.js] updateRaceByYear, year =", year);

  const subset = getRaceFeaturesForYear(year);

  if (!raceChart) {
    console.warn("[race.js] raceChart is null, call initRace with subset");
    initRace(subset);
    return;
  }

  const { black, white, asian, unknown } = countRaceBreakdown(subset);
  const total = black + white + asian + unknown;

  const blackPct   = total ? (black   / total) * 100 : 0;
  const whitePct   = total ? (white   / total) * 100 : 0;
  const asianPct   = total ? (asian   / total) * 100 : 0;
  const unknownPct = total ? (unknown / total) * 100 : 0;

  raceChart.data.datasets[0].data = [blackPct, whitePct, asianPct, unknownPct];
  raceChart.rawCounts = { black, white, asian, unknown, total };
  raceChart.update();
  console.log("[race.js] raceChart updated");

  const subtitle = document.getElementById("year-analysis-subtitle");
  if (subtitle) {
    if (!year) subtitle.textContent = "Showing all years";
    else subtitle.textContent = `Showing only ${year}`;
  }
}

// 统计 race：A/B/W/U → Asian / Black / White / Unknown
function countRaceBreakdown(features) {
  let black = 0;
  let white = 0;
  let asian = 0;
  let unknown = 0;

  (features || []).forEach(f => {
    const props = f.properties || {};
    let val = props.race || props.Race || "";
    val = val == null ? "" : String(val).trim().toUpperCase();

    if (val === "B" || val === "BLACK") {
      black++;
    } else if (val === "W" || val === "WHITE") {
      white++;
    } else if (val === "A" || val === "ASIAN") {
      asian++;
    } else {
      unknown++;
    }
  });

  console.log("[race.js] countRaceBreakdown → B =", black, ", W =", white, ", A =", asian, ", U =", unknown);
  return { black, white, asian, unknown };
}

// 按 year 过滤 features
function getRaceFeaturesForYear(year) {
  if (!year || !raceFeatures || !raceFeatures.length) {
    console.log("[race.js] getRaceFeaturesForYear → all years, len =", raceFeatures.length);
    return raceFeatures;
  }

  const subset = raceFeatures.filter(f => {
    const props = f.properties || {};
    return props.year == year;
  });

  console.log("[race.js] getRaceFeaturesForYear(", year, ") → subset len =", subset.length);
  return subset;
}

// expose
window.initRace = initRace;
window.updateRaceByYear = updateRaceByYear;
