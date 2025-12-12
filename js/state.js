// --- ESTADO DE LA APP ---
let appData = {
    currentUser: 'user1', // 'user1' or 'user2'
    users: {
        user1: { transactions: [], fileHandle: null, masterCSVData: [] },
        user2: { transactions: [], fileHandle: null, masterCSVData: [] }
    },
    // Active Working Set (synced with users[currentUser])
    transactions: [],
    fileHandle: null,
    masterCSVData: [],

    // Global Settings
    categories: ['Comida', 'Ocio', 'Deporte', 'Supermercado', 'Hijos', 'Ropa', 'Transporte', 'Seguros', 'Gas', 'Luz', 'Agua', 'Casa', 'Suscripciones', 'Salud', 'ING', 'Ahorro', 'Otros'],
    apiKey: '',

    // Transient
    extractedText: '',
    uploadedFileType: null, // 'pdf' or 'csv'

    // Comparison State
    comparisonFilter: {
        categories: [] // Selected categories for comparison
    }
};

let dashboardChartInstance = null;
let trendsChartInstance = null; // New chart instance for trends
let currentChartMode = 'global'; // 'global' or 'monthly'
let tempTransactions = []; // Moved from logic to state for global access
