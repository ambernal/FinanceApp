// --- INICIALIZACIÓN ---
window.onload = function () {
    loadFromStorage();
    renderCategories();
    renderUserSwitcher(); // Initialize user switcher UI
    updateDashboard();
    populateTrendCategorySelector(); // Initialize the trends selector

    // Set initial tab to dashboard
    switchTab('dashboard');

    // Check API Key
    if (!appData.apiKey) {
        const warningBanner = document.getElementById('api-key-warning');
        if (warningBanner) warningBanner.classList.remove('hidden');
        document.getElementById('nav-settings').classList.add('text-red-500', 'font-bold');
    }
};
