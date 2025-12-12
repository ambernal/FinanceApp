// --- UI LOGIC ---

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Update nav styles
    ['dashboard', 'trends', 'import', 'settings'].forEach(id => {
        const btn = document.getElementById('nav-' + id);
        if (id === tabId) {
            btn.classList.add('text-white', 'underline', 'decoration-2', 'underline-offset-4');
            btn.classList.remove('hover:text-blue-200');
        } else {
            btn.classList.remove('text-white', 'underline', 'decoration-2', 'underline-offset-4');
            btn.classList.add('hover:text-blue-200');
        }
    });

    if (tabId === 'dashboard') updateDashboard();
    if (tabId === 'trends') renderTrendsChart(); // Render trends when entering the tab
}

// --- CATEGORÍAS ---
function renderCategories() {
    const list = document.getElementById('category-list');
    list.innerHTML = '';
    appData.categories.forEach((cat, index) => {
        const li = document.createElement('li');
        li.className = "bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs flex items-center gap-2";
        li.innerHTML = `
            <span>${cat}</span>
            <button onclick="removeCategory(${index})" class="text-blue-400 hover:text-red-500 font-bold">×</button>
        `;
        list.appendChild(li);
    });
    // Update trends selector when categories change
    populateTrendCategorySelector();
}

function addCategory() {
    const input = document.getElementById('new-category');
    const val = input.value.trim();
    if (val && !appData.categories.includes(val)) {
        appData.categories.push(val);
        saveToStorage();
        renderCategories();
        input.value = '';
    }
}

function removeCategory(index) {
    appData.categories.splice(index, 1);
    saveToStorage();
    renderCategories();
}

// --- DASHBOARD & CHARTS ---
function updateDashboard() {
    const transactions = appData.transactions;
    const btnGlobal = document.getElementById('btn-global');
    const btnMonthly = document.getElementById('btn-monthly');
    const monthSelector = document.getElementById('month-selector');
    const monthlySection = document.getElementById('monthly-detail-section');

    // Toggle UI State
    if (currentChartMode === 'global') {
        btnGlobal.className = "px-4 py-1 rounded-md text-sm font-medium transition bg-blue-100 text-blue-700";
        btnMonthly.className = "px-4 py-1 rounded-md text-sm font-medium transition text-slate-500 hover:bg-slate-50";
        monthSelector.classList.add('hidden');
        monthlySection.classList.add('hidden');
    } else {
        btnMonthly.className = "px-4 py-1 rounded-md text-sm font-medium transition bg-blue-100 text-blue-700";
        btnGlobal.className = "px-4 py-1 rounded-md text-sm font-medium transition text-slate-500 hover:bg-slate-50";
        monthSelector.classList.remove('hidden');
        monthlySection.classList.remove('hidden');
    }

    // Filter Data
    let filteredData = transactions;

    if (currentChartMode === 'monthly') {
        populateMonthSelector();
        const selectedMonth = monthSelector.value;
        if (selectedMonth) {
            filteredData = transactions.filter(t => t.date.startsWith(selectedMonth));
            document.getElementById('monthly-detail-month-name').innerText = selectedMonth;
            renderMonthlyDetailTable(filteredData);
        } else {
            document.getElementById('monthly-detail-section').classList.add('hidden');
        }
    }

    // Calculate Stats
    const total = filteredData.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // Group by Category
    const catTotals = {};
    filteredData.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + parseFloat(t.amount);
    });

    // Find Top Category
    let topCat = '-';
    let topAmt = 0;
    for (const [cat, amt] of Object.entries(catTotals)) {
        if (amt > topAmt) {
            topAmt = amt;
            topCat = cat;
        }
    }

    // Update DOM
    document.getElementById('total-expense').innerText = total.toFixed(2) + ' €';
    document.getElementById('top-category').innerText = topCat;

    // Update Date Range Header
    const rangeEl = document.getElementById('dashboard-date-range');
    if (currentChartMode === 'monthly') {
        const selectedMonth = monthSelector.value;
        if (selectedMonth) {
            // Format YYYY-MM to readable (e.g., "Enero 2023")
            const [year, month] = selectedMonth.split('-');
            const dateObj = new Date(year, month - 1);
            const monthName = dateObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
            rangeEl.innerText = `(${monthName.charAt(0).toUpperCase() + monthName.slice(1)})`;
        } else {
            rangeEl.innerText = '';
        }
    } else {
        // Global Mode: Find min and max date
        if (transactions.length > 0) {
            const dates = transactions.map(t => t.date).sort();
            const minDate = new Date(dates[0]);
            const maxDate = new Date(dates[dates.length - 1]);

            const minStr = minDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
            const maxStr = maxDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

            if (minStr === maxStr) {
                rangeEl.innerText = `(${minStr.charAt(0).toUpperCase() + minStr.slice(1)})`;
            } else {
                rangeEl.innerText = `(${minStr.charAt(0).toUpperCase() + minStr.slice(1)} - ${maxStr.charAt(0).toUpperCase() + maxStr.slice(1)})`;
            }
        } else {
            rangeEl.innerText = '';
        }
    }

    // Update Top Expenses List
    const sortedExpenses = [...filteredData].sort((a, b) => b.amount - a.amount).slice(0, 10);
    const listContainer = document.getElementById('top-expenses-list');
    listContainer.innerHTML = '';

    if (sortedExpenses.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-slate-400 text-sm mt-4">Sin datos</p>';
    } else {
        sortedExpenses.forEach(t => {
            const el = document.createElement('div');
            el.className = "flex justify-between items-center py-2 border-b border-slate-50 last:border-0";
            el.innerHTML = `
                <div>
                    <p class="text-sm font-medium text-slate-700">${t.concept}</p>
                    <p class="text-xs text-slate-400">${t.date} • ${t.category}</p>
                </div>
                <span class="font-bold text-slate-700 text-sm">${t.amount.toFixed(2)} €</span>
            `;
            listContainer.appendChild(el);
        });
    }

    // Update Chart
    renderDashboardChart(catTotals);
}

