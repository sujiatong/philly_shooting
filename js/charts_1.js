// charts_1.js – Year bar chart + Fatal vs Non-fatal analysis (debug-safe)
// -----------------------------------------------------------------------
// 依赖：
//   - <canvas id="yearChart">
//   - <canvas id="chart-year-fatal">
//   - <button id="reset-year">Show all years</button>
//   - window.filterMapByYear(yearOrNull) 在 controls_1.js

let allFeatures = [];
let yearChart = null;
let fatalChart = null;
let selectedYear = null;

// -------------------------
// 入口：从 main_1.js 调用
// -------------------------
function initCharts(features) {
  console.log("[charts.js] initCharts called, features length =", features && features.length);

  if (!features || !Array.isArray(features)) {
    console.error("initCharts: 'features' is missing or not an array", features);
    return;
  }

  allFeatures = features;

  // 1. Year bar
  initYearChart(features);

  // 2. Fatal chart (尝试初始化一次，如果失败，后面 lazy init 再尝试)
  initFatalChart(features);

  // 暴露年度分析函数
  window.updateYearAnalysis = updateYearAnalysis;

  // Reset 按钮
  const resetBtn = document.getElementById("reset-year");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      console.log("[charts.js] #reset-year clicked");
      selectedYear = null;

      if (typeof window.filterMapByYear === "function") {
        window.filterMapByYear(null);
      }

      updateYearAnalysis(null);
    });
  } else {
    console.warn("[charts.js] #reset-year button not found in DOM");
  }
}

// 暴露给 global
window.initCharts = initCharts;

// --------------------------
// 1. Year bar chart
// --------------------------
function initYearChart(features) {
  console.log("[charts.js] initYearChart");

  const years = features
    .map(f => f.properties && f.properties.year)
    .filter(y => y !== null && y !== undefined);

  if (!years.length) {
    console.warn("initYearChart: no valid 'year' values found in features");
  }

  const yearCounts = {};
  years.forEach(y => {
    yearCounts[y] = (yearCounts[y] || 0) + 1;
  });

  const sortedYears = Object.keys(yearCounts)
    .map(y => Number(y))
    .sort((a, b) => a - b);

  const counts = sortedYears.map(y => yearCounts[y]);

  const canvas = document.getElementById("yearChart");
  if (!canvas) {
    console.error("initYearChart: no <canvas id='yearChart'> found in DOM");
    return;
  }

  const ctx = canvas.getContext("2d");

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
        legend: { display: false },
        title: {
          display: true,
          text: "Shootings per Year (click bar to filter)"
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
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Shootings"
          }
        }
      },
      onClick: (evt, elements) => {
        // 没点到 bar → reset 全部
        if (!elements.length) {
          console.log("[charts.js] yearChart clicked on empty → reset");
          selectedYear = null;

          if (typeof window.filterMapByYear === "function") {
            window.filterMapByYear(null);
          }

          updateYearAnalysis(null);
          return;
        }

        const index = elements[0].index;
        const year = sortedYears[index];
        console.log("[charts.js] yearChart clicked, year =", year);

        // 再点一次同一年 → 取消选择
        if (selectedYear === year) {
          console.log("[charts.js] same year clicked again → clear filter");
          selectedYear = null;

          if (typeof window.filterMapByYear === "function") {
            window.filterMapByYear(null);
          }

          updateYearAnalysis(null);
          return;
        }

        selectedYear = year;

        if (typeof window.filterMapByYear === "function") {
          window.filterMapByYear(year);
        }

        updateYearAnalysis(year);
      }
    }
  });
}

// -----------------------------
// Fatal vs Non-fatal 计数
// -----------------------------
function countFatalBreakdown(features) {
  let fatal = 0;
  let nonFatal = 0;

  features.forEach(f => {
    const props = f.properties || {};
    const val = Number(props.fatal); // 0 or 1

    if (val === 1) fatal++;
    else nonFatal++;
  });

  console.log("[charts.js] countFatalBreakdown → fatal =", fatal, ", nonFatal =", nonFatal);
  return { fatal, nonFatal };
}

// -----------------------------
// Fatal chart 初始化
// -----------------------------
function initFatalChart(features) {
  console.log("[charts.js] initFatalChart");

  const canvas = document.getElementById("chart-year-fatal");
  if (!canvas) {
    console.error("initFatalChart: no <canvas id='chart-year-fatal'> found in DOM");
    return;
  }

  const ctx = canvas.getContext("2d");
  const { fatal, nonFatal } = countFatalBreakdown(features);

  if (fatalChart) {
    fatalChart.destroy();
  }

  fatalChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Fatal", "Non-fatal"],
      datasets: [{
        label: "Cases",
        data: [fatal, nonFatal],
        borderWidth: 1,
        backgroundColor: [
          "rgba(183, 28, 28, 0.75)",  // Fatal
          "rgba(66, 165, 245, 0.75)"  // Non-fatal
        ],
        borderColor: [
          "rgba(183, 28, 28, 1)",
          "rgba(66, 165, 245, 1)"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Fatal vs Non-fatal"
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
            text: "Outcome"
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Victims"
          }
        }
      }
    }
  });

  console.log("[charts.js] fatalChart created");
}

// -----------------------------
// 年度分析更新（只管 fatal）
// -----------------------------
function getSubsetForYear(year) {
  if (!year || !allFeatures || !allFeatures.length) {
    console.log("[charts.js] getSubsetForYear → all years, len =", allFeatures.length);
    return allFeatures;
  }
  const subset = allFeatures.filter(f => {
    const props = f.properties || {};
    return props.year == year;
  });
  console.log("[charts.js] getSubsetForYear(", year, ") → subset len =", subset.length);
  return subset;
}

function updateYearAnalysis(year) {
  console.log("[charts.js] updateYearAnalysis, year =", year);

  const subset = getSubsetForYear(year);

  // ⭐ 如果 fatalChart 还没建立，就在这里尝试创建一次
  if (!fatalChart) {
    console.warn("[charts.js] fatalChart is null in updateYearAnalysis → try initFatalChart now");
    initFatalChart(subset);
    return;
  }

  const { fatal, nonFatal } = countFatalBreakdown(subset);
  fatalChart.data.datasets[0].data = [fatal, nonFatal];
  fatalChart.update();
  console.log("[charts.js] fatalChart updated");

  const subtitle = document.getElementById("year-analysis-subtitle");
  if (subtitle) {
    if (!year) subtitle.textContent = "Showing all years";
    else subtitle.textContent = `Showing only ${year}`;
  }
}
