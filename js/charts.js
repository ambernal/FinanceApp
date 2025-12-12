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
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
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

// Category Color Palette (More pleasant and distinct)
const categoryColors = {
    'Comida': '#FF6B6B',      // Pastel Red
    'Ocio': '#FFD93D',        // Pastel Yellow/Orange
    'Deporte': '#6BCB77',     // Pastel Green
    'Supermercado': '#4D96FF',// Pastel Blue
    'Hijos': '#FF9F45',       // Orange
    'Ropa': '#F473B9',        // Pink
    'Transporte': '#5C527F',  // Purpleish
    'Seguros': '#3EAE9A',     // Teal
    'Gas': '#A8D8EA',         // Light Blue
    'Luz': '#AA96DA',         // Light Purple
    'Agua': '#FCBAD3',        // Light Pink
    'Casa': '#FFFFD2',        // Light Yellow
    'Suscripciones': '#2C3E50', // Dark Blue/Grey
    'Salud': '#E74C3C',       // Red
    'ING': '#F39C12',         // Orange
    'Ahorro': '#27AE60',      // Green
    'Otros': '#95A5A6'        // Grey
};

function getColorForCategory(cat) {
    return categoryColors[cat] || '#BDC3C7';
}

// Helper to create a diagonal stripe pattern
function createDiagonalPattern(color) {
    const shape = document.createElement('canvas');
    shape.width = 10;
    shape.height = 10;
    const c = shape.getContext('2d');

    // Background (lighter version of color)
    c.fillStyle = color + '33'; // 20% opacity hex
    c.fillRect(0, 0, 10, 10);

    // Stripe
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 10);
    c.lineTo(10, 0);
    c.stroke();

    return c.createPattern(shape, 'repeat');
}

let comparisonChartInstance = null;

