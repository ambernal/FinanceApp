// --- FILE HANDLING (PDF & CSV) ---
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('file-name').innerText = file.name;
    document.getElementById('file-name').classList.remove('hidden');

    // Determine file type and update state
    const isPDF = file.type === 'application/pdf';
    const isCSV = file.name.endsWith('.csv');
    appData.uploadedFileType = isPDF ? 'pdf' : (isCSV ? 'csv' : null);

    // Toggle buttons
    document.getElementById('btn-process-gemini').classList.toggle('hidden', !isPDF);
    document.getElementById('btn-process-csv').classList.toggle('hidden', !isCSV);

    if (isPDF) {
        appData.extractedText = ''; // Clear previous text
        document.getElementById('btn-process-gemini').disabled = true; // Disable until read
        setLoading(true, "Leyendo PDF...");

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + "\n";
            }

            appData.extractedText = fullText;
            document.getElementById('btn-process-gemini').disabled = false;
            showNotification("PDF leído correctamente. Listo para procesar.");
        } catch (error) {
            console.error(error);
            showNotification("Error al leer el PDF.", "error");
            appData.uploadedFileType = null;
        } finally {
            setLoading(false);
        }
    } else if (isCSV) {
        appData.extractedText = ''; // We store CSV content here temporarily
        document.getElementById('btn-process-csv').disabled = true; // Disable until read
        setLoading(true, "Leyendo CSV...");

        try {
            const text = await file.text();
            appData.extractedText = text;
            document.getElementById('btn-process-csv').disabled = false;
            showNotification("CSV leído correctamente. Pulsa 'Cargar datos del CSV'.");
        } catch (error) {
            console.error(error);
            showNotification("Error al leer el CSV.", "error");
            appData.uploadedFileType = null;
        } finally {
            setLoading(false);
        }
    } else {
        showNotification("Tipo de archivo no soportado. Sube PDF o CSV.", "error");
        appData.uploadedFileType = null;
        document.getElementById('file-name').classList.add('hidden');
    }
}

