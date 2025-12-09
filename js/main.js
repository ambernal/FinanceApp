// --- INICIALIZACIÓN ---
window.onload = function () {
    loadFromStorage();
    renderCategories();
    updateDashboard();
    populateTrendCategorySelector(); // Initialize the trends selector

    // Set initial tab to dashboard
    switchTab('dashboard');

    // Check API Key
    if (!appData.apiKey) {
        showNotification('Por favor, configura tu Gemini API Key en Configuración', 'warning');
        document.getElementById('nav-settings').classList.add('text-red-500', 'font-bold');
    }
};
