// sex.js – handles Sex breakdown chart
// ------------------------------------
// Requirements:
//   - <canvas id="chart-year-sex">
//   - Chart.js included in HTML
//
// Exposed functions:
//   - window.initSex(features)
//   - window.updateSexByYear(yearOrNull)

let sexFeatures = [];
let sexChart = null;

// 初始化 sex chart
function initSex(features) {
  console.log("[sex.js] initSex called, features length =", features && features.length);

  sexFeatures = features || [];

  const canvas = document.getElementById("chart-year-sex");
  if (!canvas) {
    console.error("[sex.js] <canvas id='chart-year-sex'> not found in DOM");
    return;
  }

  const ctx = canvas.getContext("2d");
  const { male, female, unknown } = countSexBreakdown(sexFeatures);

  const total = male + female + unknown;
  const malePct    = total ? (male    / total) * 100 : 0;
  const femalePct  = total ? (female  / total) * 100 : 0;
  const unknownPct = total ? (unknown / total) * 100 : 0;

  if (sexChart) {
    sexChart.destroy();
  }

  sexChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Male", "Female", "Unknown/Other"],
      datasets: [{
        label: "Share of victims",
        data: [malePct, femalePct, unknownPct],
        borderWidth: 1,
        backgroundColor: [
          "rgba(61, 91, 159, 0.85)",   // Male
          "rgba(255,200,162, 0.85)",    // Female
          "rgba(120, 120, 120, 0.85)",  // Unknown
        ],
        borderColor: [
          "rgba(61, 91, 159, 0.85)",   // Male
          "rgba(255,200,162, 0.85)",    // Female
          "rgba(120, 120, 120, 0.85)",  // Unknown
        ]
      }]
    },
    options: {
      responsive: true,

      // 水平 bar
      indexAxis: "y",

      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Victims by Sex (Percentage)"
        },
        dataLabels: {
          anchor: 'end',
          align: 'right',
          color: '#444',
          formatter: function(value) {
            return value < 1 ? value.toFixed(1) + '%' : Math.round(value) + '%';
          }
        },
        tooltip: {
          callbacks: {
            // 顯示 "XX cases (YY.Y%)"
            label: (context) => {
              const chart = context.chart;
              const counts = chart.rawCounts || {
                male: 0, female: 0, unknown: 0, total: 0
              };
              const index = context.dataIndex; // 0=male, 1=female, 2=unknown

              let count = 0;
              if (index === 0) count = counts.male;
              else if (index === 1) count = counts.female;
              else count = counts.unknown;

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
          suggestedMax: Math.max(malePct, femalePct, unknownPct) + 5, 

          ticks: {
            callback: (value) => value + "%"
          }
        },
        y: {
          title: {
            display: true,
            text: "Sex"
          }
        }
      }
    }
  });

  // 存 raw counts 給 tooltip 用
  sexChart.rawCounts = { male, female, unknown, total };

  console.log("[sex.js] sexChart created");
}

// 根據 year 更新 sex chart
function updateSexByYear(year) {
  console.log("[sex.js] updateSexByYear, year =", year);

  const subset = getSexFeaturesForYear(year);

  if (!sexChart) {
    console.warn("[sex.js] sexChart is null, call initSex with subset");
    initSex(subset);
    return;
  }

  const { male, female, unknown } = countSexBreakdown(subset);
  

  const total = male + female + unknown;
  const malePct    = total ? (male    / total) * 100 : 0;
  const femalePct  = total ? (female  / total) * 100 : 0;
  const unknownPct = total ? (unknown / total) * 100 : 0;

  // 動態 labels / data / colors
const labels = [];
const data = [];
const bg = [];
const border = [];

if (male > 0) {
  labels.push("Male");
  data.push(malePct);
  bg.push("rgba(61, 91, 159, 0.8)");
  border.push("rgba(61, 91, 159, 1)");
}

if (female > 0) {
  labels.push("Female");
  data.push(femalePct);
  bg.push("rgba(255,200,162, 0.8)");
  border.push("rgba(255,200,162, 1)");
}

if (unknown > 0) {
  labels.push("Unknown/Other");
  data.push(unknownPct);
  bg.push("rgba(120, 120, 120, 0.8)");
  border.push("rgba(120, 120, 120, 1)");
}

// 更新 chart
sexChart.data.labels = labels;
sexChart.data.datasets[0].data = data;
sexChart.data.datasets[0].backgroundColor = bg;
sexChart.data.datasets[0].borderColor = border;

sexChart.rawCounts = { male, female, unknown, total };
sexChart.update();

  sexChart.data.datasets[0].data = [malePct, femalePct, unknownPct];
  sexChart.rawCounts = { male, female, unknown, total };
  sexChart.update();
  console.log("[sex.js] sexChart updated");

  // 跟 fatal.js 用同一個 subtitle（如果你想同步顯示）
  const subtitle = document.getElementById("year-analysis-subtitle");
  if (subtitle) {
    if (!year) subtitle.textContent = "Showing all years";
    else subtitle.textContent = `Showing only ${year}`;
  }
}

// 計算 Male / Female / Unknown
function countSexBreakdown(features) {
  let male = 0;
  let female = 0;
  let unknown = 0;

  (features || []).forEach(f => {
    const props = f.properties || {};
    let val = props.sex || props.Sex || "";
    val = val == null ? "" : String(val).trim().toUpperCase();

    if (val === "M" || val === "MALE") {
      male++;
    } else if (val === "F" || val === "FEMALE") {
      female++;
    } else {
      unknown++;
    }
  });

  console.log("[sex.js] countSexBreakdown → male =", male, ", female =", female, ", unknown =", unknown);
  return { male, female, unknown };
}

// 取某一年份的 features
function getSexFeaturesForYear(year) {
  if (!year || !sexFeatures || !sexFeatures.length) {
    console.log("[sex.js] getSexFeaturesForYear → all years, len =", sexFeatures.length);
    return sexFeatures;
  }

  const subset = sexFeatures.filter(f => {
    const props = f.properties || {};
    return props.year == year; // string/number 都可以
  });

  console.log("[sex.js] getSexFeaturesForYear(", year, ") → subset len =", subset.length);
  return subset;
}

// expose functions globally
window.initSex = initSex;
window.updateSexByYear = updateSexByYear;