function renderComparisonChart(user1Data, user2Data, selectedCategories) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');

    if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
    }

    // 1. Get all unique months from both datasets
    const getMonths = (data) => data.map(t => t.date.substring(0, 7)); // YYYY-MM
    const allMonths = [...new Set([...getMonths(user1Data), ...getMonths(user2Data)])].sort();

    // 2. Prepare Datasets
    const datasets = [];

    // Helper to get data for a specific user, category, and month list
    const getDataForUserCat = (userData, category, months) => {
        return months.map(month => {
            return userData
                .filter(t => t.date.startsWith(month) && t.category === category)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        });
    };

    selectedCategories.forEach(cat => {
        const color = getColorForCategory(cat);

        // User 1 Dataset: Solid Color
        const data1 = getDataForUserCat(user1Data, cat, allMonths);
        if (data1.some(v => v > 0)) {
            datasets.push({
                label: `${cat} (U1)`,
                data: data1,
                backgroundColor: color,
                stack: 'User 1',
                barPercentage: 0.7,
                categoryPercentage: 0.8,
                borderRadius: 4,
                order: 1
            });
        }

        // User 2 Dataset: Diagonal Pattern
        const data2 = getDataForUserCat(user2Data, cat, allMonths);
        if (data2.some(v => v > 0)) {
            datasets.push({
                label: `${cat} (U2)`,
                data: data2,
                backgroundColor: createDiagonalPattern(color),
                borderColor: color,
                borderWidth: 1,
                stack: 'User 2',
                barPercentage: 0.7,
                categoryPercentage: 0.8,
                borderRadius: 4,
                order: 2
            });
        }
    });

    // 3. Create Chart
    comparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allMonths,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index', // We start with index to get all items for the month
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 10 },
                        filter: (item, chart) => item.text.includes('(U1)'),
                        generateLabels: (chart) => {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            return original
                                .filter(item => item.text.includes('(U1)'))
                                .map(item => {
                                    item.text = item.text.replace(' (U1)', '');
                                    return item;
                                });
                        }
                    }
                },
                tooltip: {
                    filter: (item, data) => {
                        // CRITICAL: Only show items that belong to the same stack as the hovered item
                        // But 'item' here is the tooltip item. We need to know which stack was hovered.
                        // Chart.js tooltip filter doesn't easily give context of "what triggered this".
                        // However, if we use mode: 'index', we get everything.
                        // We can hack this by checking the X coordinate or using external handler, 
                        // BUT simpler: Group the tooltip by Stack.
                        // Default tooltip shows everything.
                        // Let's try to just separate them in the Title or Body.

                        // Actually, the user said "show ONLY the expenses of the user of that bar".
                        // This implies mode: 'nearest' (hovering a specific bar) but showing ALL segments of that bar.
                        // Chart.js doesn't have "mode: stack".
                        // We can simulate it by filtering based on the first item in the tooltip list (which is usually the nearest).

                        return true;
                    },
                    callbacks: {
                        title: (items) => {
                            const month = items[0].label;
                            // We need to determine which User is being hovered.
                            // This is tricky with mode: 'index'.
                            // Let's assume we show BOTH users side-by-side in the tooltip?
                            // User said: "no el de los 2".
                            // So we MUST distinguish.

                            // If we switch interaction.mode to 'nearest' and axis 'x', we might get closer.
                            // But stacked bars are on the same X.

                            // Let's try a custom filter logic:
                            // If the user hovers the LEFT bar (User 1), show User 1.
                            // If RIGHT bar (User 2), show User 2.
                            // We can check `items[0].dataset.stack`.

                            const stack = items[0].dataset.stack;
                            const total = items
                                .filter(i => i.dataset.stack === stack)
                                .reduce((sum, i) => sum + i.parsed.y, 0);

                            return `${month} - ${stack} (Total: ${total.toFixed(2)}€)`;
                        },
                        label: function (context) {
                            // Only return label if it matches the stack of the first item (handled by filter? No, filter runs before sorting)
                            // We can return null to hide it?
                            return null; // We will handle rendering in 'afterBody' or similar? 
                            // No, standard label is fine, we just need to filter the ITEMS list.
                        }
                    },
                    // Custom filter to only show items matching the stack of the "nearest" item
                    filter: (tooltipItem, index, tooltipItems, data) => {
                        // Find the "nearest" item (the one actually hovered)
                        // This is hard to know inside the filter function.
                        // A common trick: The first item in tooltipItems is usually the one closest to cursor?
                        // Not reliable in 'index' mode.

                        // Let's try changing interaction mode to 'dataset' but that only shows one segment.

                        // OK, let's stick to 'index' but visually separate them in the tooltip?
                        // User explicitly said "no el de los 2".

                        // Let's try this:
                        // Use `mode: 'x'` and `intersect: true`.
                        // Since bars are side-by-side, `intersect: true` means we only trigger when touching a bar.
                        // When touching User 1 bar, we get User 1 stack items?
                        // No, `intersect: true` with stacked bars usually gets just the specific segment.

                        // BEST APPROACH:
                        // Use `mode: 'nearest'`, `axis: 'x'`, `intersect: true`.
                        // This gets the specific segment hovered.
                        // THEN, in the tooltip callback, we manually find all other datasets for that same stack and month, and add them to the body.
                        // This requires custom `beforeBody` or `afterBody`.

                        return true;
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: { display: true, text: 'Mes' }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: 'Cantidad (€)' }
                }
            }
        }
    });

    // Update options for the specific tooltip requirement
    comparisonChartInstance.options.interaction.mode = 'nearest';
    comparisonChartInstance.options.interaction.axis = 'x';
    comparisonChartInstance.options.interaction.intersect = true;

    comparisonChartInstance.options.plugins.tooltip.callbacks.title = (items) => {
        const item = items[0];
        const month = item.label;
        const stack = item.dataset.stack;
        return `${month} - ${stack}`;
    };

    comparisonChartInstance.options.plugins.tooltip.callbacks.label = (context) => {
        // This is called for the hovered item.
        // We want to list ALL items for this stack.
        // But `label` is called once per item in `tooltipItems`.
        // With mode 'nearest' + intersect 'true', `tooltipItems` has only 1 item (the hovered segment).
        // So we use `afterBody` to append the rest.
        return null; // Hide default label
    };

    comparisonChartInstance.options.plugins.tooltip.callbacks.afterBody = (items) => {
        const hoveredItem = items[0];
        const stack = hoveredItem.dataset.stack;
        const monthIndex = hoveredItem.dataIndex;

        // Find all datasets matching this stack
        const stackDatasets = comparisonChartInstance.data.datasets.filter(d => d.stack === stack);

        let lines = [];
        let total = 0;

        stackDatasets.forEach(ds => {
            const val = ds.data[monthIndex];
            if (val > 0) {
                // Clean label
                let label = ds.label.replace(' (U1)', '').replace(' (U2)', '');
                lines.push(`${label}: ${val.toFixed(2)} €`);
                total += val;
            }
        });

        lines.push('----------------');
        lines.push(`Total: ${total.toFixed(2)} €`);

        return lines;
    };

    comparisonChartInstance.update();
}
