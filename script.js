// script.js

// Define an array of key-value pairs for the APIs
const apiUrls = [
    { key: 'Oficial', value: 'https://mercados.ambito.com/dolar/oficial/variacion' },
    { key: 'Nacion', value: 'https://mercados.ambito.com/dolarnacion/variacion' },
    { key: 'Blue', value: 'https://mercados.ambito.com/dolar/informal/variacion' },
    { key: 'MEP', value: 'https://mercados.ambito.com/dolarrava/mep/variacion' },
    { key: 'CCL', value: 'https://mercados.ambito.com/dolarrava/cl/variacion' },
    { key: 'Cripto', value: 'https://mercados.ambito.com/dolarcripto/variacion' },
    { key: 'Tarjeta', value: 'https://mercados.ambito.com/dolarturista/variacion' },
    { key: 'Qatar', value: 'https://mercados.ambito.com/dolarqatar/variacion' },
    { key: 'Lujo', value: 'https://mercados.ambito.com/dolardelujo/variacion' },
    { key: 'Euro Oficial', value: 'https://mercados.ambito.com/euro/variacion' },
    { key: 'Euro Blue', value: 'https://mercados.ambito.com/euro/informal/variacion' },
];

const FETCH_TIMEOUT_MS = 10000;
const TABLE_HEADERS_COUNT = 5;
let refreshInProgress = false;

function setStatusMessage(message, isError = false) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = isError ? 'status-message error' : 'status-message';
}

function createCell(row, text, className = '') {
    const cell = row.insertCell();
    cell.textContent = text;
    if (className) {
        cell.className = className;
    }

    return cell;
}

function renderErrorRow(apiKey, errorMessage) {
    const tableBody = document.getElementById('table-body');
    const row = tableBody.insertRow();
    row.className = 'row-error';

    createCell(row, apiKey);

    const errorCell = createCell(row, errorMessage, 'error-cell');
    errorCell.colSpan = TABLE_HEADERS_COUNT - 1;
}

function getValidatedRateData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid response format');
    }

    const fields = ['compra', 'venta', 'fecha', 'variacion'];
    const normalizedData = {};

    for (const field of fields) {
        if (typeof data[field] !== 'string') {
            throw new Error(`Missing or invalid field: ${field}`);
        }

        normalizedData[field] = data[field].trim();
    }

    if (!normalizedData.venta || !normalizedData.fecha || !normalizedData.variacion) {
        throw new Error('Response contains empty required values');
    }

    return normalizedData;
}

async function fetchRateData(apiInfo) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(apiInfo.value, {
            cache: 'no-store',
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Unexpected content type');
        }

        const data = await response.json();
        return getValidatedRateData(data);
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Function to fetch data from an API and populate the table
async function fetchDataAndPopulateTable(apiInfo) {
    try {
        const { compra, venta, fecha, variacion } = await fetchRateData(apiInfo);

        const tableBody = document.getElementById('table-body');
        const row = tableBody.insertRow();
        const cell1 = createCell(row, apiInfo.key);
        const cell2 = createCell(row, (apiInfo.key == 'Tarjeta') ? '---' : compra);
        const cell3 = createCell(row, venta);
        const cell4 = createCell(row, fecha);
        const cell5 = createCell(row, variacion);

        cell5.style.color = variacion.startsWith('-') ? 'red' : 'lightgreen';
        return true;
    } catch (error) {
        console.error(`Error fetching data from API ${apiInfo.key}: ${error.message}`);
        renderErrorRow(apiInfo.key, 'Error retrieving data');
        return false;
    }
}

// Function to fetch data from all APIs and populate the table in a specific order
async function fetchDataAndPopulateAll() {
    if (refreshInProgress) {
        return;
    }

    refreshInProgress = true;

    // Define the specific order in which you want to display the APIs
    // const desiredOrder = ['Oficial', 'Blue', 'MEP', 'CCL', 'Cripto', 'Tarjeta', 'Qatar', 'Lujo'];
    const desiredOrder = ['Oficial', 'Nacion', 'Blue', 'MEP', 'CCL', 'Cripto', 'Tarjeta', 'Euro Oficial', 'Euro Blue'];

    try {
        setStatusMessage('Updating exchange rates...');

        // Clear existing table rows
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';

        let successfulRequests = 0;

        // Fetch data from each API in the desired order and populate the table
        for (const apiKey of desiredOrder) {
            const apiInfo = apiUrls.find(api => api.key === apiKey);
            if (apiInfo) {
                const didSucceed = await fetchDataAndPopulateTable(apiInfo);
                if (didSucceed) {
                    successfulRequests += 1;
                }
            }
        }

        if (successfulRequests === desiredOrder.length) {
            setStatusMessage('');
        } else if (successfulRequests === 0) {
            setStatusMessage('No exchange rates could be updated at this time.', true);
        } else {
            setStatusMessage('Some exchange rates could not be updated.', true);
        }
    } finally {
        refreshInProgress = false;
    }
}

// Call the fetchDataAndPopulateAll function when the page loads
document.addEventListener('DOMContentLoaded', fetchDataAndPopulateAll);

// Refresh the data every 15 minutes (900000 milliseconds)
setInterval(fetchDataAndPopulateAll, 900000);
