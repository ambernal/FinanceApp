// --- ESTADO DE LA APP ---
let appData = {
    transactions: [], // { id, date, concept, amount, category, description }
    // ADDED ING AND Ahorro HERE
    categories: ['Comida', 'Ocio', 'Deporte', 'Supermercado', 'Hijos', 'Ropa', 'Transporte', 'Seguros', 'Gas', 'Luz', 'Agua', 'Casa', 'Suscripciones', 'Salud', 'ING', 'Ahorro', 'Otros'],
    apiKey: '',
    extractedText: '',
    uploadedFileType: null, // 'pdf' or 'csv'
    fileHandle: null, // File System Access API handle
    masterCSVData: [] // Cache of master CSV content
};

let dashboardChartInstance = null;
let trendsChartInstance = null; // New chart instance for trends
let currentChartMode = 'global'; // 'global' or 'monthly'
let tempTransactions = []; // Moved from logic to state for global access
