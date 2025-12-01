// pyramid.js – Age–Sex pyramid chart
// ----------------------------------
// Requirements:
//  - <canvas id="chart-age-sex-pyramid">
//  - Chart.js already included
//  - Sex: props.sex (M/F or Male/Female)
//  - Age: props.age
//  - Year: props.year

let pyramidFeatures = [];
let pyramidChart = null;

const AGE_GROUPS = ["0–17", "18–29", "30–44", "45–64", "65+"];

// 分組年齡
function categorizeAge(age) {
  const n = Number(age);
  if (!n || isNaN(n)) return null;
  if (n <= 17) return "0–17";
  if (n <= 29) return "18–29";
  if (n <= 44) return "30–44";
  if (n <= 64) return "45–64";
  return "65+";
}

// 統計每個年齡組的男女數量
function computePyramidCounts(features) {
  const groups = {};
  AGE_GROUPS.forEach(g => {
    groups[g] = { male: 0, female: 0 };
  });

  (features || []).forEach(f => {
    const props = f.properties || {};
    const ageGroup = categorizeAge(props.age);
    if (!ageGroup) return;

    let sex = (props.sex || props.SEX || "").toString().trim().toUpperCase();
    if (sex === "M" || sex === "MALE") {
      groups[ageGroup].male++;
    } else if (sex === "F" || sex === "FEMALE") {
      groups[ageGroup].female++;
    } else {
      // 其他性別標記先略過，不畫在 pyramid
      return;
    }
  });

  return groups;
}

// 把 counts 轉成百分比，Male 用負值放左邊、Female 正值放右邊
function computePyramidData(features) {
  const counts = computePyramidCounts(features);

  let total = 0;
  AGE_GROUPS.forEach(g => {
    total += counts[g].male + counts[g].female;
  });

  if (!total) total = 1; // avoid divide-by-zero

  const maleData = [];
  const femaleData = [];

  AGE_GROUPS.forEach(g => {
    const m = counts[g].male;
    const f = counts[g].female;
    const mPct = (m / total) * 100;
    const fPct = (f / total) * 100;

    // 金字塔：男用負值畫在左邊
    maleData.push(-mPct);
    femaleData.push(fPct);
  });

  // 找最大的絕對值，讓 x 軸左右對稱
  const maxPct = Math.max(
    ...maleData.map(v => Math.abs(v)),
    ...femaleData.map(v => Math.abs(v))
  );
  const xMax = Math.ceil(maxPct / 5) * 5 || 10; // round to nearest 5

  return {
    labels: AGE_GROUPS,
    maleData,
    femaleData,
    counts,
    total,
    xMax
  };
}

function initPyramid(features) {
  pyramidFeatures = features || [];

  const canvas = document.getElementById("chart-age-sex-pyramid");
  if (!canvas) {
    console.error("[pyramid.js] canvas #chart-age-sex-pyramid not found");
    return;
  }

  const ctx = canvas.getContext("2d");
  const meta = computePyramidData(pyramidFeatures);

  if (pyramidChart) {
    pyramidChart.destroy();
  }

  pyramidChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: meta.labels,
      datasets: [
        {
          label: "Male",
          data: meta.maleData,
          backgroundColor: "rgba(61,91,159, 0.85)",
          borderColor: "rgba(61,91,159, 1)",
          borderWidth: 1
        },
        {
          label: "Female",
          data: meta.femaleData,
          backgroundColor: "rgba(217,98,88, 0.85)",
          borderColor: "rgba(217,98,88, 1)",
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: "y", // 水平柱狀
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "bottom"
        },
        title: {
          display: true,
          text: "Age–Sex Pyramid (Share of victims)"
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const datasetIndex = context.datasetIndex; // 0=male,1=female
              const ageGroup = context.label;
              const chart = context.chart;
              const rawMeta = chart._pyramidMeta || null;

              const rawVal = context.raw;
              const pct = Math.abs(rawVal).toFixed(1);

              if (!rawMeta) {
                return `${datasetIndex === 0 ? "Male" : "Female"}: ${pct}%`;
              }

              const counts = rawMeta.counts[ageGroup];
              const total = rawMeta.total;
              const count = datasetIndex === 0 ? counts.male : counts.female;
              const pctExact = total ? (count / total) * 100 : 0;

              return `${datasetIndex === 0 ? "Male" : "Female"}: ${count} cases (${pctExact.toFixed(1)}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          min: -meta.xMax,
          max: meta.xMax,
          ticks: {
            callback: (value) => Math.abs(value) + "%"
          },
          title: {
            display: true,
            text: "Share of victims (%)"
          }
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: "Age group"
          }
        }
      }
    }
  });

  // 存 meta 給 tooltip 用
  pyramidChart._pyramidMeta = {
    counts: meta.counts,
    total: meta.total
  };

  console.log("[pyramid.js] pyramid chart created");
}

function updatePyramidByYear(year) {
  const subset = !year
    ? pyramidFeatures
    : pyramidFeatures.filter(f => {
        const props = f.properties || {};
        return props.year == year;
      });

  if (!pyramidChart) {
    initPyramid(subset);
    return;
  }

  const meta = computePyramidData(subset);

  pyramidChart.data.labels = meta.labels;
  pyramidChart.data.datasets[0].data = meta.maleData;
  pyramidChart.data.datasets[1].data = meta.femaleData;

  pyramidChart.options.scales.x.min = -meta.xMax;
  pyramidChart.options.scales.x.max = meta.xMax;

  pyramidChart._pyramidMeta = {
    counts: meta.counts,
    total: meta.total
  };

  pyramidChart.update();
}

// expose globally
window.initPyramid = initPyramid;
window.updatePyramidByYear = updatePyramidByYear;
