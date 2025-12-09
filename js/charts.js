// --- CHARTS LOGIC ---

function renderDashboardChart(dataObj) {
    const ctx = document.getElementById('expenseChart').getContext('2d');

    if (dashboardChartInstance) dashboardChartInstance.destroy();

    const labels = Object.keys(dataObj);
    const data = Object.values(dataObj);

    const colors = getColors();

    dashboardChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 } } }
            },
            cutout: '70%'
        }
    });
}

function calculateMonthlyCategoryTotals() {
    const monthlyTotals = {}; // { 'YYYY-MM': { 'Category1': amount, 'Category2': amount, ... } }

    appData.transactions.forEach(t => {
        const month = t.date.substring(0, 7);
        const amount = parseFloat(t.amount) || 0;
        const category = t.category;

        if (!monthlyTotals[month]) {
            monthlyTotals[month] = {};
        }

        monthlyTotals[month][category] = (monthlyTotals[month][category] || 0) + amount;
    });

    return monthlyTotals;
}

function renderTrendsChart() {
    const monthlyData = calculateMonthlyCategoryTotals();
    const months = Object.keys(monthlyData).sort(); // Y-axis labels

    const selectedCategory = document.getElementById('trend-category-selector').value;
    const chartContainer = document.getElementById('trendsChart');
    const noDataMessage = document.getElementById('trends-no-data');

    // Hide/Show No Data Message
    if (months.length < 2) {
        chartContainer.classList.add('hidden');
        noDataMessage.classList.remove('hidden');
        if (trendsChartInstance) trendsChartInstance.destroy();
        return;
    } else {
        chartContainer.classList.remove('hidden');
        noDataMessage.classList.add('hidden');
    }

    // Prepare Datasets
    let datasets = [];
    let categoriesToProcess = [];

    if (selectedCategory === 'all') {
        // Collect all categories present in the data for 'all' mode
        const uniqueCategoriesInData = new Set();
        months.forEach(month => {
            Object.keys(monthlyData[month]).forEach(cat => uniqueCategoriesInData.add(cat));
        });
        categoriesToProcess = Array.from(uniqueCategoriesInData).sort();
    } else {
        categoriesToProcess = [selectedCategory];
    }

    const colors = getColors();

    categoriesToProcess.forEach((cat, index) => {
        const dataPoints = months.map(month => {
            // Get the total for this category in this month, default to 0
            return monthlyData[month][cat] || 0;
        });

        // Use a stable color index based on the category's position in the master list,
        // or just loop through colors if not in the master list (e.g., if categories were loaded from a file/database that's not fully synced with appData.categories)
        const masterIndex = appData.categories.indexOf(cat);
        const colorIndex = masterIndex !== -1 ? masterIndex % colors.length : index % colors.length;

        datasets.push({
            label: cat,
            data: dataPoints,
            borderColor: colors[colorIndex],
            backgroundColor: colors[colorIndex] + '40', // Semi-transparent fill
            tension: 0.3, // Curve the line
            borderWidth: 2,
            pointRadius: 4,
            fill: false, // Don't fill area under the line unless only one category is selected
            hidden: false,
        });
    });

    if (trendsChartInstance) trendsChartInstance.destroy();

    const ctx = chartContainer.getContext('2d');
    trendsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // NEW CLICK HANDLER
            onClick: (event, elements, chart) => {
                if (elements.length > 0) {
                    // Find the month label corresponding to the clicked element
                    const index = elements[0].index;
                    const month = chart.data.labels[index];
                    showMonthlyDetailFromTrends(month);
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        // Only show legend for 'all' or selected category
                        filter: (legendItem, data) => selectedCategory === 'all' || legendItem.text === selectedCategory
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                            }
                            return label;
                        },
                        title: function (items) {
                            // Override title to include a click hint when hovering over the combined total point (if showing 'all')
                            const month = items[0].label;
                            // Calculate total across all datasets shown in the tooltip
                            const total = items.reduce((sum, item) => sum + item.parsed.y, 0);

                            if (selectedCategory === 'all') {
                                return `${month} (Total: ${total.toFixed(2)} €) - Haz click para detalle.`;
                            } else {
                                return month;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Mes' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Gasto (€)' }
                }
            }
        }
    });
}
