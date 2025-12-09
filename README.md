# 💰 FinanceAPP: Control de Gastos Inteligente

## 🎯 Descripción General
FinanceAPP es una aplicación web de una sola página diseñada para la gestión y análisis de gastos personales. Su característica principal es la capacidad de procesar extractos bancarios en formato PDF utilizando la Inteligencia Artificial de Google Gemini para identificar, clasificar y estructurar automáticamente los movimientos como gastos.

La aplicación opera completamente en el navegador (Single File Web App) y utiliza el almacenamiento local (localStorage) para la persistencia de datos y la clave API.

## ✨ Características Principales

### Importación de Datos
*   **Importación Inteligente de PDF**: Utiliza PDF.js para extraer texto de extractos bancarios en PDF.
*   **Clasificación con Gemini AI**: Envía el texto extraído a la API de Gemini para obtener un array JSON estructurado y clasificado, eligiendo la mejor categoría de tu lista personalizada.
*   **Importación de CSV**: Permite cargar datos de gastos desde un archivo CSV.

### Gestión de Gastos
*   **Categorías Personalizadas**: El usuario puede crear, editar y eliminar las categorías que utiliza Gemini para clasificar.
*   **Edición en Lote**: Vista tabular para revisar y ajustar la fecha, concepto, cantidad y categoría de los gastos importados antes de guardarlos.
*   **Edición Detallada**: El usuario puede editar la categoría y la descripción de los gastos directamente en la tabla de detalle mensual del Dashboard.

### Análisis y Reporting
*   **Dashboard Interactivo**: Muestra el gasto total, la categoría principal, y un gráfico de distribución de gastos (Doughnut Chart) en modo Global o Mensual.
*   **Análisis de Tendencias**: Gráfico de línea que muestra la evolución de los gastos a lo largo de los meses.
*   **Interacción del Gráfico de Tendencias**: Al hacer clic en un punto de la línea de tendencia mensual, el usuario es redirigido al Dashboard para ver la tabla de detalle de gastos de ese mes.

### Datos y Persistencia
*   **Almacenamiento Local**: Todos los datos de transacciones, categorías y la clave API se guardan en el localStorage del navegador.
*   **Master CSV (Persistencia Local)**: Conexión directa a un archivo CSV local (`gastos_master.csv`) mediante la File System Access API. Permite guardar los gastos permanentemente en tu disco duro, sincronizando los datos entre sesiones.
*   **Exportación de CSV**: Permite descargar el historial completo de gastos en un archivo CSV.

## 🛠️ Estructura de la Aplicación (Pestañas)
La aplicación está organizada en cuatro pestañas principales:

1.  **Dashboard (Resumen Financiero)**
    *   Muestra métricas clave del gasto (Total, Categoría Principal).
    *   Gráfico de distribución por categorías.
    *   Lista de los Top 10 gastos.
    *   Modos de Vista:
        *   Global: Muestra estadísticas de todos los tiempos.
        *   Mensual: Permite seleccionar un mes y ver solo los datos de ese periodo, incluyendo una tabla editable de detalle de movimientos.

2.  **Análisis de Tendencias**
    *   Gráfico de líneas que muestra la evolución del gasto total o de una categoría específica mes a mes.
    *   Funcionalidad Interactiva: Permite hacer clic en los puntos de la línea para ver el detalle de los movimientos de ese mes en el Dashboard.

3.  **Importar / Gastos**
    *   Sección de Input: Permite subir archivos PDF o CSV.
    *   Gestión de Categorías: Permite al usuario definir y editar su lista de sectores.
    *   Tabla de Transacciones Temporales: Muestra los gastos extraídos (por la IA o CSV) para su revisión y edición antes de ser guardados en la base de datos de la aplicación.
    *   Añadir Gasto Manual: Botón para ingresar transacciones una por una.

4.  **Configuración**
    *   Permite al usuario introducir y guardar su Google Gemini API Key.
*   **Conexión Master CSV**: Botón para seleccionar y conectar un archivo CSV local para la persistencia de datos.
*   Incluye una opción para borrar todos los datos de la aplicación guardados en el navegador.

## ⚙️ Tecnologías y Dependencias
La aplicación se implementa en un único archivo HTML y utiliza las siguientes librerías:

*   **Estructura y Lógica**: HTML5, JavaScript Vainilla.
*   **Estilos**: Tailwind CSS (vía CDN) para un diseño limpio y responsivo.
*   **Gráficos**: Chart.js (vía CDN) para la visualización de datos (Doughnut y Line Chart).
*   **Procesamiento de PDF**: PDF.js (vía CDN) para la lectura de archivos PDF en el navegador.
*   **Inteligencia Artificial**: Google Gemini API (gemini-2.5-flash-preview-09-2025) para la extracción y clasificación de datos de texto.

## ⚠️ Configuración Necesaria
Para utilizar la funcionalidad de análisis de PDF, el usuario debe proporcionar una clave válida de la API de Google Gemini en la pestaña de Configuración. Sin esta clave, solo se podrá utilizar la importación de CSV o la entrada manual.
