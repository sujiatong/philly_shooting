// monthlychart.js – Monthly trend chart (all years + per-year)

let monthlyFeatures = [];
let monthlyChart = null;

// 初始化：畫「全部年份」的 monthly trend
function initMonthlyChart(features) {
  console.log("[monthlychart.js] initMonthlyChart, features length =", features?.length);

  monthlyFeatures = features || [];

  const canvas = document.getElementById("monthlyChart");   // ⭐ 改這裡
  if (!canvas) {
    console.error("[monthlychart.js] <canvas id='monthlyChart'> not found in DOM");
    return;
  }

  const ctx = canvas.getContext("2d");

  // 先算全部年份的 monthly
  const allMeta = computeAllYearsMonthly(monthlyFeatures);

  if (monthlyChart) {
    monthlyChart.destroy();
  }

  monthlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: allMeta.labels,
      datasets: [{
        label: "Monthly Shootings",
        data: allMeta.counts,
        borderWidth: 2,
        tension: 0.25,
        fill: true,
        borderColor: "rgba(211, 47, 47, 1)",
        pointBackgroundColor: "rgba(211, 47, 47, 0.8)",
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: "Monthly Shooting Trend (All years)"
        },
        tooltip: {
          callbacks: {
            label: (context) => `Count: ${context.raw}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Month" },
          ticks: {
            maxRotation: 50,
            minRotation: 30
          }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Shootings Count" }
        }
      }
    }
  });

  console.log("[monthlychart.js] monthlyChart created (all years)");

  // 讓外面可以呼叫
  window.updateMonthlyByYear = updateMonthlyByYear;
}

window.initmonthlychart= initmonthlychart;


// ----------------------
// 計算全部年份 monthly (YYYY-MM)
// ----------------------
function computeAllYearsMonthly(features) {
  const monthCounts = {};

  (features || []).forEach(f => {
    const props = f.properties || {};
    const dateStr = props.date_;
    if (!dateStr || dateStr.length < 7) return;

    const ym = dateStr.slice(0, 7);  // YYYY-MM
    monthCounts[ym] = (monthCounts[ym] || 0) + 1;
  });

  const labels = Object.keys(monthCounts).sort();
  const counts = labels.map(m => monthCounts[m]);
  return { labels, counts };
}


// ----------------------
// 計算單一年度 monthly (Jan–Dec)
// ----------------------
function computeYearMonthly(features, year) {
  const yearNum = Number(year);
  const counts = new Array(12).fill(0);

  (features || []).forEach(f => {
    const props = f.properties || {};
    const dateStr = props.date_;
    if (!dateStr || dateStr.length < 7) return;

    const y = Number(dateStr.slice(0, 4));
    const m = Number(dateStr.slice(5, 7));

    if (y === yearNum && m >= 1 && m <= 12) {
      counts[m - 1]++;
    }
  });

  const labels = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];

  return { labels, counts };
}


// ----------------------
// 更新 monthly chart（全部年份 / 單一年份）
// ----------------------
function updateMonthlyByYear(year) {
  console.log("[monthlychart.js] updateMonthlyByYear, year =", year);

  if (!monthlyChart || !monthlyFeatures.length) {
    console.warn("[monthlychart.js] monthlyChart or monthlyFeatures not ready");
    return;
  }

  let meta, titleText;

  if (!year) {
    meta = computeAllYearsMonthly(monthlyFeatures);
    titleText = "Monthly Shooting Trend (All years)";
  } else {
    meta = computeYearMonthly(monthlyFeatures, year);
    titleText = `Monthly Shootings in ${year}`;
  }

  monthlyChart.data.labels = meta.labels;
  monthlyChart.data.datasets[0].data = meta.counts;
  monthlyChart.options.plugins.title.text = titleText;
  monthlyChart.update();

  const subtitle = document.getElementById("year-analysis-subtitle");
  if (subtitle) {
    subtitle.textContent = !year
      ? "Showing all years (monthly trend)"
      : `Showing monthly trend for ${year}`;
  }

  console.log("[monthlychart.js] monthlyChart updated");
}
