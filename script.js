// Function to fetch data from the API
function fetchDataAndPopulateTable() {
    const loadingMessage = document.getElementById('loading-message');
    loadingMessage.style.display = 'block';

    fetch('https://mercados.ambito.com/mercados/monedas')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const additionalDataPromise = fetch('https://mercados.ambito.com/dolar/oficial/variacion')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            });

        return Promise.all([Promise.resolve(data), additionalDataPromise]);
    })
    .then(([data, additionalData]) => {
        populateTable(data, additionalData);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'An error occurred while fetching data. Please try again later.';
    })
    .finally(() => {
        loadingMessage.style.display = 'none';
    });
}

// Function to populate the table with data
function populateTable(data, additionalData) {
    const table = document.getElementById('data-table');
    table.innerHTML = '';

    const headerRow = table.insertRow();
    const headers = ['Tipo', 'Valor Compra', 'Valor Venta', 'Fecha', 'Variación'];

    headers.forEach(headerText => {
        const headerCell = headerRow.insertCell();
        headerCell.textContent = headerText;
        headerCell.className = 'header'; // Apply the header class
    });

    const addRow = (rowData) => {
        const row = table.insertRow(1);
        rowData.forEach(item => {
            const cell = row.insertCell();
            cell.textContent = item.value;
            if (item.className) {
                cell.classList.add(item.className);
            }
        });
    };

    // Populate the table with data
    data.forEach(item => {
        addRow([
            { value: item.nombre },
            { value: item.compra },
            { value: item.venta },
            { value: item.fecha },
            { value: item.variacion, className: getVariationClass(item.variacion) }
        ]);
    });

    // Add row for additional data
    addRow([
        { value: 'Dólar Oficial' },
        { value: additionalData.compra },
        { value: additionalData.venta },
        { value: additionalData.fecha },
        { value: additionalData.variacion, className: getVariationClass(additionalData.variacion) }
    ]);
}

// Determine variation class based on value
function getVariationClass(variation) {
    if (variation.startsWith('-')) {
        return 'negative';
    } else if (!isNaN(parseFloat(variation))) {
        return 'positive';
    }
    return '';
}

// Fetch data on page load
window.onload = function() {
    fetchDataAndPopulateTable();
    setInterval(fetchDataAndPopulateTable, 60000 * 15); // 60000 milliseconds = 1 minute
};
