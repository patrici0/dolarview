// script.js

// Upstream data sources keyed by the row label shown in the table.
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

// Keep requests responsive and avoid overlapping refresh cycles.
const FETCH_TIMEOUT_MS = 10000;
const TABLE_HEADERS_COUNT = 5;
let refreshInProgress = false;

// Update the accessible status area without mixing status text into the table itself.
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

// Keep failed endpoints visible so missing rows are clearly treated as errors.
function renderErrorRow(apiKey, errorMessage) {
    const tableBody = document.getElementById('table-body');
    const row = tableBody.insertRow();
    row.className = 'row-error';

    createCell(row, apiKey);

    const errorCell = createCell(row, errorMessage, 'error-cell');
    errorCell.colSpan = TABLE_HEADERS_COUNT - 1;
}

// The API returns percentages as strings, so normalize them before choosing a color.
function getVariationColor(variacion) {
    const normalizedVariation = variacion.replace('%', '').replace(',', '.').trim();
    const numericVariation = Number(normalizedVariation);

    if (!Number.isNaN(numericVariation)) {
        if (numericVariation < 0) {
            return 'red';
        }

        if (numericVariation === 0) {
            return 'lightblue';
        }
    }

    return 'lightgreen';
}

// Render a successful result only after it has passed validation.
function renderRateRow(apiInfo, rateData) {
    const { compra, venta, fecha, variacion } = rateData;
    const tableBody = document.getElementById('table-body');
    const row = tableBody.insertRow();
    createCell(row, apiInfo.key);
    createCell(row, apiInfo.key === 'Tarjeta' ? '---' : compra);
    createCell(row, venta);
    createCell(row, fecha);

    const variationCell = createCell(row, variacion);
    variationCell.style.color = getVariationColor(variacion);
}

// Treat upstream API responses as untrusted and accept only the fields we need.
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
    // Abort slow requests so a single stalled endpoint does not block the whole refresh.
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

// Normalize success and failure into one object shape so rendering can happen later.
async function fetchRateResult(apiInfo) {
    try {
        const rateData = await fetchRateData(apiInfo);
        return { apiInfo, rateData, errorMessage: null };
    } catch (error) {
        console.error(`Error fetching data from API ${apiInfo.key}: ${error.message}`);
        return { apiInfo, rateData: null, errorMessage: 'Error retrieving data' };
    }
}

// Fetch all rows in parallel, then render once in the intended display order.
async function fetchDataAndPopulateAll() {
    // Ignore timer ticks while a previous refresh is still running.
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

        const orderedApiInfos = desiredOrder
            .map(apiKey => apiUrls.find(api => api.key === apiKey))
            .filter(Boolean);

        // Promise.all preserves input order, so rendering still matches desiredOrder.
        const results = await Promise.all(
            orderedApiInfos.map(apiInfo => fetchRateResult(apiInfo))
        );

        let successfulRequests = 0;

        // Populate the table only after every API call has finished.
        for (const result of results) {
            if (result.rateData) {
                renderRateRow(result.apiInfo, result.rateData);
                successfulRequests += 1;
            } else {
                renderErrorRow(result.apiInfo.key, result.errorMessage);
            }
        }

        if (successfulRequests === orderedApiInfos.length) {
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

// Load data once when the page opens.
document.addEventListener('DOMContentLoaded', fetchDataAndPopulateAll);

// Refresh the data every 15 minutes (900000 milliseconds).
setInterval(fetchDataAndPopulateAll, 900000);
