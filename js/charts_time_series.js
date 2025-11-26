// charts.js – Chart.js time series (yearly counts)

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

    new Chart(ctx, {
        type: "line",   // ⬅️ time series line chart
        data: {
            labels: sortedYears,
            datasets: [{
                label: "Shootings per Year",
                data: counts,
                fill: true,
                borderWidth: 2,
                tension: 0.2,          // a bit smooth
                pointRadius: 3,
                pointHoverRadius: 5,
                borderColor: "rgba(211, 47, 47, 1)",
                backgroundColor: "rgba(211, 47, 47, 0.6)"
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
                    text: "Shootings over Time (by Year)"
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Year"
                    }
                    // you *could* do type: 'linear' here if you want numeric axis
                    // type: 'linear',
                    // ticks: { stepSize: 1 }
                },
                y: {
                    title: {
                        display: true,
                        text: "Number of Shootings"
                    },
                    beginAtZero: true
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
