// age.js – Age distribution chart
let ageFeatures = [];
let ageChart = null;

// 年龄分组函数
function categorizeAge(age) {
  age = Number(age);
  if (!age || isNaN(age)) return "Unknown";
  if (age <= 17) return "0–17";
  if (age <= 29) return "18–29";
  if (age <= 44) return "30–44";
  if (age <= 64) return "45–64";
  return "65+";
}

function countAgeBreakdown(features) {
  const categories = {
    "0–17": 0,
    "18–29": 0,
    "30–44": 0,
    "45–64": 0,
    "65+": 0,
    "Unknown": 0
  };

  (features || []).forEach(f => {
    const props = f.properties || {};
    const ageGroup = categorizeAge(props.age);
    categories[ageGroup]++;
  });

  return categories;
}

function initAge(features) {
  ageFeatures = features || [];

  const canvas = document.getElementById("chart-year-age");
  if (!canvas) {
    console.error("[age.js] canvas not found");
    return;
  }

  const ctx = canvas.getContext("2d");
  const counts = countAgeBreakdown(ageFeatures);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const labels = Object.keys(counts);
  const data = Object.values(counts).map(v => total ? (v / total) * 100 : 0);

  if (ageChart) ageChart.destroy();

  ageChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Share of victims (%)",
        data,
        borderWidth: 1,
        backgroundColor: [
          "rgba(176,53,62,0.85)", // red - 0-17
          "rgba(196,104,110,0.85)", // pink - 18-29
          "rgba(216,154,159,0.85)", // light pink - 30-44
          "rgba(225,175,180,0.85)", // lighter pink - 45-64
          "rgba(235,205,207,0.85)",
          "rgba(120,120,120,0.85)"   // unknown
        ],
        borderColor: [
            "rgba(176,53,62,0.85)",
            "rgba(196,104,110,0.85)",
            "rgba(216,154,159,0.85)",
            "rgba(225,175,180,0.85)", // lighter pink - 45-64
            "rgba(235,205,207,0.85)",
            "rgba(120,120,120,0.85)"   // unknown
          ],
        barThickness: 25,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Victims by Age (Percentage)"
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: v => v + "%"
          }
        }
      }
    }
  });

  console.log("[age.js] Age chart created");
}

function updateAgeByYear(year) {
  const subset = year
    ? ageFeatures.filter(f => (f.properties || {}).year == year)
    : ageFeatures;

  const counts = countAgeBreakdown(subset);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const labels = Object.keys(counts);
  const data = Object.values(counts).map(v => total ? (v / total) * 100 : 0);

  ageChart.data.labels = labels;
  ageChart.data.datasets[0].data = data;
  ageChart.update();
}

// expose globally
window.initAge = initAge;
window.updateAgeByYear = updateAgeByYear;