// New function for rendering the monthly detail table
function renderMonthlyDetailTable(transactions) {
    const tbody = document.getElementById('monthly-detail-body');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400">No hay movimientos en este mes.</td></tr>';
        return;
    }

    // Sort by date
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition";

        const catOptions = appData.categories.map(c =>
            `<option value="${c}" ${c === t.category ? 'selected' : ''}>${c}</option>`
        ).join('');

        tr.innerHTML = `
            <td class="p-3 text-slate-500 whitespace-nowrap">${t.date}</td>
            <td class="p-3 font-medium text-slate-700">${t.concept}</td>
            <td class="p-3 font-mono text-slate-700 font-bold text-right">${parseFloat(t.amount).toFixed(2)} €</td>
            <td class="p-3">
                <select onchange="updateMainTransaction('${t.id}', 'category', this.value)" class="bg-white border border-slate-200 rounded text-xs py-1 px-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full max-w-[150px]">
                    ${catOptions}
                </select>
            </td>
            <td class="p-3">
                <input type="text" value="${t.description || ''}" onchange="updateMainTransaction('${t.id}', 'description', this.value)" placeholder="Añadir nota..." class="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 text-sm text-slate-600 focus:text-slate-800 transition outline-none">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// New function to update transactions directly from dashboard
function updateMainTransaction(id, field, value) {
    const index = appData.transactions.findIndex(t => t.id == id);

    if (index !== -1) {
        appData.transactions[index][field] = value;
        saveToStorage();

        // If category changed, refresh stats/charts
        if (field === 'category') {
            updateDashboard();
            renderTrendsChart(); // Also update trends if category changes
        } else {
            showNotification("Descripción guardada", "success");
        }
    }
}

function populateMonthSelector() {
    const selector = document.getElementById('month-selector');
    const currentVal = selector.value;

    // Get unique YYYY-MM
    const months = [...new Set(appData.transactions.map(t => t.date.substring(0, 7)))].sort().reverse();

    if (months.length === 0) {
        selector.innerHTML = '<option value="">Sin datos</option>';
        return;
    }

    selector.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');

    // Restore selection if exists, else first
    if (currentVal && months.includes(currentVal)) {
        selector.value = currentVal;
    } else {
        selector.value = months[0];
    }

    selector.onchange = () => updateDashboard();
}

function setChartMode(mode) {
    currentChartMode = mode;
    updateDashboard();
}

function populateTrendCategorySelector() {
    const selector = document.getElementById('trend-category-selector');
    const currentVal = selector.value;

    // Add 'all' option first
    let optionsHTML = '<option value="all">Todos los Sectores</option>';

    // Add all existing categories
    optionsHTML += appData.categories.map(c =>
        `<option value="${c}">${c}</option>`
    ).join('');

    selector.innerHTML = optionsHTML;

    // Restore selection if it still exists
    if (currentVal && (currentVal === 'all' || appData.categories.includes(currentVal))) {
        selector.value = currentVal;
    } else {
        selector.value = 'all';
    }
}

function showMonthlyDetailFromTrends(month) {
    // 1. Set mode to monthly
    currentChartMode = 'monthly';

    // 2. Switch to dashboard tab
    switchTab('dashboard');

    // 3. Set the selector value
    const monthSelector = document.getElementById('month-selector');

    // Check if month is a valid option before setting
    if (Array.from(monthSelector.options).some(opt => opt.value === month)) {
        monthSelector.value = month;
    }

    // 4. Update the dashboard view (which triggers table update)
    updateDashboard();

    // 5. Show notification for good UX
    showNotification(`Mostrando detalle de gastos para ${month} en la sección de Dashboard.`, 'success');
}

// --- TABLA DE TRANSACCIONES (EDICIÓN) ---

function renderTransactionTable(transactions) {
    tempTransactions = transactions;
    const tbody = document.getElementById('transaction-table-body');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">No se encontraron gastos.</td></tr>';
        return;
    }

    transactions.forEach((t, index) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 group transition";

        // Select options for categories
        const catOptions = appData.categories.map(c =>
            `<option value="${c}" ${c === t.category ? 'selected' : ''}>${c}</option>`
        ).join('');

        tr.innerHTML = `
            <td class="p-2"><input type="date" value="${t.date}" onchange="updateTemp(${index}, 'date', this.value)" class="w-full bg-transparent border-none text-sm text-slate-600 focus:ring-0"></td>
            <td class="p-2"><input type="text" title="${t.concept}" value="${t.concept}" onchange="updateTemp(${index}, 'concept', this.value)" class="w-full bg-transparent border-none text-sm font-medium text-slate-800 focus:ring-0"></td>
            <td class="p-2"><input type="number" step="0.01" value="${t.amount}" onchange="updateTemp(${index}, 'amount', parseFloat(this.value))" class="w-full bg-transparent border-none text-sm text-right font-mono text-slate-700 focus:ring-0"></td>
            <td class="p-2">
                <select onchange="updateTemp(${index}, 'category', this.value)" class="w-full bg-white border border-slate-200 rounded text-xs py-1 px-2 focus:border-blue-500">
                    ${catOptions}
                </select>
            </td>
            <td class="p-2"><input type="text" placeholder="Añadir nota..." value="${t.description || ''}" onchange="updateTemp(${index}, 'description', this.value)" class="w-full bg-transparent border-b border-transparent focus:border-blue-300 text-sm text-slate-500 italic focus:not-italic focus:ring-0 placeholder-slate-300"></td>
            <td class="p-2 text-center">
                <button onclick="removeTempRow(${index})" class="text-slate-300 hover:text-red-500 transition">×</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function addNewTransactionRow() {
    const newT = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        concept: 'Nuevo Gasto',
        amount: 0,
        category: appData.categories[0],
        description: ''
    };
    tempTransactions.push(newT);
    renderTransactionTable(tempTransactions);
}

function updateTemp(index, field, value) {
    tempTransactions[index][field] = value;
}

function removeTempRow(index) {
    tempTransactions.splice(index, 1);
    renderTransactionTable(tempTransactions);
}

function updateMasterCSVStatus(fileName) {
    const el = document.getElementById('master-csv-status');
    const btn = document.getElementById('btn-connect-csv');
    if (fileName) {
        el.innerHTML = `Conectado: <span class="text-green-600 font-bold">${fileName}</span>`;
        btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        btn.classList.add('bg-green-600', 'hover:bg-green-700');
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Archivo Conectado
        `;
    } else {
        el.innerText = "Estado: No conectado";
    }
}