// --- CSV PROCESSING ---
function processCSVData() {
    if (appData.uploadedFileType !== 'csv' || !appData.extractedText) {
        showNotification("No hay datos CSV cargados.", "error");
        return;
    }

    setLoading(true, "Procesando datos CSV...");

    try {
        // Simple CSV parser (assuming standard structure: Date, Concept, Amount, [Optional Category], [Optional Description])
        const lines = appData.extractedText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error("CSV vacío o solo contiene cabecera.");
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const dateIndex = headers.findIndex(h => h.includes('fecha') || h.includes('date'));
        const conceptIndex = headers.findIndex(h => h.includes('concepto') || h.includes('concept') || h.includes('description'));
        const amountIndex = headers.findIndex(h => h.includes('cantidad') || h.includes('amount'));
        const categoryIndex = headers.findIndex(h => h.includes('categoria') || h.includes('category'));
        const descriptionIndex = headers.findIndex(h => h.includes('descripcion') || h.includes('notes'));

        // Basic validation
        if (dateIndex === -1 || conceptIndex === -1 || amountIndex === -1) {
            throw new Error("El CSV debe contener columnas de Fecha, Concepto y Cantidad.");
        }

        let processedTransactions = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split by comma, respecting quoted strings
            if (values.length < Math.max(dateIndex, conceptIndex, amountIndex) + 1) continue;

            const rawAmount = values[amountIndex].replace(/"/g, '').trim().replace(',', '.'); // Clean quotes and handle comma decimal
            const amount = parseFloat(rawAmount);

            if (isNaN(amount) || amount <= 0) continue; // Skip non-numeric or income/zero

            const dateStr = values[dateIndex].replace(/"/g, '').trim();
            let date;

            // Simple date normalization (YYYY-MM-DD format is required)
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                date = dateStr;
            } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                const parts = dateStr.split('/');
                date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            } else {
                // Attempt to parse as a Date object and format if possible
                try {
                    const d = new Date(dateStr);
                    if (!isNaN(d)) {
                        date = d.toISOString().split('T')[0];
                    } else {
                        console.warn(`Date parsing failed for: ${dateStr}`);
                        continue;
                    }
                } catch (e) {
                    console.warn(`Date parsing failed: ${e}`);
                    continue;
                }
            }

            const concept = values[conceptIndex].replace(/"/g, '').trim();
            const category = categoryIndex !== -1 ? values[categoryIndex].replace(/"/g, '').trim() : 'Otros';
            const description = descriptionIndex !== -1 ? values[descriptionIndex].replace(/"/g, '').trim() : '';

            processedTransactions.push({
                id: Date.now() + Math.random(),
                date: date,
                concept: concept,
                amount: amount,
                category: appData.categories.includes(category) ? category : 'Otros', // Validate category against list
                description: description
            });
        }

        renderTransactionTable(processedTransactions);
        showNotification(`Se cargaron ${processedTransactions.length} gastos del CSV. ¡Revísalos!`);

    } catch (error) {
        console.error("CSV Processing Error:", error);
        showNotification("Error al procesar el CSV: " + error.message, "error");
    } finally {
        setLoading(false);
    }
}


// --- GEMINI AI INTEGRATION (PDF ONLY) ---
async function processWithGemini() {
    if (appData.uploadedFileType !== 'pdf') {
        showNotification("Usa el botón 'Cargar datos del CSV' para CSVs.", "warning");
        return;
    }
    if (!appData.apiKey) {
        showNotification("Por favor, configura tu API Key primero en la pestaña Configuración.", "error");
        switchTab('settings');
        return;
    }

    if (!appData.extractedText) {
        showNotification("Primero sube un PDF válido.", "error");
        return;
    }

    setLoading(true, "Gemini está analizando tus gastos...");

    const prompt = `
        Actúa como un experto contable. Analiza el siguiente texto extraído de un extracto bancario.
        Tu tarea es identificar cada transacción de gasto. Ignora ingresos o saldos.
        
        Lista de Categorías permitidas: ${appData.categories.join(', ')}.

        Para cada gasto, extrae:
        - fecha (Formato YYYY-MM-DD)
        - concepto (Nombre del comercio o descripción corta del banco)
        - cantidad (Número positivo decimal. Usa punto para decimales)
        - categoria (Elige la más adecuada de la lista. Si duda, usa 'Otros')

        Devuelve SOLAMENTE un array JSON válido, sin markdown, sin explicaciones.
        Formato: [{"date": "2023-10-25", "concept": "Mercadona", "amount": 55.20, "category": "Supermercado"}, ...]

        TEXTO A ANALIZAR:
        ${appData.extractedText.substring(0, 10000)} 
    `;
    // Note: Truncating text to ~10k chars to stay within reasonable token limits for this demo.

    try {
        // Exponential backoff retry logic (basic implementation)
        let data = null;
        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${appData.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            data = await response.json();

            if (response.ok && !data.error) {
                break; // Success
            } else if (attempt === maxRetries - 1) {
                throw new Error(data.error?.message || 'Error desconocido de la API.');
            }
            // Wait before retrying (e.g., 1s, 2s)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }

        if (data.error) {
            throw new Error(data.error.message);
        }

        const rawText = data.candidates[0].content.parts[0].text;
        // Clean markdown code blocks if present
        const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const transactions = JSON.parse(jsonStr);

        // Add empty description and ID to each
        const enrichedTransactions = transactions.map(t => ({
            ...t,
            id: Date.now() + Math.random(),
            description: t.description || '' // Ensure description exists
        }));

        renderTransactionTable(enrichedTransactions);
        showNotification(`Se han encontrado ${enrichedTransactions.length} gastos.`);

    } catch (error) {
        console.error(error);
        showNotification("Error al conectar con Gemini: " + error.message, "error");
    } finally {
        setLoading(false);
    }
}

async function connectMasterCSV() {
    if (!('showOpenFilePicker' in window)) {
        showNotification("Tu navegador no soporta esta función. Usa Chrome, Edge u Opera.", "error");
        return;
    }

    try {
        const [handle] = await window.showOpenFilePicker({
            types: [{
                description: 'CSV Files',
                accept: { 'text/csv': ['.csv'] },
            }],
            multiple: false
        });

        appData.fileHandle = handle;

        // Read the file immediately to load data
        const file = await handle.getFile();
        const text = await file.text();

        if (text.trim()) {
            // Parse existing CSV data
            processMasterCSV(text);
        }

        updateMasterCSVStatus(file.name);
        showNotification(`Conectado a ${file.name}`);

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error(error);
            showNotification("Error al conectar el archivo.", "error");
        }
    }
}

function processMasterCSV(text) {
    try {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return; // Only header or empty

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        // Basic mapping (similar to processCSVData but assuming our format)
        // Expected: Fecha, Concepto, Cantidad, Categoria, Descripcion

        const transactions = [];
        for (let i = 1; i < lines.length; i++) {
            // Simple split by comma (NOTE: This is fragile for complex CSVs with quoted commas, 
            // but matches our simple generator. For robustness, we should use the regex split used in processCSVData)
            const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

            if (values.length < 5) continue;

            transactions.push({
                id: Date.now() + Math.random(), // Generate new IDs for internal use
                date: values[0].trim(),
                concept: values[1].replace(/"/g, '').trim(),
                amount: parseFloat(values[2]),
                category: values[3].trim(),
                description: values[4].replace(/"/g, '').trim()
            });
        }

        appData.transactions = transactions;
        appData.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        saveToStorage(); // Sync with local storage
        updateDashboard();
        showNotification(`Se han cargado ${transactions.length} gastos del Master CSV.`);

    } catch (e) {
        console.error("Error parsing Master CSV", e);
        showNotification("El archivo no tiene el formato correcto.", "warning");
    }
}

async function saveTransactions() {
    if (tempTransactions.length === 0) {
        showNotification("No hay transacciones nuevas para guardar.", "warning");
        return;
    }

    // 1. Update Internal State
    appData.transactions = [...appData.transactions, ...tempTransactions];
    appData.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveToStorage();

    // 2. Write to Master CSV (if connected)
    if (appData.fileHandle) {
        try {
            setLoading(true, "Guardando en Master CSV...");

            // Create CSV Content from ALL transactions (Rewrite strategy)
            const headers = ["Fecha", "Concepto", "Cantidad", "Categoria", "Descripcion"];
            const rows = appData.transactions.map(t => [
                t.date,
                `"${String(t.concept).replace(/"/g, '""')}"`,
                t.amount,
                t.category,
                `"${String(t.description || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");

            // Create a writable stream
            const writable = await appData.fileHandle.createWritable();
            await writable.write(csvContent);
            await writable.close();

            showNotification("¡Guardado en Master CSV y Dashboard!", "success");

        } catch (error) {
            console.error("Error writing to Master CSV:", error);
            showNotification("Error al guardar en el archivo físico. Se guardó solo en navegador.", "warning");
        } finally {
            setLoading(false);
        }
    } else {
        showNotification("Gastos guardados en el navegador (No Master CSV).");
    }

    // 3. Reset UI
    tempTransactions = [];
    document.getElementById('transaction-table-body').innerHTML = '<tr id="empty-state"><td colspan="6" class="p-10 text-center text-green-600 font-medium">¡Gastos guardados correctamente!</td></tr>';

    setTimeout(() => switchTab('dashboard'), 1000);
}
