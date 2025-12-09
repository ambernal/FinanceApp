// --- GESTIÓN DE DATOS (LOCALSTORAGE) ---
function saveToStorage() {
    localStorage.setItem('financeApp_data', JSON.stringify(appData));
}

function loadFromStorage() {
    const stored = localStorage.getItem('financeApp_data');
    if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure the loaded categories include the new defaults if they didn't exist before
        const defaultCategories = ['Comida', 'Ocio', 'Deporte', 'Supermercado', 'Hijos', 'Ropa', 'Transporte', 'Seguros', 'Gas', 'Luz', 'Agua', 'Casa', 'Suscripciones', 'Salud', 'ING', 'Ahorro', 'Otros'];

        let combinedCategories = defaultCategories;
        if (parsed.categories) {
            // Filter out duplicates and combine
            const existingCategories = new Set(parsed.categories);
            defaultCategories.forEach(cat => existingCategories.add(cat));
            combinedCategories = Array.from(existingCategories);
        }

        // Merge appData, ensuring categories are handled correctly
        appData = { ...appData, ...parsed, categories: combinedCategories };
        document.getElementById('api-key').value = appData.apiKey;
    }
}

function clearAllData() {
    if (confirm("¿Seguro que quieres borrar todos los datos?")) {
        localStorage.removeItem('financeApp_data');
        location.reload();
    }
}

function saveSettings() {
    const key = document.getElementById('api-key').value.trim();
    if (key) {
        appData.apiKey = key;
        saveToStorage();
        showNotification('API Key guardada correctamente');
        document.getElementById('nav-settings').classList.remove('text-red-500', 'font-bold');
    } else {
        showNotification('La API Key no puede estar vacía', 'error');
    }
}

// --- EXPORTAR CSV ---
function downloadCSV() {
    if (appData.transactions.length === 0) {
        showNotification("No hay datos para exportar", "error");
        return;
    }

    const headers = ["Fecha", "Concepto", "Cantidad", "Categoria", "Descripcion"];
    const rows = appData.transactions.map(t => [
        t.date,
        `"${String(t.concept).replace(/"/g, '""')}"`, // Escape quotes
        t.amount,
        t.category,
        `"${String(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "finance_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- UI UTILS ---
function setLoading(isLoading, text) {
    const el = document.getElementById('loading');
    const txt = document.getElementById('loading-text');
    if (isLoading) {
        txt.innerText = text;
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

function showNotification(msg, type = 'success') {
    const el = document.getElementById('notification');
    el.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-300 text-white ${type === 'error' ? 'bg-red-500' : (type === 'warning' ? 'bg-orange-500' : 'bg-green-600')}`;
    el.classList.remove('hidden');
    el.innerText = msg;

    setTimeout(() => {
        el.classList.add('opacity-0');
        setTimeout(() => {
            el.classList.add('hidden');
            el.classList.remove('opacity-0');
        }, 300);
    }, 3000);
}

function getColors() {
    // Tailwind colors (approx)
    return [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6',
        '#f43f5e', '#a855f7', '#22c55e', '#eab308', '#f97316', '#00008b', '#ffd700' // Added two more colors for the new categories
    ];
}
